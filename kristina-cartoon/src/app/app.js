// Player (12 fps clock) + dev review tools. The dev UI is DOM only, never drawn on the canvas.
import { FPS, H, SAFE, W } from '../config.js';
import { LiveAudio } from '../audio/engine.js';
import { PERF } from '../core/pencil.js';

const ICON_PLAY = 'M7 4l14 8-14 8z';
const ICON_REPLAY = 'M12 4V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-9z';

export function startApp({ canvas, timeline, renderFrame, state, dev }) {
  const { TOTAL, SCENES, sceneAt } = timeline;
  const audio = new LiveAudio();
  const p = {
    playing: false,
    sound: true,
    startT: 0, // film seconds at play start
    startWall: 0,
    frame: -1,
    shown: -1,
  };

  const overlay = document.getElementById('overlay');
  const ovIcon = document.getElementById('ovIcon');

  function filmTime() {
    if (p.sound && audio.ac && audio.bus) return audio.filmTime();
    return p.startT + (performance.now() - p.startWall) / 1000;
  }

  // Adaptive quality for slow devices (live playback only; exports are always full quality):
  // if a drawing takes longer than ~75 ms, drop the cross-hatch, then the pencil re-trace.
  let ema = 0;
  function show(f, force = false) {
    if (f === p.shown && !force) return;
    const t0 = performance.now();
    p.shown = renderFrame(f);
    const dt = performance.now() - t0;
    ema = ema ? ema * 0.8 + dt * 0.2 : dt;
    if (p.playing && ema > 75) {
      if (PERF.cross) PERF.cross = false;
      else if (PERF.sketch) PERF.sketch = false;
      ema = 0;
    }
    ui?.update(p.shown);
  }

  function play(fromFrame = p.shown < 0 || p.shown >= TOTAL - 1 ? 0 : p.shown) {
    p.startT = fromFrame / FPS;
    p.startWall = performance.now();
    if (p.sound) audio.start(p.startT);
    p.playing = true;
    overlay.hidden = true;
    ui?.update(fromFrame);
  }

  function pause() {
    p.playing = false;
    audio.stop();
    ui?.update(p.shown);
  }

  function seek(f) {
    const was = p.playing;
    if (was) pause();
    show(Math.max(0, Math.min(TOTAL - 1, f)), true);
    if (was) play(p.shown);
  }

  function tick() {
    if (p.playing) {
      // the picture only changes when the 12 fps frame index changes
      const f = Math.floor(filmTime() * FPS + 1e-6);
      if (f >= TOTAL) {
        show(TOTAL - 1);
        pause();
        if (!dev) {
          ovIcon.setAttribute('d', ICON_REPLAY);
          overlay.hidden = false;
        }
      } else show(Math.max(0, f));
    }
    requestAnimationFrame(tick);
  }

  // final viewer: tap to play / pause / replay (icons only, no text)
  overlay.addEventListener('click', () => play());
  canvas.addEventListener('click', () => {
    if (dev) return;
    if (p.playing) {
      pause();
      ovIcon.setAttribute('d', ICON_PLAY);
      overlay.hidden = false;
    }
  });

  let ui = null;
  if (dev) ui = devPanel({ TOTAL, SCENES, sceneAt, p, play, pause, seek, state, show, audio });
  show(0, true);
  if (!dev) overlay.hidden = false;
  requestAnimationFrame(tick);
}

function devPanel({ TOTAL, SCENES, sceneAt, p, play, pause, seek, state, show }) {
  document.body.classList.add('dev');
  const root = document.getElementById('dev');
  root.innerHTML = `
    <div class="time" id="dvTime">00:00.00</div>
    <div id="dvScene"></div>
    <input type="range" id="dvScrub" min="0" max="${TOTAL - 1}" value="0">
    <div class="row">
      <button id="dvPlay">Play</button>
      <button id="dvReplay">Replay</button>
      <button id="dvPrev">&lt; frame</button>
      <button id="dvNext">frame &gt;</button>
    </div>
    <div>Jump to scene</div>
    <div class="row" id="dvScenes">${SCENES.map((s, i) => `<button data-i="${i}" title="${s.name}">${s.id}</button>`).join('')}</div>
    <label><input type="checkbox" id="dvWobble" checked> Hand-drawn wobble (line boil)</label>
    <label><input type="checkbox" id="dvSafe"> Instagram safe-area overlay</label>
    <label><input type="checkbox" id="dvSound" checked> Sound</label>
    <div style="opacity:.7">Space play/pause · ←/→ frame · Home replay · 1-9 scenes</div>
  `;
  const $ = (id) => document.getElementById(id);
  const fmt = (f) => {
    const t = f / FPS;
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(2).padStart(5, '0');
    return `${String(m).padStart(2, '0')}:${s}`;
  };

  // safe-area overlay (DOM only)
  const safe = document.getElementById('safe');
  const pct = (v, total) => `${(v / total) * 100}%`;
  safe.innerHTML = `
    <div style="left:0;top:0;width:100%;height:${pct(SAFE.top, H)}"></div>
    <div style="left:0;top:${pct(SAFE.bottom, H)};width:100%;bottom:0"></div>
    <div style="left:${pct(SAFE.rightX, W)};top:${pct(SAFE.rightTop, H)};right:0;height:${pct(SAFE.bottom - SAFE.rightTop, H)}"></div>`;

  $('dvPlay').onclick = () => (p.playing ? pause() : play());
  $('dvReplay').onclick = () => {
    pause();
    show(0, true);
    play(0);
  };
  $('dvPrev').onclick = () => seek(p.shown - 1);
  $('dvNext').onclick = () => seek(p.shown + 1);
  $('dvScrub').oninput = (e) => seek(+e.target.value);
  $('dvScenes').onclick = (e) => {
    const i = e.target.dataset?.i;
    if (i !== undefined) seek(SCENES[+i].start);
  };
  $('dvWobble').onchange = (e) => {
    state.boil = e.target.checked;
    show(p.shown, true);
  };
  $('dvSafe').onchange = (e) => safe.classList.toggle('on', e.target.checked);
  $('dvSound').onchange = (e) => {
    const was = p.playing;
    if (was) pause();
    p.sound = e.target.checked;
    if (was) play(p.shown);
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      p.playing ? pause() : play();
    } else if (e.key === 'ArrowLeft') seek(p.shown - 1);
    else if (e.key === 'ArrowRight') seek(p.shown + 1);
    else if (e.key === 'Home') $('dvReplay').onclick();
    else if (/^[1-9]$/.test(e.key) && SCENES[+e.key - 1]) seek(SCENES[+e.key - 1].start);
  });

  return {
    update(f) {
      const { scene, local } = sceneAt(f);
      $('dvTime').textContent = `${fmt(f)} · f${f}`;
      $('dvScene').textContent = `Scene ${scene.id} · ${scene.name} · local f${local}/${scene.len}`;
      $('dvScrub').value = f;
      $('dvPlay').textContent = p.playing ? 'Pause' : 'Play';
      [...$('dvScenes').children].forEach((b) => b.classList.toggle('cur', SCENES[+b.dataset.i] === scene));
    },
  };
}
