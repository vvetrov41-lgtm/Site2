// Doodled effects: hearts, stars, sparkles, notes, bursts, nod arcs, buzz lines.

import { C } from '../config.js';
import { shape, stroke, ell, xf, dot } from '../core/pencil.js';
import { hash, sr } from '../core/rng.js';

const HEART = [
  [0, 0.42],
  [-0.26, 0.14],
  [-0.48, -0.12],
  [-0.46, -0.38],
  [-0.24, -0.5],
  [0, -0.32],
  [0.24, -0.5],
  [0.46, -0.38],
  [0.48, -0.12],
  [0.26, 0.14],
];

export function heart(key, x, y, size, color = C.pink, rot = 0) {
  if (!color) return shape(key, xf(HEART, x, y, size, rot), { w: 3 });
  shape(key, xf(HEART, x, y, size, rot), { fill: color, tint: 0.65, hatchAlpha: 0.8, w: 4.5, spacing: 7, lw: 5 });
}

function starPts(r, inner = 0.46, n = 5) {
  const out = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 ? r * inner : r;
    out.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return out;
}

export function star(key, x, y, r, color = C.yellow, rot = 0) {
  if (!color) return shape(key, xf(starPts(1), x, y, r, rot), { w: 3, sharp: true });
  shape(key, xf(starPts(1), x, y, r, rot), { fill: color, tint: 0.7, hatchAlpha: 0.8, w: 4.2, sharp: true, spacing: 7, lw: 5 });
}

export function sparkle(key, x, y, r, color = C.yellow) {
  shape(key, xf(starPts(1, 0.22, 4), x, y, r), { fill: color, tint: 0.8, hatchAlpha: 0.6, w: 3.4, sharp: true });
}

export function note(key, x, y, s = 1) {
  shape(key + '.h', ell(x, y, 13 * s, 10 * s, 7, -0.35), { fill: C.ink, tint: 1, w: 3 });
  stroke(key + '.s', [[x + 12 * s, y - 2 * s], [x + 13 * s, y - 50 * s]], { w: 4 });
  stroke(key + '.f', [[x + 13 * s, y - 50 * s], [x + 30 * s, y - 38 * s], [x + 30 * s, y - 24 * s]], { w: 4 });
}

/** Radial "surprise" lines around a point. */
export function burst(key, x, y, r1, r2, n = 8, a0 = 0, w = 5) {
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    stroke(`${key}.${i}`, [[x + c * r1, y + s * r1], [x + c * r2, y + s * r2]], { w });
  }
}

/** Two small arcs beside the head at the bottom of a nod. */
export function nodArcs(key, x, y, r) {
  for (const side of [-1, 1]) {
    const cx = x + side * r;
    stroke(`${key}.${side}`, [[cx, y - 70], [cx + side * 26, y], [cx, y + 70]], { w: 8 });
    stroke(`${key}.${side}b`, [[cx + side * 42, y - 46], [cx + side * 60, y], [cx + side * 42, y + 46]], { w: 7 });
  }
}

/** Little zig-zag vibration marks. */
export function buzz(key, x, y, len = 40, rot = 0, w = 3.5) {
  const pts = [];
  for (let i = 0; i <= 5; i++) pts.push([(i / 5) * len - len / 2, i % 2 ? -7 : 7]);
  stroke(key, xf(pts, x, y, 1, rot), { w, sharp: true });
}

/** Motion "whoosh" lines. */
export function speedLines(key, x, y, len, n = 3, gap = 22, rot = 0) {
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * gap;
    stroke(`${key}.${i}`, xf([[0, o], [len * (i === 1 ? 1 : 0.7), o]], x, y, 1, rot), { w: 4 });
  }
}

/**
 * Deterministic celebration burst: items fly out from (x, y) starting at f0
 * and drift. Positions advance per integer frame only (12 fps steps).
 */
export function confetti(key, f, f0, x, y, n, spread = 330, life = 30) {
  if (f < f0) return;
  const age = f - f0;
  if (age > life) return;
  const seed = hash(key.length * 977, f0) * 1e9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + sr(seed, i, 1) * 1.6;
    const sp = (0.55 + hash(seed, i, 2) * 0.45) * spread;
    const t = Math.min(1, age / 7);
    const ease = 1 - (1 - t) * (1 - t);
    const px = x + Math.cos(a) * sp * ease + sr(seed, i, 3) * 10;
    const py = y + Math.sin(a) * sp * ease * 0.8 + Math.max(0, age - 7) * 2.2;
    const pop = age === 0 ? 0.55 : age === 1 ? 1.15 : 1;
    const kind = i % 3;
    const s = (0.75 + hash(seed, i, 4) * 0.5) * pop;
    const rot = sr(seed, i, 5) * 0.4;
    if (kind === 0) heart(`${key}.h${i}`, px, py, 58 * s, i % 2 ? C.pink : C.red, rot);
    else if (kind === 1) star(`${key}.s${i}`, px, py, 30 * s, C.yellow, rot);
    else sparkle(`${key}.k${i}`, px, py, 28 * s, i % 2 ? C.pink : C.blue);
  }
}

/** Small round blush/glow dot helper used by props. */
export function glowDot(key, x, y, r, color) {
  dot(key, x, y, r, color, 0.6);
}
