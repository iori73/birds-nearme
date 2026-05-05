import { useState, useEffect } from "react";

const birds = [
  {
    name_jp: "オナガ", name_en: "Azure-winged Magpie",
    query: "Cyanopica cyanus", length_cm: 37, weight_g: 75, flock_size: 10,
    freq_low: 1500, freq_high: 8000, breeding_months: 4,
    habitat_min: 3, habitat_max: 15,
    visual_score: 6.8, voice_score: 2.5, cultural_score: 3.0,
    urban_adapt: 6.0, intelligence: 6.5,
    color: "#7BB8C4",
    gap: 4.3,
    note_jp: "見た目◯、声×の典型。カラス科なのに清楚に見える。",
    note_en: "Beauty–voice gap widest of 5 species. Elegant corvid call."
  },
  {
    name_jp: "カラス", name_en: "Large-billed Crow",
    query: "Corvus macrorhynchos", length_cm: 56, weight_g: 600, flock_size: 5,
    freq_low: 300, freq_high: 2000, breeding_months: 4,
    habitat_min: 0, habitat_max: 20,
    visual_score: 4.2, voice_score: 3.0, cultural_score: 9.0,
    urban_adapt: 9.5, intelligence: 9.5,
    color: "#C8C0B0",
    gap: 1.2,
    note_jp: "八咫烏→害鳥。文化的評価と現代感情が最も乖離した種。",
    note_en: "Divine messenger → urban pest. Greatest cultural reversal."
  },
  {
    name_jp: "スズメ", name_en: "Eurasian Tree Sparrow",
    query: "Passer montanus", length_cm: 14.5, weight_g: 22, flock_size: 20,
    freq_low: 3000, freq_high: 7000, breeding_months: 5,
    habitat_min: 0, habitat_max: 5,
    visual_score: 5.1, voice_score: 7.5, cultural_score: 8.5,
    urban_adapt: 7.0, intelligence: 4.0,
    color: "#C4956A",
    gap: -2.4,
    note_jp: "50年で90%減少。最も親しまれているが減少に気づかれていない。",
    note_en: "90% decline in 50 yrs. Beloved but vanishing unnoticed."
  },
  {
    name_jp: "ドバト", name_en: "Feral Pigeon",
    query: "Columba livia", length_cm: 33, weight_g: 350, flock_size: 30,
    freq_low: 500, freq_high: 1500, breeding_months: 12,
    habitat_min: 0, habitat_max: 10,
    visual_score: 3.8, voice_score: 5.0, cultural_score: 4.0,
    urban_adapt: 10.0, intelligence: 5.5,
    color: "#8B8FA8",
    gap: -1.2,
    note_jp: "歴史的に最も人間に使われた鳥（伝書鳩）。現代では嫌悪対象。",
    note_en: "Historically most used by humans (carrier pigeon). Now despised."
  },
  {
    name_jp: "ムクドリ", name_en: "White-cheeked Starling",
    query: "Sturnus cineraceus", length_cm: 24, weight_g: 85, flock_size: 100,
    freq_low: 1000, freq_high: 6000, breeding_months: 4,
    habitat_min: 0, habitat_max: 8,
    visual_score: 4.5, voice_score: 3.5, cultural_score: 2.5,
    urban_adapt: 8.0, intelligence: 6.0,
    color: "#6B7C5E",
    gap: 1.0,
    note_jp: "集団数最大・生態貢献大だが文化的言及が最も薄い種。",
    note_en: "Largest flocks, high ecological role, lowest cultural presence."
  }
];

const AXES = {
  visual_score:   { label: "視覚的魅力 / Visual appeal", max: 10 },
  voice_score:    { label: "声の好感度 / Voice pleasantness", max: 10 },
  cultural_score: { label: "文化的言及 / Cultural mentions", max: 10 },
  urban_adapt:    { label: "都市適応度 / Urban adaptability", max: 10 },
  intelligence:   { label: "知性 / Intelligence", max: 10 },
  weight_g:       { label: "体重 / Weight (g)", max: 650 },
  length_cm:      { label: "全長 / Length (cm)", max: 60 },
  flock_size:     { label: "集団規模 / Flock size", max: 110 },
  freq_low:       { label: "声 低域 / Call freq low Hz", max: 3500 },
  freq_high:      { label: "声 高域 / Call freq high Hz", max: 9000 },
};

// Xeno-canto API v2 (no key required)
function useSpectrogram(query) {
  const [sonoUrl, setSonoUrl] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setSonoUrl(null);
    setAudioUrl(null);
    setError(null);

    const encoded = encodeURIComponent(query + " q:A");
    fetch(`https://xeno-canto.org/api/2/recordings?query=${encoded}&page=1`)
      .then(r => r.json())
      .then(data => {
        const recs = data.recordings || [];
        // prefer Japan recording, fallback to first
        const jp = recs.find(r => r.cnt === "Japan") || recs[0];
        if (jp) {
          setSonoUrl("https:" + jp.sono.med);
          setAudioUrl("https:" + jp.file);
        } else {
          setError("No recording found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("API unreachable");
        setLoading(false);
      });
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
        {/* sweet spot */}
        <div style={{ position: "absolute", left: `${(1000/max)*100}%`, width: `${(3000/max)*100}%`, height: "100%", background: "rgba(255,220,80,0.07)", borderRadius: 2 }} />
        {/* bird range */}
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
  const W = 280, H = 200, P = 38;
  const sx = v => P + (v / xA.max) * (W - P * 2);
  const sy = v => H - P - (v / yA.max) * (H - P * 2);

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="rgba(255,255,255,0.1)" />
      <line x1={P} y1={P} x2={P} y2={H-P} stroke="rgba(255,255,255,0.1)" />
      <text x={W/2} y={H-4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">{xA.label}</text>
      <text x={10} y={H/2} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" transform={`rotate(-90,10,${H/2})`}>{yA.label}</text>
      {birds.map(b => {
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
    </svg>
  );
}

function SpectrogramPanel({ bird }) {
  const { sonoUrl, audioUrl, loading, error } = useSpectrogram(bird.query);

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
            {error} — xeno-canto API may be rate-limited in this environment
          </div>
        </div>
      )}

      {sonoUrl && !loading && (
        <>
          <img
            src={sonoUrl}
            alt={`${bird.name_en} spectrogram`}
            style={{ width: "100%", borderRadius: 4, display: "block", opacity: 0.92 }}
            onError={() => {}}
          />
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
              Source: xeno-canto.org · CC license · Japan recording preferred
            </div>
            {audioUrl && (
              <audio controls style={{ height: 24, opacity: 0.7 }} src={audioUrl}>
                Your browser does not support audio.
              </audio>
            )}
          </div>
        </>
      )}

      {/* Frequency annotation overlay */}
      {!loading && !error && (
        <div style={{ marginTop: 12 }}>
          <FreqBar bird={bird} />
        </div>
      )}

      {/* Shape description */}
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
  const [yKey, setYKey] = useState("cultural_score");
  const [tab, setTab] = useState("detail"); // detail | scatter
  const bird = birds.find(b => b.name_jp === selected);

  const sel = { background: "#1c1c1c", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" };

  return (
    <div style={{ background: "#0c0c0c", color: "rgba(255,255,255,0.85)", minHeight: "100vh", fontFamily: "'Georgia', serif", padding: "28px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
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

        {/* Bird selector */}
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

        {/* Tabs */}
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

        {/* Detail tab */}
        {tab === "detail" && bird && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Left col */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Identity */}
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
                    ["全長", `${bird.length_cm}cm`],
                    ["体重", `${bird.weight_g}g`],
                    ["集団規模", `~${bird.flock_size}羽`],
                    ["生息高度", `${bird.habitat_min}–${bird.habitat_max}m`],
                    ["繁殖月数", `${bird.breeding_months}ヶ月`],
                    ["知性", `${bird.intelligence}/10`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 4, padding: "7px 9px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 13 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score comparison */}
              <div style={{ background: "#161616", borderRadius: 8, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", marginBottom: 16 }}>
                  人間の評価スコア比較
                </div>
                {[
                  { key: "visual_score", label: "視覚的魅力" },
                  { key: "voice_score", label: "声の好感度" },
                  { key: "cultural_score", label: "文化的言及" },
                  { key: "urban_adapt", label: "都市適応度" },
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

                {/* Visual–voice gap bar */}
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

            {/* Right col: spectrogram */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SpectrogramPanel bird={bird} />

              {/* Freq range across all birds */}
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

        {/* Scatter tab */}
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
            <Scatter xKey={xKey} yKey={yKey} birds={birds} selected={selected} onSelect={setSelected} />
            <div style={{ marginTop: 16, fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.7 }}>
              推奨の組み合わせ: 視覚的魅力 × 文化的言及 / 声の好感度 × 文化的言及 / 都市適応度 × 視覚的魅力
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, fontSize: 9, color: "rgba(255,255,255,0.18)", lineHeight: 1.8 }}>
          Sources: iratebirds (Haukka et al. 2023, Scientific Data) · Xeno-canto.org (CC) · 日本野鳥の会 · Cornell Lab AllAboutBirds ·
          Journal of Ethology 2025 · Urban Bird Society of Japan · 各種分類群データ<br />
          Note: voice pleasantness & cultural mention scores estimated from qualitative literature. Prototype dataset.
        </div>
      </div>
    </div>
  );
}
