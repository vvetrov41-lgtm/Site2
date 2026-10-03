// Line-art dropper: glass tube, tapered tip, rubber bulb. No hand.

export function drawDropper(ctx, x, tipY, opts) {
  const { ink, lineWidth, liquid, squeeze = 0, alpha = 1 } = opts;
  if (alpha <= 0) return;
  const tubeW = 18, tubeTop = tipY - 300, taperTop = tipY - 54;
  const bulbH = 104, bulbW = 40 * (1 - 0.16 * squeeze);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = ink;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const glass = new Path2D();
  glass.moveTo(x - 2.2, tipY);
  glass.lineTo(x - tubeW / 2, taperTop);
  glass.lineTo(x - tubeW / 2, tubeTop);
  glass.lineTo(x + tubeW / 2, tubeTop);
  glass.lineTo(x + tubeW / 2, taperTop);
  glass.lineTo(x + 2.2, tipY);
  glass.closePath();

  // Liquid: recipe colour filling the lower part of the tube.
  if (liquid) {
    ctx.save();
    ctx.clip(glass);
    ctx.fillStyle = liquid;
    ctx.fillRect(x - tubeW, tipY - 170, tubeW * 2, 172);
    ctx.restore();
  }
  ctx.stroke(glass);

  // Graduation ticks, catalogue style.
  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalAlpha = alpha * 0.7;
  for (let k = 1; k <= 6; k++) {
    const y = taperTop - k * 34;
    ctx.beginPath();
    ctx.moveTo(x + tubeW / 2, y + 0.5);
    ctx.lineTo(x + tubeW / 2 - (k % 2 ? 5 : 9), y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // Collar.
  ctx.beginPath();
  ctx.rect(x - tubeW / 2 - 6, tubeTop - 16, tubeW + 12, 16);
  ctx.stroke();

  // Bulb.
  const by = tubeTop - 16;
  ctx.beginPath();
  ctx.moveTo(x - tubeW / 2 - 3, by);
  ctx.bezierCurveTo(x - bulbW / 2, by - 20, x - bulbW / 2, by - bulbH + 26, x, by - bulbH);
  ctx.bezierCurveTo(x + bulbW / 2, by - bulbH + 26, x + bulbW / 2, by - 20, x + tubeW / 2 + 3, by);
  ctx.stroke();
  ctx.restore();
}
