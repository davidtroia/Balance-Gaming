// Golden Ascent game engine. Pure functions: give it an RNG, get back a full
// round record. The demo animates that record; the simulator totals it.
// Outcomes are decided entirely by the RNG before anything is shown.

import * as C from './config.js';
import { seededRng } from './rng.js';

// ---------- reel strips ----------

// Lay out a reel's symbol counts in a fixed shuffled order. Pay symbols are
// grouped into stacks (`stack` is a height per symbol); scatters are kept at least ROWS apart so at
// most one shows per reel.
export function buildStrip(counts, seed, stack = {}) {
  const units = [];
  for (const [sym, n] of Object.entries(counts)) {
    const size = stack[sym] || 1;
    for (let left = n; left > 0; left -= size) units.push(new Array(Math.min(size, left)).fill(sym));
  }
  for (let attempt = 0; ; attempt++) {
    const rng = seededRng(seed * 1000 + attempt);
    for (let i = units.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      [units[i], units[j]] = [units[j], units[i]];
    }
    const strip = units.flat();
    if (spacedOk(strip, 'SCAT', C.ROWS)) return strip;
  }
}

function spacedOk(strip, sym, gap) {
  const idx = strip.flatMap((s, i) => (s === sym ? [i] : []));
  for (let a = 0; a < idx.length; a++) {
    for (let b = a + 1; b < idx.length; b++) {
      const d = Math.abs(idx[a] - idx[b]);
      if (Math.min(d, strip.length - d) < gap) return false;
    }
  }
  return true;
}

export function buildReels(cfg = C) {
  return {
    base: cfg.BASE_REELS.map((counts, r) => buildStrip(counts, 11 + r, cfg.STACK)),
    free: cfg.FREE_REELS.map((counts, r) => buildStrip(counts, 31 + r, cfg.STACK)),
  };
}

// ---------- helpers ----------

function weighted(rng, entries, weightOf) {
  // Weights may be fractional; scale to integers for an exact draw.
  const scaled = entries.map((e) => Math.round(weightOf(e) * 100));
  const total = scaled.reduce((a, b) => a + b, 0);
  let x = rng.int(total);
  for (let i = 0; i < entries.length; i++) {
    if ((x -= scaled[i]) < 0) return entries[i];
  }
  return entries[entries.length - 1];
}

function drawCoin(rng, cfg) {
  const c = weighted(rng, cfg.COIN_VALUES, (e) => e.weight);
  return { value: c.value, jackpot: c.jackpot || null };
}

// grid[reel][row]
function spinGrid(rng, strips) {
  return strips.map((strip) => {
    const stop = rng.int(strip.length);
    return Array.from({ length: C.ROWS }, (_, row) => strip[(stop + row) % strip.length]);
  });
}

function countSymbol(grid, sym) {
  let n = 0;
  for (const reel of grid) for (const s of reel) if (s === sym) n++;
  return n;
}

// 1,024-ways evaluation, left to right, wilds substitute for pay symbols.
export function evaluateWays(grid, cfg = C, multiplier = 1) {
  const wins = [];
  for (const sym of Object.keys(cfg.PAYTABLE)) {
    let ways = 1, len = 0;
    for (let r = 0; r < grid.length; r++) {
      const n = grid[r].filter((s) => s === sym || s === 'WILD').length;
      if (n === 0) break;
      ways *= n; len++;
    }
    const pay = cfg.PAYTABLE[sym][len] || 0;
    if (len >= 3 && pay > 0) {
      wins.push({ symbol: sym, length: len, ways, amount: pay * ways * multiplier });
    }
  }
  return wins;
}

function scatterResult(grid, cfg) {
  const n = Math.min(countSymbol(grid, 'SCAT'), 5);
  return { count: n, pay: cfg.SCATTER_PAY[n] || 0 };
}

const sum = (wins) => wins.reduce((a, w) => a + w.amount, 0);

// ---------- features ----------

function applyClimbingWilds(rng, grid, cfg) {
  if (rng.int(cfg.CLIMBING_WILDS.chanceIn) !== 0) return [];
  const counts = Object.entries(cfg.CLIMBING_WILDS.reelCountWeights);
  const k = Number(weighted(rng, counts, (e) => e[1])[0]);
  const pool = [1, 2, 3];
  const chosen = [];
  for (let i = 0; i < k; i++) chosen.push(pool.splice(rng.int(pool.length), 1)[0]);
  chosen.sort();
  for (const r of chosen) grid[r] = grid[r].map(() => 'WILD');
  return chosen;
}

function playFreeSpins(rng, reels, cfg, awarded) {
  const spins = [];
  let remaining = awarded, mult = 1, total = 0;
  while (remaining > 0) {
    remaining--;
    const grid = spinGrid(rng, reels.free);
    mult = Math.min(cfg.FS_MULT_CAP, mult + countSymbol(grid, 'WILD'));
    const wins = evaluateWays(grid, cfg, mult);
    const scat = scatterResult(grid, cfg);
    let retrigger = 0;
    if (scat.count >= 3) { retrigger = cfg.FREE_SPINS_RETRIGGER; remaining += retrigger; }
    const win = sum(wins) + scat.pay;
    total += win;
    spins.push({ grid, multiplier: mult, wins, scatterPay: scat.pay, retrigger, win, remaining });
  }
  return { awarded, spins, total };
}

function playHoldAndWin(rng, startCells, cfg) {
  const hw = cfg.HOLD_AND_WIN;
  const cellStrip = [];
  for (const [s, n] of Object.entries(hw.cellStrip)) for (let i = 0; i < n; i++) cellStrip.push(s);
  const size = C.REELS * C.ROWS;
  const cells = new Array(size).fill(null);
  for (const { index, coin } of startCells) cells[index] = coin;

  const steps = [];
  let respins = hw.respins;
  while (respins > 0 && cells.some((c) => c === null)) {
    const landed = [];
    for (let i = 0; i < size; i++) {
      if (cells[i] !== null) continue;
      if (cellStrip[rng.int(cellStrip.length)] === 'COIN') {
        cells[i] = drawCoin(rng, cfg);
        landed.push({ index: i, coin: cells[i] });
      }
    }
    respins = landed.length > 0 ? hw.respins : respins - 1;
    steps.push({ landed, respinsLeft: respins });
  }
  const full = cells.every((c) => c !== null);
  const total = cells.reduce((a, c) => a + (c ? c.value : 0), 0) + (full ? hw.grand.value : 0);
  return { start: startCells, steps, cells, full, total };
}

// ---------- a full round ----------

export function playRound(rng, reels, cfg = C) {
  const grid = spinGrid(rng, reels.base);

  // Every coin showing gets a value, drawn now, whether or not it triggers.
  const coins = [];
  grid.forEach((reel, r) => reel.forEach((s, row) => {
    if (s === 'COIN') coins.push({ index: r * C.ROWS + row, coin: drawCoin(rng, cfg) });
  }));

  const landed = grid.map((reel) => reel.slice()); // as it stopped, before any wilds climb
  const climbing = applyClimbingWilds(rng, grid, cfg);
  // Coins on a reel that turned wild are covered and no longer count.
  const liveCoins = coins.filter(({ index }) => !climbing.includes(Math.floor(index / C.ROWS)));

  const wins = evaluateWays(grid, cfg);
  const scat = scatterResult(grid, cfg);
  const lineWin = sum(wins);

  const result = {
    landed, landedCoins: coins, grid, coins: liveCoins, climbing, wins, scatter: scat,
    breakdown: { base: climbing.length ? 0 : lineWin, climbing: climbing.length ? lineWin : 0,
      scatter: scat.pay, freeSpins: 0, holdAndWin: 0 },
    freeSpins: null, holdAndWin: null,
  };

  if (scat.count >= 3) {
    result.freeSpins = playFreeSpins(rng, reels, cfg, cfg.FREE_SPINS_AWARD[scat.count]);
    result.breakdown.freeSpins = result.freeSpins.total;
  }
  if (liveCoins.length >= cfg.HOLD_AND_WIN.trigger) {
    result.holdAndWin = playHoldAndWin(rng, liveCoins, cfg);
    result.breakdown.holdAndWin = result.holdAndWin.total;
  }

  const raw = Object.values(result.breakdown).reduce((a, b) => a + b, 0);
  result.total = Math.min(raw, cfg.MAX_WIN);
  result.capped = raw > cfg.MAX_WIN;
  return result;
}
