// Scene 3 - Kristina studies the flower. Pause. One extremely serious nod.
import { drawKristina } from '../characters/kristina.js';
import { nodArcs } from '../fx/effects.js';
import { camera, lines, CROSSED } from './common.js';
import { seriousNodBeat, NOD_CAM } from './nod.js';

export const S3 = {
  name: 'Serious nod #1',
  len: 42,
  draw(f) {
    const b = seriousNodBeat(f);
    camera(b.zoom, 540, 900);
    lines(1.35);
    drawKristina({ x: NOD_CAM.x, y: NOD_CAM.headY + 770 * NOD_CAM.s, s: NOD_CAM.s, ...CROSSED, expr: b.expr, look: b.look, head: { nod: b.nod } });
    if (b.arcs) nodArcs('s3.arcs', 540, 1000, 340);
  },
};
