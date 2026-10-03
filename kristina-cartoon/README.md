# Serious Flower

A ~34 s vertical (1080×1920) crayon cartoon for Instagram Reels, drawn entirely
in code (HTML5 Canvas + plain ES modules, no dependencies, no image assets).
Animation advances at 12 drawings per second with a controlled hand-drawn
line boil. Background music and the few sound effects are synthesised in
code (Web Audio); there are no voices.

## Run

Any static server from this folder (ES modules need http, not file://):

```
npx serve .            # or: python3 -m http.server
```

- `index.html` — final player (tap to play with sound, replay icon at the end)
- `index.html?dev` — review mode: play / pause / replay, scrubber, time + scene,
  jump to scene, frame step, wobble on/off, Instagram safe-area overlay, sound toggle
- `index.html?dev&test=1` — character model sheet

## Export to MP4

```
NODE_PATH=$(npm root -g) node tools/render.cjs --all --mp4 --out export
```

Renders every drawing in headless Chromium (Node Playwright), renders the
soundtrack with OfflineAudioContext, and encodes `export/serious-flower.mp4`
(H.264, 24 fps, each drawing held for two frames, AAC audio).
`--frames 0,84,300` renders single PNGs for review.

## Docs

- `docs/PLAN.md` — architecture, storyboard, timeline, sound cues, safe areas,
  12 fps system, risks, self-review, refinement passes
- `docs/CHARACTERS.md` — character bible (Kristina's look from photo references)
