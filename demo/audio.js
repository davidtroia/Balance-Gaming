// Synthesized sound effects with the Web Audio API, so there are no audio
// files to ship. Browsers only allow sound after the player taps something,
// so unlock() is called from the Start button.

let ctx = null;
let master = null;
let muted = false;
let musicNodes = null;

export function unlock() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.05);
}
export const isMuted = () => muted;

function tone(freq, start, dur, { type = 'sine', gain = 0.3, attack = 0.005, slide = 0 } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(start, dur, { gain = 0.2, freq = 1200, q = 1, type = 'bandpass' } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);

// A deep kick-drum thump: a sine that drops fast in pitch.
const thump = (start = 0, gain = 0.5, freq = 120) => tone(freq, start, 0.28, { gain, slide: 0.35 });

export const sfx = {
  spinStart() {
    noise(0, 0.25, { gain: 0.25, freq: 600, q: 0.7 });
    thump(0, 0.35, 90);
    tone(220, 0, 0.18, { type: 'triangle', gain: 0.15, slide: 2 });
  },
  reelStop(i) {
    tone(140 - i * 8, 0, 0.12, { type: 'square', gain: 0.1 });
    thump(0, 0.3 + i * 0.05, 110 - i * 6);
    noise(0, 0.08, { gain: 0.3, freq: 2500, q: 2 });
  },
  scatterLand(n) {
    tone(NOTE(76 + n * 4), 0, 0.5, { type: 'triangle', gain: 0.25 });
    tone(NOTE(88 + n * 4), 0.04, 0.4, { gain: 0.12 });
  },
  coinLand() {
    tone(NOTE(96), 0, 0.25, { type: 'triangle', gain: 0.18 });
    tone(NOTE(103), 0.05, 0.3, { gain: 0.12 });
  },
  smallWin() {
    [72, 76, 79].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.25, { type: 'triangle', gain: 0.2 }));
  },
  win() {
    [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.08, 0.35, { type: 'triangle', gain: 0.22 }));
    tone(NOTE(60), 0, 0.6, { type: 'sawtooth', gain: 0.06 });
  },
  bigWin() {
    thump(0, 0.6); thump(0.4, 0.6); thump(0.8, 0.75, 70);
    tone(45, 0.8, 1.8, { gain: 0.35, attack: 0.04 });
    const seq = [60, 64, 67, 72, 76, 79, 84, 88];
    seq.forEach((n, i) => tone(NOTE(n), i * 0.09, 0.5, { type: 'square', gain: 0.1 }));
    [72, 76, 79, 84].forEach((n) => tone(NOTE(n), 0.8, 1.6, { type: 'triangle', gain: 0.14, attack: 0.05 }));
    tone(NOTE(48), 0.8, 1.6, { type: 'sawtooth', gain: 0.08, attack: 0.05 });
  },
  tick() { tone(NOTE(100), 0, 0.03, { type: 'square', gain: 0.04 }); },
  wildClimb() {
    tone(200, 0, 0.6, { type: 'sawtooth', gain: 0.12, slide: 4 });
    noise(0, 0.6, { gain: 0.12, freq: 3000, q: 0.5, type: 'highpass' });
  },
  featureStart() {
    // A rising horn call over a sub drop for free spins and Hold & Win.
    tone(160, 0, 1.0, { gain: 0.4, slide: 0.25 });
    thump(0.8, 0.7, 80);
    [[67, 0], [72, 0.18], [76, 0.36], [79, 0.54], [84, 0.8]].forEach(([n, t]) => {
      tone(NOTE(n), t, 0.5, { type: 'sawtooth', gain: 0.09, attack: 0.03 });
      tone(NOTE(n - 12), t, 0.5, { type: 'triangle', gain: 0.12, attack: 0.03 });
    });
  },
  multiplierUp() { tone(NOTE(84), 0, 0.2, { type: 'triangle', gain: 0.2, slide: 1.5 }); },
  respinLamp() { tone(NOTE(64), 0, 0.15, { type: 'square', gain: 0.07 }); },
  jackpot() {
    for (let i = 0; i < 16; i++) tone(NOTE(84 + (i % 4) * 3), i * 0.06, 0.2, { type: 'triangle', gain: 0.15 });
  },
};

// A soft looping pad under free spins.
export function startMusic() {
  if (!ctx || musicNodes) return;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.5);
  g.connect(master);
  const oscs = [NOTE(48), NOTE(55), NOTE(60), NOTE(64)].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = i ? 'triangle' : 'sawtooth';
    o.frequency.value = f;
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 0.2 + i * 0.07;
    lg.gain.value = 2;
    lfo.connect(lg).connect(o.detune);
    o.connect(g);
    o.start(); lfo.start();
    return [o, lfo];
  });
  musicNodes = { g, oscs };
}

export function stopMusic() {
  if (!musicNodes) return;
  const { g, oscs } = musicNodes;
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  setTimeout(() => oscs.forEach(([o, l]) => { o.stop(); l.stop(); }), 1500);
  musicNodes = null;
}
