// Symbol artwork. The premium symbols, Wild and Free Spins scatter are
// painted tiles in ./img; the card royals and the doubloon are inline SVG.
// The build inlines the tiles as data URIs so a single page carries them.

const TILE = {
  H1: new URL('./img/gator.webp', import.meta.url).href,
  H2: new URL('./img/sevens.webp', import.meta.url).href,
  H3: new URL('./img/fleur.webp', import.meta.url).href,
  H4: new URL('./img/mask.webp', import.meta.url).href,
  A: new URL('./img/beads.webp', import.meta.url).href,
  K: new URL('./img/okra.webp', import.meta.url).href,
  WILD: new URL('./img/wild.webp', import.meta.url).href,
  SCAT: new URL('./img/freespins.webp', import.meta.url).href,
};

const defs = `
<defs>
  <linearGradient id="gGoldLine" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#e9b23a"/><stop offset="1" stop-color="#8a5a00"/>
  </linearGradient>
  <radialGradient id="gGold" cx="35%" cy="30%" r="75%">
    <stop offset="0" stop-color="#fff8d6"/><stop offset=".45" stop-color="#f2c242"/><stop offset="1" stop-color="#9a6206"/>
  </radialGradient>
  <radialGradient id="gPurple" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e3a8ff"/><stop offset=".5" stop-color="#8a2be2"/><stop offset="1" stop-color="#3a0a63"/></radialGradient>
  <radialGradient id="gGreen" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#b5ffb0"/><stop offset=".5" stop-color="#1fae4a"/><stop offset="1" stop-color="#064a1c"/></radialGradient>
  <radialGradient id="gNight" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#3b1656"/><stop offset=".6" stop-color="#1a0729"/><stop offset="1" stop-color="#0c0214"/></radialGradient>
  <filter id="fGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="fShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.5" stdDeviation="1.6" flood-color="#000" flood-opacity=".6"/></filter>
</defs>`;

// Card royals: a gold letter set in a ring of Mardi Gras beads.
const BEAD_COLORS = ['url(#gPurple)', 'url(#gGold)', 'url(#gGreen)'];
const beadRing = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2;
  return `<circle cx="${(50 + Math.cos(a) * 40).toFixed(1)}" cy="${(50 + Math.sin(a) * 40).toFixed(1)}" r="5.2" fill="${BEAD_COLORS[i % 3]}"/>`;
}).join('');

const royal = (ch, accent, size = 60) => `
  <circle cx="50" cy="50" r="40" fill="url(#gNight)"/>
  <g filter="url(#fShadow)">${beadRing}</g>
  <text x="50" y="${size > 56 ? 71 : 68}" text-anchor="middle" font-family="'Cinzel', 'Trajan Pro', Georgia, serif" font-weight="900"
    font-size="${size}" fill="url(#gGoldLine)" stroke="url(#${accent})" stroke-width="4" paint-order="stroke" filter="url(#fShadow)">${ch}</text>`;

// A fleur-de-lis drawn in one path, used on the doubloon.
const FLEUR = 'M50 18c-6 8-8 16-4 24-6-6-16-6-18 2-2 8 8 12 14 6-2 6-6 10-12 10v4h14l-2 10h16l-2-10h14v-4c-6 0-10-4-12-10 6 6 16 2 14-6-2-8-12-8-18-2 4-8 2-16-4-24z';

const SVG = {
  Q: royal('Q', 'gPurple'),
  J: royal('J', 'gGreen'),
  T: royal('10', 'gPurple', 46),
  // A parade doubloon: struck gold with a fleur-de-lis and a beaded rim.
  COIN: `
    <g filter="url(#fGlow)">
      ${Array.from({ length: 16 }, (_, i) => `<path d="M50 50L46 6h8z" fill="#ffcc4d" opacity=".5" transform="rotate(${i * 22.5} 50 50)"/>`).join('')}
    </g>
    <circle cx="50" cy="50" r="38" fill="url(#gGold)" stroke="#fff0b8" stroke-width="2.5" filter="url(#fShadow)"/>
    <circle cx="50" cy="50" r="31" fill="none" stroke="#8a5a00" stroke-width="2" stroke-dasharray="2.5 3" opacity=".8"/>
    <path d="${FLEUR}" fill="#b07a12" opacity=".55" transform="translate(50 52) scale(.62) translate(-50 -50)"/>
    <path d="M24 34a30 30 0 0 1 26-14" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>`,
};

export function symbolSvg(sym) {
  if (TILE[sym]) return `<img class="tile" src="${TILE[sym]}" alt="" draggable="false">`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${SVG[sym]}</svg>`;
}

export const SVG_DEFS = `<svg width="0" height="0" style="position:absolute">${defs}</svg>`;

export const SYMBOL_LABEL = {
  WILD: 'Wild', SCAT: 'Free Spins scatter', COIN: 'Doubloon', H1: 'King Gator', H2: 'Lucky 777', H3: 'Fleur-de-lis',
  H4: 'Carnival mask', A: 'Beads', K: 'Okra', Q: 'Q', J: 'J', T: '10',
};
