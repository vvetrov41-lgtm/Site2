// Scene order and frame lookup. 12 fps; 420 frames = 35 s.
import { S1 } from './scenes/s1_arrival.js';
import { S2 } from './scenes/s2_flower.js';
import { S3 } from './scenes/s3_nod1.js';
import { S4A, S4B, S4C } from './scenes/s4_tattoo.js';
import { S5 } from './scenes/s5_nod2.js';
import { S6 } from './scenes/s6_mirror.js';
import { S7 } from './scenes/s7_reaction.js';
import { S8 } from './scenes/s8_ending.js';

export const SCENES = [
  { id: '1', ...S1 },
  { id: '2', ...S2 },
  { id: '3', ...S3 },
  { id: '4a', ...S4A },
  { id: '4b', ...S4B },
  { id: '4c', ...S4C },
  { id: '5', ...S5 },
  { id: '6', ...S6 },
  { id: '7', ...S7 },
  { id: '8', ...S8 },
];

let acc = 0;
for (const s of SCENES) {
  s.start = acc;
  acc += s.len;
}
export const TOTAL = acc;

export function sceneAt(frame) {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (frame >= SCENES[i].start) return { scene: SCENES[i], local: frame - SCENES[i].start, index: i };
  }
  return { scene: SCENES[0], local: 0, index: 0 };
}
