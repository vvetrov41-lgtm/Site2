// Scene 4 - Tattooing: wide setup (4a), insert of the arm (4b), last touch (4c).
import { drawKristinaProfile } from '../characters/kristina.js';
import { drawClient } from '../characters/client.js';
import { FILL } from '../characters/rig.js';
import { tattooChair, stool, trolley, hangingLamp, floorLine } from '../props/studio.js';
import { buzz } from '../fx/effects.js';
import { shape, getCtx } from '../core/pencil.js';
import { camera, lines } from './common.js';

const MACH = 1.0; // machine angle in the wide shot (radians, pointing down-right)

function wideShot(f, o) {
  camera(1.12, 520, 1250);
  hangingLamp('s4.lamp', 530, 420, 1, [530, 1300, 150]);
  trolley('s4.trolley', 70, 1600, 0.72);
  floorLine(1612);
  tattooChair('s4.chair', 770, 1600, 1, 230);
  stool('s4.stool', 250, 1600, 1);

  let spot = null;
  drawClient({
    x: 770,
    y: 1600,
    s: 1,
    legs: { mode: 'sit' },
    expr: o.clientExpr,
    head: { turn: -0.15, tilt: o.clientTilt || 0 },
    look: o.clientLook || [-0.2, -0.7],
    tattoo: o.tattoo,
    armL: {
      t: [-330, -455],
      bend: 1,
      after: (hd, el) => {
        const m = getCtx().getTransform();
        spot = m.transformPoint(new DOMPoint(el[0] + (hd[0] - el[0]) * 0.5, el[1] + (hd[1] - el[1]) * 0.5 - 18));
      },
    },
    armR: { t: [150, -340] },
  });

  const kx = 260;
  const ky = 1600;
  const vib = o.buzz ? (f % 2 ? 3 : -3) : 0;
  const lift = o.lift || 0;
  const tip = [spot.x - kx, spot.y - ky - lift];
  const grip = [tip[0] - 6 - Math.cos(MACH) * 66, tip[1] - Math.sin(MACH) * 66];
  drawKristinaProfile({
    x: kx,
    y: ky,
    s: 1,
    mach: MACH,
    buzz: vib,
    handR: grip,
    handL: [spot.x - kx - 70, spot.y - ky + 26],
    nod: o.kNod || 0,
    expr: o.kExpr,
  });
  if (o.buzz) {
    buzz('s4.bz1', spot.x - 70, spot.y - 120, 46, -0.5);
    buzz('s4.bz2', spot.x - 110, spot.y - 80, 34, -0.5);
  }
}

export const S4A = {
  name: 'Tattooing - setup',
  len: 30,
  draw(f) {
    wideShot(f, {
      buzz: f >= 2 && f < 28,
      tattoo: 0,
      clientExpr: f === 12 || f === 13 ? 'blink' : 'calm',
    });
  },
};

export const S4C = {
  name: 'Tattooing - last touch',
  len: 24,
  draw(f) {
    const yawn = f >= 4 && f < 12;
    wideShot(f, {
      buzz: f < 14,
      lift: f >= 14 ? 14 : 0,
      tattoo: 0,
      clientExpr: yawn ? 'yawn' : f === 17 ? 'blink' : 'calm',
      clientTilt: yawn ? -0.08 : 0,
      clientLook: [-0.2, -0.7],
    });
  },
};

// ------------------------------------------------- concentration close-up --
// The tattoo itself is not shown while she works: it is revealed at the mirror.

export const S4B = {
  name: 'Tattooing - close-up',
  len: 36,
  draw(f) {
    camera(1);
    lines(1.3);
    hangingLamp('s4b.lamp', 760, 160, 1.3, [800, 1500, 260]);
    // client's forearm resting under Kristina's hands (tattoo hidden by her hands)
    shape('s4b.carm', [[600, 1520], [880, 1470], [1140, 1430], [1140, 1560], [880, 1590], [600, 1640]], { ...FILL.skin, w: 5 });
    const vib = f % 2 ? 3 : -3;
    const working = f < 32;
    drawKristinaProfile({
      x: 330,
      y: 2260,
      s: 2.05,
      mach: 0.95,
      buzz: working ? vib / 2 : 0,
      handR: [250, -404 + (working ? 0 : -14)],
      handL: [300, -350],
      expr: f === 14 || f === 15 ? 'blink' : undefined,
      squint: f >= 20 && f < 30,
      tilt: Math.floor(f / 6) % 2 ? 0.02 : 0,
    });
    if (working) {
      buzz('s4b.bz1', 820, 1300, 60, -0.5, 5);
      buzz('s4b.bz2', 900, 1380, 44, -0.5, 5);
    }
  },
};
