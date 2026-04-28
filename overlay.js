(function () {
  // ── CONFIG ────────────────────────────────────────────────────────────────
  // Google Form endpoint (Sheet 1 — access requests)
  const GOOGLE_FORM_ACTION =
    'https://docs.google.com/forms/d/e/1FAIpQLSe0ismT24IM11E8QoYahFzXSehDAufSYh28L-IbHG1oeQVh-w/formResponse';

  const ENTRY_NAME  = 'entry.535951086';
  const ENTRY_EMAIL = 'entry.1267795388';

  // Google Apps Script endpoint (Sheet 2 — visit log)
  // Replace SCRIPT_ID with the deployed Web App ID after following setup instructions
  const VISIT_LOG_URL = 'https://script.google.com/macros/s/AKfycby6VMGNMUGCrSTrSmoFNmLTVzqaoILfw60Ami7oLEYwhETiuBq9RubKVXpgXHt6EXug/exec';

  // Access control
  const STORAGE_KEY = 'olly_gate_passed';
  const ACCESS_PASS = 'OllyHiggsTikTok';
  // ─────────────────────────────────────────────────────────────────────────

  const params      = new URLSearchParams(window.location.search);
  const accessParam = params.get('access');
  const refParam    = params.get('ref') || 'unknown';

  // ── APPROVED ACCESS LINK ──────────────────────────────────────────────────
  // Fires only when the site owner has sent a personalised access link.
  // Logs the visit to Sheet 2, then grants permanent access on this device.
  if (accessParam === ACCESS_PASS) {
    fetch(`${VISIT_LOG_URL}?ref=${encodeURIComponent(refParam)}&t=${encodeURIComponent(new Date().toISOString())}`)
      .catch(() => {});
    localStorage.setItem(STORAGE_KEY, '1');
  }

  // ── RETURNING APPROVED VISITOR ────────────────────────────────────────────
  // localStorage already set — skip overlay entirely
  if (localStorage.getItem(STORAGE_KEY)) return;

  // ── BUILD OVERLAY ─────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'olly-overlay';
  overlay.innerHTML = `
    <div id="olly-overlay-card">
      <h2>Welcome</h2>
      <p>Please enter your details to request access.</p>
      <div id="olly-overlay-form">
        <input type="text"  id="olly-name"  placeholder="Your name"          autocomplete="name" />
        <input type="email" id="olly-email" placeholder="Your email address" autocomplete="email" />
        <button id="olly-submit">Continue</button>
      </div>
      <div id="olly-overlay-thankyou">
        Thank you for submitting your details,<br>I will be in touch soon.
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ── FORM SUBMIT HANDLER ───────────────────────────────────────────────────
  document.getElementById('olly-submit').addEventListener('click', async function () {
    const nameVal  = document.getElementById('olly-name').value.trim();
    const emailVal = document.getElementById('olly-email').value.trim();

    if (!nameVal || !emailVal) {
      alert('Please enter both your name and email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      alert('Please enter a valid email address.');
      return;
    }

    const btn = document.getElementById('olly-submit');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    // Send details to Google Form (Sheet 1)
    const body = new FormData();
    body.append(ENTRY_NAME,  nameVal);
    body.append(ENTRY_EMAIL, emailVal);

    try {
      await fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
    } catch (_) {}

    // Show thank-you — overlay stays up, content stays hidden.
    // Access is only granted when the site owner sends an approved link.
    document.getElementById('olly-overlay-form').style.display = 'none';
    document.getElementById('olly-overlay-thankyou').style.display = 'block';
  });

  // Allow Enter key to submit
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('olly-submit').click();
  });
})();
