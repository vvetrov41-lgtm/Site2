// Colour model. One place computes every red that appears on screen:
// the stain fill and the hex counter both read from composite().
//
// Model (per channel, linear light, 0..1):
//   result = C * (a + (1 - a) * S)
// S = skin, C = ink colour, a = opacity (how much ink sits above melanin
// and scatters instead of being filtered by the skin).
//   a = 0 -> pure multiply (skin filters the ink), a = 1 -> ink as is.

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export const hexToLin = (hex) => hexToRgb(hex).map(toLin);
export const linToRgb = (lin) => lin.map((c) => clamp01(toSrgb(clamp01(c))));

export function linToHex(lin) {
  return (
    '#' +
    linToRgb(lin)
      .map((c) => Math.round(c * 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export const linToCss = (lin) => linToHex(lin);

export function composite(skin, ink, a) {
  return skin.map((s, i) => ink[i] * (a + (1 - a) * s));
}

export const mixLin = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Solve "skin + recipe = target": smallest opacity that keeps the ink
// inside gamut (C <= 1 on every channel), then the ink colour that lands
// exactly on target.
export function solveRecipe(skin, target, baseOpacity = 0) {
  let a = baseOpacity;
  for (let i = 0; i < 3; i++) {
    if (target[i] > skin[i]) a = Math.max(a, (target[i] - skin[i]) / (1 - skin[i]));
  }
  a = clamp01(a);
  const ink = target.map((tc, i) => clamp01(tc / (a + (1 - a) * skin[i])));
  return { ink, opacity: a };
}

// Everything the animation needs, derived from config.
export function buildPalette(config) {
  const pigment = hexToLin(config.pigment);
  const target = hexToLin(config.target);
  const skins = config.skins.map((s) => {
    const skin = hexToLin(s.hex);
    const recipe = solveRecipe(skin, target, config.baseOpacity);
    return {
      label: s.label,
      skinHex: s.hex.toUpperCase(),
      skin,
      recipe,
      recipeHex: linToHex(recipe.ink),
      // Step 1: same pigment, straight multiply.
      initial: composite(skin, pigment, 0),
      initialHex: linToHex(composite(skin, pigment, 0)),
      final: composite(skin, recipe.ink, recipe.opacity),
      finalHex: linToHex(composite(skin, recipe.ink, recipe.opacity)),
    };
  });
  // The further a skin lands from target, the heavier the correction:
  // more and bigger drops from the dropper (1..3).
  const dist = skins.map((s) => Math.hypot(...s.initial.map((v, i) => toSrgb(v) - toSrgb(target[i]))));
  const maxDist = Math.max(...dist, 1e-6);
  skins.forEach((s, i) => {
    s.dose = dist[i] / maxDist;
    s.drops = 1 + Math.round(2 * s.dose);
  });
  return {
    pigment,
    pigmentHex: linToHex(pigment),
    target,
    targetHex: linToHex(target),
    skins,
  };
}

// Colour of a stain at a given state.
//   fresh: 1 = wet pigment sitting on top, 0 = settled into skin
//   dose:  0 = original pigment, 1 = full recipe applied
export function stainColour(entry, pigment, fresh, dose) {
  const ink = mixLin(pigment, entry.recipe.ink, dose);
  const a = Math.max(fresh, entry.recipe.opacity * dose);
  return composite(entry.skin, ink, a);
}
