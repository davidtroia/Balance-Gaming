// Golden Ascent free-play demo. The engine decides the whole round first;
// everything here only animates that already-decided result.

import * as C from '../engine/config.js';
import { buildReels, playRound } from '../engine/engine.js';
import { cryptoRng, seededRng } from '../engine/rng.js';

const GLYPH = { WILD: '', SCAT: '⛰️', COIN: '🪙', H1: '🦅', H2: '🐐', H3: '🏮', H4: '🧭', A: 'A', K: 'K', Q: 'Q', J: 'J', T: '10' };
const BETS = [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
const TIERS = [[50, 'EPIC WIN'], [25, 'MEGA WIN'], [10, 'BIG WIN']];

const reels = buildReels(C);
// ?seed=N replays a fixed sequence, for QA and recording feature demos.
const seed = new URLSearchParams(location.search).get('seed');
const rng = seed ? seededRng(Number(seed)) : cryptoRng();
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (x) => x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let balance = 1000;
let betIdx = 2;
let busy = false;
const bet = () => BETS[betIdx];

// ---------- grid ----------

const gridEl = $('grid');
const cells = [];
for (let r = 0; r < C.REELS; r++) {
  const reelEl = document.createElement('div');
  reelEl.className = 'reel';
  for (let row = 0; row < C.ROWS; row++) {
    const cell = document.createElement('div');
    reelEl.appendChild(cell);
    cells.push(cell);
  }
  gridEl.appendChild(reelEl);
}
const cellAt = (r, row) => cells[r * C.ROWS + row];
const reelEl = (r) => gridEl.children[r];

function paint(cell, sym, coin) {
  cell.className = `cell s-${sym}`;
  cell.innerHTML = GLYPH[sym] + (coin ? `<small>${coinLabel(coin)}</small>` : '');
}
function coinLabel(coin) {
  return coin.jackpot || money(coin.value * bet());
}
function paintGrid(grid, coins = []) {
  const byIndex = new Map(coins.map((c) => [c.index, c.coin]));
  grid.forEach((reel, r) => reel.forEach((sym, row) => paint(cellAt(r, row), sym, byIndex.get(r * C.ROWS + row))));
}

async function spinTo(grid, strips, coins = []) {
  gridEl.classList.remove('has-win');
  const stopAt = grid.map((_, r) => performance.now() + 450 + r * 170);
  for (let r = 0; r < C.REELS; r++) reelEl(r).classList.add('spinning');
  const byIndex = new Map(coins.map((c) => [c.index, c.coin]));
  let spinning = C.REELS;
  while (spinning > 0) {
    const now = performance.now();
    spinning = 0;
    for (let r = 0; r < C.REELS; r++) {
      if (!reelEl(r).classList.contains('spinning')) continue;
      if (now >= stopAt[r]) {
        reelEl(r).classList.remove('spinning');
        grid[r].forEach((sym, row) => paint(cellAt(r, row), sym, byIndex.get(r * C.ROWS + row)));
        continue;
      }
      spinning++;
      const strip = strips[r];
      for (let row = 0; row < C.ROWS; row++) paint(cellAt(r, row), strip[Math.floor(Math.random() * strip.length)]);
    }
    await sleep(60);
  }
}

function highlightWins(grid, wins) {
  if (!wins.length) return;
  gridEl.classList.add('has-win');
  for (const w of wins) {
    for (let r = 0; r < w.length; r++) {
      grid[r].forEach((sym, row) => {
        if (sym === w.symbol || sym === 'WILD') cellAt(r, row).classList.add('win');
      });
    }
  }
}
function highlightScatters(grid) {
  gridEl.classList.add('has-win');
  grid.forEach((reel, r) => reel.forEach((sym, row) => { if (sym === 'SCAT') cellAt(r, row).classList.add('win'); }));
}

// ---------- HUD ----------

function banner(text) { $('banner').textContent = text || ''; }
function renderHud() {
  $('balance').textContent = money(balance);
  $('bet').textContent = money(bet());
  for (const el of document.querySelectorAll('[data-jp]')) {
    const jp = el.dataset.jp;
    const value = jp === 'GRAND' ? C.HOLD_AND_WIN.grand.value : C.COIN_VALUES.find((c) => c.jackpot === jp).value;
    el.textContent = money(value * bet());
  }
}

async function countUp(el, from, to, ms) {
  const start = performance.now();
  while (true) {
    const t = Math.min(1, (performance.now() - start) / ms);
    el.textContent = money(from + (to - from) * (1 - (1 - t) ** 3));
    if (t === 1) return;
    await sleep(30);
  }
}

// Celebrations scale with the win, measured against the bet.
async function celebrate(amount) {
  const x = amount / bet();
  const tier = TIERS.find(([min]) => x >= min);
  if (!tier) return;
  const box = $('celebrate');
  box.classList.add('show', 'big');
  const text = $('celebrateText');
  text.innerHTML = `<small>${tier[1]}</small><span>0.00</span>`;
  await countUp(text.querySelector('span'), 0, amount, Math.min(4000, 1200 + x * 25));
  await sleep(1200);
  box.classList.remove('show', 'big');
}

// ---------- features ----------

async function playFreeSpins(fs) {
  banner(`SUMMIT FREE SPINS · ${fs.awarded} SPINS`);
  await sleep(1400);
  const meter = $('meter');
  meter.hidden = false;
  let total = 0;
  for (const spin of fs.spins) {
    $('spinsLeft').textContent = `${spin.remaining} left`;
    await spinTo(spin.grid, reels.free);
    const prev = $('meterValue').textContent;
    $('meterValue').textContent = `${spin.multiplier}x`;
    if (prev !== `${spin.multiplier}x`) { meter.classList.remove('bump'); void meter.offsetWidth; meter.classList.add('bump'); }
    highlightWins(spin.grid, spin.wins);
    if (spin.retrigger) { highlightScatters(spin.grid); banner(`+${spin.retrigger} FREE SPINS!`); }
    if (spin.win > 0) {
      const before = total;
      total += spin.win * bet();
      await countUp($('win'), before, total, 500);
      await sleep(500);
    } else {
      await sleep(250);
    }
    if (spin.retrigger) banner(`SUMMIT FREE SPINS`);
  }
  meter.hidden = true;
  $('meterValue').textContent = '1x';
  banner(`FREE SPINS WIN ${money(total)}`);
  await sleep(1200);
  return total;
}

async function playHoldAndWin(hw) {
  banner('TREASURE HOLD & WIN');
  gridEl.classList.remove('has-win');
  const board = new Array(C.REELS * C.ROWS).fill(null);
  for (const { index, coin } of hw.start) board[index] = coin;
  const draw = () => board.forEach((coin, i) => {
    const cell = cells[i];
    if (coin) { paint(cell, 'COIN', coin); cell.classList.add('locked'); }
    else { cell.className = 'cell empty'; cell.textContent = ''; }
  });
  draw();
  await sleep(1300);
  for (const step of hw.steps) {
    banner(`RESPINS LEFT: ${step.respinsLeft}`);
    await sleep(550);
    for (const { index, coin } of step.landed) {
      board[index] = coin;
      paint(cells[index], 'COIN', coin);
      cells[index].classList.add('locked', 'new');
      await sleep(220);
    }
  }
  if (hw.full) { banner('BOARD FILLED · GRAND!'); await sleep(1200); }
  const total = hw.total * bet();
  banner(`HOLD & WIN ${money(total)}`);
  await sleep(1200);
  return total;
}

// ---------- spin ----------

async function spin() {
  if (busy) return;
  if (balance < bet()) { banner('Not enough play credits. Reload to reset.'); return; }
  busy = true;
  $('spin').disabled = true;
  balance -= bet();
  renderHud();
  banner('');
  $('win').textContent = '0.00';

  const round = playRound(rng, reels, C);
  await spinTo(round.landed, reels.base, round.landedCoins);

  if (round.climbing.length) {
    banner('CLIMBING WILDS!');
    for (const r of round.climbing) {
      reelEl(r).classList.add('wildclimb');
      round.grid[r].forEach((sym, row) => paint(cellAt(r, row), sym));
      await sleep(350);
      reelEl(r).classList.remove('wildclimb');
    }
  }

  let shown = 0;
  const baseWin = (round.breakdown.base + round.breakdown.climbing + round.breakdown.scatter) * bet();
  highlightWins(round.grid, round.wins);
  if (round.scatter.count >= 3) highlightScatters(round.grid);
  if (baseWin > 0) {
    await countUp($('win'), 0, baseWin, 600);
    shown = baseWin;
    await sleep(700);
  }

  if (round.freeSpins) {
    const fsWin = await playFreeSpins(round.freeSpins);
    $('win').textContent = money(shown += fsWin);
  }
  if (round.holdAndWin) {
    const hwWin = await playHoldAndWin(round.holdAndWin);
    $('win').textContent = money(shown += hwWin);
  }

  const total = round.total * bet();
  if (round.capped) banner('MAX WIN REACHED');
  if (round.freeSpins || round.holdAndWin) paintGrid(round.grid, round.coins);
  $('win').textContent = money(total);
  await celebrate(total);
  if (total > 0 && !round.freeSpins && !round.holdAndWin && !round.capped) banner(`WIN ${money(total)}`);

  balance += total;
  renderHud();
  busy = false;
  $('spin').disabled = false;
}

// ---------- wiring ----------

$('spin').addEventListener('click', spin);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat && !$('info').open) { e.preventDefault(); spin(); }
});
$('betDown').addEventListener('click', () => { if (!busy && betIdx > 0) { betIdx--; renderHud(); } });
$('betUp').addEventListener('click', () => { if (!busy && betIdx < BETS.length - 1) { betIdx++; renderHud(); } });
$('infoBtn').addEventListener('click', () => { renderPaytable(); $('info').showModal(); });

function renderPaytable() {
  const rows = Object.entries(C.PAYTABLE).map(([sym, pays]) =>
    `<tr><td class="s-${sym}">${GLYPH[sym]}</td><td>${money(pays[3] * bet())}</td><td>${money(pays[4] * bet())}</td><td>${money(pays[5] * bet())}</td></tr>`);
  $('paytable').innerHTML = `<tr><th></th><th>3×</th><th>4×</th><th>5×</th></tr>${rows.join('')}` +
    `<tr><td>⛰️</td>${[3, 4, 5].map((n) => `<td>${money(C.SCATTER_PAY[n] * bet())}</td>`).join('')}</tr>`;
}

renderHud();
paintGrid(reels.base.map((strip) => strip.slice(0, C.ROWS)));
banner('Press SPIN to begin your climb');
