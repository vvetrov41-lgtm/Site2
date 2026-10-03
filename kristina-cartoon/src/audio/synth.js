// "A child makes all the sounds": tiny formant voice synth on Web Audio.
// No words, only hums, trills, pops and squeals.

const VOWELS = {
  u: [430, 1100, 2700],
  o: [580, 980, 2800],
  a: [980, 1600, 3000],
  e: [640, 2250, 3100],
  i: [400, 2900, 3600],
  m: [290, 1150, 2500],
};

let noiseBuf = null;
function noise(ac) {
  if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
  const len = ac.sampleRate;
  noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    d[i] = (s / 0x7fffffff) * 2 - 1;
  }
  return noiseBuf;
}

/**
 * One voiced syllable.
 * o: dur, pitch [[t, hz], ...], vowel 'u' | [[t, 'u'], ...], gain, attack, release,
 *    breath (0..1), trill (Hz, lip-trill amplitude modulation), vib (depth), lp (Hz)
 */
export function voice(ac, out, t0, o) {
  const dur = o.dur;
  const end = t0 + dur;
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  const pitch = o.pitch;
  osc.frequency.setValueAtTime(pitch[0][1], t0);
  for (const [t, hz] of pitch.slice(1)) osc.frequency.linearRampToValueAtTime(hz, t0 + t);

  const vib = ac.createOscillator();
  vib.frequency.value = o.vibRate ?? 5.5;
  const vibG = ac.createGain();
  vibG.gain.value = pitch[0][1] * (o.vib ?? 0.02);
  vib.connect(vibG).connect(osc.frequency);

  const src = ac.createGain();
  src.gain.value = 1;
  osc.connect(src);
  let nsrc = null;
  if (o.breath) {
    nsrc = ac.createBufferSource();
    nsrc.buffer = noise(ac);
    nsrc.loop = true;
    const ng = ac.createGain();
    ng.gain.value = o.breath * 0.8;
    nsrc.connect(ng).connect(src);
  }

  const sum = ac.createGain();
  sum.gain.value = 1;
  const vowels = typeof o.vowel === 'string' ? [[0, o.vowel]] : o.vowel;
  const gains = [1, 0.55, 0.28];
  for (let k = 0; k < 3; k++) {
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = k === 0 ? 5 : 9;
    bp.frequency.setValueAtTime(VOWELS[vowels[0][1]][k], t0);
    for (const [t, v] of vowels.slice(1)) bp.frequency.linearRampToValueAtTime(VOWELS[v][k], t0 + t);
    const g = ac.createGain();
    g.gain.value = gains[k] * 4;
    src.connect(bp).connect(g).connect(sum);
  }

  let chain = sum;
  if (o.lp) {
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = o.lp;
    chain.connect(lp);
    chain = lp;
  }
  if (o.trill) {
    const am = ac.createGain();
    am.gain.value = 0.55;
    const lfo = ac.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = o.trill;
    const lg = ac.createGain();
    lg.gain.value = 0.45;
    lfo.connect(lg).connect(am.gain);
    chain.connect(am);
    chain = am;
    lfo.start(t0);
    lfo.stop(end + 0.05);
  }
  const env = ac.createGain();
  const peak = o.gain ?? 0.3;
  const atk = o.attack ?? 0.03;
  const rel = o.release ?? 0.08;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(peak, t0 + atk);
  env.gain.setValueAtTime(peak, Math.max(t0 + atk, end - rel));
  env.gain.linearRampToValueAtTime(0, end);
  chain.connect(env).connect(out);

  osc.start(t0);
  osc.stop(end + 0.05);
  vib.start(t0);
  vib.stop(end + 0.05);
  if (nsrc) {
    nsrc.start(t0);
    nsrc.stop(end + 0.05);
  }
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
    voice(ac, out, t, { dur, pitch: [[0, 215], [dur * 0.5, 200], [dur, 208]], vowel: 'm', lp: 700, gain: 0.3, attack: 0.12, release: 0.2, vib: 0.012, vibRate: 4.5 });
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
    voice(ac, out, t + 0.02, { dur, pitch: p, vowel: 'u', lp: 1300, trill: 27, breath: 0.25, gain: 0.2, attack: 0.04, release: 0.1 });
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
    voice(ac, out, t, { dur: 1.1, pitch: [[0, 350], [0.5, 520], [1.1, 560]], vowel: 'o', breath: 0.2, gain: 0.3, attack: 0.06, release: 0.2, vib: 0.03, vibRate: 6 });
  },
  // "weeeee!"
  wee(ac, out, t, dur = 0.85) {
    burstNoise(ac, out, t, { dur: 0.02, freq: 800, gain: 0.12 });
    voice(ac, out, t + 0.02, { dur, pitch: [[0, 520], [dur * 0.4, 880], [dur, 820]], vowel: [[0, 'u'], [0.08, 'i']], breath: 0.15, gain: 0.26, attack: 0.04, release: 0.2, vib: 0.03, vibRate: 7 });
  },
  // giggles "hihihihi"
  giggle(ac, out, t, base = 700) {
    for (let k = 0; k < 5; k++) {
      const dt = k * 0.13;
      burstNoise(ac, out, t + dt, { dur: 0.04, freq: 2500, gain: 0.09 });
      voice(ac, out, t + dt + 0.02, { dur: 0.08, pitch: [[0, base - k * 30], [0.08, base - k * 30 - 40]], vowel: 'i', breath: 0.35, gain: 0.18, attack: 0.01, release: 0.04 });
    }
  },
  // Kristina's low "hehe"
  hehe(ac, out, t) {
    for (let k = 0; k < 3; k++) {
      const dt = k * 0.15;
      burstNoise(ac, out, t + dt, { dur: 0.05, freq: 1800, gain: 0.08 });
      voice(ac, out, t + dt + 0.03, { dur: 0.1, pitch: [[0, 300 - k * 15], [0.1, 270 - k * 15]], vowel: 'e', breath: 0.3, gain: 0.2, attack: 0.01, release: 0.05 });
    }
  },
  twinkle(ac, out, t) {
    tone(ac, out, t, 1760, 0.35, 0.05);
    tone(ac, out, t + 0.07, 2637, 0.35, 0.045);
    tone(ac, out, t + 0.14, 3520, 0.4, 0.035);
  },
};
