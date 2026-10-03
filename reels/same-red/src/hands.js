// Forearm silhouettes. Geometry is built once from simple primitives,
// rasterised to a mask, and traced into one outer contour, so the outline
// is a single clean line with no internal seams.
import { noise3 } from './noise.js';

// Local units: x centred on the forearm axis, y = 0 at the highest fingertip.
const FOREARM_BOTTOM = 920;

function capsule(ctx, x1, y1, x2, y2, w) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function smoothClosed(ctx, pts) {
  // Catmull-Rom through points, closed.
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) ctx.moveTo(p1[0], p1[1]);
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1]
    );
  }
  ctx.closePath();
  ctx.fill();
}

function drawPrimitives(ctx) {
  ctx.fillStyle = ctx.strokeStyle = '#fff';
  // Fingers: index, middle, ring, little. [x, top, angle in degrees]
  const fingers = [
    [-44, 40, -2.5],
    [-14.5, 8, -0.5],
    [15, 27, 1.5],
    [43, 84, 5],
  ];
  const fw = 33;
  const base = 250;
  for (const [x, top, deg] of fingers) {
    const a = (deg * Math.PI) / 180;
    const len = base - top - fw / 2;
    const bx = x, by = base;
    capsule(ctx, bx, by, bx + Math.sin(a) * len, by - Math.cos(a) * len, fw);
  }
  // Palm.
  smoothClosed(ctx, [
    [-60, 190], [-20, 176], [24, 180], [60, 196],
    [64, 270], [60, 350], [50, 425],
    [0, 432], [-50, 425], [-62, 350], [-64, 265],
  ]);
  // Thumb and its base.
  capsule(ctx, -46, 360, -96, 222, 36);
  ctx.save();
  ctx.translate(-44, 330);
  ctx.rotate(0.38);
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Forearm, widening towards the elbow.
  smoothClosed(ctx, [
    [-49, 405], [0, 398], [49, 405], [55, 500], [64, 650], [72, 800],
    [74, FOREARM_BOTTOM], [0, FOREARM_BOTTOM + 30], [-74, FOREARM_BOTTOM],
    [-72, 800], [-64, 650], [-55, 500],
  ]);
}

// Moore-neighbour boundary trace on a binary mask.
function traceMask(mask, w, h) {
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
  let sx = -1, sy = -1;
  outer: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (at(x, y)) { sx = x; sy = y; break outer; }
    }
  }
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts = [[sx, sy]];
  let cx = sx, cy = sy, d = 6;
  for (let guard = 0; guard < w * h; guard++) {
    let found = false;
    for (let k = 0; k < 8; k++) {
      const nd = (d + 6 + k) % 8; // start left of the previous direction
      const nx = cx + dirs[nd][0], ny = cy + dirs[nd][1];
      if (at(nx, ny)) { cx = nx; cy = ny; d = nd; found = true; break; }
    }
    if (!found || (cx === sx && cy === sy)) break;
    pts.push([cx, cy]);
  }
  return pts;
}

function resample(pts, step) {
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1], b = pts[i % pts.length];
    let seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let ax = a[0], ay = a[1];
    while (acc + seg >= step) {
      const k = (step - acc) / seg;
      ax += (b[0] - ax) * k; ay += (b[1] - ay) * k;
      out.push([ax, ay]);
      seg = Math.hypot(b[0] - ax, b[1] - ay);
      acc = 0;
    }
    acc += seg;
  }
  return out;
}

function smoothPts(pts, radius, passes) {
  let p = pts;
  const n = p.length;
  for (let pass = 0; pass < passes; pass++) {
    p = p.map((_, i) => {
      let x = 0, y = 0;
      for (let k = -radius; k <= radius; k++) {
        const q = p[(i + k + n) % n];
        x += q[0]; y += q[1];
      }
      return [x / (2 * radius + 1), y / (2 * radius + 1)];
    });
  }
  return p;
}

function traceCanvas(ctx, w, h, ss, minX, minY, pad) {
  const data = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > 127 ? 1 : 0;
  let pts = traceMask(mask, w, h).map(([x, y]) => [x / ss + minX - pad, y / ss + minY - pad]);
  pts = resample(pts, 2.5);
  pts = smoothPts(pts, 2, 2);
  // Start the loop at the bottom centre so the line can draw upwards on both sides.
  let start = 0;
  pts.forEach((p, i) => { if (p[1] > pts[start][1] + 0.5 || (Math.abs(p[1] - pts[start][1]) <= 0.5 && Math.abs(p[0]) < Math.abs(pts[start][0]))) start = i; });
  pts = pts.slice(start).concat(pts.slice(0, start));
  const n = pts.length;
  const normals = pts.map((_, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [dy / l, -dx / l];
  });
  return { pts, normals };
}

// Build contours once (local units): the skin fill, and an outline offset
// outwards by `gap`, so a hairline of background separates line and skin
// (keeps the off-white line legible on the lightest skin).
export function buildHandContour(gap = 4) {
  const ss = 2; // supersample for a smoother trace
  const pad = 24;
  const minX = -130, maxX = 100, minY = -10, maxY = FOREARM_BOTTOM + 40;
  const w = (maxX - minX + pad * 2) * ss, h = (maxY - minY + pad * 2) * ss;
  const make = () => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.setTransform(ss, 0, 0, ss, (pad - minX) * ss, (pad - minY) * ss);
    return ctx;
  };
  const a = make();
  drawPrimitives(a);
  const fill = traceCanvas(a, w, h, ss, minX, minY, pad);
  const b = make();
  const p = new Path2D();
  fill.pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  b.fillStyle = b.strokeStyle = '#fff';
  b.lineJoin = 'round';
  b.lineWidth = gap * 2;
  b.fill(p);
  b.stroke(p);
  const line = traceCanvas(b, w, h, ss, minX, minY, pad);
  return { fill, line };
}

export const STAIN_LOCAL = { x: 2, y: 600 };

export function handTransform(config, i) {
  const L = config.layout;
  return { x: L.columns[i], y: L.handTop, s: L.handScale };
}

// Contour in screen space with a hand-drawn tremor.
export function contourPath(contour, tf, wobble, seed) {
  const { pts, normals } = contour;
  const out = new Array(pts.length);
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const d =
      noise3(x * 0.045, y * 0.045, 0, seed) * wobble +
      noise3(x * 0.21, y * 0.21, 3, seed + 5) * wobble * 0.35;
    out[i] = [tf.x + (x + normals[i][0] * d) * tf.s, tf.y + (y + normals[i][1] * d) * tf.s];
  }
  return out;
}

export function pathFrom(points, closed = true) {
  const p = new Path2D();
  points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (closed) p.closePath();
  return p;
}

// Draw one forearm. draw = 0..1 contour progress, fill = 0..1 skin opacity.
export function drawHand(ctx, fillPts, screenPts, opts) {
  const { skin, ink, lineWidth, draw, fill, baseline, inside, dy = 0 } = opts;
  if (draw <= 0 && fill <= 0) return;
  const path = pathFrom(fillPts);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ctx.canvas.width, baseline);
  ctx.clip();
  ctx.translate(0, dy); // sinking behind the baseline

  if (fill > 0) {
    ctx.globalAlpha = fill;
    ctx.fillStyle = skin;
    ctx.fill(path);
  }
  if (inside) {
    ctx.save();
    ctx.globalAlpha = 1;
    inside(path);
    ctx.restore();
  }

  if (draw > 0) {
    // Two halves grow from the bottom centre and meet at the fingertips.
    const n = screenPts.length;
    const half = Math.floor(n / 2);
    const right = screenPts.slice(0, half + 1);
    const left = [screenPts[0]].concat(screenPts.slice(half).reverse());
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ink;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const side of [right, left]) {
      const count = Math.max(2, Math.round(side.length * draw));
      ctx.stroke(pathFrom(side.slice(0, count), false));
    }
  }
  ctx.restore();
}
