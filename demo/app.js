// Golden Ascent free-play demo. The engine decides the whole round first;
// everything here only animates that already-decided result.

import * as C from '../engine/config.js';
import { buildReels, playRound } from '../engine/engine.js';
import { cryptoRng, seededRng } from '../engine/rng.js';
import { symbolSvg, SVG_DEFS } from './art.js';
import { unlock, sfx, reelTicker, setMuted, isMuted, startTheme, setMood, duckTheme, say, applause, preloadVoices, fanfare } from './audio.js';
import { startConfetti, createOverlay } from './fx.js';

const BETS = [0.2, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500];
const TIERS = [[100, 'LEGENDARY', 'legendary', 1], [50, 'EPIC WIN', 'epicwin', 0.9], [25, 'MEGA WIN', 'megawin', 0.75], [10, 'BIG WIN', 'bigwin', 0.6]];
// Recorded rounds for the sales-demo buttons (found with the simulator).
const SHOWCASE = { fs: 16983, hw: 5085, cw: 95 };

const reels = buildReels(C);
// ?seed=N replays a fixed sequence, for QA and recording feature videos.
const seedParam = new URLSearchParams(location.search).get('seed');
const rng = seedParam ? seededRng(Number(seedParam)) : cryptoRng();

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (x) => x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let balance = 10000;
let betIdx = 2;
let busy = false;
const bet = () => BETS[betIdx];

document.body.insertAdjacentHTML('afterbegin', SVG_DEFS);
const confetti = startConfetti($('confetti'));
const fx = createOverlay($('fx'));

// ---------- reels ----------

const reelsEl = $('reels');
const reelEls = [];
const shown = [];          // symbols currently visible on each reel
for (let r = 0; r < C.REELS; r++) {
  const reel = document.createElement('div');
  reel.className = 'reel';
  reel.innerHTML = '<div class="strip"></div>';
  reelsEl.appendChild(reel);
  reelEls.push(reel);
}
const stripOf = (r) => reelEls[r].firstElementChild;
const cellAt = (r, row) => stripOf(r).children[row];

function sizeCells() {
  const h = reelEls[0].clientHeight / C.ROWS;
  reelsEl.style.setProperty('--cell', `${h}px`);
  return h;
}
addEventListener('resize', () => { sizeCells(); placeBulbs(); });

function coinLabel(coin) {
  return coin.jackpot ? `<span class="val jackpot">${coin.jackpot}</span>` : `<span class="val">${money(coin.value * bet())}</span>`;
}
function cellHtml(sym, coin) {
  return `<div class="cell${sym === 'COIN' ? ' coin' : ''}">${symbolSvg(sym)}${coin ? coinLabel(coin) : ''}</div>`;
}
function setReel(r, syms, coinOf = () => null) {
  shown[r] = syms.slice();
  stripOf(r).style.transform = 'translateY(0)';
  stripOf(r).innerHTML = syms.map((s, row) => cellHtml(s, coinOf(row))).join('');
}
const coinLookup = (coins, r) => {
  const map = new Map(coins.map((c) => [c.index, c.coin]));
  return (row) => map.get(r * C.ROWS + row);
};

// Spin every reel down to its final symbols, stopping left to right.
const reelMs = (r) => 950 + r * 240;
function spinReels(grid, strips, coins = []) {
  clearWins();
  const cell = sizeCells();
  let scatters = 0;
  const ticker = reelTicker(reelMs(grid.length - 1), grid.length);
  return Promise.all(grid.map((finalSyms, r) => new Promise((resolve) => {
    const strip = stripOf(r);
    const fillerCount = 16 + r * 5;
    const src = strips[r];
    const fillers = Array.from({ length: fillerCount }, () => src[Math.floor(Math.random() * src.length)]);
    const coinOf = coinLookup(coins, r);
    strip.innerHTML =
      finalSyms.map((s, row) => cellHtml(s, coinOf(row))).join('') +
      fillers.map((s) => cellHtml(s, s === 'COIN' ? { value: [0.5, 1, 2, 5][Math.floor(Math.random() * 4)] } : null)).join('') +
      shown[r].map((s) => cellHtml(s)).join('');
    const distance = (fillerCount + C.ROWS) * cell;
    // The spin is the game, so the reels always roll. With Reduce Motion on
    // they skip the blur and the overshoot bounce instead of snapping.
    const duration = reelMs(r);
    if (!reduced) reelEls[r].classList.add('blur');
    const anim = strip.animate(reduced ? [
      { transform: `translate3d(0,${-distance}px,0)`, easing: 'cubic-bezier(.3,.1,.3,1)' },
      { transform: 'translate3d(0,0,0)' },
    ] : [
      { transform: `translate3d(0,${-distance}px,0)`, easing: 'cubic-bezier(.45,.05,.55,1)' },
      { transform: `translate3d(0,${cell * 0.24}px,0)`, offset: 0.86, easing: 'cubic-bezier(.2,1.6,.4,1)' },
      { transform: 'translate3d(0,0,0)' },
    ], { duration });
    setTimeout(() => reelEls[r].classList.remove('blur'), duration * 0.75);
    anim.onfinish = () => {
      setReel(r, finalSyms, coinOf);
      sfx.reelStop(r);
      ticker.reelStopped();
      const n = finalSyms.filter((s) => s === 'SCAT').length;
      if (n) { scatters += n; sfx.scatterLand(scatters); }
      if (finalSyms.includes('COIN')) sfx.coinLand();
      resolve();
    };
  })));
}

function clearWins() {
  reelsEl.classList.remove('has-win');
  reelsEl.querySelectorAll('.cell.win').forEach((c) => c.classList.remove('win'));
}

function markWins(grid, wins, withScatters = false) {
  const cells = [];
  for (const w of wins) {
    for (let r = 0; r < w.length; r++) {
      grid[r].forEach((sym, row) => { if (sym === w.symbol || sym === 'WILD') cells.push(cellAt(r, row)); });
    }
  }
  if (withScatters) grid.forEach((reel, r) => reel.forEach((s, row) => { if (s === 'SCAT') cells.push(cellAt(r, row)); }));
  if (!cells.length) return;
  reelsEl.classList.add('has-win');
  for (const c of cells) c.classList.add('win');
  return cells;
}

function sparkleCells(cells, n = 10) {
  for (const c of (cells || []).slice(0, 12)) {
    const b = c.getBoundingClientRect();
    fx.sparkle(b.left + b.width / 2, b.top + b.height / 2, n);
  }
}

// ---------- cabinet lights, LED, meters ----------

function placeBulbs() {
  const m = $('machine');
  const w = m.clientWidth, h = m.clientHeight, inset = 8, gap = 26;
  const pts = [];
  const nx = Math.max(6, Math.round((w - 2 * inset) / gap)), ny = Math.max(6, Math.round((h - 2 * inset) / gap));
  for (let i = 0; i < nx; i++) pts.push([inset + (i * (w - 2 * inset)) / nx, inset]);
  for (let i = 0; i < ny; i++) pts.push([w - inset, inset + (i * (h - 2 * inset)) / ny]);
  for (let i = 0; i < nx; i++) pts.push([w - inset - (i * (w - 2 * inset)) / nx, h - inset]);
  for (let i = 0; i < ny; i++) pts.push([inset, h - inset - (i * (h - 2 * inset)) / ny]);
  $('bulbs').innerHTML = pts.map(([x, y], i) => `<i class="bulb" style="left:${x}px;top:${y}px;--i:${i % 12}"></i>`).join('');
}

function led(text, flash = false) {
  $('ledText').textContent = text;
  const el = $('led');
  el.classList.remove('flash');
  if (flash) { void el.offsetWidth; el.classList.add('flash'); }
}

function party(on) { $('machine').classList.toggle('party', on); }

function renderHud() {
  $('balance').textContent = money(balance);
  $('bet').textContent = money(bet());
  document.body.classList.toggle('high-limit', bet() >= 100);
  for (const el of document.querySelectorAll('[data-jp]')) {
    const jp = el.dataset.jp;
    const value = jp === 'GRAND' ? C.HOLD_AND_WIN.grand.value : C.COIN_VALUES.find((c) => c.jackpot === jp).value;
    el.textContent = money(value * bet());
  }
}

async function countUp(el, from, to, ms, ticking = true) {
  const start = performance.now();
  let lastTick = 0;
  for (;;) {
    const t = Math.min(1, (performance.now() - start) / ms);
    el.textContent = money(from + (to - from) * (1 - (1 - t) ** 3));
    if (ticking && performance.now() - lastTick > 70 && t < 1) { sfx.tick(); lastTick = performance.now(); }
    if (t === 1) return;
    await sleep(30);
  }
}

// Spell words in New Orleans sidewalk street-name tiles: one letter per
// 4 by 6 inch encaustic tile, set in grout inside a blue border band, like
// the corner inlays (PRYTANIA, ESPLANADE). "|" starts a new row and a space
// is a blank field tile. Each tile sits a hair off true, as hand-laid tile does.
const esc = (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch] || ch);
function setTiles(el, text) {
  const label = text.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
  el.setAttribute('aria-label', label);
  el.style.setProperty('--n', Math.max(...text.split('|').map((r) => r.length)));
  let k = 0;
  const tile = (ch) => {
    k++;
    const wob = (((k * 37 + ch.charCodeAt(0) * 11) % 9) - 4) * 0.22;
    const wear = ((k * 53) % 7) / 7;
    return ch === ' '
      ? `<i class="t blank" style="--r:${wob}deg;--w:${wear}"></i>`
      : `<i class="t" style="--r:${wob}deg;--w:${wear}"><b>${esc(ch)}</b></i>`;
  };
  el.innerHTML = `<span class="tile-field" aria-hidden="true">${text.split('|').map((row) =>
    `<span class="tile-row">${row.split(/(?<= )/).map((w) => `<span class="tile-word">${[...w].map(tile).join('')}</span>`).join('')}</span>`).join('')}</span>`;
}
// David's button art: spin ring (normal, pressed, greyed) and BET − / BET +.
const UI_ART = {
  spin: new URL('./img/btn-spin.webp', import.meta.url).href,
  spinPressed: new URL('./img/btn-spin-pressed.webp', import.meta.url).href,
  spinDisabled: new URL('./img/btn-spin-disabled.webp', import.meta.url).href,
  betMinus: new URL('./img/btn-bet-minus.webp', import.meta.url).href,
  betMinusPressed: new URL('./img/btn-bet-minus-pressed.webp', import.meta.url).href,
  betPlus: new URL('./img/btn-bet-plus.webp', import.meta.url).href,
  betPlusPressed: new URL('./img/btn-bet-plus-pressed.webp', import.meta.url).href,
  icon: new URL('./img/icon.webp', import.meta.url).href,
};
document.querySelectorAll('[data-art]').forEach((img) => { img.src = UI_ART[img.dataset.art]; img.draggable = false; });

document.querySelectorAll('[data-tiles]').forEach((el) => setTiles(el, el.dataset.tiles));

// Every 3D button clicks down and softly clicks back up.
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.cap, .art-btn, .start, .showcase button, dialog button');
  if (!b || b.disabled) return;
  sfx.press();
  addEventListener('pointerup', () => sfx.release(), { once: true });
});

// Full-screen takeover for feature intros and big wins. Tap to skip ahead.
async function takeover(kicker, title, amountText, ms, amountTo = null) {
  const el = $('takeover');
  $('takeoverKicker').textContent = kicker;
  setTiles($('takeoverTitle'), title);
  $('takeoverAmount').textContent = amountText || '';
  el.hidden = false;
  duckTheme(ms);
  let skip;
  const skipped = new Promise((r) => { skip = r; el.onclick = r; });
  const work = (async () => {
    if (amountTo !== null) await countUp($('takeoverAmount'), 0, amountTo, ms * 0.7);
    await sleep(amountTo !== null ? ms * 0.3 : ms);
  })();
  await Promise.race([work, skipped]);
  if (amountTo !== null) $('takeoverAmount').textContent = money(amountTo);
  await sleep(250);
  el.hidden = true;
  el.onclick = null;
  skip();
}

// Crowd size for a win: 0 at 1x the bet, rising to 1 at 100x.
const winSize = (amount) => Math.max(0, Math.min(1, Math.log10(Math.max(1, amount / bet())) / 2));

// Celebrate in proportion to the win, measured against the bet.
async function celebrate(amount) {
  const x = amount / bet();
  const tier = TIERS.find(([min]) => x >= min);
  if (!tier) return;
  party(true);
  fanfare();
  say(tier[2]);
  applause(tier[3]);
  fx.coinShower(Math.min(160, 30 + Math.round(x * 1.5)), 2400);
  confetti.setStorm(4);
  await takeover('YOU WIN', tier[1], '0.00', Math.min(5200, 2200 + x * 30), amount);
  confetti.setStorm(1);
  party(false);
}

// ---------- features ----------

// Free spins parade meter: every Wild raises the multiplier, up to 10x.
function setParadeMeter(mult) {
  const pct = ((mult - 1) / (C.FS_MULT_CAP - 1)) * 100;
  $('paradeFill').style.height = `${pct}%`;
  $('marker').style.bottom = `${pct}%`;
  $('parade').style.setProperty('--alt', `${pct}%`);
  $('paradeMult').textContent = `${mult}x`;
}

async function playFreeSpins(fs, scatterCount) {
  sfx.featureStart();
  party(true);
  say('freespins');
  applause(0.6);
  await takeover(`${scatterCount} SCATTERS`, 'FREE SPINS', `${fs.awarded} SPINS`, 2400);
  party(false);
  document.body.classList.add('fs');
  setMood('fs');
  confetti.setStorm(2.5);
  const alt = $('parade');
  alt.hidden = false;
  setParadeMeter(1);
  let total = 0, mult = 1;
  for (const [i, spin] of fs.spins.entries()) {
    led(`Free spin ${i + 1} · ${spin.remaining} left`);
    await spinReels(spin.grid, reels.free);
    if (spin.multiplier > mult) {
      mult = spin.multiplier;
      setParadeMeter(mult);
      sfx.multiplierUp();
      alt.classList.remove('bump'); void alt.offsetWidth; alt.classList.add('bump');
      const b = $('marker').getBoundingClientRect();
      fx.sparkle(b.left + b.width / 2, b.top + b.height / 2, 24, ['#4ee07a', '#b46bff', '#ffd36b']);
      led(`Parade multiplier · ${mult}x`, true);
    }
    const cells = markWins(spin.grid, spin.wins, spin.retrigger > 0);
    if (spin.retrigger) { led(`+${spin.retrigger} free spins!`, true); sfx.featureStart(); say('retrigger'); applause(0.5); }
    if (spin.win > 0) {
      sfx.win();
      sparkleCells(cells, 8);
      const before = total;
      total += spin.win * bet();
      await countUp($('win'), before, total, 600);
      await sleep(650);
    } else {
      await sleep(350);
    }
  }
  confetti.setStorm(1);
  alt.hidden = true;
  document.body.classList.remove('fs');
  say('paradeover');
  applause(winSize(total));
  await takeover('FREE SPINS COMPLETE', 'WHAT A PARADE', '0.00', 2600, total);
  setMood('base');
  return total;
}

async function playHoldAndWin(hw) {
  sfx.featureStart();
  party(true);
  say('holdwin');
  applause(0.5);
  await takeover(`${hw.start.length} DOUBLOONS`, 'HOLD & WIN', '3 RESPINS', 2400);
  party(false);
  clearWins();
  document.body.classList.add('hw');
  setMood('hw');
  const vaults = reelEls.map((reel) => {
    const v = document.createElement('div');
    v.className = 'vault';
    v.innerHTML = '<div class="slot"></div>'.repeat(C.ROWS);
    reel.appendChild(v);
    return v;
  });
  const slot = (i) => vaults[Math.floor(i / C.ROWS)].children[i % C.ROWS];
  const lock = (i, coin, drop) => {
    const s = slot(i);
    s.className = `slot locked${drop ? ' drop' : ''}`;
    s.innerHTML = symbolSvg('COIN') + coinLabel(coin);
  };
  for (const { index, coin } of hw.start) lock(index, coin, false);
  const lamps = [...$('respins').querySelectorAll('i')];
  const showLamps = (n) => lamps.forEach((l, i) => l.classList.toggle('on', i < n));
  $('respins').hidden = false;
  showLamps(C.HOLD_AND_WIN.respins);
  let running = hw.start.reduce((a, c) => a + c.coin.value, 0) * bet();
  $('win').textContent = money(running);
  await sleep(900);

  let left = C.HOLD_AND_WIN.respins;
  for (const step of hw.steps) {
    led('Respinning…');
    showLamps(left - 1);
    sfx.respinLamp();
    await sleep(700);
    for (const { index, coin } of step.landed) {
      lock(index, coin, true);
      sfx.coinLand();
      const b = slot(index).getBoundingClientRect();
      fx.sparkle(b.left + b.width / 2, b.top + b.height / 2, 14);
      if (coin.jackpot) {
        sfx.jackpot();
        document.querySelector(`.jp.${coin.jackpot.toLowerCase()}`)?.classList.add('hit');
        led(`${coin.jackpot} jackpot!`, true);
        say(coin.jackpot.toLowerCase());
        applause(coin.jackpot === 'MAJOR' ? 0.9 : 0.6);
      }
      running += coin.value * bet();
      $('win').textContent = money(running);
      await sleep(300);
    }
    left = step.respinsLeft;
    showLamps(left);
    if (step.landed.length) led('New doubloon! Respins reset to 3', true);
    await sleep(500);
  }
  if (hw.full) {
    sfx.jackpot();
    document.querySelector('.jp.grand').classList.add('hit');
    led('Board filled · GRAND JACKPOT!', true);
    say('grand');
    applause(1);
    await sleep(1500);
  }
  const total = hw.total * bet();
  if (!hw.full) { say('totalwin'); applause(winSize(total)); }
  await takeover('DOUBLOON HOLD & WIN', 'TOTAL WIN', '0.00', 2600, total);
  $('respins').hidden = true;
  vaults.forEach((v) => v.remove());
  document.querySelectorAll('.jp.hit').forEach((j) => j.classList.remove('hit'));
  document.body.classList.remove('hw');
  setMood('base');
  return total;
}

async function playClimbingWilds(round) {
  led('Krewe Wilds!', true);
  say('krewe');
  sfx.wildClimb();
  for (const r of round.climbing) {
    const col = document.createElement('div');
    col.className = 'climb';
    col.innerHTML = Array.from({ length: C.ROWS }, () => cellHtml('WILD')).join('');
    reelEls[r].appendChild(col);
    await sleep(480);
    const b = reelEls[r].getBoundingClientRect();
    fx.sparkle(b.left + b.width / 2, b.top + b.height / 2, 30);
  }
  await sleep(300);
  for (const r of round.climbing) {
    reelEls[r].querySelector('.climb')?.remove();
    setReel(r, round.grid[r]);
  }
}

// ---------- a round ----------

async function spin(roundRng = rng) {
  if (busy) return;
  if (balance < bet()) {
    balance += 10000;
    renderHud();
    led('Topped up 10,000 play credits', true);
    return;
  }
  busy = true;
  setControls(false);
  balance -= bet();
  renderHud();
  $('win').textContent = '0.00';
  led('Good luck!');
  sfx.spinStart();

  const round = playRound(roundRng, reels, C);
  await spinReels(round.landed, reels.base, round.landedCoins);

  if (round.climbing.length) await playClimbingWilds(round);

  let shownWin = 0;
  const lineWin = (round.breakdown.base + round.breakdown.climbing + round.breakdown.scatter) * bet();
  const cells = markWins(round.grid, round.wins, round.scatter.count >= 3);
  if (lineWin > 0) {
    // Wins of at least the bet get applause sized to the win; smaller ones only tick the meter.
    if (lineWin >= bet()) { sfx.win(); sparkleCells(cells); if (lineWin < bet() * 10) applause(winSize(lineWin)); } else sfx.smallWin();
    led(`Win ${money(lineWin)}`, lineWin >= bet() * 5);
    await countUp($('win'), 0, lineWin, 500 + Math.min(1200, (lineWin / bet()) * 60));
    shownWin = lineWin;
    await sleep(round.freeSpins || round.holdAndWin ? 900 : 300);
  } else if (round.scatter.count >= 3) {
    await sleep(900);
  }

  if (round.freeSpins) {
    shownWin += await playFreeSpins(round.freeSpins, round.scatter.count);
    $('win').textContent = money(shownWin);
  }
  if (round.holdAndWin) {
    shownWin += await playHoldAndWin(round.holdAndWin);
    $('win').textContent = money(shownWin);
  }
  if (round.freeSpins || round.holdAndWin) {
    round.grid.forEach((syms, r) => setReel(r, syms, coinLookup(round.coins, r)));
  }

  const total = round.total * bet();
  $('win').textContent = money(total);
  await celebrate(total);
  if (round.capped) { led('Max win reached!', true); say('maxwin'); }
  else if (total > 0) led(`Total win ${money(total)}`);
  else led('Spin again · the parade rolls on');

  balance += total;
  renderHud();
  busy = false;
  setControls(true);
}

function setControls(on) {
  $('spin').disabled = !on;
  $('spin').classList.toggle('spinning', !on);
  document.querySelectorAll('.showcase button, #betUp, #betDown').forEach((b) => { b.disabled = !on; });
}

// ---------- wiring ----------

$('spin').addEventListener('click', () => spin());
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat && $('intro').hidden && !$('info').open) { e.preventDefault(); spin(); }
});
$('betDown').addEventListener('click', () => { if (!busy && betIdx > 0) { betIdx--; renderHud(); refreshCoinLabels(); } });
$('betUp').addEventListener('click', () => { if (!busy && betIdx < BETS.length - 1) { betIdx++; renderHud(); refreshCoinLabels(); } });
$('soundBtn').addEventListener('click', () => {
  unlock();
  setMuted(!isMuted());
  $('soundBtn').setAttribute('aria-pressed', String(!isMuted()));
  $('soundBtn').setAttribute('aria-label', isMuted() ? 'Sound off' : 'Sound on');
});
$('infoBtn').addEventListener('click', () => { renderPaytable(); showTab('basics'); $('info').showModal(); });
// Player guide tabs.
function showTab(name) {
  document.querySelectorAll('.guide-tabs [data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  document.querySelectorAll('.guide [data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
  document.querySelector('.guide-body').scrollTop = 0;
}
document.querySelectorAll('.guide-tabs [data-tab]').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
document.querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => spin(seededRng(SHOWCASE[b.dataset.show]))));
$('startBtn').addEventListener('click', () => {
  unlock();
  sfx.featureStart();
  startTheme();
  preloadVoices();
  say('welcome');
  $('intro').hidden = true;
  $('spin').focus();
});

function refreshCoinLabels() {
  for (let r = 0; r < C.REELS; r++) setReel(r, shown[r]);
}

function renderPaytable() {
  const rows = Object.entries(C.PAYTABLE).map(([sym, pays]) =>
    `<tr><td>${symbolSvg(sym)}</td><td>${money(pays[3] * bet())}</td><td>${money(pays[4] * bet())}</td><td>${money(pays[5] * bet())}</td></tr>`);
  $('paytable').innerHTML = `<tr><th></th><th>3 of a kind</th><th>4 of a kind</th><th>5 of a kind</th></tr>${rows.join('')}` +
    `<tr><td>${symbolSvg('SCAT')}</td>${[3, 4, 5].map((n) => `<td>${money(C.SCATTER_PAY[n] * bet())}</td>`).join('')}</tr>`;
}

// Opening board: a friendly first look that shows off the premium symbols.
const opening = [['H1', 'A', 'COIN', 'K'], ['Q', 'H2', 'WILD', 'J'], ['SCAT', 'H3', 'T', 'H1'], ['K', 'WILD', 'H4', 'Q'], ['J', 'COIN', 'A', 'H2']];
renderHud();
sizeCells();
opening.forEach((syms, r) => setReel(r, syms, (row) => (syms[row] === 'COIN' ? { value: 2 } : null)));
placeBulbs();
requestAnimationFrame(() => { sizeCells(); placeBulbs(); });

// ---------- fit the whole cabinet on a phone screen ----------
// Phones lay the cabinet out at one design width, then zoom it so the
// marquee, jackpots, reels and controls all fit without scrolling.
const PHONE_W = 430;
function fitPhone() {
  const cab = $('cabinet');
  if (innerWidth > 700) { cab.style.zoom = ''; cab.style.width = ''; document.body.classList.remove('fitted'); return; }
  document.body.classList.add('fitted');
  cab.style.zoom = 1;
  cab.style.width = `${PHONE_W}px`;
  const z = Math.min(innerWidth / PHONE_W, innerHeight / cab.scrollHeight);
  cab.style.zoom = z.toFixed(4);
  sizeCells(); placeBulbs();
}
addEventListener('resize', fitPhone);
fitPhone();
