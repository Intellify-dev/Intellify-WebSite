/* ============================================================
   INTELLIFY — Admin Dashboard
   Login + CRUD over the local data store.
   ============================================================ */

(function () {
  'use strict';

  const ADMIN_KEY = 'intellify.admin.session';
  const PASSWORD_KEY = 'intellify.admin.password';
  const DEFAULT_PASSWORD = 'Admin@123';

  // Read a form field by name. Uses querySelector instead of `form.fieldName`
  // because some names (notably "name") collide with native HTMLFormElement
  // properties and would otherwise return the wrong value.
  function fieldVal(form, n) {
    const el = form.querySelector(`[name="${n}"]`);
    return el ? el.value : '';
  }

  // Current company name from the store (falls back to INTELLIFY).
  function brandName() {
    try { return escapeHtml((AlienStore.get().brand || {}).name || 'INTELLIFY'); }
    catch (e) { return 'INTELLIFY'; }
  }
  // Nav/login icon mark from the store (falls back to the bundled star icon).
  function brandMark() {
    try { return escapeHtml((AlienStore.get().brand || {}).mark || 'assets/img/logo-mark.png'); }
    catch (e) { return 'assets/img/logo-mark.png'; }
  }

  // --------- AUTH ---------
  // Firebase is the real, secure login when it's configured. Until then we fall
  // back to the local password so the admin keeps working during setup.
  function fbReady() {
    try {
      return !!(window.FIREBASE_ENABLED && window.firebase
        && window.firebase.apps && window.firebase.apps.length && window.firebase.auth);
    } catch (e) { return false; }
  }
  function getStoredPassword() {
    return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
  }
  function setStoredPassword(p) {
    localStorage.setItem(PASSWORD_KEY, p);
  }
  function isLoggedIn() {
    return sessionStorage.getItem(ADMIN_KEY) === 'ok';
  }
  function login(pw) {
    if (pw === getStoredPassword()) {
      sessionStorage.setItem(ADMIN_KEY, 'ok');
      return true;
    }
    return false;
  }
  function logout() {
    if (fbReady()) { firebase.auth().signOut(); return; }  // onAuthStateChanged shows login
    sessionStorage.removeItem(ADMIN_KEY);
    location.reload();
  }
  window.AlienAdminLogout = logout;

  // --------- LOGIN SCREEN ---------
  function renderLogin() {
    document.body.innerHTML = `
      <canvas id="particles"></canvas>
      <div class="login-shell">
        <div class="login-card reveal visible">
          <a href="index.html" class="brand brand-wordmark">
            <img src="${brandMark()}" alt="" class="brand-logo"/>
            <span class="brand-text">${brandName()}</span>
          </a>
          <h2 class="gradient-text">Admin Access</h2>
          <p>Authenticate to enter the control room.</p>
          <form id="login-form">
            ${fbReady() ? `
            <div class="field" style="text-align:left">
              <label for="email">Email</label>
              <input type="email" id="email" autocomplete="username" autofocus required/>
            </div>` : ''}
            <div class="field" style="text-align:left">
              <label for="pw">Password</label>
              <input type="password" id="pw" autocomplete="current-password" ${fbReady() ? '' : 'autofocus'} required/>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;">
              Engage
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>
          <div class="login-hint">
            ${fbReady()
              ? `Sign in with your Firebase admin account.<br/><small style="opacity:0.75">Manage it in the Firebase console under Authentication.</small>`
              : `Restricted area — authorized access only.`}
          </div>
        </div>
      </div>`;
    // re-init particles
    if (window.AlienTech) {
      // Re-trigger particles only
      const evt = new Event('resize');
      window.dispatchEvent(evt);
    }
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const pw = document.getElementById('pw').value;
      if (fbReady()) {
        const email = document.getElementById('email').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        firebase.auth().signInWithEmailAndPassword(email, pw)
          .then(() => { /* onAuthStateChanged renders the dashboard */ })
          .catch((err) => {
            AlienToast('Login failed: ' + (err && err.message ? err.message : 'check email/password'), 'error');
            document.getElementById('pw').value = '';
            if (btn) btn.disabled = false;
          });
      } else if (login(pw)) {
        renderDashboard();
      } else {
        AlienToast('Wrong password. Try again.', 'error');
        document.getElementById('pw').value = '';
      }
    });
    // bootstrap particles after DOM change
    bootstrapBackground();
  }

  function bootstrapBackground() {
    // re-run particle init from main.js by dispatching an event,
    // but since main.js already ran, manually call the canvas setup again.
    const canvas = document.getElementById('particles');
    if (!canvas || canvas.dataset.ready === '1') return;
    canvas.dataset.ready = '1';
    // simplified inline particle anim (smaller scope here)
    const ctx = canvas.getContext('2d');
    let w, h, parts = [];
    const COUNT = window.innerWidth < 768 ? 36 : 80;
    const dpr = window.devicePixelRatio;
    function resize() {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4 * dpr,
        vy: (Math.random() - 0.5) * 0.4 * dpr,
        r: (Math.random() * 1.4 + 0.4) * dpr,
        c: Math.random() > 0.6 ? '#a855f7' : '#00f0ff'
      });
    }
    function tick() {
      ctx.clearRect(0,0,w,h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.c;
        ctx.fill();
        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const maxD = 120 * dpr;
          if (dist < maxD) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,240,255,${0.18 * (1 - dist / maxD)})`;
            ctx.lineWidth = 0.6 * dpr;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  // --------- DASHBOARD ---------
  const SECTIONS = ['overview', 'branding', 'hero', 'services', 'projects', 'why', 'cta', 'messages', 'contact', 'settings'];
  let currentSection = 'overview';

  // --------- LIVE INBOX ---------
  // The contact inbox is streamed from Firestore in real time (see AlienMessages
  // in main.js). `liveMessages` holds the latest snapshot; null until the first
  // one arrives, so we fall back to the local store meanwhile.
  let liveMessages = null;
  let _msgUnsub = null;
  function getMessages() {
    if (Array.isArray(liveMessages)) return liveMessages;
    try { return AlienStore.get().messages || []; } catch (e) { return []; }
  }
  function subscribeInbox() {
    if (_msgUnsub || !window.AlienMessages) return;
    _msgUnsub = AlienMessages.subscribe((list) => {
      liveMessages = list;
      // Refresh inbox-dependent views — but never while a modal is open.
      const back = document.getElementById('modal-backdrop');
      if (back && back.classList.contains('show')) return;
      if (document.getElementById('admin-main') &&
          (currentSection === 'overview' || currentSection === 'messages')) {
        renderSection();
      }
    });
  }

  function renderDashboard() {
    document.body.innerHTML = `
      <canvas id="particles"></canvas>
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <a href="index.html" class="brand brand-wordmark">
            <img src="${brandMark()}" alt="" class="brand-logo"/>
            <span class="brand-text">${brandName()}</span>
          </a>
          <ul class="admin-menu" id="admin-menu">
            ${menuButton('overview', 'Overview', iconOverview)}
            ${menuButton('branding', 'Brand & Logo', iconBrand)}
            ${menuButton('hero', 'Hero', iconHero)}
            ${menuButton('services', 'Services', iconService)}
            ${menuButton('projects', 'Projects', iconProject)}
            ${menuButton('why', 'Why Us', iconWhy)}
            ${menuButton('cta', 'Call to Action', iconCta)}
            ${menuButton('messages', 'Messages', iconMsg)}
            ${menuButton('contact', 'Contact Info', iconContact)}
            ${menuButton('settings', 'Settings', iconSettings)}
          </ul>
          <div style="margin-top: auto; padding-top: 28px;">
            <button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="AlienAdminLogout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </aside>
        <main class="admin-main" id="admin-main">
          <!-- section renders here -->
        </main>
      </div>
      <div class="modal-backdrop" id="modal-backdrop"></div>`;

    document.querySelectorAll('#admin-menu button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSection = btn.dataset.section;
        renderSection();
      });
    });

    subscribeInbox();
    renderSection();
    bootstrapBackground();
  }

  const iconOverview = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  const iconService = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  const iconProject = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
  const iconMsg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const iconContact = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.94.37 1.86.7 2.73a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.35-1.27a2 2 0 0 1 2.11-.45c.87.33 1.79.57 2.73.7A2 2 0 0 1 22 16.92z"/></svg>';
  const iconSettings = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v6M12 17v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M1 12h6M17 12h6"/></svg>';
  const iconBrand = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
  const iconHero = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
  const iconWhy = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>';
  const iconCta = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';

  function menuButton(key, label, icon) {
    return `<li><button data-section="${key}" class="${currentSection===key?'active':''}">${icon}<span>${label}</span></button></li>`;
  }

  function renderSection() {
    document.querySelectorAll('#admin-menu button').forEach(b => {
      b.classList.toggle('active', b.dataset.section === currentSection);
    });
    const main = document.getElementById('admin-main');
    switch (currentSection) {
      case 'overview': main.innerHTML = viewOverview(); bindOverview(); break;
      case 'branding': main.innerHTML = viewBranding(); bindBranding(); break;
      case 'hero':     main.innerHTML = viewHero();     bindHero();     break;
      case 'services': main.innerHTML = viewServices(); bindServices(); break;
      case 'projects': main.innerHTML = viewProjects(); bindProjects(); break;
      case 'why':      main.innerHTML = viewWhy();      bindWhy();      break;
      case 'cta':      main.innerHTML = viewCta();      bindCta();      break;
      case 'messages': main.innerHTML = viewMessages(); bindMessages(); break;
      case 'contact':  main.innerHTML = viewContact();  bindContact();  break;
      case 'settings': main.innerHTML = viewSettings(); bindSettings(); break;
    }
  }

  // --------- OVERVIEW ---------
  function viewOverview() {
    const d = AlienStore.get();
    const messages = getMessages();
    const unread = messages.filter(m => !m.read).length;
    return `
      <div class="admin-topbar">
        <h2>Mission Control</h2>
        <span class="section-eyebrow">// Live</span>
      </div>
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Services</div>
          <div class="kpi-num">${d.services.length}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Projects</div>
          <div class="kpi-num">${d.projects.length}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Total Messages</div>
          <div class="kpi-num">${messages.length}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Unread</div>
          <div class="kpi-num">${unread}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Recent Messages</h3>
          <button class="btn btn-ghost" data-go="messages">View all</button>
        </div>
        ${messages.slice(0,5).length === 0
          ? '<p style="color:var(--text-faint)">No messages yet. Submissions from the contact form will appear here.</p>'
          : `<table class="admin-table">
              <thead><tr><th>From</th><th>WhatsApp</th><th>Subject</th><th>Received</th></tr></thead>
              <tbody>
              ${messages.slice(0,5).map(m => `
                <tr>
                  <td><strong>${escapeHtml(m.name)}</strong><br/><span style="color:var(--text-faint);font-size:.85rem">${escapeHtml(m.email)}</span></td>
                  <td>${m.whatsapp ? `<a href="https://wa.me/${escapeHtml(m.whatsapp.replace(/\D/g,''))}" target="_blank" rel="noopener">${escapeHtml(m.whatsapp)}</a>` : '<span style="color:var(--text-faint)">—</span>'}</td>
                  <td>${escapeHtml(m.subject || '(no subject)')}</td>
                  <td style="color:var(--text-dim)">${formatDate(m.receivedAt)}</td>
                </tr>
              `).join('')}
              </tbody>
            </table>`
        }
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Quick Actions</h3></div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn btn-primary" data-go="branding">Brand &amp; Logo</button>
          <button class="btn btn-primary" data-go="hero">Edit Hero</button>
          <button class="btn btn-primary" data-go="projects">Manage Projects</button>
          <button class="btn btn-ghost" data-go="services">Services</button>
          <button class="btn btn-ghost" data-go="why">Why Us</button>
          <button class="btn btn-ghost" data-go="cta">Call to Action</button>
          <button class="btn btn-ghost" data-go="contact">Contact Info</button>
          <button class="btn btn-ghost" data-go="settings">Settings</button>
        </div>
      </div>`;
  }
  function bindOverview() {
    document.querySelectorAll('[data-go]').forEach(b => {
      b.addEventListener('click', () => { currentSection = b.dataset.go; renderSection(); });
    });
  }

  // --------- BRANDING (name / slogan / logo) ---------
  function viewBranding() {
    const b = AlienStore.get().brand || {};
    return `
      <div class="admin-topbar"><h2>Brand &amp; Logo</h2></div>
      <div class="panel">
        <p style="margin-bottom:18px;color:var(--text-dim)">The company name shows in the navigation bar, footer and browser tab. The slogan appears under the logo and in the footer.</p>
        <form id="brand-form">
          <div class="form-row">
            <div class="field">
              <label>Company Name</label>
              <input type="text" name="name" required value="${escapeHtml(b.name || '')}" placeholder="INTELLIFY"/>
            </div>
            <div class="field">
              <label>Slogan</label>
              <input type="text" name="slogan" value="${escapeHtml(b.slogan || '')}" placeholder="WE INTELLIFY YOUR BUSINESS"/>
            </div>
          </div>

          <div class="field">
            <label>Hero logo <small style="color:var(--text-faint)">— big image on the home page (use a transparent PNG so it blends)</small></label>
            <input type="text" name="logo" value="${escapeHtml(b.logo || '')}" placeholder="assets/img/logo-full.png"/>
            <div class="brand-preview" data-preview-for="logo" style="margin-top:8px">
              <img src="${escapeHtml(b.logo || '')}" alt="hero logo preview" style="max-width:100%;max-height:170px;display:${b.logo ? 'block' : 'none'}"/>
              <span class="brand-preview-empty" style="display:${b.logo ? 'none' : 'block'};color:var(--text-faint)">No hero logo set</span>
            </div>
          </div>

          <div class="field">
            <label>Nav icon <small style="color:var(--text-faint)">— small mark shown beside the name</small></label>
            <input type="text" name="mark" value="${escapeHtml(b.mark || '')}" placeholder="assets/img/logo-mark.png"/>
            <div class="brand-preview" data-preview-for="mark" style="margin-top:8px">
              <img src="${escapeHtml(b.mark || '')}" alt="nav icon preview" style="max-width:80px;max-height:80px;display:${b.mark ? 'block' : 'none'}"/>
              <span class="brand-preview-empty" style="display:${b.mark ? 'none' : 'block'};color:var(--text-faint)">No nav icon set</span>
            </div>
            <small style="color:var(--text-faint)">Point each at a file inside <code>assets/img/</code> (already uploaded) or a full https:// URL.</small>
          </div>

          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>`;
  }
  function bindBranding() {
    const form = document.getElementById('brand-form');
    // live preview for both image fields
    ['logo', 'mark'].forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      const wrap = form.querySelector(`[data-preview-for="${key}"]`);
      const img = wrap.querySelector('img');
      const empty = wrap.querySelector('.brand-preview-empty');
      input.addEventListener('input', () => {
        const v = input.value.trim();
        if (v) { img.src = v; img.style.display = 'block'; empty.style.display = 'none'; }
        else { img.style.display = 'none'; empty.style.display = 'block'; }
      });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = AlienStore.get();
      d.brand = {
        name: fieldVal(form, 'name').trim() || 'INTELLIFY',
        slogan: fieldVal(form, 'slogan').trim(),
        logo: fieldVal(form, 'logo').trim(),
        mark: fieldVal(form, 'mark').trim()
      };
      AlienStore.set(d);
      AlienToast('Brand updated', 'success');
      renderSection(); // refresh sidebar name/icon on next dashboard paint
    });
  }

  // --------- HERO ---------
  function statRow(s) {
    s = s || { num: '', suffix: '', label: '' };
    return `
      <div data-stat-row style="display:grid;grid-template-columns:90px 70px 1fr 38px;gap:8px;align-items:center;margin-bottom:8px">
        <input class="stat-num" value="${escapeHtml(String(s.num || ''))}" placeholder="120"/>
        <input class="stat-suffix" value="${escapeHtml(s.suffix || '')}" placeholder="+"/>
        <input class="stat-label" value="${escapeHtml(s.label || '')}" placeholder="Projects Shipped"/>
        <button type="button" class="icon-btn delete" data-remove-row title="Remove">&times;</button>
      </div>`;
  }
  function viewHero() {
    const h = AlienStore.get().hero || {};
    const stats = Array.isArray(h.stats) ? h.stats : [];
    return `
      <div class="admin-topbar"><h2>Hero Section</h2></div>
      <div class="panel">
        <p style="margin-bottom:18px;color:var(--text-dim)">The top section of your home page. The headline shows in two parts — plain text plus a highlighted (gradient) phrase.</p>
        <form id="hero-form">
          <div class="field">
            <label>Eyebrow (small label above headline)</label>
            <input type="text" name="eyebrow" value="${escapeHtml(h.eyebrow || '')}" placeholder="// System Online"/>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Headline (plain part)</label>
              <input type="text" name="headline" value="${escapeHtml(h.headline || '')}" placeholder="We"/>
            </div>
            <div class="field">
              <label>Headline (highlighted part)</label>
              <input type="text" name="accent" value="${escapeHtml(h.accent || '')}" placeholder="intellify your business."/>
            </div>
          </div>
          <div class="field">
            <label>Lead paragraph</label>
            <textarea name="lead">${escapeHtml(h.lead || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Primary button label</label>
              <input type="text" name="primaryCtaLabel" value="${escapeHtml(h.primaryCtaLabel || '')}" placeholder="Explore Services"/>
            </div>
            <div class="field">
              <label>Secondary button label</label>
              <input type="text" name="secondaryCtaLabel" value="${escapeHtml(h.secondaryCtaLabel || '')}" placeholder="Start a Project"/>
            </div>
          </div>
          <div class="field">
            <label>Stat counters <span style="color:var(--text-faint);font-weight:400">(number · suffix · label)</span></label>
            <div id="stats-list">
              ${stats.map(statRow).join('')}
            </div>
            <button type="button" class="btn btn-ghost" id="add-stat" style="margin-top:6px">+ Add stat</button>
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>`;
  }
  function bindHero() {
    const form = document.getElementById('hero-form');
    const list = document.getElementById('stats-list');
    document.getElementById('add-stat').addEventListener('click', () => {
      list.insertAdjacentHTML('beforeend', statRow());
      bindRemoveRows(list);
    });
    bindRemoveRows(list);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = AlienStore.get();
      const stats = [...list.querySelectorAll('[data-stat-row]')].map(r => ({
        num: r.querySelector('.stat-num').value.trim(),
        suffix: r.querySelector('.stat-suffix').value.trim(),
        label: r.querySelector('.stat-label').value.trim()
      })).filter(s => s.num !== '' || s.label !== '');
      d.hero = {
        eyebrow: fieldVal(form, 'eyebrow').trim(),
        headline: fieldVal(form, 'headline').trim(),
        accent: fieldVal(form, 'accent').trim(),
        lead: fieldVal(form, 'lead').trim(),
        primaryCtaLabel: fieldVal(form, 'primaryCtaLabel').trim(),
        secondaryCtaLabel: fieldVal(form, 'secondaryCtaLabel').trim(),
        stats
      };
      AlienStore.set(d);
      AlienToast('Hero updated', 'success');
    });
  }

  // --------- WHY US ---------
  function whyRow(it) {
    it = it || { icon: 'bolt', title: '', desc: '' };
    const icons = Object.keys(AlienIcons);
    return `
      <div data-why-row class="panel" style="padding:14px;margin-bottom:12px">
        <div class="form-row">
          <div class="field" style="max-width:160px">
            <label>Icon</label>
            <select class="why-icon">
              ${icons.map(k => `<option value="${k}" ${k === it.icon ? 'selected' : ''}>${k}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Title</label>
            <input class="why-title" value="${escapeHtml(it.title || '')}" placeholder="Lightspeed Delivery"/>
          </div>
        </div>
        <div class="field">
          <label>Description</label>
          <textarea class="why-desc">${escapeHtml(it.desc || '')}</textarea>
        </div>
        <button type="button" class="btn btn-ghost" data-remove-row>Remove card</button>
      </div>`;
  }
  function viewWhy() {
    const w = AlienStore.get().why || {};
    const items = Array.isArray(w.items) ? w.items : [];
    return `
      <div class="admin-topbar"><h2>Why Us Section</h2></div>
      <div class="panel">
        <form id="why-form">
          <div class="form-row">
            <div class="field">
              <label>Eyebrow</label>
              <input type="text" name="eyebrow" value="${escapeHtml(w.eyebrow || '')}" placeholder="// Why INTELLIFY"/>
            </div>
            <div class="field">
              <label>Heading <small style="color:var(--text-faint)">(HTML &lt;br/&gt; allowed)</small></label>
              <input type="text" name="heading" value="${escapeHtml(w.heading || '')}" placeholder="Built like spacecraft."/>
            </div>
          </div>
          <label style="display:block;margin:8px 0">Feature cards</label>
          <div id="why-list">
            ${items.map(whyRow).join('')}
          </div>
          <button type="button" class="btn btn-ghost" id="add-why" style="margin-bottom:14px">+ Add card</button>
          <div><button type="submit" class="btn btn-primary">Save Changes</button></div>
        </form>
      </div>`;
  }
  function bindWhy() {
    const form = document.getElementById('why-form');
    const list = document.getElementById('why-list');
    document.getElementById('add-why').addEventListener('click', () => {
      list.insertAdjacentHTML('beforeend', whyRow());
      bindRemoveRows(list);
    });
    bindRemoveRows(list);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = AlienStore.get();
      const items = [...list.querySelectorAll('[data-why-row]')].map(r => ({
        icon: r.querySelector('.why-icon').value,
        title: r.querySelector('.why-title').value.trim(),
        desc: r.querySelector('.why-desc').value.trim()
      })).filter(it => it.title !== '' || it.desc !== '');
      d.why = {
        eyebrow: fieldVal(form, 'eyebrow').trim(),
        heading: fieldVal(form, 'heading').trim(),
        items
      };
      AlienStore.set(d);
      AlienToast('Why Us section updated', 'success');
    });
  }

  // --------- CALL TO ACTION ---------
  function viewCta() {
    const c = AlienStore.get().cta || {};
    return `
      <div class="admin-topbar"><h2>Call to Action</h2></div>
      <div class="panel">
        <p style="margin-bottom:18px;color:var(--text-dim)">The highlighted banner near the bottom of the home page.</p>
        <form id="cta-form">
          <div class="form-row">
            <div class="field">
              <label>Eyebrow</label>
              <input type="text" name="eyebrow" value="${escapeHtml(c.eyebrow || '')}" placeholder="// Initiate Contact"/>
            </div>
            <div class="field">
              <label>Button label</label>
              <input type="text" name="buttonLabel" value="${escapeHtml(c.buttonLabel || '')}" placeholder="Start the Mission"/>
            </div>
          </div>
          <div class="field">
            <label>Heading</label>
            <input type="text" name="heading" value="${escapeHtml(c.heading || '')}" placeholder="Have a project worth building?"/>
          </div>
          <div class="field">
            <label>Text</label>
            <textarea name="text">${escapeHtml(c.text || '')}</textarea>
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>`;
  }
  function bindCta() {
    const form = document.getElementById('cta-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = AlienStore.get();
      d.cta = {
        eyebrow: fieldVal(form, 'eyebrow').trim(),
        heading: fieldVal(form, 'heading').trim(),
        text: fieldVal(form, 'text').trim(),
        buttonLabel: fieldVal(form, 'buttonLabel').trim()
      };
      AlienStore.set(d);
      AlienToast('Call to action updated', 'success');
    });
  }

  // Shared: wire up every "remove row" button inside a repeater container.
  function bindRemoveRows(container) {
    container.querySelectorAll('[data-remove-row]').forEach(btn => {
      btn.onclick = () => { const row = btn.closest('[data-stat-row],[data-why-row]'); if (row) row.remove(); };
    });
  }

  // Editable section header (eyebrow / heading / text) for Services & Projects.
  function sectionHeadPanel(key, label) {
    const s = AlienStore.get().sections || {};
    return `
      <div class="panel">
        <h3 style="font-family:var(--font-display);margin-bottom:14px">${label} section header</h3>
        <form data-head-form="${key}">
          <div class="form-row">
            <div class="field">
              <label>Eyebrow</label>
              <input type="text" name="eyebrow" value="${escapeHtml(s[key + 'Eyebrow'] || '')}"/>
            </div>
            <div class="field">
              <label>Heading <small style="color:var(--text-faint)">(HTML allowed)</small></label>
              <input type="text" name="heading" value="${escapeHtml(s[key + 'Heading'] || '')}"/>
            </div>
          </div>
          <div class="field">
            <label>Intro text</label>
            <textarea name="text">${escapeHtml(s[key + 'Text'] || '')}</textarea>
          </div>
          <button type="submit" class="btn btn-ghost">Save header</button>
        </form>
      </div>`;
  }
  function bindSectionHeadForm(key) {
    const form = document.querySelector(`[data-head-form="${key}"]`);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = AlienStore.get();
      d.sections = d.sections || {};
      d.sections[key + 'Eyebrow'] = fieldVal(form, 'eyebrow').trim();
      d.sections[key + 'Heading'] = fieldVal(form, 'heading').trim();
      d.sections[key + 'Text'] = fieldVal(form, 'text').trim();
      AlienStore.set(d);
      AlienToast(label(key) + ' header updated', 'success');
    });
    function label(k) { return k.charAt(0).toUpperCase() + k.slice(1); }
  }

  // --------- SERVICES ---------
  function viewServices() {
    const services = AlienStore.get().services;
    return `
      <div class="admin-topbar">
        <h2>Services</h2>
        <button class="btn btn-primary" id="add-service">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Service
        </button>
      </div>
      ${sectionHeadPanel('services', 'Services')}
      <div class="panel">
        ${services.length === 0
          ? '<p style="color:var(--text-faint);text-align:center;padding:30px;">No services yet — create your first one.</p>'
          : `<table class="admin-table">
              <thead><tr><th>Icon</th><th>Title</th><th>Tag</th><th>Description</th><th></th></tr></thead>
              <tbody>
              ${services.map(s => `
                <tr>
                  <td><div class="card-icon" style="width:38px;height:38px;margin:0;font-size:1rem;">${AlienIcons[s.icon] || AlienIcons.web}</div></td>
                  <td><strong>${escapeHtml(s.title)}</strong></td>
                  <td><span class="tag">${escapeHtml(s.tag)}</span></td>
                  <td style="color:var(--text-dim);max-width:380px;">${escapeHtml(s.desc)}</td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" data-edit="${s.id}" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button class="icon-btn delete" data-delete="${s.id}" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              </tbody>
            </table>`
        }
      </div>`;
  }
  function bindServices() {
    bindSectionHeadForm('services');
    document.getElementById('add-service').addEventListener('click', () => openServiceModal());
    document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openServiceModal(b.dataset.edit)));
    document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => {
      if (!confirm('Delete this service?')) return;
      const d = AlienStore.get();
      d.services = d.services.filter(s => s.id !== b.dataset.delete);
      AlienStore.set(d);
      AlienToast('Service deleted', 'success');
      renderSection();
    }));
  }
  function openServiceModal(id) {
    const d = AlienStore.get();
    const svc = id ? d.services.find(s => s.id === id) : { id: 's' + Date.now(), icon: 'web', title: '', tag: '', desc: '' };
    const isNew = !id;
    showModal(`
      <div class="modal-head">
        <h3>${isNew ? 'New Service' : 'Edit Service'}</h3>
        <button class="close-btn" data-close>&times;</button>
      </div>
      <form id="svc-form">
        <div class="field">
          <label>Title</label>
          <input type="text" name="title" required value="${escapeHtml(svc.title)}"/>
        </div>
        <div class="form-row">
          <div class="field">
            <label>Tag</label>
            <input type="text" name="tag" required value="${escapeHtml(svc.tag)}" placeholder="AI / ML"/>
          </div>
          <div class="field">
            <label>Icon</label>
            <select name="icon">
              ${Object.keys(AlienIcons).map(k => `<option value="${k}" ${k===svc.icon?'selected':''}>${k}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Description</label>
          <textarea name="desc" required>${escapeHtml(svc.desc)}</textarea>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
          <button type="button" class="btn btn-ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${isNew ? 'Create' : 'Save'}</button>
        </div>
      </form>
    `);
    document.getElementById('svc-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const data = AlienStore.get();
      const payload = {
        id: svc.id,
        title: fieldVal(f, 'title').trim(),
        tag: fieldVal(f, 'tag').trim(),
        icon: fieldVal(f, 'icon'),
        desc: fieldVal(f, 'desc').trim()
      };
      if (isNew) data.services.push(payload);
      else data.services = data.services.map(s => s.id === svc.id ? payload : s);
      AlienStore.set(data);
      AlienToast(isNew ? 'Service created' : 'Service updated', 'success');
      closeModal();
      renderSection();
    });
  }

  // --------- PROJECTS ---------
  function viewProjects() {
    const projects = AlienStore.get().projects;
    return `
      <div class="admin-topbar">
        <h2>Projects</h2>
        <button class="btn btn-primary" id="add-project">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>
      ${sectionHeadPanel('projects', 'Projects')}
      <div class="panel">
        ${projects.length === 0
          ? '<p style="color:var(--text-faint);text-align:center;padding:30px;">No projects yet — create your first one.</p>'
          : `<table class="admin-table">
              <thead><tr><th>Thumb</th><th>Name</th><th>Category</th><th>Description</th><th></th></tr></thead>
              <tbody>
              ${projects.map(p => `
                <tr>
                  <td><div style="width:60px;height:42px;border-radius:8px;overflow:hidden;border:1px solid var(--border);">${AlienProjectThumb(p.image)}</div></td>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td><span class="tag">${escapeHtml(p.category)}</span></td>
                  <td style="color:var(--text-dim);max-width:360px;">${escapeHtml(p.desc)}</td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" data-edit="${p.id}" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button class="icon-btn delete" data-delete="${p.id}" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              </tbody>
            </table>`
        }
      </div>`;
  }
  function bindProjects() {
    bindSectionHeadForm('projects');
    document.getElementById('add-project').addEventListener('click', () => openProjectModal());
    document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openProjectModal(b.dataset.edit)));
    document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => {
      if (!confirm('Delete this project?')) return;
      const d = AlienStore.get();
      d.projects = d.projects.filter(p => p.id !== b.dataset.delete);
      AlienStore.set(d);
      AlienToast('Project deleted', 'success');
      renderSection();
    }));
  }
  function openProjectModal(id) {
    const d = AlienStore.get();
    const proj = id ? d.projects.find(p => p.id === id) : { id: 'p' + Date.now(), name: '', category: '', desc: '', image: 'gradient-1' };
    const isNew = !id;
    const gradients = ['gradient-1','gradient-2','gradient-3','gradient-4','gradient-5','gradient-6'];
    showModal(`
      <div class="modal-head">
        <h3>${isNew ? 'New Project' : 'Edit Project'}</h3>
        <button class="close-btn" data-close>&times;</button>
      </div>
      <form id="proj-form">
        <div class="field">
          <label>Project Name</label>
          <input type="text" name="name" required value="${escapeHtml(proj.name)}"/>
        </div>
        <div class="field">
          <label>Category</label>
          <input type="text" name="category" required value="${escapeHtml(proj.category)}"/>
        </div>
        <div class="field">
          <label>Description</label>
          <textarea name="desc" required>${escapeHtml(proj.desc)}</textarea>
        </div>
        <div class="field">
          <label>Thumbnail Style</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            ${gradients.map(g => `
              <label style="cursor:pointer">
                <input type="radio" name="image" value="${g}" ${g===proj.image?'checked':''} style="display:none"/>
                <div data-gpick="${g}" style="height:70px;border-radius:10px;overflow:hidden;border:2px solid ${g===proj.image?'var(--cyan)':'var(--border)'};transition:border-color .2s">
                  ${AlienProjectThumb(g)}
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
          <button type="button" class="btn btn-ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${isNew ? 'Create' : 'Save'}</button>
        </div>
      </form>
    `);
    // Update thumbnail border on change
    document.querySelectorAll('input[name="image"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('[data-gpick]').forEach(d => {
          d.style.borderColor = d.dataset.gpick === r.value ? 'var(--cyan)' : 'var(--border)';
        });
      });
    });
    document.getElementById('proj-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const data = AlienStore.get();
      const payload = {
        id: proj.id,
        name: fieldVal(f, 'name').trim(),
        category: fieldVal(f, 'category').trim(),
        desc: fieldVal(f, 'desc').trim(),
        image: (f.querySelector('[name="image"]:checked') || {}).value || proj.image
      };
      if (isNew) data.projects.push(payload);
      else data.projects = data.projects.map(p => p.id === proj.id ? payload : p);
      AlienStore.set(data);
      AlienToast(isNew ? 'Project created' : 'Project updated', 'success');
      closeModal();
      renderSection();
    });
  }

  // --------- MESSAGES ---------
  function viewMessages() {
    const messages = getMessages();
    return `
      <div class="admin-topbar">
        <h2>Messages</h2>
        ${messages.length ? `<button class="btn btn-danger" id="clear-msgs">Clear All</button>` : ''}
      </div>
      <div class="panel">
        ${messages.length === 0
          ? '<p style="color:var(--text-faint);text-align:center;padding:30px;">No messages yet. Submissions from the contact form will appear here.</p>'
          : `<table class="admin-table">
              <thead><tr><th></th><th>From</th><th>WhatsApp</th><th>Subject</th><th>Received</th><th></th></tr></thead>
              <tbody>
              ${messages.map(m => `
                <tr style="${m.read ? '' : 'background: rgba(0,240,255,0.04);'}">
                  <td>${m.read ? '' : '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 8px var(--cyan)"></span>'}</td>
                  <td><strong>${escapeHtml(m.name)}</strong><br/><span style="color:var(--text-faint);font-size:.85rem">${escapeHtml(m.email)}</span></td>
                  <td>${m.whatsapp ? `<a href="https://wa.me/${escapeHtml(m.whatsapp.replace(/\D/g,''))}" target="_blank" rel="noopener">${escapeHtml(m.whatsapp)}</a>` : '<span style="color:var(--text-faint)">—</span>'}</td>
                  <td>${escapeHtml(m.subject || '(no subject)')}</td>
                  <td style="color:var(--text-dim)">${formatDate(m.receivedAt)}</td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" data-view="${m.id}" title="View"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                      <button class="icon-btn delete" data-delete="${m.id}" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              </tbody>
            </table>`
        }
      </div>`;
  }
  function bindMessages() {
    const clear = document.getElementById('clear-msgs');
    if (clear) clear.addEventListener('click', () => {
      if (!confirm('Delete ALL messages? This cannot be undone.')) return;
      const ids = getMessages().map(m => m.id);
      liveMessages = [];                              // optimistic
      AlienMessages.clear(ids);
      AlienToast('All messages cleared', 'success');
      renderSection();
    });
    document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => openMessageModal(b.dataset.view)));
    document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => {
      if (!confirm('Delete this message?')) return;
      const id = b.dataset.delete;
      if (Array.isArray(liveMessages)) liveMessages = liveMessages.filter(m => m.id !== id);  // optimistic
      AlienMessages.remove(id);
      AlienToast('Message deleted', 'success');
      renderSection();
    }));
  }
  function openMessageModal(id) {
    const m = getMessages().find(x => x.id === id);
    if (!m) return;
    if (!m.read) {
      m.read = true;                          // optimistic — Firestore syncs below
      if (window.AlienMessages) AlienMessages.markRead(id);
    }
    const waDigits = (m.whatsapp || '').replace(/\D/g, '');
    showModal(`
      <div class="modal-head">
        <h3>${escapeHtml(m.subject || '(no subject)')}</h3>
        <button class="close-btn" data-close>&times;</button>
      </div>
      <div style="margin-bottom:16px">
        <div style="color:var(--text-faint);font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;margin-bottom:4px">From</div>
        <div><strong>${escapeHtml(m.name)}</strong> &lt;<a href="mailto:${m.email}">${escapeHtml(m.email)}</a>&gt;</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="color:var(--text-faint);font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;margin-bottom:4px">WhatsApp</div>
        <div>${waDigits
          ? `<a href="https://wa.me/${escapeHtml(waDigits)}" target="_blank" rel="noopener">${escapeHtml(m.whatsapp)}</a>`
          : '<span style="color:var(--text-faint)">Not provided</span>'}</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="color:var(--text-faint);font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;margin-bottom:4px">Received</div>
        <div>${formatDate(m.receivedAt, true)}</div>
      </div>
      <div>
        <div style="color:var(--text-faint);font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px">Message</div>
        <div style="padding:16px;background:rgba(5,7,26,0.6);border:1px solid var(--border);border-radius:10px;white-space:pre-wrap;line-height:1.7;">${escapeHtml(m.message)}</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
        ${waDigits ? `<a href="https://wa.me/${escapeHtml(waDigits)}" target="_blank" rel="noopener" class="btn btn-ghost">Reply on WhatsApp</a>` : ''}
        <a href="mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || ''))}" class="btn btn-ghost">Reply via Email</a>
        <button type="button" class="btn btn-primary" data-close>Close</button>
      </div>
    `);
    renderSection(); // refresh table to remove unread dot
  }

  // --------- CONTACT INFO ---------
  function viewContact() {
    const c = AlienStore.get().contact;
    return `
      <div class="admin-topbar"><h2>Contact Information</h2></div>
      <div class="panel">
        <p style="margin-bottom:18px;color:var(--text-dim)">These values appear in the website footer, the Contact page, and as defaults in the contact form's mail recipient.</p>
        <form id="contact-form">
          <div class="form-row">
            <div class="field">
              <label>Primary WhatsApp</label>
              <input type="text" name="whatsapp1" value="${escapeHtml(c.whatsapp1)}"/>
            </div>
            <div class="field">
              <label>Secondary WhatsApp</label>
              <input type="text" name="whatsapp2" value="${escapeHtml(c.whatsapp2)}"/>
            </div>
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" name="email" value="${escapeHtml(c.email)}"/>
          </div>
          <div class="field">
            <label>Address / Location</label>
            <input type="text" name="address" value="${escapeHtml(c.address || '')}"/>
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>`;
  }
  function bindContact() {
    document.getElementById('contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const d = AlienStore.get();
      d.contact = {
        whatsapp1: fieldVal(f, 'whatsapp1').trim(),
        whatsapp2: fieldVal(f, 'whatsapp2').trim(),
        email: fieldVal(f, 'email').trim(),
        address: fieldVal(f, 'address').trim()
      };
      AlienStore.set(d);
      AlienToast('Contact info updated', 'success');
    });
  }

  // --------- SETTINGS ---------
  function viewSettings() {
    return `
      <div class="admin-topbar"><h2>Settings</h2></div>
      ${fbReady() ? `
      <div class="panel">
        <h3 style="font-family:var(--font-display);margin-bottom:8px">Login</h3>
        <p style="color:var(--text-dim)">You're signed in securely with Firebase Authentication. To change your password or add another admin, use the Firebase console → <strong>Authentication → Users</strong>.</p>
      </div>` : `
      <div class="panel">
        <h3 style="font-family:var(--font-display);margin-bottom:16px">Change Password</h3>
        <form id="pw-form">
          <div class="field">
            <label>Current Password</label>
            <input type="password" name="current" required autocomplete="current-password"/>
          </div>
          <div class="form-row">
            <div class="field">
              <label>New Password</label>
              <input type="password" name="new" required minlength="4" autocomplete="new-password"/>
            </div>
            <div class="field">
              <label>Confirm New Password</label>
              <input type="password" name="confirm" required minlength="4" autocomplete="new-password"/>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>`}
      <div class="panel">
        <h3 style="font-family:var(--font-display);margin-bottom:8px">Publish to website</h3>
        <p style="color:var(--text-dim);margin-bottom:18px">${fbReady()
          ? 'Your live database is connected — <strong>every change you save publishes instantly</strong> to all visitors. No upload needed. You can still download a JSON copy below as a backup.'
          : 'Download <code>content.json</code> with <strong>all</strong> your content (brand &amp; logo, hero, services, projects, why-us, call-to-action and contact info), then upload it to your GitHub repo (replacing the old <code>content.json</code>). Your live site updates in about a minute. Private messages are <strong>not</strong> included.'}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
          <button class="btn btn-primary" id="export-site">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export for Website (content.json)
          </button>
        </div>
      </div>
      <div class="panel">
        <h3 style="font-family:var(--font-display);margin-bottom:8px">Data</h3>
        <p style="color:var(--text-dim);margin-bottom:18px">All content is stored locally in your browser (localStorage). You can export a full backup (including messages) or reset to factory defaults below.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-ghost" id="export-data">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export JSON
          </button>
          <label class="btn btn-ghost" style="cursor:pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import JSON
            <input type="file" id="import-data" accept="application/json" style="display:none"/>
          </label>
          <button class="btn btn-danger" id="reset-data">Reset to Defaults</button>
        </div>
      </div>`;
  }
  function bindSettings() {
    const pwForm = document.getElementById('pw-form');   // absent in Firebase mode
    if (pwForm) pwForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const cur = f.current.value;
      const nw = f.new.value;
      const cf = f.confirm.value;
      if (cur !== getStoredPassword()) {
        AlienToast('Current password is incorrect', 'error');
        return;
      }
      if (nw !== cf) {
        AlienToast('New passwords do not match', 'error');
        return;
      }
      if (nw.length < 4) {
        AlienToast('Password must be at least 4 characters', 'error');
        return;
      }
      setStoredPassword(nw);
      f.reset();
      AlienToast('Password updated successfully', 'success');
    });
    document.getElementById('export-site').addEventListener('click', () => {
      const d = AlienStore.get();
      // Only the public content — never the private message inbox.
      const publish = (window.AlienPublicContent
        ? window.AlienPublicContent(d)
        : { brand: d.brand, hero: d.hero, sections: d.sections, why: d.why, cta: d.cta, contact: d.contact, services: d.services, projects: d.projects });
      const blob = new Blob([JSON.stringify(publish, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'content.json';
      a.click();
      URL.revokeObjectURL(url);
      AlienToast('content.json downloaded — upload it to GitHub', 'success');
    });
    document.getElementById('export-data').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(AlienStore.get(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alientech-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      AlienToast('Backup downloaded', 'success');
    });
    document.getElementById('import-data').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data.services || !data.projects || !data.contact) throw new Error('Invalid format');
          AlienStore.set(data);
          AlienToast('Data imported successfully', 'success');
          renderSection();
        } catch (err) {
          AlienToast('Import failed: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
    document.getElementById('reset-data').addEventListener('click', () => {
      if (!confirm('Reset ALL data to factory defaults? This cannot be undone.')) return;
      AlienStore.reset();
      // With the live database on, also publish the defaults so the live site resets too.
      if (fbReady()) AlienStore.set(structuredClone(AlienStore.DEFAULTS));
      AlienToast('Data reset to defaults', 'success');
      renderSection();
    });
  }

  // --------- MODAL ---------
  function showModal(html) {
    const back = document.getElementById('modal-backdrop');
    back.innerHTML = `<div class="modal">${html}</div>`;
    back.classList.add('show');
    back.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
    back.addEventListener('click', (e) => {
      if (e.target === back) closeModal();
    }, { once: true });
    document.addEventListener('keydown', escClose);
  }
  function closeModal() {
    const back = document.getElementById('modal-backdrop');
    if (back) back.classList.remove('show');
    document.removeEventListener('keydown', escClose);
  }
  function escClose(e) { if (e.key === 'Escape') closeModal(); }

  function formatDate(iso, full = false) {
    if (!iso) return '';
    const d = new Date(iso);
    if (full) return d.toLocaleString();
    // relative
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
    return d.toLocaleDateString();
  }

  // --------- BOOTSTRAP ---------
  // When the live database pushes new content (including our own saves echoing
  // back), refresh the current dashboard section — but never while a modal is
  // open, so we don't interrupt editing.
  let _liveBound = false;
  function bindLiveRefresh() {
    if (_liveBound) return;
    _liveBound = true;
    window.addEventListener('alientech:store-change', () => {
      const back = document.getElementById('modal-backdrop');
      if (back && back.classList.contains('show')) return;
      if (document.getElementById('admin-main')) renderSection();
    });
  }

  function start() {
    if (fbReady()) {
      bindLiveRefresh();
      // Firebase restores the session asynchronously, then fires on every
      // login/logout — drive the whole screen from auth state.
      firebase.auth().onAuthStateChanged((user) => {
        if (user) renderDashboard();
        else renderLogin();
      });
    } else if (isLoggedIn()) {
      renderDashboard();
    } else {
      renderLogin();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
