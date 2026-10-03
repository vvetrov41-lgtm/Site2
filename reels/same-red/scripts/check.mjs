// Pre-flight checks: loop seam, final hex values, stills from the encoded mp4.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { startServer, ROOT } from './serve.mjs';
import config from '../config.js';

const total = Math.round(config.duration * config.fps);
const server = await startServer(0);
const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
let ok = true;
try {
  const page = await browser.newPage({ viewport: { width: config.width, height: config.height } });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__ready || window.__error);

  // 1. Loop seam: first vs last frame, grain off (grain is per-frame by design).
  const seam = await page.evaluate((last) => {
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    window.renderFrame(0, { noGrain: true });
    const a = ctx.getImageData(0, 0, c.width, c.height).data;
    window.renderFrame(last, { noGrain: true });
    const b = ctx.getImageData(0, 0, c.width, c.height).data;
    let sum = 0, max = 0, diffPx = 0;
    for (let i = 0; i < a.length; i += 4) {
      const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
      sum += d; if (d > max) max = d; if (d > 2) diffPx++;
    }
    return { mean: sum / (a.length / 4), max, diffPx };
  }, total - 1);
  const seamOk = seam.max <= 2;
  ok &&= seamOk;
  console.log(`Loop seam (frame 0 vs ${total - 1}, no grain): mean ${seam.mean.toFixed(4)}, max ${seam.max}, pixels >2: ${seam.diffPx} -> ${seamOk ? 'OK' : 'FAIL'}`);

  // 2. Final stage: all three counters equal target.
  for (const t of [13.5, 14.0]) {
    const s = await page.evaluate((tt) => window.sceneState(tt), t);
    const hexes = s.skins.map((k) => k.hex);
    const good = hexes.every((h) => h === s.target);
    ok &&= good;
    console.log(`t=${t}s target ${s.target}: ${hexes.join(' ')} -> ${good ? 'OK' : 'FAIL'}`);
  }
  const s0 = await page.evaluate(() => window.sceneState(6));
  console.log(`t=6s (step 1, multiply): ${s0.skins.map((k) => k.hex).join(' ')}`);
  for (const k of s0.skins) console.log(`  ${k.label}: recipe ink ${k.recipe}, opacity ${k.opacity}, drops ${k.drops}`);
} finally {
  await browser.close();
  server.close();
}

// 3. Stills from the encoded video.
const mp4 = path.join(ROOT, 'out', 'reel.mp4');
if (fs.existsSync(mp4)) {
  const dir = path.join(ROOT, 'out', 'check');
  fs.mkdirSync(dir, { recursive: true });
  for (const sec of [1, 3, 6, 10, 15]) {
    spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(sec), '-i', mp4, '-frames:v', '1', path.join(dir, `mp4_${String(sec).padStart(2, '0')}s.png`)]);
  }
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,r_frame_rate,nb_read_frames,pix_fmt,codec_name', '-show_entries', 'format=duration', '-of', 'default=nw=1', mp4]);
  console.log(probe.stdout.toString().trim().split('\n').join(' | '));
}
process.exit(ok ? 0 : 1);
