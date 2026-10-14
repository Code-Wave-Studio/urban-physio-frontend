import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildKinesteXLaunchPostData,
  isKinesteXReplaySessionId,
  kinesteXStyleName,
} from '../../services/kinestexSessionBoundary';

const DEFAULT_ORIGIN = 'https://ai.kinestex.com';
const LAUNCH_WAIT_MS = 20000;

/**
 * Official KinesteX post-session 3D / skeletal replay.
 * The player route is `session/{numericId}`. Landmark frames, timestamps, and the
 * skeletal model stay in KinesteX (downloaded by that page when has_motion_recording
 * is set). This host only supplies a server-minted launch session and the original userId.
 * Docs: https://www.kinestex.com/docs/guides/guide-completed-workouts
 * The current web player reads launch fields from the postMessage object itself.
 * It does not read a nested customParameters bag, and it compares style to "light"/"dark".
 */
export default function KinesteXSessionReplay({ sdk, onExit, onError, className = '' }) {
  const iframeRef = useRef(null);
  const launchedRef = useRef(false);
  const onExitRef = useRef(onExit);
  const onErrorRef = useRef(onError);
  const [loading, setLoading] = useState(true);
  const [frameError, setFrameError] = useState('');
  onExitRef.current = onExit;
  onErrorRef.current = onError;

  const origin = useMemo(() => {
    const base = String(sdk?.base_url || DEFAULT_ORIGIN).replace(/\/$/, '');
    try {
      return new URL(base).origin;
    } catch {
      return DEFAULT_ORIGIN;
    }
  }, [sdk?.base_url]);

  const providerSessionId = isKinesteXReplaySessionId(sdk?.provider_session_id)
    ? String(sdk.provider_session_id).trim()
    : '';

  const launchPayload = useMemo(() => buildKinesteXLaunchPostData(sdk), [sdk]);

  const src = useMemo(() => {
    if (!providerSessionId || !launchPayload) return '';
    const route = sdk?.route
      ? String(sdk.route).replace(/^\//, '')
      : `session/${encodeURIComponent(providerSessionId)}`;
    const style = kinesteXStyleName(launchPayload.style, 'light');
    return `${origin}/${route}${route.includes('?') ? '&' : '?'}style=${encodeURIComponent(style)}`;
  }, [origin, providerSessionId, launchPayload, sdk?.route]);

  const postCredentials = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !launchPayload || launchedRef.current) return;
    try {
      win.postMessage(launchPayload, origin);
    } catch {
      /* ignore cross-origin post failures */
    }
  };

  useEffect(() => {
    launchedRef.current = false;
    setLoading(true);
    setFrameError('');
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
      if (type === 'kinestex_loaded') {
        postCredentials();
      }
      if (type === 'kinestex_launched') {
        launchedRef.current = true;
        setLoading(false);
        setFrameError('');
      }
      if (type === 'exit_kinestex' || type === 'workout_exit_request') {
        onExitRef.current?.();
      }
      if (type === 'error_occurred') {
        const msg = 'Movement replay could not be loaded for this session.';
        launchedRef.current = true;
        setFrameError(msg);
        setLoading(false);
        onErrorRef.current?.(msg, data);
      }
    };
    window.addEventListener('message', onMessage);
    const retry = window.setInterval(() => {
      if (!launchedRef.current) postCredentials();
    }, 1500);
    const giveUp = window.setTimeout(() => {
      if (launchedRef.current) return;
      const msg = 'Movement replay did not finish loading. Try again in a moment.';
      setFrameError(msg);
      setLoading(false);
      onErrorRef.current?.(msg);
    }, LAUNCH_WAIT_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearInterval(retry);
      window.clearTimeout(giveUp);
    };
    // Callbacks are read from refs so a parent re-render does not restart the launch timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, src, launchPayload]);

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
        onLoad={() => postCredentials()}
      />
    </div>
  );
}
