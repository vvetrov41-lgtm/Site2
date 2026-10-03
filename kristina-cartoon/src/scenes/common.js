// Shared scene helpers.
import { getCtx, setLineScale } from '../core/pencil.js';

/** Static camera with an optional stepped push-in around a focus point. */
export function camera(zoom = 1, fx = 540, fy = 960) {
  const ctx = getCtx();
  ctx.setTransform(zoom, 0, 0, zoom, fx * (1 - zoom), fy * (1 - zoom));
}

/** Lines get a touch thicker in close-ups (same marker, bigger drawing). */
export function lines(k) {
  setLineScale(k);
}

/** Crossed arms for the front-view rig. */
export const CROSSED = { armL: { t: [70, -455], bend: -1 }, armR: { t: [-70, -445], bend: 1 } };

/** Hands up! */
export const HOORAY = { armL: { t: [-200, -930], bend: 1 }, armR: { t: [200, -930], bend: -1 }, armsOver: true };

export const walkPhase = (f) => (f % 8) / 8;
