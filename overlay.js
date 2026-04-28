(function () {
  // ── CONFIG ──────────────────────────────────────────────────────────────
  const GOOGLE_FORM_ACTION =
    'https://docs.google.com/forms/d/e/1FAIpQLSe0ismT24IM11E8QoYahFzXSehDAufSYh28L-IbHG1oeQVh-w/formResponse';

  const ENTRY_NAME  = 'entry.535951086';
  const ENTRY_EMAIL = 'entry.1267795388';

  const STORAGE_KEY = 'olly_gate_passed';
  // ────────────────────────────────────────────────────────────────────────

  // If visitor has already submitted, skip the overlay entirely
  if (sessionStorage.getItem(STORAGE_KEY)) return;

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

    // Submit to Google Form silently (no-cors so we can't read the response,
    // but the submission lands in your Google Sheet)
    const body = new FormData();
    body.append(ENTRY_NAME,  nameVal);
    body.append(ENTRY_EMAIL, emailVal);

    try {
      await fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
    } catch (_) {
      // Submission may silently fail if blocked — data still likely received
    }

    // Show thank you, hide form
    document.getElementById('olly-overlay-form').style.display = 'none';
    document.getElementById('olly-overlay-thankyou').style.display = 'block';

    // Mark as passed for this session, then fade out overlay after 2.5s
    sessionStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.6s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 650);
    }, 2500);
  });

  // Allow Enter key to submit
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('olly-submit').click();
  });
})();
