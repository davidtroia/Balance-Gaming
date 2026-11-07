// Builds the static files for the password-protected partner demo:
//   node scripts/build-demo-site.js
// Output: deploy/cloudflare/public/ with the demo at /demo/ and the engine at
// /engine/, the same layout the local server uses, so nothing in the game changes.

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'deploy/cloudflare/public');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'demo'), path.join(out, 'demo'), { recursive: true });
fs.mkdirSync(path.join(out, 'engine'));
for (const f of ['config.js', 'engine.js', 'rng.js']) fs.copyFileSync(path.join(root, 'engine', f), path.join(out, 'engine', f));

// Start fetching every script at once instead of discovering imports one level
// at a time, start the base music early, and keep the page out of search engines.
const htmlPath = path.join(out, 'demo/index.html');
const modules = ['app.js', 'audio.js', 'art.js', 'fx.js', '../engine/config.js', '../engine/engine.js', '../engine/rng.js'];
const head = [
  '<meta name="robots" content="noindex, nofollow">',
  ...modules.map((m) => `<link rel="modulepreload" href="${m}">`),
  // The base music downloads while the visitor reads the intro card.
  '<link rel="preload" href="music/frenchmen-street.mp3" as="fetch" crossorigin>',
].map((l) => `  ${l}\n`).join('');
let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('</title>')) throw new Error('demo/index.html has no <title>');
html = html.replace('</title>\n', `</title>\n${head}`);
fs.writeFileSync(htmlPath, html);

fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

let bytes = 0;
let files = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else { bytes += fs.statSync(p).size; files++; }
  }
})(out);
console.log(`Built ${files} files (${(bytes / 1048576).toFixed(1)} MB) in ${path.relative(root, out)}/`);
