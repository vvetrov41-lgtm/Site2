// Drops in flight and stains on skin.
// Stain edge: soft blob -> blur -> noisy threshold, so the rim reads as
// pigment bleeding into skin rather than a vector circle.
import { noise3 } from './noise.js';

export function drawDrop(ctx, x, y, r, colour, stretch = 0) {
  if (r <= 0.2) return;
  ctx.save();
  ctx.fillStyle = colour;
  ctx.beginPath();
  // Falling drops stretch along the fall; tail above, round belly below.
  const ry = r * (1 + 0.35 * stretch);
  const rx = r * (1 - 0.12 * stretch);
  if (stretch > 0.02) {
    ctx.moveTo(x, y - ry * 1.25);
    ctx.bezierCurveTo(x + rx * 0.55, y - ry * 0.55, x + rx, y - ry * 0.05, x + rx, y + ry * 0.2);
    ctx.arc(x, y + ry * 0.2, rx, 0, Math.PI, false);
    ctx.bezierCurveTo(x - rx, y - ry * 0.05, x - rx * 0.55, y - ry * 0.55, x, y - ry * 1.25);
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

// Rounded rect used while the swatch splits into drops.
export function drawMorph(ctx, cx, cy, w, h, radius, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(radius, w / 2, h / 2));
  ctx.fill();
  ctx.restore();
}

const stainCanvases = new Map();

function scratch(key, size) {
  let c = stainCanvases.get(key);
  if (!c || c.width !== size) {
    c = document.createElement('canvas');
    c.width = c.height = size;
    stainCanvases.set(key, c);
  }
  return c;
}

// r: current radius, wet: 0..1 how alive the rim still is, seed per stain.
export function drawStain(ctx, cx, cy, r, colourRgb, opts) {
  const { seed, time, wet, clip } = opts;
  if (r < 1) return;
  const blur = Math.max(2, r * 0.2);
  const size = Math.ceil((r * 1.6 + blur * 3) * 2);
  const half = size / 2;
  const src = scratch(`src${seed}`, size);
  const sctx = src.getContext('2d', { willReadFrequently: true });
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.filter = 'none';
  sctx.clearRect(0, 0, size, size);

  // Blob: main body plus a few lobes placed by noise.
  const blob = scratch(`blob${seed}`, size);
  const bctx = blob.getContext('2d');
  bctx.clearRect(0, 0, size, size);
  bctx.fillStyle = '#fff';
  bctx.beginPath();
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const n =
      noise3(ca * 1.2 + seed, sa * 1.2, time * 0.15, seed) * 0.09 +
      noise3(ca * 3.4, sa * 3.4 + seed, time * 0.25, seed + 3) * 0.045;
    const rr = r * (1 + n);
    const x = half + ca * rr, y = half + sa * rr;
    i ? bctx.lineTo(x, y) : bctx.moveTo(x, y);
  }
  bctx.fill();
  for (let k = 0; k < 3; k++) {
    const a = (seed * 1.7 + k * 2.3 + noise3(k, seed, 0, 9) * 0.6) % (Math.PI * 2);
    const d = r * (0.84 + 0.06 * noise3(k, 2, 0, seed));
    const lr = r * (0.16 + 0.05 * noise3(k, 5, 0, seed + 1));
    bctx.beginPath();
    bctx.arc(half + Math.cos(a) * d, half + Math.sin(a) * d, lr, 0, Math.PI * 2);
    bctx.fill();
  }

  sctx.filter = `blur(${blur.toFixed(2)}px)`;
  sctx.drawImage(blob, 0, 0);
  sctx.filter = 'none';

  const img = sctx.getImageData(0, 0, size, size);
  const d = img.data;
  const [cr, cg, cb] = colourRgb.map((v) => Math.round(v * 255));
  const edgeNoise = 0.1 + 0.05 * wet;
  const soft = 0.06;
  const inv = 1 / r;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const v = d[i + 3] / 255;
      if (v <= 0.01) { d[i + 3] = 0; continue; }
      const nx = (x - half) * inv, ny = (y - half) * inv;
      const z = seed + time * 0.4 * wet;
      const th = 0.5 + (noise3(nx * 5, ny * 5, z, seed + 11) * 0.6 + noise3(nx * 13, ny * 13, z, seed + 23) * 0.4) * edgeNoise;
      let a = (v - (th - soft)) / (2 * soft);
      a = a < 0 ? 0 : a > 1 ? 1 : a;
      a = a * a * (3 - 2 * a);
      // Bleed: a faint halo of the same colour where pigment migrates.
      let hb = (v - 0.04) / 0.5;
      hb = hb < 0 ? 0 : hb > 1 ? 1 : hb;
      const halo = hb * hb * (0.26 + 0.14 * noise3(nx * 9, ny * 9, seed, seed + 31));
      if (halo > a) a = halo;
      d[i] = cr; d[i + 1] = cg; d[i + 2] = cb; d[i + 3] = Math.round(a * 255);
    }
  }
  sctx.putImageData(img, 0, 0);

  ctx.save();
  if (clip) ctx.clip(clip);
  ctx.drawImage(src, cx - half, cy - half);
  ctx.restore();
}

export function drawRipple(ctx, cx, cy, r, alpha, ink, width = 1.2) {
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
