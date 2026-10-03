// Sparse studio doodles. All take (x, y) = floor contact point, s = scale.

import { C } from '../config.js';
import { shape, stroke, ell, rrect, getCtx } from '../core/pencil.js';
import { heart, star } from '../fx/effects.js';

function place(x, y, s, fn) {
  const ctx = getCtx();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  fn();
  ctx.restore();
}

const BLACK = { fill: C.black, tint: 0.85, hatch: C.blackHatch, hatchAlpha: 0.5 };
const CHROME = { fill: C.greyLight, tint: 0.7, hatch: C.grey, hatchAlpha: 0.6 };

export function floorLine(y, x0 = -20, x1 = 1100) {
  stroke('floor', [[x0, y], [x0 + (x1 - x0) * 0.3, y + 4], [x0 + (x1 - x0) * 0.65, y - 3], [x1, y + 2]], { w: 4, color: C.greyDark, alpha: 0.7 });
}

/** Tattoo chair, front view. (x, y) = floor under the seat. */
export function tattooChair(key, x, y, s = 1, armLeft = 230) {
  place(x, y, s, () => {
    shape(key + '.base', ell(0, -14, 150, 26, 10), CHROME);
    shape(key + '.post', rrect(-22, -200, 44, 190, 12), CHROME);
    shape(key + '.back', rrect(-150, -620, 300, 440, 60), BLACK);
    shape(key + '.head', rrect(-90, -690, 180, 90, 40), BLACK);
    stroke(key + '.stitch', [[-100, -560], [-100, -260]], { w: 3, color: '#777' });
    stroke(key + '.stitch2', [[100, -560], [100, -260]], { w: 3, color: '#777' });
    shape(key + '.seat', rrect(-170, -250, 340, 80, 30), BLACK);
    shape(key + '.armR', rrect(150, -330, 70, 46, 20), BLACK);
    shape(key + '.armL', rrect(-150 - armLeft, -330, armLeft, 50, 22), BLACK);
    stroke(key + '.armPole', [[-150 - armLeft * 0.6, -282], [-150 - armLeft * 0.5, -200], [-60, -200]], { w: 6, color: C.greyDark });
  });
}

export function stool(key, x, y, s = 1) {
  place(x, y, s, () => {
    for (const a of [-1, 0, 1]) stroke(`${key}.leg${a}`, [[0, -120], [a * 90, -16]], { w: 7, color: C.greyDark });
    for (const a of [-1, 0, 1]) shape(`${key}.wh${a}`, ell(a * 92, -10, 12, 12, 6), { fill: C.ink, tint: 1, w: 3 });
    shape(key + '.post', rrect(-14, -230, 28, 120, 8), CHROME);
    shape(key + '.seat', ell(0, -240, 110, 30, 12), BLACK);
  });
}

export function trolley(key, x, y, s = 1) {
  place(x, y, s, () => {
    stroke(key + '.l', [[-80, -10], [-80, -330]], { w: 6, color: C.greyDark });
    stroke(key + '.r', [[80, -10], [80, -330]], { w: 6, color: C.greyDark });
    shape(key + '.top', rrect(-96, -340, 192, 22, 8), CHROME);
    shape(key + '.mid', rrect(-96, -170, 192, 22, 8), CHROME);
    for (const a of [-1, 1]) shape(`${key}.wh${a}`, ell(a * 80, -6, 12, 12, 6), { fill: C.ink, tint: 1, w: 3 });
    const bottles = [
      [-55, C.pink],
      [-10, C.blue],
      [36, C.yellow],
    ];
    bottles.forEach(([bx, col], i) => {
      shape(`${key}.b${i}`, rrect(bx - 16, -404, 32, 64, 10), { fill: col, tint: 0.7, w: 4 });
      shape(`${key}.c${i}`, rrect(bx - 8, -422, 16, 20, 5), { fill: C.ink, tint: 1, w: 3 });
    });
    shape(key + '.cup', rrect(-40, -232, 80, 62, 10), { fill: C.white, tint: 1, hatchAlpha: 0, w: 4 });
  });
}

export function ringLamp(key, x, y, s = 1) {
  place(x, y, s, () => {
    for (const a of [-1, 0, 1]) stroke(`${key}.leg${a}`, [[0, -200], [a * 80, 0]], { w: 5, color: C.greyDark });
    stroke(key + '.pole', [[0, -200], [0, -640]], { w: 6, color: C.greyDark });
    shape(key + '.ring', ell(0, -720, 92, 92, 14), { fill: C.lamp, tint: 0.6, hatch: C.yellow, hatchAlpha: 0.4, w: 6 });
    shape(key + '.hole', ell(0, -720, 58, 58, 12), { fill: C.paper, tint: 1, hatchAlpha: 0, w: 4 });
  });
}

/** Hanging work lamp from the top of frame with a soft light cone. */
export function hangingLamp(key, x, y, s = 1, target = null) {
  if (target) {
    shape(key + '.light', [[x - 40 * s, y + 40 * s], [x + 40 * s, y + 40 * s], [target[0] + target[2], target[1]], [target[0] - target[2], target[1]]], {
      fill: C.lamp,
      tint: 0.35,
      hatch: C.yellow,
      hatchAlpha: 0.22,
      ink: false,
      occlude: false,
      spacing: 14,
    });
  }
  place(x, y, s, () => {
    stroke(key + '.cord', [[0, -700], [0, -40]], { w: 5, color: C.greyDark });
    shape(key + '.shade', [[-24, -50], [24, -50], [70, 34], [-70, 34]], { fill: C.ink, tint: 0.9, hatch: C.blackHatch, w: 5 });
    shape(key + '.bulb', ell(0, 40, 28, 14, 8), { fill: C.lamp, tint: 1, hatch: C.yellow, hatchAlpha: 0.5, w: 4 });
  });
}

export function plant(key, x, y, s = 1) {
  place(x, y, s, () => {
    const leaves = [
      [-0.9, 250],
      [-0.45, 290],
      [0, 320],
      [0.45, 280],
      [0.9, 240],
    ];
    leaves.forEach(([a, len], i) => {
      const tip = [Math.sin(a) * len, -150 - Math.cos(a) * len];
      const mid = [tip[0] * 0.5, (tip[1] - 150) * 0.5];
      const n = [-(tip[1] + 150), tip[0]];
      const nl = Math.hypot(n[0], n[1]);
      const w = 40;
      shape(`${key}.leaf${i}`, [[0, -150], [mid[0] + (n[0] / nl) * w, mid[1] + (n[1] / nl) * w], tip, [mid[0] - (n[0] / nl) * w, mid[1] - (n[1] / nl) * w]], { fill: C.green, tint: 0.6, hatch: C.greenDark, hatchAlpha: 0.6, w: 4.5 });
      stroke(`${key}.vein${i}`, [[0, -150], mid, tip], { w: 2.6, color: C.greenDark });
    });
    shape(key + '.pot', [[-90, -170], [90, -170], [70, 0], [-70, 0]], { fill: C.orange, tint: 0.65, w: 5 });
    shape(key + '.rim', rrect(-100, -190, 200, 34, 10), { fill: C.orange, tint: 0.8, w: 5 });
  });
}

/** Framed doodle on the wall. kind: 'sun' | 'rainbow' | 'heart' | 'cactus'. */
export function frame(key, x, y, w, h, kind, tilt = 0) {
  const ctx = getCtx();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  stroke(key + '.nail', [[0, -h / 2 - 34], [-w * 0.3, -h / 2], [0, -h / 2 - 34], [w * 0.3, -h / 2]], { w: 3, color: C.greyDark, sharp: true });
  shape(key + '.f', rrect(-w / 2, -h / 2, w, h, 8), { fill: C.wood, tint: 0.5, w: 5 });
  shape(key + '.p', rrect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 4), { fill: C.white, tint: 1, hatchAlpha: 0, w: 3.5 });
  const r = Math.min(w, h) * 0.24;
  if (kind === 'sun') {
    shape(key + '.sun', ell(0, 0, r, r, 10), { fill: C.yellow, tint: 0.8, w: 3.5 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      stroke(`${key}.ray${i}`, [[Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3], [Math.cos(a) * r * 1.75, Math.sin(a) * r * 1.75]], { w: 3.4 });
    }
    stroke(key + '.smile', [[-r * 0.4, r * 0.15], [0, r * 0.45], [r * 0.4, r * 0.15]], { w: 3 });
  } else if (kind === 'rainbow') {
    [C.red, C.yellow, C.blue].forEach((col, i) => {
      const rr = r * 1.5 - i * r * 0.32;
      const pts = [];
      for (let k = 0; k <= 8; k++) pts.push([-Math.cos((k / 8) * Math.PI) * rr, r * 0.7 - Math.sin((k / 8) * Math.PI) * rr]);
      stroke(`${key}.arc${i}`, pts, { w: 9, color: col, alpha: 0.85 });
    });
  } else if (kind === 'heart') {
    heart(key + '.h', 0, 4, r * 2.2, C.pink);
  } else if (kind === 'star') {
    star(key + '.s', 0, 0, r * 1.2, C.yellow);
  }
  ctx.restore();
}

/** Tall standing mirror. Returns the glass outline (for reflections). */
export function mirrorGlass(x, y, s = 1) {
  const g = rrect(-118, -860, 236, 760, 110);
  return g.map(([px, py]) => [x + px * s, y + py * s]);
}

export function mirror(key, x, y, s = 1, reflect = null) {
  place(x, y, s, () => {
    stroke(key + '.legL', [[-90, -110], [-140, 0]], { w: 7, color: C.wood });
    stroke(key + '.legR', [[90, -110], [140, 0]], { w: 7, color: C.wood });
    shape(key + '.frame', rrect(-140, -884, 280, 800, 130), { fill: C.wood, tint: 0.6, w: 6 });
    shape(key + '.glass', rrect(-118, -860, 236, 760, 110), { fill: C.glass, tint: 0.7, hatch: '#bfe0f6', hatchAlpha: 0.45, w: 4 });
  });
  if (reflect) reflect();
  place(x, y, s, () => {
    stroke(key + '.shine1', [[-70, -620], [10, -730]], { w: 7, color: C.white, alpha: 0.9 });
    stroke(key + '.shine2', [[-70, -540], [40, -680]], { w: 5, color: C.white, alpha: 0.9 });
  });
}
