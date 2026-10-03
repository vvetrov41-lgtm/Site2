# Same red. Three skins.

Code-driven Instagram Reel: 1080×1920, 30 fps, 16 s, silent, seamless loop.
Every frame is `draw(t)` on a canvas; no `requestAnimationFrame` in the render path.

```bash
npm install
npm run preview   # live preview with a time slider (http://127.0.0.1:5173/preview.html)
npm run render    # out/reel.mp4 + out/preview.png (frame at 6 s)
npm run check     # loop seam, final hex values, stills from the mp4 into out/check/
```

Requires ffmpeg on PATH. Fonts come from `@fontsource/*` in `node_modules`, so rendering needs no network.

## Where things live

| File | What |
|---|---|
| `config.js` | size, fps, duration, colours, skins, pigment, target, copy, fonts, grain, layout, encode settings |
| `src/timeline.js` | every timing: segments with easing, dropper schedule |
| `src/color.js` | colour model; stain fill and hex counters both read from it |
| `src/scene.js` | composes the frame for time `t` |
| `src/hands.js` · `drops.js` · `dropper.js` · `text.js` · `grain.js` · `grid.js` | one module per visual layer |
| `scripts/render.mjs` | Playwright screenshots (4 parallel pages) → ffmpeg h264 yuv420p, faststart |

`node scripts/render.mjs --stills 1,3,6` renders single frames to `out/check/`; `--encode-only` re-encodes existing frames.

## Colour model

Linear-light, per channel: `result = ink × (opacity + (1 − opacity) × skin)`.
Step 1 is pure multiply (opacity 0, ink = pigment). Step 2 solves for each skin the lowest opacity that keeps the ink in gamut, then the ink colour that lands exactly on the target.

Limitation: a stylised filter-plus-coverage model of fresh ink under skin, not a simulation of healing, undertones or real pigment chemistry.
