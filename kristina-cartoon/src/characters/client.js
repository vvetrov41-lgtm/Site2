// The client. See docs/CHARACTERS.md.

import { C } from '../config.js';
import { shape, stroke, ell } from '../core/pencil.js';
import { drawPerson, FILL, limbPts } from './rig.js';
import { clientFace } from './faces.js';
import { drawFlower } from '../props/items.js';

const HAIR = { fill: C.cHair, tint: 0.68, hatch: C.cHairDark, hatchAlpha: 0.55, spacing: 9 };

// Lower hair points swing with p.hairBounce (positive = lifted).
const bounce = (pts, hb) =>
  pts.map(([x, y]) => {
    if (y <= 150) return [x, y];
    const k = (y - 150) / 260;
    return [x * (1 - (hb / 100) * k * 0.25), y - hb * k];
  });

const CLIENT = {
  id: 'c',
  legW: [80, 94],
  pants: FILL.jeans,
  shoe(key, at, sg) {
    shape(key, ell(at[0] + sg * 14, at[1] + 6, 46, 20, 10), { ...FILL.sneaker, w: 4.5 });
    stroke(key + '.sole', [[at[0] + sg * 14 - 40, at[1] + 14], [at[0] + sg * 14 + 40, at[1] + 14]], { w: 3, color: C.lilacDark });
  },
  torso(p, d) {
    shape('c.top', [[-110, -546 + d], [-66, -574 + d], [-30, -578 + d], [0, -558 + d], [30, -578 + d], [66, -574 + d], [110, -546 + d], [114, -470 + d], [100, -400 + d], [106, -330 + d], [0, -322 + d], [-106, -330 + d], [-100, -400 + d], [-114, -470 + d]], FILL.lilac);
    stroke('c.collar', [[-30, -574 + d], [0, -552 + d], [30, -574 + d]], { w: 3.4, color: C.lilacDark });
    stroke('c.belt', [[-104, -326 + d], [0, -320 + d], [104, -326 + d]], { w: 3.4, color: C.jeansDark });
  },
  sleeve(key, sh, el, hd) {
    const end = [sh[0] + (el[0] - sh[0]) * 0.45, sh[1] + (el[1] - sh[1]) * 0.45];
    const m = [(sh[0] + end[0]) / 2, (sh[1] + end[1]) / 2];
    shape(key, limbPts([sh[0] + (sh[0] > 0 ? -12 : 12), sh[1] - 4], m, end, 66, 64, 62), FILL.lilac);
  },
  armDecor(p, side, sh, el, hd) {
    if (side !== 'L' || !p.tattoo) return;
    const t = [el[0] + (hd[0] - el[0]) * 0.5, el[1] + (hd[1] - el[1]) * 0.5];
    const prog = typeof p.tattoo === 'number' ? { ink: p.tattoo, color: p.tattoo } : p.tattoo;
    drawFlower('c.tattoo', t[0], t[1] + 2, 56, prog, 3.2);
  },
  hairBack(p) {
    const hb = p.hairBounce || 0;
    shape(
      'c.hairB',
      bounce(
        [[0, -184], [92, -168], [158, -112], [186, -20], [194, 80], [210, 170], [198, 260], [216, 340], [192, 404], [140, 414], [90, 398], [40, 408], [-40, 408], [-90, 398], [-140, 414], [-192, 404], [-216, 340], [-198, 260], [-210, 170], [-194, 80], [-186, -20], [-158, -112], [-92, -168]],
        hb,
      ),
      HAIR,
    );
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
    shape('c.lockR', bounce([[150, -64], [178, 10], [170, 92], [188, 172], [172, 252], [186, 322], [160, 366], [130, 334], [142, 262], [124, 182], [138, 100], [120, 22], [126, -40]], hb), HAIR);
    shape('c.lockL', bounce([[-150, -64], [-178, 10], [-172, 90], [-190, 174], [-170, 254], [-186, 324], [-158, 364], [-130, 332], [-144, 260], [-124, 180], [-136, 98], [-118, 22], [-126, -40]], hb), HAIR);
    stroke('c.strand1', bounce([[164, 40], [150, 140], [166, 240], [152, 320]], hb), { w: 3.2, color: C.cHairDark });
    stroke('c.strand2', bounce([[-164, 40], [-152, 140], [-168, 240], [-152, 320]], hb), { w: 3.2, color: C.cHairDark });
  },
};

export function drawClient(p) {
  drawPerson(p, CLIENT);
}
