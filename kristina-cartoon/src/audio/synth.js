// Small sound effects synthesised on Web Audio (bells, woodblock, clicks, buzz).

let noiseBuf = null;
export function noise(ac) {
  if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
  const len = ac.sampleRate * 2;
  noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    d[i] = (s / 0x7fffffff) * 2 - 1;
  }
  return noiseBuf;
}

/** Short noise burst (consonant, pop). */
export function burstNoise(ac, out, t0, { dur = 0.03, freq = 1500, q = 1.5, gain = 0.4, type = 'bandpass' } = {}) {
  const n = ac.createBufferSource();
  n.buffer = noise(ac);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  n.connect(f).connect(g).connect(out);
  n.start(t0, (t0 * 0.37) % 0.5);
  n.stop(t0 + dur + 0.02);
}

function tone(ac, out, t0, hz, dur, gain, type = 'sine', slideTo = null) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(hz, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g).connect(out);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

// ---------------------------------------------------------------- sounds --

// Non-vocal sound effects only (the film has no voices).
export const SOUNDS = {
  // phone appears: little bell
  ting(ac, out, t) {
    tone(ac, out, t, 2637, 0.7, 0.08);
    tone(ac, out, t + 0.005, 3951, 0.45, 0.04);
    tone(ac, out, t + 0.12, 3136, 0.5, 0.035);
  },
  // the serious nod: one dry woodblock "tok"
  tock(ac, out, t, soft) {
    const k = soft ? 0.55 : 1;
    tone(ac, out, t, soft ? 700 : 820, 0.09, 0.32 * k, 'sine', soft ? 560 : 640);
    burstNoise(ac, out, t, { dur: 0.025, freq: 2200, q: 3, gain: 0.25 * k });
  },
  // machine switched off: small click
  pop(ac, out, t) {
    burstNoise(ac, out, t, { dur: 0.03, freq: 1400, q: 1.5, gain: 0.3 });
    tone(ac, out, t, 240, 0.06, 0.15, 'sine', 140);
  },
  // tattoo machine: quiet mechanical buzz
  buzz(ac, out, t, dur = 1.5) {
    const o = ac.createOscillator();
    o.type = 'square';
    o.frequency.value = 118;
    const lp = ac.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.value = 700;
    lp.Q.value = 0.8;
    const am = ac.createGain();
    am.gain.value = 0.7;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 59;
    const lg = ac.createGain();
    lg.gain.value = 0.3;
    lfo.connect(lg).connect(am.gain);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.05);
    g.gain.setValueAtTime(0.03, t + dur - 0.06);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp).connect(am).connect(g).connect(out);
    for (const n of [o, lfo]) {
      n.start(t);
      n.stop(t + dur + 0.02);
    }
  },
  twinkle(ac, out, t) {
    tone(ac, out, t, 1760, 0.35, 0.04);
    tone(ac, out, t + 0.07, 2637, 0.35, 0.035);
    tone(ac, out, t + 0.14, 3520, 0.4, 0.03);
  },
};
