import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const MIN_WIDTH = 240;
const MAX_WIDTH = 400;
// Every change to GoogleLogin's width prop re-runs google.accounts.id.initialize(),
// so only react to real layout changes — not the few px of jitter a scrollbar or
// font swap produces. Rendering starts once a measurement exists, which keeps the
// common case down to a single initialize() call.
const WIDTH_CHANGE_THRESHOLD = 24;

export default function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }) {
  const containerRef = useRef(null);
  const [btnWidth, setBtnWidth] = useState(null);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      const available = Math.floor(el.getBoundingClientRect().width);
      if (available <= 0) return;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, available));
      setBtnWidth((prev) =>
        prev !== null && Math.abs(prev - next) < WIDTH_CHANGE_THRESHOLD ? prev : next,
      );
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    window.addEventListener('resize', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  if (!clientId) {
    if (import.meta.env.DEV) {
      return (
        <p className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Google Sign-In unavailable: set <code>VITE_GOOGLE_CLIENT_ID</code> in frontend env.
        </p>
      );
    }
    return null;
  }

  if (scriptError) {
    return (
      <p className="text-center text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
        Google Sign-In failed to load. Disable ad-blockers and refresh, or use email registration.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="google-signin-wrap w-full min-w-0">
      <div className="google-signin-inner flex justify-center w-full min-h-[44px]">
        {btnWidth !== null && (
          <GoogleLogin
            onSuccess={(res) => {
              if (res?.credential) {
                onSuccess(res.credential);
              } else {
                onError?.({ message: 'Google did not return a sign-in credential' });
              }
            }}
            onError={() => {
              setScriptError(false);
              onError?.({ message: 'Google sign-in was cancelled or blocked by the browser' });
            }}
            useOneTap={false}
            theme="outline"
            size="large"
            width={String(btnWidth)}
            text={text}
            shape="rectangular"
            locale="en"
            context={text === 'signup_with' ? 'signup' : 'signin'}
          />
        )}
      </div>
    </div>
  );
}

export function hasGoogleAuth() {
  return Boolean(clientId);
}
