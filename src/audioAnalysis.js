// Voice Beauty Index analyzer — computes HNR, spectral centroid, flatness from
// a decoded AudioBuffer using a small in-process radix-2 FFT.

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wRe0 = Math.cos(ang), wIm0 = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < half; k++) {
        const aRe = re[i + k], aIm = im[i + k];
        const tRe = re[i + k + half] * curRe - im[i + k + half] * curIm;
        const tIm = re[i + k + half] * curIm + im[i + k + half] * curRe;
        re[i + k] = aRe + tRe;
        im[i + k] = aIm + tIm;
        re[i + k + half] = aRe - tRe;
        im[i + k + half] = aIm - tIm;
        const nRe = curRe * wRe0 - curIm * wIm0;
        curIm = curRe * wIm0 + curIm * wRe0;
        curRe = nRe;
      }
    }
  }
}

// Autocorrelation-based HNR for a single frame.
// Returns dB. High = tonal/pure, low = noisy.
function frameHNR(frame, sampleRate) {
  const n = frame.length;
  // Pitch range: 80Hz–4kHz covers most bird calls
  const minLag = Math.floor(sampleRate / 4000);
  const maxLag = Math.floor(sampleRate / 80);
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

export async function analyzeAudio(audioBuffer) {
  const sr = audioBuffer.sampleRate;
  const ch = audioBuffer.getChannelData(0);

  // Energy gating — drop near-silent frames so noise floor doesn't dominate
  const N = 2048;
  const HOP = 1024;
  const window = new Float32Array(N);
  for (let i = 0; i < N; i++) window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));

  // Pre-pass: find RMS distribution to set silence threshold
  const frameRms = [];
  for (let start = 0; start + N <= ch.length; start += HOP) {
    let s = 0;
    for (let i = 0; i < N; i++) s += ch[start + i] * ch[start + i];
    frameRms.push(Math.sqrt(s / N));
  }
  if (!frameRms.length) return null;
  const sortedRms = [...frameRms].sort((a, b) => a - b);
  const noiseFloor = sortedRms[Math.floor(sortedRms.length * 0.3)];
  const peakRms = sortedRms[Math.floor(sortedRms.length * 0.95)];
  const threshold = Math.max(noiseFloor * 2, peakRms * 0.1);

  const re = new Float32Array(N);
  const im = new Float32Array(N);
  const mag = new Float32Array(N / 2);
  let centroidSum = 0;
  let flatnessSum = 0;
  let hnrSum = 0;
  let voicedFrames = 0;

  for (let start = 0, fi = 0; start + N <= ch.length; start += HOP, fi++) {
    if (frameRms[fi] < threshold) continue;

    for (let i = 0; i < N; i++) {
      re[i] = ch[start + i] * window[i];
      im[i] = 0;
    }
    fft(re, im);

    // Magnitude spectrum, only positive freqs
    let totalMag = 0;
    let weightedFreq = 0;
    let logSum = 0;
    let linSum = 0;
    let nonZero = 0;
    for (let k = 0; k < N / 2; k++) {
      const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      mag[k] = m;
      const f = (k * sr) / N;
      totalMag += m;
      weightedFreq += m * f;
      if (m > 1e-10) {
        logSum += Math.log(m);
        linSum += m;
        nonZero++;
      }
    }
    if (totalMag < 1e-10) continue;

    centroidSum += weightedFreq / totalMag;
    if (nonZero > 0) {
      const geo = Math.exp(logSum / nonZero);
      const ari = linSum / nonZero;
      flatnessSum += geo / ari;
    }

    // Use a smaller window for HNR (autocorrelation is O(n*lag))
    const hnrFrame = ch.subarray(start, start + Math.min(1024, N));
    const h = frameHNR(hnrFrame, sr);
    if (h !== null && isFinite(h)) hnrSum += h;

    voicedFrames++;
  }

  if (voicedFrames === 0) return null;

  const centroid = centroidSum / voicedFrames; // Hz
  const flatness = flatnessSum / voicedFrames; // 0-1
  const hnr = hnrSum / voicedFrames; // dB

  // Normalize to 0-1 "beauty contributions" with literature-informed mappings:
  //   HNR: -10dB → 0, +20dB → 1
  //   centroid: distance from 2.5kHz (peak human pleasantness band), full at <500Hz / >7kHz → 0
  //   flatness: lower (more tonal) is more melodic. <0.05 → 1, >0.4 → 0
  const nHnr = clamp01((hnr + 10) / 30);
  const centDist = Math.abs(centroid - 2500);
  const nCentroid = clamp01(1 - centDist / 4500);
  const nFlatness = clamp01(1 - (flatness - 0.05) / 0.35);

  // VBI 0-10, weights from Ratcliffe 2018 emphasis on HNR/tonality
  const vbi = (nHnr * 0.45 + nCentroid * 0.25 + nFlatness * 0.30) * 10;

  return {
    hnr,           // raw dB
    centroid,      // raw Hz
    flatness,      // raw 0-1
    nHnr,          // 0-1 normalized
    nCentroid,
    nFlatness,
    vbi,           // 0-10
    voicedFrames,
  };
}

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
