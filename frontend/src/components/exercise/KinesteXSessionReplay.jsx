import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ORIGIN = 'https://ai.kinestex.com';

/**
 * Official KinesteX post-session movement / skeleton replay.
 * Docs: route `session/{id}` with company key + original userId
 * (https://www.kinestex.com/docs/guides/guide-completed-workouts).
 * SDK 0.0.3 has no createCustomComponentView — HTML/JS iframe + postMessage used.
 * Does not fabricate landmarks or replay URLs.
 */
export default function KinesteXSessionReplay({ sdk, onExit, onError, className = '' }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [frameError, setFrameError] = useState('');

  const origin = useMemo(() => {
    const base = String(sdk?.base_url || DEFAULT_ORIGIN).replace(/\/$/, '');
    try {
      return new URL(base).origin;
    } catch {
      return DEFAULT_ORIGIN;
    }
  }, [sdk?.base_url]);

  const providerSessionId = sdk?.provider_session_id
    ? String(sdk.provider_session_id).trim()
    : '';

  const src = useMemo(() => {
    if (!providerSessionId) return '';
    const route = sdk?.route
      ? String(sdk.route).replace(/^\//, '')
      : `session/${encodeURIComponent(providerSessionId)}`;
    const style = sdk?.style?.style ? String(sdk.style.style) : 'light';
    return `${origin}/${route}${route.includes('?') ? '&' : '?'}style=${encodeURIComponent(style)}`;
  }, [origin, providerSessionId, sdk?.route, sdk?.style]);

  const postCredentials = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !sdk?.key || !sdk?.company || !sdk?.userId) return;
    const payload = {
      key: String(sdk.key),
      company: String(sdk.company),
      userId: String(sdk.userId),
    };
    if (sdk.style && typeof sdk.style === 'object') {
      payload.style = sdk.style;
    }
    try {
      win.postMessage(payload, origin);
    } catch {
      /* ignore cross-origin post failures */
    }
  };

  useEffect(() => {
    if (!src) return undefined;
    const onMessage = (event) => {
      if (event.origin !== origin) return;
      let data = event.data;
      try {
        if (typeof data === 'string') data = JSON.parse(data);
      } catch {
        return;
      }
      const type = data?.type;
      if (!type) return;
      if (type === 'kinestex_loaded' || type === 'kinestex_launched') {
        setLoading(false);
        postCredentials();
      }
      if (type === 'exit_kinestex' || type === 'workout_exit_request') {
        onExit?.();
      }
      if (type === 'error_occurred') {
        const msg = 'Movement replay could not be loaded for this session.';
        setFrameError(msg);
        setLoading(false);
        onError?.(msg, data);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- postCredentials closes over latest sdk
  }, [origin, src, onExit, onError, sdk]);

  if (!providerSessionId || !src) {
    return (
      <div className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center ${className}`}>
        <p className="text-sm text-slate-600">Movement analysis is not available for this session.</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 ${className}`}>
      {(loading || frameError) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 px-4 text-center">
          {frameError ? (
            <p className="text-sm text-rose-200">{frameError}</p>
          ) : (
            <p className="text-sm text-slate-200">Loading KinesteX movement replay…</p>
          )}
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="KinesteX movement analysis"
        src={src}
        className="block w-full border-0"
        style={{ minHeight: 'min(70vh, 520px)', height: 'min(70vh, 520px)', aspectRatio: '16 / 10' }}
        allow="autoplay; clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
        onLoad={() => {
          setLoading(false);
          postCredentials();
        }}
      />
    </div>
  );
}
