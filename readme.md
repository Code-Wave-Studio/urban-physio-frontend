# The Urban Physio — Frontend

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#-license)

A modern, responsive frontend for **The Urban Physio** — a digital healthcare platform that helps patients discover physiotherapists and clinics, book appointments, manage treatment packages, and access physiotherapy services online or in person.

Built with **React**, **Vite**, and **Tailwind CSS**, and deployed on **Cloudflare Pages**.

---

## 📋 Project Overview

**The Urban Physio** connects patients with verified physiotherapists and partner clinics across India. The frontend delivers a fast, mobile-first experience for:

- Browsing doctors and clinics with search, filters, and location-aware listings
- Booking **clinic visits**, **online consultations**, and **home visits**
- Managing appointments, packages, prescriptions, and saved providers
- Role-based dashboards for **patients**, **doctors**, and **administrators**

The app communicates with a REST API backend and is optimized for performance, accessibility, and SEO-friendly public profile pages.

---

## ✨ Key Features

| Area | Highlights |
|------|------------|
| 👤 **Patient Dashboard** | Appointments, treatment packages, saved doctors/clinics, reports, and profile management |
| 🩺 **Doctor Dashboard** | Appointments, patients, clinics, availability, earnings, emergency queue, and prescriptions |
| 🏥 **Clinic Profiles** | Rich clinic pages with gallery, reviews, facilities, doctors, and quick actions |
| 📅 **Appointment Booking** | Multi-step booking wizard with slot selection, coupons, and policy acceptance |
| 💻 **Online Consultation** | Zoom Server-to-Server OAuth video meetings with join/start links |
| 🏠 **Home Visit Booking** | Schedule home-based physiotherapy with location and condition details |
| 🏨 **Clinic Visit Booking** | In-clinic appointments with real-time slot previews |
| 🔐 **Google Login** | OAuth sign-in via `@react-oauth/google` |
| 📱 **Responsive Design** | Mobile-first layouts with dedicated navigation drawer and touch-friendly UI |
| 🎨 **Modern UI/UX** | Glassmorphism cards, motion transitions, directory listings, and profile previews |
| 🔒 **Secure Authentication** | JWT-based sessions, OTP login, role-protected routes, and password flows |
| ⚡ **Fast Performance** | Vite bundling, code splitting readiness, and CDN deployment on Cloudflare |

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| [React](https://react.dev/) | UI library and component architecture |
| [Vite](https://vitejs.dev/) | Dev server, HMR, and production builds |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling and design system |
| JavaScript (ES modules) | Application logic |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | REST API client |
| [Framer Motion](https://www.framer.com/motion/) | Animations and transitions |
| REST API | Backend integration (PHP/MySQL API) |
| [Cloudflare Pages](https://pages.cloudflare.com/) | Static hosting and global CDN |

---

## 📁 Folder Structure

```
frontend/
├── public/                 # Static assets, SPA redirects (_redirects)
├── src/
│   ├── components/         # Reusable UI (booking, clinic, doctor, nav, seo, …)
│   ├── constants/          # Navigation, policy, and portal configuration
│   ├── contexts/           # React context (auth, location, contact, cookies)
│   ├── hooks/              # Custom hooks (preview, location, deep links)
│   ├── pages/              # Route-level views
│   │   ├── admin/          # Admin dashboard screens
│   │   ├── auth/           # Login, register, OTP portals
│   │   ├── doctor/         # Doctor dashboard screens
│   │   └── patient/        # Patient dashboard screens
│   ├── services/           # API layer (api.js)
│   ├── utils/              # Helpers (URLs, booking, media, search)
│   ├── App.jsx             # Route definitions
│   ├── main.jsx            # App entry and providers
│   └── index.css           # Global styles and Tailwind layers
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ recommended
- **npm** 9+
- Access to the Urban Physio REST API (local XAMPP or hosted backend)

### 1. Clone the repository

```bash
git clone https://github.com/CodeWaveStudio/theurbanphysio.git
cd theurbanphysio/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `frontend` directory (see [Environment Variables](#-environment-variables)).

### 4. Run the development server

```bash
npm run dev
```

The app runs at **http://localhost:5173** by default. Vite proxies API requests to your local backend when configured.

### 5. Build for production

```bash
npm run build
```

Output is written to `frontend/dist/`.

### 6. Preview the production build locally

```bash
npm run preview
```

---

## 🔐 Environment Variables

Create `frontend/.env` (or set variables in **Cloudflare Pages → Settings → Environment variables**):

```env
# REST API base URL (no trailing slash)
VITE_API_URL=https://your-api-domain.com/backend/api

# Google OAuth 2.0 client ID (Web application)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# App base path: /theurbanphysio for local subfolder, empty for production root
VITE_APP_BASE_PATH=/theurbanphysio
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Recommended | Full URL to the backend API. Falls back to runtime detection if unset in some environments. |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Enables Google Sign-In when provided. |
| `VITE_APP_BASE_PATH` | Optional | URL base for Vite `base` and dev proxy. Use empty string (`""`) on Cloudflare Pages at domain root. |

> **Note:** Never commit secrets or production `.env` files to version control.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Create optimized production build in `dist/` |
| `npm run preview` | Serve the production build locally |

---

## ☁️ Deployment

This frontend is deployed using **Cloudflare Pages**.

**Typical setup:**

1. Connect the GitHub repository to Cloudflare Pages.
2. Set **Root directory** to `frontend` (if monorepo) or repository root (if frontend-only).
3. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add environment variables (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_APP_BASE_PATH=""`).
5. Ensure `public/_redirects` is included so client-side routes work (SPA fallback).

The production site is served globally via Cloudflare’s CDN for low latency and high availability.

---

## ⚡ Performance

- **Vite** for fast cold starts in development and efficient Rollup-based production bundles
- Static asset output under `dist/static/` for cache-friendly delivery
- Lazy-friendly route structure and lightweight API client patterns
- Image and media URL helpers for optimized asset loading
- Cloudflare edge caching for HTML, JS, CSS, and static files

---

## Zoom video consultations (backend)

Online appointments use **Zoom Server-to-Server OAuth** (no frontend secrets).

1. Create a Server-to-Server OAuth app in the [Zoom Marketplace](https://marketplace.zoom.us/).
2. Add meeting scopes (e.g. `meeting:write:admin`, `meeting:read:admin`).
3. Copy Account ID, Client ID, and Client Secret into `backend/.env`:

```env
ZOOM_ENABLED=true
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
```

4. Optional SQL migration: `backend/api/migrations/2026_07_28_zoom_meetings.sql`  
   (columns are also auto-created by `ZoomMeetingHelper::ensureSchema`.)

5. Flow: patient books → doctor/admin confirms (or payment confirms) → backend creates Zoom meeting → join/start URLs saved → emails sent → Join/Start buttons appear.

Admin UI: `/admin/zoom` (meetings + API logs).

See also `backend/.env.example`.

---

## 🔒 Security

- JWT tokens stored in `localStorage` with axios request interceptors
- Role-based route guards (`ProtectedRoute`) for patient, doctor, and admin areas
- Google OAuth for passwordless / social login where enabled
- OTP-based phone and email verification flows
- API errors handled without exposing sensitive server details to end users
- HTTPS enforced in production via Cloudflare

Always keep dependencies updated and rotate API keys and OAuth credentials on a regular schedule.

---

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome (latest) | ✅ Full |
| Firefox (latest) | ✅ Full |
| Safari (latest) | ✅ Full |
| Edge (latest) | ✅ Full |
| Mobile Safari / Chrome | ✅ Optimized |

Modern browsers with ES module support are required.

---

## 🤝 Contributing

This repository is maintained by **CodeWave Studio**. For internal or authorized contributors:

1. Create a feature branch from `main`.
2. Follow existing code style and component patterns.
3. Test booking, auth, and dashboard flows before opening a pull request.
4. Keep commits focused and descriptive.

For external contributions, please contact the maintainers before submitting large changes.

---

## 📄 License

This project is **proprietary software** developed for **The Urban Physio** by **CodeWave Studio**.

Unauthorized copying, distribution, or modification of this codebase is prohibited unless explicitly permitted by the copyright holder.

---

## 👨‍💻 Developed By

**CodeWave Studio**

Building high-performance digital solutions for healthcare, SaaS, and modern web platforms.

| | |
|---|---|
| 🌐 **Website** | [codewavestudio.space](https://codewavestudio.space) |
| 🐙 **GitHub** | [github.com/CodeWaveStudio](https://github.com/CodeWaveStudio) |
| 💡 **Tagline** | *Building High-Performance Digital Solutions* |

---

<p align="center">
  <strong>The Urban Physio</strong> · Frontend · React + Vite + Tailwind CSS
</p>
