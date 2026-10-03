// Headless export: PNG frames (+ WAV + MP4).
//   node tools/render.cjs --frames 0,36,84 --out ../out     (selected frames)
//   node tools/render.cjs --all --mp4 --out ../out          (full film)
//   node tools/render.cjs --test --out ../out               (character sheet)
// Uses the Node.js Playwright install (global is fine: NODE_PATH=$(npm root -g)).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
};
const OUT = path.resolve(opt('out', path.join(ROOT, 'export')));
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? undefined : undefined });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  const q = opt('test') ? 'render&test=' + (opt('test') === true ? '1' : opt('test')) : 'render';
  await page.goto(`http://localhost:${port}/index.html?${q}`);
  await page.waitForFunction(() => window.__film && window.__film.ready, null, { timeout: 20000 });
  const total = await page.evaluate(() => window.__film.total);
  let frames;
  if (opt('all')) frames = [...Array(total).keys()];
  else if (opt('frames')) frames = String(opt('frames')).split(',').map(Number);
  else frames = [0];
  const dir = opt('all') ? path.join(OUT, 'frames') : OUT;
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (const f of frames) {
    const url = await page.evaluate((i) => window.__film.frame(i), f);
    const name = opt('all') ? `f${String(f).padStart(4, '0')}.png` : `frame_${String(f).padStart(3, '0')}.png`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(`rendered ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (opt('mp4') || opt('wav')) {
    const b64 = await page.evaluate(() => window.__film.wav());
    fs.writeFileSync(path.join(OUT, 'soundtrack.wav'), Buffer.from(b64, 'base64'));
    console.log('wrote soundtrack.wav');
  }
  await browser.close();
  server.close();
  if (opt('mp4')) {
    const out = path.join(OUT, 'serious-flower.mp4');
    // 12 drawings/s, each held for two frames of a 24 fps video.
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(dir, 'f%04d.png'), '-i', path.join(OUT, 'soundtrack.wav'), '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
    console.log('wrote', out);
  }
})();
