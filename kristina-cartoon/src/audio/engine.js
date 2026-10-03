// Live playback (scheduled against the AudioContext clock) and offline WAV render.
import { FPS } from '../config.js';
import { CUES } from './cues.js';
import { SCENES } from '../timeline.js';

import { SOUNDS } from './synth.js';

const START = Object.fromEntries(SCENES.map((s) => [s.id, s.start]));

// Small-room impulse response (deterministic), so voices sound recorded, not "in a wire".
function roomIR(ac) {
  const len = Math.floor(ac.sampleRate * 0.45);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    let s = 99 + c * 17;
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const t = i / ac.sampleRate;
      const early = i < ac.sampleRate * 0.012 ? 0 : 1;
      d[i] = ((s / 0x7fffffff) * 2 - 1) * Math.exp(-t * 11) * early;
    }
  }
  return ir;
}

function masterChain(ac, dest) {
  const input = ac.createGain();
  // "phone microphone": low cut + soft saturation
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 110;
  const sat = ac.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = (i / 1023) * 2 - 1;
    curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6);
  }
  sat.curve = curve;
  const dry = ac.createGain();
  dry.gain.value = 0.9;
  const rev = ac.createConvolver();
  rev.buffer = roomIR(ac);
  const wet = ac.createGain();
  wet.gain.value = 0.16;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  const out = ac.createGain();
  out.gain.value = 0.95;
  input.connect(hp).connect(sat);
  sat.connect(dry).connect(comp);
  sat.connect(rev).connect(wet).connect(comp);
  comp.connect(out).connect(dest);
  return input;
}

// ---- optional real recordings ---------------------------------------------
// Put e.g. sounds/ooh.wav and list it in sounds/manifest.json; it replaces the synth.
const recorded = new Map();
let loading = null;

async function loadRecordings(ac) {
  try {
    const res = await fetch(new URL('../../sounds/manifest.json', import.meta.url));
    if (!res.ok) return;
    const names = await res.json();
    await Promise.all(
      names.map(async (name) => {
        const r = await fetch(new URL(`../../sounds/${name}.wav`, import.meta.url));
        if (r.ok) recorded.set(name, await ac.decodeAudioData(await r.arrayBuffer()));
      }),
    );
  } catch {
    // no recordings: synth only
  }
}

function playRecorded(ac, out, t, name, maxDur) {
  const buf = recorded.get(name);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  src.connect(g).connect(out);
  src.start(t);
  if (maxDur && buf.duration > maxDur) {
    g.gain.setValueAtTime(1, t + maxDur - 0.08);
    g.gain.linearRampToValueAtTime(0, t + maxDur);
    src.stop(t + maxDur + 0.01);
  }
}

// cue name -> recording file name
const FILE = { mShort: 'm', brr: 'brr' };

function schedule(ac, out, fromSec, offset) {
  for (const c of CUES) {
    const t = (START[c.sc] + c.f) / FPS;
    if (t < fromSec - 0.02) continue;
    const file = FILE[c.s] || c.s;
    if (recorded.has(file)) playRecorded(ac, out, offset + t, file, c.s === 'brr' || c.s === 'mmm' ? c.a : null);
    else SOUNDS[c.s](ac, out, offset + t, c.a);
  }
}

export class LiveAudio {
  constructor() {
    this.ac = null;
    this.bus = null;
    this.base = 0;
  }
  /** Must be called from a user gesture the first time. */
  ensure() {
    if (!this.ac) {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      loading = loadRecordings(this.ac);
    }
    if (this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  }
  /** Start sound at film time t (seconds). Returns nothing; use filmTime() as the clock. */
  start(t) {
    const ac = this.ensure();
    this.stop();
    const bus = masterChain(ac, ac.destination);
    this.bus = bus;
    this.base = ac.currentTime + 0.08 - t;
    const base = this.base;
    (loading || Promise.resolve()).then(() => {
      if (this.bus === bus) schedule(ac, bus, t, base);
    });
  }
  filmTime() {
    return this.ac.currentTime - this.base;
  }
  stop() {
    if (this.bus) {
      const b = this.bus;
      b.gain.setTargetAtTime(0, this.ac.currentTime, 0.01);
      setTimeout(() => b.disconnect(), 120);
      this.bus = null;
    }
  }
}

function wavBytes(buf) {
  const ch = buf.getChannelData(0);
  const n = ch.length;
  const out = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  out.setUint32(4, 36 + n * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 1, true);
  out.setUint32(24, buf.sampleRate, true);
  out.setUint32(28, buf.sampleRate * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  w(36, 'data');
  out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 32767, true);
  return new Uint8Array(out.buffer);
}

export async function renderWavBase64(seconds) {
  const rate = 44100;
  const ac = new OfflineAudioContext(1, Math.ceil(seconds * rate), rate);
  await loadRecordings(ac);
  const bus = masterChain(ac, ac.destination);
  schedule(ac, bus, 0, 0);
  const buf = await ac.startRendering();
  const bytes = wavBytes(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
