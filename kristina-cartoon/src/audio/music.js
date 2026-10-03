// Background score, synthesised on Web Audio (no samples).
// Music box + plucked chords + soft bass + shaker, 112 BPM, C major.
// The music deliberately stops on Kristina's serious stares (scenes 3 and 5).

const BPM = 112;
const BEAT = 60 / BPM;
const E8 = BEAT / 2;
const BAR = BEAT * 4;

const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = (n) => {
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] ? 1 : 0);
};
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

const CHORDS = {
  C: [60, 64, 67],
  Am: [57, 60, 64],
  F: [53, 57, 60],
  G: [55, 59, 62],
  Em: [52, 55, 59],
  G7: [55, 59, 65],
};

// ---------------------------------------------------------- instruments --

function env(ac, g, t, attack, peak, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function musicBox(ac, out, t, m, gain = 0.13, decay = 1.3) {
  const f = hz(m);
  for (const [ratio, amp, d] of [
    [1, 1, 1],
    [2, 0.22, 0.5],
    [3, 0.1, 0.3],
    [4.2, 0.05, 0.16],
  ]) {
    const o = ac.createOscillator();
    o.frequency.value = f * ratio;
    const g = ac.createGain();
    env(ac, g, t, 0.004, gain * amp, decay * d);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay * d + 0.05);
  }
}

function pluck(ac, out, t, m, gain = 0.06) {
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = hz(m);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.5;
  lp.frequency.setValueAtTime(2600, t);
  lp.frequency.exponentialRampToValueAtTime(500, t + 0.25);
  const g = ac.createGain();
  env(ac, g, t, 0.005, gain, 0.42);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.5);
}

function strum(ac, out, t, notes, gain = 0.05) {
  notes.forEach((m, i) => pluck(ac, out, t + i * 0.014, m, gain));
}

function bass(ac, out, t, m, dur, gain = 0.16) {
  const o = ac.createOscillator();
  o.type = 'triangle';
  o.frequency.value = hz(m);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(gain * 0.5, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function pad(ac, out, t, notes, dur, gain = 0.035, swell = 0.5) {
  for (const m of notes) {
    for (const det of [-7, 7]) {
      const o = ac.createOscillator();
      o.type = 'triangle';
      o.frequency.value = hz(m);
      o.detune.value = det;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1500;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + swell);
      g.gain.setValueAtTime(gain, t + Math.max(swell, dur - 0.5));
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(lp).connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }
}

function shaker(ac, out, t, gain, noiseBuf) {
  const n = ac.createBufferSource();
  n.buffer = noiseBuf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6500;
  const g = ac.createGain();
  env(ac, g, t, 0.004, gain, 0.05);
  n.connect(hp).connect(g).connect(out);
  n.start(t, (t * 0.31) % 1);
  n.stop(t + 0.08);
}

function tick(ac, out, t, gain) {
  const o = ac.createOscillator();
  o.frequency.setValueAtTime(1500, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.04);
  const g = ac.createGain();
  env(ac, g, t, 0.002, gain, 0.05);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.08);
}

// ------------------------------------------------------------------ score --

const N = (arr) => arr.map((n) => (n ? midi(n) : null));

const INTRO_MELODY = [
  N(['E5', null, 'G5', null, 'C6', null, 'G5', 'E5']),
  N(['A5', null, 'G5', 'E5', 'C5', null, 'E5', null]),
  N(['F5', null, 'A5', null, 'C6', null, 'A5', 'F5']),
  N(['G5', null, 'D5', null, 'B4', null, 'D5', null]),
];
const FINALE_MELODY = [
  N(['C6', 'E6', 'G6', 'E6', 'C6', null, 'G5', null]),
  N(['A5', 'C6', 'F6', 'C6', 'A5', null, 'F5', null]),
  N(['B5', 'D6', 'G6', 'D6', 'B5', null, 'D6', null]),
];

/** Run fn(barStart, barIndex) for every bar that starts before `end`. */
function bars(t0, end, fn) {
  for (let i = 0, t = t0; t < end - 0.05; i++, t += BAR) fn(t, i);
}
const before = (t, end) => t < end - 0.03;

/**
 * Schedule the whole score.
 * sec: { a0, a1, b0, b1, c0, c1, d0, end } section times in seconds (film time),
 * offset: context time of film t = 0, from: film time to start from.
 */
export function scheduleMusic(ac, dest, sec, offset, from, noiseBuf) {
  const sections = [];
  const bus = (start, end) => {
    const g = ac.createGain();
    g.gain.value = 1;
    // hard but click-free stop at the end of a section
    g.gain.setValueAtTime(1, offset + end - 0.04);
    g.gain.linearRampToValueAtTime(0, offset + end);
    g.connect(dest);
    sections.push(g);
    return g;
  };
  const at = (t) => offset + t;
  const ok = (t) => t >= from - 0.01;

  // A - intro: playful, until Kristina's first stare
  {
    const out = bus(sec.a0, sec.a1);
    const prog = ['C', 'Am', 'F', 'G'];
    bars(sec.a0, sec.a1, (t, i) => {
      const ch = CHORDS[prog[i % 4]];
      for (const b of [0, 2]) if (before(t + b * BEAT, sec.a1) && ok(t + b * BEAT)) bass(ac, out, at(t + b * BEAT), ch[0] - 24, BEAT * 1.6);
      for (let e = 0; e < 8; e++) {
        const te = t + e * E8;
        if (!before(te, sec.a1) || !ok(te)) continue;
        if (e % 2) strum(ac, out, at(te), ch);
        shaker(ac, out, at(te), e % 2 ? 0.035 : 0.018, noiseBuf);
        const n = INTRO_MELODY[i % 4][e];
        if (n) musicBox(ac, out, at(te), n);
      }
    });
  }

  // B - tattooing: busier arpeggio groove
  {
    const out = bus(sec.b0, sec.b1);
    const prog = ['F', 'G', 'Em', 'Am'];
    bars(sec.b0, sec.b1, (t, i) => {
      const ch = CHORDS[prog[i % 4]];
      const arp = [ch[0], ch[1], ch[2], ch[1], ch[0] + 12, ch[2], ch[1], ch[2]];
      for (const b of [0, 1.5, 2]) if (before(t + b * BEAT, sec.b1) && ok(t + b * BEAT)) bass(ac, out, at(t + b * BEAT), ch[0] - 24, BEAT * 0.9);
      for (let e = 0; e < 8; e++) {
        const te = t + e * E8;
        if (!before(te, sec.b1) || !ok(te)) continue;
        pluck(ac, out, at(te), arp[e], 0.05);
        shaker(ac, out, at(te), 0.028, noiseBuf);
        if (e === 2 || e === 6) tick(ac, out, at(te), 0.035);
        if (e === 0 || e === 4) musicBox(ac, out, at(te), ch[e === 0 ? 2 : 1] + 12, 0.08);
      }
    });
  }

  // C - mirror: suspense on G7, one music-box step up per beat, soft clock ticks
  {
    const out = bus(sec.c0, sec.c1);
    if (ok(sec.c0)) pad(ac, out, at(sec.c0), CHORDS.G7.map((m) => m - 12), sec.c1 - sec.c0 + 0.1, 0.05, sec.c1 - sec.c0);
    const steps = N(['G4', 'A4', 'B4', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']);
    steps.forEach((m, k) => {
      const t = sec.c0 + k * BEAT;
      if (before(t, sec.c1) && ok(t)) {
        musicBox(ac, out, at(t), m, 0.1);
        tick(ac, out, at(t), 0.02);
      }
    });
  }

  // D - reveal and finale: glissando, then C - F - G - C (held to the end)
  {
    const out = bus(sec.d0, sec.end + 2);
    const gl = N(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7']);
    gl.forEach((m, k) => ok(sec.d0) && musicBox(ac, out, at(sec.d0 + k * 0.05), m, 0.11, 1.6));
    const start = sec.d0 + 0.45;
    const prog = ['C', 'F', 'G'];
    for (let i = 0; i < 3; i++) {
      const t = start + i * BAR;
      if (t + BAR < from) continue;
      const ch = CHORDS[prog[i]];
      if (ok(t)) pad(ac, out, at(t), ch, BAR + 0.2, 0.03, 0.3);
      for (const b of [0, 2]) if (ok(t + b * BEAT)) bass(ac, out, at(t + b * BEAT), ch[0] - 24, BEAT * 1.6);
      for (let e = 0; e < 8; e++) {
        const te = t + e * E8;
        if (!ok(te)) continue;
        if (e % 2) strum(ac, out, at(te), ch, 0.045);
        shaker(ac, out, at(te), e % 2 ? 0.03 : 0.015, noiseBuf);
        const n = FINALE_MELODY[i][e];
        if (n) musicBox(ac, out, at(te), n, 0.12);
      }
    }
    // final chord rings out under the last hold
    const tf = start + 3 * BAR;
    const tail = Math.max(1.2, sec.end - tf + 0.6);
    if (ok(tf)) {
      pad(ac, out, at(tf), CHORDS.C, tail, 0.035, 0.2);
      bass(ac, out, at(tf), 36, tail, 0.16);
      N(['C6', 'E6', 'G6', 'C7']).forEach((m, k) => musicBox(ac, out, at(tf + k * 0.03), m, 0.1, 2.4));
    }
  }
  return sections;
}
