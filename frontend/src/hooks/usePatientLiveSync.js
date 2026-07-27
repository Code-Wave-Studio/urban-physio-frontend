import { useEffect, useRef, useState } from 'react';
import { API_BASE, patientPortal } from '../services/api';

/**
 * Patient-side live sync: SSE first, 2.5s poll fallback for appointment/mode updates.
 */
export default function usePatientLiveSync(onEvent, options = {}) {
  const { enabled = true, interval = 2500, useEventSource = true } = options;
  const callbackRef = useRef(onEvent);
  const lastIdRef = useRef(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => { callbackRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!enabled) {
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
      callbackRef.current?.(event);
    };

    const poll = async () => {
      try {
        const res = await patientPortal.liveEvents({ last_id: lastIdRef.current });
        const data = res.data || res || {};
        const events = data.events || [];
        if (!active) return;
        events.forEach(deliver);
        setConnected(true);
      } catch {
        if (active) setConnected(false);
      } finally {
        if (active && !usingSse) timer = window.setTimeout(poll, interval);
      }
    };

    if (useEventSource && typeof EventSource !== 'undefined') {
      const token = localStorage.getItem('token') || '';
      const url = `${API_BASE}/patient-portal/live/stream?last_id=${lastIdRef.current}&token=${encodeURIComponent(token)}`;
      source = new EventSource(url);
      usingSse = true;
      source.onopen = () => setConnected(true);
      source.onmessage = (message) => {
        try { deliver({ id: message.lastEventId, ...JSON.parse(message.data || '{}') }); } catch { /* ignore */ }
      };
      ['appointment.mode_changed', 'appointment.updated', 'appointment.booked', 'appointments.created', 'queue.check_in'].forEach((name) => {
        source.addEventListener(name, (message) => {
          try { deliver({ id: message.lastEventId, event_type: name, ...JSON.parse(message.data || '{}') }); } catch { /* ignore */ }
        });
      });
      source.onerror = () => {
        setConnected(false);
        source?.close();
        usingSse = false;
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
  }, [enabled, interval, useEventSource]);

  return { connected };
}
