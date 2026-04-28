(function () {
  // ── CONFIG ──────────────────────────────────────────────────────────────
  const GOOGLE_FORM_ACTION =
    'https://docs.google.com/forms/d/e/1FAIpQLSe0ismT24IM11E8QoYahFzXSehDAufSYh28L-IbHG1oeQVh-w/formResponse';

  const ENTRY_NAME  = 'entry.535951086';
  const ENTRY_EMAIL = 'entry.1267795388';

  const STORAGE_KEY = 'olly_gate_passed';
  // ────────────────────────────────────────────────────────────────────────

  // ── BUILD OVERLAY DOM ───────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'olly-overlay';
  overlay.innerHTML = `
    <div id="olly-overlay-card">
      <h2>Welcome</h2>
      <p>Please enter your details to view this page.</p>
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

  // If already submitted this session, show thank-you state immediately
  // (overlay stays up — content remains blurred)
  if (sessionStorage.getItem(STORAGE_KEY)) {
    document.getElementById('olly-overlay-form').style.display = 'none';
    document.getElementById('olly-overlay-thankyou').style.display = 'block';
    return;
  }

  // ── SUBMIT HANDLER ──────────────────────────────────────────────────────
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

    // Submit to Google Form silently
    const body = new FormData();
    body.append(ENTRY_NAME,  nameVal);
    body.append(ENTRY_EMAIL, emailVal);

    try {
      await fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
    } catch (_) {}

    // Show thank-you, hide form — overlay stays permanently, content stays blurred
    document.getElementById('olly-overlay-form').style.display = 'none';
    document.getElementById('olly-overlay-thankyou').style.display = 'block';
    sessionStorage.setItem(STORAGE_KEY, '1');
  });

  // Allow Enter key to submit
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('olly-submit').click();
  });
})();
