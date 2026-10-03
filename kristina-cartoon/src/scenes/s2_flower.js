// Scene 2 - The flower on the phone.
import { drawKristina } from '../characters/kristina.js';
import { drawClient } from '../characters/client.js';
import { drawPhone } from '../props/items.js';
import { frame, floorLine } from '../props/studio.js';
import { burst, sparkle } from '../fx/effects.js';
import { camera, CROSSED } from './common.js';
import { hold } from '../core/anim.js';
import { getCtx } from '../core/pencil.js';

export const S2 = {
  name: 'The flower',
  len: 42,
  draw(f) {
    camera(1);
    frame('s2.fr', 560, 330, 140, 120, 'rainbow', 0.03);
    floorLine(1712);
    const hand = hold(f, [[0, [110, -350]], [5, [104, -330]], [6, [150, -480]], [7, [170, -560]]]);
    const phoneScale = f < 6 ? 0 : f === 6 ? 0.7 : 1;
    const phoneAt = [];
    drawClient({
      x: 300,
      y: 1700,
      s: 1.12,
      expr: f < 7 ? 'calm' : f === 26 || f === 27 ? 'blink' : 'hopeful',
      head: { turn: 0.25 },
      look: [0.6, -0.1],
      armR: {
        t: hand,
        bend: -1,
        after: (hd) => {
          if (phoneScale) phoneAt.push({ m: getCtx().getTransform(), hd });
        },
      },
    });
    drawKristina({
      x: 810,
      y: 1700,
      s: 1.12,
      ...CROSSED,
      expr: 'serious',
      lean: hold(f, [[0, 0], [14, -0.03], [16, -0.06]]),
      head: { turn: f >= 14 ? -0.2 : 0, tilt: f >= 14 ? -0.05 : 0 },
      look: f < 10 ? [-0.5, 0] : [-0.85, 0.45],
    });
    if (phoneAt[0]) {
      // phone on top of everything so the flower is never covered
      const { m, hd } = phoneAt[0];
      const ctx = getCtx();
      ctx.save();
      ctx.setTransform(m);
      drawPhone('s2.phone', hd[0] + 6, hd[1] - 128 * phoneScale, phoneScale * 1.12);
      ctx.restore();
    }
    if (f >= 8 && f < 14 && phoneAt[0]) {
      const { m, hd } = phoneAt[0];
      const p = m.transformPoint(new DOMPoint(hd[0] + 6, hd[1] - 128));
      burst('s2.ting', p.x, p.y, 200, 240 + (f % 2) * 14, 10, 0.2, 5);
      sparkle('s2.sp1', p.x + 130, p.y - 170, f % 2 ? 30 : 24, '#f8cf47');
      sparkle('s2.sp2', p.x - 120, p.y - 150, f % 2 ? 20 : 26, '#f47aa8');
    }
  },
};
