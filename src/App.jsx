import { useState, useEffect, useRef } from "react";
import { analyzeAudio } from "./audioAnalysis.js";
import vbiPrecomputed from "../data/vbi_5species.json";

// Pre-computed VBI for the 5 target species (server-side via ffmpeg+FFT).
// Re-generate by running: node scripts/computeVBI.mjs
const PRECOMPUTED_ANALYSIS = vbiPrecomputed.species || {};

// visual_score: real iratebirds (Haukka et al. 2023) sex-level model predictions, 0-10 scale
// other scores: estimated from qualitative literature (prototype)
const birds = [
  {
    name_jp: "オナガ", name_en: "Azure-winged Magpie",
    query: "Cyanopica cyanus", length_cm: 37, weight_g: 75, flock_size: 10,
    freq_low: 1500, freq_high: 8000,
    breeding_months: 4, breeding_start_month: 4, breeding_end_month: 7,
    habitat_min: 3, habitat_max: 15,
    visual_score: 6.72, voice_score: 2.5, cultural_score: 3.0,
    urban_adapt: 6.0, intelligence: 6.5,
    color: "#7BB8C4",
    note_jp: "見た目◯、声×の典型。カラス科なのに清楚に見える。",
    note_en: "Beauty–voice gap widest of 5 species. Elegant corvid call."
  },
  {
    name_jp: "カラス", name_en: "Large-billed Crow",
    query: "Corvus macrorhynchos", length_cm: 56, weight_g: 600, flock_size: 5,
    freq_low: 300, freq_high: 2000,
    breeding_months: 4, breeding_start_month: 3, breeding_end_month: 6,
    habitat_min: 0, habitat_max: 20,
    visual_score: 5.95, voice_score: 3.0, cultural_score: 9.0,
    urban_adapt: 9.5, intelligence: 9.5,
    color: "#C8C0B0",
    note_jp: "八咫烏→害鳥。文化的評価と現代感情が最も乖離した種。",
    note_en: "Divine messenger → urban pest. Greatest cultural reversal."
  },
  {
    name_jp: "スズメ", name_en: "Eurasian Tree Sparrow",
    query: "Passer montanus", length_cm: 14.5, weight_g: 22, flock_size: 20,
    freq_low: 3000, freq_high: 7000,
    breeding_months: 5, breeding_start_month: 4, breeding_end_month: 8,
    habitat_min: 0, habitat_max: 5,
    visual_score: 5.71, voice_score: 7.5, cultural_score: 8.5,
    urban_adapt: 7.0, intelligence: 4.0,
    color: "#C4956A",
    note_jp: "50年で90%減少。最も親しまれているが減少に気づかれていない。",
    note_en: "90% decline in 50 yrs. Beloved but vanishing unnoticed."
  },
  {
    name_jp: "ドバト", name_en: "Feral Pigeon",
    query: "Columba livia", length_cm: 33, weight_g: 350, flock_size: 30,
    freq_low: 500, freq_high: 1500,
    breeding_months: 12, breeding_start_month: 1, breeding_end_month: 12,
    habitat_min: 0, habitat_max: 10,
    visual_score: 4.56, voice_score: 5.0, cultural_score: 4.0,
    urban_adapt: 10.0, intelligence: 5.5,
    color: "#8B8FA8",
    note_jp: "歴史的に最も人間に使われた鳥（伝書鳩）。現代では嫌悪対象。",
    note_en: "Historically most used by humans (carrier pigeon). Now despised."
  },
  {
    name_jp: "ムクドリ", name_en: "White-cheeked Starling",
    query: "Spodiopsar cineraceus", length_cm: 24, weight_g: 85, flock_size: 100,
    freq_low: 1000, freq_high: 6000,
    breeding_months: 4, breeding_start_month: 4, breeding_end_month: 7,
    habitat_min: 0, habitat_max: 8,
    visual_score: 4.91, voice_score: 3.5, cultural_score: 2.5,
    urban_adapt: 8.0, intelligence: 6.0,
    color: "#6B7C5E",
    note_jp: "集団数最大・生態貢献大だが文化的言及が最も薄い種。",
    note_en: "Largest flocks, high ecological role, lowest cultural presence."
  }
];

const AXES = {
  visual_score:   { label: "視覚的魅力 / Visual appeal", max: 10 },
  voice_score:    { label: "声の好感度（推定）", max: 10 },
  vbi:            { label: "声の物理美 VBI / Voice Beauty Index", max: 10 },
  cultural_score: { label: "文化的言及 / Cultural mentions", max: 10 },
  urban_adapt:    { label: "都市適応度 / Urban adaptability", max: 10 },
  intelligence:   { label: "知性 / Intelligence", max: 10 },
  weight_g:       { label: "体重 / Weight (g)", max: 650 },
  length_cm:      { label: "全長 / Length (cm)", max: 60 },
  flock_size:     { label: "集団規模 / Flock size", max: 110 },
  freq_low:       { label: "声 低域 / Call freq low Hz", max: 3500 },
  freq_high:      { label: "声 高域 / Call freq high Hz", max: 9000 },
};

// Confidence metadata for the species-fact cards.
// measured = 図鑑/文献の標準値、observed = 都市部の典型的な観察値、estimate = 定性文献からの暫定推定
const METRIC_META = {
  length_cm: {
    confidence: "measured",
    note: "鳥類学標準計測：くちばし先端〜尾羽先端を仰向けで直線計測（翼開長とは別）。図鑑値。",
  },
  weight_g: {
    confidence: "measured",
    note: "成鳥の標準体重。個体差・季節差で±15〜25%程度の幅がある。",
  },
  flock_size: {
    confidence: "observed",
    note: "都市部での日常的な群れサイズの目安（最大群ではない）。ムクドリのねぐらは数千羽になる。",
  },
  habitat: {
    confidence: "observed",
    note: "採餌・休息で観察される地上からの典型高度。営巣高度や飛翔最大高ではない。",
  },
  breeding: {
    confidence: "observed",
    note: "日本における主要繁殖期。複数回繁殖する種（スズメ等）や通年繁殖（ドバト）あり。",
  },
  intelligence: {
    confidence: "estimate",
    note: "定性文献ベースの暫定スコア。EQ・行動実験など統一指標は未使用。カラス科は研究多数、スズメ・ムクドリは研究例少。0.5刻みは見せかけの精度なので参考値として読む。",
  },
};

const CONFIDENCE_STYLE = {
  measured: { label: "実測", fg: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.06)" },
  observed: { label: "観察", fg: "rgba(180,200,210,0.55)", bg: "rgba(140,170,190,0.08)" },
  estimate: { label: "推定", fg: "#D9A95B",                 bg: "rgba(196,154,85,0.14)" },
};

function MetricCard({ label, value, meta }) {
  const style = meta ? CONFIDENCE_STYLE[meta.confidence] : null;
  const tooltip = meta?.note;
  return (
    <div title={tooltip} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 4, padding: "7px 9px", position: "relative", cursor: tooltip ? "help" : "default" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>{label}</div>
        {style && (
          <div style={{
            fontSize: 8, letterSpacing: "0.05em",
            color: style.fg, background: style.bg,
            padding: "1px 5px", borderRadius: 2,
          }}>{style.label}</div>
        )}
      </div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}

function formatBreedingRange(b) {
  if (!b.breeding_start_month || !b.breeding_end_month) return `${b.breeding_months}ヶ月`;
  if (b.breeding_start_month === 1 && b.breeding_end_month === 12) return "通年（12ヶ月）";
  return `${b.breeding_start_month}–${b.breeding_end_month}月（${b.breeding_months}ヶ月）`;
}

// Xeno-canto API v3 via Vite dev proxy. Requires VITE_XC_KEY in .env
// (key required since 2025-10-10; obtain at https://xeno-canto.org/account)
const XC_KEY = import.meta.env.VITE_XC_KEY;

function useSpectrogram(query) {
  const [sonoUrl, setSonoUrl] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;
    if (!XC_KEY) {
      setError("Xeno-canto API key required — set VITE_XC_KEY in .env");
      return;
    }
    setLoading(true);
    setSonoUrl(null);
    setAudioUrl(null);
    setError(null);

    // v3 query: short recordings (5–30s) for fast load + analysis
    const [genus, ...rest] = query.split(" ");
    const sp = rest.join(" ");
    const q = `gen:${genus} sp:${sp} q:A len:5-30`;
    const url = `/xc-api/recordings?query=${encodeURIComponent(q)}&key=${encodeURIComponent(XC_KEY)}`;

    const proxy = (u) => u?.replace(/^\/\//, "/xc-sono/").replace(/^https?:\/\/xeno-canto\.org/, "/xc-sono") || "";

    // HEAD-check candidates so we skip stale/0-byte recordings
    (async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
          setError(`${data.error}: ${data.message}`);
          setLoading(false);
          return;
        }
        let recs = data.recordings || [];
        if (!recs.length) {
          // Fallback: drop length filter
          const url2 = `/xc-api/recordings?query=${encodeURIComponent(`gen:${genus} sp:${sp} q:A`)}&key=${encodeURIComponent(XC_KEY)}`;
          const res2 = await fetch(url2);
          const data2 = await res2.json();
          recs = data2.recordings || [];
        }
        // Prefer Japan, then shortest length
        recs.sort((a, b) => {
          const aJp = a.cnt === "Japan" ? 0 : 1;
          const bJp = b.cnt === "Japan" ? 0 : 1;
          if (aJp !== bJp) return aJp - bJp;
          const aLen = parseFloat(a.length?.split(":").reduce((s, v) => s * 60 + parseFloat(v), 0)) || 999;
          const bLen = parseFloat(b.length?.split(":").reduce((s, v) => s * 60 + parseFloat(v), 0)) || 999;
          return aLen - bLen;
        });

        const cand = recs[0];
        if (cand) {
          setSonoUrl(proxy(cand.sono?.med || cand.sono?.small || ""));
          setAudioUrl(proxy(cand.file || ""));
        } else {
          setError("No recording found");
        }
        setLoading(false);
      } catch (e) {
        setError("API unreachable: " + e.message);
        setLoading(false);
      }
    })();
  }, [query]);

  return { sonoUrl, audioUrl, loading, error };
}

function RadarChart({ bird, size = 140 }) {
  const keys = ["visual_score", "voice_score", "cultural_score", "urban_adapt", "intelligence"];
  const labels = ["視覚", "声", "文化", "都市", "知性"];
  const n = keys.length;
  const cx = size / 2, cy = size / 2, r = size * 0.37;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, val) => [cx + (val / 10) * r * Math.cos(angle(i)), cy + (val / 10) * r * Math.sin(angle(i))];
  const polygon = keys.map((k, i) => pt(i, bird[k]).join(",")).join(" ");
  const grid = (f) => keys.map((_, i) => pt(i, f * 10).join(",")).join(" ");

  return (
    <svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={grid(f)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill={bird.color + "44"} stroke={bird.color} strokeWidth="1.5" />
      {keys.map((k, i) => {
        const [x, y] = pt(i, 10);
        const dx = Math.abs(x - cx) < 5 ? 0 : x > cx ? 8 : -8;
        const dy = y > cy + 3 ? 13 : y < cy - 3 ? -4 : 4;
        return (
          <text key={k} x={x + dx} y={y + dy} fontSize="8" fill="rgba(255,255,255,0.4)" textAnchor="middle">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

function FreqBar({ bird }) {
  const max = 9000;
  const left = (bird.freq_low / max) * 100;
  const w = ((bird.freq_high - bird.freq_low) / max) * 100;
  return (
    <div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        声の周波数帯域 / Call frequency
      </div>
      <div style={{ position: "relative", height: 24, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}>
        <div style={{ position: "absolute", left: `${(1000/max)*100}%`, width: `${(3000/max)*100}%`, height: "100%", background: "rgba(255,220,80,0.07)", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: `${left}%`, width: `${w}%`, height: "60%", top: "20%", background: bird.color, borderRadius: 2, opacity: 0.9 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>0</span>
        <span style={{ fontSize: 9, color: "rgba(255,220,80,0.4)" }}>1k–4k Hz 人間の可聴ピーク</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>9kHz</span>
      </div>
    </div>
  );
}

function Scatter({ xKey, yKey, birds, selected, onSelect }) {
  const xA = AXES[xKey], yA = AXES[yKey];
  const W = 320, H = 240, P = 42;
  const sx = v => P + (v / xA.max) * (W - P * 2);
  const sy = v => H - P - (v / yA.max) * (H - P * 2);

  const usable = birds.filter(b => b[xKey] !== null && b[xKey] !== undefined && b[yKey] !== null && b[yKey] !== undefined);
  const missing = birds.filter(b => b[xKey] === null || b[yKey] === null);

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="rgba(255,255,255,0.1)" />
      <line x1={P} y1={P} x2={P} y2={H-P} stroke="rgba(255,255,255,0.1)" />
      <text x={W/2} y={H-4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">{xA.label}</text>
      <text x={10} y={H/2} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" transform={`rotate(-90,10,${H/2})`}>{yA.label}</text>
      {usable.map(b => {
        const isOn = b.name_jp === selected;
        return (
          <g key={b.name_jp} onClick={() => onSelect(b.name_jp)} style={{ cursor: "pointer" }}>
            <circle cx={sx(b[xKey])} cy={sy(b[yKey])} r={isOn ? 9 : 6}
              fill={b.color} opacity={isOn ? 1 : 0.55}
              stroke={isOn ? "white" : "none"} strokeWidth="1.5" />
            <text x={sx(b[xKey])} y={sy(b[yKey]) - 12} textAnchor="middle" fontSize="9"
              fill={isOn ? "white" : "rgba(255,255,255,0.4)"}>
              {b.name_jp}
            </text>
          </g>
        );
      })}
      {missing.length > 0 && (
        <text x={W - 4} y={P - 6} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
          未計算: {missing.map(b => b.name_jp).join(", ")}
        </text>
      )}
    </svg>
  );
}

function Waveform({ audioUrl, color, currentTime, duration: extDuration, onSeek, onAnalysis, query }) {
  const [peaks, setPeaks] = useState(null);
  const [duration, setDuration] = useState(0);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;
    let cancelled = false;
    setPeaks(null);
    setErr(null);

    (async () => {
      try {
        const res = await fetch(audioUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 0) throw new Error("empty response body");
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audio = await ctx.decodeAudioData(buf);
        if (cancelled) return;

        const ch = audio.getChannelData(0);
        const N = 600;
        const step = Math.floor(ch.length / N);
        const out = new Float32Array(N);
        let max = 0;
        for (let i = 0; i < N; i++) {
          let m = 0;
          const start = i * step;
          const end = Math.min(start + step, ch.length);
          for (let j = start; j < end; j++) {
            const v = Math.abs(ch[j]);
            if (v > m) m = v;
          }
          out[i] = m;
          if (m > max) max = m;
        }
        if (max > 0) for (let i = 0; i < N; i++) out[i] /= max;
        setPeaks(out);
        setDuration(audio.duration);

        if (onAnalysis && query) {
          // run after waveform is shown so UI updates first
          setTimeout(async () => {
            if (cancelled) return;
            try {
              const result = await analyzeAudio(audio);
              if (!cancelled && result) onAnalysis(query, result);
            } finally {
              ctx.close();
            }
          }, 50);
        } else {
          ctx.close();
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();

    return () => { cancelled = true; };
  }, [audioUrl]);

  if (err) return <div style={{ fontSize: 10, color: "rgba(255,100,100,0.4)", padding: 12 }}>波形デコード失敗: {err}</div>;
  if (!peaks) return <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", padding: 12 }}>波形を計算中…</div>;

  const W = 560, H = 90;
  const mid = H / 2;
  let path = `M 0 ${mid}`;
  for (let i = 0; i < peaks.length; i++) {
    const x = (i / (peaks.length - 1)) * W;
    const y = mid - peaks[i] * (mid - 2);
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  for (let i = peaks.length - 1; i >= 0; i--) {
    const x = (i / (peaks.length - 1)) * W;
    const y = mid + peaks[i] * (mid - 2);
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  path += " Z";

  const dur = extDuration || duration;
  const ticks = [];
  const sec = Math.ceil(dur);
  for (let s = 0; s <= sec; s++) {
    if (s % Math.max(1, Math.ceil(sec / 6)) === 0) {
      const x = (s / dur) * W;
      ticks.push({ s, x });
    }
  }
  const cursorX = dur > 0 ? (currentTime / dur) * W : 0;

  const handleClick = (e) => {
    if (!onSeek || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * dur);
  };

  return (
    <div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        波形 / Waveform — 振幅の輪郭
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" onClick={handleClick} style={{ display: "block", cursor: onSeek ? "pointer" : "default" }}>
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="rgba(255,255,255,0.06)" />
        <path d={path} fill={color} fillOpacity="0.85" />
        {dur > 0 && (
          <line x1={cursorX} y1="0" x2={cursorX} y2={H} stroke={color} strokeWidth="2" opacity="1" />
        )}
        {ticks.map(({ s, x }) => (
          <g key={s}>
            <line x1={x} y1={H - 2} x2={x} y2={H + 2} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x={x} y={H + 12} fontSize="8" fill="rgba(255,255,255,0.35)" textAnchor={s === 0 ? "start" : "middle"}>{s}s</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function VoiceBeautyPanel({ bird, analysis, allBirds, selected }) {
  const computed = allBirds.filter(b => b.vbi !== null);

  return (
    <div style={{ background: "#161616", borderRadius: 8, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", marginBottom: 4 }}>
        声の物理的美しさ / Voice Beauty Index
      </div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginBottom: 14, lineHeight: 1.5 }}>
        HNR(純音性) · Spectral Centroid(中域) · Flatness(旋律性) を合成（Ratcliffe 2018他参照）
      </div>

      {!analysis && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", padding: "20px 0", textAlign: "center" }}>
          音声デコード後に計算されます…
        </div>
      )}

      {analysis && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 32, color: bird.color, fontWeight: 300 }}>{analysis.vbi.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>/ 10  VBI</div>
          </div>

          {[
            { label: "HNR (純音 vs ノイズ)", val: analysis.nHnr, raw: `${analysis.hnr.toFixed(1)} dB` },
            { label: "Spectral Centroid (中域寄り)", val: analysis.nCentroid, raw: `${(analysis.centroid / 1000).toFixed(2)} kHz` },
            { label: "Tonality (旋律性=低flatness)", val: analysis.nFlatness, raw: analysis.flatness.toFixed(3) },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>
                <span>{m.label}</span>
                <span style={{ color: "rgba(255,255,255,0.55)" }}>{m.raw}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                <div style={{ width: `${m.val * 100}%`, height: "100%", background: bird.color, opacity: 0.85, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </>
      )}

      {/* 5-species accumulating comparison */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>
          5種比較（各種を表示すると追加されます: {computed.length}/5）
        </div>
        {allBirds.map(b => {
          const on = b.name_jp === selected;
          const has = b.vbi !== null;
          return (
            <div key={b.name_jp} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <div style={{ fontSize: 10, width: 48, color: on ? b.color : "rgba(255,255,255,0.35)" }}>{b.name_jp}</div>
              <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, position: "relative" }}>
                {has && (
                  <div style={{ width: `${(b.vbi / 10) * 100}%`, height: "100%", background: on ? b.color : b.color + "70", borderRadius: 3 }} />
                )}
              </div>
              <div style={{ fontSize: 9, width: 40, textAlign: "right", color: has ? (on ? b.color : "rgba(255,255,255,0.45)") : "rgba(255,255,255,0.18)" }}>
                {has ? b.vbi.toFixed(1) : "—"}
              </div>
              {has && b.visual_score !== undefined && (
                <div style={{ fontSize: 9, width: 60, textAlign: "right", color: "rgba(255,255,255,0.3)" }}>
                  視覚{b.visual_score.toFixed(1)}
                </div>
              )}
            </div>
          );
        })}

        {computed.length >= 2 && (
          <div style={{ marginTop: 10, fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            ※ 視覚的魅力(iratebirds)とVBIのずれが「見た目と声の物理的美しさの非対称性」を示す
          </div>
        )}
      </div>
    </div>
  );
}

function SpectrogramPanel({ bird, onAnalysis }) {
  const { sonoUrl, audioUrl, loading, error } = useSpectrogram(bird.query);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  const seek = (t) => {
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  return (
    <div style={{ background: "#111", borderRadius: 6, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
        スペクトログラム / Spectrogram — Xeno-canto
      </div>

      {loading && (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
            Loading from xeno-canto.org…
          </div>
        </div>
      )}

      {error && (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(255,100,100,0.5)" }}>
            {error}
          </div>
        </div>
      )}

      {sonoUrl && !loading && (
        <>
          <div
            style={{ position: "relative", cursor: duration ? "pointer" : "default" }}
            onClick={(e) => {
              if (!duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio * duration);
            }}
          >
            <img
              src={sonoUrl}
              alt={`${bird.name_en} spectrogram`}
              style={{ width: "100%", borderRadius: 4, display: "block", opacity: 0.92 }}
            />
            {duration > 0 && (
              <div style={{
                position: "absolute",
                top: 0, bottom: 0,
                left: `${(currentTime / duration) * 100}%`,
                width: 2,
                background: bird.color,
                opacity: 1,
                pointerEvents: "none",
                boxShadow: `0 0 6px ${bird.color}`,
                transform: "translateX(-1px)",
              }} />
            )}
          </div>
          {audioUrl && (
            <div style={{ marginTop: 14 }}>
              <Waveform audioUrl={audioUrl} color={bird.color} currentTime={currentTime} duration={duration} onSeek={seek} onAnalysis={onAnalysis} query={bird.query} />
            </div>
          )}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
              Source: xeno-canto.org · CC license · Japan recording preferred
            </div>
            {audioUrl && (
              <audio
                ref={audioRef}
                controls
                style={{ height: 24, opacity: 0.7 }}
                src={audioUrl}
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onDurationChange={(e) => setDuration(e.target.duration)}
              >
                Your browser does not support audio.
              </audio>
            )}
          </div>
        </>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 12 }}>
          <FreqBar bird={bird} />
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
        {bird.name_jp === "オナガ" && "高域に集中した不規則なノイズ帯。輪郭がぼやけ「汚い」形。声の好感度が低い理由が視覚的に分かる。"}
        {bird.name_jp === "カラス" && "低域中心の太い帯状。急峻な立ち上がりと減衰。力強いが旋律性は低い。"}
        {bird.name_jp === "スズメ" && "中〜高域に繰り返しのあるパターン。リズム的構造が声の親しみやすさと対応する。"}
        {bird.name_jp === "ドバト" && "低域の持続音。倍音構造が比較的規則的。「クー」という安定したパターン。"}
        {bird.name_jp === "ムクドリ" && "広帯域に複雑なパターンが混在。多彩だが騒音と感じられやすい構造を持つ。"}
      </div>
    </div>
  );
}

export default function BirdGapExplorer() {
  const [selected, setSelected] = useState("オナガ");
  const [xKey, setXKey] = useState("visual_score");
  const [yKey, setYKey] = useState("vbi");
  const [tab, setTab] = useState("detail");
  const [analysisByQuery, setAnalysisByQuery] = useState(PRECOMPUTED_ANALYSIS);
  const bird = birds.find(b => b.name_jp === selected);

  const handleAnalysis = (query, result) => {
    setAnalysisByQuery(prev => prev[query] ? prev : { ...prev, [query]: result });
  };

  // Enrich birds with VBI lookup so scatter/comparison can use bird.vbi
  const enrichedBirds = birds.map(b => ({
    ...b,
    vbi: analysisByQuery[b.query]?.vbi ?? null,
  }));
  const enrichedBird = enrichedBirds.find(b => b.name_jp === selected);
  const currentAnalysis = analysisByQuery[bird.query];

  const sel = { background: "#1c1c1c", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" };

  return (
    <div style={{ background: "#0c0c0c", color: "rgba(255,255,255,0.85)", minHeight: "100vh", fontFamily: "'Georgia', serif", padding: "28px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", marginBottom: 6, textTransform: "uppercase" }}>
            Bird Data Exploration · 川崎市幸区 · Prototype
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 400 }}>鳥と人間のずれ / The Gap</h1>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
            客観的特性と人間の評価・感情の間にある非対称性を探る。
            Exploring asymmetry between a bird's objective traits and human perception.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {birds.map(b => (
            <button key={b.name_jp} onClick={() => setSelected(b.name_jp)} style={{
              background: selected === b.name_jp ? b.color : "transparent",
              color: selected === b.name_jp ? "#0c0c0c" : b.color,
              border: `1.5px solid ${b.color}`,
              borderRadius: 20, padding: "5px 14px",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s"
            }}>
              {b.name_jp}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>
          {[["detail", "詳細 / Detail"], ["scatter", "散布図 / Scatter"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? "rgba(255,255,255,0.08)" : "transparent",
              color: tab === key ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
              border: "none", borderRadius: "4px 4px 0 0", padding: "7px 16px",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em"
            }}>{label}</button>
          ))}
        </div>

        {tab === "detail" && bird && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ background: "#161616", borderRadius: 8, padding: 20, border: `1px solid ${bird.color}28` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 24, color: bird.color, fontWeight: 400 }}>{bird.name_jp}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{bird.name_en}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>{bird.query}</div>
                  </div>
                  <RadarChart bird={bird} size={120} />
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "10px 12px", marginTop: 12, borderLeft: `3px solid ${bird.color}` }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: 5 }}>ずれの核心</div>
                  <div style={{ fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>{bird.note_jp}</div>
                  <div style={{ fontSize: 10, lineHeight: 1.6, color: "rgba(255,255,255,0.38)", marginTop: 4 }}>{bird.note_en}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                  {[
                    { label: "全長",     value: `${bird.length_cm}cm`,                        meta: METRIC_META.length_cm },
                    { label: "体重",     value: `${bird.weight_g}g`,                          meta: METRIC_META.weight_g },
                    { label: "集団規模", value: `~${bird.flock_size}羽`,                     meta: METRIC_META.flock_size },
                    { label: "生息高度", value: `${bird.habitat_min}–${bird.habitat_max}m`,   meta: METRIC_META.habitat },
                    { label: "繁殖期",   value: formatBreedingRange(bird),                    meta: METRIC_META.breeding },
                    { label: "知性",     value: `${bird.intelligence}/10`,                    meta: METRIC_META.intelligence },
                  ].map(m => (
                    <MetricCard key={m.label} label={m.label} value={m.value} meta={m.meta} />
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 9, color: "rgba(255,255,255,0.32)", lineHeight: 1.6 }}>
                  バッジ：<span style={{ color: CONFIDENCE_STYLE.measured.fg }}>実測</span>＝図鑑/文献値、
                  <span style={{ color: CONFIDENCE_STYLE.observed.fg }}>観察</span>＝都市部の典型値、
                  <span style={{ color: CONFIDENCE_STYLE.estimate.fg }}>推定</span>＝統一指標なしの定性スコア。各カードにマウスを乗せると定義/出典が出ます。
                </div>
              </div>

              <div style={{ background: "#161616", borderRadius: 8, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", marginBottom: 16 }}>
                  人間の評価スコア比較
                </div>
                {[
                  { key: "visual_score", label: "視覚的魅力 (iratebirds実データ)" },
                  { key: "voice_score", label: "声の好感度 (推定)" },
                  { key: "cultural_score", label: "文化的言及 (推定)" },
                  { key: "urban_adapt", label: "都市適応度 (推定)" },
                ].map(({ key, label }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginBottom: 5 }}>{label}</div>
                    <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                      {birds.map(b => {
                        const on = b.name_jp === selected;
                        return (
                          <div key={b.name_jp} style={{ flex: 1 }}>
                            <div style={{ fontSize: 8, textAlign: "center", color: on ? "white" : "rgba(255,255,255,0.25)", marginBottom: 2 }}>
                              {b.name_jp.slice(0, 2)}
                            </div>
                            <div style={{ height: 48, display: "flex", alignItems: "flex-end" }}>
                              <div style={{
                                width: "100%", height: `${(b[key] / 10) * 100}%`,
                                background: on ? b.color : b.color + "38",
                                borderRadius: "2px 2px 0 0", transition: "all 0.2s"
                              }} />
                            </div>
                            <div style={{ fontSize: 8, textAlign: "center", color: on ? bird.color : "rgba(255,255,255,0.2)", marginTop: 2 }}>
                              {b[key]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>
                    見た目 vs 声のずれ（正=見た目が高評価）
                  </div>
                  {birds.map(b => {
                    const gap = b.visual_score - b.voice_score;
                    const on = b.name_jp === selected;
                    return (
                      <div key={b.name_jp} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <div style={{ fontSize: 10, width: 48, color: on ? b.color : "rgba(255,255,255,0.35)" }}>{b.name_jp}</div>
                        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, position: "relative" }}>
                          <div style={{ position: "absolute", left: "50%", top: -2, width: 1, height: 9, background: "rgba(255,255,255,0.18)" }} />
                          <div style={{
                            position: "absolute",
                            [gap > 0 ? "left" : "right"]: "50%",
                            width: `${(Math.abs(gap) / 10) * 50}%`,
                            height: "100%",
                            background: on ? b.color : b.color + "55",
                            borderRadius: 3
                          }} />
                        </div>
                        <div style={{ fontSize: 9, width: 30, textAlign: "right", color: on ? b.color : "rgba(255,255,255,0.28)" }}>
                          {gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SpectrogramPanel bird={bird} onAnalysis={handleAnalysis} />

              <VoiceBeautyPanel bird={bird} analysis={currentAnalysis} allBirds={enrichedBirds} selected={selected} />

              <div style={{ background: "#161616", borderRadius: 8, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", marginBottom: 14 }}>
                  5種の周波数帯域比較
                </div>
                {birds.map(b => {
                  const max = 9000;
                  const left = (b.freq_low / max) * 100;
                  const w = ((b.freq_high - b.freq_low) / max) * 100;
                  const on = b.name_jp === selected;
                  return (
                    <div key={b.name_jp} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ fontSize: 10, width: 50, color: on ? b.color : "rgba(255,255,255,0.35)" }}>{b.name_jp}</div>
                      <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 3, position: "relative" }}>
                        <div style={{ position: "absolute", left: `${(1000/max)*100}%`, width: `${(3000/max)*100}%`, height: "100%", background: "rgba(255,220,80,0.06)", borderRadius: 2 }} />
                        <div style={{ position: "absolute", left: `${left}%`, width: `${w}%`, height: "70%", top: "15%", background: b.color, borderRadius: 2, opacity: on ? 1 : 0.45 }} />
                      </div>
                      <div style={{ fontSize: 9, width: 70, color: "rgba(255,255,255,0.25)", textAlign: "right" }}>
                        {b.freq_low}–{b.freq_high}Hz
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 9, color: "rgba(255,220,80,0.4)", marginTop: 6 }}>▓ = 人間の聴覚ピーク帯域 1k–4kHz</div>
              </div>
            </div>
          </div>
        )}

        {tab === "scatter" && (
          <div style={{ background: "#161616", borderRadius: 8, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)" }}>軸を選択</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>X:</span>
                <select value={xKey} onChange={e => setXKey(e.target.value)} style={sel}>
                  {Object.entries(AXES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Y:</span>
                <select value={yKey} onChange={e => setYKey(e.target.value)} style={sel}>
                  {Object.entries(AXES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <Scatter xKey={xKey} yKey={yKey} birds={enrichedBirds} selected={selected} onSelect={setSelected} />
            <div style={{ marginTop: 16, fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.7 }}>
              推奨の組み合わせ: <b>視覚的魅力 × VBI</b>（見た目と声の物理美のずれ）/ 視覚的魅力 × 文化的言及 / 都市適応度 × 視覚的魅力
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 9, color: "rgba(255,255,255,0.18)", lineHeight: 1.8 }}>
          Sources: iratebirds (Haukka et al. 2023, Scientific Data) · Xeno-canto.org (CC) · 日本野鳥の会 · Cornell Lab AllAboutBirds ·
          Journal of Ethology 2025 · Urban Bird Society of Japan<br />
          Note: visual_score is real iratebirds data (sex-level model). voice/cultural/urban scores are qualitative estimates.
        </div>
      </div>
    </div>
  );
}
