// Boot: load local fonts, build the scene, expose draw(t) to the page.
import config from '../config.js';
import { createScene } from './scene.js';

const FONT_FILES = [
  ['display', 'normal', 400, '/node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-400-normal.woff2'],
  ['display', 'italic', 400, '/node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-400-italic.woff2'],
  ['mono', 'normal', 400, '/node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'],
  ['mono', 'normal', 500, '/node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'],
];

async function loadFonts(cfg) {
  await Promise.all(
    FONT_FILES.map(async ([role, style, weight, url]) => {
      const face = new FontFace(cfg.fonts[role], `url(${url})`, { style, weight: String(weight) });
      await face.load();
      document.fonts.add(face);
    })
  );
  await document.fonts.ready;
}

export async function boot(canvas) {
  await loadFonts(config);
  const scene = createScene(canvas, config);
  const frames = Math.round(config.duration * config.fps);
  return { config, scene, frames };
}
