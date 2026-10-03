// The whole frame as a pure function of time: draw(t).
import { buildPalette, linToRgb, linToCss, linToHex, mixLin, stainColour } from './color.js';
import { prog, raw, seg, ease, dropper as DP } from './timeline.js';
import { buildHandContour, contourPath, drawHand, handTransform, STAIN_LOCAL } from './hands.js';
import { drawDrop, drawMorph, drawStain, drawRipple } from './drops.js';
import { drawTitle, drawMono } from './text.js';
import { drawGrain, drawVignette } from './grain.js';
import { drawGrid, drawMarks } from './grid.js';
import { drawDropper } from './dropper.js';

const lerp = (a, b, t) => a + (b - a) * t;

export function createScene(canvas, cfg) {
  const ctx = canvas.getContext('2d');
  canvas.width = cfg.width;
  canvas.height = cfg.height;
  const pal = buildPalette(cfg);
  const L = cfg.layout;
  const contour = buildHandContour(cfg.line.gap ?? 4);
  const R = L.stainRadius;
  const rDrop = L.dropRadius ?? 26;

  const hands = cfg.skins.map((_, i) => {
    const tf = handTransform(cfg, i);
    return {
      tf,
      fill: contourPath(contour.fill, tf, cfg.line.wobble * 0.5, cfg.seed * 31 + i * 7 + 2),
      pts: contourPath(contour.line, tf, cfg.line.wobble, cfg.seed * 31 + i * 7),
      stain: { x: tf.x + STAIN_LOCAL.x * tf.s, y: tf.y + STAIN_LOCAL.y * tf.s },
    };
  });

  // Swatch tile geometry.
  const S = L.plate.size, pad = 30;
  const tile = { w: S + pad * 2, h: S + pad + 76 };
  tile.x = L.plate.x - tile.w / 2;
  tile.y = L.plate.y - tile.h / 2;
  const sq = { x: L.plate.x, y: tile.y + pad + S / 2 };

  // Dropper schedule (absolute times) per forearm.
  const schedule = pal.skins.map((entry, i) => {
    const v = DP.visits[i];
    const drops = [];
    for (let j = 0; j < entry.drops; j++) {
      const formStart = v.arrive + DP.firstDrop + j * DP.dropEvery;
      drops.push({ formStart, formEnd: formStart + DP.form, land: formStart + DP.form + DP.fall });
    }
    return { drops, radius: 7 + 7 * entry.dose };
  });

  const hoverY = (i) => hands[i].stain.y - DP.hover;

  function dropperState(t) {
    const cols = L.columns;
    const ink = (i) => pal.skins[i].recipe.ink;
    if (t < DP.enter.start || t > DP.exit.end) return null;
    if (t < DP.enter.end) {
      const p = ease.inOut4(raw(DP.enter.start, DP.enter.end, t));
      return { x: cols[0], tipY: lerp(-80, hoverY(0), p), liquid: ink(0) };
    }
    for (let i = 0; i < DP.visits.length; i++) {
      const v = DP.visits[i];
      if (t <= v.leave) return { x: cols[i], tipY: hoverY(i), liquid: ink(i), i };
      const next = DP.visits[i + 1];
      if (next && t < next.arrive) {
        const p = ease.inOut(raw(v.leave, next.arrive, t));
        return {
          x: lerp(cols[i], cols[i + 1], p),
          tipY: lerp(hoverY(i), hoverY(i + 1), p) - 150 * Math.sin(Math.PI * p),
          liquid: mixLin(ink(i), ink(i + 1), p),
        };
      }
    }
    const last = DP.visits.length - 1;
    const p = ease.in(raw(DP.exit.start, DP.exit.end, t));
    return { x: cols[last], tipY: lerp(hoverY(last), -80, p), liquid: ink(last) };
  }

  // Recipe dose 0..1 for forearm i at time t.
  function dose(i, t) {
    const sc = schedule[i];
    let d = 0;
    for (const dr of sc.drops) d += ease.inOut(raw(dr.land, dr.land + DP.settle, t)) / sc.drops.length;
    return d;
  }

  // The single source for each stain's colour (and its hex label).
  function colourAt(i, t) {
    const e = pal.skins[i];
    if (t < seg(`drop.fall.${i}`).end) return pal.pigment;
    if (t < 14.2) {
      const fresh = 1 - prog(`stain.settle.${i}`, t);
      return stainColour(e, pal.pigment, fresh, dose(i, t));
    }
    const r = prog('stain.retract', t);
    return stainColour(e, pal.pigment, r, 1 - r);
  }

  // Shape of drop k while the swatch splits (all 0..1).
  function morph(k, split, round, travel) {
    const stripW = S / 3;
    const gap = split * 30;
    const sx = sq.x + (k - 1) * (stripW + gap);
    const w = lerp(stripW, rDrop * 2, round);
    const h = lerp(S, rDrop * 2, round);
    const rad = lerp(0, rDrop, round);
    return { x: lerp(sx, L.columns[k], travel), y: lerp(sq.y, L.dropY, travel), w, h, rad };
  }

  function draw(t, frame = Math.round(t * cfg.fps), opts = {}) {
    const { width: W, height: H, colors } = cfg;
    const late = t >= 8;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, W, H);

    drawGrid(ctx, cfg);
    drawMarks(ctx, cfg);
    drawMono(ctx, cfg.text.kicker, L.titleX, 252, cfg, { alpha: 0.72 });
    drawMono(ctx, cfg.text.kickerRight, W - L.titleX, 252, cfg, { alpha: 0.72, align: 'right' });

    // --- Swatch tile ---------------------------------------------------
    const tileA = late ? prog('plate.tileIn', t) : 1 - prog('plate.tileOut', t);
    const labelA = late ? prog('plate.labelsIn', t) : 1 - prog('plate.labelsOut', t);
    if (tileA > 0) {
      ctx.save();
      ctx.globalAlpha = tileA;
      ctx.fillStyle = colors.plate;
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
      ctx.strokeStyle = colors.ink;
      ctx.globalAlpha = tileA * 0.42;
      ctx.lineWidth = 1;
      ctx.strokeRect(tile.x + 0.5, tile.y + 0.5, tile.w - 1, tile.h - 1);
      ctx.restore();
    }
    const labY = tile.y + pad + S + 46;
    drawMono(ctx, cfg.text.plateLabel, tile.x + pad, labY, cfg, { alpha: labelA * 0.8, size: 19 });
    drawMono(ctx, pal.pigmentHex, tile.x + tile.w - pad, labY, cfg, { alpha: labelA * 0.95, size: 19, align: 'right', tracking: 0.08 });
    drawMono(ctx, cfg.text.endCard, W / 2, tile.y + tile.h + 74, cfg, { alpha: labelA * 0.9, align: 'center' });

    // --- Forearms, stains ----------------------------------------------
    const handsOut = prog('hands.out', t);
    const drawP = prog('hands.draw', t);
    const fillP = prog('hands.fill', t);
    const sink = handsOut * (L.baseline - L.handTop + 40);
    const retract = prog('stain.retract', t);

    hands.forEach((h, i) => {
      const fallEnd = seg(`drop.fall.${i}`).end;
      const showStain = t >= fallEnd && retract < 1;
      drawHand(ctx, h.fill, h.pts, {
        skin: cfg.skins[i].hex,
        ink: colors.ink,
        lineWidth: cfg.line.width,
        draw: drawP,
        fill: fillP,
        baseline: L.baseline,
        dy: sink,
        inside: showStain
          ? (path) => {
              const spread = prog(`stain.spread.${i}`, t);
              const r = lerp(lerp(rDrop * 0.9, R, spread), rDrop, retract);
              const wet = Math.max(1 - prog(`stain.settle.${i}`, t), retract);
              drawStain(ctx, h.stain.x, h.stain.y, r, linToRgb(colourAt(i, t)), {
                seed: i + 1, time: Math.min(t, 6), wet, clip: path,
              });
            }
          : null,
      });

      // Impact ripples: first drop, then every corrector drop.
      const impacts = [fallEnd, ...schedule[i].drops.map((d) => d.land)];
      for (const at of impacts) {
        const p = raw(at, at + 0.9, t);
        if (p > 0 && p < 1) drawRipple(ctx, h.stain.x, h.stain.y, R * (1.05 + 0.85 * ease.out(p)), 0.55 * (1 - p) * fillP, colors.ink);
      }
    });

    // Baseline the forearms stand on.
    const baseP = prog('base.draw', t) * (1 - prog('plate.unTravel', t));
    if (baseP > 0) {
      const half = ((W - L.titleX * 2) / 2) * baseP;
      ctx.save();
      ctx.strokeStyle = colors.ink;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - half, L.baseline + 0.5);
      ctx.lineTo(W / 2 + half, L.baseline + 0.5);
      ctx.stroke();
      ctx.restore();
    }

    // Labels and hex counters.
    const labA = prog('labels.in', t) * (1 - prog('labels.out', t));
    if (labA > 0) {
      hands.forEach((h, i) => {
        const cx = L.columns[i];
        const left = cx - 110, right = cx + 110;
        const c = colourAt(i, t);
        const y1 = L.baseline + 44, y2 = L.baseline + 98, y3 = L.baseline + 134;
        const small = { alpha: labA * 0.75, size: 19, tracking: 0.16 };
        drawMono(ctx, `${cfg.text.figPrefix} ${i + 1}`, left, y1, cfg, small);
        drawMono(ctx, cfg.skins[i].label, right, y1, cfg, { ...small, align: 'right' });
        ctx.save();
        ctx.globalAlpha = labA;
        ctx.fillStyle = linToCss(c);
        ctx.fillRect(left, y2 - 24, 24, 24);
        ctx.strokeStyle = colors.ink;
        ctx.globalAlpha = labA * 0.5;
        ctx.strokeRect(left + 0.5, y2 - 23.5, 23, 23);
        ctx.restore();
        drawMono(ctx, linToHex(c), right, y2, cfg, { alpha: labA, size: cfg.fonts.hexSize, align: 'right', tracking: 0.04, weight: 400 });
        drawMono(ctx, `SKIN ${cfg.skins[i].hex.toUpperCase()}`, left, y3, cfg, { alpha: labA * 0.45, size: 15 });
      });
    }

    // --- Drops: split from swatch, fall, retract, return ----------------
    for (let k = 0; k < 3; k++) {
      const h = hands[k];
      const fall = seg(`drop.fall.${k}`);
      let m, colour = linToCss(pal.pigment), stretch = 0;
      if (!late) {
        if (t >= fall.end) continue;
        m = morph(k, prog('plate.split', t), prog('plate.round', t), prog('plate.travel', t));
        if (t > fall.start) {
          const p = raw(fall.start, fall.end, t);
          m.y = lerp(L.dropY, h.stain.y, ease.in(p));
          stretch = Math.min(1, p * 1.6);
        }
      } else {
        if (retract < 1) continue;
        m = morph(k, 1 - prog('plate.unSplit', t), 1 - prog('plate.unRound', t), 1 - prog('plate.unTravel', t));
        const rise = prog('drop.rise', t);
        if (rise < 1) {
          m.x = h.stain.x;
          m.y = lerp(h.stain.y, L.dropY, rise);
        }
      }
      if (m.rad >= m.w / 2 - 0.01 && Math.abs(m.w - m.h) < 0.01) drawDrop(ctx, m.x, m.y, m.w / 2, colour, stretch);
      else drawMorph(ctx, m.x, m.y, m.w, m.h, m.rad, colour);
    }

    // --- Dropper ----------------------------------------------------------
    const ds = dropperState(t);
    if (ds) {
      let squeeze = 0;
      schedule.forEach((sc, i) => {
        const h = hands[i];
        for (const dr of sc.drops) {
          if (t >= dr.formStart && t < dr.formEnd) {
            const p = raw(dr.formStart, dr.formEnd, t);
            squeeze = Math.max(squeeze, Math.sin(Math.PI * p));
            const r = sc.radius * ease.out(p);
            drawDrop(ctx, L.columns[i], hoverY(i) + r * 0.9, r, linToCss(pal.skins[i].recipe.ink));
          } else if (t >= dr.formEnd && t < dr.land) {
            const p = raw(dr.formEnd, dr.land, t);
            const y = lerp(hoverY(i) + sc.radius * 0.9, h.stain.y, ease.in(p));
            drawDrop(ctx, L.columns[i], y, sc.radius * (1 - 0.3 * p), linToCss(pal.skins[i].recipe.ink), Math.min(1, p * 1.5));
          }
        }
      });
      drawDropper(ctx, ds.x, ds.tipY, {
        ink: colors.ink, lineWidth: cfg.line.width * 0.9, liquid: linToCss(ds.liquid), squeeze,
      });
    }

    // --- Titles -------------------------------------------------------------
    const T = cfg.text;
    drawTitle(ctx, T.hook, cfg, late ? prog('hook.in', t) : 1, late ? 0 : prog('hook.out', t));
    drawTitle(ctx, T.results, cfg, prog('results.in', t), prog('results.out', t));
    const recIn = prog('recipes.in', t), recOut = prog('recipes.out', t);
    drawTitle(ctx, T.recipes, cfg, recIn, recOut);
    if (T.recipes?.lines?.length) {
      const y = L.titleY + (T.recipes.lines.length - 1) * cfg.fonts.titleSize * cfg.fonts.titleLeading;
      drawMono(ctx, `${T.targetLabel} ${pal.targetHex}`, W - L.titleX, y, cfg, {
        alpha: raw(13.7, 14.3, t) * (1 - recOut) * 0.9, align: 'right',
      });
    }

    // --- Film -------------------------------------------------------------
    drawVignette(ctx, cfg);
    if (!opts.noGrain) drawGrain(ctx, frame, cfg);
    ctx.restore();
  }

  function state(t) {
    return {
      t,
      target: pal.targetHex,
      skins: pal.skins.map((e, i) => ({
        label: e.label,
        hex: linToHex(colourAt(i, t)),
        initial: e.initialHex,
        final: e.finalHex,
        recipe: e.recipeHex,
        opacity: +e.recipe.opacity.toFixed(3),
        drops: e.drops,
      })),
    };
  }

  return { draw, state, palette: pal };
}
