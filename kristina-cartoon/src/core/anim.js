// Pose-to-pose helpers. Everything takes an integer frame (12 fps).

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const EASE = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

function mix(a, b, t) {
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], t));
  if (typeof a === 'number') return lerp(a, b, t);
  return t < 1 ? a : b;
}

/** Interpolated keys: [[frame, value, ease?], ...] (value: number | array). */
export function key(f, keys) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    if (f < f1) {
      const [f0, v0] = keys[i - 1];
      const t = (f - f0) / (f1 - f0);
      return mix(v0, v1, (EASE[e || 'inOut'] || EASE.inOut)(t));
    }
  }
  return keys[keys.length - 1][1];
}

/** Held keys (no in-betweens): value of the last key at or before f. */
export function hold(f, keys) {
  let v = keys[0][1];
  for (const [kf, kv] of keys) if (f >= kf) v = kv;
  return v;
}

export const between = (f, a, b) => f >= a && f < b;

/** Two-bone IK. Returns [elbow, hand]. bend = +1 / -1 picks the elbow side. */
export function ik2(sx, sy, tx, ty, l1, l2, bend) {
  let dx = tx - sx;
  let dy = ty - sy;
  let d = Math.hypot(dx, dy) || 0.001;
  const maxD = l1 + l2 - 0.5;
  const a = Math.atan2(dy, dx);
  if (d > maxD) d = maxD;
  const minD = Math.abs(l1 - l2) + 1;
  if (d < minD) d = minD;
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const ang = a - bend * Math.acos(cosA);
  const elbow = [sx + Math.cos(ang) * l1, sy + Math.sin(ang) * l1];
  const hand = [sx + Math.cos(a) * d, sy + Math.sin(a) * d];
  return [elbow, hand];
}

/** Hop cycle used for celebrations. Returns { y, sq } for a frame. */
const HOP = [
  { y: 0, sq: 0.92 },
  { y: -55, sq: 1.07 },
  { y: -85, sq: 1.03 },
  { y: -70, sq: 1 },
  { y: -30, sq: 1.03 },
  { y: 0, sq: 0.95 },
];
export function hop(f, start, amp = 1) {
  if (f < start) return { y: 0, sq: 1, i: -1 };
  const i = (f - start) % HOP.length;
  return { y: HOP[i].y * amp, sq: 1 + (HOP[i].sq - 1) * amp, i };
}
