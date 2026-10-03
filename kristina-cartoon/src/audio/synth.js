// "A child makes all the sounds": tiny formant voice synth on Web Audio.
// No words, only hums, trills, pops and squeals.

// Child-sized formants (Hz) and bandwidths for a cascade of resonant peaks.
const VOWELS = {
  u: [460, 1150, 2850, 3900],
  o: [620, 1050, 2950, 4000],
  a: [1050, 1750, 3150, 4200],
  e: [680, 2400, 3300, 4300],
  i: [420, 3000, 3700, 4500],
  m: [300, 1250, 2650, 3800],
};
const BW = [90, 120, 170, 250];
const PEAK = [17, 13, 9, 5]; // dB

let noiseBuf = null;
function noise(ac) {
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

// Slow smooth random signal (~6-18 Hz wander) used for pitch jitter and shimmer.
let wanderBuf = null;
function wander(ac) {
  if (wanderBuf && wanderBuf.sampleRate === ac.sampleRate) return wanderBuf;
  const len = ac.sampleRate * 4;
  wanderBuf = ac.createBuffer(1, len, ac.sampleRate);
  const d = wanderBuf.getChannelData(0);
  let s = 777;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  const step = Math.floor(ac.sampleRate / 14);
  let a = rnd();
  let b = rnd();
  for (let i = 0; i < len; i++) {
    const k = i % step;
    if (k === 0) {
      a = b;
      b = rnd();
    }
    const t = k / step;
    d[i] = a + (b - a) * (t * t * (3 - 2 * t));
  }
  return wanderBuf;
}

// Glottal-like source: harmonics with a natural spectral tilt instead of a raw sawtooth.
const waves = new WeakMap();
function glottal(ac) {
  if (waves.has(ac)) return waves.get(ac);
  const n = 64;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (k % 2 ? 1 : 0.85) / Math.pow(k, 1.45);
  const w = ac.createPeriodicWave(re, im);
  waves.set(ac, w);
  return w;
}

/**
 * One voiced syllable.
 * o: dur, pitch [[t, hz], ...], vowel 'u' | [[t, 'u'], ...], gain, attack, release,
 *    breath (0..1 aspiration), trill (Hz, lip trill), vib (depth), lp (Hz), seed
 */
export function voice(ac, out, t0, o) {
  const dur = o.dur;
  const end = t0 + dur;
  const stop = end + 0.06;
  const f0 = o.pitch[0][1];

  const osc = ac.createOscillator();
  osc.setPeriodicWave(glottal(ac));
  // natural onset scoop: start a little flat and slide into the note
  osc.frequency.setValueAtTime(f0 * 0.9, t0);
  osc.frequency.linearRampToValueAtTime(f0, t0 + Math.min(0.06, dur * 0.3));
  for (const [t, hz] of o.pitch.slice(1)) osc.frequency.linearRampToValueAtTime(hz, t0 + Math.max(t, 0.061));

  // jitter: slow random pitch wander (no voice holds a perfectly steady pitch)
  const jit = ac.createBufferSource();
  jit.buffer = wander(ac);
  jit.loop = true;
  const jitG = ac.createGain();
  jitG.gain.value = f0 * (o.jitter ?? 0.018);
  jit.connect(jitG).connect(osc.frequency);
  // gentle, delayed vibrato
  const vib = ac.createOscillator();
  vib.frequency.value = o.vibRate ?? 5.2;
  const vibG = ac.createGain();
  vibG.gain.setValueAtTime(0, t0);
  vibG.gain.linearRampToValueAtTime(f0 * (o.vib ?? 0.012), t0 + Math.min(0.35, dur));
  vib.connect(vibG).connect(osc.frequency);

  // voiced + aspiration mix
  const src = ac.createGain();
  const voiced = ac.createGain();
  voiced.gain.value = 0.5;
  osc.connect(voiced).connect(src);
  // shimmer: tiny amplitude wobble
  const shG = ac.createGain();
  shG.gain.value = 0.12;
  jit.connect(shG).connect(voiced.gain);
  const asp = ac.createBufferSource();
  asp.buffer = noise(ac);
  asp.loop = true;
  const aspF = ac.createBiquadFilter();
  aspF.type = 'highpass';
  aspF.frequency.value = 900;
  const aspG = ac.createGain();
  aspG.gain.value = 0.05 + (o.breath ?? 0.1) * 0.35;
  asp.connect(aspF).connect(aspG).connect(src);

  // vocal tract: cascade of resonant peaks (keeps the source's natural tilt)
  let chain = src;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 90;
  chain.connect(hp);
  chain = hp;
  const vowels = typeof o.vowel === 'string' ? [[0, o.vowel]] : o.vowel;
  for (let k = 0; k < 4; k++) {
    const pk = ac.createBiquadFilter();
    pk.type = 'peaking';
    pk.gain.value = PEAK[k];
    const f = VOWELS[vowels[0][1]][k];
    pk.frequency.setValueAtTime(f, t0);
    pk.Q.value = f / BW[k];
    for (const [t, v] of vowels.slice(1)) pk.frequency.linearRampToValueAtTime(VOWELS[v][k], t0 + t);
    chain.connect(pk);
    chain = pk;
  }
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = o.lp ?? 5200;
  lp.Q.value = 0.5;
  chain.connect(lp);
  chain = lp;

  if (o.trill) {
    // lip trill: irregular flapping from two slightly detuned rates
    const am = ac.createGain();
    am.gain.value = 0.5;
    for (const [rate, depth] of [
      [o.trill, 0.35],
      [o.trill * 1.17, 0.18],
    ]) {
      const lfo = ac.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = rate;
      const lg = ac.createGain();
      lg.gain.value = depth;
      lfo.connect(lg).connect(am.gain);
      lfo.start(t0);
      lfo.stop(stop);
    }
    chain.connect(am);
    chain = am;
  }

  const env = ac.createGain();
  const peak = (o.gain ?? 0.3) * 0.55;
  const atk = o.attack ?? 0.035;
  const rel = o.release ?? 0.09;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(peak, t0 + atk);
  env.gain.setValueAtTime(peak, Math.max(t0 + atk, end - rel));
  env.gain.linearRampToValueAtTime(0, end);
  chain.connect(env).connect(out);

  const off = ((o.seed ?? t0) * 0.731) % 1.5;
  for (const n of [osc, vib]) {
    n.start(t0);
    n.stop(stop);
  }
  jit.start(t0, off);
  jit.stop(stop);
  asp.start(t0, off);
  asp.stop(stop);
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

export const SOUNDS = {
  // "doo-dee-doo-doo" while walking in
  hum(ac, out, t) {
    const notes = [
      [0, 392, 'u', 0.26],
      [0.32, 494, 'i', 0.22],
      [0.6, 440, 'u', 0.24],
      [0.9, 587, 'u', 0.42],
    ];
    for (const [dt, hz, v, d] of notes) {
      burstNoise(ac, out, t + dt, { dur: 0.018, freq: 3000, gain: 0.12 });
      voice(ac, out, t + dt + 0.01, { dur: d, pitch: [[0, hz], [d, hz * 0.98]], vowel: v, gain: 0.2, breath: 0.15, release: 0.07 });
    }
  },
  // small greeting coo "oo-ee!"
  coo(ac, out, t) {
    voice(ac, out, t, { dur: 0.42, pitch: [[0, 430], [0.2, 470], [0.42, 640]], vowel: [[0, 'u'], [0.2, 'u'], [0.36, 'i']], gain: 0.22, breath: 0.2 });
  },
  // "ting!"
  ting(ac, out, t) {
    burstNoise(ac, out, t, { dur: 0.015, freq: 5000, gain: 0.15, type: 'highpass' });
    voice(ac, out, t + 0.01, { dur: 0.32, pitch: [[0, 820], [0.32, 790]], vowel: 'i', gain: 0.14, attack: 0.01, release: 0.25 });
    tone(ac, out, t + 0.01, 2637, 0.6, 0.07);
    tone(ac, out, t + 0.01, 3951, 0.4, 0.035);
  },
  // thinking "mmmm..."
  mmm(ac, out, t, dur = 1.0) {
    voice(ac, out, t, { dur, pitch: [[0, 215], [dur * 0.5, 200], [dur, 208]], vowel: 'm', lp: 800, gain: 0.34, attack: 0.12, release: 0.22, vib: 0.004, jitter: 0.025 });
  },
  // serious "m!"
  mShort(ac, out, t) {
    voice(ac, out, t, { dur: 0.16, pitch: [[0, 235], [0.16, 175]], vowel: 'm', lp: 800, gain: 0.38, attack: 0.012, release: 0.06 });
  },
  // lip-trill tattoo machine "brrrrr"
  brr(ac, out, t, dur = 1.5) {
    burstNoise(ac, out, t, { dur: 0.03, freq: 400, gain: 0.25, type: 'lowpass' });
    const p = [[0, 170]];
    for (let k = 1; k <= 6; k++) p.push([(dur * k) / 6, 165 + (k % 2 ? 12 : -6)]);
    voice(ac, out, t + 0.02, { dur, pitch: p, vowel: 'u', lp: 1100, trill: 26, breath: 0.45, gain: 0.3, attack: 0.04, release: 0.1, jitter: 0.04 });
  },
  // "p!"
  pop(ac, out, t) {
    burstNoise(ac, out, t, { dur: 0.04, freq: 1100, q: 1.2, gain: 0.5 });
    tone(ac, out, t, 220, 0.07, 0.25, 'sine', 120);
  },
  // tiny yawn "haaa-m"
  yawn(ac, out, t) {
    voice(ac, out, t, { dur: 0.8, pitch: [[0, 420], [0.4, 360], [0.8, 300]], vowel: [[0, 'a'], [0.5, 'o'], [0.75, 'm']], breath: 0.45, gain: 0.16, attack: 0.15, release: 0.2 });
  },
  // "oooooh!"
  ooh(ac, out, t) {
    voice(ac, out, t, { dur: 1.1, pitch: [[0, 350], [0.5, 520], [1.1, 560]], vowel: [[0, 'u'], [0.12, 'o']], breath: 0.35, gain: 0.32, attack: 0.06, release: 0.25, vib: 0.01, vibRate: 5.6, jitter: 0.035 });
  },
  // "weeeee!"
  wee(ac, out, t, dur = 0.85) {
    burstNoise(ac, out, t, { dur: 0.02, freq: 800, gain: 0.12 });
    voice(ac, out, t + 0.02, { dur, pitch: [[0, 520], [dur * 0.4, 880], [dur, 820]], vowel: [[0, 'u'], [0.08, 'i']], breath: 0.3, gain: 0.28, attack: 0.04, release: 0.22, vib: 0.008, jitter: 0.035 });
  },
  // giggles "hihihihi"
  giggle(ac, out, t, base = 700) {
    for (let k = 0; k < 5; k++) {
      const dt = k * 0.13;
      burstNoise(ac, out, t + dt, { dur: 0.04, freq: 2500, gain: 0.09 });
      voice(ac, out, t + dt + 0.02, { dur: 0.08, pitch: [[0, base - k * 30], [0.08, base - k * 30 - 40]], vowel: 'e', breath: 0.75, gain: 0.2, attack: 0.008, release: 0.04, jitter: 0.04 });
    }
  },
  // Kristina's low "hehe"
  hehe(ac, out, t) {
    for (let k = 0; k < 3; k++) {
      const dt = k * 0.15;
      burstNoise(ac, out, t + dt, { dur: 0.05, freq: 1800, gain: 0.08 });
      voice(ac, out, t + dt + 0.03, { dur: 0.1, pitch: [[0, 300 - k * 15], [0.1, 270 - k * 15]], vowel: 'e', breath: 0.7, gain: 0.22, attack: 0.008, release: 0.05, jitter: 0.04 });
    }
  },
  twinkle(ac, out, t) {
    tone(ac, out, t, 1760, 0.35, 0.05);
    tone(ac, out, t + 0.07, 2637, 0.35, 0.045);
    tone(ac, out, t + 0.14, 3520, 0.4, 0.035);
  },
};
