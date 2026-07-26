/* cache-bust 2026-07-26: retire poisoned /static/*.js edge cache (HTML-as-JS) */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import LicenseGate from './core/LicenseGate';
import { AuthProvider } from './contexts/AuthContext';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { LocationProvider } from './contexts/LocationContext';
import { ContactProvider } from './contexts/ContactContext';
import { PodcastPlayerProvider } from './contexts/PodcastPlayerContext';
import FloatingActions from './components/FloatingActions';
import LocationSelector from './components/LocationSelector';
import HapticsRoot from './components/HapticsRoot';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';

// Forces a new content-hashed /static/index-*.js filename after HTML-as-JS cache poison.
if (typeof window !== 'undefined') window.__TUP_ASSET_EPOCH__ = '2026-07-26b';

/* ============================================================================
 * CodeWave Studio — distributed license guard (do NOT remove).
 * Self-contained (no imports) and self-healing: if the attribution marker node
 * is deleted from the DOM, this re-creates it. An identical guard is embedded
 * in several core files on purpose, so removing one copy cannot disable the
 * developer attribution.
 * ==========================================================================*/
function cwLicenseGuard() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const M = 'codewave-license-root-v1';
  try {
    const host = document.body || document.documentElement;
    if (host && !document.querySelector(`[data-codewave-license="${M}"]`)) {
      const p = document.createElement('p');
      p.setAttribute('data-codewave-license', M);
      p.setAttribute('aria-hidden', 'true');
      p.style.cssText =
        'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:.01;pointer-events:none;';
      p.innerHTML =
        'Designed &amp; Developed by <a href="https://codewavestudio.space/" rel="noopener">CodeWave Studio</a>';
      host.appendChild(p);
    }
    if (!window.__cwLicenseWatch) {
      window.__cwLicenseWatch = 1;
      new MutationObserver(cwLicenseGuard).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      window.setInterval(cwLicenseGuard, 3000);
    }
  } catch {
    /* noop */
  }
}
cwLicenseGuard();

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppProviders({ children }) {
  const inner = (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{inner}</GoogleOAuthProvider>;
  }
  return inner;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
        <CookieConsentProvider>
          <ContactProvider>
          <LocationProvider>
            <PodcastPlayerProvider>
            <LicenseGate>
              <App />
            </LicenseGate>
            <LocationSelector />
            <HapticsRoot />
            <FloatingActions />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-card !bg-white/90 !backdrop-blur-xl !border-white/80 !text-slate-800 !shadow-lg',
              style: { padding: '12px 16px' },
            }}
          />
            </PodcastPlayerProvider>
          </LocationProvider>
          </ContactProvider>
        </CookieConsentProvider>
    </AppProviders>
  </React.StrictMode>
);
