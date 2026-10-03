// Kristina, the tattoo artist. See docs/CHARACTERS.md.
// Front view: drawKristina(pose) with pose.look = 'intro' | 'work'.
// Side profile (seated, working): drawKristinaProfile(pose).

import { C } from '../config.js';
import { shape, stroke, ell, getCtx, dot } from '../core/pencil.js';
import { ik2 } from '../core/anim.js';
import { drawPerson, FILL, limbPts, tubePts, hand, B, norm, sub, mid } from './rig.js';
import { kristinaFace, kristinaGlasses } from './faces.js';
import { star, heart } from '../fx/effects.js';
import { drawMachine } from '../props/items.js';

const HAIR = { fill: C.kHair, tint: 0.72, hatch: C.kHairHatch, hatchAlpha: 0.7, spacing: 8 };
const ROOTS = { fill: C.kRoots, tint: 0.22, hatch: C.kRoots, hatchAlpha: 0.5, occlude: false, ink: false, spacing: 6, lw: 4 };
const HEAD = [138, 150];
const SLEEVE = { ...FILL.black, fill: C.sleeve, tint: 0.85 };

function pearls(key, y0, sag, n, w) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = (t - 0.5) * w;
    const y = y0 + Math.sin(t * Math.PI) * sag;
    shape(`${key}.${i}`, ell(x, y, 7.5, 7.5, 6), { fill: C.pearl, tint: 1, hatchAlpha: 0, w: 2.6, wob: 0.5 });
  }
}

function rootsAtParting(key, nod = 0) {
  const y = nod * 10;
  // darker regrowth: short soft strokes fanning out from the parting
  const fan = [[-46, -150], [-30, -160], [-16, -168], [16, -168], [30, -160], [46, -150], [-22, -128], [22, -128]];
  fan.forEach(([x, yy], i) => {
    stroke(`${key}.${i}`, [[x * 0.15, -180 + y], [x * 0.6, (yy - 180) / 2 + y], [x, yy + y]], { w: 5, color: C.kRoots, alpha: 0.55 });
  });
  stroke(key + '.part', [[0, -184 + y], [3, -142 + y], [0, -106 + y]], { w: 4.5, color: C.kRoots });
}

const KRISTINA = {
  id: 'k',
  legW: [86, 84],
  pants: FILL.black,
  shoe(key, at, sg) {
    shape(key, ell(at[0] + sg * 14, at[1] + 6, 48, 21, 10), { fill: C.ink, tint: 0.9, hatch: C.blackHatch, w: 4.5 });
  },
  torso(p, d) {
    // oversized black top, dropped shoulders
    shape('k.top', [[-126, -540 + d], [-64, -576 + d], [0, -566 + d], [64, -576 + d], [126, -540 + d], [146, -470 + d], [138, -396 + d], [134, -312 + d], [0, -302 + d], [-134, -312 + d], [-138, -396 + d], [-146, -470 + d]], FILL.black);
    stroke('k.collar', [[-40, -572 + d], [0, -552 + d], [40, -572 + d]], { w: 3.5, color: '#6d6667' });
  },
  front(p, d) {
    if (p.outfit !== 'work') {
      pearls('k.pearlA', -560 + d, 26, 9, 92);
      pearls('k.pearlB', -556 + d, 50, 11, 118);
    }
  },
  sleeve(key, sh, el, hd) {
    const end = [el[0] + (hd[0] - el[0]) * 0.22, el[1] + (hd[1] - el[1]) * 0.22];
    shape(key, limbPts([sh[0] + (sh[0] > 0 ? -14 : 14), sh[1] - 6], el, end, 84, 78, 80), SLEEVE);
  },
  armDecor(p, side, sh, el, hd) {
    const t = [el[0] + (hd[0] - el[0]) * 0.6, el[1] + (hd[1] - el[1]) * 0.6];
    if (side === 'L') heart('k.tatL', t[0], t[1], 22, null);
    else star('k.tatR', t[0], t[1], 12, null);
  },
  hairBack(p) {
    const nod = p.head?.nod || 0;
    if (p.outfit === 'work') {
      // low ponytail peeking out behind the neck (screen left)
      shape('k.pony', [[-110, 96], [-156, 150], [-170, 230], [-150, 300], [-126, 270], [-122, 200], [-96, 140]], HAIR);
      shape('k.tie', ell(-112, 112, 16, 22, 7, 0.5), { fill: C.ink, tint: 1, w: 3 });
      shape('k.hairB', [[0, -178], [96, -164], [154, -104], [162, -30], [146, 30], [110, 70], [0, 80], [-110, 70], [-146, 30], [-162, -30], [-154, -104], [-96, -164]], HAIR);
      return;
    }
    // loose shoulder-length hair with flicked ends
    shape(
      'k.hairB',
      [[0, -172], [92, -160], [150, -106], [170, -20], [176, 70], [184, 150], [206, 214], [160, 222], [118, 230], [60, 214], [0, 206], [-60, 214], [-118, 230], [-160, 222], [-206, 214], [-184, 150], [-176, 70], [-170, -20], [-150, -106], [-92, -160]].map(([x, y]) => [x, y + (y > 100 ? nod * 6 : 0)]),
      HAIR,
    );
  },
  head(p) {
    if (p.outfit === 'work') {
      for (const s of [-1, 1]) shape(`k.ear${s}`, ell(s * 138, 22, 18, 28, 8), FILL.skin);
    }
    shape('k.head', [[0, -150], [76, -136], [126, -90], [138, -20], [132, 50], [108, 108], [58, 146], [0, 156], [-58, 146], [-108, 108], [-132, 50], [-138, -20], [-126, -90], [-76, -136]], FILL.skin);
  },
  face(p) {
    kristinaFace(p);
  },
  hairFront(p) {
    const nod = p.head?.nod || 0;
    const y = nod * 20;
    const work = p.outfit === 'work';
    if (work) {
      // pulled back; curtain fringe parted in the middle keeps the moon visible
      shape('k.cap', [[-146, -6], [-158, -84], [-120, -150], [-58, -180], [0, -186], [58, -180], [120, -150], [158, -84], [146, -6], [136, -24], [120, -44], [98, -56], [66, -74], [34, -92], [0, -100], [-34, -92], [-66, -74], [-98, -56], [-120, -44], [-136, -14]].map(([x, yy]) => [x, yy + y]), HAIR);
      for (const s of [-1, 1]) stroke(`k.cw${s}`, [[s * 20, -96 + y], [s * 70, -70 + y], [s * 118, -36 + y], [s * 136, 4 + y]], { w: 3, color: C.kHairHatch });
      rootsAtParting('k.roots', nod);
      stroke('k.str1', [[-60, -160 + y], [-110, -96 + y]], { w: 3, color: C.kHairHatch });
      stroke('k.str2', [[60, -160 + y], [108, -96 + y]], { w: 3, color: C.kHairHatch });
      // AirPod in the screen-right ear
      shape('k.pod', ell(150, 26, 10, 11, 7), { fill: C.white, tint: 1, hatchAlpha: 0, w: 3 });
      shape('k.podStem', [[146, 32], [156, 32], [158, 74], [148, 76]], { fill: C.white, tint: 1, hatchAlpha: 0, w: 3 });
      kristinaGlasses(p);
      return;
    }
    // soft wispy bangs that open around the moon
    shape(
      'k.bangs',
      [[-150, -6], [-154, -84], [-118, -144], [-58, -176], [0, -184], [58, -176], [118, -144], [154, -84], [150, -6], [132, -40], [104, -60], [76, -52], [50, -68], [24, -72], [0, -84], [-24, -72], [-50, -68], [-76, -52], [-104, -60], [-132, -40]].map(([x, yy]) => [x, yy + y]),
      HAIR,
    );
    rootsAtParting('k.roots', nod);
    for (let i = 0; i < 4; i++) {
      const x = -96 + i * 64 + (i > 1 ? 8 : -8);
      stroke(`k.wisp${i}`, [[x * 0.7, -130 + y], [x, -88 + y], [x + (i > 1 ? 6 : -6), -62 + y]], { w: 3, color: C.kHairHatch });
    }
    // a few strands framing the face
    stroke('k.lockL', [[-132, -30], [-146, 50], [-140, 130], [-152, 196]], { w: 3.2, color: C.kHairHatch });
    stroke('k.lockR', [[132, -30], [146, 50], [140, 130], [152, 196]], { w: 3.2, color: C.kHairHatch });
  },
};

/** Front view. pose.outfit: 'intro' (loose hair, pearls) | 'work' (ponytail, glasses, AirPod). */
export function drawKristina(p) {
  drawPerson({ outfit: 'intro', ...p }, KRISTINA);
}

// ---------------------------------------------------------- side profile --
// Seated, facing right. Local units: feet at y = 0.
//   p: { x, y, s, nod (0..1), blink, buzz (vibration px), mach: machine angle,
//        handR: [x, y] grip target, handL: [x, y] support hand target, expr }

const PROFILE_HEAD = [
  [0, -150], [72, -132], [118, -80], [130, -24], [150, 16], [130, 30], [128, 62], [104, 104], [54, 134], [-16, 142], [-86, 118], [-128, 62], [-140, -18], [-116, -96], [-64, -138],
];

export function drawKristinaProfile(p) {
  const ctx = getCtx();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s, p.s);
  const nod = p.nod || 0;
  const sh = [26, -462];
  const headC = [70 + nod * 10, -668 + nod * 14];

  // far arm (behind torso)
  const hl = p.handL || [250, -380];
  const [elL, hdL] = ik2(sh[0] - 6, sh[1] + 6, hl[0], hl[1], 128, 124, 1);
  shape('kp.armL', limbPts([sh[0] - 6, sh[1] + 6], elL, hdL, 44, 40, 36), FILL.skin);
  shape('kp.slL', limbPts([sh[0] - 6, sh[1] + 6], elL, [elL[0] + (hdL[0] - elL[0]) * 0.25, elL[1] + (hdL[1] - elL[1]) * 0.25], 88, 80, 82), SLEEVE);
  hand('kp.hL', hdL, norm(sub(hdL, elL)), 1, FILL.glove, 30);

  // legs: thigh forward, shin down
  const hip = [-6, -236];
  const knee = [126, -238];
  const foot = [138, -26];
  shape('kp.shin', tubePts(knee, foot, 72, 70), FILL.black);
  shape('kp.shoe', ell(166, -16, 52, 20, 10), { fill: C.ink, tint: 0.9, hatch: C.blackHatch, w: 4.5 });
  shape('kp.thigh', tubePts(hip, [knee[0] + 18, knee[1]], 92, 80), FILL.black);

  // oversized top
  shape('kp.top', [[-96, -470], [-40, -514], [40, -510], [94, -462], [104, -380], [108, -290], [116, -210], [40, -190], [-84, -196], [-118, -262], [-122, -380]], FILL.black);
  // neck + pearls peek
  shape('kp.neck', [[22, -500], [66, -506], [80, -560], [34, -566]], FILL.skin);
  for (let i = 0; i < 4; i++) shape(`kp.pearl${i}`, ell(36 + i * 14, -506 + i * 2, 6.5, 6.5, 6), { fill: C.pearl, tint: 1, hatchAlpha: 0, w: 2.4, wob: 0.4 });

  // head
  ctx.save();
  ctx.translate(headC[0], headC[1]);
  ctx.rotate(nod * 0.22 + (p.tilt || 0));
  // ponytail behind
  shape('kp.pony', [[-110, 40], [-168, 70], [-196, 140], [-184, 214], [-156, 196], [-150, 132], [-108, 90]], HAIR);
  shape('kp.tie', ell(-118, 62, 14, 20, 7, 0.6), { fill: C.ink, tint: 1, w: 3 });
  shape('kp.head', PROFILE_HEAD, FILL.skin);
  // hair cap swept back, fringe over the forehead
  shape('kp.hair', [[-150, -6], [-146, -96], [-96, -152], [0, -168], [80, -148], [124, -96], [136, -44], [112, -48], [96, -76], [60, -70], [20, -62], [-20, -36], [-44, -4], [-74, 30], [-118, 54]], HAIR);
  shape('kp.roots', [[-100, -140], [-20, -168], [60, -152], [20, -132], [-40, -118], [-90, -110]], ROOTS);
  stroke('kp.str', [[-40, -150], [-96, -70], [-120, 10]], { w: 3, color: C.kHairHatch });
  stroke('kp.str2', [[30, -150], [-20, -100], [-60, -30]], { w: 3, color: C.kHairHatch });
  // ear + AirPod
  shape('kp.ear', ell(-28, 24, 19, 28, 8), FILL.skin);
  shape('kp.pod', ell(-24, 22, 11, 11, 7), { fill: C.white, tint: 1, hatchAlpha: 0, w: 3 });
  shape('kp.podStem', [[-28, 28], [-18, 28], [-16, 70], [-27, 72]], { fill: C.white, tint: 1, hatchAlpha: 0, w: 3 });
  // face
  shape('kp.blush', ell(62, 54, 22, 12, 8), { fill: C.blush, tint: 0.25, hatchAlpha: 0.4, occlude: false, ink: false });
  const ey = 2;
  const ex = 80;
  if (p.expr === 'blink') stroke('kp.eyeC', [[ex - 18, ey + 4], [ex, ey + 10], [ex + 14, ey + 4]], { w: 6 });
  else {
    shape('kp.iris', ell(ex + 4, ey + 6 + nod * 6, 13, 18, 9), { fill: '#3a2b2b', tint: 1, hatch: C.ink, w: 3 });
    dot('kp.hl', ex, ey + 1 + nod * 6, 4, C.white);
    stroke('kp.lid', [[ex - 18, ey - 6 + nod * 8], [ex + 2, ey - 5 + nod * 8], [ex + 18, ey - 3 + nod * 8], [ex + 24, ey - 10 + nod * 8]], { w: 7 });
  }
  stroke('kp.brow', [[ex - 22, ey - 46], [ex + 2, ey - 44], [ex + 22, ey - 36]], { w: 6 });
  stroke('kp.mouth', [[104, 82], [120, 80]], { w: 4.4, color: C.lips });
  // glasses
  shape('kp.lens', ell(ex + 6, ey + 6, 36, 31, 10), { fill: C.glassTint, tint: 0.14, hatchAlpha: 0, occlude: false, w: 7 });
  stroke('kp.temple', [[ex - 30, ey - 2], [-20, -4]], { w: 6 });
  ctx.restore();

  // near arm with the machine
  const hr = p.handR || [230, -420];
  const bz = p.buzz || 0;
  const tgt = [hr[0] + bz, hr[1] - bz * 0.5];
  const [elR, hdR] = ik2(sh[0] + 10, sh[1], tgt[0], tgt[1], 128, 124, -1);
  shape('kp.armR', limbPts([sh[0] + 10, sh[1]], elR, hdR, 44, 40, 36), FILL.skin);
  shape('kp.slR', limbPts([sh[0] + 4, sh[1] - 8], elR, [elR[0] + (hdR[0] - elR[0]) * 0.25, elR[1] + (hdR[1] - elR[1]) * 0.25], 90, 82, 84), SLEEVE);
  if (p.mach !== undefined) drawMachine('kp.mach', hdR[0] + 6, hdR[1], p.mach, 0.75);
  hand('kp.hR', hdR, norm(sub(hdR, elR)), -1, FILL.glove, 31);
  ctx.restore();
}

export { B as BODY, mid };
