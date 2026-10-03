// Typography: didone titles revealed through a line mask, tracked mono labels.

export function setTracking(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

// Title block. inP / outP are eased 0..1.
// In: each line rises out of its own mask, staggered.
// Out: whole block fades and lifts slightly.
export function drawTitle(ctx, spec, cfg, inP, outP) {
  if (!spec || !spec.lines?.length) return;
  if (inP <= 0 || outP >= 1) return;
  const { fonts, layout, colors } = cfg;
  const size = fonts.titleSize;
  const lead = size * fonts.titleLeading;
  ctx.save();
  ctx.fillStyle = colors.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  setTracking(ctx, -size * 0.01);
  const n = spec.lines.length;
  const lift = outP * 18;
  ctx.globalAlpha = 1 - outP;
  spec.lines.forEach((line, i) => {
    const italic = spec.italic?.[i];
    ctx.font = `${italic ? 'italic ' : ''}400 ${size}px "${fonts.display}"`;
    const y = layout.titleY + i * lead - lift;
    // Stagger: each line takes the first 75% of its own window.
    const k = Math.min(1, Math.max(0, (inP - i * (0.25 / Math.max(1, n - 1))) / 0.75));
    const p = 1 - (1 - k) ** 3;
    if (p <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y - size * 1.0, ctx.canvas.width, size * 1.28);
    ctx.clip();
    ctx.translate(0, (1 - p) * size * 1.05);
    ctx.globalAlpha *= 0.25 + 0.75 * p;
    ctx.fillText(line, layout.titleX + (italic ? size * 0.02 : 0), y);
    ctx.restore();
  });
  ctx.restore();
}

export function drawMono(ctx, text, x, y, cfg, opts = {}) {
  if (!text) return;
  const { size = cfg.fonts.labelSize, align = 'left', alpha = 1, weight = 400, tracking = cfg.fonts.tracking, colour = cfg.colors.ink } = opts;
  if (alpha <= 0.002) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px "${cfg.fonts.mono}"`;
  ctx.textBaseline = 'alphabetic';
  setTracking(ctx, size * tracking);
  // letterSpacing adds trailing space after the last glyph; compensate for centring.
  const w = ctx.measureText(text).width - size * tracking;
  let dx = x;
  if (align === 'center') dx = x - w / 2;
  else if (align === 'right') dx = x - w;
  ctx.textAlign = 'left';
  ctx.fillText(text, dx, y);
  ctx.restore();
}
