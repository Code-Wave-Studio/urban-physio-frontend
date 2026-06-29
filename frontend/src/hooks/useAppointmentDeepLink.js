import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { findAppointmentInList, scrollToAppointmentElement } from '../utils/notificationRoutes';

/**
 * Highlights and scrolls to an appointment when URL has ?appt= or ?booking=
 */
export default function useAppointmentDeepLink(list) {
  const [searchParams] = useSearchParams();
  const apptParam = searchParams.get('appt');
  const bookingParam = searchParams.get('booking');
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    if (!list?.length || (!apptParam && !bookingParam)) {
      setHighlightId(null);
      return;
    }
    const match = findAppointmentInList(list, { apptId: apptParam, bookingId: bookingParam });
    if (!match) return;
    setHighlightId(match.id);
    scrollToAppointmentElement(match.id);
  }, [list, apptParam, bookingParam]);

  return highlightId;
}
