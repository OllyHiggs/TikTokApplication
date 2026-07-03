/**
 * access-gate.js — Privacy gate for ollyhiggs.com
 *
 * SETUP: Replace GATE_SCRIPT_URL below with your deployed Google Apps Script URL.
 * See the Apps Script code at the bottom of this file (in the comment block).
 */
(function () {
  'use strict';

  const GATE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfXwcECV817c3mTUdCHY9KX3T1eOfB_sSMuQsh4qNS8wpbwm_R-K2A74iWbJZwQuvGew/exec';
  const GATE_SECRET     = '49474cc761db5dc1d575866103e67aae669eaf5d1222bfe5'; // must match Apps Script
  const STORAGE_KEY     = 'ohAccess';
  const SCROLL_TRIGGER  = 320;   // px scrolled before gate appears
  const EXPIRY_MS       = 30 * 24 * 60 * 60 * 1000; // 30 days

  // --- localStorage helpers ---
  const getStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (Date.now() - d.ts > EXPIRY_MS) { localStorage.removeItem(STORAGE_KEY); return null; }
      return d;
    } catch { return null; }
  };

  const setStored = (email, status) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, status, ts: Date.now() })); } catch {}
  };

  // If already approved and cache is fresh, do nothing
  const stored = getStored();
  if (stored?.status === 'approved') return;

  // --- Scroll lock / unlock ---
  let _savedScroll = 0;
  const lockScroll = () => {
    _savedScroll = window.pageYOffset;
    document.body.style.cssText += ';overflow:hidden;position:fixed;top:-' + _savedScroll + 'px;width:100%;';
  };
  const unlockScroll = () => {
    document.body.style.overflow   = '';
    document.body.style.position   = '';
    document.body.style.top        = '';
    document.body.style.width      = '';
    window.scrollTo(0, _savedScroll);
  };

  // --- CSS ---
  const CSS = `
    #oh-gate {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(10,10,15,0.96);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
      opacity: 0; pointer-events: none;
      transition: opacity 400ms cubic-bezier(0.16,1,0.3,1);
    }
    #oh-gate.is-visible { opacity: 1; pointer-events: auto; }

    .ohg-card {
      background: #12121b;
      border: 1px solid rgba(255,255,255,0.11);
      border-radius: 8px;
      padding: 2.5rem;
      max-width: 440px;
      width: 100%;
      position: relative;
    }
    .ohg-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, #fe2c55, #25f4ee);
      border-radius: 8px 8px 0 0;
    }

    .ohg-eyebrow {
      display: flex; align-items: center; gap: 8px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
      color: #9494a0; margin-bottom: 1.25rem;
    }
    .ohg-eyebrow-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: linear-gradient(135deg, #fe2c55, #25f4ee); flex-shrink: 0;
    }

    .ohg-title {
      font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
      font-weight: 400;
      font-size: clamp(1.5rem, 5vw, 2rem);
      line-height: 1.08; letter-spacing: -0.022em;
      color: #f2f2f4; margin: 0 0 0.75rem;
    }
    .ohg-subtitle {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.9375rem; color: #9494a0;
      line-height: 1.55; margin: 0 0 2rem;
    }

    .ohg-field { margin-bottom: 1rem; }
    .ohg-field label {
      display: block;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
      color: #9494a0; margin-bottom: 0.4rem;
    }
    .ohg-field input {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.11);
      border-radius: 4px; padding: 0.75rem 1rem;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.9375rem; color: #f2f2f4;
      outline: none; transition: border-color 200ms ease;
    }
    .ohg-field input::placeholder { color: #56565e; }
    .ohg-field input:focus { border-color: rgba(255,255,255,0.3); }
    .ohg-field input.is-error { border-color: #fe2c55; }

    .ohg-error {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.8125rem; color: #fe2c55;
      margin: -0.5rem 0 1rem; min-height: 1.25em;
    }

    .ohg-btn {
      width: 100%;
      background: linear-gradient(135deg, #fe2c55 0%, #d41a3f 100%);
      color: #fff; border: 0; border-radius: 4px;
      padding: 0.9rem 1.5rem; margin-top: 0.25rem;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.9375rem; font-weight: 600; letter-spacing: 0.01em;
      cursor: pointer; transition: opacity 200ms ease, transform 120ms ease;
    }
    .ohg-btn:hover:not(:disabled) { opacity: 0.88; }
    .ohg-btn:active:not(:disabled) { transform: scale(0.985); }
    .ohg-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .ohg-hint {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.8125rem; color: #56565e;
      text-align: center; margin: 1.25rem 0 0; line-height: 1.5;
    }

    .ohg-status {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.9375rem; color: #9494a0; line-height: 1.6;
    }
    .ohg-status-title {
      display: block;
      font-family: 'Fraunces', Georgia, serif;
      font-size: 1.25rem; font-weight: 400;
      letter-spacing: -0.015em;
      color: #f2f2f4; margin-bottom: 0.6rem;
    }
    .ohg-status.is-success .ohg-status-title { color: #25f4ee; }

    .ohg-spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.15);
      border-top-color: #fe2c55; border-radius: 50%;
      animation: ohg-spin 0.7s linear infinite;
      vertical-align: middle; margin-right: 8px;
    }
    @keyframes ohg-spin { to { transform: rotate(360deg); } }

    @media (max-width: 480px) {
      .ohg-card { padding: 2rem 1.25rem; }
    }
  `;

  // --- HTML ---
  const HTML = `
    <div class="ohg-card" role="document">
      <div class="ohg-eyebrow">
        <span class="ohg-eyebrow-dot" aria-hidden="true"></span>
        <span>Private document</span>
      </div>
      <h2 class="ohg-title">Access required.</h2>
      <p class="ohg-subtitle">
        This document is shared privately. Enter your details to verify your access,
        or submit a request to view.
      </p>

      <div id="ohg-form">
        <div class="ohg-field">
          <label for="ohg-name">First name</label>
          <input id="ohg-name" type="text" placeholder="Your first name" autocomplete="given-name" />
        </div>
        <div class="ohg-field">
          <label for="ohg-email">Work email</label>
          <input id="ohg-email" type="email" placeholder="you@company.com" autocomplete="email" />
        </div>
        <div class="ohg-error" id="ohg-error" aria-live="polite"></div>
        <button class="ohg-btn" id="ohg-btn">Access</button>
        <p class="ohg-hint">
          Already been granted access? Entering your approved email will unlock this page immediately.
        </p>
      </div>

      <div id="ohg-status" class="ohg-status" style="display:none" aria-live="polite"></div>
    </div>
  `;

  // --- Boot ---
  function init() {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Inject overlay
    const overlay = document.createElement('div');
    overlay.id = 'oh-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Access required');
    overlay.innerHTML = HTML;
    document.body.appendChild(overlay);

    // DOM refs
    const formEl  = document.getElementById('ohg-form');
    const nameEl  = document.getElementById('ohg-name');
    const emailEl = document.getElementById('ohg-email');
    const btnEl   = document.getElementById('ohg-btn');
    const errorEl = document.getElementById('ohg-error');
    const statusEl = document.getElementById('ohg-status');

    // Pre-fill email if they previously submitted a request
    if (stored?.email) emailEl.value = stored.email;

    // --- Gate visibility ---
    let gateOpen = false;

    const showGate = () => {
      if (gateOpen) return;
      gateOpen = true;
      lockScroll();
      overlay.classList.add('is-visible');
      setTimeout(() => (stored?.email ? nameEl.focus() : emailEl.focus()), 350);
    };

    const hideGate = () => {
      overlay.classList.remove('is-visible');
      setTimeout(unlockScroll, 420);
    };

    // Trigger on scroll
    const onScroll = () => {
      if (window.pageYOffset > SCROLL_TRIGGER) {
        showGate();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // If already pending from a previous visit, show the gate on load so they
    // can re-check (in case they've since been approved)
    if (stored?.status === 'pending') {
      setTimeout(showGate, 600);
    }

    // --- Form helpers ---
    const setError = (msg) => {
      errorEl.textContent = msg;
    };

    const setLoading = (isLoading, label) => {
      btnEl.disabled = isLoading;
      btnEl.innerHTML = isLoading
        ? `<span class="ohg-spinner" aria-hidden="true"></span>${label}`
        : 'Request Access';
    };

    const showStatus = (titleHtml, bodyText, isSuccess) => {
      formEl.style.display = 'none';
      statusEl.innerHTML = `<span class="ohg-status-title">${titleHtml}</span>${bodyText}`;
      statusEl.className = 'ohg-status' + (isSuccess ? ' is-success' : '');
      statusEl.style.display = 'block';
    };

    // --- API helpers ---
    const api = (params) =>
      fetch(GATE_SCRIPT_URL + '?' + new URLSearchParams({ ...params, secret: GATE_SECRET }).toString())
        .then(r => r.json());

    // --- Geo lookup (best-effort, silent on failure) ---
    const getGeo = () =>
      fetch('https://ipinfo.io/json')
        .then(r => r.json())
        .catch(() => ({}));

    // --- Submit ---
    const handleSubmit = () => {
      setError('');
      nameEl.classList.remove('is-error');
      emailEl.classList.remove('is-error');

      const name  = nameEl.value.trim();
      const email = emailEl.value.trim().toLowerCase();

      if (!name) {
        setError('Please enter your first name.');
        nameEl.classList.add('is-error');
        nameEl.focus();
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address.');
        emailEl.classList.add('is-error');
        emailEl.focus();
        return;
      }

      setLoading(true, 'Checking…');

      // Fire email check and geo lookup in parallel — no extra wait time
      Promise.all([
        api({ action: 'check', email }),
        getGeo()
      ]).then(([{ status }, geo]) => {
        status = (status || '').toLowerCase();

        const loc = {
          country : geo.country  || '',
          city    : geo.city     || '',
          org     : geo.org      || '',
        };

        if (status === 'approved') {
          setStored(email, 'approved');
          // Log this verified visit (fire-and-forget)
          api({ action: 'visit', email, page: location.pathname, ...loc }).catch(() => {});
          setLoading(false);
          hideGate();
          return;
        }

        if (status === 'pending') {
          setStored(email, 'pending');
          setLoading(false);
          showStatus(
            'Request under review.',
            'Your access request is being reviewed. I\'ll be in touch once I\'ve approved it.',
            false
          );
          return;
        }

        // Unknown — submit a new request
        setLoading(true, 'Submitting…');
        api({ action: 'request', email, name, page: location.pathname, ...loc })
          .then(() => {
            setStored(email, 'pending');
            setLoading(false);
            showStatus(
              'Request submitted.',
              `Thanks${name ? ', ' + name.split(' ')[0] : ''}. I'll review your request and be in touch.`,
              true
            );
          })
          .catch(() => {
            setLoading(false);
            setError('Something went wrong — please try again.');
          });
      }).catch(() => {
        setLoading(false);
        setError('Something went wrong — please try again.');
      });
    };

    btnEl.addEventListener('click', handleSubmit);
    [nameEl, emailEl].forEach(el =>
      el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); })
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/*
 * ═══════════════════════════════════════════════════════════════════
 *  GOOGLE APPS SCRIPT — deploy this as a web app, then paste the
 *  deployment URL into GATE_SCRIPT_URL at the top of this file.
 *
 *  Steps:
 *   1. Open the Google Sheet you want to use for access requests.
 *   2. Create TWO sheet tabs named exactly:
 *        Access Requests   — one row per person, with approval status
 *        Gate Visits       — one row per verified access event (DO NOT rename your
 *                            existing Sheet1 / anonymous visits tab — leave it alone)
 *   3. Access Requests headers in row 1 (columns A–H):
 *        Email | Name | Status | Requested | Country | City | Organisation | Notes
 *   4. Gate Visits headers in row 1 (columns A–F):
 *        Email | Timestamp | Page | Country | City | Organisation
 *   5. Go to Extensions → Apps Script.
 *   6. Replace any existing code with the function below.
 *   7. Click Deploy → New deployment.
 *      - Type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *      The sheet itself remains private — only the HTTP endpoint is public,
 *      and it is protected by the secret token.
 *   8. Authorise when prompted, then copy the deployment URL.
 *   9. Paste it as the GATE_SCRIPT_URL value at the top of this file.
 *
 *  To approve someone: change their Status cell to "Approved".
 *  (Capitalisation doesn't matter — the script lowercases everything.)
 * ═══════════════════════════════════════════════════════════════════
 *
 * const SECRET = 'REPLACE_WITH_YOUR_SECRET_TOKEN'; // must match access-gate.js
 *
 * function doGet(e) {
 *   try {
 *     if (e.parameter.secret !== SECRET) {
 *       return ContentService
 *         .createTextOutput(JSON.stringify({ error: 'forbidden' }))
 *         .setMimeType(ContentService.MimeType.JSON);
 *     }
 *
 *     const action = (e.parameter.action || '').toLowerCase();
 *     const email   = (e.parameter.email   || '').toLowerCase().trim();
 *     const name    = (e.parameter.name    || '').trim();
 *     const country = (e.parameter.country || '').trim();
 *     const city    = (e.parameter.city    || '').trim();
 *     const org     = (e.parameter.org     || '').trim();
 *     const page    = (e.parameter.page    || '').trim();
 *     const now     = new Date().toISOString();
 *
 *     const ss           = SpreadsheetApp.getActiveSpreadsheet();
 *     const requestSheet = ss.getSheetByName('Access Requests');
 *     const visitSheet   = ss.getSheetByName('Gate Visits');
 *     const rows         = requestSheet.getDataRange().getValues();
 *
 *     let output;
 *
 *     if (action === 'check') {
 *       let status = 'unknown';
 *       for (let i = 1; i < rows.length; i++) {
 *         if ((rows[i][0] + '').toLowerCase().trim() === email) {
 *           status = (rows[i][2] + '').toLowerCase() || 'pending';
 *           break;
 *         }
 *       }
 *       output = { status };
 *
 *     } else if (action === 'request') {
 *       for (let i = 1; i < rows.length; i++) {
 *         if ((rows[i][0] + '').toLowerCase().trim() === email) {
 *           output = { ok: false, status: (rows[i][2] + '').toLowerCase() || 'pending' };
 *           break;
 *         }
 *       }
 *       if (!output) {
 *         requestSheet.appendRow([email, name, 'Pending', now, country, city, org, '']);
 *         MailApp.sendEmail({
 *           to: 'olly.higgs93@gmail.com',
 *           subject: 'Access request: ' + (name || email),
 *           htmlBody:
 *             '<p><strong>New access request for ollyhiggs.com</strong></p>' +
 *             '<p><strong>Name:</strong> '          + name    + '</p>' +
 *             '<p><strong>Email:</strong> '         + email   + '</p>' +
 *             '<p><strong>Page:</strong> '          + page    + '</p>' +
 *             '<p><strong>Location:</strong> '      + [city, country].filter(Boolean).join(', ') + '</p>' +
 *             '<p><strong>Organisation:</strong> '  + org     + '</p>' +
 *             '<p><strong>Time:</strong> '          + now     + '</p>' +
 *             '<p>Open the Access Requests sheet to approve or deny ' +
 *             '(set the Status column to Approved or Denied).</p>'
 *         });
 *         output = { ok: true };
 *       }
 *
 *     } else if (action === 'visit') {
 *       // Log a verified access by an approved user
 *       visitSheet.appendRow([email, now, page, country, city, org]);
 *       output = { ok: true };
 *
 *     } else {
 *       output = { error: 'unknown action' };
 *     }
 *
 *     return ContentService
 *       .createTextOutput(JSON.stringify(output))
 *       .setMimeType(ContentService.MimeType.JSON);
 *
 *   } catch (err) {
 *     return ContentService
 *       .createTextOutput(JSON.stringify({ error: err.toString() }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */
