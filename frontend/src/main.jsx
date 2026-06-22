import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { LocationProvider } from './contexts/LocationContext';
import { ContactProvider } from './contexts/ContactContext';
import FloatingActions from './components/FloatingActions';
import HapticsRoot from './components/HapticsRoot';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';

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
            <App />
            <HapticsRoot />
            <FloatingActions />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-card !bg-white/90 !backdrop-blur-xl !border-white/80 !text-slate-800 !shadow-lg',
              style: { padding: '12px 16px' },
            }}
          />
          </LocationProvider>
          </ContactProvider>
        </CookieConsentProvider>
    </AppProviders>
  </React.StrictMode>
);
