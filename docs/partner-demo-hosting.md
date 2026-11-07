# Partner demo: password-protected link

A private web link a casino partner opens on a phone or laptop. No app, no
download, no account: they type an access code and play the free-play demo.

- **Host:** Cloudflare Pages, free plan. Netlify and Vercel only offer password
  protection on paid plans; Cloudflare lets us run our own gate for free.
- **Gate:** `deploy/cloudflare/functions/_middleware.js` checks every request,
  including the game's scripts, art and music, so nothing loads without the code.
  A correct code sets a 7-day sign-in cookie. Changing the code signs everyone out.
- **Demo only:** play credits, no wallet, no payments, no sign-up. The page is
  marked `noindex` and robots are refused, so search engines don't list it.

## One-time setup (about 10 minutes)

You need Node 20 or newer on your computer (`node -v` to check; install from
nodejs.org if needed) and a free Cloudflare account (dash.cloudflare.com/sign-up).

```bash
# 1. Get the code
git clone https://github.com/davidtroia/Balance-Gaming.git
cd Balance-Gaming

# 2. Sign in to Cloudflare (opens your browser once)
npx wrangler@4 login

# 3. Create the project
npx wrangler@4 pages project create mardi-gras-mayhem-demo --production-branch main

# 4. Set the access code (you'll be asked to type it; it is stored encrypted)
npx wrangler@4 pages secret put DEMO_PASSWORD --project-name mardi-gras-mayhem-demo

# 5. Build and publish
npm run deploy:demo
```

The link is **https://mardi-gras-mayhem-demo.pages.dev** (Cloudflare prints it at
the end of step 5). If that name is taken, pick another in steps 3 and 4 and in
`deploy/cloudflare/wrangler.toml`.

If step 5 runs before step 4, the link shows "This preview is not set up yet"
and serves nothing, so the game is never exposed by mistake.

## Updating the demo

After game changes are merged: `git pull`, then `npm run deploy:demo`.

## Changing or revoking access

Run step 4 again with a new code, then `npm run deploy:demo`. Everyone who used
the old code is signed out and needs the new one.

## Sharing it

Send the link and the code in **separate messages** (for example, link by email,
code by text). Use a code of at least 12 characters, such as three random words
and a number.

## Testing locally

```bash
npm run build:demo
cd deploy/cloudflare
echo "DEMO_PASSWORD=pick-a-test-code" > .dev.vars   # ignored by git
npx wrangler@4 pages dev
```

Then open http://localhost:8788 and enter the test code.

## Mobile load speed (measured 2026-11-07)

Measured in Chromium emulating an iPhone 14 against the gate running in
Cloudflare's local runtime. Real Cloudflare hosting adds a little server time.

| Connection | Code accepted to "Let the good times roll" | Data before start | Base music playing |
|---|---|---|---|
| Wi-Fi / 5G | about 0.5 s | 0.4 MB | right away |
| 4G (9 Mbps) | about 1.1 to 1.5 s | 0.4 MB | about 2 s |
| Slow 4G (1.6 Mbps) | about 3.3 to 4 s | 0.4 MB | about 12 s |

The game screen itself is light (0.4 MB). The music is most of the weight: the
three Suno tracks are 5.6 MB of the 6.2 MB total. The base track starts
downloading while the intro card is up and plays first; the Free Spins and
Hold & Win tracks download after it. On a slow connection the reels, voice
calls and effects all work before the music arrives. Repeat visits load the
music from the phone's cache for a day.
