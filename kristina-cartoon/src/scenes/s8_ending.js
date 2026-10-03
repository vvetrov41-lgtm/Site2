// Scene 8 - Kristina finally breaks. Both celebrate. Final hold.
import { C } from '../config.js';
import { drawKristina } from '../characters/kristina.js';
import { drawClient } from '../characters/client.js';
import { frame, floorLine, plant } from '../props/studio.js';
import { burst, confetti, heart, sparkle, star } from '../fx/effects.js';
import { camera, CROSSED, HOORAY } from './common.js';
import { hop } from '../core/anim.js';

export const S8 = {
  name: 'Happy ending',
  len: 48,
  draw(f) {
    camera(1);
    frame('s8.fr1', 230, 420, 150, 130, 'sun', -0.05);
    frame('s8.fr2', 560, 380, 120, 140, 'heart', 0.04);
    plant('s8.plant', 1000, 1640, 0.62);
    floorLine(1652);

    const clientHop = f < 10 ? hop(f, 0, 0.8) : f >= 14 && f < 30 ? hop(f, 14, 0.9) : { y: 0, sq: 1, i: -1 };
    const kHop = f >= 17 && f < 29 ? hop(f, 17, 0.8) : { y: 0, sq: 1, i: -1 };
    const broke = f >= 13;
    const kExpr = broke ? 'happy' : f >= 10 ? 'twitch' : 'serious';
    const kArms = f < 13 ? CROSSED : f === 13 ? { armL: { t: [-170, -700], bend: 1 }, armR: { t: [170, -700], bend: -1 }, armsOver: true } : HOORAY;

    drawKristina({
      x: 300,
      y: 1640,
      s: 1,
      outfit: 'work',
      gloves: true,
      expr: kExpr,
      look: f < 6 ? [0, 0] : f < 13 ? [0.85, 0] : [0, 0],
      head: { turn: f >= 6 && f < 13 ? 0.15 : 0 },
      hopY: kHop.y,
      sq: kHop.sq,
      ...kArms,
    });
    const hb = clientHop.i === 1 || clientHop.i === 2 ? -24 : clientHop.i === 5 ? 16 : 0;
    drawClient({
      x: 780,
      y: 1640,
      s: 1,
      tattoo: 1,
      expr: 'joy',
      head: { turn: f >= 10 && f < 14 ? -0.3 : 0 },
      hopY: clientHop.y,
      sq: clientHop.sq,
      hairBounce: hb,
      ...HOORAY,
    });

    if (f >= 13 && f < 16) burst('s8.burst', 300, 830, 200, 250 + (f % 2) * 20, 10, 0.2, 5);
    confetti('s8.c1', f, 14, 540, 700, 10, 420, 16);
    if (f >= 30) {
      // final hold: hearts drift up in 2-frame steps, sparkles twinkle
      const up = Math.floor((f - 30) / 2) * 5;
      heart('s8.h1', 540, 560 - up, 70, C.pink, -0.1);
      heart('s8.h2', 150, 700 - up * 0.8, 50, C.red, -0.25);
      heart('s8.h3', 940, 650 - up * 0.9, 56, C.pink, 0.2);
      const tw = Math.floor(f / 3) % 2;
      star('s8.s1', 420, 470, tw ? 34 : 28, C.yellow, 0.1);
      star('s8.s2', 700, 500, tw ? 26 : 32, C.yellow, -0.1);
      sparkle('s8.k1', 80, 520, tw ? 26 : 34, C.blue);
      sparkle('s8.k2', 1000, 470, tw ? 34 : 24, C.pink);
    }
  },
};
