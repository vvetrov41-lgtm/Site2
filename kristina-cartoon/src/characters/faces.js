// Expression library. Head-local coordinates: head centre (0, 0), radius ~150.

import { C } from '../config.js';
import { shape, stroke, ell, dot, withClip } from '../core/pencil.js';
import { star } from '../fx/effects.js';

const BLUSH = { fill: C.blush, tint: 0.32, hatchAlpha: 0.45, occlude: false, ink: false, spacing: 7, lw: 4 };

function openMouth(key, mx, my, wHalf, depth, lift = 0) {
  const pts = [
    [mx - wHalf, my - 10 - lift],
    [mx - wHalf * 0.5, my - 13],
    [mx, my - 13],
    [mx + wHalf * 0.5, my - 13],
    [mx + wHalf, my - 10 - lift],
    [mx + wHalf * 0.7, my + depth * 0.5],
    [mx, my + depth],
    [mx - wHalf * 0.7, my + depth * 0.5],
  ];
  shape(key, pts, { fill: C.mouth, tint: 0.92, hatch: C.mouth, w: 5.2 });
  withClip(pts, () => {
    shape(key + '.t', ell(mx, my + depth * 0.78, wHalf * 0.5, depth * 0.35, 8), { fill: C.tongue, tint: 0.9, ink: false, occlude: false });
  });
}

// ---------------------------------------------------------------- Kristina --

function kEye(side, cx, cy, lx, ly, mode, drop) {
  const key = `k.eye${side}`;
  if (mode === 'happy') {
    stroke(key + '.h', [[cx - 22, cy + 10], [cx - 9, cy - 9], [cx + 9, cy - 9], [cx + 22, cy + 10]], { w: 7.5 });
    return;
  }
  if (mode === 'blink') {
    stroke(key + '.b', [[cx - 23, cy + 2], [cx, cy + 9], [cx + 23, cy + 2]], { w: 6.5 });
    stroke(key + '.bl', [[cx + side * 22, cy + 3], [cx + side * 31, cy - 3]], { w: 4 });
    return;
  }
  const inX = cx - side * 22;
  const outX = cx + side * 24;
  const top = cy - 10 + drop;
  const inY = top + 3;
  const outY = top - 3;
  const ix = cx + lx * 6;
  const iy = cy + 4 + ly * 5;
  withClip(
    [
      [inX - side * 6, inY - 2],
      [outX + side * 6, outY - 2],
      [outX + side * 6, cy + 44],
      [inX - side * 6, cy + 44],
    ],
    () => {
      shape(key + '.w', ell(cx, cy + 6, 24, 21, 10), { fill: C.white, tint: 1, hatchAlpha: 0, ink: false });
      shape(key + '.iris', ell(ix, iy, 17, 22, 10), { fill: '#3a2b2b', tint: 1, hatch: C.ink, w: 3 });
      dot(key + '.hl', ix - 5, iy - 4, 5, C.white);
    },
  );
  // heavy flat upper lid = "very serious"
  stroke(key + '.lid', [[inX, inY], [cx, (inY + outY) / 2 - 1.5], [outX, outY], [outX + side * 9, outY - 7]], { w: 7.5 });
  stroke(key + '.low', [[inX + side * 4, cy + 26], [cx, cy + 29], [outX - side * 4, cy + 25]], { w: mode === 'squint' ? 4.5 : 2.6, alpha: mode === 'squint' ? 0.95 : 0.55 });
}

/**
 * Kristina, front view. o.moon (default true) draws the forehead crescent.
 */
export function kristinaFace(p) {
  const ex = p.expr || 'serious';
  const nod = p.head?.nod || 0;
  const turn = p.head?.turn || 0;
  const fx = turn * 34;
  const fy = nod * 38;
  const look = p.look || [0, 0];
  const lx = look[0];
  const ly = Math.min(1, look[1] + nod * 0.9);
  const happy = ex === 'happy';

  for (const side of [-1, 1]) {
    shape(`k.blush${side}`, ell(side * 86 + fx * 0.8, 70 + fy, 22, 12, 8), { ...BLUSH, tint: happy ? 0.5 : 0.25 });
  }
  const eyeY = 18 + fy;
  const drop = ex === 'squint' ? 9 : nod * 15;
  for (const side of [-1, 1]) {
    const cx = side * 50 + fx;
    const eyeMode = ex === 'happy' ? 'happy' : ex === 'blink' ? 'blink' : ex === 'squint' ? 'squint' : 'open';
    kEye(side, cx, eyeY, lx, ly, eyeMode, drop);
    const bY = eyeY - 46 + (ex === 'squint' ? 7 : 0) + nod * 6;
    if (happy) stroke(`k.brow${side}`, [[cx + side * 30, bY - 8], [cx, bY - 18], [cx - side * 24, bY - 10]], { w: 6 });
    else stroke(`k.brow${side}`, [[cx + side * 30, bY - 7], [cx + side * 4, bY - 4], [cx - side * 24, bY + 5]], { w: 6.5 });
  }
  // slim nose
  stroke('k.nose', [[fx + 3, 26 + fy], [fx + 6, 54 + fy], [fx - 3, 60 + fy]], { w: 3 });
  // subtle lips
  const my = 92 + fy;
  if (happy) openMouth('k.mouth', fx, my, 38, 40, 4);
  else if (ex === 'twitch') {
    stroke('k.mouth', [[fx - 15, my + 1], [fx, my], [fx + 11, my - 3], [fx + 18, my - 9]], { w: 4.6, color: C.lips });
    stroke('k.lip', [[fx - 6, my + 7], [fx + 4, my + 8]], { w: 3, color: C.lips, alpha: 0.7 });
  } else {
    stroke('k.mouth', [[fx - 16, my + 1], [fx, my - 1], [fx + 16, my + 1]], { w: 4.6, color: C.lips });
    stroke('k.lip', [[fx - 7, my + 8], [fx + 7, my + 8]], { w: 3, color: C.lips, alpha: 0.7 });
  }
  if (p.moon !== false) moon(fx, fy);
}

/** Crescent moon tattoo, horns up, centred on the forehead. */
export function moon(fx = 0, fy = 0) {
  const y = -50 + fy * 0.8;
  shape('k.moon', [[fx - 15, y - 9], [fx - 12, y + 3], [fx, y + 10], [fx + 12, y + 3], [fx + 15, y - 9], [fx + 8, y - 1], [fx, y + 2], [fx - 8, y - 1]], {
    fill: C.ink,
    tint: 1,
    w: 2.6,
    wob: 0.4,
  });
}

/** Round black glasses over the front-view eyes. */
export function kristinaGlasses(p) {
  const fx = (p.head?.turn || 0) * 34;
  const fy = (p.head?.nod || 0) * 38;
  for (const side of [-1, 1]) {
    const cx = side * 50 + fx;
    shape(`k.lens${side}`, ell(cx, 22 + fy, 44, 37, 12), { fill: C.glassTint, tint: 0.12, hatchAlpha: 0, occlude: false, w: 7.5 });
    stroke(`k.temple${side}`, [[cx + side * 43, 14 + fy], [side * 140, 4]], { w: 6 });
  }
  stroke('k.bridge', [[fx - 8, 16 + fy], [fx, 11 + fy], [fx + 8, 16 + fy]], { w: 6 });
}

// ------------------------------------------------------------------ Client --

function cEye(side, cx, cy, lx, ly, mode) {
  const key = `c.eye${side}`;
  if (mode === 'joy') {
    stroke(key + '.j', [[cx - 23, cy + 10], [cx - 9, cy - 10], [cx + 9, cy - 10], [cx + 23, cy + 10]], { w: 7.5 });
    return;
  }
  if (mode === 'closed') {
    stroke(key + '.c', [[cx - 21, cy], [cx, cy + 9], [cx + 21, cy]], { w: 6 });
    stroke(key + '.l', [[cx + side * 20, cy + 1], [cx + side * 29, cy - 6]], { w: 4 });
    return;
  }
  if (mode === 'stars') {
    star(key + '.st', cx, cy + 2, 30, C.yellow, side * 0.1);
    return;
  }
  const big = mode === 'ooh';
  const rx = big ? 20 : 16;
  const ry = big ? 27 : 21;
  const ix = cx + lx * 6;
  const iy = cy + ly * 5;
  shape(key + '.iris', ell(ix, iy, rx, ry, 10), { fill: '#3d2a20', tint: 1, hatch: C.ink, w: 3.5 });
  dot(key + '.h1', ix - rx * 0.32, iy - ry * 0.35, big ? 8 : 6, C.white);
  dot(key + '.h2', ix + rx * 0.35, iy + ry * 0.35, big ? 4 : 3, C.white);
  stroke(key + '.lash', [[cx + side * 13, cy - ry + 2], [cx + side * 25, cy - ry - 7]], { w: 4.2 });
  stroke(key + '.lash2', [[cx + side * 19, cy - ry + 8], [cx + side * 31, cy - ry + 2]], { w: 3.6 });
}

export function clientFace(p) {
  const ex = p.expr || 'calm';
  const nod = p.head?.nod || 0;
  const turn = p.head?.turn || 0;
  const fx = turn * 36;
  const fy = nod * 24;
  const [lx, ly] = p.look || [0, 0];
  const big = ex === 'ooh' || ex === 'stars' || ex === 'joy';

  for (const side of [-1, 1]) {
    shape(`c.blush${side}`, ell(side * 96 + fx * 0.8, 72 + fy, big ? 34 : 29, big ? 19 : 16, 8), { ...BLUSH, tint: big ? 0.55 : 0.4 });
  }
  const eyeY = 24 + fy;
  const eyeMode = { joy: 'joy', blink: 'closed', yawn: 'closed', stars: 'stars', ooh: 'ooh' }[ex] || 'open';
  for (const side of [-1, 1]) {
    const cx = side * 56 + fx;
    cEye(side, cx, eyeY, lx, ly, eyeMode);
    const by = eyeY - (big ? 62 : 48);
    stroke(`c.brow${side}`, [[cx - 22, by + 5], [cx, by - 2], [cx + 22, by + 5]], { w: 4.6, color: C.cHairDark });
  }
  stroke('c.nose', [[fx - 4, 58 + fy], [fx + 1, 63 + fy], [fx + 5, 59 + fy]], { w: 3.4 });
  const my = 96 + fy;
  switch (ex) {
    case 'hopeful':
      openMouth('c.mouth', fx, my, 24, 22);
      break;
    case 'look':
      stroke('c.mouth', [[fx - 11, my - 2], [fx, my + 2], [fx + 11, my - 2]], { w: 4.6 });
      break;
    case 'ooh':
      shape('c.mouth', ell(fx, my + 6, 16, 22, 10), { fill: C.mouth, tint: 0.92, hatch: C.mouth, w: 5 });
      break;
    case 'yawn':
      shape('c.mouth', ell(fx, my + 6, 13, 19, 10), { fill: C.mouth, tint: 0.92, hatch: C.mouth, w: 5 });
      break;
    case 'stars':
      openMouth('c.mouth', fx, my, 34, 36);
      break;
    case 'joy':
      openMouth('c.mouth', fx, my - 4, 46, 52, 6);
      break;
    default:
      stroke('c.mouth', [[fx - 22, my - 10], [fx - 10, my + 1], [fx + 10, my + 1], [fx + 22, my - 10]], { w: 5 });
  }
}
