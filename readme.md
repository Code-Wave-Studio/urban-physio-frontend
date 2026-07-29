# The Urban Physio — Frontend

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#-license)

A modern, responsive **frontend** for **The Urban Physio** — a digital healthcare platform that connects patients with physiotherapists and clinics across India.

This repository contains **only the React frontend**. It talks to a separate REST API backend and is built for production deployment on **Cloudflare Pages**.

Developed & maintained by **[CodeWave Studio](https://codewavestudio.space)**.

---

## Project Overview

**The Urban Physio** helps patients discover physiotherapists and partner clinics, book appointments, manage treatment packages, and access care online or in person.

The frontend delivers a fast, mobile-first experience for:

- Public discovery — doctors, clinics, treatments, SEO city pages, blog & podcast
- Booking — clinic visits, online consultations, and home visits
- Role-based portals — **patient**, **doctor**, **clinic**, and **admin**
- Clinic operations — appointments, patients, billing, packages, calendar, notes, and ERP clinical tools

---

## Key Features

| Area | Highlights |
|------|------------|
| **Patient portal** | Appointments, packages, saved providers, reports, bills, wallet, progress, video consults |
| **Doctor portal** | Appointments, patients, clinics, availability, earnings, calendar, prescriptions, documents |
| **Clinic portal** | Reception & admin modes, team, billing, finance, packages, QR intake, notes, calendar, forms |
| **Clinic ERP tools** | Patient overview & timeline, assessment builder, protocols, suggestion chips |
| **Public site** | Doctor/clinic profiles, search, treatments, conditions, PhysioFeed blog & podcast |
| **Booking flows** | Multi-step wizards with slots, capacity, coupons, and policy acceptance |
| **Online consults** | Join/start video meetings via API-provided Zoom links (no Zoom secrets in frontend) |
| **Auth** | JWT sessions, OTP, Google OAuth (`@react-oauth/google`), role-protected routes |
| **UI** | Tailwind design system, Framer Motion, Chart.js dashboards, Font Awesome icons |
| **Performance** | Vite builds, hashed assets (`app/`), SPA routing, Cloudflare CDN |

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 18](https://react.dev/) | UI and component architecture |
| [Vite 5](https://vitejs.dev/) | Dev server, HMR, production builds |
| [Tailwind CSS 3](https://tailwindcss.com/) | Styling and design tokens |
| [React Router 6](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | REST API client |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Chart.js](https://www.chartjs.org/) + react-chartjs-2 | Dashboards & finance charts |
| [React Quill](https://github.com/zenoamaro/react-quill) | Rich-text clinical notes |
| [Cloudflare Pages](https://pages.cloudflare.com/) | Hosting & CDN |

---

## Folder Structure

```
.
├── public/                 # Static assets, SPA redirects (_redirects)
├── src/
│   ├── components/         # UI modules (booking, clinic, erp, nav, seo, …)
│   ├── constants/          # Nav, policy, portal config
│   ├── contexts/           # Auth, location, contact, cookies
│   ├── core/               # Shared core utilities
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Page layouts
│   ├── pages/
│   │   ├── admin/          # Platform admin screens
│   │   ├── auth/           # Login / register / OTP portals
│   │   ├── clinic/         # Clinic portal (ops, billing, ERP settings)
│   │   ├── doctor/         # Doctor portal
│   │   ├── legal/          # Policies & legal pages
│   │   ├── patient/        # Patient portal
│   │   └── public/         # Marketing & discovery pages
│   ├── services/           # API client (api.js)
│   ├── utils/              # Helpers (booking, URLs, media, lists)
│   ├── App.jsx             # Route map
│   ├── main.jsx            # Entry + providers
│   └── index.css           # Global + Tailwind layers
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended)
- **npm** 9+
- Access to the Urban Physio REST API (local or hosted)

### 1. Clone the repository

```bash
git clone https://github.com/CodeWaveStudio/theurbanphysio.git
cd theurbanphysio
```

> If this frontend lives inside a monorepo, use `cd theurbanphysio/frontend` instead.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root (see [Environment Variables](#-environment-variables)).

### 4. Start development

```bash
npm run dev
```

App URL: **http://localhost:5173** (default). Vite can proxy API calls to a local backend when `VITE_APP_BASE_PATH` / proxy settings are configured.

### 5. Production build

```bash
npm run build
```

Output: `dist/`

### 6. Preview production build

```bash
npm run preview
```

---

## Environment Variables

Create `.env` locally, or set the same keys in **Cloudflare Pages → Settings → Environment variables**:

```env
# REST API base URL (no trailing slash)
VITE_API_URL=https://your-api-domain.com/backend/api

# Google OAuth 2.0 Web client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# App base path: /theurbanphysio for local subfolder, empty for domain root
VITE_APP_BASE_PATH=/theurbanphysio
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Recommended | Backend API origin. Some environments fall back to runtime detection if unset. |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Enables Google Sign-In. |
| `VITE_APP_BASE_PATH` | Optional | Vite `base` path. Use `""` on Cloudflare Pages when the site is at the domain root. |

> **Never commit** production secrets or `.env` files with live credentials.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server + HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |

---

## Deployment (Cloudflare Pages)

1. Connect **[CodeWaveStudio/theurbanphysio](https://github.com/CodeWaveStudio/theurbanphysio)** to Cloudflare Pages.
2. Build settings:
   - **Framework preset:** Vite (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (frontend repo) or `frontend` (monorepo)
3. Set environment variables:
   - `VITE_API_URL`
   - `VITE_GOOGLE_CLIENT_ID` (optional)
   - `VITE_APP_BASE_PATH=""` (domain root)
4. Keep `public/_redirects` so SPA client routes resolve correctly.

Production traffic is served from Cloudflare’s global CDN.

---

## Performance Notes

- Vite + Rollup production bundles with hashed assets under `dist/app/`
- CSS minify is intentionally disabled in Vite config so Font Awesome unicode escapes stay intact
- SPA fallback via `_redirects` for deep links
- Edge caching for HTML, JS, CSS, and static media

---

## Security (Frontend)

- JWT stored in `localStorage`; Axios attaches `Authorization` headers
- `ProtectedRoute` guards by role (`patient`, `doctor`, `clinic`, `clinic_staff`, `admin`, …)
- Google OAuth and OTP flows where enabled
- API errors surfaced safely to users (no raw server internals)
- HTTPS via Cloudflare in production

Rotate OAuth client credentials and keep npm dependencies updated regularly.

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome (latest) | Full |
| Firefox (latest) | Full |
| Safari (latest) | Full |
| Edge (latest) | Full |
| Mobile Safari / Chrome | Optimized |

Requires modern browsers with ES module support.

---

## Contributing

Maintained by **CodeWave Studio**. For authorized contributors:

1. Branch from `main`.
2. Match existing component and naming patterns.
3. Smoke-test auth, booking, and the portals you touch.
4. Keep PRs focused and descriptive.

External contributors: contact maintainers before large changes.

---

## License

**Proprietary software** for **The Urban Physio**, developed by **CodeWave Studio**.

Unauthorized copying, distribution, or modification is prohibited unless explicitly permitted by the copyright holder.

---

## Developed By

**CodeWave Studio**

Building high-performance digital solutions for healthcare, SaaS, and modern web platforms.

| | |
|---|---|
| Website | [codewavestudio.space](https://codewavestudio.space) |
| GitHub | [github.com/CodeWaveStudio](https://github.com/CodeWaveStudio) |
| Tagline | *Building High-Performance Digital Solutions* |

---

<p align="center">
  <strong>The Urban Physio</strong> · Frontend · React + Vite + Tailwind CSS<br/>
  by <a href="https://codewavestudio.space">CodeWave Studio</a>
</p>
