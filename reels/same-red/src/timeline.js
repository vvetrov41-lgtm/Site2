// All timings in one place (seconds). Each segment maps time to an eased 0..1.
// Rule for the loop: every segment ends by 15.6 s and the state after the
// last segment equals the state at 0 s. Last segment ends at 15.85 s.

export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  in: (x) => x * x * x,
  out: (x) => 1 - (1 - x) ** 3,
  // Heavier version for big moves.
  inOut4: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2),
};

export const segments = [
  // 0–2 s: hook
  { id: 'plate.labelsOut', start: 0.7, end: 1.1, ease: 'inOut' },
  { id: 'plate.split', start: 0.85, end: 1.45, ease: 'inOut' },
  { id: 'plate.round', start: 1.2, end: 1.9, ease: 'inOut' },
  { id: 'plate.travel', start: 1.35, end: 2.35, ease: 'inOut4' },
  { id: 'plate.tileOut', start: 1.1, end: 1.9, ease: 'inOut' },
  { id: 'hook.out', start: 2.0, end: 2.6, ease: 'inOut' },

  // 2–5 s: hands, fall, spread, counters
  { id: 'hands.draw', start: 1.9, end: 3.1, ease: 'inOut' },
  { id: 'hands.fill', start: 2.4, end: 3.2, ease: 'inOut' },
  { id: 'base.draw', start: 1.9, end: 2.9, ease: 'inOut' },
  { id: 'drop.fall.0', start: 2.75, end: 3.25, ease: 'in' },
  { id: 'drop.fall.1', start: 2.87, end: 3.37, ease: 'in' },
  { id: 'drop.fall.2', start: 2.99, end: 3.49, ease: 'in' },
  { id: 'stain.spread.0', start: 3.25, end: 4.25, ease: 'out' },
  { id: 'stain.spread.1', start: 3.37, end: 4.37, ease: 'out' },
  { id: 'stain.spread.2', start: 3.49, end: 4.49, ease: 'out' },
  { id: 'stain.settle.0', start: 3.4, end: 4.8, ease: 'inOut' },
  { id: 'stain.settle.1', start: 3.52, end: 4.92, ease: 'inOut' },
  { id: 'stain.settle.2', start: 3.64, end: 5.04, ease: 'inOut' },
  { id: 'labels.in', start: 3.3, end: 4.1, ease: 'inOut' },

  // 5–7 s
  { id: 'results.in', start: 5.0, end: 5.9, ease: 'out' },
  { id: 'results.out', start: 6.5, end: 7.0, ease: 'inOut' },

  // 7–13 s: dropper (keyframes below), no titles
  // 13–16 s
  { id: 'recipes.in', start: 13.3, end: 14.1, ease: 'out' },
  { id: 'labels.out', start: 14.05, end: 14.5, ease: 'inOut' },
  { id: 'recipes.out', start: 14.3, end: 14.75, ease: 'inOut' },
  { id: 'stain.retract', start: 14.1, end: 14.6, ease: 'inOut' },
  { id: 'drop.rise', start: 14.6, end: 15.0, ease: 'inOut' },
  { id: 'hands.out', start: 14.55, end: 15.3, ease: 'inOut4' },
  { id: 'plate.unTravel', start: 15.0, end: 15.55, ease: 'inOut4' },
  { id: 'plate.unRound', start: 15.15, end: 15.6, ease: 'inOut' },
  { id: 'plate.unSplit', start: 15.4, end: 15.8, ease: 'inOut' },
  { id: 'plate.tileIn', start: 15.05, end: 15.6, ease: 'inOut' },
  { id: 'plate.labelsIn', start: 15.45, end: 15.85, ease: 'inOut' },
  { id: 'hook.in', start: 15.0, end: 15.75, ease: 'out' },
];

const byId = Object.fromEntries(segments.map((s) => [s.id, s]));

export function prog(id, t) {
  const s = byId[id];
  if (!s) throw new Error(`Unknown segment ${id}`);
  const x = Math.min(1, Math.max(0, (t - s.start) / (s.end - s.start)));
  return ease[s.ease](x);
}

export const seg = (id) => byId[id];

export const raw = (start, end, t) => Math.min(1, Math.max(0, (t - start) / (end - start)));

// Dropper: visits each forearm in turn. Times are absolute seconds.
export const dropper = {
  enter: { start: 7.0, end: 7.9 },
  visits: [
    { arrive: 7.9, leave: 9.05 },
    { arrive: 9.75, leave: 10.9 },
    { arrive: 11.6, leave: 12.75 },
  ],
  exit: { start: 12.75, end: 13.4 },
  firstDrop: 0.15, // after arriving
  dropEvery: 0.34,
  form: 0.2, // drop swelling at the tip
  fall: 0.2,
  settle: 0.55, // colour shift after each landing
  hover: 70, // tip height above the stain centre
};
