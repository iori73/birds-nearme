import { useState } from "react";
import brainData from "../data/brain_parts.json";
import {
  PART_POSITIONS,
  PART_RADII,
  PART_RADII_1908,
  BEHAVIOR_AXES,
  BEHAVIOR_PROFILES,
  auraPoints,
  filamentLengths,
  ladderRungs,
  filamentTips,
  skullOutlinePath,
  skullOutline1908Path,
} from "./lib/brainGeometry.js";
import {
  Glyph,
  PartFillPatterns,
  STROKE_PATTERNS,
  STROKE_WEIGHTS,
  PART_ORDER,
} from "./lib/glyphs.jsx";
import {
  jitteredEllipsePath,
  jitteredPolyline,
  jitteredCurve,
  makeRng,
} from "./lib/jitter.js";

// Tokens (mirrors design-system/colors.md). Hard-coded here so the plate is
// self-contained and reproducible.
const PAPER       = "#F4EFE6";
const PAPER_WARM  = "#EDE4D3";
const INK_DEEP    = "#2A2520";
const INK_MID     = "#4F4840";
const INK_SOFT    = "#8C8378";
const SEPIA       = "#7B5B40";  // 1908 reading line
const EMPHASIS    = "#B14A3D";  // 2004 dot, K-Pg dot — and nowhere else

const PARTS = brainData.parts;
const SPECIES = brainData.species_brain;
const TIMELINE = brainData.evolution_timeline;
const GAP = brainData.gap_core;

const partById = Object.fromEntries(PARTS.map(p => [p.id, p]));
const PART_LABELS_JP = {
  olfactory:"嗅球", pallium:"外套", striatum:"線条体", midbrain:"中脳",
  thalamus:"視床",  chiasm:"視交叉", hindbrain:"後脳", cerebellum:"小脳",
};
const PART_LABELS_EN = {
  olfactory:"Olfactory bulb", pallium:"Pallium", striatum:"Striatum",
  midbrain:"Midbrain (Optic tectum)", thalamus:"Thalamus", chiasm:"Optic chiasm",
  hindbrain:"Hindbrain", cerebellum:"Cerebellum",
};
const PART_NUM = Object.fromEntries(PART_ORDER.map((id, i) => [id, i + 1]));
const CIRCLED = ["①","②","③","④","⑤","⑥","⑦","⑧"];

const VB_W = 1440;
const VB_H = 2280;
const MARGIN = 40;

// ── Shared building blocks ────────────────────────────────────────────────

function PaperBorder() {
  const x = MARGIN, y = MARGIN, w = VB_W - MARGIN * 2, h = VB_H - MARGIN * 2;
  const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  return (
    <path d={jitteredPolyline(corners, 7, 0.8)} fill="none"
      stroke={INK_SOFT} strokeWidth="0.6" />
  );
}

function HandText({ x, y, children, size = 12, weight = 400, italic = false,
                    fill = INK_DEEP, anchor = "start", family }) {
  const fam = family || `'Spectral', 'Noto Serif JP', serif`;
  return (
    <text x={x} y={y} fontFamily={fam} fontSize={size} fontWeight={weight}
      fontStyle={italic ? "italic" : "normal"} fill={fill} textAnchor={anchor}
      style={{ letterSpacing: "0.02em" }}>
      {children}
    </text>
  );
}

// ── Section 1: Header ─────────────────────────────────────────────────────

function Header() {
  return (
    <g>
      <line x1={MARGIN} y1={70} x2={MARGIN + 80} y2={70}
        stroke={INK_SOFT} strokeWidth="0.6" />
      <HandText x={MARGIN} y={86} size={10} fill={INK_SOFT}>
        図 II.
      </HandText>
      <HandText x={MARGIN + 30} y={86} size={10} fill={INK_SOFT} italic>
        Misread Brain — A Specimen Plate
      </HandText>

      <HandText x={VB_W / 2} y={132} size={36} weight={500} anchor="middle">
        鳥の脳、二度読まれた頭蓋
      </HandText>
      <HandText x={VB_W / 2} y={160} size={14} italic anchor="middle" fill={INK_MID}>
        The same organ, drawn a hundred years apart — Edinger 1908 / Jarvis 2005
      </HandText>
    </g>
  );
}

// ── Section 2: Twin Brain Centerpiece ────────────────────────────────────
// Two readings of the SAME brain on the SAME axis, deliberately offset by
// 12/8 px so the eye reads them as a misregistered print.

function PartKeyColumn({ originX, originY }) {
  // Right-margin numbered key. One row per part.
  const rowH = 30;
  return (
    <g transform={`translate(${originX}, ${originY})`}>
      <line x1={0} y1={-12} x2={60} y2={-12}
        stroke={INK_SOFT} strokeWidth="0.5" />
      <HandText x={0} y={-2} size={9} italic fill={INK_SOFT}>
        Key · 八部位
      </HandText>
      {PART_ORDER.map((id, i) => {
        const y = i * rowH + 10;
        const color = partById[id].color_hex;
        return (
          <g key={id} transform={`translate(0, ${y})`}>
            {/* number */}
            <circle cx={6} cy={5} r={7} fill="none" stroke={INK_SOFT} strokeWidth="0.5" />
            <HandText x={6} y={9} size={9} anchor="middle" fill={INK_DEEP}>
              {i + 1}
            </HandText>
            {/* stroke sample */}
            <line x1={20} y1={5} x2={48} y2={5}
              stroke={color}
              strokeWidth={STROKE_WEIGHTS[id] * 1.0}
              strokeDasharray={STROKE_PATTERNS[id] === "0" ? undefined : STROKE_PATTERNS[id]} />
            {/* glyph */}
            <Glyph id={id} cx={58} cy={5} color={color} seed={i + 1} size={4} />
            {/* labels */}
            <HandText x={72} y={3} size={10} fill={INK_DEEP}>
              {PART_LABELS_EN[id]}
            </HandText>
            <HandText x={72} y={16} size={9} italic fill={INK_MID}>
              {PART_LABELS_JP[id]}
            </HandText>
          </g>
        );
      })}
    </g>
  );
}

function TwinBrain({ hovered, setHovered }) {
  const cx = VB_W / 2;
  const cy = 640;
  const SCALE = 2.0;

  const skull2005 = skullOutlinePath(SCALE);
  const skull1908 = skullOutline1908Path(SCALE);

  // Misregistration: visibly offset so the eye reads "two layers."
  const OFFSET_X = 12;
  const OFFSET_Y = 8;

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <PartFillPatterns />

      {/* ─── 1908 reading (BACK layer, sepia, flatter cranium) ───────── */}
      <g opacity="0.78">
        <path d={skull1908} fill="none" stroke={SEPIA} strokeWidth="1.0" />
        {/* Striatum DOMINATES — large filled area (the misreading) */}
        <ellipse
          cx={PART_POSITIONS.striatum.x}
          cy={PART_POSITIONS.striatum.y - 8}
          rx={PART_RADII_1908.striatum * 1.05}
          ry={PART_RADII_1908.striatum * 0.78}
          fill={SEPIA} fillOpacity="0.16"
          stroke={SEPIA} strokeWidth="0.9" />
        {/* Reduced cross-hatching — narrowed window so the 2004 red dot is
            no longer overrun. */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = PART_POSITIONS.striatum.y - 40 + i * 12;
          return (
            <line
              key={i}
              x1={PART_POSITIONS.striatum.x - 50}
              y1={y}
              x2={PART_POSITIONS.striatum.x + 50}
              y2={y - 3}
              stroke={SEPIA} strokeWidth="0.25" opacity="0.28"
            />
          );
        })}
        {/* Pallium reduced to a thin rim hugging the dorsal vault */}
        <path
          d={`M ${-120} ${-92} Q ${0} ${-105} ${100} ${-72}`}
          fill="none" stroke={SEPIA} strokeWidth="0.7" />
      </g>

      {/* ─── 2005 reading (FRONT layer, offset, ink, 8 patterned lobes) ─ */}
      <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
        <path d={skull2005} fill={PAPER} fillOpacity="0.6"
          stroke={INK_DEEP} strokeWidth="1.2" />

        {PART_ORDER.map(id => {
          const pos = PART_POSITIONS[id];
          const r = PART_RADII[id];
          const isHovered = hovered === id;
          const sw = STROKE_WEIGHTS[id];
          const dash = STROKE_PATTERNS[id];
          return (
            <g key={id}
               onMouseEnter={() => setHovered(id)}
               onMouseLeave={() => setHovered(null)}
               style={{ cursor: "pointer" }}>
              <ellipse cx={pos.x} cy={pos.y} rx={r} ry={r * 0.82}
                fill={`url(#pat-${id})`} fillOpacity={isHovered ? 0.95 : 0.72}
                stroke={partById[id].color_hex}
                strokeWidth={sw + (isHovered ? 0.4 : 0)}
                strokeDasharray={dash === "0" ? undefined : dash} />
            </g>
          );
        })}

        {/* In-skull number badges (replaces leader-line label loop) */}
        {PART_ORDER.map(id => {
          const pos = PART_POSITIONS[id];
          const n = PART_NUM[id];
          return (
            <g key={`num-${id}`} pointerEvents="none">
              <circle cx={pos.x} cy={pos.y} r={8.5}
                fill={PAPER} fillOpacity="0.85"
                stroke={INK_SOFT} strokeWidth="0.5" />
              <HandText x={pos.x} y={pos.y + 3.5} size={9.5} anchor="middle"
                fill={INK_DEEP}>
                {n}
              </HandText>
            </g>
          );
        })}
      </g>

      {/* ─── 1908 / 2005 date stack — left side, vertical (old above, new below) ─ */}
      <g pointerEvents="none">
        <line x1={-360} y1={-200} x2={-360} y2={210}
          stroke={INK_SOFT} strokeWidth="0.4" />

        {/* 1908 — top */}
        <HandText x={-352} y={-188} size={10} italic fill={SEPIA}>
          1908
        </HandText>
        <HandText x={-352} y={-172} size={12} fill={SEPIA}>
          Edinger
        </HandText>
        <HandText x={-352} y={-156} size={9.5} italic fill={SEPIA}>
          “a primitive striatal brain”
        </HandText>
        <HandText x={-352} y={-138} size={9} italic fill={SEPIA}>
          線条体が前脳を支配し、
        </HandText>
        <HandText x={-352} y={-124} size={9} italic fill={SEPIA}>
          思考は爬虫類的とされた読み。
        </HandText>

        {/* 2005 — bottom */}
        <HandText x={-352} y={150} size={10} italic fill={INK_DEEP}>
          2005
        </HandText>
        <HandText x={-352} y={166} size={12} fill={INK_DEEP}>
          Jarvis et al.
        </HandText>
        <HandText x={-352} y={182} size={9.5} italic fill={INK_MID}>
          “a cortex-like canonical circuit”
        </HandText>
        <HandText x={-352} y={200} size={9} italic fill={INK_MID}>
          外套（pallium）に独自の認知回路を
        </HandText>
        <HandText x={-352} y={214} size={9} italic fill={INK_MID}>
          持つ脳と書き直された。
        </HandText>
      </g>

      {/* ─── 2004 命名改訂 — margin gloss above the skull ─────────────── */}
      <g pointerEvents="none">
        {/* dot at the original location */}
        <circle cx={-32} cy={-20} r={6.5} fill={EMPHASIS} />
        <circle cx={-32} cy={-20} r={13} fill="none"
          stroke={EMPHASIS} strokeWidth="0.5" opacity="0.5" />
        {/* slim hand-drawn callout going up to the margin */}
        <path d={jitteredCurve(-32, -27, -32, -250, 9, -8, 0.4)}
          fill="none" stroke={EMPHASIS} strokeWidth="0.55" />
        <HandText x={-32} y={-262} size={11} italic anchor="middle" fill={EMPHASIS}>
          2004 命名改訂
        </HandText>
        <HandText x={-32} y={-248} size={9} italic anchor="middle" fill={EMPHASIS}>
          Avian Brain Nomenclature Consortium
        </HandText>
      </g>

      {/* Caption explaining the misregistration trick */}
      <HandText x={0} y={300} size={12} italic anchor="middle" fill={INK_MID}>
        二つの解釈、ひとつの臓器 — その {OFFSET_X}px のずれが、この図の主題である。
      </HandText>
      <HandText x={0} y={318} size={10} italic anchor="middle" fill={INK_SOFT}>
        Two readings, one organ. The brain didn't change — the reader did.
      </HandText>

      {/* ─── Right-margin numbered key ─────────────────────────────────── */}
      <PartKeyColumn originX={250} originY={-220} />
    </g>
  );
}

// ── Section 3: Timeline Rail ─────────────────────────────────────────────

function TimelineRail() {
  // Log-compressed horizontal rail. Left = 250 Mya, right ≈ now.
  const x0 = MARGIN + 60;
  const x1 = VB_W - MARGIN - 60;
  const y  = 1220;
  const W = x1 - x0;
  const denom = Math.log10(261);
  const xOf = (mya) => x1 - (Math.log10(Math.max(0, mya) + 1) / denom) * W;

  const tickYears = [250, 200, 150, 100, 66, 50, 30, 10, 5, 1, 0.001];
  const formatTick = (t) => t === 0.001 ? "now"
    : t < 1 ? `${(t * 1000).toFixed(0)} Kya` : `${t} Mya`;

  // K-Pg & 2004 — for the linking arc
  const kpgX = xOf(66);
  const revX = xOf(0.0001);
  const archMidX = (kpgX + revX) / 2;
  const archTopY = y - 70;
  const archPath = `M ${kpgX} ${y - 14} Q ${archMidX} ${archTopY} ${revX} ${y - 14}`;

  return (
    <g>
      {/* Section eyebrow */}
      <line x1={MARGIN} y1={1130} x2={MARGIN + 60} y2={1130}
        stroke={INK_SOFT} strokeWidth="0.6" />
      <HandText x={MARGIN} y={1148} size={10} italic fill={INK_SOFT}>
        Geological rail · 二つの転回点
      </HandText>
      <HandText x={MARGIN} y={1170} size={11} fill={INK_MID}>
        鳥脳の進化は連続ではなく、二つの rupture（K-Pg と 2004 命名改訂）で分節される。
      </HandText>

      {/* Geological era bands behind the rail */}
      <rect x={x0} y={y - 22} width={kpgX - x0} height={44}
        fill={PAPER_WARM} fillOpacity="0.6" />
      <rect x={kpgX} y={y - 22} width={x1 - kpgX} height={44}
        fill={PAPER} fillOpacity="0.0" />
      {/* Era labels (very small caps) */}
      <HandText x={(x0 + kpgX) / 2} y={y - 28} size={9} italic anchor="middle" fill={INK_SOFT}>
        Mesozoic · 中生代
      </HandText>
      <HandText x={(kpgX + x1) / 2} y={y - 28} size={9} italic anchor="middle" fill={INK_SOFT}>
        Cenozoic · 新生代
      </HandText>

      {/* Linking arc between the two ruptures */}
      <path d={archPath} fill="none" stroke={EMPHASIS}
        strokeWidth="0.5" opacity="0.55" strokeDasharray="3 2" />
      <HandText x={archMidX} y={archTopY - 6} size={9.5} italic
        anchor="middle" fill={EMPHASIS}>
        two ruptures, 66 Myr apart
      </HandText>

      {/* Baseline (jittered) */}
      <path
        d={jitteredPolyline([[x0, y], [x1, y]], 11, 0.7)}
        fill="none" stroke={INK_DEEP} strokeWidth="0.8" />

      {/* Year ticks */}
      {tickYears.map((t, i) => {
        const tx = xOf(t);
        const isMajor = [250, 100, 66, 10, 0.001].includes(t);
        return (
          <g key={t}>
            <line x1={tx} y1={y - (isMajor ? 5 : 3)} x2={tx} y2={y + (isMajor ? 5 : 3)}
              stroke={INK_SOFT} strokeWidth={isMajor ? 0.7 : 0.5} />
            {isMajor && (
              <HandText x={tx} y={y + 20} size={9} fill={INK_SOFT} anchor="middle" italic>
                {formatTick(t)}
              </HandText>
            )}
          </g>
        );
      })}

      {/* Events */}
      {TIMELINE.map((e, i) => {
        const ex = xOf(e.year_mya);
        const isE = !!e.emphasis;
        const above = i % 2 === 0;
        const labelY = above ? y - 42 : y + 44;
        return (
          <g key={i}>
            <circle cx={ex} cy={y} r={isE ? 6 : 3.2}
              fill={isE ? EMPHASIS : INK_MID} />
            {isE && (
              <circle cx={ex} cy={y} r={11} fill="none"
                stroke={EMPHASIS} strokeWidth="0.5" opacity="0.5" />
            )}
            <line x1={ex} y1={y + (above ? -8 : 8)} x2={ex} y2={labelY + (above ? 6 : -10)}
              stroke={isE ? EMPHASIS : INK_SOFT} strokeWidth="0.5" />
            <HandText x={ex} y={labelY} size={11} anchor="middle"
              fill={isE ? EMPHASIS : INK_DEEP}>
              {e.label_jp}
            </HandText>
            <HandText x={ex} y={labelY + 14} size={9} italic anchor="middle" fill={INK_SOFT}>
              {e.label_en}
            </HandText>
          </g>
        );
      })}
    </g>
  );
}

// ── Section 4: 5-species specimen row ─────────────────────────────────────

function SpeciesPanel({ species, slotX, slotW, slotY, slotH, hoveredPart, setHoveredPart }) {
  const cx = slotX + slotW / 2;
  const cy = slotY + 250;          // skull center within panel
  const baseR = 72;
  const tips = filamentTips(cx, cy, baseR + 14, 8);
  const len = filamentLengths(species);

  // Aura — slightly larger and more visible
  const aura = auraPoints(species.name_jp, cx, cy, baseR + 38);

  // Brain mass + neuron density ladders
  const massLadder = ladderRungs(species.brain_g_range, species.brain_g);
  const neuronLadder = ladderRungs(species.neurons_M_range, species.neurons_M);

  // Skull outline scaled for panels
  const skull = skullOutlinePath(0.50);
  const tint = species.color;
  const ribbonsSeed = species.name_jp.charCodeAt(0);

  return (
    <g>
      {/* Panel hairline divider */}
      {slotX > MARGIN + 80 && (
        <line x1={slotX - 2} y1={slotY + 8} x2={slotX - 2} y2={slotY + slotH - 8}
          stroke={INK_SOFT} strokeWidth="0.4" opacity="0.5" />
      )}

      {/* Species name strip */}
      <rect x={slotX + 18} y={slotY + 6} width={slotW - 36} height={28}
        fill={tint} fillOpacity="0.16" stroke={tint} strokeWidth="0.5"
        strokeOpacity="0.4" />
      <HandText x={cx} y={slotY + 26} size={16} weight={500} anchor="middle">
        {species.name_jp}
      </HandText>
      <HandText x={cx} y={slotY + 50} size={9} italic anchor="middle" fill={INK_SOFT}>
        {species.scientific_name}
      </HandText>
      <HandText x={cx} y={slotY + 64} size={9} anchor="middle" fill={INK_MID}>
        {species.name_en}
      </HandText>

      {/* Aura ring (behavioral silhouette) */}
      <path d={aura.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") + " Z"}
        fill={tint} fillOpacity="0.10"
        stroke={tint} strokeWidth="0.9" opacity="0.9" />

      {/* Skull outline */}
      <g transform={`translate(${cx}, ${cy})`}>
        <path d={skull} fill={PAPER_WARM} fillOpacity="0.5"
          stroke={INK_DEEP} strokeWidth="0.9" />

        {/* 8 part lobes (small, anatomical) */}
        {PART_ORDER.map(id => {
          const pos = PART_POSITIONS[id];
          const r = PART_RADII[id] * 0.28;
          const px = pos.x * 0.50, py = pos.y * 0.50;
          return (
            <ellipse key={id} cx={px} cy={py} rx={r} ry={r * 0.82}
              fill={`url(#pat-${id})`} fillOpacity={hoveredPart === id ? 0.9 : 0.6}
              stroke={partById[id].color_hex} strokeWidth={STROKE_WEIGHTS[id] * 0.6}
              strokeDasharray={STROKE_PATTERNS[id] === "0" ? undefined : STROKE_PATTERNS[id]} />
          );
        })}
      </g>

      {/* 8 filaments + glyph tips */}
      {tips.map((tip, i) => {
        const id = tip.partId;
        const startGap = 6;
        const innerX = cx + Math.cos(tip.angle) * (baseR + startGap);
        const innerY = cy + Math.sin(tip.angle) * (baseR + startGap);
        const outerX = cx + Math.cos(tip.angle) * (baseR + startGap + len.high);
        const outerY = cy + Math.sin(tip.angle) * (baseR + startGap + len.high);
        const innerOffset = baseR + startGap + len.low;
        const innerLowX = cx + Math.cos(tip.angle) * innerOffset;
        const innerLowY = cy + Math.sin(tip.angle) * innerOffset;

        return (
          <g key={id}
             onMouseEnter={() => setHoveredPart(id)}
             onMouseLeave={() => setHoveredPart(null)}>
            <path d={jitteredCurve(innerX, innerY, outerX, outerY, ribbonsSeed + i, 0, 0.5)}
              fill="none" stroke={partById[id].color_hex}
              strokeWidth={STROKE_WEIGHTS[id] * 0.95}
              strokeDasharray={STROKE_PATTERNS[id] === "0" ? undefined : STROKE_PATTERNS[id]}
              opacity={hoveredPart === id ? 1 : 0.88} />
            <line
              x1={innerLowX + Math.cos(tip.angle + Math.PI / 2) * 2.5}
              y1={innerLowY + Math.sin(tip.angle + Math.PI / 2) * 2.5}
              x2={innerLowX + Math.cos(tip.angle - Math.PI / 2) * 2.5}
              y2={innerLowY + Math.sin(tip.angle - Math.PI / 2) * 2.5}
              stroke={partById[id].color_hex} strokeWidth="0.7" />
            <Glyph id={id} cx={outerX} cy={outerY}
              color={partById[id].color_hex} seed={ribbonsSeed + i} size={6} />
          </g>
        );
      })}

      {/* Twin uncertainty ladders — brain mass (left) + neuron count (right) */}
      <g transform={`translate(${slotX + 24}, ${slotY + slotH - 200})`}>
        <line x1={0} y1={0} x2={0} y2={90}
          stroke={INK_SOFT} strokeWidth="0.4" />
        {Array.from({ length: massLadder.count }, (_, i) => {
          const yy = (i / Math.max(massLadder.count - 1, 1)) * 90;
          return <line key={i} x1={-3} y1={yy} x2={3} y2={yy}
            stroke={INK_DEEP} strokeWidth="0.5" />;
        })}
        <HandText x={6} y={-6} size={8} italic fill={INK_SOFT}>
          脳重 g
        </HandText>
        <HandText x={6} y={6} size={9} fill={INK_DEEP}>
          {massLadder.high.toFixed(1)}
        </HandText>
        <HandText x={6} y={94} size={9} fill={INK_DEEP}>
          {massLadder.low.toFixed(1)}
        </HandText>
      </g>

      <g transform={`translate(${slotX + slotW - 60}, ${slotY + slotH - 200})`}>
        <line x1={0} y1={0} x2={0} y2={90}
          stroke={INK_SOFT} strokeWidth="0.4" />
        {Array.from({ length: neuronLadder.count }, (_, i) => {
          const yy = (i / Math.max(neuronLadder.count - 1, 1)) * 90;
          return <line key={i} x1={-3} y1={yy} x2={3} y2={yy}
            stroke={INK_DEEP} strokeWidth="0.5" />;
        })}
        <HandText x={6} y={-6} size={8} italic fill={INK_SOFT}>
          ニューロン M
        </HandText>
        <HandText x={6} y={6} size={9} fill={INK_DEEP}>
          {neuronLadder.high.toFixed(0)}
        </HandText>
        <HandText x={6} y={94} size={9} fill={INK_DEEP}>
          {neuronLadder.low.toFixed(0)}
        </HandText>
      </g>

      {/* Story note */}
      <foreignObject x={slotX + 14} y={slotY + slotH - 100}
        width={slotW - 28} height={88}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          fontFamily: "'Spectral', 'Noto Serif JP', serif",
          fontSize: 10, fontStyle: "italic",
          color: INK_MID, lineHeight: 1.7,
          padding: 0,
        }}>
          {species.story_jp}
        </div>
      </foreignObject>

      {/* Density range — ranges only */}
      <HandText x={slotX + slotW / 2} y={slotY + slotH - 8} size={9} anchor="middle" fill={INK_SOFT} italic>
        密度 {len.loVal.toFixed(0)}–{len.hiVal.toFixed(0)} M / g
      </HandText>
    </g>
  );
}

function SpeciesRow({ hoveredPart, setHoveredPart }) {
  const slotW = 272;
  const slotH = 660;
  const slotY = 1380;
  const startX = MARGIN + (VB_W - MARGIN * 2 - slotW * 5) / 2;

  return (
    <g>
      <line x1={MARGIN} y1={slotY - 30} x2={MARGIN + 60} y2={slotY - 30}
        stroke={INK_SOFT} strokeWidth="0.6" />
      <HandText x={MARGIN} y={slotY - 12} size={10} italic fill={INK_SOFT}>
        Pl. 1–5 · 五枚の標本
      </HandText>
      <HandText x={MARGIN} y={slotY + 8} size={11} fill={INK_MID}>
        川崎市幸区の身近な 5 種を、同じ頭蓋の上に等しい面積で並べる。
      </HandText>

      {SPECIES.map((s, i) => (
        <SpeciesPanel
          key={s.name_jp}
          species={s}
          slotX={startX + i * slotW}
          slotW={slotW}
          slotY={slotY + 30}
          slotH={slotH}
          hoveredPart={hoveredPart}
          setHoveredPart={setHoveredPart}
        />
      ))}
    </g>
  );
}

// ── Section 5: Footnotes ──────────────────────────────────────────────────

function Footnotes() {
  const y0 = 2120;
  // 12-col grid
  const totalW = VB_W - MARGIN * 2;
  const colA_w = totalW * 4 / 12 - 12;
  const colB_x = MARGIN + totalW * 4 / 12 + 6;
  const colB_w = totalW * 5 / 12 - 12;
  const colC_x = MARGIN + totalW * 9 / 12 + 6;
  const colC_w = totalW * 3 / 12 - 6;

  const sources = GAP.primary_sources;

  return (
    <g>
      <line x1={MARGIN} y1={y0 - 20} x2={VB_W - MARGIN} y2={y0 - 20}
        stroke={INK_SOFT} strokeWidth="0.4" />

      {/* Col A: Lede — gap_core */}
      <foreignObject x={MARGIN} y={y0} width={colA_w} height={140}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          fontFamily: "'Spectral', 'Noto Serif JP', serif",
          fontSize: 11, color: INK_DEEP, lineHeight: 1.85,
        }}>
          <div style={{ fontStyle: "italic", color: INK_SOFT, marginBottom: 6, fontSize: 9 }}>
            ずれの核心 / The Gap
          </div>
          <div style={{ marginBottom: 6 }}>{GAP.title_jp}</div>
          <div style={{ fontStyle: "italic", color: INK_MID, fontSize: 10 }}>
            {GAP.title_en}
          </div>
        </div>
      </foreignObject>

      {/* Col B: 8-row legend */}
      <g transform={`translate(${colB_x}, ${y0})`}>
        <HandText x={0} y={0} size={9} italic fill={INK_SOFT}>
          凡例 / Legend
        </HandText>
        {PART_ORDER.map((id, i) => {
          const ly = 14 + i * 16;
          const color = partById[id].color_hex;
          return (
            <g key={id} transform={`translate(0, ${ly})`}>
              <line x1={0} y1={5} x2={28} y2={5}
                stroke={color}
                strokeWidth={STROKE_WEIGHTS[id] * 0.9}
                strokeDasharray={STROKE_PATTERNS[id] === "0" ? undefined : STROKE_PATTERNS[id]} />
              <Glyph id={id} cx={36} cy={5} color={color} seed={i + 1} size={4} />
              <circle cx={50} cy={5} r={6.5} fill="none" stroke={INK_SOFT} strokeWidth="0.4" />
              <HandText x={50} y={8} size={8.5} anchor="middle" fill={INK_DEEP}>
                {i + 1}
              </HandText>
              <HandText x={64} y={8} size={9.5} fill={INK_DEEP}>
                {PART_LABELS_JP[id]}
              </HandText>
              <HandText x={120} y={8} size={9} italic fill={INK_MID}>
                {PART_LABELS_EN[id]}
              </HandText>
            </g>
          );
        })}
      </g>

      {/* Col C: Sources + caveats with numbered footnotes */}
      <foreignObject x={colC_x} y={y0} width={colC_w} height={150}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          fontFamily: "'Spectral', 'Noto Serif JP', serif",
          fontSize: 8.7, color: INK_MID, lineHeight: 1.7,
        }}>
          <div style={{ fontStyle: "italic", color: INK_SOFT, marginBottom: 6, fontSize: 9 }}>
            出典 / Sources
          </div>
          {sources.map((s, i) => (
            <div key={i} style={{ marginBottom: 2, color: INK_DEEP }}>
              <span style={{ color: INK_SOFT }}>[{i + 1}]</span> {s}
            </div>
          ))}
          <div style={{ marginTop: 8, fontStyle: "italic", color: INK_SOFT, fontSize: 8.3 }}>
            EQ は方法論的議論があるため本図では描画しない（Healy &amp; Rowe 2007）。
            数値はすべて文献の代表値から導いた範囲 [1][2]。直接計測の少ない種ではより広く取っている。
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

// ── Top-level component ───────────────────────────────────────────────────

export default function BrainSpecimenPlate() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      background: PAPER, minHeight: "100vh", padding: "20px 0",
      fontFamily: "'Spectral', 'Noto Serif JP', serif",
    }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ width: "100%", maxWidth: 1400, display: "block", margin: "0 auto" }}
        xmlns="http://www.w3.org/2000/svg">
        <rect width={VB_W} height={VB_H} fill={PAPER} />

        <PaperBorder />
        <Header />
        <TwinBrain hovered={hovered} setHovered={setHovered} />
        <TimelineRail />
        <SpeciesRow hoveredPart={hovered} setHoveredPart={setHovered} />
        <Footnotes />
      </svg>
    </div>
  );
}
