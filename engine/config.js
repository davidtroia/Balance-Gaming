// Golden Ascent math model. Every number that affects RTP lives in this file,
// so the par sheet, the simulator and the demo all read the same source.
//
// All pays are multiples of the TOTAL bet. Tuned to ~96% RTP; run
// `npm run sim` after any change and update docs/par-sheet.md.

export const ROWS = 4;
export const REELS = 5;
export const MAX_WIN = 5000;

export const SYMBOLS = {
  WILD: { name: 'Wild', kind: 'wild' },
  SCAT: { name: 'Summit', kind: 'scatter' },
  COIN: { name: 'Gold Coin', kind: 'coin' },
  H1: { name: 'Eagle', kind: 'pay' },
  H2: { name: 'Ibex', kind: 'pay' },
  H3: { name: 'Lantern', kind: 'pay' },
  H4: { name: 'Compass', kind: 'pay' },
  A: { name: 'A', kind: 'pay' },
  K: { name: 'K', kind: 'pay' },
  Q: { name: 'Q', kind: 'pay' },
  J: { name: 'J', kind: 'pay' },
  T: { name: '10', kind: 'pay' },
};

// 1,024 ways: 3, 4 or 5 of a kind on adjacent reels from the left.
export const PAYTABLE = {
  H1: [0, 0, 0, 1.0, 2.5, 7.5],
  H2: [0, 0, 0, 0.6, 1.5, 4.0],
  H3: [0, 0, 0, 0.4, 1.0, 2.5],
  H4: [0, 0, 0, 0.3, 0.8, 2.0],
  A:  [0, 0, 0, 0.15, 0.4, 1.0],
  K:  [0, 0, 0, 0.15, 0.4, 1.0],
  Q:  [0, 0, 0, 0.1, 0.25, 0.6],
  J:  [0, 0, 0, 0.1, 0.25, 0.6],
  T:  [0, 0, 0, 0.1, 0.25, 0.6],
};

// Scatter pays anywhere, by count, and awards free spins.
export const SCATTER_PAY = { 3: 1, 4: 5, 5: 25 };
export const FREE_SPINS_AWARD = { 3: 8, 4: 12, 5: 20 };
export const FREE_SPINS_RETRIGGER = 5;   // 3+ scatters during free spins
export const FS_MULT_CAP = 10;           // altitude meter maximum

// Stack height of each symbol on the strips (1 when not listed). Stacked
// premiums make bigger ways wins; single low symbols keep small wins coming.
export const STACK = { H1: 3, H2: 3, H3: 3, H4: 3, A: 2, K: 2 };

// Reel strips are listed as symbol counts per reel; buildStrip() lays them
// out in a fixed, reproducible order. Wilds appear on reels 2-4 only.
const PAY = { H1: 3, H2: 4, H3: 4, H4: 5, A: 6, K: 6, Q: 6, J: 6, T: 6 };
export const BASE_REELS = [
  { ...PAY, SCAT: 1, COIN: 5 },
  { ...PAY, SCAT: 1, COIN: 6, WILD: 2 },
  { ...PAY, SCAT: 2, COIN: 6, WILD: 2 },
  { ...PAY, SCAT: 1, COIN: 6, WILD: 2 },
  { ...PAY, SCAT: 1, COIN: 5 },
];

const FREE_PAY = { H1: 4, H2: 5, H3: 5, H4: 6, A: 7, K: 7, Q: 7, J: 7, T: 7 };
export const FREE_REELS = [
  { ...FREE_PAY, SCAT: 2 },
  { ...FREE_PAY, SCAT: 1, WILD: 2 },
  { ...FREE_PAY, SCAT: 2, WILD: 2 },
  { ...FREE_PAY, SCAT: 1, WILD: 2 },
  { ...FREE_PAY, SCAT: 2 },
];

// Climbing Wilds (base game): chance per spin, then how many of reels 2-4
// turn fully wild.
export const CLIMBING_WILDS = {
  chanceIn: 130,
  reelCountWeights: { 1: 90, 2: 9, 3: 1 },
};

// Gold coin values. Jackpot coins pay a fixed amount.
export const COIN_VALUES = [
  { value: 0.5, weight: 300 },
  { value: 1, weight: 200 },
  { value: 1.5, weight: 120 },
  { value: 2, weight: 70 },
  { value: 3, weight: 35 },
  { value: 5, weight: 25 },
  { value: 8, weight: 12 },
  { value: 10, weight: 6 },
  { value: 10, weight: 6, jackpot: 'MINI' },
  { value: 25, weight: 2, jackpot: 'MINOR' },
  { value: 100, weight: 0.5, jackpot: 'MAJOR' },
];

// Hold & Win: 6+ coins lock and award 3 respins. Each empty cell spins its
// own single-cell strip; any new coin resets respins to 3.
export const HOLD_AND_WIN = {
  trigger: 6,
  respins: 3,
  cellStrip: { COIN: 1, BLANK: 34 },
  grand: { value: 1000, jackpot: 'GRAND' }, // filling all 20 cells
};
