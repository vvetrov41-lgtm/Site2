// Shared front-view body rig.
// Local units: feet at y = 0, up is negative; total height ~1000.
// Scenes pass a pose; a style object supplies clothes, hair and face.

import { C } from '../config.js';
import { shape, stroke, ell, getCtx } from '../core/pencil.js';
import { ik2, lerp } from '../core/anim.js';

export const B = {
  headY: -790,
  shX: 104,
  shY: -548,
  hipX: 46,
  hipY: -330,
  upper: 125,
  fore: 120,
  sitDrop: 110,
};

// Chibi proportions: the head is drawn a bit bigger than the body grid.
export const HEAD_K = 1.12;

export const FILL = {
  skin: { fill: C.skin, tint: 0.6, hatch: C.skinShade, hatchAlpha: 0.42, spacing: 8, shade: C.skinRim, shadeAlpha: 0.45 },
  black: { fill: C.black, tint: 0.85, hatch: C.blackHatch, hatchAlpha: 0.6, shade: '#0f0c0d', shadeAlpha: 0.5 },
  glove: { fill: C.glove, tint: 0.65, hatch: C.gloveHatch, hatchAlpha: 0.6, shade: '#e0679d', shadeAlpha: 0.5 },
  lilac: { fill: C.lilac, tint: 0.5, hatch: C.lilacDark, hatchAlpha: 0.6, shade: C.lilacShade, shadeAlpha: 0.55 },
  jeans: { fill: C.jeans, tint: 0.5, hatch: C.jeansDark, hatchAlpha: 0.6, shade: C.jeansShade, shadeAlpha: 0.55 },
  sneaker: { fill: C.sneaker, tint: 1, hatch: C.greyLight, hatchAlpha: 0.5, cross: false },
};

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const norm = (v) => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const perp = (v) => [-v[1], v[0]];
const add = (a, v, k = 1) => [a[0] + v[0] * k, a[1] + v[1] * k];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Closed outline of a bent tube through a -> b -> c. */
export function limbPts(a, b, c, w1, w2, w3, capA = true) {
  const d1 = norm(sub(b, a));
  const d2 = norm(sub(c, b));
  const n1 = perp(d1);
  const n2 = perp(d2);
  let nb = norm([n1[0] + n2[0], n1[1] + n2[1]]);
  const k = 1 / Math.max(0.6, nb[0] * n1[0] + nb[1] * n1[1]);
  nb = [nb[0] * k, nb[1] * k];
  const m1 = mid(a, b);
  const m2 = mid(b, c);
  const left = [add(a, n1, w1 / 2), add(m1, n1, (w1 + w2) / 4), add(b, nb, w2 / 2), add(m2, n2, (w2 + w3) / 4), add(c, n2, w3 / 2)];
  const right = [add(c, n2, -w3 / 2), add(m2, n2, -(w2 + w3) / 4), add(b, nb, -w2 / 2), add(m1, n1, -(w1 + w2) / 4), add(a, n1, -w1 / 2)];
  const out = [...left, add(c, d2, w3 * 0.42), ...right];
  if (capA) out.push(add(a, d1, -w1 * 0.4));
  return out;
}

/** Straight tube from a to b. */
export function tubePts(a, b, w1, w2) {
  return limbPts(a, mid(a, b), b, w1, (w1 + w2) / 2, w2);
}

/** Mitten hand. dir = direction the forearm points (towards the fingers). */
export function hand(key, at, dir, side, fill = FILL.skin, r = 25, kind = 'mitt') {
  const a = Math.atan2(dir[1], dir[0]);
  const ta = a - side * 1.25;
  const th = [at[0] + Math.cos(ta) * r * 0.8, at[1] + Math.sin(ta) * r * 0.8];
  shape(key + '.th', ell(th[0], th[1], r * 0.45, r * 0.3, 8, ta), { ...fill, w: 4 });
  const c = [at[0] + Math.cos(a) * r * 0.25, at[1] + Math.sin(a) * r * 0.25];
  shape(key, ell(c[0], c[1], r * (kind === 'fist' ? 0.85 : 1.05), r * 0.88, 10, a), { ...fill, w: 4.6 });
}

/**
 * pose:
 *  x, y, s        placement (feet), scale
 *  hopY, sq       vertical offset (screen px) and squash/stretch
 *  bob, lean      upper-body offset / rotation (radians)
 *  head: { tilt, nod (0..1), turn (-1..1) }
 *  look: [x, y]   eye direction (-1..1)
 *  expr           expression name
 *  armL / armR:   { t: [x, y], bend: ±1, hand: 'mitt'|'fist', glove }
 *  legs: { mode: 'stand' | 'walk' | 'sit', phase }
 *  armsOver       draw arms after the head (arms up)
 */
export function drawPerson(p, st) {
  const ctx = getCtx();
  ctx.save();
  ctx.translate(p.x, p.y + (p.hopY || 0));
  const sq = p.sq || 1;
  ctx.scale(p.s / Math.sqrt(sq), p.s * sq);

  const sit = p.legs?.mode === 'sit';
  const drop = (sit ? B.sitDrop : 0) + (p.bob || 0);
  const hipY = B.hipY + drop;
  const nod = p.head?.nod || 0;
  const headC = [p.head?.dx || 0, B.headY + drop + nod * 22];

  const upper = (fn) => {
    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(p.lean || 0);
    ctx.translate(0, -hipY);
    fn();
    ctx.restore();
  };
  const headSpace = (fn) =>
    upper(() => {
      ctx.save();
      ctx.translate(headC[0], headC[1]);
      ctx.rotate(p.head?.tilt || 0);
      ctx.scale(HEAD_K, HEAD_K);
      fn();
      ctx.restore();
    });

  headSpace(() => st.hairBack(p));
  drawLegs(p, st, hipY);
  upper(() => {
    shape(st.id + '.neck', [[-24, B.headY + drop + 100], [24, B.headY + drop + 100], [26, B.shY + drop + 20], [-26, B.shY + drop + 20]], FILL.skin);
    st.torso(p, drop);
    if (!p.armsOver) {
      drawArm(p, st, 'L', drop);
      drawArm(p, st, 'R', drop);
    }
  });
  headSpace(() => {
    st.head(p);
    st.face(p);
    st.hairFront(p);
  });
  upper(() => {
    st.front?.(p, drop);
    if (p.armsOver) {
      drawArm(p, st, 'L', drop);
      drawArm(p, st, 'R', drop);
    }
  });
  ctx.restore();
}

function drawArm(p, st, side, drop) {
  const a = p['arm' + side] || {};
  const sg = side === 'L' ? -1 : 1;
  const sh = [sg * (st.shX ?? B.shX), B.shY + drop];
  const t = a.t ? [a.t[0], a.t[1] + drop] : [sg * 126, B.hipY + drop - 8];
  const bend = a.bend ?? sg;
  const [el, hd] = ik2(sh[0], sh[1], t[0], t[1], B.upper, B.fore, bend);
  const key = `${st.id}.arm${side}`;
  shape(key, limbPts(sh, el, hd, 38, 34, 30), FILL.skin);
  st.armDecor?.(p, side, sh, el, hd);
  st.sleeve(key + '.sl', sh, el, hd, sg);
  a.item?.(hd, el);
  const glove = a.glove ?? p.gloves;
  hand(key + '.h', hd, norm(sub(hd, el)), sg, glove ? FILL.glove : FILL.skin, 21, a.hand);
  a.after?.(hd, el);
}

function drawLegs(p, st, hipY) {
  const mode = p.legs?.mode || 'stand';
  const lw = st.legW;
  if (mode === 'sit') {
    const knees = [
      [-60, hipY + 52],
      [60, hipY + 52],
    ];
    const feet = p.legs.feet || [
      [-64, -26],
      [64, -26],
    ];
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      shape(`${st.id}.shin${i}`, tubePts(knees[i], feet[i], lw[0] - 6, lw[1]), st.pants);
      st.shoe(`${st.id}.shoe${i}`, feet[i], sg);
    }
    shape(`${st.id}.lap`, [[-112, hipY - 28], [0, hipY - 34], [112, hipY - 28], [118, hipY + 40], [70, hipY + 84], [0, hipY + 70], [-70, hipY + 84], [-118, hipY + 40]], st.pants);
    return;
  }
  let fl = [-54, -26];
  let fr = [54, -26];
  if (mode === 'walk') {
    const s = Math.sin(p.legs.phase * Math.PI * 2);
    fl = [-54 + 36 * s, -26 - Math.max(0, s) * 24];
    fr = [54 - 36 * s, -26 - Math.max(0, -s) * 24];
  } else if (mode === 'tuck') {
    fl = [-62, -60];
    fr = [62, -60];
  }
  const hl = [-B.hipX, hipY + 10];
  const hr = [B.hipX, hipY + 10];
  shape(`${st.id}.legL`, tubePts(hl, fl, lw[0], lw[1]), st.pants);
  shape(`${st.id}.legR`, tubePts(hr, fr, lw[0], lw[1]), st.pants);
  st.shoe(`${st.id}.shoeL`, fl, -1);
  st.shoe(`${st.id}.shoeR`, fr, 1);
  const hw = st.hipW ?? 104;
  shape(`${st.id}.hips`, [[-hw, hipY - 22], [0, hipY - 26], [hw, hipY - 22], [hw + 4, hipY + 40], [hw * 0.58, hipY + 66], [0, hipY + 50], [-hw * 0.58, hipY + 66], [-hw - 4, hipY + 40]], st.pants);
  if (st.seam) {
    // jeans seams
    stroke(`${st.id}.seamL`, [[hl[0], hipY + 60], [(hl[0] + fl[0]) / 2, (hipY + fl[1]) / 2 + 30], [fl[0], fl[1] - 30]], { w: 2.4, color: st.seam, alpha: 0.8 });
    stroke(`${st.id}.seamR`, [[hr[0], hipY + 60], [(hr[0] + fr[0]) / 2, (hipY + fr[1]) / 2 + 30], [fr[0], fr[1] - 30]], { w: 2.4, color: st.seam, alpha: 0.8 });
  }
}

export { lerp, add, sub, norm, mid, perp };
