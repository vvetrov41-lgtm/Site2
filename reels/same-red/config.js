// Everything a person should want to tweak lives here.
// Changing pigment, skins, target or copy needs no edits in src/.

export default {
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 16, // seconds, loops seamlessly

  colors: {
    background: '#0A0A0A',
    ink: '#EDEAE4', // off-white for lines and type
    plate: '#141413', // dark tile under the red swatch
  },

  // Fitzpatrick groups, left to right.
  skins: [
    { label: 'I–II', hex: '#E8C3A4' },
    { label: 'III–IV', hex: '#B58A62' },
    { label: 'V–VI', hex: '#5A3A2A' },
  ],

  pigment: '#C41E3A', // the one red straight from the bottle
  target: '#A3192B', // the healed red all three recipes aim for
  // Minimum opacity every recipe gets, so the lightest skin is not a no-op.
  baseOpacity: 0.06,

  text: {
    kicker: 'PIGMENT STUDY  Nº 01',
    kickerRight: 'COLOUR REALISM',
    hook: { lines: ['Same red.', 'Three skins.'], italic: [false, true] },
    results: { lines: ['One pigment.', 'Three results.'], italic: [false, true] },
    recipes: { lines: ['Three recipes.', 'One result.'], italic: [false, true] },
    figPrefix: 'FIG.',
    plateLabel: 'PIGMENT',
    targetLabel: 'TARGET',
    endCard: '', // e.g. a handle or a booking line; empty = clean end card
  },

  fonts: {
    display: 'Bodoni Moda',
    mono: 'IBM Plex Mono',
    titleSize: 118,
    titleLeading: 1.02,
    labelSize: 21,
    hexSize: 34,
    tracking: 0.22, // em, for small mono caps
  },

  texture: {
    grain: 0.045, // 0 = off
    grainSize: 2, // px per grain cell (2 survives h264 better than 1)
    vignette: 0.55, // 0..1
    grid: 0.035, // grid line alpha
    gridStep: 60,
    marks: 0.5, // crop / registration marks and ruler alpha
  },

  line: {
    width: 2.2,
    wobble: 1.6, // px of noise displacement on contours
    gap: 4, // px of background between skin and outline
  },

  // Instagram UI overlays; nothing important goes here.
  safe: { top: 220, bottom: 340 },

  layout: {
    titleX: 96,
    titleY: 372, // baseline of first title line
    columns: [232, 540, 848], // x centres of the three forearms
    baseline: 1392, // where forearms are cropped
    handTop: 640, // fingertip line
    handScale: 0.96,
    stainRadius: 42,
    plate: { x: 540, y: 960, size: 330 },
    dropY: 580, // where drops hang before they fall
    dropRadius: 26,
  },

  encode: { crf: 18, maxrateMbps: 20 }, // h264; raise maxrate for crisper grain, bigger file

  seed: 7,
};
