// Quick tuning loop: node sim/tune.js overrides.json [spins] [seed]
// The overrides file replaces top-level exports of engine/config.js, so a
// candidate math model can be tried without editing the real config.

import fs from 'node:fs';
import * as base from '../engine/config.js';
import { buildReels, playRound } from '../engine/engine.js';
import { seededRng } from '../engine/rng.js';

const [file, n = '300000', seed = '7'] = process.argv.slice(2);
const cfg = { ...base, ...(file ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}) };
const reels = buildReels(cfg);
const rng = seededRng(Number(seed));
const spins = Number(n);
const parts = { base: 0, climbing: 0, scatter: 0, freeSpins: 0, holdAndWin: 0 };
let total = 0, hits = 0, fs_ = 0, hw = 0, sq = 0;
for (let i = 0; i < spins; i++) {
  const r = playRound(rng, reels, cfg);
  for (const k in parts) parts[k] += r.breakdown[k];
  total += r.total; sq += r.total ** 2;
  if (r.total > 0) hits++;
  if (r.freeSpins) fs_++;
  if (r.holdAndWin) hw++;
}
const f = (x) => (100 * x / spins).toFixed(2);
console.log(`RTP ${f(total)}%  hit ${f(hits)}%  FS 1/${(spins / fs_).toFixed(0)}  HW 1/${(spins / hw).toFixed(0)}  sd ${Math.sqrt(sq / spins - (total / spins) ** 2).toFixed(1)}`);
console.log(Object.entries(parts).map(([k, v]) => `${k} ${f(v)}`).join('  '));
console.log(`avg FS ${(parts.freeSpins / fs_).toFixed(1)}x  avg HW ${(parts.holdAndWin / hw).toFixed(1)}x  avg CW ${(parts.climbing * cfg.CLIMBING_WILDS.chanceIn / spins).toFixed(1)}x`);
