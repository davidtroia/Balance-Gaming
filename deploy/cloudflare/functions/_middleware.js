// Password gate for the partner demo on Cloudflare Pages.
// Every request (page, script, image, music) passes through here. Visitors
// without a valid cookie get the sign-in page instead of the game files.
//
// Set the password as an encrypted secret, never in this file:
//   npx wrangler pages secret put DEMO_PASSWORD --project-name mardi-gras-mayhem-demo
// Changing the password signs everyone out, because the cookie is derived from it.

const COOKIE = 'mgm_demo';
const SESSION_DAYS = 7;
const enc = new TextEncoder();

async function sessionToken(password) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('mardi-gras-mayhem-demo-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Compares in constant time so the response time gives nothing away.
function same(a, b) {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

const PRIVATE = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function page(status, message, extra = {}) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Mardi Gras Mayhem · Partner preview</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 24px 16px;
    font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #f6ecd2;
    background: radial-gradient(120% 80% at 50% 0%, #4b1670 0%, #1c0830 55%, #0b0414 100%); }
  .card { width: 100%; max-width: 380px; padding: 28px 24px 24px; border-radius: 18px; text-align: center;
    background: linear-gradient(#22103a, #150a24); border: 2px solid #d9a93a;
    box-shadow: 0 0 0 4px #150a24, 0 0 0 6px #1d7a46, 0 20px 50px #000a; }
  .kicker { margin: 0 0 6px; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #8fe0a8; }
  h1 { margin: 0 0 6px; font-size: 28px; line-height: 1.1; letter-spacing: .02em; color: #ffd76a; }
  p { margin: 0 0 18px; color: #d9cbe8; font-size: 15px; }
  label { display: block; text-align: left; font-size: 13px; margin-bottom: 6px; color: #d9cbe8; }
  input { width: 100%; padding: 14px; font-size: 17px; border-radius: 10px; border: 1px solid #6b4a92;
    background: #0e0619; color: #fff; }
  input:focus { outline: 2px solid #ffd76a; outline-offset: 1px; }
  button { width: 100%; margin-top: 14px; padding: 14px; font-size: 17px; font-weight: 700; border: 0; border-radius: 10px;
    color: #1a0d00; background: linear-gradient(#ffe48a, #e0a52c); box-shadow: 0 4px 0 #8a5a08; cursor: pointer; }
  button:active { transform: translateY(3px); box-shadow: 0 1px 0 #8a5a08; }
  .msg { min-height: 1.4em; margin: 12px 0 0; color: #ff9a8a; font-size: 14px; }
  .fine { margin: 18px 0 0; font-size: 12px; color: #9c8bb3; }
</style></head>
<body><main class="card">
  <p class="kicker">Balance Digital · Partner preview</p>
  <h1>Mardi Gras Mayhem</h1>
  <p>Enter the access code you were given to open the free-play demo.</p>
  <form method="post" action="/__access">
    <label for="pw">Access code</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
    <button type="submit">Open the demo</button>
  </form>
  <p class="msg" role="alert">${message}</p>
  <p class="fine">Free play with demo credits only. No real money, no downloads.<br>Confidential: please don't share this link.</p>
</main></body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...PRIVATE, ...extra },
  });
}

function withPrivateHeaders(response, path) {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(PRIVATE)) out.headers.set(k, v);
  // Music, voice, art and fonts rarely change: let the phone keep them for a day
  // (private, so no shared cache ever stores gated files). Pages and code revalidate.
  if (/^\/demo\/(music|voice|img|fonts)\//.test(path)) out.headers.set('Cache-Control', 'private, max-age=86400');
  return out;
}

export async function onRequest({ request, env, next }) {
  const password = env.DEMO_PASSWORD;
  if (!password) return page(503, 'This preview is not set up yet.');

  const url = new URL(request.url);
  const token = await sessionToken(password);

  if (url.pathname === '/__access') {
    if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
    const form = await request.formData().catch(() => null);
    const given = String(form?.get('password') ?? '');
    if (!same(given, password)) {
      await new Promise((r) => setTimeout(r, 800)); // slows down guessing
      return page(401, "That code didn't work. Check it and try again.");
    }
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/demo/',
        'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (url.pathname === '/__signout') {
    return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (!same(readCookie(request, COOKIE), token)) return page(401, '');

  if (url.pathname === '/' || url.pathname === '/demo') return Response.redirect(new URL('/demo/', url), 302);

  return withPrivateHeaders(await next(), url.pathname);
}
