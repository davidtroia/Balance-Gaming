# Balance Gaming

Casino game studio: games built for licensed, regulated online casinos.

## Mardi Gras Mayhem (first title)

A 5x4, 1,024-ways video slot with a New Orleans Mardi Gras theme.

| | |
|---|---|
| RTP | 96.25% (see [par sheet](docs/par-sheet.md)) |
| Hit frequency | ~27% (about 1 in 3.7 rounds pays) |
| Volatility | Medium-high |
| Max win | 5,000x bet |
| Features | Krewe Wilds, Free Spins Parade with a parade multiplier, Doubloon Hold & Win with four fixed jackpots |

### Run it

Requires Node 20+. There are no dependencies to install.

```bash
npm test               # engine tests, including a 1M-round RTP check
npm run sim            # 10M-round simulation report
npm run sim -- 50000000 2026   # rounds, seed
npm run demo           # free-play demo at http://localhost:8080/demo/
```

Add `?seed=123` to the demo URL to replay a fixed sequence of rounds, which is useful for QA and for recording feature videos.

### Layout

```
engine/config.js   every number that affects RTP: paytable, reel strips, features
engine/engine.js   pure game logic: one RNG in, one full round record out
engine/rng.js      seeded RNG for simulation, crypto RNG for the demo
sim/simulate.js    Monte Carlo simulator and report
sim/tune.js        quick what-if runs with config overrides
demo/              free-play browser demo that animates engine results
docs/par-sheet.md  math summary for labs and operators
```

### How the game stays certifiable

- **The RNG decides everything first.** `playRound` produces the whole round, including free spins and respins, before the demo shows anything. The animation only displays that result.
- **No staged near-misses.** Reel stops come straight from the RNG. Nothing places symbols just off the payline or adds suspense that the outcome doesn't justify.
- **Honest celebrations.** Big-win animations start at 10x the bet and scale with the win. A win smaller than the bet just updates the win meter.
- **Fixed math.** Odds never change based on the player, the session, or past results.
- **Production RNG.** The demo uses the browser's crypto RNG with free-play credits only. Real-money play runs on a partner's lab-certified remote game server and RNG (GLI-19 / BMM), with this engine's math submitted for certification.
