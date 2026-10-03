// Hair strand helpers: wavy / curly pencil lines drawn inside hair shapes.
import { stroke } from '../core/pencil.js';

/** Points of a wavy line from a to b with `waves` bumps of `amp` and an optional end curl. */
export function wavy(a, b, waves = 3, amp = 10, curl = 0) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const n = waves * 4;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = Math.sin(t * waves * Math.PI * 2) * amp * (0.4 + 0.6 * Math.sin(t * Math.PI));
    pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
  }
  if (curl) {
    // a small loop at the end, like a curl drawn with one flick of the pencil
    const e = pts[pts.length - 1];
    for (let k = 1; k <= 6; k++) {
      const ang = Math.atan2(dy, dx) + Math.sign(curl) * (k / 6) * Math.PI * 1.6;
      const r = Math.abs(curl) * (1 - k / 9);
      pts.push([e[0] + Math.cos(ang) * r - (dx / len) * Math.abs(curl) * 0.4, e[1] + Math.sin(ang) * r - (dy / len) * Math.abs(curl) * 0.4]);
    }
  }
  return pts;
}

/** Draw a list of strands: [[ax, ay, bx, by, waves, amp, curl], ...] */
export function strands(key, list, color, w = 3, bounce = null) {
  list.forEach((s, i) => {
    let pts = wavy([s[0], s[1]], [s[2], s[3]], s[4] ?? 2, s[5] ?? 8, s[6] ?? 0);
    if (bounce) pts = bounce(pts);
    stroke(`${key}.${i}`, pts, { w, color, alpha: 0.85 });
  });
}
