import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from './FaIcon';
import GlassModal, { GlassModalHeader } from './GlassModal';
import { COOKIE_CATEGORIES } from '../constants/cookieConsent';

export default function CookieConsentUI({
  showBanner,
  showPreferences,
  consent,
  onAcceptAll,
  onRejectOptional,
  onSavePreferences,
  onOpenPreferences,
  onClosePreferences,
}) {
  const [prefs, setPrefs] = useState({
    functional: consent?.functional ?? false,
    analytics: consent?.analytics ?? false,
  });

  useEffect(() => {
    if (showPreferences) {
      setPrefs({
        functional: consent?.functional ?? false,
        analytics: consent?.analytics ?? false,
      });
    }
  }, [showPreferences, consent]);

  const toggle = (key) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <>
      {/* Bottom banner — first visit */}
      {showBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[9990] p-3 sm:p-4 pointer-events-none"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 overflow-hidden">
            <div className="p-4 sm:p-5 md:flex md:items-center md:gap-6">
              <div className="flex gap-3 flex-1 min-w-0 mb-4 md:mb-0">
                <span className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FaIcon icon="fa-cookie-bite" className="text-lg" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">We use cookies</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Essential cookies run login and booking. Optional cookies remember your city and help us improve
                    the site. Read our{' '}
                    <Link to="/cookie-policy" className="text-primary-600 font-medium hover:underline">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
              <div className="flex flex-col xs:flex-row flex-wrap gap-2 shrink-0">
                <button type="button" onClick={onRejectOptional} className="btn-outline text-sm py-2.5 px-4">
                  Reject
                </button>
                <button type="button" onClick={onAcceptAll} className="btn-primary text-sm py-2.5 px-4">
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      <GlassModal
        open={showPreferences}
        onClose={onClosePreferences}
        size="lg"
        titleId="cookie-preferences-title"
        zIndex={10001}
      >
        <GlassModalHeader
          titleId="cookie-preferences-title"
          title="Cookie preferences"
          subtitle="Choose which optional cookies we may use. Essential cookies are always on."
          icon="fa-cookie-bite"
          accent="primary"
          onClose={onClosePreferences}
        />
        <div className="p-5 md:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {COOKIE_CATEGORIES.map((cat) => {
            const isEssential = cat.required;
            const checked = isEssential ? true : prefs[cat.id];
            return (
              <div
                key={cat.id}
                className={`rounded-xl border p-4 ${isEssential ? 'border-slate-200 bg-slate-50' : 'border-white/80 bg-white/60'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                      <FaIcon icon={cat.icon} className="text-sm" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 flex items-center gap-2">
                        {cat.label}
                        {isEssential && (
                          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            Always active
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{cat.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={checked}
                      disabled={isEssential}
                      onChange={() => !isEssential && toggle(cat.id)}
                    />
                    <span
                      className={`w-11 h-6 rounded-full transition ${
                        isEssential ? 'bg-slate-300' : 'bg-slate-200 peer-checked:bg-primary-600'
                      } peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-5 ${isEssential ? 'opacity-70' : ''}`}
                    />
                  </label>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-slate-500">
            Third-party services (Razorpay, maps) may set their own cookies when you use those features. See{' '}
            <Link to="/cookie-policy" className="text-primary-600 hover:underline" onClick={onClosePreferences}>
              Cookie Policy
            </Link>
            .
          </p>
        </div>
        <div className="glass-modal-footer flex flex-wrap gap-2 justify-end p-4 md:p-5">
          <button type="button" className="btn-outline text-sm" onClick={onRejectOptional}>
            Reject
          </button>
          <button type="button" className="btn-primary text-sm" onClick={() => onSavePreferences(prefs)}>
            Accept
          </button>
        </div>
      </GlassModal>
    </>
  );
}
