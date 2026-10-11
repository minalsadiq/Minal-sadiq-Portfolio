/* Renders content from data.js and wires up navigation. */
const $ = id => document.getElementById(id);
const chips = list => list.map(s => `<span>${s}</span>`).join('');

/* Text and link placeholders */
const LINKS = {
  github: D.github, linkedin: D.linkedin, resume: D.resume,
  mail: 'mailto:' + D.email, wa: 'https://wa.me/' + D.wa
};
document.querySelectorAll('[data-k]').forEach(el => {
  const key = el.dataset.k, parts = D.name.split(' ');
  el.textContent = key === 'first' ? parts[0] : key === 'last' ? parts.slice(1).join(' ') : D[key];
});
document.querySelectorAll('[data-l]').forEach(el => { el.href = LINKS[el.dataset.l]; });

/* Intro splash: auto-hides after a few seconds, or click to skip.
   The role typing starts only after it is gone, so the first word the visitor sees is always roles[0]. */
const intro = $('intro');
let introDone = false;
function hideIntro() {
  if (introDone) return;
  introDone = true;
  intro.classList.add('out');
  setTimeout(type, 500);
}
setTimeout(hideIntro, 3200);
intro.onclick = hideIntro;

/* Typing effect under the name */
let roleIdx = 0, charIdx = 0, deleting = false;
function type() {
  const word = D.roles[roleIdx];
  charIdx += deleting ? -1 : 1;
  $('ty').textContent = word.slice(0, charIdx);
  let delay = deleting ? 40 : 90;
  if (!deleting && charIdx === word.length) { deleting = true; delay = 1400; }
  else if (deleting && charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % D.roles.length; delay = 300; }
  setTimeout(type, delay);
}

/* About, skills, resume */
$('st').innerHTML = D.stats.map(s => `<div><b>${s[0]}</b>${s[1]}</div>`).join('');
D.skills.forEach((row, i) => { $('m' + i).innerHTML = chips(row) + chips(row); });
$('tl').innerHTML = D.experience.map(e =>
  `<article class="rv" data-stagger><small>${e.d}</small><h3>${e.t}</h3><em>${e.o}</em><p>${e.x}</p></article>`).join('');
$('ce').innerHTML = '<h3>Certifications</h3><div class="tg">' + chips(D.certs) + '</div>';
$('mo').innerHTML = chips(D.more);

/* Projects with category filter */
const categories = ['All', ...new Set(D.projects.map(p => p.cat))];
let selected = 'All';

function drawProjects() {
  $('fl').innerHTML = categories.map(c => `<button class="${c === selected ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
  $('pg').innerHTML = D.projects
    .filter(p => selected === 'All' || p.cat === selected)
    .map((p, i) => `
      <article class="pc rv" data-stagger>
        <div class="pt">
          <img src="${p.img}" alt="${p.name} preview" loading="lazy" width="900" height="600">
          <b>${p.cat}</b><span class="no">0${i + 1}</span>
        </div>
        <div class="in">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div class="tg">${chips(p.tags)}</div>
          <div class="lk">
            <a href="${p.code}" target="_blank" rel="noopener">Code</a>
            <a href="${p.live}" target="_blank" rel="noopener">${p.liveLabel} <i>→</i></a>
          </div>
        </div>
      </article>`).join('');
  reveal($('pg'));
}
$('fl').onclick = e => { if (e.target.dataset.c) { selected = e.target.dataset.c; drawProjects(); } };
drawProjects();

/* Sidebar menu (mobile), scroll progress bar, active link */
$('mb').onclick = () => $('sb').classList.toggle('open');
$('sb').onclick = e => { if (e.target.tagName === 'A') $('sb').classList.remove('open'); };

const navLinks = document.querySelectorAll('aside nav a'), sections = document.querySelectorAll('main section');
addEventListener('scroll', () => {
  const h = document.documentElement;
  $('bar').style.width = (scrollY / (h.scrollHeight - innerHeight)) * 100 + '%';
  $('toTop').classList.toggle('show', scrollY > 400);
  let current = 'home';
  sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight / 2) current = s.id; });
  navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + current));
}, { passive: true });

/* Back to top */
$('toTop').onclick = () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
