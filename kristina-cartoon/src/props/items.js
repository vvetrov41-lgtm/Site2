// Hand-held items: the flower (phone photo + tattoo), the phone, the machine.

import { C } from '../config.js';
import { shape, stroke, ell, rrect, getCtx } from '../core/pencil.js';

// ---- Flower ---------------------------------------------------------------
// Unit coordinates: height 1 (y from -0.5 to 0.5), centred at (0, 0).

const BLOOM = [0, -0.2];

function buildFlower() {
  const parts = [];
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
    const cx = BLOOM[0] + Math.cos(a) * 0.15;
    const cy = BLOOM[1] + Math.sin(a) * 0.15;
    parts.push({ id: 'p' + k, pts: ell(cx, cy, 0.125, 0.1, 9, a), kind: 'petal' });
  }
  parts.push({ id: 'c', pts: ell(BLOOM[0], BLOOM[1], 0.075, 0.075, 8), kind: 'center' });
  parts.push({ id: 'st', pts: [[0, -0.1], [0.03, 0.08], [-0.015, 0.28], [0.005, 0.48]], kind: 'stem', open: true });
  parts.push({ id: 'lL', pts: [[0, 0.23], [-0.08, 0.13], [-0.22, 0.09], [-0.15, 0.2]], kind: 'leaf' });
  parts.push({ id: 'lR', pts: [[0.005, 0.35], [0.08, 0.25], [0.22, 0.22], [0.15, 0.32]], kind: 'leaf' });
  for (const p of parts) {
    const pts = p.open ? p.pts : [...p.pts, p.pts[0]];
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    p.len = len;
    p.path = pts;
  }
  return parts;
}

const FLOWER = buildFlower();
const INK_TOTAL = FLOWER.reduce((a, p) => a + p.len, 0);
const COLOR_ORDER = ['p0', 'p1', 'p2', 'p3', 'p4', 'c', 'lL', 'lR', 'st'];

function pointOnPath(path, d) {
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (d <= l) {
      const t = l ? d / l : 0;
      return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t];
    }
    d -= l;
  }
  return path[path.length - 1];
}

/** Needle position (unit coords) for an ink progress 0..1. */
export function flowerInkTip(progress) {
  let d = Math.max(0, Math.min(1, progress)) * INK_TOTAL;
  for (const p of FLOWER) {
    if (d <= p.len) return pointOnPath(p.path, d);
    d -= p.len;
  }
  return [0, 0.48];
}

/** Centre (unit coords) of the part being coloured at a colour progress. */
export function flowerColorTip(progress) {
  const i = Math.min(COLOR_ORDER.length - 1, Math.floor(progress * COLOR_ORDER.length));
  const part = FLOWER.find((p) => p.id === COLOR_ORDER[i]);
  const pts = part.pts;
  const c = pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length], [0, 0]);
  return c;
}

/**
 * Draw the flower. prog = { ink: 0..1, color: 0..1 }. w = outline width (screen px).
 */
export function drawFlower(key, x, y, size, prog = { ink: 1, color: 1 }, w = 4.4) {
  const ctx = getCtx();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  const colored = Math.floor((prog.color ?? 1) * COLOR_ORDER.length + 1e-6);
  for (let i = 0; i < colored; i++) {
    const part = FLOWER.find((p) => p.id === COLOR_ORDER[i]);
    const k = `${key}.${part.id}.f`;
    if (part.kind === 'stem') {
      stroke(k, part.pts, { w: 9, color: C.green, alpha: 0.85, taper: false });
      continue;
    }
    const fill =
      part.kind === 'petal'
        ? { fill: C.flower, hatch: C.flowerHatch }
        : part.kind === 'center'
          ? { fill: C.yellow, hatch: C.orange }
          : { fill: C.green, hatch: C.greenDark };
    shape(k, part.pts, { ...fill, tint: 0.75, hatchAlpha: 0.65, ink: false, occlude: false, spacing: 6, lw: 4.5 });
  }
  let d = (prog.ink ?? 1) * INK_TOTAL;
  for (const part of FLOWER) {
    if (d <= 0) break;
    const pp = Math.min(1, d / part.len);
    d -= part.len;
    if (part.open) stroke(`${key}.${part.id}`, part.pts, { w, progress: pp });
    else shape(`${key}.${part.id}`, part.pts, { w, progress: pp, start: 0 });
  }
  ctx.restore();
}

// ---- Phone ---------------------------------------------------------------

/** Phone centred at (x, y), local units (about 150 x 260). */
export function drawPhone(key, x, y, s = 1) {
  const ctx = getCtx();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  shape(key + '.case', rrect(-76, -132, 152, 264, 28), { fill: C.pink, tint: 0.6, hatch: C.pinkLight, w: 5.5 });
  shape(key + '.screen', rrect(-60, -108, 120, 212, 12), { fill: '#eaf6ff', tint: 1, hatch: '#d6ecfb', hatchAlpha: 0.5, w: 4 });
  drawFlower(key + '.fl', 0, -2, 180, { ink: 1, color: 1 }, 4.2);
  shape(key + '.cam', ell(0, -120, 5, 5, 6), { fill: C.ink, tint: 1, w: 2 });
  ctx.restore();
}

// ---- Tattoo machine --------------------------------------------------------

/**
 * Pen machine. Origin = grip (where the hand holds it); +x points to the needle.
 */
export function drawMachine(key, x, y, ang, s = 1, cord = true) {
  const ctx = getCtx();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  if (cord) stroke(key + '.cord', [[-150, 0], [-200, 26], [-236, 6], [-292, 52], [-340, 34], [-380, 80]], { w: 4.5, color: C.greyDark });
  shape(key + '.body', rrect(-152, -18, 118, 36, 14), { fill: '#8f8a8b', tint: 0.85, hatch: '#5c5758', w: 5 });
  shape(key + '.band', rrect(-44, -16, 16, 32, 5), { fill: C.pink, tint: 0.8, w: 3.5 });
  shape(key + '.grip', rrect(-28, -14, 82, 28, 11), { fill: C.greyLight, tint: 0.8, hatch: C.grey, w: 4.5 });
  for (let i = 0; i < 4; i++) stroke(`${key}.r${i}`, [[-14 + i * 16, -10], [-14 + i * 16, 10]], { w: 2.6 });
  shape(key + '.tip', [[52, -11], [80, -5], [88, 0], [80, 5], [52, 11]], { fill: C.grey, tint: 0.8, w: 4 });
  stroke(key + '.needle', [[88, 0], [106, 0]], { w: 2.6, taper: false });
  ctx.restore();
}
