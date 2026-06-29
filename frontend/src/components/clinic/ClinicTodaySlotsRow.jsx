import { useEffect, useState } from 'react';
import FaIcon from '../FaIcon';
import { booking } from '../../services/api';
import { formatSlotLabel } from '../../utils/bookingScheduleUtils';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Today's available slots — horizontal scroll chip row for clinic cards.
 */
export default function ClinicTodaySlotsRow({ clinicId, className = '' }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) {
      setSlots([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const today = todayIso();
    booking
      .availableDates({ clinic_id: clinicId, days: 7 })
      .then((res) => {
        const dates = res?.data ?? res ?? [];
        const pick = dates.includes(today) ? today : dates[0];
        if (!pick) return [];
        return booking.slots(null, pick, clinicId).then((r) => ({
          date: pick,
          slots: (r?.data ?? r ?? []).filter((s) => s.available !== false),
        }));
      })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setSlots([]);
          return;
        }
        setSlots(result.slots.slice(0, 12));
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  if (loading) {
    return (
      <p className={`text-[11px] text-slate-400 flex items-center gap-1.5 ${className}`}>
        <FaIcon icon="fa-spinner" className="fa-spin text-[10px]" />
        Loading slots…
      </p>
    );
  }

  if (!slots.length) {
    return (
      <p className={`text-[11px] text-slate-500 ${className}`}>No slots available today</p>
    );
  }

  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Today&apos;s slots</p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slots.map((s) => {
          const time = s.time || s.value;
          const label = s.label || formatSlotLabel(time);
          return (
            <span
              key={time}
              className="shrink-0 snap-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] font-semibold whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
