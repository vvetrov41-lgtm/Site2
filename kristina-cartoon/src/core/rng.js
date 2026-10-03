// Deterministic randomness. Nothing in the film uses Math.random().

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Uniform [0, 1) from up to three integers.
export function hash(a, b = 0, c = 0) {
  let h = (a | 0) ^ Math.imul(b | 0, 0x27d4eb2d) ^ Math.imul(c | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Signed [-1, 1).
export const sr = (a, b = 0, c = 0) => hash(a, b, c) * 2 - 1;

// Smooth 1D value noise in [-1, 1].
export function vnoise(seed, x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = sr(seed, i, 77);
  const b = sr(seed, i + 1, 77);
  return a + (b - a) * u;
}

// Tileable 2D value noise in [0, 1].
export function vnoise2(seed, x, y, period) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const m = (v) => ((v % period) + period) % period;
  const h = (ix, iy) => hash(seed, m(ix), m(iy) * 7919);
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
