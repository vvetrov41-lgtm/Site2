// Live playback (scheduled against the AudioContext clock) and offline WAV render.
import { FPS } from '../config.js';
import { CUES } from './cues.js';
import { SOUNDS, noise } from './synth.js';
import { scheduleMusic } from './music.js';
import { SCENES, TOTAL } from '../timeline.js';

const START = Object.fromEntries(SCENES.map((s) => [s.id, s.start / FPS]));
const END = TOTAL / FPS;

// Music sections, tied to the scenes (seconds of film time).
const SECTIONS = {
  a0: START['1'],
  a1: START['3'], // stops dead when we cut to Kristina's stare
  b0: START['4a'],
  b1: START['5'], // stops again for the second stare
  c0: START['6'],
  c1: START['7'] + 8 / FPS, // the moment she sees the tattoo
  d0: START['7'] + 8 / FPS,
  end: END,
};

// Small-room impulse response (deterministic) for a soft, warm space.
function roomIR(ac) {
  const len = Math.floor(ac.sampleRate * 0.9);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    let s = 99 + c * 17;
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      d[i] = ((s / 0x7fffffff) * 2 - 1) * Math.exp((-i / ac.sampleRate) * 6);
    }
  }
  return ir;
}

function master(ac, dest) {
  const input = ac.createGain();
  const dry = ac.createGain();
  dry.gain.value = 0.85;
  const rev = ac.createConvolver();
  rev.buffer = roomIR(ac);
  const wet = ac.createGain();
  wet.gain.value = 0.22;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 3;
  const out = ac.createGain();
  out.gain.value = 1.5;
  input.connect(dry).connect(comp);
  input.connect(rev).connect(wet).connect(comp);
  comp.connect(out).connect(dest);
  // final fade on the very last frames
  out.gain.setValueAtTime(1.5, ac.currentTime);
  return { input, out };
}

function schedule(ac, bus, from, offset) {
  const music = ac.createGain();
  music.gain.value = 0.9;
  music.connect(bus);
  scheduleMusic(ac, music, SECTIONS, offset, from, noise(ac));
  for (const c of CUES) {
    const t = START[c.sc] + c.f / FPS;
    if (t < from - 0.02) continue;
    SOUNDS[c.s](ac, bus, offset + t, c.a);
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
    if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  }
  /** Start sound at film time t (seconds). filmTime() is then the master clock. */
  start(t) {
    const ac = this.ensure();
    this.stop();
    const m = master(ac, ac.destination);
    this.bus = m.out;
    this.base = ac.currentTime + 0.08 - t;
    schedule(ac, m.input, t, this.base);
  }
  filmTime() {
    return this.ac.currentTime - this.base;
  }
  stop() {
    if (this.bus) {
      const b = this.bus;
      b.gain.cancelScheduledValues(this.ac.currentTime);
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
  const m = master(ac, ac.destination);
  m.out.gain.setValueAtTime(1.5, seconds - 0.35);
  m.out.gain.linearRampToValueAtTime(0, seconds);
  schedule(ac, m.input, 0, 0);
  const buf = await ac.startRendering();
  const bytes = wavBytes(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
