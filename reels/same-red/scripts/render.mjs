// Frame-by-frame render: headless Chromium screenshots draw(t), ffmpeg encodes.
//   npm run render                  -> out/reel.mp4 + out/preview.png
//   node scripts/render.mjs --stills 1,3,6,10,15   -> out/check/t01.00.png ...
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { startServer, ROOT } from './serve.mjs';
import config from '../config.js';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const OUT = path.join(ROOT, 'out');
const FRAMES_DIR = path.join(OUT, 'frames');
const total = Math.round(config.duration * config.fps);
const workers = Number(opt('workers', Math.max(1, Math.min(4, os.cpus().length))));
const stills = opt('stills', null);
const encodeOnly = args.includes('--encode-only'); // reuse out/frames

async function openPage(browser, url) {
  const page = await browser.newPage({ viewport: { width: config.width, height: config.height }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  return page;
}

async function shoot(page, frame, file) {
  await page.evaluate((f) => window.renderFrame(f), frame);
  await page.locator('#c').screenshot({ path: file, type: 'png', animations: 'disabled' });
}

const server = await startServer(0);
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text'] });

try {
  if (stills) {
    const dir = path.join(OUT, 'check');
    fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser, url);
    for (const s of stills.split(',')) {
      const frame = s.startsWith('f') ? Number(s.slice(1)) : Math.min(total - 1, Math.round(Number(s) * config.fps));
      const file = path.join(dir, `f${String(frame).padStart(3, '0')}.png`);
      await shoot(page, frame, file);
      console.log(file);
    }
  } else {
    if (!encodeOnly) await renderFrames();
    encode();
  }
} finally {
  await browser.close();
  server.close();
}

async function renderFrames() {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const t0 = Date.now();
  let next = 0, done = 0;
  const pages = await Promise.all(Array.from({ length: workers }, () => openPage(browser, url)));
  await Promise.all(
    pages.map(async (page) => {
      while (next < total) {
        const f = next++;
        await shoot(page, f, path.join(FRAMES_DIR, `f${String(f).padStart(5, '0')}.png`));
        if (++done % 30 === 0) process.stdout.write(`\r${done}/${total} frames`);
      }
    })
  );
  console.log(`\r${total}/${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

function encode() {
  const mp4 = path.join(OUT, 'reel.mp4');
  const ff = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', String(config.fps),
    '-i', path.join(FRAMES_DIR, 'f%05d.png'),
    '-frames:v', String(total),
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    // Grain is near-incompressible: cap the bitrate (~16 Mbps) so the file stays upload-friendly.
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(config.encode?.crf ?? 18),
    '-maxrate', `${config.encode?.maxrateMbps ?? 16}M`, '-bufsize', `${(config.encode?.maxrateMbps ?? 16) * 2}M`,
    '-profile:v', 'high', '-level', '4.1',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', '-an',
    mp4,
  ], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg failed');
  const previewFrame = Math.round(6 * config.fps);
  fs.copyFileSync(path.join(FRAMES_DIR, `f${String(previewFrame).padStart(5, '0')}.png`), path.join(OUT, 'preview.png'));
  const mb = (fs.statSync(mp4).size / 1048576).toFixed(1);
  console.log(`Wrote ${path.relative(ROOT, mp4)} (${mb} MB) and out/preview.png`);
}
