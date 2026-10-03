// Live playback (scheduled against the AudioContext clock) and offline WAV render.
import { FPS } from '../config.js';
import { CUES } from './cues.js';
import { SCENES } from '../timeline.js';

const START = Object.fromEntries(SCENES.map((s) => [s.id, s.start]));
import { SOUNDS } from './synth.js';

function masterChain(ac, dest) {
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  const g = ac.createGain();
  g.gain.value = 0.9;
  g.connect(comp).connect(dest);
  return g;
}

function schedule(ac, out, fromSec, offset) {
  for (const c of CUES) {
    const t = (START[c.sc] + c.f) / FPS;
    if (t < fromSec - 0.02) continue;
    SOUNDS[c.s](ac, out, offset + t, c.a);
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
  /** Start sound at film time t (seconds). Returns nothing; use filmTime() as the clock. */
  start(t) {
    const ac = this.ensure();
    this.stop();
    this.bus = masterChain(ac, ac.destination);
    this.base = ac.currentTime + 0.08 - t;
    schedule(ac, this.bus, t, this.base);
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
  const bus = masterChain(ac, ac.destination);
  schedule(ac, bus, 0, 0);
  const buf = await ac.startRendering();
  const bytes = wavBytes(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
