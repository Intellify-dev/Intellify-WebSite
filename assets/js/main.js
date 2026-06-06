/* ============================================================
   INTELLIFY — Shared client-side application logic
   ------------------------------------------------------------
   • Data layer (localStorage-backed) with sane defaults
   • Particle background canvas
   • Nav scroll + mobile toggle + active link
   • Reveal-on-scroll observer
   • Card tilt-glow
   • Toast notifications
   ============================================================ */

(function () {
  'use strict';

  // True only when the site runs from your own machine (file:// or localhost).
  // Used to keep the Admin link off the public (github.io) deployment.
  const IS_LOCAL = location.protocol === 'file:'
    || ['localhost', '127.0.0.1', ''].includes(location.hostname);

  // ---------- DATA LAYER ----------
  // INTELLIFY content model (brand / hero / why / cta / sections).
  // Bumped to v2 with the new logo assets so any older cache refreshes cleanly.
  const STORE_KEY = 'intellify.site.v2';

  const DEFAULTS = {
    brand: {
      name: 'INTELLIFY',
      slogan: 'WE INTELLIFY YOUR BUSINESS',
      logo: 'assets/img/logo-full.png',   // full transparent lockup — shown on the hero
      mark: 'assets/img/logo-mark.png'     // star icon only — shown beside the name in the nav/footer
    },
    hero: {
      eyebrow: '// System Online',
      headline: 'We',
      accent: 'intellify your business.',
      lead: 'INTELLIFY turns complexity into clarity — from AI platforms and modern web apps to mobile experiences, branding and full-stack accounting systems. Premium engineering, dynamic design, zero compromises.',
      primaryCtaLabel: 'Explore Services',
      secondaryCtaLabel: 'Start a Project',
      stats: [
        { num: '120', suffix: '+', label: 'Projects Shipped' },
        { num: '45', suffix: '+', label: 'Happy Clients' },
        { num: '9', suffix: '', label: 'Core Services' },
        { num: '99.9', suffix: '%', label: 'Uptime' }
      ]
    },
    sections: {
      servicesEyebrow: '// Capabilities',
      servicesHeading: 'Services that <span class="gradient-text">cross dimensions</span>',
      servicesText: 'A full-spectrum technology partner. From the first idea to the production rollout, we cover every layer of your digital stack.',
      projectsEyebrow: '// Mission Archive',
      projectsHeading: 'Selected <span class="gradient-text">Projects</span>',
      projectsText: "A snapshot of the systems we've shipped — across industries, time zones and tech stacks."
    },
    why: {
      eyebrow: '// Why INTELLIFY',
      heading: 'Built like spacecraft.<br/>Delivered like clockwork.',
      items: [
        { icon: 'bolt', title: 'Lightspeed Delivery', desc: 'We move fast without breaking things. Sprint-based delivery, transparent status, demoable progress every week.' },
        { icon: 'shield', title: 'Production-Grade Code', desc: 'Typed, tested, documented. Code that survives audits and scales with your team and your traffic.' },
        { icon: 'globe', title: 'Global Mindset', desc: 'Multi-language, multi-currency, multi-region. We design products for the world from day one.' },
        { icon: 'stack', title: 'Modern Stack', desc: "React, Next.js, Flutter, TensorFlow, AWS — the best tools for the job, never the trendiest for trend's sake." }
      ]
    },
    cta: {
      eyebrow: '// Initiate Contact',
      heading: 'Have a project worth building?',
      text: "Tell us about your idea. We'll send back a concrete plan, timeline, and price — typically within 48 hours.",
      buttonLabel: 'Start the Mission'
    },
    contact: {
      email: 'info.alentech@gmail.com',
      whatsapp1: '0937824156',
      whatsapp2: '0999999999',
      address: 'Damascus, Syria — Remote Worldwide'
    },
    services: [
      { id: 's1', icon: 'ai', title: 'Artificial Intelligence', tag: 'AI / ML',
        desc: 'Custom AI models, chatbots, computer vision and predictive analytics tailored to your data.' },
      { id: 's2', icon: 'web', title: 'Web Development', tag: 'React / Next',
        desc: 'High-performance websites and dashboards engineered with React, Next.js and modern tooling.' },
      { id: 's3', icon: 'wp', title: 'WordPress Solutions', tag: 'CMS',
        desc: 'Tailored WordPress themes, plugins and full e-commerce stores built on WooCommerce.' },
      { id: 's4', icon: 'flutter', title: 'Flutter Mobile Apps', tag: 'iOS / Android',
        desc: 'Cross-platform mobile applications with native feel, smooth animations and offline support.' },
      { id: 's5', icon: 'brand', title: 'Graphic Design & Branding', tag: 'Identity',
        desc: 'Logos, brand systems and marketing collateral that make your company unmistakably you.' },
      { id: 's6', icon: 'video', title: 'Video Editing', tag: 'Motion',
        desc: 'Cinematic edits, motion graphics and short-form content optimized for any platform.' },
      { id: 's7', icon: 'erp', title: 'Accounting Systems', tag: 'ERP',
        desc: 'Custom accounting and ERP software with invoicing, inventory and real-time reporting.' },
      { id: 's8', icon: 'cloud', title: 'Cloud & DevOps', tag: 'Infra',
        desc: 'CI/CD pipelines, container orchestration and scalable cloud architectures on AWS, GCP, Azure.' },
      { id: 's9', icon: 'sec', title: 'Cybersecurity', tag: 'Defense',
        desc: 'Security audits, penetration testing and hardening to keep your systems and data safe.' }
    ],
    projects: [
      { id: 'p1', name: 'NeuroPilot Analytics', category: 'AI Platform',
        desc: 'Real-time anomaly-detection platform for industrial sensors, processing 2M+ events / minute.',
        image: 'gradient-1' },
      { id: 'p2', name: 'Orbit Commerce', category: 'E-commerce',
        desc: 'Headless commerce stack with React storefront, Stripe checkout and Sanity CMS.',
        image: 'gradient-2' },
      { id: 'p3', name: 'PulseBank Mobile', category: 'Flutter',
        desc: 'Mobile banking app with biometric login, P2P payments and budgeting AI.',
        image: 'gradient-3' },
      { id: 'p4', name: 'Helix Health CMS', category: 'WordPress',
        desc: 'WordPress + WooCommerce platform for a medical-services chain with bookings and tele-consults.',
        image: 'gradient-4' },
      { id: 'p5', name: 'Quantum Studio', category: 'Branding',
        desc: 'Full brand identity, web presence and motion package for a generative-art studio.',
        image: 'gradient-5' },
      { id: 'p6', name: 'Ledger X ERP', category: 'Accounting',
        desc: 'Multi-currency accounting and inventory ERP for a regional logistics operator.',
        image: 'gradient-6' }
    ],
    messages: []
  };

  // The live published content. Filled from Firestore (when the database is
  // configured) or from content.json (the free fallback). Null until loaded.
  let _published = null;

  function backfill(data) {
    // add any keys missing from older/partial data (forward-compat)
    for (const k of Object.keys(DEFAULTS)) {
      if (!(k in data)) data[k] = structuredClone(DEFAULTS[k]);
    }
    return data;
  }

  // ----- Firebase helpers (no-ops unless firebase-config.js enabled it) -----
  function firebaseOn() {
    try {
      return !!(window.FIREBASE_ENABLED && window.firebase
        && window.firebase.apps && window.firebase.apps.length);
    } catch (e) { return false; }
  }
  function contentRef() {
    const d = window.FIREBASE_DOC || { collection: 'site', doc: 'content' };
    return firebase.firestore().collection(d.collection).doc(d.doc);
  }
  // True only when an authenticated admin is logged in (i.e. the dashboard).
  function isAdminAuthed() {
    try {
      return !!(firebaseOn() && firebase.auth && firebase.auth().currentUser);
    } catch (e) { return false; }
  }

  function loadStore() {
    // With the live database on, Firestore content is the single source of
    // truth for everyone (including the admin's freshly-saved edits, applied
    // optimistically). localStorage is only a last-known cache before the
    // first snapshot arrives.
    if (window.FIREBASE_ENABLED) {
      if (_published) return backfill(structuredClone(_published));
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) return backfill(JSON.parse(raw));
      } catch (e) { /* fall through to defaults */ }
      return structuredClone(DEFAULTS);
    }

    // No database: on your machine the admin's working copy (localStorage) wins
    // so you can edit; on the live site the published content.json wins.
    if (IS_LOCAL) {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) return backfill(JSON.parse(raw));
      } catch (e) {
        console.warn('Store load failed, falling back to published/defaults', e);
      }
    }
    if (_published) return backfill(structuredClone(_published));
    return structuredClone(DEFAULTS);
  }

  function applyPublished(data) {
    if (!data || (!data.services && !data.projects && !data.contact)) return;
    _published = data;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(backfill(structuredClone(data)))); } catch (e) {}
    window.dispatchEvent(new CustomEvent('alientech:store-change', { detail: loadStore() }));
  }

  // Free fallback: read content.json from the repo.
  async function loadFromFile() {
    try {
      const res = await fetch('content.json', { cache: 'no-store' });
      if (!res.ok) return;
      applyPublished(await res.json());
    } catch (e) {
      /* no content.json yet (or file:// blocks fetch) — defaults stay in place */
    }
  }

  // The public, shippable slice of the store (everything except the private
  // message inbox). Used for both Firestore publishing and content.json export.
  function publicContent(data) {
    return {
      brand: data.brand,
      hero: data.hero,
      sections: data.sections,
      why: data.why,
      cta: data.cta,
      contact: data.contact,
      services: data.services,
      projects: data.projects
    };
  }
  window.AlienPublicContent = publicContent;

  // Subscribe to live content. Firestore (real-time) when configured,
  // otherwise the content.json file.
  function loadPublished() {
    if (firebaseOn()) {
      try {
        contentRef().onSnapshot(
          (snap) => { if (snap.exists) applyPublished(snap.data()); else loadFromFile(); },
          (err) => { console.warn('Firestore read failed; using file/defaults', err); loadFromFile(); }
        );
        return;
      } catch (e) {
        console.warn('Firestore unavailable; using file/defaults', e);
      }
    }
    loadFromFile();
  }

  function publishToFirestore(data) {
    try {
      const publish = publicContent(data);
      contentRef().set(publish).catch((e) => {
        console.error('Publish to live site failed', e);
        if (window.AlienToast) AlienToast('Publish failed: ' + e.message, 'error');
      });
    } catch (e) { console.error(e); }
  }

  function saveStore(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
    // When the admin is logged in, every save publishes live to all visitors.
    if (isAdminAuthed()) {
      _published = publicContent(data);
      publishToFirestore(data);
    }
    // notify other tabs / pages
    window.dispatchEvent(new CustomEvent('alientech:store-change', { detail: data }));
  }

  function resetStore() {
    localStorage.removeItem(STORE_KEY);
  }

  const Store = {
    get: loadStore,
    set: saveStore,
    reset: resetStore,
    loadPublished,
    isAdminAuthed,
    DEFAULTS
  };
  window.AlienStore = Store;

  // ---------- ICONS ----------
  const ICONS = {
    ai: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.2 4.2l4.3 4.3M15.5 15.5l4.3 4.3M1 12h6M17 12h6M4.2 19.8l4.3-4.3M15.5 8.5l4.3-4.3"/></svg>',
    web: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    wp: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 4 3 16 0 20M12 2c-3 4-3 16 0 20"/></svg>',
    flutter: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
    brand: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="10" cy="20" r="2.5"/><path d="M2 2l20 20"/></svg>',
    video: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    erp: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/><circle cx="7" cy="5" r=".5" fill="currentColor"/><circle cx="7" cy="12" r=".5" fill="currentColor"/><circle cx="7" cy="19" r=".5" fill="currentColor"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.7A4 4 0 0 0 6 19h11.5z"/></svg>',
    sec: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    // "Why us" feature icons
    bolt: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    stack: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M12 8V2M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6"/></svg>'
  };
  window.AlienIcons = ICONS;

  // Project gradient thumbnails (procedural SVGs)
  const PROJECT_GRADIENTS = {
    'gradient-1': { from: '#00f0ff', to: '#a855f7', shape: 'neural' },
    'gradient-2': { from: '#ff2bd6', to: '#00f0ff', shape: 'orbit' },
    'gradient-3': { from: '#00ffa3', to: '#00f0ff', shape: 'wave' },
    'gradient-4': { from: '#a855f7', to: '#ff2bd6', shape: 'hex' },
    'gradient-5': { from: '#ffae00', to: '#ff2bd6', shape: 'spiral' },
    'gradient-6': { from: '#00ffa3', to: '#a855f7', shape: 'grid' }
  };

  function projectThumbSVG(key) {
    const g = PROJECT_GRADIENTS[key] || PROJECT_GRADIENTS['gradient-1'];
    const id = 'pg-' + Math.random().toString(36).slice(2, 8);
    let shape = '';
    switch (g.shape) {
      case 'neural':
        shape = `
          <g stroke="url(#${id})" stroke-width="1.4" fill="none">
            <circle cx="40" cy="60" r="4" fill="url(#${id})"/>
            <circle cx="40" cy="100" r="4" fill="url(#${id})"/>
            <circle cx="40" cy="140" r="4" fill="url(#${id})"/>
            <circle cx="100" cy="80" r="5" fill="url(#${id})"/>
            <circle cx="100" cy="120" r="5" fill="url(#${id})"/>
            <circle cx="160" cy="100" r="6" fill="url(#${id})"/>
            <line x1="40" y1="60" x2="100" y2="80"/>
            <line x1="40" y1="60" x2="100" y2="120"/>
            <line x1="40" y1="100" x2="100" y2="80"/>
            <line x1="40" y1="100" x2="100" y2="120"/>
            <line x1="40" y1="140" x2="100" y2="80"/>
            <line x1="40" y1="140" x2="100" y2="120"/>
            <line x1="100" y1="80" x2="160" y2="100"/>
            <line x1="100" y1="120" x2="160" y2="100"/>
          </g>`;
        break;
      case 'orbit':
        shape = `
          <g fill="none" stroke="url(#${id})" stroke-width="1.4">
            <circle cx="100" cy="100" r="60"/>
            <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(30 100 100)"/>
            <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(-30 100 100)"/>
            <circle cx="100" cy="100" r="14" fill="url(#${id})"/>
          </g>`;
        break;
      case 'wave':
        shape = `
          <g fill="none" stroke="url(#${id})" stroke-width="2">
            <path d="M10 100 Q 50 40 90 100 T 170 100 T 250 100"/>
            <path d="M10 120 Q 50 60 90 120 T 170 120 T 250 120" opacity="0.6"/>
            <path d="M10 140 Q 50 80 90 140 T 170 140 T 250 140" opacity="0.35"/>
          </g>`;
        break;
      case 'hex':
        shape = `
          <g fill="none" stroke="url(#${id})" stroke-width="1.4">
            <polygon points="100,40 140,62 140,108 100,130 60,108 60,62"/>
            <polygon points="100,60 124,72 124,98 100,110 76,98 76,72"/>
            <polygon points="100,80 110,86 110,94 100,100 90,94 90,86" fill="url(#${id})"/>
          </g>`;
        break;
      case 'spiral':
        shape = `
          <g fill="none" stroke="url(#${id})" stroke-width="1.4">
            <path d="M100 100 m-50 0 a50 50 0 1 0 100 0 a40 40 0 1 1 -80 0 a30 30 0 1 0 60 0 a20 20 0 1 1 -40 0 a10 10 0 1 0 20 0"/>
          </g>`;
        break;
      case 'grid':
      default:
        shape = `
          <g fill="url(#${id})">
            <rect x="40" y="40" width="20" height="20" rx="3"/>
            <rect x="70" y="40" width="20" height="20" rx="3" opacity="0.8"/>
            <rect x="100" y="40" width="20" height="20" rx="3" opacity="0.6"/>
            <rect x="40" y="70" width="20" height="20" rx="3" opacity="0.8"/>
            <rect x="70" y="70" width="20" height="20" rx="3"/>
            <rect x="100" y="70" width="20" height="20" rx="3" opacity="0.8"/>
            <rect x="40" y="100" width="20" height="20" rx="3" opacity="0.6"/>
            <rect x="70" y="100" width="20" height="20" rx="3" opacity="0.8"/>
            <rect x="100" y="100" width="20" height="20" rx="3"/>
          </g>`;
    }
    return `
      <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${g.from}"/>
            <stop offset="100%" stop-color="${g.to}"/>
          </linearGradient>
        </defs>
        ${shape}
      </svg>`;
  }
  window.AlienProjectThumb = projectThumbSVG;

  // ---------- PARTICLE BACKGROUND ----------
  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const COUNT = window.innerWidth < 768 ? 40 : 90;

    function resize() {
      w = canvas.width = window.innerWidth * window.devicePixelRatio;
      h = canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4 * window.devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.4 * window.devicePixelRatio,
        r: (Math.random() * 1.4 + 0.4) * window.devicePixelRatio,
        c: Math.random() > 0.6 ? '#a855f7' : '#00f0ff'
      });
    }

    let mouse = { x: -9999, y: -9999 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX * window.devicePixelRatio;
      mouse.y = e.clientY * window.devicePixelRatio;
    });

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        // mouse attraction
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 22500) {
          const f = 0.0008;
          p.vx += dx * f / window.devicePixelRatio;
          p.vy += dy * f / window.devicePixelRatio;
          p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
          p.vy = Math.max(-1.5, Math.min(1.5, p.vy));
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.c;
        ctx.fill();

        // connect to neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x, ddy = p.y - q.y;
          const dist = Math.sqrt(ddx*ddx + ddy*ddy);
          const maxD = 120 * window.devicePixelRatio;
          if (dist < maxD) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,240,255,${0.18 * (1 - dist / maxD)})`;
            ctx.lineWidth = 0.6 * window.devicePixelRatio;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  // ---------- NAVBAR ----------
  function initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const toggle = nav.querySelector('.nav-toggle');
    const links = nav.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => links.classList.remove('open'));
      });
    }

    // Scroll-spy: on the home page, move the active underline between
    // Home and Services depending on which section is in view.
    const servicesSection = document.getElementById('services');
    const homeLink = nav.querySelector('.nav-links a[href="index.html"]');
    const servicesLink = nav.querySelector('.nav-links a[href="index.html#services"]');
    if (servicesSection && homeLink && servicesLink) {
      const onSpy = () => {
        const trigger = window.scrollY + nav.offsetHeight + 40;
        const inServices = trigger >= servicesSection.offsetTop;
        servicesLink.classList.toggle('active', inServices);
        homeLink.classList.toggle('active', !inServices);
      };
      window.addEventListener('scroll', onSpy, { passive: true });
      onSpy();
    }
  }

  // ---------- REVEAL ON SCROLL ----------
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  }

  // ---------- CARD TILT-GLOW ----------
  function initCardGlow() {
    document.querySelectorAll('.card, .project-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  // ---------- TOAST ----------
  function ensureToastWrap() {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    return wrap;
  }
  function toast(message, type = 'success', duration = 3000) {
    const wrap = ensureToastWrap();
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const iconMap = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    el.innerHTML = (iconMap[type] || iconMap.info) + '<span>' + escapeHtml(message) + '</span>';
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'all .35s ease';
      el.style.transform = 'translateX(120%)';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 400);
    }, duration);
  }
  window.AlienToast = toast;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  window.escapeHtml = escapeHtml;

  // ---------- COUNTER ANIMATION ----------
  function animateCounters() {
    const els = document.querySelectorAll('[data-counter]:not([data-counting])');
    els.forEach(el => {
      el.setAttribute('data-counting', '1');
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();
      function step(t) {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = (target * eased);
        el.textContent = (target >= 100 ? Math.round(val) : val.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            requestAnimationFrame(step);
            io.disconnect();
          }
        });
      });
      io.observe(el);
    });
  }

  // ---------- RENDER COMPONENTS ----------
  function renderNav(activePage) {
    const navMount = document.querySelector('[data-nav]');
    if (!navMount) return;
    const brand = Store.get().brand || DEFAULTS.brand;
    const mark = (brand.mark || '').trim();
    navMount.innerHTML = `
      <nav class="nav">
        <div class="container nav-inner">
          <a href="index.html" class="brand brand-wordmark" title="${escapeHtml(brand.slogan || '')}">
            ${mark ? `<img src="${escapeHtml(mark)}" alt="" class="brand-logo"/>` : ''}
            <span class="brand-text">${escapeHtml(brand.name || 'INTELLIFY')}</span>
          </a>
          <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <ul class="nav-links">
            <li><a href="index.html" ${activePage==='home'?'class="active"':''}>Home</a></li>
            <li><a href="projects.html" ${activePage==='projects'?'class="active"':''}>Projects</a></li>
            <li><a href="index.html#services" ${activePage==='services'?'class="active"':''}>Services</a></li>
            <li><a href="contact.html" ${activePage==='contact'?'class="active"':''}>Contact</a></li>
          </ul>
        </div>
      </nav>`;
  }

  function renderFooter() {
    const mount = document.querySelector('[data-footer]');
    if (!mount) return;
    const data = Store.get();
    const c = data.contact;
    const brand = data.brand || DEFAULTS.brand;
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-col">
              <div class="brand brand-wordmark" style="margin-bottom: 14px;">
                ${(brand.mark || '').trim() ? `<img src="${escapeHtml(brand.mark)}" alt="" class="brand-logo"/>` : ''}
                <span class="brand-text">${escapeHtml(brand.name || 'INTELLIFY')}</span>
              </div>
              <p style="text-transform:uppercase;letter-spacing:.12em;color:var(--cyan);font-weight:600;margin-bottom:10px;font-size:.92rem">${escapeHtml(brand.slogan || '')}</p>
              <p>Advanced digital and technology solutions, engineered for the next decade. We build software that feels a few years ahead of its time.</p>
              <div class="social" aria-label="Social media">
                <a href="#" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
                <a href="#" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 1 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg></a>
                <a href="#" aria-label="GitHub"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg></a>
                <a href="#" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor"/></svg></a>
              </div>
            </div>
            <div class="footer-col">
              <h4>Navigate</h4>
              <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="projects.html">Projects</a></li>
                <li><a href="index.html#services">Services</a></li>
                <li><a href="contact.html">Contact</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Services</h4>
              <ul>
                <li><a href="index.html#services">Artificial Intelligence</a></li>
                <li><a href="index.html#services">Web Development</a></li>
                <li><a href="index.html#services">Mobile Apps</a></li>
                <li><a href="index.html#services">Branding</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Contact</h4>
              <ul>
                <li><a href="https://wa.me/${c.whatsapp1.replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp: ${escapeHtml(c.whatsapp1)}</a></li>
                <li><a href="https://wa.me/${c.whatsapp2.replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp: ${escapeHtml(c.whatsapp2)}</a></li>
                <li><a href="mailto:${c.email}">${escapeHtml(c.email)}</a></li>
                <li>${escapeHtml(c.address || '')}</li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; ${new Date().getFullYear()} ${escapeHtml(brand.name || 'INTELLIFY')}. All systems operational.</span>
            <span>Engineered with <span style="color: var(--magenta)">&hearts;</span> across the galaxy.</span>
          </div>
        </div>
      </footer>`;
  }

  function renderServices() {
    const mount = document.querySelector('[data-services]');
    if (!mount) return;
    const services = Store.get().services;
    mount.innerHTML = services.map((s, i) => `
      <article class="card reveal" style="--i:${i}">
        <div class="card-icon">${ICONS[s.icon] || ICONS.web}</div>
        <h3>${escapeHtml(s.title)}</h3>
        <p>${escapeHtml(s.desc)}</p>
        <span class="card-tag">${escapeHtml(s.tag)}</span>
      </article>
    `).join('');
    initReveal();
    initCardGlow();
  }

  function renderProjects() {
    const mount = document.querySelector('[data-projects]');
    if (!mount) return;
    const projects = Store.get().projects;
    if (!projects.length) {
      mount.innerHTML = `<p style="text-align:center;color:var(--text-faint);grid-column:1/-1;padding:40px;">No projects yet.</p>`;
      return;
    }
    mount.innerHTML = projects.map((p, i) => `
      <article class="project-card reveal" style="--i:${i}">
        <div class="project-thumb">${projectThumbSVG(p.image)}</div>
        <div class="project-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.desc)}</p>
          <div class="project-meta">
            <span class="tag">${escapeHtml(p.category)}</span>
          </div>
        </div>
      </article>
    `).join('');
    initReveal();
    initCardGlow();
  }

  // ---------- HERO ----------
  function renderHero() {
    const mount = document.querySelector('[data-hero]');
    if (!mount) return;
    const data = Store.get();
    const h = data.hero || DEFAULTS.hero;
    const brand = data.brand || DEFAULTS.brand;
    const logo = (brand.logo || '').trim();
    const stats = Array.isArray(h.stats) ? h.stats : [];
    const visual = logo
      ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(brand.name || 'INTELLIFY')}" class="hero-logo-img"/>`
      : `<div class="hero-wordmark gradient-text">${escapeHtml(brand.name || 'INTELLIFY')}</div>`;
    mount.innerHTML = `
      <div class="container hero-grid">
        <div>
          <span class="section-eyebrow reveal">${escapeHtml(h.eyebrow || '')}</span>
          <h1 class="reveal">${escapeHtml(h.headline || '')} <span class="glitch gradient-text" data-text="${escapeHtml(h.accent || '')}">${escapeHtml(h.accent || '')}</span></h1>
          <p class="lead reveal">${escapeHtml(h.lead || '')}</p>
          <div class="hero-actions reveal">
            <a href="#services" class="btn btn-primary">
              ${escapeHtml(h.primaryCtaLabel || 'Explore Services')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <a href="contact.html" class="btn btn-ghost">${escapeHtml(h.secondaryCtaLabel || 'Start a Project')}</a>
          </div>
          <div class="stats reveal">
            ${stats.map(s => `
              <div class="stat">
                <div class="stat-num"><span data-counter="${escapeHtml(String(s.num))}" data-suffix="${escapeHtml(s.suffix || '')}">0</span></div>
                <div class="stat-label">${escapeHtml(s.label || '')}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="hero-visual reveal">
          <div class="hero-glow" aria-hidden="true"></div>
          ${visual}
        </div>
      </div>`;
    initReveal();
    animateCounters();
  }

  // ---------- SECTION HEADS (services / projects) ----------
  function renderSectionHead(key) {
    const mount = document.querySelector(`[data-head="${key}"]`);
    if (!mount) return;
    const s = Store.get().sections || DEFAULTS.sections;
    const eyebrow = s[key + 'Eyebrow'] || '';
    const heading = s[key + 'Heading'] || '';
    const text = s[key + 'Text'] || '';
    mount.innerHTML = `
      <div class="section-head reveal">
        <span class="section-eyebrow">${escapeHtml(eyebrow)}</span>
        <h2>${heading}</h2>
        <p>${escapeHtml(text)}</p>
      </div>`;
    initReveal();
  }

  // ---------- WHY US ----------
  function renderWhy() {
    const mount = document.querySelector('[data-why]');
    if (!mount) return;
    const w = Store.get().why || DEFAULTS.why;
    const items = Array.isArray(w.items) ? w.items : [];
    mount.innerHTML = `
      <div class="container">
        <div class="section-head reveal">
          <span class="section-eyebrow">${escapeHtml(w.eyebrow || '')}</span>
          <h2>${w.heading || ''}</h2>
        </div>
        <div class="services-grid">
          ${items.map(it => `
            <article class="card reveal">
              <div class="card-icon">${ICONS[it.icon] || ICONS.bolt}</div>
              <h3>${escapeHtml(it.title || '')}</h3>
              <p>${escapeHtml(it.desc || '')}</p>
            </article>
          `).join('')}
        </div>
      </div>`;
    initReveal();
    initCardGlow();
  }

  // ---------- CTA ----------
  function renderCTA() {
    const mount = document.querySelector('[data-cta]');
    if (!mount) return;
    const c = Store.get().cta || DEFAULTS.cta;
    mount.innerHTML = `
      <div class="container">
        <div class="reveal" style="padding:60px 40px;text-align:center;background:linear-gradient(135deg, rgba(0,240,255,0.08), rgba(168,85,247,0.08));border:1px solid var(--border-strong);border-radius:24px;backdrop-filter:blur(10px);">
          <span class="section-eyebrow">${escapeHtml(c.eyebrow || '')}</span>
          <h2 style="margin:14px 0">${escapeHtml(c.heading || '')}</h2>
          <p style="max-width:560px;margin:0 auto 28px">${escapeHtml(c.text || '')}</p>
          <a href="contact.html" class="btn btn-primary">
            ${escapeHtml(c.buttonLabel || 'Start the Mission')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>`;
    initReveal();
  }

  function renderHome() {
    renderHero();
    renderSectionHead('services');
    renderServices();
    renderWhy();
    renderCTA();
  }

  // ---------- INIT ----------
  function init(opts = {}) {
    loadPublished();          // pull live content.json, re-renders when it arrives
    renderNav(opts.page);
    renderFooter();
    initParticles();
    initNav();
    if (opts.page === 'home') {
      renderHome();
    }
    if (opts.page === 'projects') {
      renderSectionHead('projects');
      renderProjects();
    }
    initReveal();
    initCardGlow();
    animateCounters();

    // re-render when store changes (admin updates content, live publish, etc.)
    window.addEventListener('alientech:store-change', () => {
      renderNav(opts.page);
      initNav();                // re-bind toggle/scroll after nav re-render
      renderFooter();
      if (opts.page === 'home') renderHome();
      if (opts.page === 'projects') { renderSectionHead('projects'); renderProjects(); }
    });
  }

  window.AlienTech = { init, toast, Store };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(window.__ALIEN_OPTS__ || {}));
  } else {
    init(window.__ALIEN_OPTS__ || {});
  }
})();
