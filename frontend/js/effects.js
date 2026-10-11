/* Visual effects: scroll reveal, card tilt, sparkle cursor. */
document.documentElement.classList.add('js');

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Fade elements in as they scroll into view. Call reveal(parent) after rendering new content. */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { threshold: 0.12 });

function reveal(root = document) {
  root.querySelectorAll('.rv:not(.in)').forEach((el, i) => {
    if (el.dataset.stagger !== undefined) el.style.setProperty('--d', (i % 6) * 0.08 + 's');
    io.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  reveal();
  if (reducedMotion) return;

  /* 3D tilt + light sheen on project cards */
  const grid = document.getElementById('pg');
  grid.addEventListener('pointermove', e => {
    const card = e.target.closest('.pc');
    if (!card || e.pointerType === 'touch') return;
    const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
    card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
    card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  });
  grid.addEventListener('pointerout', e => {
    const card = e.target.closest('.pc');
    if (card && !card.contains(e.relatedTarget)) { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); }
  });

  /* Small sparkle trail that follows the mouse, with a tiny burst on click */
  const canvas = document.getElementById('fx'), ctx = canvas.getContext('2d');
  const colors = ['#00f5d4', '#1fb6d4', '#ffffff', '#7dd3fc', '#c4b5fd'];
  let W, H, parts = [], running = false;

  function resize() {
    const dpr = devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); addEventListener('resize', resize);

  function spawn(x, y, count, burst) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, speed = burst ? 0.8 + Math.random() * 1.8 : Math.random() * 0.5;
      parts.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed + (burst ? 0 : 0.2),
        life: 1, fade: 0.018 + Math.random() * 0.02, size: 2 + Math.random() * 3,
        star: Math.random() < 0.55, color: colors[(Math.random() * colors.length) | 0], rot: Math.random() * 6.28
      });
    }
    if (parts.length > 90) parts.splice(0, parts.length - 90);
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  function star(x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? s * 0.35 : s, a = i * Math.PI / 4;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life -= p.fade; p.rot += 0.04;
      ctx.globalAlpha = Math.max(p.life, 0) * 0.8;
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 4;
      if (p.star) star(p.x, p.y, p.size, p.rot);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 6.283); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, W, H); }
  }

  let last = 0;
  addEventListener('mousemove', e => {
    const now = performance.now();
    if (now - last > 45) { last = now; spawn(e.clientX, e.clientY, Math.random() < 0.4 ? 2 : 1); }
  });
  addEventListener('pointerdown', e => spawn(e.clientX, e.clientY, 9, true));
});
