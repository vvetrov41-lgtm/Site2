// Catalogue texture: faint grid, crop marks, registration marks, ruler.
import { drawMono } from './text.js';

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function drawGrid(ctx, cfg) {
  const { width: w, height: h, texture: tx, colors } = cfg;
  if (tx.grid > 0) {
    ctx.save();
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = tx.grid;
    ctx.lineWidth = 1;
    const step = tx.gridStep;
    const ox = (w % step) / 2;
    for (let x = ox; x <= w; x += step) line(ctx, Math.round(x) + 0.5, 0, Math.round(x) + 0.5, h);
    for (let y = 0; y <= h; y += step) line(ctx, 0, y + 0.5, w, y + 0.5);
    ctx.restore();
  }
}

function registration(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, x - r * 1.8, y, x + r * 1.8, y);
  line(ctx, x, y - r * 1.8, x, y + r * 1.8);
}

export function drawMarks(ctx, cfg) {
  const { width: w, height: h, texture: tx, colors } = cfg;
  const a = tx.marks;
  if (!a) return;
  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1;
  ctx.globalAlpha = a;

  // Crop marks just outside an inner trim box.
  const inset = 56, len = 26, gap = 10;
  const corners = [
    [inset, inset, -1, -1], [w - inset, inset, 1, -1],
    [inset, h - inset, -1, 1], [w - inset, h - inset, 1, 1],
  ];
  for (const [x, y, sx, sy] of corners) {
    line(ctx, x + sx * gap, y + 0.5, x + sx * (gap + len), y + 0.5);
    line(ctx, x + 0.5, y + sy * gap, x + 0.5, y + sy * (gap + len));
  }

  // Registration marks top and bottom centre (inside UI zones; texture only).
  registration(ctx, w / 2, 112, 9);
  registration(ctx, w / 2, h - 112, 9);

  // Ruler down the right edge, through the safe area.
  const rx = w - 40;
  const top = cfg.safe.top + 20, bottom = h - cfg.safe.bottom - 20;
  ctx.globalAlpha = a * 0.8;
  line(ctx, rx + 0.5, top, rx + 0.5, bottom);
  for (let y = top; y <= bottom; y += 20) {
    const major = (y - top) % 100 === 0;
    line(ctx, rx - (major ? 14 : 6), y + 0.5, rx, y + 0.5);
    if (major && (y - top) % 200 === 0) {
      drawMono(ctx, String((y - top) / 10).padStart(3, '0'), rx - 20, y + 4, cfg, {
        size: 11, align: 'right', alpha: a * 0.9, tracking: 0.05,
      });
    }
  }
  ctx.restore();
}
