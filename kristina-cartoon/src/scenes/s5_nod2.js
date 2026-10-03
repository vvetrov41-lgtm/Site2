// Scene 5 - Finished. Pause. Exactly the same serious nod (shared beat + camera).
import { drawKristina } from '../characters/kristina.js';
import { drawMachine } from '../props/items.js';
import { nodArcs, burst } from '../fx/effects.js';
import { camera, lines } from './common.js';
import { seriousNodBeat, NOD_CAM } from './nod.js';
import { getCtx } from '../core/pencil.js';

export const S5 = {
  name: 'Serious nod #2',
  len: 42,
  draw(f) {
    const b = seriousNodBeat(f);
    camera(b.zoom, 540, 900);
    lines(1.35);
    let tipAt = null;
    let held = null;
    drawKristina({
      x: NOD_CAM.x,
      y: NOD_CAM.headY + 770 * NOD_CAM.s,
      s: NOD_CAM.s,
      outfit: 'work',
      gloves: true,
      expr: b.expr,
      look: b.look,
      head: { nod: b.nod },
      armR: { t: [-70, -445], bend: 1 },
      armL: {
        t: [70, -455],
        bend: -1,
        after: (hd) => {
          held = { m: getCtx().getTransform(), hd };
        },
      },
    });
    if (held) {
      // the machine rests in her gloved hand, needle up, drawn over the crossed arms
      const ctx = getCtx();
      ctx.save();
      ctx.setTransform(held.m);
      const a = -Math.PI / 2 + 0.5;
      const lift = f === 0 ? 0 : 22;
      const g = [held.hd[0] + 10, held.hd[1] - 40 - lift];
      drawMachine('s5.mach', g[0], g[1], a, 0.6, true);
      tipAt = ctx.getTransform().transformPoint(new DOMPoint(g[0] + Math.cos(a) * 64, g[1] + Math.sin(a) * 64));
      ctx.restore();
    }
    if (f >= 1 && f < 4 && tipAt) burst('s5.p', tipAt.x, tipAt.y, 40, 80, 7, 0.3, 5);
    if (b.arcs) nodArcs('s5.arcs', 540, 1000, 340);
  },
};
