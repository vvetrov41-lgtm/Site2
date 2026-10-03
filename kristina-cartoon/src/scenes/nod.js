// The serious-nod beat, shared by scenes 3 and 5 so both nods are identical.
import { hold } from '../core/anim.js';

export function seriousNodBeat(f) {
  return {
    zoom: hold(f, [[0, 1], [10, 1.015], [12, 1.03], [14, 1.045], [16, 1.06]]),
    expr: f >= 10 && f < 20 ? 'squint' : 'serious',
    look: f >= 31 ? [0, 0] : [-0.6, 0.55],
    nod: hold(f, [[0, 0], [22, 0.45], [23, 0.85], [24, 1], [29, 0.55], [30, 0.15], [31, 0]]),
    arcs: f >= 24 && f < 28,
  };
}

export const NOD_CAM = { x: 540, headY: 880, s: 2.2 };
