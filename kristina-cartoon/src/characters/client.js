// The client. See docs/CHARACTERS.md.

import { C } from '../config.js';
import { shape, stroke, ell } from '../core/pencil.js';
import { drawPerson, FILL, limbPts } from './rig.js';
import { clientFace } from './faces.js';
import { drawFlower } from '../props/items.js';
import { wavy, strands } from './hair.js';

// Generated wavy outlines (head-local coordinates).
const BACK = [
  [-186, -20], [-158, -112], [-92, -168], [0, -184], [92, -168], [158, -112], [186, -20],
  ...wavy([186, -20], [212, 392], 4, 14).slice(1, -1),
  [212, 392],
  ...wavy([212, 392], [-212, 392], 6, 16).slice(1, -1),
  [-212, 392],
  ...wavy([-212, 392], [-186, -20], 4, 14).slice(1, -1),
];
const lock = (sg) => [
  [sg * 150, -64],
  ...wavy([sg * 160, -40], [sg * 184, 340], 4, 12 * sg).slice(1, -1),
  [sg * 176, 352], [sg * 154, 378], [sg * 130, 346],
  ...wavy([sg * 132, 320], [sg * 120, -30], 4, 9 * sg).slice(1, -1),
  [sg * 124, -40],
];
const LOCK_R = lock(1);
const LOCK_L = lock(-1);

const HAIR = { fill: C.cHair, tint: 0.62, hatch: C.cHairDark, hatchAlpha: 0.6, spacing: 7, shade: C.cHairShade, shadeAlpha: 0.5 };

// Lower hair points swing with p.hairBounce (positive = lifted).
const bounce = (pts, hb) =>
  pts.map(([x, y]) => {
    if (y <= 150) return [x, y];
    const k = (y - 150) / 260;
    return [x * (1 - (hb / 100) * k * 0.25), y - hb * k];
  });

const CLIENT = {
  id: 'c',
  shX: 92,
  hipW: 92,
  seam: C.jeansShade,
  legW: [66, 86],
  pants: FILL.jeans,
  shoe(key, at, sg) {
    shape(key, ell(at[0] + sg * 14, at[1] + 6, 46, 20, 10), { ...FILL.sneaker, w: 4.5 });
    stroke(key + '.sole', [[at[0] + sg * 14 - 40, at[1] + 14], [at[0] + sg * 14 + 40, at[1] + 14]], { w: 3, color: C.lilacDark });
  },
  torso(p, d) {
    shape('c.top', [[-96, -546 + d], [-58, -572 + d], [-28, -576 + d], [0, -558 + d], [28, -576 + d], [58, -572 + d], [96, -546 + d], [100, -470 + d], [84, -400 + d], [92, -330 + d], [0, -322 + d], [-92, -330 + d], [-84, -400 + d], [-100, -470 + d]], FILL.lilac);
    stroke('c.collar', [[-30, -574 + d], [0, -552 + d], [30, -574 + d]], { w: 3.4, color: C.lilacDark });
    stroke('c.belt', [[-92, -326 + d], [0, -320 + d], [92, -326 + d]], { w: 3.4, color: C.jeansDark });
  },
  sleeve(key, sh, el, hd) {
    const end = [sh[0] + (el[0] - sh[0]) * 0.45, sh[1] + (el[1] - sh[1]) * 0.45];
    const m = [(sh[0] + end[0]) / 2, (sh[1] + end[1]) / 2];
    shape(key, limbPts([sh[0] + (sh[0] > 0 ? -12 : 12), sh[1] - 4], m, end, 56, 54, 52), FILL.lilac);
  },
  armDecor(p, side, sh, el, hd) {
    if (side !== 'L' || !p.tattoo) return;
    const t = [el[0] + (hd[0] - el[0]) * 0.5, el[1] + (hd[1] - el[1]) * 0.5];
    const prog = typeof p.tattoo === 'number' ? { ink: p.tattoo, color: p.tattoo } : p.tattoo;
    drawFlower('c.tattoo', t[0], t[1] + 2, 56, prog, 3.2);
  },
  hairBack(p) {
    const hb = p.hairBounce || 0;
    shape('c.hairB', bounce(BACK, hb), HAIR);
    strands('c.sB', [[-172, 60, -196, 380, 3, 9, -10], [172, 60, 196, 380, 3, 9, 10], [-150, 160, -160, 360, 2, 8, 0], [150, 160, 162, 360, 2, 8, 0]], C.cHairShade, 3, (q) => bounce(q, hb));
  },
  head(p) {
    shape('c.head', ell(0, 0, 150, 146, 14), FILL.skin);
  },
  face(p) {
    clientFace(p);
  },
  hairFront(p) {
    const hb = p.hairBounce || 0;
    shape('c.cap', [[-162, -20], [-160, -96], [-118, -152], [-56, -180], [0, -186], [56, -180], [118, -152], [160, -96], [162, -20], [146, -50], [118, -92], [66, -118], [16, -124], [0, -102], [-16, -124], [-66, -118], [-118, -92], [-146, -50]], HAIR);
    stroke('c.part', [[0, -184], [0, -108]], { w: 3.4, color: C.cHairDark });
    strands('c.sCap', [[-8, -176, -120, -100, 1, 6, 0], [-14, -150, -60, -120, 1, 4, 0], [8, -176, 120, -100, 1, 6, 0], [14, -150, 60, -120, 1, 4, 0]], C.cHairShade, 2.8);
    shape('c.lockR', bounce(LOCK_R, hb), HAIR);
    shape('c.lockL', bounce(LOCK_L, hb), HAIR);
    strands('c.sL', [[-140, -20, -160, 340, 4, 9, 9], [-132, 80, -150, 300, 3, 7, 0]], C.cHairShade, 3, (q) => bounce(q, hb));
    strands('c.sR', [[140, -20, 160, 340, 4, 9, -9], [132, 80, 150, 300, 3, 7, 0]], C.cHairShade, 3, (q) => bounce(q, hb));
  },
};

export function drawClient(p) {
  drawPerson(p, CLIENT);
}
