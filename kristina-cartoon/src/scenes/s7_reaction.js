// Scene 7 - Reaction: anticipation, "ooh", star eyes, then pure joy.
import { C } from '../config.js';
import { drawClient } from '../characters/client.js';
import { mirror } from '../props/studio.js';
import { burst, confetti, heart } from '../fx/effects.js';
import { camera, lines, HOORAY } from './common.js';
import { hop, hold } from '../core/anim.js';

export const S7 = {
  name: 'Reaction',
  len: 54,
  draw(f) {
    camera(1);
    lines(1.3);
    mirror('s7.mirror', 1230, 2240, 1.9);
    const joy = f >= 20;
    const h = joy ? hop(f, 20, 1) : { y: 0, sq: 1, i: -1 };
    const expr = f < 8 ? 'look' : f < 14 ? 'ooh' : f < 20 ? 'stars' : 'joy';
    const hb = h.i === 1 || h.i === 2 ? -28 : h.i === 5 || h.i === 0 ? 18 : 0;
    drawClient({
      x: 540,
      y: 2174,
      s: 1.85,
      tattoo: 1,
      expr,
      look: f < 8 ? [-0.55, 0.7] : [0, 0],
      head: { tilt: f < 8 ? -0.05 : 0 },
      hopY: h.y * 1.4,
      sq: f === 8 ? 1.04 : h.sq,
      hairBounce: hb,
      ...(joy ? HOORAY : { armL: { t: [0, -460], bend: -1 } }),
    });
    if (f >= 8 && f < 12) burst('s7.burst', 540, 760, 360, 420 + (f % 2) * 30, 12, 0.13, 6);
    if (f >= 12 && f < 20) {
      heart('s7.h1', 200, 470 - (f - 12) * 6, 60, C.pink, -0.2);
      heart('s7.h2', 880, 520 - (f - 12) * 6, 48, C.red, 0.2);
    }
    confetti('s7.c1', f, 20, 540, 640, 9, 380, 22);
    confetti('s7.c2', f, 32, 540, 620, 8, 360, 20);
    confetti('s7.c3', f, 44, 540, 640, 9, 380, 10);
  },
};
