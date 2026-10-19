// Random number sources.
//
// The game engine only ever asks an RNG for `int(n)`: a uniform integer in [0, n).
// Production play must use a lab-certified RNG running on the game server; the
// sources here are for the free-play demo and for math simulation only.

// xoshiro128** — fast, 2^128-1 period, reproducible from a seed. Used by the
// simulator so a run can be repeated exactly.
export function seededRng(seed = 1) {
  let s0 = splitmix(seed), s1 = splitmix(s0), s2 = splitmix(s1), s3 = splitmix(s2);
  function next() {
    const result = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0;
    const t = s1 << 9;
    s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3;
    s2 ^= t;
    s3 = rotl(s3, 11);
    return result;
  }
  return { int: (n) => unbiased(next, n) };
}

// Browser crypto RNG for the free-play demo.
export function cryptoRng() {
  const buf = new Uint32Array(64);
  let i = buf.length;
  function next() {
    if (i === buf.length) { crypto.getRandomValues(buf); i = 0; }
    return buf[i++];
  }
  return { int: (n) => unbiased(next, n) };
}

// Rejection sampling so every outcome in [0, n) is exactly equally likely.
function unbiased(next32, n) {
  const limit = Math.floor(0x100000000 / n) * n;
  let x;
  do { x = next32(); } while (x >= limit);
  return x % n;
}

function rotl(x, k) { return ((x << k) | (x >>> (32 - k))) >>> 0; }

function splitmix(a) {
  a = (a + 0x9e3779b9) | 0;
  let z = a;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}
