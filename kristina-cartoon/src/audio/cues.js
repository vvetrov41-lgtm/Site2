// Sound-effect cues: { scene id, local frame (12 fps), sound, arg }. No voices.
// Scene-relative so cues stay in sync when a scene length is tuned.
export const CUES = [
  { sc: '2', f: 8, s: 'ting' },
  { sc: '3', f: 24, s: 'tock' },
  { sc: '4a', f: 2, s: 'buzz', a: 2.2 },
  { sc: '4b', f: 0, s: 'buzz', a: 2.65 },
  { sc: '4c', f: 0, s: 'buzz', a: 1.15 },
  { sc: '5', f: 1, s: 'pop' },
  { sc: '5', f: 24, s: 'tock' },
  { sc: '7', f: 20, s: 'twinkle' },
  { sc: '8', f: 14, s: 'twinkle' },
  { sc: '8', f: 23, s: 'tock', a: true },
];
