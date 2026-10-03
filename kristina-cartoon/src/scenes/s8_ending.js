// Scene 8 - The client is delighted; Kristina finally allows herself a quiet, satisfied smile.
import { C } from '../config.js';
import { drawKristina } from '../characters/kristina.js';
import { drawClient } from '../characters/client.js';
import { frame, floorLine, plant } from '../props/studio.js';
import { heart, sparkle, star } from '../fx/effects.js';
import { camera, CROSSED } from './common.js';
import { hold } from '../core/anim.js';

export const S8 = {
  name: 'Happy ending',
  len: 48,
  draw(f) {
    camera(1);
    frame('s8.fr1', 230, 420, 150, 130, 'sun', -0.05);
    frame('s8.fr2', 560, 380, 120, 140, 'heart', 0.04);
    plant('s8.plant', 1000, 1640, 0.62);
    floorLine(1652);

    const kExpr = f >= 14 ? 'content' : f >= 11 ? 'twitch' : 'serious';
    const kNod = hold(f, [[0, 0], [22, 0.45], [23, 0.8], [26, 0.4], [27, 0]]);
    drawKristina({
      x: 300,
      y: 1640,
      s: 1,
      outfit: 'work',
      glasses: false,
      gloves: true,
      expr: kExpr,
      look: f < 6 ? [0, 0] : f < 14 ? [0.85, 0] : [0, 0],
      head: { turn: f >= 6 && f < 14 ? 0.15 : 0, nod: kNod, tilt: f >= 14 ? 0.04 : 0 },
      ...CROSSED,
    });
    const sway = [0, 0.025, 0, -0.025][Math.floor(f / 6) % 4];
    drawClient({
      x: 780,
      y: 1640,
      s: 1,
      tattoo: 1,
      expr: 'joy',
      head: { turn: -0.25, tilt: sway },
      lean: -0.03 + sway,
      armL: { t: [0, -460], bend: -1 },
      armR: { t: [118, -700], bend: -1 },
      armsOver: true,
    });

    // soft, floating doodles; no confetti explosions
    const up = Math.floor(f / 2) * 5;
    heart('s8.h1', 540, 640 - up, 60, C.pink, -0.1);
    heart('s8.h2', 900, 520 - up * 0.8, 48, C.red, 0.2);
    if (f >= 14) {
      const u2 = Math.floor((f - 14) / 2) * 5;
      heart('s8.h3', 160, 720 - u2, 52, C.pink, -0.25);
      heart('s8.h4', 430, 560 - u2 * 0.9, 40, C.red, 0.15);
    }
    const tw = Math.floor(f / 3) % 2;
    star('s8.s1', 660, 470, tw ? 30 : 24, C.yellow, 0.1);
    sparkle('s8.k1', 90, 560, tw ? 24 : 32, C.blue);
    sparkle('s8.k2', 1000, 760, tw ? 32 : 22, C.pink);
    if (f >= 14) sparkle('s8.k3', 470, 820, tw ? 22 : 30, C.yellow);
  },
};
