// Deterministic geometry derivation for the bird brain plate.
// Takes data/brain_parts.json content and produces shape parameters
// that the renderer turns into SVG. Reproducible — same data → same paths.

import { PART_ORDER } from "./glyphs.jsx";

// Anatomical positions of the 8 brain parts in the centerpiece skull.
// Coordinates are RELATIVE to the skull's local frame (center at 0,0).
// All 5 species share these positions — anatomy is common; only the
// species panels' filament tips differ.
export const PART_POSITIONS = {
  olfactory:  { x: -120, y:  20, label_anchor: "left" },
  pallium:    { x:    0, y: -90, label_anchor: "top" },
  striatum:   { x:    0, y:   0, label_anchor: "right" },
  midbrain:   { x:   65, y: -45, label_anchor: "topright" },
  thalamus:   { x:   30, y:  -5, label_anchor: "right" },
  chiasm:     { x:  -30, y:  55, label_anchor: "bottom" },
  hindbrain:  { x:  120, y:  55, label_anchor: "right" },
  cerebellum: { x:  120, y: -25, label_anchor: "right" },
};

// Lobe radii within the skull for each part.
export const PART_RADII = {
  olfactory:  18,
  pallium:    65,  // dominant in modern reading
  striatum:   30,
  midbrain:   24,
  thalamus:   12,
  chiasm:      9,
  hindbrain:  18,
  cerebellum: 28,
};

// Edinger 1908 (mis)reading: striatum dominant, pallium minimal.
// We draw the SAME centerpiece twice; this is the older interpretation.
export const PART_RADII_1908 = {
  olfactory:  18,
  pallium:    18,    // minimal — drawn as just a thin rim
  striatum:   80,    // dominant — fills most of forebrain
  midbrain:   24,
  thalamus:   12,
  chiasm:      9,
  hindbrain:  18,
  cerebellum: 28,
};

// Behavior axes — qualitative profile, labeled "estimate" in the UI.
// 0..1 scale, no ranking implied — used only to vary the aura silhouette.
// Sourced subjectively from species notes; flagged as qualitative.
export const BEHAVIOR_AXES = ["tool", "mimic", "navigate", "social", "urban"];

export const BEHAVIOR_PROFILES = {
  "カラス":   { tool: 0.95, mimic: 0.30, navigate: 0.55, social: 0.75, urban: 0.85 },
  "オナガ":   { tool: 0.45, mimic: 0.30, navigate: 0.55, social: 0.85, urban: 0.55 },
  "ムクドリ": { tool: 0.20, mimic: 0.85, navigate: 0.45, social: 0.95, urban: 0.85 },
  "ドバト":   { tool: 0.20, mimic: 0.20, navigate: 0.95, social: 0.65, urban: 0.95 },
  "スズメ":   { tool: 0.20, mimic: 0.30, navigate: 0.55, social: 0.65, urban: 0.85 },
};

// Build the aura polyline points for a species panel.
// Returns N polar samples interpolated through the 5 behavior axes.
export function auraPoints(species, cx, cy, baseR, samples = 96) {
  const profile = BEHAVIOR_PROFILES[species] || {};
  const axisCount = BEHAVIOR_AXES.length;
  const pts = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    // Map angle to nearest two behavior axes and lerp.
    const axisFloat = (i / samples) * axisCount;
    const a = Math.floor(axisFloat) % axisCount;
    const b = (a + 1) % axisCount;
    const f = axisFloat - Math.floor(axisFloat);
    const va = profile[BEHAVIOR_AXES[a]] ?? 0.5;
    const vb = profile[BEHAVIOR_AXES[b]] ?? 0.5;
    // Smooth-step the interpolation so the aura has lobes, not zigzags.
    const fs = f * f * (3 - 2 * f);
    const v = va * (1 - fs) + vb * fs;
    // Add a tiny higher-frequency wobble per species so silhouettes vary.
    const seed = species.charCodeAt(0) + species.length;
    const wobble = Math.sin(t * 11 + seed) * 0.02;
    const r = baseR * (0.86 + v * 0.14 + wobble);
    pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
  }
  pts.push(pts[0]);
  return pts;
}

// Filament length for a species — encodes neuron density per gram of brain.
// Range bar (low, high) becomes a tapered ribbon on screen.
// Length is normalized so even the shortest is visible; the *range*
// (gap between low and high) is the honest signal.
export function filamentLengths(species) {
  const lo = species.density_per_g_range?.[0] ?? species.neurons_M / Math.max(species.brain_g, 0.001);
  const hi = species.density_per_g_range?.[1] ?? lo * 1.25;
  // Map density (M neurons/g) onto pixel length. Square-root scale keeps
  // the largest from dominating; values are tuned to fit a 272-wide slot.
  const toPx = (d) => 22 + Math.sqrt(d) * 5.4;
  return { low: toPx(lo), high: toPx(hi), loVal: lo, hiVal: hi };
}

// Uncertainty ladder: small dashes whose count reflects how wide the
// confidence band is. Wider band = more rungs = visible uncertainty.
export function ladderRungs(rangeArr, fallbackPoint) {
  if (!rangeArr) {
    // Fallback: draw a single rung (no honest range to show)
    return { count: 1, low: fallbackPoint, high: fallbackPoint, fabricated: true };
  }
  const [lo, hi] = rangeArr;
  const spread = (hi - lo) / Math.max(hi, 1);  // 0..1
  // 4 to 12 rungs based on relative spread.
  const count = Math.max(4, Math.min(12, Math.round(4 + spread * 60)));
  return { count, low: lo, high: hi, fabricated: false };
}

// Build the radial filament tip positions around the skull center.
export function filamentTips(cx, cy, baseR, count = 8) {
  const tips = [];
  for (let i = 0; i < count; i++) {
    // Start from the top, distribute evenly clockwise.
    const t = -Math.PI / 2 + (i / count) * Math.PI * 2;
    tips.push({ partId: PART_ORDER[i], angle: t, x: cx + Math.cos(t) * baseR, y: cy + Math.sin(t) * baseR });
  }
  return tips;
}

// A common smooth skull outline (lateral view, simplified) used for the
// SHARED anatomy. Built from a Catmull-Rom-to-Bezier conversion so the
// curve is genuinely smooth rather than chunkily approximated.
// Coordinates in local frame, center near (0,0). Beak-end on the LEFT,
// brainstem on the RIGHT.
function catmullRomToBezier(pts, closed = true) {
  const n = pts.length;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - (closed ? 0 : 1); i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i % n];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + (closed ? " Z" : "");
}

const SKULL_BASE_PTS = [
  [-150,    0],
  [-140,  -55],
  [-100,  -92],
  [ -30, -108],
  [  55, -102],
  [ 110,  -82],
  [ 138,  -48],
  [ 156,  -10],
  [ 152,   30],
  [ 130,   65],
  [  90,   88],
  [  35,   96],
  [ -25,   95],
  [ -85,   82],
  [-130,   55],
  [-150,   25],
];

export function skullOutlinePath(scale = 1) {
  const s = scale;
  const pts = SKULL_BASE_PTS.map(([x, y]) => [x * s, y * s]);
  return catmullRomToBezier(pts, true);
}

// 1908 mis-reading variant: subtly different cranial shape — slightly
// flatter (older comparative-anatomy renderings of avian brains gave a
// less-domed cranium because they under-recognized pallium volume).
const SKULL_1908_PTS = SKULL_BASE_PTS.map(([x, y]) => {
  // Compress the dorsal (top) half by 18%, expand the ventral (bottom)
  // by 6% — mimics a 19th-century lateral plate.
  if (y < 0) return [x * 0.98, y * 0.82];
  return [x * 0.98, y * 1.06];
});

export function skullOutline1908Path(scale = 1) {
  const s = scale;
  const pts = SKULL_1908_PTS.map(([x, y]) => [x * s, y * s]);
  return catmullRomToBezier(pts, true);
}
