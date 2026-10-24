// Canvas effects: drifting snow behind the game, and coin showers and
// sparkle bursts in front of it.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fitCanvas(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

export function startSnow(canvas) {
  let g = fitCanvas(canvas);
  addEventListener('resize', () => { g = fitCanvas(canvas); });
  const flakes = Array.from({ length: 70 }, () => ({
    x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, s: 0.2 + Math.random() * 0.6, d: Math.random() * 6,
  }));
  let storm = 1;
  function frame(t) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.75)';
    for (const f of flakes) {
      if (!reduced) {
        f.y += (f.s * storm) / h * 1.6;
        f.x += Math.sin(t / 1400 + f.d) * 0.0004 * storm;
        if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
      }
      g.beginPath();
      g.arc(f.x * w, f.y * h, f.r, 0, Math.PI * 2);
      g.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { setStorm: (v) => { storm = v; } };
}

export function createOverlay(canvas) {
  let g = fitCanvas(canvas);
  addEventListener('resize', () => { g = fitCanvas(canvas); });
  const parts = [];
  let running = false;

  function coinPath(p) {
    const squash = Math.abs(Math.cos(p.spin));
    g.save();
    g.translate(p.x, p.y);
    g.scale(Math.max(0.15, squash), 1);
    const grad = g.createRadialGradient(-p.r * 0.3, -p.r * 0.3, 1, 0, 0, p.r);
    grad.addColorStop(0, '#fff6cf');
    grad.addColorStop(0.5, '#ffc83d');
    grad.addColorStop(1, '#9a5806');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, p.r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(122,67,0,.8)';
    g.lineWidth = 1.5;
    g.stroke();
    g.restore();
  }

  function frame() {
    const h = canvas.clientHeight;
    g.clearRect(0, 0, canvas.clientWidth, h);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.grav;
      p.x += p.vx; p.y += p.vy; p.spin += p.vs; p.life--;
      if (p.kind === 'coin') coinPath(p);
      else {
        g.globalAlpha = Math.max(0, p.life / p.max);
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, Math.max(0, p.r * (p.life / p.max)), 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }
      if (p.life <= 0 || p.y > h + 40) parts.splice(i, 1);
    }
    if (parts.length) requestAnimationFrame(frame);
    else running = false;
  }
  const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  return {
    // Coins fountain up from the bottom and rain down. Count scales with the win.
    coinShower(count, ms = 2500) {
      if (reduced) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      let made = 0;
      const timer = setInterval(() => {
        for (let k = 0; k < 4 && made < count; k++, made++) {
          parts.push({
            kind: 'coin', x: w * (0.15 + Math.random() * 0.7), y: h + 20,
            vx: (Math.random() - 0.5) * 6, vy: -(10 + Math.random() * 9), grav: 0.32,
            r: 8 + Math.random() * 9, spin: Math.random() * 6, vs: 0.1 + Math.random() * 0.25, life: 400,
          });
        }
        kick();
        if (made >= count) clearInterval(timer);
      }, ms / Math.max(1, count / 4));
    },
    sparkle(x, y, n = 18, colors = ['#fff6cf', '#ffd36b', '#ff9a3c']) {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 4;
        parts.push({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, grav: 0.05,
          r: 2 + Math.random() * 3, spin: 0, vs: 0, life: 40 + Math.random() * 30, max: 70, color: colors[i % colors.length] });
      }
      kick();
    },
  };
}
