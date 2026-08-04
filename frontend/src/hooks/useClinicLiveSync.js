import { useEffect, useRef, useState } from 'react';
import { API_BASE, clinicPortal } from '../services/api';

/**
 * Near-real-time clinic sync: EventSource (SSE) primary + fast JSON poll fallback.
 * Auth via ?token= for EventSource (Bearer headers are not supported by EventSource).
 */
export default function useClinicLiveSync(clinicId, onEvent, options = {}) {
  const {
    enabled = true,
    interval = 2000,
    useEventSource = true,
  } = options;
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
    let usingSse = false;

    const deliver = (event) => {
      const id = Number(event.id || event.event_id || 0);
      if (id > lastIdRef.current) lastIdRef.current = id;
      setLastEventAt(new Date());
      callbackRef.current?.(event);
      window.dispatchEvent(new Event('notifications-updated'));
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
        if (active && !usingSse) timer = window.setTimeout(poll, interval);
      }
    };

    const startPoll = () => {
      usingSse = false;
      window.clearTimeout(timer);
      poll();
    };

    if (useEventSource && typeof EventSource !== 'undefined') {
      const token = localStorage.getItem('token') || '';
      const url = `${API_BASE}/clinic-portal/${clinicId}/live/stream?last_id=${lastIdRef.current}&token=${encodeURIComponent(token)}`;
      source = new EventSource(url);
      usingSse = true;
      source.onopen = () => setConnected(true);
      source.onmessage = (message) => {
        try {
          deliver({ id: message.lastEventId, ...JSON.parse(message.data || '{}') });
        } catch {
          /* heartbeat / malformed */
        }
      };
      source.addEventListener('appointment.booked', (message) => {
        try { deliver({ id: message.lastEventId, ...JSON.parse(message.data || '{}'), event_type: 'appointment.booked' }); } catch { /* ignore */ }
      });
      source.addEventListener('appointment.mode_changed', (message) => {
        try { deliver({ id: message.lastEventId, ...JSON.parse(message.data || '{}'), event_type: 'appointment.mode_changed' }); } catch { /* ignore */ }
      });
      source.addEventListener('appointments.created', (message) => {
        try { deliver({ id: message.lastEventId, ...JSON.parse(message.data || '{}'), event_type: 'appointments.created' }); } catch { /* ignore */ }
      });
      source.addEventListener('queue.check_in', (message) => {
        try { deliver({ id: message.lastEventId, ...JSON.parse(message.data || '{}'), event_type: 'queue.check_in' }); } catch { /* ignore */ }
      });
      source.onerror = () => {
        setConnected(false);
        source?.close();
        source = null;
        if (active) startPoll();
      };
      // Safety net: also poll slowly while SSE is up so missed named events still land
      timer = window.setTimeout(function safetyPoll() {
        if (!active) return;
        clinicPortal.liveEvents(clinicId, { last_id: lastIdRef.current })
          .then((res) => {
            const data = res.data || res || {};
            const events = data.items || data.events || [];
            events.forEach(deliver);
          })
          .catch(() => {})
          .finally(() => {
            if (active && usingSse) timer = window.setTimeout(safetyPoll, Math.max(interval * 4, 8000));
          });
      }, Math.max(interval * 4, 8000));
    } else {
      startPoll();
    }

    return () => {
      active = false;
      window.clearTimeout(timer);
      source?.close();
    };
  }, [clinicId, enabled, interval, useEventSource]);

  return { connected, lastEventAt };
}
