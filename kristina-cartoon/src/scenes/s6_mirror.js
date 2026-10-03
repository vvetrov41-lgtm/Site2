// Scene 6 - The mirror. She walks over, lifts the arm, and simply looks. Silence.
import { drawClient } from '../characters/client.js';
import { mirror, mirrorGlass, plant, frame, floorLine } from '../props/studio.js';
import { withClip, getCtx } from '../core/pencil.js';
import { camera, walkPhase } from './common.js';
import { clamp, hold } from '../core/anim.js';

const MX = 820;

function clientPose(f) {
  const walking = f < 16;
  const t = clamp(f / 16, 0, 1);
  const x = 140 + 340 * t;
  const ph = walkPhase(f);
  const arm = hold(f, [[0, null], [18, { t: [-110, -400], bend: -1 }], [20, { t: [0, -460], bend: -1 }]]);
  return {
    x,
    y: 1500,
    s: 0.86,
    tattoo: 1,
    expr: f === 31 || f === 32 ? 'blink' : walking ? 'calm' : 'look',
    head: { turn: walking ? 0.4 : 0.55 },
    look: walking ? [0.6, 0] : [0.9, 0.05],
    legs: walking ? { mode: 'walk', phase: ph } : { mode: 'stand' },
    hopY: walking ? -Math.abs(Math.sin(ph * Math.PI * 2)) * 9 : 0,
    sq: hold(f, [[0, 1], [16, 0.95], [17, 1.03], [18, 1]]),
    lean: f >= 36 ? 0.04 : 0,
    armL: arm || (walking ? { t: [-120 - 30 * Math.sin(ph * Math.PI * 2), -330] } : undefined),
    armR: walking ? { t: [120 + 30 * Math.sin(ph * Math.PI * 2), -330] } : undefined,
  };
}

export const S6 = {
  name: 'The mirror',
  len: 44,
  draw(f) {
    const zoom = f < 24 ? 1 : Math.min(1.08, 1 + 0.016 * (1 + Math.floor((f - 24) / 4)));
    camera(zoom, 640, 1060);
    frame('s6.fr', 400, 460, 130, 130, 'star', -0.05);
    plant('s6.plant', 70, 1500, 0.7);
    floorLine(1512);
    const p = clientPose(f);
    mirror('s6.mirror', MX, 1500, 1, () => {
      withClip(mirrorGlass(MX, 1500, 1), () => {
        const ctx = getCtx();
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.translate(MX + 30 - (p.x - 140) * 0.12, 0);
        ctx.scale(-1, 1);
        drawClient({ ...p, x: 0, y: 1440, s: 0.6, head: { turn: -p.head.turn }, look: [-p.look[0], p.look[1]], hopY: (p.hopY || 0) * 0.7 });
        ctx.restore();
      });
    });
    drawClient(p);
  },
};
