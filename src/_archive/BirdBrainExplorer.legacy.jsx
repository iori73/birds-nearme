import { useState } from "react";
import brainData from "../data/brain_parts.json";

const PARTS = brainData.parts || [];
const TIMELINE = brainData.evolution_timeline || [];
const SPECIES = brainData.species_brain || [];
const GAP = brainData.gap_core || {};
const VB = (brainData._meta && brainData._meta.viewbox) || { w: 420, h: 260 };

const CONFIDENCE_STYLE = {
  measured: { label: "実測", fg: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.06)" },
  observed: { label: "観察", fg: "rgba(180,200,210,0.55)", bg: "rgba(140,170,190,0.08)" },
  estimate: { label: "推定", fg: "#D9A95B",                bg: "rgba(196,154,85,0.14)" },
};

function BrainSection({ activeSpecies, hoveredPart, setHoveredPart }) {
  const highlight = activeSpecies?.highlight_part;
  const outline = `M 50 170
                   C 50 95, 95 50, 180 50
                   C 250 50, 285 75, 290 105
                   C 295 100, 320 92, 345 110
                   C 365 125, 365 165, 340 185
                   C 345 200, 340 220, 320 230
                   C 280 245, 220 245, 180 240
                   C 130 235, 80 230, 60 215
                   C 45 205, 45 185, 50 170 Z`;

  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} style={{ width: "100%", display: "block" }}>
      <path d={outline} fill="rgba(244,239,230,0.04)" stroke="rgba(244,239,230,0.25)" strokeWidth="1" />
      {/* connective baseline (brainstem) */}
      <line x1="290" y1="225" x2="380" y2="245" stroke="rgba(244,239,230,0.18)" strokeWidth="1" />

      {PARTS.map(p => {
        const isHovered = hoveredPart === p.id;
        const isHighlight = highlight === p.id;
        const opacity = isHovered ? 0.95 : isHighlight ? 0.75 : 0.45;
        return (
          <g key={p.id}
             onMouseEnter={() => setHoveredPart(p.id)}
             onMouseLeave={() => setHoveredPart(null)}
             style={{ cursor: "pointer" }}>
            <circle cx={p.pos.x} cy={p.pos.y} r={p.pos.r}
              fill={p.color_hex} fillOpacity={opacity * 0.55}
              stroke={p.color_hex} strokeOpacity={opacity}
              strokeWidth={isHighlight ? 2 : 1.2} />
            {isHighlight && (
              <circle cx={p.pos.x} cy={p.pos.y} r={p.pos.r + 6}
                fill="none" stroke={activeSpecies.color} strokeWidth="1.2"
                strokeDasharray="3 3" opacity="0.7" />
            )}
            <line x1={p.pos.x} y1={p.pos.y} x2={p.label_anchor.x} y2={p.label_anchor.y}
              stroke="rgba(244,239,230,0.25)" strokeWidth="0.5" />
            <text x={p.label_anchor.x} y={p.label_anchor.y}
              fontSize="10" fill={isHovered || isHighlight ? "#F4EFE6" : "rgba(244,239,230,0.6)"}
              textAnchor={p.label_anchor.x < 100 ? "end" : p.label_anchor.x > 320 ? "start" : "middle"}
              fontFamily="Georgia, serif">
              {p.en}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PartCard({ part }) {
  if (!part) return (
    <div style={{ padding: 18, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
      左の脳図のいずれかの部位にカーソルを乗せると、機能と進化メモを表示します。
    </div>
  );
  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: part.color_hex }} />
        <div style={{ fontSize: 13, color: "#F4EFE6" }}>{part.jp}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>{part.en}</div>
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginBottom: 4, lineHeight: 1.6 }}>
        {part.def_jp}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 8, lineHeight: 1.7 }}>
        {part.function_jp}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", borderLeft: `2px solid ${part.color_hex}`, paddingLeft: 8, lineHeight: 1.7 }}>
        進化: {part.evolution_jp}
      </div>
    </div>
  );
}

function Timeline() {
  const yearMin = 0;
  const yearMax = 260;
  const H = 320;
  const yOf = (mya) => H - 20 - ((yearMax - mya) / yearMax) * (H - 40);

  return (
    <svg viewBox={`0 0 280 ${H}`} style={{ width: "100%", display: "block" }}>
      <line x1="60" y1="20" x2="60" y2={H - 20} stroke="rgba(244,239,230,0.18)" strokeWidth="1" />
      {[250, 200, 150, 100, 50, 0].map(t => (
        <g key={t}>
          <line x1="56" y1={yOf(t)} x2="64" y2={yOf(t)} stroke="rgba(244,239,230,0.2)" />
          <text x="50" y={yOf(t) + 3} fontSize="8" fill="rgba(244,239,230,0.35)" textAnchor="end">
            {t === 0 ? "現在" : `${t}Mya`}
          </text>
        </g>
      ))}
      {TIMELINE.map((e, i) => {
        const y = yOf(e.year_mya);
        const accent = e.emphasis ? "#B14A3D" : "rgba(244,239,230,0.7)";
        return (
          <g key={i}>
            <circle cx="60" cy={y} r={e.emphasis ? 5 : 3.5}
              fill={e.emphasis ? "#B14A3D" : "rgba(244,239,230,0.5)"}
              stroke={e.emphasis ? "#B14A3D" : "none"} />
            <line x1="65" y1={y} x2="80" y2={y} stroke={accent} strokeWidth="0.8" />
            <text x="84" y={y - 2} fontSize="10" fill={e.emphasis ? "#D86E5C" : "#F4EFE6"} fontFamily="Georgia, serif">
              {e.label_jp}
            </text>
            <text x="84" y={y + 10} fontSize="9" fill="rgba(244,239,230,0.4)">
              {e.note_jp.length > 32 ? e.note_jp.slice(0, 32) + "…" : e.note_jp}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SpeciesPanel({ species, selected, onSelect }) {
  const maxBrain = Math.max(...SPECIES.map(s => s.brain_g));
  const maxN = Math.max(...SPECIES.map(s => s.neurons_M));

  return (
    <div style={{ background: "#161616", borderRadius: 8, padding: 18, border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
        5 種の脳プロファイル <span style={{ color: CONFIDENCE_STYLE.estimate.fg }}>推定</span>
      </div>
      {species.map(s => {
        const on = s.name_jp === selected;
        const part = PARTS.find(p => p.id === s.highlight_part);
        return (
          <div key={s.name_jp}
               onClick={() => onSelect(s.name_jp)}
               style={{
                 padding: "10px 8px", marginBottom: 4, cursor: "pointer",
                 borderRadius: 4,
                 background: on ? "rgba(255,255,255,0.04)" : "transparent",
                 borderLeft: `2px solid ${on ? s.color : "transparent"}`
               }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: on ? s.color : "rgba(255,255,255,0.7)", width: 60 }}>
                {s.name_jp}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", flex: 1 }}>
                EQ {s.eq.toFixed(2)} · 脳 {s.brain_g}g · {s.neurons_M}M neurons
              </div>
              {part && (
                <div style={{ fontSize: 9, color: part.color_hex, padding: "1px 6px", border: `1px solid ${part.color_hex}55`, borderRadius: 2 }}>
                  {part.jp}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{ width: `${(s.brain_g / maxBrain) * 100}%`, height: "100%", background: s.color, opacity: on ? 1 : 0.5, borderRadius: 2 }} />
              </div>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{ width: `${(s.neurons_M / maxN) * 100}%`, height: "100%", background: s.color, opacity: on ? 1 : 0.5, borderRadius: 2 }} />
              </div>
            </div>
            {on && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.6 }}>
                {s.story_jp}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 10, lineHeight: 1.6 }}>
        左バー = 脳重 (g) ／ 右バー = pallium ニューロン推定数 (M)。文献の代表値ベースの推定。
      </div>
    </div>
  );
}

export default function BirdBrainExplorer() {
  const [selected, setSelected] = useState("カラス");
  const [hoveredPart, setHoveredPart] = useState(null);
  const activeSpecies = SPECIES.find(s => s.name_jp === selected);
  const focusPart = PARTS.find(p => p.id === (hoveredPart || activeSpecies?.highlight_part));

  return (
    <div style={{ background: "#0c0c0c", color: "rgba(255,255,255,0.85)", minHeight: "100vh", fontFamily: "'Georgia', serif", padding: "28px 20px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", marginBottom: 6, textTransform: "uppercase" }}>
            Chapter II · The Gap inside the Skull · Prototype
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>鳥の脳はどんな進化を辿ってきたのか</h1>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            {GAP.lede_jp}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {SPECIES.map(s => (
            <button key={s.name_jp} onClick={() => setSelected(s.name_jp)} style={{
              background: selected === s.name_jp ? s.color : "transparent",
              color: selected === s.name_jp ? "#0c0c0c" : s.color,
              border: `1.5px solid ${s.color}`,
              borderRadius: 20, padding: "5px 14px",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit"
            }}>
              {s.name_jp}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ background: "#161616", borderRadius: 8, padding: 18, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>
              脳の断面図 — 8 部位 × {activeSpecies.name_jp}の発達領域
            </div>
            <BrainSection
              activeSpecies={activeSpecies}
              hoveredPart={hoveredPart}
              setHoveredPart={setHoveredPart}
            />
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", marginTop: 10, lineHeight: 1.6 }}>
              点線円 = 選択中の鳥の発達突出領域。配色は design-system/colors.md（Fragapane 文法）。
              スキーマ図であり、実解剖図ではない。
            </div>
          </div>

          <div style={{ background: "#161616", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
            <PartCard part={focusPart} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ background: "#161616", borderRadius: 8, padding: 18, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>
              進化の縦軸 / Evolution timeline
            </div>
            <Timeline />
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 6, lineHeight: 1.6 }}>
              赤丸 = 物語の転回点（K-Pg 絶滅 ／ 2004 命名改訂）。
            </div>
          </div>

          <SpeciesPanel
            species={SPECIES}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <div style={{
          background: "rgba(177,74,61,0.06)",
          borderRadius: 8, padding: "16px 18px",
          border: "1px solid rgba(177,74,61,0.25)",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#D86E5C", marginBottom: 6 }}>
            ずれの核心 / The Gap
          </div>
          <div style={{ fontSize: 14, color: "#F4EFE6", marginBottom: 6, fontFamily: "Georgia, serif" }}>
            {GAP.title_jp}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginBottom: 8 }}>
            {GAP.title_en}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
            {GAP.lede_jp}
          </div>
        </div>

        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", lineHeight: 1.8 }}>
          Sources: {GAP.primary_sources.join(" · ")}<br />
          Note: 脳重・ニューロン数は文献代表値ベースの推定（estimate バッジ運用予定）。
          解剖配置はスキーマ簡略図、実解剖学的精度は持たない。
        </div>
      </div>
    </div>
  );
}
