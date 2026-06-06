# INTELLIFY — *We Intellify Your Business*

A complete, multi-page, professional website for **INTELLIFY**.
Slogan: **WE INTELLIFY YOUR BUSINESS**.

Zero build step, zero dependencies, zero servers — open `index.html` in any
modern browser and the whole thing runs.

---

## What's inside

```
d:\website
├── index.html            # Home page (hero, services, why us, CTA)
├── projects.html         # Projects grid (cards rendered from data)
├── contact.html          # Contact info + form (mailto + admin inbox)
├── control-x7k9.html     # Admin dashboard — SECRET URL (login + CRUD)
├── README.md             # You are here
└── assets/
    ├── css/style.css     # Full design system + responsive layout
    ├── js/
    │   ├── main.js       # Shared: nav, particles, store, renderers
    │   └── admin.js      # Admin dashboard logic
    └── img/
        ├── logo.jpeg     # INTELLIFY logo banner (shown big in the hero)
        ├── logo.svg      # Legacy mark (no longer used)
        └── favicon.svg
```

## How to run

Double-click `index.html` — or right-click → Open With → your browser.

Optionally, for nicer URLs and CORS-clean behavior:

```powershell
# any one-liner static server
npx serve d:\website
# or
python -m http.server 8080
```

Then visit <http://localhost:8080>.

## Pages

| Page | Path | Highlights |
| --- | --- | --- |
| Home | `index.html` | Animated hero with glitch headline, orbital logo, 9 service cards, stats counter, "why us" grid, CTA |
| Projects | `projects.html` | Responsive grid with procedural SVG thumbnails |
| Contact | `contact.html` | Info card + validated form. Submits open the user's mail client AND save a copy to the admin inbox |
| Admin | `control-x7k9.html` | Secret login screen → full dashboard |

## Admin Dashboard

The dashboard lives at an unlinked path (`control-x7k9.html`) — there is no link
to it anywhere on the public site. Access is protected by **Firebase
Authentication**: only a registered admin (email + password, managed in the
Firebase console under *Authentication → Users*) can log in and edit.

With Firebase enabled, **every Save publishes instantly** to all visitors via
Firestore — no manual upload needed.

The dashboard now lets you edit **every section** of the site:

- **Overview** — KPIs + recent messages + quick actions
- **Brand & Logo** — company name, slogan, and logo image (with live preview)
- **Hero** — eyebrow, headline (plain + highlighted part), lead text, both button labels, and the stat counters (add/remove)
- **Services** — section header + add / edit / delete services, pick from 9 icons
- **Projects** — section header + add / edit / delete projects, pick from 6 thumbnail styles
- **Why Us** — section heading + feature cards (add/remove, pick an icon)
- **Call to Action** — the bottom banner's eyebrow, heading, text and button
- **Messages** — read / delete submissions from the contact form
- **Contact Info** — phone numbers, email, address (auto-syncs the footer & contact page)
- **Settings** — change password, export `content.json`, export/import JSON backup, reset to defaults

Admin edits publish live to all visitors instantly through Firebase.

## Publishing your edits to the live site

There are two modes, controlled by `assets/js/firebase-config.js`.

### Mode A — Live database (Firebase)  *(recommended, instant)*

When `FIREBASE_ENABLED = true` and your config is filled in:

- The public site reads content from **Firestore in real time** — visitor pages
  update the instant you publish, no upload.
- The admin logs in with **Firebase Authentication** (real, server-verified).
- **Every save in the admin publishes live automatically.**

**One-time setup** (see `FIREBASE_SETUP.md`):
1. Create a free Firebase project + Web app; enable **Firestore** and
   **Email/Password Authentication**; add one admin user.
2. Paste the Web config into `assets/js/firebase-config.js`, set
   `FIREBASE_ENABLED = true`.
3. Set Firestore rules: public read, authenticated write (see setup doc).
4. Re-upload the site (the `deploy/` bundle) to GitHub.

Then: open `admin.html` locally (preferably via `localhost`), log in, edit —
done. Visitors see it immediately.

### Mode B — Free file workflow (no database)

When `FIREBASE_ENABLED = false` (default), the public site reads
**`content.json`** from the repo root. To publish:

1. Edit in the local admin dashboard.
2. **Settings → Publish to website → Export for Website (content.json)**.
3. On GitHub, replace the existing `content.json` with the download → **Commit**.
4. Live in ~1 minute.

## Data storage

- **Live site (Mode A):** content streams from Firestore (`site/content`).
- **Live site (Mode B):** content comes from `content.json`.
- **Local admin:** `localStorage` (`alientech.site.v1`) is a working copy /
  offline cache. In Mode A, saves are pushed to Firestore; in Mode B they're
  exported to `content.json`.

> **Note:** the contact form's message inbox is local-only in both modes (a
> static site can't receive messages server-side). The form's *mailto* still
> emails you. A Firestore-backed inbox can be added later if needed.

## Design

- **Theme:** dark + neon (cyan `#00f0ff`, violet `#a855f7`, magenta `#ff2bd6`).
- **Fonts:** Orbitron (display) + Rajdhani (body), loaded from Google Fonts.
- **Effects:** interactive particle field, glitch text, glowing orbital logo,
  floating grid, scroll reveals, hover tilt-glow on cards, animated stat
  counters, toast notifications, modal forms.
- **Responsive:** desktop, tablet, mobile (hamburger nav below 720 px).

## Contact info shipped in defaults

- WhatsApp: `0937824156`
- WhatsApp: `0999999999`
- Email: `info.alentech@gmail.com`

Editable from the admin panel.

---

Built as a working concept. Swap the local store for an API + auth and you
have a production-ready INTELLIFY site.
