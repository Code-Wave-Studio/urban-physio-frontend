import { useEffect, useRef, useState } from 'react';
import { API_BASE, clinicPortal } from '../services/api';

/**
 * Lightweight clinic event sync. Polling is the reliable default; SSE can be
 * enabled where the deployment supports authenticated EventSource requests.
 */
export default function useClinicLiveSync(clinicId, onEvent, options = {}) {
  const { enabled = true, interval = 8000, useEventSource = false } = options;
  const callbackRef = useRef(onEvent);
  const lastIdRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState(null);

  useEffect(() => { callbackRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!clinicId || !enabled) {
      setConnected(false);
      return undefined;
    }
    let active = true;
    let timer;
    let source;

    const deliver = (event) => {
      const id = Number(event.id || event.event_id || 0);
      if (id > lastIdRef.current) lastIdRef.current = id;
      setLastEventAt(new Date());
      callbackRef.current?.(event);
    };

    const poll = async () => {
      try {
        const res = await clinicPortal.liveEvents(clinicId, { last_id: lastIdRef.current });
        const data = res.data || res || {};
        const events = data.items || data.events || (Array.isArray(data) ? data : []);
        if (!active) return;
        events.forEach(deliver);
        setConnected(true);
      } catch {
        if (active) setConnected(false);
      } finally {
        if (active) timer = window.setTimeout(poll, interval);
      }
    };

    if (useEventSource && typeof EventSource !== 'undefined') {
      const token = localStorage.getItem('token') || '';
      const url = `${API_BASE}/clinic-portal/${clinicId}/live/stream?last_id=${lastIdRef.current}&token=${encodeURIComponent(token)}`;
      source = new EventSource(url);
      source.onopen = () => setConnected(true);
      source.onmessage = (message) => {
        try { deliver({ id: message.lastEventId, ...JSON.parse(message.data || '{}') }); } catch { /* ignore malformed heartbeat */ }
      };
      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (active) poll();
      };
    } else {
      poll();
    }

    return () => {
      active = false;
      window.clearTimeout(timer);
      source?.close();
    };
  }, [clinicId, enabled, interval, useEventSource]);

  return { connected, lastEventAt };
}
