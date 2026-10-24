// Symbol artwork as inline SVG, so the demo ships with no image files.
// Every symbol sits in a 100x100 box.

const defs = `
<defs>
  <radialGradient id="gGold" cx="35%" cy="30%" r="75%">
    <stop offset="0" stop-color="#fff6cf"/><stop offset=".45" stop-color="#ffc83d"/><stop offset="1" stop-color="#a45f07"/>
  </radialGradient>
  <linearGradient id="gGoldLine" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#e9a521"/><stop offset="1" stop-color="#8a4c00"/>
  </linearGradient>
  <radialGradient id="gRuby" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".5" stop-color="#d4183b"/><stop offset="1" stop-color="#5e0618"/></radialGradient>
  <radialGradient id="gEmerald" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#9dffc8"/><stop offset=".5" stop-color="#14a865"/><stop offset="1" stop-color="#03432a"/></radialGradient>
  <radialGradient id="gSapphire" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#9fd8ff"/><stop offset=".5" stop-color="#1f6fe0"/><stop offset="1" stop-color="#0a2463"/></radialGradient>
  <radialGradient id="gAmethyst" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e7b8ff"/><stop offset=".5" stop-color="#8e38d6"/><stop offset="1" stop-color="#3a0f63"/></radialGradient>
  <radialGradient id="gMolten" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffd23f"/><stop offset=".7" stop-color="#ff8a00"/><stop offset="1" stop-color="#b33a00"/></radialGradient>
  <radialGradient id="gOnyx" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#3a352d"/><stop offset=".55" stop-color="#121010"/><stop offset="1" stop-color="#000"/></radialGradient>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050505"/><stop offset="1" stop-color="#b8924a"/></linearGradient>
  <linearGradient id="gSnow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9d4ff"/></linearGradient>
  <linearGradient id="gRock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a5248"/><stop offset="1" stop-color="#14110c"/></linearGradient>
  <filter id="fGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="fShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.5" stdDeviation="1.6" flood-color="#000" flood-opacity=".55"/></filter>
</defs>`;

// A gem-cut badge: octagon frame in gold around a jewel-tone face.
const badge = (fill) => `
  <path d="M30 6h40l24 24v40L70 94H30L6 70V30z" fill="url(#gGoldLine)" filter="url(#fShadow)"/>
  <path d="M33 13h34l20 20v34L67 87H33L13 67V33z" fill="url(#gOnyx)"/>
  <path d="M35 17h30l18 18v30L65 83H35L17 65V35z" fill="none" stroke="url(#${fill})" stroke-width="3"/>
  <path d="M33 13h34l20 20v8C70 30 30 30 13 41v-8z" fill="#fff" opacity=".18"/>`;

const letter = (ch, fill, size = 64) => `
  <text x="50" y="${size > 60 ? 72 : 69}" text-anchor="middle" font-family="'Cinzel', 'Trajan Pro', Georgia, serif" font-weight="900"
    font-size="${size}" fill="url(#gGoldLine)" stroke="url(#${fill})" stroke-width="4" paint-order="stroke" filter="url(#fShadow)">${ch}</text>
  <text x="50" y="${size > 60 ? 72 : 69}" text-anchor="middle" font-family="'Cinzel', 'Trajan Pro', Georgia, serif" font-weight="900"
    font-size="${size}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1">${ch}</text>`;

const ART = {
  H1: `${badge('gRuby')}
    <g filter="url(#fShadow)">
      <path d="M24 60c6-20 22-34 42-34 8 0 14 4 16 10l-10 4c-2-3-5-4-8-4-4 0-6 3-6 6 6 0 12 4 14 10-8-2-14-1-20 2 8 2 13 8 14 16-12-6-24-8-42-10z" fill="url(#gGold)"/>
      <path d="M72 36l14 6-12 4z" fill="#ffdf6e"/>
      <circle cx="62" cy="36" r="3" fill="#1b0f3a"/>
      <path d="M30 58c10-2 20-2 30 2" stroke="#8a4c00" stroke-width="2" fill="none" opacity=".6"/>
    </g>`,
  H2: `${badge('gEmerald')}
    <g filter="url(#fShadow)">
      <path d="M40 30c-14-14-6-26 6-22-8 4-8 14 2 20zM60 30c14-14 6-26-6-22 8 4 8 14-2 20z" fill="url(#gGold)"/>
      <path d="M38 34c0-6 6-8 12-8s12 2 12 8l-2 18c-2 10-6 16-10 18-4-2-8-8-10-18z" fill="#f3e2c0"/>
      <path d="M44 66c2 6 4 10 6 12 2-2 4-6 6-12z" fill="#fff"/>
      <circle cx="44" cy="42" r="2.6" fill="#1b0f3a"/><circle cx="56" cy="42" r="2.6" fill="#1b0f3a"/>
      <path d="M47 58h6l-3 4z" fill="#5a3200"/>
    </g>`,
  H3: `${badge('gSapphire')}
    <g filter="url(#fShadow)">
      <path d="M42 18h16l-2 6H44z" fill="url(#gGold)"/>
      <path d="M50 10a6 6 0 0 1 6 6h-12a6 6 0 0 1 6-6z" fill="none" stroke="url(#gGold)" stroke-width="3"/>
      <path d="M38 26h24l4 10v28l-4 10H38l-4-10V36z" fill="url(#gGold)"/>
      <path d="M40 34h20v32H40z" fill="#ffe9a6"/>
      <path d="M50 40c6 8 6 14 0 20-6-6-6-12 0-20z" fill="#ff7a1a" filter="url(#fGlow)"/>
      <path d="M50 48c2 4 2 7 0 10-2-3-2-6 0-10z" fill="#fff5c0"/>
      <path d="M36 74h28l-4 8H40z" fill="url(#gGold)"/>
    </g>`,
  H4: `${badge('gAmethyst')}
    <g filter="url(#fShadow)">
      <circle cx="50" cy="50" r="26" fill="url(#gGold)"/>
      <circle cx="50" cy="50" r="20" fill="#0c0a08"/>
      <path d="M50 30l5 20-5 20-5-20z" fill="#ff5a6e"/>
      <path d="M50 30l5 20h-10z" fill="#ffd1d6"/>
      <path d="M30 50l20-4 20 4-20 4z" fill="#ffe9a6" opacity=".9"/>
      <circle cx="50" cy="50" r="3" fill="url(#gGold)"/>
    </g>`,
  A: letter('A', 'gRuby'),
  K: letter('K', 'gEmerald'),
  Q: letter('Q', 'gSapphire'),
  J: letter('J', 'gAmethyst'),
  T: letter('10', 'gOnyx', 50),
  WILD: `
    <g filter="url(#fGlow)">
      ${Array.from({ length: 12 }, (_, i) => `<path d="M50 50L47 4h6z" fill="#ffd36b" opacity=".75" transform="rotate(${i * 30} 50 50)"/>`).join('')}
    </g>
    <circle cx="50" cy="50" r="30" fill="url(#gGold)" stroke="#fff3c2" stroke-width="2" filter="url(#fShadow)"/>
    <path d="M28 58l12-16 8 10 6-8 18 14z" fill="#8a4c00" opacity=".55"/>
    <rect x="8" y="56" width="84" height="22" rx="6" fill="#0a0908" stroke="url(#gGoldLine)" stroke-width="3" filter="url(#fShadow)"/>
    <text x="50" y="73" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="18" fill="#fff6cf" letter-spacing="2">WILD</text>`,
  SCAT: `
    <circle cx="50" cy="48" r="40" fill="url(#gSky)" stroke="url(#gGoldLine)" stroke-width="4" filter="url(#fShadow)"/>
    <path d="M14 70l22-30 10 12 14-26 26 44z" fill="url(#gRock)"/>
    <path d="M60 26l-8 15 5-3 4 4 4-5 5 3z" fill="url(#gSnow)"/>
    <path d="M36 40l-6 9 4-2 3 3 3-3z" fill="url(#gSnow)"/>
    <path d="M60 26V10" stroke="#fff3c2" stroke-width="2"/>
    <path d="M60 10l14 4-14 5z" fill="url(#gGold)" filter="url(#fGlow)"/>
    <rect x="12" y="70" width="76" height="20" rx="6" fill="#0a0908" stroke="url(#gGoldLine)" stroke-width="3" filter="url(#fShadow)"/>
    <text x="50" y="85" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="13" fill="#fff6cf" letter-spacing="1.5">SUMMIT</text>`,
  COIN: `
    <g filter="url(#fGlow)">
      ${Array.from({ length: 16 }, (_, i) => `<path d="M50 50L46 6h8z" fill="#ffb02e" opacity=".55" transform="rotate(${i * 22.5} 50 50)"/>`).join('')}
    </g>
    <circle cx="50" cy="50" r="38" fill="url(#gMolten)"/>
    <circle cx="50" cy="50" r="38" fill="none" stroke="#ffe08a" stroke-width="2.5"/>
    <circle cx="50" cy="50" r="31" fill="none" stroke="#b35400" stroke-width="2" stroke-dasharray="2.5 3" opacity=".8"/>
    <path d="M24 34a30 30 0 0 1 26-14" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>`,
};

export function symbolSvg(sym) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${ART[sym]}</svg>`;
}

export const SVG_DEFS = `<svg width="0" height="0" style="position:absolute">${defs}</svg>`;

export const SYMBOL_LABEL = {
  WILD: 'Wild', SCAT: 'Summit scatter', COIN: 'Gold coin', H1: 'Eagle', H2: 'Ibex', H3: 'Lantern',
  H4: 'Compass', A: 'A', K: 'K', Q: 'Q', J: 'J', T: '10',
};
