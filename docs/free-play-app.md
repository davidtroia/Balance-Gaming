# Mardi Gras Mayhem free-play app

The same game and math as the demo, packaged for the App Store, Google Play and Telegram. It is free to play with play credits only. There is no cash-out, no prizes and no way to buy credits in this edition.

## What differs from the demo

`scripts/build-app.js` copies `demo/` and `engine/` into `app/www/` and changes three things:

- The "Sales demo" replay buttons are removed.
- `?seed=` replays are ignored, so every round uses the secure RNG.
- The notice and start screen say plainly that it is free-to-play, 18+, with no cash value and no real-money gambling.

The engine, RTP (96.25%), art and audio are untouched.

## Build it

```
cd app
npm install
npm run build            # app/www        -> store apps
npm run build:telegram   # app/www-telegram -> Telegram Mini App
npx cap sync android     # copy www into the Android project
```

Regenerate icons and splash screens from David's master art with `python3 tools/make-app-icons.py`.

## Android

- The Android project is in `app/android`. Package id: `com.balancedigital.mardigrasmayhem`.
- The GitHub Action `Android build` (Actions tab, Run workflow) builds an installable debug APK without any local setup. Download the artifact and open it on a phone to test. This workflow has not run yet, so check its first run.
- For Google Play you need a signed release bundle (`./gradlew bundleRelease` with an upload key). Create the key once and keep it safe; losing it blocks updates.

## iOS

- No Mac is needed. Use a cloud builder such as Codemagic: add the repo, run `npm install && npm run build && npx cap add ios && npx cap sync ios` in `app/`, then build and upload to App Store Connect.
- Use `app/store-assets/ios-icon-1024.png` as the App Store icon.
- The iOS project has not been generated or built yet.

## Telegram Mini App

1. Run `npm run build:telegram` and host `app/www-telegram/` anywhere over https (for example Cloudflare Pages on the free plan).
2. In Telegram, message @BotFather, create a bot, then `/newapp` and give it the https URL.
3. The build calls `Telegram.WebApp.ready()` and `expand()` and loads Telegram's own script from telegram.org. That is the only third-party request in this edition.

Keep it free-to-play on Telegram too. Do not add real-money play or crypto prizes there.

## Before submitting to a store

- **Title check.** Run a real trademark search on "Mardi Gras Mayhem" first. A casino promotion has used that exact name and other Mardi Gras marks are registered in gaming classes (see the compliance notes). Renaming after launch is costly.
- **Accounts.** Apple Developer Program ($99/year) and Google Play Console ($25 once), both as Balance Digital LLC (organization accounts need a free D-U-N-S number).
- **Age rating.** Answer the store questionnaires honestly: simulated gambling, frequent. Expect an 18+ rating on both stores, and do not target children.
- **Policies.** Both stores need a privacy policy URL. The game stores nothing off the device and has no ads, analytics or accounts today, which keeps the privacy labels simple.
- **Store text.** Say "free to play, no real-money gambling, no prizes" and never imply winnings here predict winnings elsewhere.
- **Coin sales.** Not included. Selling credits has class-action risk in some states, so get an attorney's sign-off before adding it.
- **Music rights.** Confirm the Suno commercial rights for each track, as flagged in the compliance check.
- **Screenshots.** Phone portrait and landscape screenshots from the finished build, plus the 512px Play icon in `app/store-assets/`.
