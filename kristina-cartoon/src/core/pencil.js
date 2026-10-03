// Hand-drawn line system.
//
// Every shape has a stable key -> seed. Its control points get
//   - a static offset (the drawing's permanent imperfection), and
//   - a "boil" offset chosen from 3 variants that change every 2 frames,
// so a held pose looks re-traced by hand without turning into noise.
// All amplitudes and widths are in screen pixels (independent of zoom).

import { C } from '../config.js';
import { hashStr, hash, sr, vnoise } from './rng.js';

const S = { ctx: null, variant: 0, boil: true, lineScale: 1 };

const AMP_STATIC = 2.3;
const AMP_BOIL = 1.25;

export function bind(ctx) {
  S.ctx = ctx;
}
export function getCtx() {
  return S.ctx;
}
export function setDrawing(frame, boil = true) {
  S.boil = boil;
  S.variant = boil ? Math.floor(frame / 2) % 3 : 0;
}
/** Close-ups may thicken lines slightly (the "same marker, bigger drawing" look). */
export function setLineScale(k) {
  S.lineScale = k;
}

export function variant() {
  return S.variant;
}

// Screen pixels per local unit under the current transform.
export function unit() {
  const m = S.ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

const seedOf = (k) => (typeof k === 'number' ? k >>> 0 : hashStr(k));

export function jitter(pts, seed, k = 1) {
  const u = unit();
  const as = (AMP_STATIC * k) / u;
  const ab = ((S.boil ? AMP_BOIL : 0) * k) / u;
  const v = S.variant + 1;
  return pts.map((p, i) => [
    p[0] + sr(seed, i, 11) * as + sr(seed, i, 100 + v) * ab,
    p[1] + sr(seed, i, 23) * as + sr(seed, i, 200 + v) * ab,
  ]);
}

function cr(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a, b, c, d) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

// Catmull-Rom through the control points, subdivided by screen length.
export function spline(pts, closed, sharp = false) {
  const u = unit();
  const n = pts.length;
  if (n < 2) return pts.slice();
  const get = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  const out = [];
  for (let i = 0; i < segs; i++) {
    const p1 = get(i);
    const p2 = get(i + 1);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * u;
    const steps = Math.max(1, Math.min(28, Math.ceil(len / 6)));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push(sharp ? [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t] : cr(get(i - 1), p1, p2, get(i + 2), t));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

function cumulative(line) {
  const cum = [0];
  for (let i = 1; i < line.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  }
  return cum;
}

export function trim(line, frac) {
  if (frac >= 1) return line;
  const cum = cumulative(line);
  const target = cum[cum.length - 1] * Math.max(0, frac);
  const out = [line[0]];
  for (let i = 1; i < line.length; i++) {
    if (cum[i] >= target) {
      const seg = cum[i] - cum[i - 1] || 1;
      const t = (target - cum[i - 1]) / seg;
      out.push([line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t]);
      return out;
    }
    out.push(line[i]);
  }
  return out;
}

// Marker stroke: a filled polygon whose width wanders along the line.
function strokePoly(line, wScreen, seed, color, alpha, taper) {
  const ctx = S.ctx;
  const m = line.length;
  if (m < 2) return;
  const u = unit();
  const w = (wScreen * S.lineScale) / u;
  const cum = cumulative(line);
  const total = cum[m - 1] || 1;
  const v = S.boil ? S.variant : 0;
  const L = [];
  const R = [];
  for (let i = 0; i < m; i++) {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(m - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    let ww = w * (0.84 + 0.26 * vnoise(seed + v * 131, (cum[i] * u) / 55));
    if (taper) {
      const e = Math.min(cum[i], total - cum[i]) * u;
      ww *= 0.4 + 0.6 * Math.min(1, e / 16);
    }
    const p = line[i];
    L.push([p[0] - (ty * ww) / 2, p[1] + (tx * ww) / 2]);
    R.push([p[0] + (ty * ww) / 2, p[1] - (tx * ww) / 2]);
  }
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < m; i++) ctx.lineTo(L[i][0], L[i][1]);
  for (let i = m - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Feature switches (profiling / low-power fallback). */
export const PERF = { shade: true, cross: true, sketch: true, hatch: true };

const LINE_K = 0.82; // pencil outlines: two overlapping passes, not one marker line

function closedInk(pts, seed, o) {
  const w = (o.w ?? 5) * LINE_K;
  const ink = o.ink ?? C.ink;
  const dense = spline(jitter(pts, seed, o.wob ?? 1), true, o.sharp);
  const n = dense.length;
  const start = o.start !== undefined ? Math.floor(o.start * n) % n : Math.floor(hash(seed, 7) * n);
  const path = [];
  if (o.progress !== undefined && o.progress < 1) {
    if (o.progress <= 0) return;
    for (let i = 0; i <= n; i++) path.push(dense[(start + i) % n]);
    strokePoly(trim(path, o.progress), w, seed, ink, o.inkAlpha ?? 0.95, true);
    return;
  }
  // A child closes a loop by overshooting the start a little.
  const extra = o.sharp ? 1 : Math.max(2, Math.round(n * 0.06));
  for (let i = 0; i <= n + extra; i++) path.push(dense[(start + i) % n].slice());
  const drift = 2.6 / unit();
  for (let k = 0; k < extra; k++) {
    const p = path[path.length - extra + k];
    const f = (k + 1) / extra;
    p[0] += drift * f * sr(seed, 3);
    p[1] += drift * f * sr(seed, 4);
  }
  strokePoly(path, w, seed, ink, o.inkAlpha ?? 0.92, true);
  // Pencil re-trace: a second, lighter pass over part of the outline.
  if (PERF.sketch && o.sketch !== false && n > 24 && !o.sharp) {
    const d2 = spline(jitter(pts, seed + 5, (o.wob ?? 1) * 1.7), true);
    const m = d2.length;
    const s2 = Math.floor(hash(seed, 8) * m);
    const len = Math.floor(m * (0.7 + hash(seed, 9) * 0.3));
    const part = [];
    for (let i = 0; i <= len; i++) part.push(d2[(s2 + i) % m]);
    strokePoly(part, w * 0.6, seed + 5, ink, 0.62, true);
  }
}

function tracePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// One zig-zag colored-pencil pass over the current clip.
function hatchPass(ctx, fp, seed, ang, spScreen, lwScreen, alpha, color, band = 0) {
  const u = unit();
  const v = S.boil ? S.variant : 0;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const nx = -dy;
  const ny = dx;
  let dmin = Infinity;
  let dmax = -Infinity;
  let nmin = Infinity;
  let nmax = -Infinity;
  for (const p of fp) {
    const d = p[0] * dx + p[1] * dy;
    const nn = p[0] * nx + p[1] * ny;
    if (d < dmin) dmin = d;
    if (d > dmax) dmax = d;
    if (nn < nmin) nmin = nn;
    if (nn > nmax) nmax = nn;
  }
  const sp = spScreen / u;
  const pad = sp * 1.5;
  // band > 0: only the last `band` fraction of the shape across the strokes (shadow side)
  if (band) nmin = nmax - (nmax - nmin) * band;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lwScreen / u;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  let i = 0;
  for (let nn = nmin - sp; nn <= nmax + sp; nn += sp, i++) {
    const d = (i & 1 ? dmax + pad : dmin - pad) + sr(seed + v * 17, i, 3) * pad * 0.6;
    const jn = nn + sr(seed + v * 17, i, 5) * sp * 0.45;
    const x = d * dx + jn * nx;
    const y = d * dy + jn * ny;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Colored-pencil fill: paper occluder, light tint, two crossing scribble passes,
// and a darker scribble along the shadow side (light comes from the top-left).
function crayonFill(pts, seed, o) {
  const ctx = S.ctx;
  const fp = spline(jitter(pts, seed + 31, (o.wob ?? 1) * 1.25), true, o.sharp);
  ctx.save();
  tracePath(ctx, fp);
  if (o.occlude !== false) {
    ctx.fillStyle = C.paper;
    ctx.fill();
  }
  ctx.clip();
  ctx.globalAlpha = o.tint ?? 0.45;
  ctx.fillStyle = o.fill;
  ctx.fill();

  const ang = o.angle ?? -0.78 + sr(seed, 9) * 0.3;
  const sp = o.spacing ?? 7;
  const lw = o.lw ?? 4.6;
  const hatch = o.hatch ?? o.fill;
  if (PERF.hatch) hatchPass(ctx, fp, seed, ang, sp, lw, o.hatchAlpha ?? 0.7, hatch);
  if (PERF.cross && o.cross !== false && (o.hatchAlpha ?? 0.7) > 0) hatchPass(ctx, fp, seed + 101, ang + 0.55, sp * 1.35, lw * 0.75, (o.hatchAlpha ?? 0.7) * 0.55, hatch);

  if (PERF.shade && o.shade) {
    // shadow side (light from the top-left): strokes laid across the light direction,
    // only over the far band of the shape - no extra clipping needed
    const la = -0.64 + sr(seed, 12) * 0.12;
    hatchPass(ctx, fp, seed + 202, la, sp * 0.8, lw * 0.9, o.shadeAlpha ?? 0.6, o.shade, o.shadeBand ?? 0.3);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/**
 * Closed shape.
 * o: fill, tint, hatch, hatchAlpha, angle, spacing, lw, occlude,
 *    ink (color | false), w (screen px), wob, sharp, progress
 */
export function shape(key, pts, o = {}) {
  const seed = seedOf(key);
  if (o.fill) crayonFill(pts, seed, o);
  if (o.ink !== false) closedInk(pts, seed, o);
}

/** Open stroke. o: w, color, alpha, wob, sharp, progress, taper */
export function stroke(key, pts, o = {}) {
  const seed = seedOf(key);
  let line = spline(jitter(pts, seed, o.wob ?? 1), false, o.sharp);
  if (o.progress !== undefined && o.progress < 1) {
    if (o.progress <= 0) return;
    line = trim(line, o.progress);
  }
  strokePoly(line, (o.w ?? 5) * LINE_K, seed, o.color ?? C.ink, o.alpha ?? 0.95, o.taper ?? true);
}

/** Solid round dot (eye highlights etc.), lightly wobbled. */
export function dot(key, x, y, r, color, alpha = 1) {
  const ctx = S.ctx;
  const seed = seedOf(key);
  const pts = spline(jitter(ell(x, y, r, r, 7), seed, 0.35), true);
  tracePath(ctx, pts);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function withClip(pts, fn) {
  const ctx = S.ctx;
  ctx.save();
  tracePath(ctx, pts);
  ctx.clip();
  fn();
  ctx.restore();
}

export function ell(cx, cy, rx, ry, n = 12, rot = 0) {
  const out = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}

export function rrect(x, y, w, h, r) {
  return [
    [x + r, y],
    [x + w / 2, y],
    [x + w - r, y],
    [x + w, y + r],
    [x + w, y + h / 2],
    [x + w, y + h - r],
    [x + w - r, y + h],
    [x + w / 2, y + h],
    [x + r, y + h],
    [x, y + h - r],
    [x, y + h / 2],
    [x, y + r],
  ];
}

export function xf(pts, tx, ty, s = 1, rot = 0) {
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  return pts.map(([x, y]) => [tx + (x * c - y * sn) * s, ty + (x * sn + y * c) * s]);
}
