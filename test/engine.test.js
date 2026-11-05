import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../engine/config.js';
import { buildReels, buildStrip, evaluateWays, playRound } from '../engine/engine.js';
import { seededRng } from '../engine/rng.js';

test('strips contain exactly the configured symbol counts', () => {
  const reels = buildReels(C);
  C.BASE_REELS.forEach((counts, r) => {
    const tally = {};
    for (const s of reels.base[r]) tally[s] = (tally[s] || 0) + 1;
    assert.deepEqual(tally, counts);
  });
});

test('at most one scatter can show per reel', () => {
  for (const strip of [...buildReels(C).base, ...buildReels(C).free]) {
    for (let stop = 0; stop < strip.length; stop++) {
      let n = 0;
      for (let row = 0; row < C.ROWS; row++) if (strip[(stop + row) % strip.length] === 'SCAT') n++;
      assert.ok(n <= 1);
    }
  }
});

test('strip layout is reproducible', () => {
  assert.deepEqual(buildStrip(C.BASE_REELS[0], 11, C.STACK), buildStrip(C.BASE_REELS[0], 11, C.STACK));
});

test('ways evaluation counts adjacent reels and multiplies ways', () => {
  const grid = [
    ['H1', 'H1', 'Q', 'J'],
    ['WILD', 'H1', 'K', 'T'],
    ['H1', 'A', 'A', 'A'],
    ['Q', 'Q', 'Q', 'Q'],
    ['H1', 'J', 'J', 'J'],
  ];
  const wins = evaluateWays(grid);
  const h1 = wins.find((w) => w.symbol === 'H1');
  assert.equal(h1.length, 3);
  assert.equal(h1.ways, 2 * 2 * 1);
  assert.equal(h1.amount, C.PAYTABLE.H1[3] * 4);
  assert.equal(wins.find((w) => w.symbol === 'Q'), undefined); // reel 2 has no Q
});

test('multiplier scales ways wins', () => {
  const grid = Array.from({ length: 5 }, () => ['H2', 'T', 'T', 'T']);
  const [h2] = evaluateWays(grid, C, 3).filter((w) => w.symbol === 'H2');
  assert.equal(h2.amount, C.PAYTABLE.H2[5] * 3);
});

test('seeded RNG is uniform enough', () => {
  const rng = seededRng(5);
  const counts = new Array(10).fill(0);
  for (let i = 0; i < 200000; i++) counts[rng.int(10)]++;
  for (const c of counts) assert.ok(Math.abs(c - 20000) < 600);
});

test('rounds are deterministic for a seed and never exceed max win', () => {
  const reels = buildReels(C);
  const a = seededRng(9), b = seededRng(9);
  for (let i = 0; i < 20000; i++) {
    const ra = playRound(a, reels), rb = playRound(b, reels);
    assert.equal(ra.total, rb.total);
    assert.ok(ra.total <= C.MAX_WIN);
  }
});

test('RTP is near 96% over 1M spins', () => {
  const reels = buildReels(C);
  const rng = seededRng(42);
  let total = 0;
  const n = 1_000_000;
  for (let i = 0; i < n; i++) total += playRound(rng, reels).total;
  const rtp = total / n;
  assert.ok(rtp > 0.93 && rtp < 0.99, `RTP ${rtp}`);
});
