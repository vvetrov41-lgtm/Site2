// Scene 1 - Arrival. Kristina already waits, deadpan; the client walks in and waves.
import { drawKristina } from '../characters/kristina.js';
import { drawClient } from '../characters/client.js';
import { floorLine, tattooChair, ringLamp, frame } from '../props/studio.js';
import { note } from '../fx/effects.js';
import { camera, CROSSED, walkPhase } from './common.js';
import { clamp, hold } from '../core/anim.js';

export const S1 = {
  name: 'Arrival',
  len: 42,
  draw(f) {
    camera(1);
    frame('s1.fr1', 250, 470, 170, 150, 'sun', -0.04);
    frame('s1.fr2', 520, 440, 130, 160, 'heart', 0.05);
    ringLamp('s1.lamp', 1010, 1400, 0.75);
    tattooChair('s1.chair', 170, 1330, 0.5, 120);
    floorLine(1482);

    // client
    const walking = f < 26;
    const t = clamp(f / 26, 0, 1);
    const cx = -200 + 530 * t;
    const ph = walkPhase(f);
    const wave = f >= 29;
    const c = {
      x: cx,
      y: 1470,
      s: 0.82,
      expr: wave ? 'hopeful' : 'calm',
      head: { turn: wave ? 0.25 : 0.4 },
      look: wave ? [0.6, -0.1] : [0.6, 0],
      legs: walking ? { mode: 'walk', phase: ph } : { mode: 'stand' },
      hopY: walking ? -Math.abs(Math.sin(ph * Math.PI * 2)) * 9 : 0,
      sq: hold(f, [[0, 1], [26, 0.95], [27, 1.03], [28, 1]]),
      armL: walking ? { t: [-120 - 30 * Math.sin(ph * Math.PI * 2), -330] } : undefined,
      armR: wave ? { t: Math.floor((f - 29) / 3) % 2 ? [205, -805] : [170, -840], bend: -1 } : walking ? { t: [120 + 30 * Math.sin(ph * Math.PI * 2), -330] } : undefined,
    };
    drawClient(c);
    if (walking) {
      const k = Math.floor(f / 4) % 2;
      note('s1.note' + k, cx + (k ? 110 : 70), 600 - (f % 4) * 8, 1);
    }

    // Kristina: does not move, eyes follow
    drawKristina({
      x: 760,
      y: 1470,
      s: 0.82,
      ...CROSSED,
      expr: f === 34 || f === 35 ? 'blink' : 'serious',
      look: f < 8 ? [0, 0] : [-0.8, 0],
    });
  },
};
