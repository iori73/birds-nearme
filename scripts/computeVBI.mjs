// Pre-compute Voice Beauty Index for the 5 species via xeno-canto + ffmpeg.
// Run: node scripts/computeVBI.mjs
// Writes data/vbi_5species.json
//
// Uses the same FFT/HNR/centroid/flatness logic as src/audioAnalysis.js
// so server-side and browser-side numbers match.

import { spawn } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";

async function readEnvKey() {
  try {
    const env = await readFile(".env", "utf8");
    const m = env.match(/VITE_XC_KEY\s*=\s*(\S+)/);
    return m?.[1];
  } catch { return null; }
}

const KEY = process.env.VITE_XC_KEY || (await readEnvKey());
if (!KEY) { console.error("VITE_XC_KEY not set"); process.exit(1); }

const SPECIES = [
  { jp: "オナガ",   query: "Cyanopica cyanus" },
  { jp: "カラス",   query: "Corvus macrorhynchos" },
  { jp: "スズメ",   query: "Passer montanus" },
  { jp: "ドバト",   query: "Columba livia" },
  { jp: "ムクドリ", query: "Spodiopsar cineraceus" },
];

async function pickRecording(query) {
  const [genus, ...rest] = query.split(" ");
  const sp = rest.join(" ");
  const q = `gen:${genus} sp:${sp} q:A len:5-30`;
  const url = `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(q)}&key=${encodeURIComponent(KEY)}`;
  const res = await fetch(url, { headers: { "user-agent": "curl/8.4.0", accept: "*/*" } });
  const data = await res.json();
  let recs = data.recordings || [];
  if (!recs.length) {
    const url2 = url.replace("len:5-30", "");
    const r2 = await fetch(url2, { headers: { "user-agent": "curl/8.4.0", accept: "*/*" } });
    recs = (await r2.json()).recordings || [];
  }
  // Prefer Japan, then shortest
  recs.sort((a, b) => {
    const aJp = a.cnt === "Japan" ? 0 : 1;
    const bJp = b.cnt === "Japan" ? 0 : 1;
    if (aJp !== bJp) return aJp - bJp;
    const toSec = (s) => (s || "0:00").split(":").reduce((acc, v) => acc * 60 + parseFloat(v), 0);
    return toSec(a.length) - toSec(b.length);
  });
  return recs[0];
}

function decodeViaFfmpeg(mp3Url) {
  return new Promise((resolve, reject) => {
    // Pipe MP3 from URL through ffmpeg to mono float32 LE @ 22050 Hz
    const args = [
      "-loglevel", "error",
      "-user_agent", "curl/8.4.0",
      "-i", mp3Url,
      "-f", "f32le",
      "-ac", "1",
      "-ar", "22050",
      "-",
    ];
    const proc = spawn("ffmpeg", args);
    const chunks = [];
    proc.stdout.on("data", (c) => chunks.push(c));
    proc.stderr.on("data", (c) => process.stderr.write(c));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exit ${code}`));
      const buf = Buffer.concat(chunks);
      const samples = new Float32Array(buf.byteLength / 4);
      const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      for (let i = 0; i < samples.length; i++) samples[i] = dv.getFloat32(i * 4, true);
      resolve({ samples, sampleRate: 22050 });
    });
  });
}

// ---------------- FFT (radix-2) ----------------
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cRe = 1, cIm = 0;
      for (let k = 0; k < half; k++) {
        const aRe = re[i+k], aIm = im[i+k];
        const tRe = re[i+k+half] * cRe - im[i+k+half] * cIm;
        const tIm = re[i+k+half] * cIm + im[i+k+half] * cRe;
        re[i+k] = aRe + tRe; im[i+k] = aIm + tIm;
        re[i+k+half] = aRe - tRe; im[i+k+half] = aIm - tIm;
        const nRe = cRe * wRe - cIm * wIm;
        cIm = cRe * wIm + cIm * wRe; cRe = nRe;
      }
    }
  }
}

function frameHNR(frame, sr) {
  const n = frame.length;
  const minLag = Math.floor(sr / 4000);
  const maxLag = Math.floor(sr / 80);
  let r0 = 0;
  for (let i = 0; i < n; i++) r0 += frame[i] * frame[i];
  if (r0 < 1e-10) return null;
  let bestR = 0;
  for (let lag = minLag; lag < maxLag && lag < n; lag++) {
    let r = 0;
    for (let i = 0; i < n - lag; i++) r += frame[i] * frame[i + lag];
    if (r > bestR) bestR = r;
  }
  const ratio = bestR / r0;
  if (ratio <= 0 || ratio >= 1) return null;
  return 10 * Math.log10(ratio / (1 - ratio));
}

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function analyze(samples, sr) {
  const N = 2048, HOP = 1024;
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));

  const frameRms = [];
  for (let s = 0; s + N <= samples.length; s += HOP) {
    let v = 0;
    for (let i = 0; i < N; i++) v += samples[s + i] * samples[s + i];
    frameRms.push(Math.sqrt(v / N));
  }
  const sorted = [...frameRms].sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.3)];
  const peak = sorted[Math.floor(sorted.length * 0.95)];
  const thresh = Math.max(noise * 2, peak * 0.1);

  const re = new Float32Array(N), im = new Float32Array(N);
  let centSum = 0, flatSum = 0, hnrSum = 0, frames = 0;

  for (let s = 0, fi = 0; s + N <= samples.length; s += HOP, fi++) {
    if (frameRms[fi] < thresh) continue;
    for (let i = 0; i < N; i++) { re[i] = samples[s + i] * win[i]; im[i] = 0; }
    fft(re, im);
    let total = 0, wF = 0, logS = 0, linS = 0, nz = 0;
    for (let k = 0; k < N / 2; k++) {
      const m = Math.sqrt(re[k]*re[k] + im[k]*im[k]);
      const f = (k * sr) / N;
      total += m; wF += m * f;
      if (m > 1e-10) { logS += Math.log(m); linS += m; nz++; }
    }
    if (total < 1e-10) continue;
    centSum += wF / total;
    if (nz > 0) flatSum += Math.exp(logS / nz) / (linS / nz);
    const h = frameHNR(samples.subarray(s, s + Math.min(1024, N)), sr);
    if (h !== null && isFinite(h)) hnrSum += h;
    frames++;
  }

  if (!frames) return null;
  const hnr = hnrSum / frames;
  const centroid = centSum / frames;
  const flatness = flatSum / frames;
  const nHnr = clamp01((hnr + 10) / 30);
  const nCentroid = clamp01(1 - Math.abs(centroid - 2500) / 4500);
  const nFlatness = clamp01(1 - (flatness - 0.05) / 0.35);
  const vbi = (nHnr * 0.45 + nCentroid * 0.25 + nFlatness * 0.30) * 10;
  return { hnr, centroid, flatness, nHnr, nCentroid, nFlatness, vbi, voicedFrames: frames };
}

// ---------------- main ----------------
const out = {
  generated_at: new Date().toISOString(),
  source: "Xeno-canto API v3 + ffmpeg → FFT/HNR/Centroid/Flatness (audioAnalysis.js mirror)",
  formula: "VBI = (0.45·nHNR + 0.25·nCentroid + 0.30·nFlatness) * 10",
  species: {},
};

for (const sp of SPECIES) {
  process.stderr.write(`\n=== ${sp.jp} (${sp.query}) ===\n`);
  try {
    const rec = await pickRecording(sp.query);
    if (!rec) { console.error("no recording"); continue; }
    process.stderr.write(`  rec id=${rec.id} cnt=${rec.cnt} len=${rec.length}\n`);
    const url = rec.file?.startsWith("http") ? rec.file : `https://xeno-canto.org${rec.file}`;
    const t0 = Date.now();
    const { samples, sampleRate } = await decodeViaFfmpeg(url);
    process.stderr.write(`  decoded ${samples.length} samples in ${Date.now()-t0}ms\n`);
    const a = analyze(samples, sampleRate);
    if (!a) { console.error("analysis returned null"); continue; }
    process.stderr.write(`  VBI=${a.vbi.toFixed(2)} HNR=${a.hnr.toFixed(1)}dB centroid=${(a.centroid/1000).toFixed(2)}kHz flatness=${a.flatness.toFixed(3)}\n`);
    out.species[sp.query] = {
      jp: sp.jp,
      recording_id: rec.id,
      country: rec.cnt,
      length: rec.length,
      ...a,
    };
  } catch (e) {
    console.error(`  failed: ${e.message}`);
  }
}

await writeFile("data/vbi_5species.json", JSON.stringify(out, null, 2));
process.stderr.write("\nWrote data/vbi_5species.json\n");
