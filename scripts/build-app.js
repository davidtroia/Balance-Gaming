// Builds the free-play store/Telegram edition of Mardi Gras Mayhem into app/www.
//   node scripts/build-app.js            -> app/www (Capacitor webDir, store apps)
//   node scripts/build-app.js telegram   -> app/www-telegram (host anywhere over https)
// Same game and math as the demo. Differences: the sales-demo replay buttons and
// ?seed= replays are removed, and the copy says plainly that this is free-to-play
// with play credits that have no cash value.

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const target = process.argv[2] === 'telegram' ? 'telegram' : 'store';
const out = path.join(root, 'app', target === 'telegram' ? 'www-telegram' : 'www');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'demo'), path.join(out, 'demo'), { recursive: true });
fs.cpSync(path.join(root, 'engine'), path.join(out, 'engine'), { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=demo/index.html"><a href="demo/index.html">Play</a>');

const must = (text, find, repl) => {
  if (!text.includes(find)) throw new Error(`build-app: expected text not found: ${find.slice(0, 60)}`);
  return text.replace(find, repl);
};

// Page: no sales-demo buttons, free-to-play wording.
const htmlPath = path.join(out, 'demo', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/\s*<div class="showcase">[\s\S]*?<\/div>/, '');
html = html.replace(/<p class="notice">[\s\S]*?<\/p>/,
  '<p class="notice">Free-to-play entertainment for adults 18+. Play credits have no cash value and cannot be redeemed. No real-money gambling and no prizes. Winning in this game does not mean you will win real money.</p>');
html = must(html, 'Sound on. Play credits only.', 'Sound on. Play credits only. 18+');
if (target === 'telegram') {
  html = must(html, '</head>', '  <script src="https://telegram.org/js/telegram-web-app.js"></script>\n</head>');
  html = must(html, '</body>', '  <script>try{var t=window.Telegram&&Telegram.WebApp;if(t){t.ready();t.expand();t.disableVerticalSwipes&&t.disableVerticalSwipes();}}catch(e){}</script>\n</body>');
}
fs.writeFileSync(htmlPath, html);

// Script: drop the fixed-seed replay so every round uses the secure RNG.
const jsPath = path.join(out, 'demo', 'app.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = must(js, "const seedParam = new URLSearchParams(location.search).get('seed');", 'const seedParam = null;');
fs.writeFileSync(jsPath, js);

console.log(`Built ${target} edition: ${path.relative(root, out)}`);
