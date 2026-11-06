// Sound: synthesized effects with the Web Audio API, the theme music, the
// game-show host's voice lines and crowd applause. Browsers only allow sound
// after the player taps something, so unlock() is called from the Start button.

let ctx = null;
let master = null;
let muted = false;

export function unlock() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  // iPhone: play through the ringer/silent switch like a video would.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older iOS */ }
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

// One peg striking the wheel's leather flapper: a bright snap with a short
// wooden body. Pitch steps up as reels lock, so tension climbs reel by reel.
function clack(t, pitch, gain) {
  const len = Math.ceil(ctx.sampleRate * 0.03);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 2600 * pitch; f.Q.value = 2.2;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start(t);
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(760 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(420 * pitch, t + 0.035);
  og.gain.setValueAtTime(gain * 0.5, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  o.connect(og).connect(master);
  o.start(t); o.stop(t + 0.06);
}

// Wheel-of-fortune ticking while the reels spin. It starts as a fast rattle,
// slows like a wheel losing speed toward the last reel's stop, and climbs in
// pitch each time a reel locks. Call reelStopped() on each stop and the
// ticking ends by itself when every reel is down.
export function reelTicker(totalMs, reels = 5) {
  if (!ctx) return { reelStopped() {}, stop() {} };
  const t0 = ctx.currentTime, end = t0 + totalMs / 1000;
  let stopped = 0, next = t0 + 0.02, alive = true, timer;
  const pump = () => {
    if (!alive) return;
    while (next < ctx.currentTime + 0.12 && next < end) {
      const frac = (next - t0) / (end - t0);
      clack(next, 1 + stopped * 0.09, 0.16 + stopped * 0.04 + Math.random() * 0.03);
      next += 0.034 + 0.11 * frac ** 2.2;
    }
    if (next >= end) { alive = false; return; }
    timer = setTimeout(pump, 40);
  };
  pump();
  return {
    reelStopped() { if (++stopped >= reels) this.stop(); },
    stop() { alive = false; clearTimeout(timer); },
  };
}

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
  // Reel anticipation: a rising string swell over a heartbeat, for `sec`.
  tease(sec = 1.5) {
    tone(110, 0, sec, { type: 'sawtooth', gain: 0.07, slide: 2.5, attack: 0.2 });
    tone(165, 0, sec, { type: 'triangle', gain: 0.08, slide: 2.5, attack: 0.2 });
    for (let t = 0; t < sec - 0.2; t += 0.42) thump(t, 0.35, 70);
    noise(0, sec, { gain: 0.05, freq: 5000, q: 0.6, type: 'highpass' });
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
  // A button keycap going down: a woody thock under a crisp switch click.
  press() {
    noise(0, 0.025, { gain: 0.35, freq: 3800, q: 3 });
    tone(190, 0, 0.07, { type: 'triangle', gain: 0.22, slide: 0.6 });
  },
  // Letting go: a softer, higher click.
  release() {
    noise(0, 0.018, { gain: 0.14, freq: 5200, q: 4 });
    tone(320, 0, 0.04, { type: 'triangle', gain: 0.07, slide: 0.8 });
  },
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

// Music made in Suno: "Midnight Club" for the base game and "Summit Run" for
// free spins. Each loops with a short crossfade from its end back to the top,
// and switching tracks crossfades between them. Hold & Win muffles the music
// for tension, and big celebrations duck it so the fanfare cuts through.
const TRACKS = {
  base: new URL('./music/frenchmen-street.mp3', import.meta.url),
  fs: new URL('./music/second-line-parade.mp3', import.meta.url),
  hw: new URL('./music/doubloon-toss.mp3', import.meta.url),
};
const XFADE = 2;
const MOODS = { base: { gain: 0.34, cutoff: 18000 }, fs: { gain: 0.4, cutoff: 18000 }, hw: { gain: 0.36, cutoff: 18000 } };
const buffers = {};
let music = null;
let mood = 'base';
let player = null;

// Where the music really ends, skipping trailing silence.
function lastSound(buffer) {
  const data = buffer.getChannelData(0);
  for (let i = data.length - 1; i > 0; i -= 64) if (Math.abs(data[i]) > 0.01) return i / buffer.sampleRate;
  return buffer.duration;
}

function loadTrack(name) {
  buffers[name] ??= fetch(TRACKS[name])
    .then((r) => r.arrayBuffer())
    .then((bytes) => new Promise((ok, fail) => ctx.decodeAudioData(bytes, ok, fail)))
    .catch(() => null);
  return buffers[name];
}

export async function startTheme() {
  if (!ctx || music) return;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = MOODS[mood].cutoff;
  const bus = ctx.createGain();
  bus.gain.value = MOODS[mood].gain;
  bus.connect(filter).connect(master);
  music = { filter, bus };
  loadTrack('fs');
  loadTrack('hw');
  playTrack('base');
}

// Fade out whatever is playing and start `name` from the top.
async function playTrack(name) {
  if (!music) return;
  const buffer = await loadTrack(name);
  if (!buffer) return;
  if (player) {
    const old = player;
    old.stopped = true;
    clearTimeout(old.timer);
    old.out.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    setTimeout(() => old.sources.forEach((src) => { try { src.stop(); } catch { /* already stopped */ } }), 2500);
  }
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, ctx.currentTime);
  out.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  out.connect(music.bus);
  player = { name, buffer, end: lastSound(buffer), out, sources: [], stopped: false };
  playPass(player, ctx.currentTime + 0.05, 0.05);
}

// One pass through the song, fading out while the next pass fades in.
function playPass(p, at, fadeIn) {
  if (p.stopped) return;
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  src.buffer = p.buffer;
  src.connect(g).connect(p.out);
  const outAt = at + p.end - XFADE;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(1, at + fadeIn);
  g.gain.setValueAtTime(1, outAt);
  g.gain.linearRampToValueAtTime(0, outAt + XFADE);
  src.start(at);
  src.stop(outAt + XFADE + 0.1);
  p.sources = [...p.sources.slice(-1), src];
  p.timer = setTimeout(() => playPass(p, outAt, XFADE), Math.max(0, (outAt - ctx.currentTime - 5) * 1000));
}

export function setMood(next) {
  const track = TRACKS[next] ? next : 'base';
  mood = next;
  if (!music) return;
  const t = ctx.currentTime;
  music.bus.gain.setTargetAtTime(MOODS[mood].gain, t, 0.4);
  music.filter.frequency.setTargetAtTime(MOODS[mood].cutoff, t, 0.4);
  if (player?.name !== track) playTrack(track);
}

// Pull the music down under a celebration, then bring it back.
export function duckTheme(ms) {
  if (!music) return;
  const t = ctx.currentTime;
  music.bus.gain.setTargetAtTime(MOODS[mood].gain * 0.25, t, 0.08);
  music.bus.gain.setTargetAtTime(MOODS[mood].gain, t + ms / 1000, 0.6);
}

// ---------- host voice and crowd ----------

// Lines read by the game-show host. They were generated with the Kokoro
// text-to-speech model (Apache-2.0) and mastered with a little room reverb.
// cheer.mp3 is a small crowd shouting, built the same way from many voices.
const VOICE = {
  welcome: new URL('./voice/welcome.mp3', import.meta.url).href,
  freespins: new URL('./voice/freespins.mp3', import.meta.url).href,
  retrigger: new URL('./voice/retrigger.mp3', import.meta.url).href,
  paradeover: new URL('./voice/paradeover.mp3', import.meta.url).href,
  holdwin: new URL('./voice/holdwin.mp3', import.meta.url).href,
  totalwin: new URL('./voice/totalwin.mp3', import.meta.url).href,
  bigwin: new URL('./voice/bigwin.mp3', import.meta.url).href,
  megawin: new URL('./voice/megawin.mp3', import.meta.url).href,
  epicwin: new URL('./voice/epicwin.mp3', import.meta.url).href,
  legendary: new URL('./voice/legendary.mp3', import.meta.url).href,
  krewe: new URL('./voice/krewe.mp3', import.meta.url).href,
  mini: new URL('./voice/mini.mp3', import.meta.url).href,
  minor: new URL('./voice/minor.mp3', import.meta.url).href,
  major: new URL('./voice/major.mp3', import.meta.url).href,
  grand: new URL('./voice/grand.mp3', import.meta.url).href,
  maxwin: new URL('./voice/maxwin.mp3', import.meta.url).href,
  cheer: new URL('./voice/cheer.mp3', import.meta.url).href,
};
// David's own recorded calls (2026-11-06), an alternate host set to A/B
// against the generated voice. Lines he didn't record fall back.
const DAVID = {
  welcome: new URL('./voice/d-welcome.mp3', import.meta.url).href,
  bigwin: new URL('./voice/d-bigwin.mp3', import.meta.url).href,
  megawin: new URL('./voice/d-megawin.mp3', import.meta.url).href,
  epicwin: new URL('./voice/d-epicwin.mp3', import.meta.url).href,
};
let voiceSet = 'ai';
export function setVoiceSet(set) { voiceSet = set === 'david' ? 'david' : 'ai'; }
export function getVoiceSet() { return voiceSet; }
const clips = {};
let speaking = null;

// The published page inlines each clip as a data: URI, and the page's
// security policy can block fetch() on those, so decode them by hand.
function bytesOf(url) {
  if (!url.startsWith('data:')) return fetch(url).then((r) => r.arrayBuffer());
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return Promise.resolve(out.buffer);
}

function loadClip(name) {
  const url = name.startsWith('d:') ? DAVID[name.slice(2)] : VOICE[name];
  clips[name] ??= bytesOf(url)
    .then((bytes) => new Promise((ok, fail) => ctx.decodeAudioData(bytes, ok, fail)))
    .catch(() => null);
  return clips[name];
}

// Decode every line up front so the host never lags behind the screen.
export function preloadVoices() {
  if (!ctx) return;
  Object.keys(VOICE).forEach(loadClip);
  Object.keys(DAVID).forEach((k) => loadClip(`d:${k}`));
  buildApplause();
}

// The host announces one line; a new line cuts off the one before it.
// Resolves with the line's length in ms (0 when silent) so callers can let
// it finish before the next line.
export async function say(name) {
  if (!ctx) return 0;
  const buffer = await loadClip(voiceSet === 'david' && DAVID[name] ? `d:${name}` : name);
  if (!buffer) return 0;
  try { speaking?.stop(); } catch { /* already finished */ }
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = 1.1;
  src.buffer = buffer;
  src.connect(g).connect(master);
  src.start();
  speaking = src;
  duckTheme(buffer.duration * 1000 + 400);
  return buffer.duration * 1000;
}

// Applause is rendered offline once, from hundreds of tiny noise-burst claps
// over a soft crowd roar, at three sizes: polite, warm and a standing ovation.
const CLAPS = [{ secs: 1.6, rate: 30, roar: 0 }, { secs: 3, rate: 70, roar: 0.25 }, { secs: 5, rate: 130, roar: 0.5 }];
let applauseBuffers = null;

function buildApplause() {
  if (applauseBuffers || !window.OfflineAudioContext) return;
  applauseBuffers = Promise.all(CLAPS.map(({ secs, rate, roar }) => {
    const sr = 44100;
    const off = new OfflineAudioContext(2, Math.ceil(sr * secs), sr);
    const clap = off.createBuffer(1, Math.ceil(sr * 0.04), sr);
    const d = clap.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.006));
    // Crowd intensity: swells in fast, holds, then tails away.
    const env = (t) => Math.min(1, t / 0.25) * Math.min(1, Math.max(0, (secs - t) / (secs * 0.45)));
    for (let n = Math.round(rate * secs); n > 0; n--) {
      const t = Math.random() * secs;
      if (Math.random() > env(t)) continue;
      const src = off.createBufferSource();
      src.buffer = clap;
      src.playbackRate.value = 0.7 + Math.random() * 0.7;
      const bp = off.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900 + Math.random() * 1800;
      bp.Q.value = 1.1;
      const g = off.createGain();
      g.gain.value = 0.25 + Math.random() * 0.75;
      const pan = off.createStereoPanner();
      pan.pan.value = Math.random() * 1.6 - 0.8;
      src.connect(bp).connect(g).connect(pan).connect(off.destination);
      src.start(t);
    }
    if (roar) {
      const noise = off.createBuffer(1, Math.ceil(sr * secs), sr);
      const nd = noise.getChannelData(0);
      let last = 0;
      for (let i = 0; i < nd.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; nd[i] = last * 6; }
      const src = off.createBufferSource();
      src.buffer = noise;
      const lp = off.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1100;
      const g = off.createGain();
      g.gain.setValueAtTime(0, 0);
      g.gain.linearRampToValueAtTime(roar, 0.4);
      g.gain.setValueAtTime(roar, secs * 0.55);
      g.gain.linearRampToValueAtTime(0, secs);
      src.connect(lp).connect(g).connect(off.destination);
      src.start(0);
    }
    return off.startRendering();
  })).catch(() => null);
}

// Crowd reaction to a win. size 0 is polite applause, 1 a standing ovation
// with cheering; anything from 0.5 up brings in the cheer.
export async function applause(size = 0.3) {
  if (!ctx) return;
  buildApplause();
  const buffers = await applauseBuffers;
  if (buffers) {
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buffers[size >= 0.75 ? 2 : size >= 0.35 ? 1 : 0];
    g.gain.value = 0.35 + size * 0.35;
    src.connect(g).connect(master);
    src.start();
  }
  if (size >= 0.5) {
    const cheer = await loadClip('cheer');
    if (!cheer) return;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = cheer;
    g.gain.value = 0.35 + size * 0.4;
    src.connect(g).connect(master);
    src.start(ctx.currentTime + 0.15);
  }
}

// David's brass fanfare (the last 4 seconds of take 1), played once over the
// ducked music on a big win. stopFanfare() fades it out when the next spin starts.
const FANFARE = new URL('./music/fanfare.mp3', import.meta.url);
let fanfareBuf = null;
let fanfareNow = null;
export function stopFanfare() {
  if (!fanfareNow) return;
  const { src, g } = fanfareNow;
  fanfareNow = null;
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  try { src.stop(ctx.currentTime + 0.4); } catch { /* already ended */ }
}
export async function fanfare(gain = 0.85) {
  if (!ctx) return;
  fanfareBuf ??= fetch(FANFARE).then((r) => r.arrayBuffer())
    .then((b) => new Promise((ok, fail) => ctx.decodeAudioData(b, ok, fail))).catch(() => null);
  const buf = await fanfareBuf;
  if (!buf) return;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf; g.gain.value = gain;
  src.connect(g).connect(master); src.start();
  fanfareNow = { src, g };
  src.onended = () => { if (fanfareNow?.src === src) fanfareNow = null; };
}
