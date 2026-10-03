import { W, H, FPS } from './config.js';
import { bind, setDrawing, setLineScale, variant } from './core/pencil.js';
import { Compositor } from './core/paper.js';

const params = new URLSearchParams(location.search);
const MODE = params.has('render') ? 'render' : params.has('dev') ? 'dev' : 'play';

const canvas = document.getElementById('film');
canvas.width = W;
canvas.height = H;
const comp = new Compositor(canvas);

let timeline;
if (params.get('test')) {
  const { SHEET } = await import('./scenes/sheet.js');
  timeline = { TOTAL: SHEET.len, sceneAt: (f) => ({ scene: SHEET, local: f, index: 0 }), SCENES: [SHEET] };
} else {
  timeline = await import('./timeline.js');
}

const state = { boil: true };

export function renderFrame(i) {
  const f = Math.max(0, Math.min(timeline.TOTAL - 1, i));
  const ctx = comp.begin();
  bind(ctx);
  setDrawing(f, state.boil);
  setLineScale(1);
  const { scene, local } = timeline.sceneAt(f);
  ctx.save();
  scene.draw(local, f);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  comp.end(variant());
  return f;
}

if (MODE === 'render') {
  window.__film = {
    total: timeline.TOTAL,
    fps: FPS,
    frame(i) {
      renderFrame(i);
      return canvas.toDataURL('image/png');
    },
    async wav() {
      const { renderWavBase64 } = await import('./audio/engine.js');
      return renderWavBase64(timeline.TOTAL / FPS);
    },
    ready: true,
  };
  renderFrame(0);
} else {
  const { startApp } = await import('./app/app.js');
  startApp({ canvas, timeline, renderFrame, state, dev: MODE === 'dev' });
}
