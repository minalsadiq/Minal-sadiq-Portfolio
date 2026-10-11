/*
 * Contact form -> Google Apps Script Web App -> private Google Sheet.
 * The request is sent as text/plain so the browser treats it as a "simple"
 * cross-origin request (Apps Script web apps cannot answer CORS preflights).
 * Success is shown only when the backend replies { ok: true }.
 */
(function () {
  const form = document.getElementById('f'), btn = document.getElementById('fbtn'), status = document.getElementById('fstat');
  const field = id => document.getElementById(id);

  // Keep these limits in sync with CONFIG.MAX in backend/Code.gs
  const MAX = { name: 80, email: 254, subject: 150, message: 2000 };
  const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
  const TIMEOUT_MS = 20000;

  let busy = false, lastSignature = '', lastSentAt = 0;

  function say(text, kind) { status.textContent = text; status.className = 'fstat' + (kind ? ' ' + kind : ''); }

  function validate(v) {
    if (!v.name) return 'Please enter your name.';
    if (v.name.length > MAX.name) return 'Name is too long.';
    if (!EMAIL_RE.test(v.email) || v.email.length > MAX.email) return 'Please enter a valid email address.';
    if (!v.subject) return 'Please add a subject.';
    if (v.subject.length > MAX.subject) return 'Subject is too long.';
    if (!v.message) return 'Please write a message.';
    if (v.message.length > MAX.message) return 'Message is too long (max ' + MAX.message + ' characters).';
    return '';
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;

    const v = {
      name: field('fn').value.trim(), email: field('fe').value.trim(),
      subject: field('fs').value.trim(), message: field('fm').value.trim(),
      website: field('fw').value               // honeypot: real visitors leave this empty
    };

    const problem = validate(v);
    if (problem) { say(problem, 'err'); return; }

    // Block an accidental re-send of the exact same message
    const signature = JSON.stringify([v.email, v.subject, v.message]);
    if (signature === lastSignature && Date.now() - lastSentAt < 60000) {
      say('That message was already sent. Thank you!', 'err'); return;
    }

    // Backend not configured yet: fall back to the visitor's email app
    if (!D.contactEndpoint) {
      say('Opening your email app…');
      location.href = 'mailto:' + D.email + '?subject=' + encodeURIComponent(v.subject) +
        '&body=' + encodeURIComponent(v.message + '\n\n' + v.name + ' (' + v.email + ')');
      return;
    }

    busy = true; btn.disabled = true; btn.classList.add('loading'); say('Sending…');
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(D.contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(v),
        signal: ctl.signal
      });
      if (!res.ok) throw new Error('http ' + res.status);
      const data = await res.json();

      if (data && data.ok === true) {
        lastSignature = signature; lastSentAt = Date.now();
        form.reset();
        say('Thank you! Your message was received' + (data.id ? ' (ref ' + data.id + ')' : '') + '. I will get back to you soon.', 'ok');
      } else {
        say((data && data.message) || 'Your message could not be saved. Please try again.', 'err');
      }
    } catch (err) {
      say(err.name === 'AbortError'
        ? 'The request timed out. Please try again.'
        : 'Network problem. Please check your connection and try again, or email me directly.', 'err');
    } finally {
      clearTimeout(timer); busy = false; btn.disabled = false; btn.classList.remove('loading');
    }
  });
})();
