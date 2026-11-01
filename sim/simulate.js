// Monte Carlo simulator for the Mardi Gras Mayhem math model.
// Usage: node sim/simulate.js [spins=10000000] [seed=1] [--json=report.json]

import fs from 'node:fs';
import * as C from '../engine/config.js';
import { buildReels, playRound } from '../engine/engine.js';
import { seededRng } from '../engine/rng.js';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const spins = Number(args[0] || 10_000_000);
const seed = Number(args[1] || 1);
const jsonOut = process.argv.find((a) => a.startsWith('--json='))?.slice(7);

const rng = seededRng(seed);
const reels = buildReels(C);

const parts = { base: 0, climbing: 0, scatter: 0, freeSpins: 0, holdAndWin: 0 };
let total = 0, sumSq = 0, hits = 0, fsTriggers = 0, hwTriggers = 0, grands = 0, capped = 0, maxWin = 0;
// Distribution buckets: no win, then wins up to each edge (in x total bet).
const edges = [1, 2, 5, 10, 20, 50, 100, 500, 1000, 5000];
const bucketCounts = new Array(edges.length + 1).fill(0);

for (let i = 0; i < spins; i++) {
  const r = playRound(rng, reels, C);
  const scale = r.capped ? r.total / Object.values(r.breakdown).reduce((a, b) => a + b, 0) : 1;
  for (const k in parts) parts[k] += r.breakdown[k] * scale;
  total += r.total;
  sumSq += r.total * r.total;
  if (r.total > 0) hits++;
  if (r.freeSpins) fsTriggers++;
  if (r.holdAndWin) { hwTriggers++; if (r.holdAndWin.full) grands++; }
  if (r.capped) capped++;
  if (r.total > maxWin) maxWin = r.total;
  if (r.total === 0) bucketCounts[0]++;
  else bucketCounts[1 + Math.min(edges.findIndex((e) => r.total <= e), edges.length - 1)]++;
}

const rtp = total / spins;
const sd = Math.sqrt(sumSq / spins - rtp * rtp);
const report = {
  spins, seed,
  rtp, rtp95: 1.96 * sd / Math.sqrt(spins),
  breakdown: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v / spins])),
  hitFrequency: hits / spins,
  freeSpinsOneIn: spins / fsTriggers,
  holdAndWinOneIn: spins / hwTriggers,
  grandOneIn: grands ? spins / grands : null,
  cappedOneIn: capped ? spins / capped : null,
  standardDeviation: sd,
  maxWinSeen: maxWin,
  distribution: bucketCounts.map((n, i) => ({
    range: i === 0 ? 'no win' : `${i === 1 ? 0 : edges[i - 2]}x to ${edges[i - 1]}x`,
    share: n / spins,
  })),
};

if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));
{
  const pct = (x) => (x * 100).toFixed(3) + '%';
  console.log(`Mardi Gras Mayhem — ${spins.toLocaleString()} spins, seed ${seed}`);
  console.log(`RTP              ${pct(rtp)}  (±${pct(report.rtp95)} at 95%)`);
  for (const [k, v] of Object.entries(report.breakdown)) console.log(`  ${k.padEnd(14)} ${pct(v)}`);
  console.log(`Hit frequency    ${pct(report.hitFrequency)}  (1 in ${(1 / report.hitFrequency).toFixed(2)})`);
  console.log(`Free spins       1 in ${report.freeSpinsOneIn.toFixed(0)}`);
  console.log(`Hold & Win       1 in ${report.holdAndWinOneIn.toFixed(0)}`);
  console.log(`Grand (full)     ${report.grandOneIn ? '1 in ' + report.grandOneIn.toFixed(0) : 'not seen'}`);
  console.log(`Max win cap hit  ${report.cappedOneIn ? '1 in ' + report.cappedOneIn.toFixed(0) : 'not seen'}`);
  console.log(`Std deviation    ${sd.toFixed(2)}`);
  console.log(`Max win seen     ${maxWin.toFixed(2)}x`);
  console.log('Win distribution');
  for (const d of report.distribution) console.log(`  ${d.range.padEnd(16)} ${pct(d.share)}`);
}
