// Deterministic jitter for SVG paths.
// Same input → same output, so the drawing is reproducible across renders.
// Used to give straight lines and circles a hand-drafted irregularity.

function mulberry32(seed) {
  let t = seed | 0;
  return function () {
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  return mulberry32(seed);
}

// Jitter a point by ±amp pixels deterministically.
export function jitterPoint(x, y, rng, amp = 0.6) {
  const dx = (rng() - 0.5) * 2 * amp;
  const dy = (rng() - 0.5) * 2 * amp;
  return [x + dx, y + dy];
}

// Build a hand-drawn polyline path from a list of [x, y] points.
// Inserts subtle jitter at each vertex.
export function jitteredPolyline(points, seed = 1, amp = 0.6) {
  const rng = mulberry32(seed);
  return points
    .map(([x, y], i) => {
      const [jx, jy] = jitterPoint(x, y, rng, amp);
      return `${i === 0 ? "M" : "L"} ${jx.toFixed(2)} ${jy.toFixed(2)}`;
    })
    .join(" ");
}

// Build an irregular ellipse approximated by N points around an oval.
// Returns an SVG path "d" string.
export function jitteredEllipsePath(cx, cy, rx, ry, seed = 1, amp = 0.6, steps = 48) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const wobble = 1 + (rng() - 0.5) * 0.04;
    const x = cx + Math.cos(t) * rx * wobble;
    const y = cy + Math.sin(t) * ry * wobble;
    const [jx, jy] = jitterPoint(x, y, rng, amp);
    pts.push([jx, jy]);
  }
  pts.push(pts[0]);
  return pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ") + " Z";
}

// Build a curved hand-feel path between two points with optional sag.
export function jitteredCurve(x1, y1, x2, y2, seed = 1, sag = 0, amp = 0.4) {
  const rng = mulberry32(seed);
  const mx = (x1 + x2) / 2 + (rng() - 0.5) * amp * 4;
  const my = (y1 + y2) / 2 + sag + (rng() - 0.5) * amp * 4;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// Linear interpolation helper.
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
