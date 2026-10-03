// Scene 7 - Reaction: anticipation, "ooh", star eyes, then pure delight (no jumping).
import { C } from '../config.js';
import { drawClient } from '../characters/client.js';
import { mirror } from '../props/studio.js';
import { burst, heart, sparkle } from '../fx/effects.js';
import { camera, lines } from './common.js';

// tattooed forearm held across the chest, other hand on the cheek
const SHOW_ARM = { t: [0, -460], bend: -1 };
const CHEEK = { t: [118, -700], bend: -1 };

export const S7 = {
  name: 'Reaction',
  len: 54,
  draw(f) {
    camera(1);
    lines(1.3);
    mirror('s7.mirror', 1230, 2240, 1.9);
    const delight = f >= 20;
    const expr = f < 8 ? 'look' : f < 14 ? 'ooh' : f < 20 ? 'stars' : 'joy';
    // gentle rocking from side to side, one pose every 6 drawings
    const sway = delight ? [0, 0.03, 0, -0.03][Math.floor((f - 20) / 6) % 4] : 0;
    drawClient({
      x: 540,
      y: 2174,
      s: 1.75,
      tattoo: 1,
      expr,
      look: f < 8 ? [-0.55, 0.7] : [0, 0],
      head: { tilt: f < 8 ? -0.05 : sway * 1.5 },
      lean: sway,
      sq: f === 8 ? 1.03 : 1,
      armL: SHOW_ARM,
      armR: delight ? CHEEK : undefined,
      armsOver: delight,
    });
    if (f >= 8 && f < 12) burst('s7.burst', 540, 760, 380, 440 + (f % 2) * 30, 12, 0.13, 6);
    if (f >= 12) {
      // hearts float up in 2-drawing steps
      const up = Math.floor((f - 12) / 2) * 7;
      heart('s7.h1', 190, 520 - up, 64, C.pink, -0.2);
      heart('s7.h2', 890, 600 - up * 0.8, 52, C.red, 0.2);
      if (f >= 26) heart('s7.h3', 300, 700 - (up - 49) * 0.9, 44, C.pink, 0.15);
      if (f >= 30) heart('s7.h4', 820, 820 - (up - 63) * 0.9, 58, C.pink, -0.1);
    }
    if (delight) {
      const tw = Math.floor(f / 3) % 2;
      sparkle('s7.k1', 150, 860, tw ? 30 : 22, C.yellow);
      sparkle('s7.k2', 930, 980, tw ? 22 : 32, C.yellow);
      sparkle('s7.k3', 820, 380, tw ? 26 : 20, C.blue);
    }
  },
};
