// Film grain seeded by frame number (deterministic) and a soft vignette.
import { mulberry32 } from './noise.js';

let grainCanvas = null;

export function drawGrain(ctx, frame, cfg) {
  const amount = cfg.texture.grain;
  if (!amount) return;
  const gs = cfg.texture.grainSize;
  const w = Math.ceil(cfg.width / gs), h = Math.ceil(cfg.height / gs);
  if (!grainCanvas || grainCanvas.width !== w || grainCanvas.height !== h) {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = w; grainCanvas.height = h;
  }
  const g = grainCanvas.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data;
  const rnd = mulberry32((frame + 1) * 2654435761 + cfg.seed);
  for (let i = 0; i < w * h; i++) {
    // Sum of two uniforms: soft, roughly bell-shaped grain.
    const n = rnd() + rnd() - 1;
    const v = n > 0 ? 255 : 0;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = Math.min(255, Math.abs(n) * amount * 2 * 255);
  }
  g.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(grainCanvas, 0, 0, w * gs, h * gs);
  ctx.restore();
}

export function drawVignette(ctx, cfg) {
  const v = cfg.texture.vignette;
  if (!v) return;
  const { width: w, height: h } = cfg;
  const g = ctx.createRadialGradient(w / 2, h * 0.48, h * 0.22, w / 2, h * 0.48, h * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${v})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
