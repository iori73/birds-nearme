// Terminal glyphs and stroke patterns for the 8 brain parts.
// Each part is encoded by THREE redundant channels: pattern + glyph + color.
// Color-blind readers see structure without relying on hue.

import { jitteredEllipsePath } from "./jitter.js";

// Stroke patterns: SVG dasharray strings.
export const STROKE_PATTERNS = {
  olfactory:  "8 4",       // long-dash
  pallium:    "0",         // solid heavy (no dasharray; weight handles it)
  striatum:   "1 3",       // dotted
  midbrain:   "5 2 1 2",   // dash-dot
  thalamus:   "0",         // hairline solid
  chiasm:     "3 2",       // short-dash (we cross-hatch via fill pattern below)
  hindbrain:  "4 3",       // dashed
  cerebellum: "0.5 1.5",   // stippled
};

// Stroke weight per part (gives further visual distinction independent of color).
export const STROKE_WEIGHTS = {
  olfactory:  0.9,
  pallium:    1.6,   // heavy
  striatum:   1.0,
  midbrain:   1.0,
  thalamus:   0.6,   // hairline
  chiasm:     0.9,
  hindbrain:  1.0,
  cerebellum: 0.8,
};

// Render a small terminal glyph at (cx, cy) for a given part id.
// Size ~6px. Used at filament tips so the part identity is readable
// even in grayscale.
export function Glyph({ id, cx, cy, color, seed = 1, size = 5 }) {
  const s = size;
  switch (id) {
    case "olfactory": // circle
      return <circle cx={cx} cy={cy} r={s * 0.7} fill="none" stroke={color} strokeWidth="1" />;
    case "pallium": { // spiral
      const turns = 1.6, steps = 24;
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * turns * Math.PI * 2;
        const r = (i / steps) * s;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r;
        d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      return <path d={d} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />;
    }
    case "striatum": // cross
      return (
        <g stroke={color} strokeWidth="1" strokeLinecap="round">
          <line x1={cx - s} y1={cy} x2={cx + s} y2={cy} />
          <line x1={cx} y1={cy - s} x2={cx} y2={cy + s} />
        </g>
      );
    case "midbrain": { // leaf (almond)
      const d = `M ${cx - s} ${cy} Q ${cx} ${cy - s} ${cx + s} ${cy} Q ${cx} ${cy + s} ${cx - s} ${cy} Z`;
      return <path d={d} fill="none" stroke={color} strokeWidth="1" />;
    }
    case "thalamus": { // lozenge (diamond)
      const d = `M ${cx} ${cy - s} L ${cx + s} ${cy} L ${cx} ${cy + s} L ${cx - s} ${cy} Z`;
      return <path d={d} fill="none" stroke={color} strokeWidth="1" />;
    }
    case "chiasm": // arc
      return (
        <path
          d={`M ${cx - s} ${cy} A ${s} ${s} 0 0 1 ${cx + s} ${cy}`}
          fill="none" stroke={color} strokeWidth="1"
        />
      );
    case "hindbrain": // square
      return (
        <rect x={cx - s * 0.8} y={cy - s * 0.8} width={s * 1.6} height={s * 1.6}
          fill="none" stroke={color} strokeWidth="1" />
      );
    case "cerebellum": // bar (short horizontal tick)
      return <line x1={cx - s} y1={cy} x2={cx + s} y2={cy} stroke={color} strokeWidth="1.6" strokeLinecap="round" />;
    default:
      return null;
  }
}

// SVG <pattern> definitions for fills (used inside the twin brain centerpiece
// where each part is filled with a pattern, not just stroked).
export function PartFillPatterns() {
  return (
    <defs>
      <pattern id="pat-olfactory" patternUnits="userSpaceOnUse" width="6" height="6">
        <line x1="0" y1="0" x2="6" y2="6" stroke="#C68A3C" strokeWidth="0.4" />
      </pattern>
      <pattern id="pat-pallium" patternUnits="userSpaceOnUse" width="3" height="3">
        <circle cx="1.5" cy="1.5" r="0.6" fill="#6E4F6B" />
      </pattern>
      <pattern id="pat-striatum" patternUnits="userSpaceOnUse" width="4" height="4">
        <circle cx="2" cy="2" r="0.4" fill="#3A3A52" />
      </pattern>
      <pattern id="pat-midbrain" patternUnits="userSpaceOnUse" width="6" height="6">
        <line x1="0" y1="3" x2="6" y2="3" stroke="#9CB4C2" strokeWidth="0.5" strokeDasharray="2 1" />
      </pattern>
      <pattern id="pat-thalamus" patternUnits="userSpaceOnUse" width="5" height="5">
        <line x1="0" y1="0" x2="5" y2="5" stroke="#4F4840" strokeWidth="0.3" />
      </pattern>
      <pattern id="pat-chiasm" patternUnits="userSpaceOnUse" width="5" height="5">
        <line x1="0" y1="0" x2="5" y2="5" stroke="#516C8A" strokeWidth="0.3" />
        <line x1="5" y1="0" x2="0" y2="5" stroke="#516C8A" strokeWidth="0.3" />
      </pattern>
      <pattern id="pat-hindbrain" patternUnits="userSpaceOnUse" width="4" height="4">
        <line x1="0" y1="2" x2="4" y2="2" stroke="#9C9486" strokeWidth="0.5" strokeDasharray="2 1" />
      </pattern>
      <pattern id="pat-cerebellum" patternUnits="userSpaceOnUse" width="3" height="3">
        <circle cx="1.5" cy="1.5" r="0.3" fill="#7C8F5B" />
      </pattern>
    </defs>
  );
}

export const PART_ORDER = [
  "olfactory", "pallium", "striatum", "midbrain",
  "thalamus", "chiasm", "hindbrain", "cerebellum"
];
