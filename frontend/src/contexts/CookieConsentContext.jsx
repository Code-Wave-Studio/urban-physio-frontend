import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearNonEssentialCookieData,
  readCookieConsent,
  writeCookieConsent,
} from '../constants/cookieConsent';
import CookieConsentUI from '../components/CookieConsentUI';
import { syncAnalyticsConsent } from '../utils/analytics';

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(null);
  const [ready, setReady] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    setConsent(stored);
    setShowBanner(!stored);
    setReady(true);
  }, []);

  const applyConsent = useCallback((prefs) => {
    if (!prefs.functional) {
      clearNonEssentialCookieData();
    }
    const saved = writeCookieConsent(prefs);
    syncAnalyticsConsent(saved);
    setConsent(saved);
    setShowBanner(false);
    setShowPreferences(false);
    window.dispatchEvent(new CustomEvent('tup-cookie-consent-updated', { detail: saved }));
  }, []);

  const acceptAll = useCallback(() => {
    applyConsent({ functional: true, analytics: true });
  }, [applyConsent]);

  const rejectOptional = useCallback(() => {
    applyConsent({ functional: false, analytics: false });
  }, [applyConsent]);

  const savePreferences = useCallback(
    (prefs) => {
      applyConsent(prefs);
    },
    [applyConsent]
  );

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
    setShowBanner(false);
  }, []);

  const value = {
    ready,
    consent,
    hasConsented: !!consent,
    showBanner,
    showPreferences,
    setShowPreferences,
    acceptAll,
    rejectOptional,
    savePreferences,
    openPreferences,
    functional: consent?.functional === true,
    analytics: consent?.analytics === true,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {ready && (
        <CookieConsentUI
          showBanner={showBanner}
          showPreferences={showPreferences}
          consent={consent}
          onAcceptAll={acceptAll}
          onRejectOptional={rejectOptional}
          onSavePreferences={savePreferences}
          onOpenPreferences={() => {
            setShowPreferences(true);
            setShowBanner(false);
          }}
          onClosePreferences={() => setShowPreferences(false)}
        />
      )}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

/** Safe hook for Footer etc. — returns null if provider missing */
export function useCookieConsentOptional() {
  return useContext(CookieConsentContext);
}
