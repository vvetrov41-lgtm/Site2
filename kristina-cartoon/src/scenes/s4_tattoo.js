// Scene 4 - Tattooing: wide setup (4a), insert of the arm (4b), last touch (4c).
import { C } from '../config.js';
import { drawKristinaProfile } from '../characters/kristina.js';
import { drawClient } from '../characters/client.js';
import { hand, FILL, tubePts } from '../characters/rig.js';
import { tattooChair, stool, trolley, hangingLamp, floorLine } from '../props/studio.js';
import { drawFlower, drawMachine, flowerInkTip, flowerColorTip } from '../props/items.js';
import { buzz, sparkle, heart, star } from '../fx/effects.js';
import { shape, stroke, ell, getCtx } from '../core/pencil.js';
import { camera, lines } from './common.js';
import { hold } from '../core/anim.js';

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
      tattoo: { ink: Math.min(0.14, Math.max(0, (f - 2) / 26) * 0.14), color: 0 },
      clientExpr: f === 12 || f === 13 ? 'blink' : 'calm',
    });
  },
};

export const S4C = {
  name: 'Tattooing - last touch',
  len: 20,
  draw(f) {
    const yawn = f >= 4 && f < 12;
    wideShot(f, {
      buzz: f < 14,
      lift: f >= 14 ? 14 : 0,
      tattoo: { ink: 1, color: 1 },
      clientExpr: yawn ? 'yawn' : f === 17 ? 'blink' : 'calm',
      clientTilt: yawn ? -0.08 : 0,
      clientLook: [-0.2, -0.7],
    });
  },
};

// ---------------------------------------------------------------- insert --

const FL = { x: 560, y: 990, size: 300 };
const DIR = (() => {
  const a = Math.atan2(0.83, 0.55);
  return [Math.cos(a), Math.sin(a), a];
})();

function armInsert() {
  // armrest pad
  shape('s4b.pad', [[-40, 1150], [1120, 1130], [1120, 1270], [-40, 1290]], { fill: C.black, tint: 0.85, hatch: C.blackHatch, hatchAlpha: 0.5 });
  // forearm (client) across the frame, wrist on the left
  shape('s4b.arm', [[150, 870], [420, 846], [760, 830], [1130, 812], [1130, 1190], [760, 1176], [420, 1162], [150, 1130]], { ...FILL.skin, ink: C.ink, w: 6 });
  // relaxed hand
  shape('s4b.thumb', ell(120, 868, 70, 36, 8, -0.35), { ...FILL.skin, w: 6 });
  shape('s4b.hand', [[180, 880], [60, 880], [-30, 905], [-40, 1000], [-30, 1100], [60, 1130], [180, 1120]], { ...FILL.skin, w: 6 });
  for (let i = 0; i < 3; i++) stroke(`s4b.fing${i}`, [[-38, 950 + i * 52], [30, 956 + i * 52]], { w: 4 });
}

function kHand(key, at, ang, decor = null) {
  // Kristina's forearm entering from off-screen: glove cuff, bare skin, black sleeve far back
  const c = Math.cos(ang);
  const sn = Math.sin(ang);
  const P = (d) => [at[0] - c * d, at[1] - sn * d];
  shape(key + '.sleeve', tubePts(P(900), P(330), 170, 160), { fill: C.sleeve, tint: 0.85, hatch: C.blackHatch, hatchAlpha: 0.5 });
  shape(key + '.skin', tubePts(P(360), P(70), 104, 96), FILL.skin);
  shape(key + '.cuff', tubePts(P(120), P(40), 112, 108), FILL.glove);
  if (decor) decor(P(230));
}

export const S4B = {
  name: 'Tattooing - insert',
  len: 48,
  draw(f) {
    camera(1);
    lines(1.4);
    armInsert();

    let ink = 0;
    let color = 0;
    let tipU;
    let lift = 0;
    let buzzing = false;
    let back = 0;
    if (f < 2) {
      lift = f === 0 ? 70 : 28;
      tipU = flowerInkTip(0);
    } else if (f < 25) {
      ink = (f - 2) / 22;
      tipU = flowerInkTip(ink);
      buzzing = true;
    } else if (f < 28) {
      ink = 1;
      lift = 40;
      tipU = flowerInkTip(1);
    } else if (f < 40) {
      ink = 1;
      color = Math.min(1, (f - 27) / 11);
      const c = flowerColorTip(Math.min(0.999, (f - 28) / 11));
      tipU = [c[0] + Math.cos(f * 2.1) * 0.012, c[1] + Math.sin(f * 2.1) * 0.012];
      buzzing = true;
    } else {
      ink = 1;
      color = 1;
      tipU = flowerColorTip(0.999);
      lift = 60;
      back = hold(f, [[40, 0], [42, 120], [44, 260]]);
    }
    drawFlower('s4b.fl', FL.x, FL.y, FL.size, { ink, color }, 5);

    const vib = buzzing ? (f % 2 ? 4 : -4) : 0;
    const T = [FL.x + tipU[0] * FL.size + vib, FL.y + tipU[1] * FL.size - lift - back * DIR[1] + vib * 0.5];
    T[0] -= back * DIR[0];
    const ms = 2.3;
    const grip = [T[0] - DIR[0] * 106 * ms, T[1] - DIR[1] * 106 * ms];
    // support hand on the right, stretching the skin
    const la = Math.atan2(1, 0.3);
    kHand('s4b.kL', [940, 905], la, (p) => heart('s4b.tatL', p[0], p[1], 46, null));
    hand('s4b.kLh', [940, 905], [Math.cos(la), Math.sin(la)], 1, FILL.glove, 66);
    kHand('s4b.kR', [grip[0] - DIR[0] * 30, grip[1] - DIR[1] * 30], DIR[2], (p) => star('s4b.tatR', p[0], p[1], 26, null));
    drawMachine('s4b.mach', grip[0], grip[1], DIR[2], ms, false);
    hand('s4b.kRh', [grip[0] - DIR[0] * 6, grip[1] - DIR[1] * 6], [DIR[0], DIR[1]], -1, FILL.glove, 58);
    if (buzzing) {
      buzz('s4b.bz1', grip[0] - 150, grip[1] - 10, 70, -0.6, 5);
      buzz('s4b.bz2', grip[0] - 90, grip[1] + 90, 50, -0.6, 5);
    }
    if (f >= 43) {
      sparkle('s4b.sp1', FL.x + 190, FL.y - 150, f % 3 ? 34 : 26);
      sparkle('s4b.sp2', FL.x - 180, FL.y - 60, f % 3 ? 22 : 30, C.pink);
    }
  },
};
