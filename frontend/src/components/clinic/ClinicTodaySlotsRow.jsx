import { useEffect, useState } from 'react';
import FaIcon from '../FaIcon';
import { booking } from '../../services/api';
import { formatSlotLabel } from '../../utils/bookingScheduleUtils';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Today's available slots — horizontal scroll on cards; wrapped grid in modals.
 * @param {{ clinicId?: number|string, className?: string, variant?: 'card' | 'modal' }} props
 */
export default function ClinicTodaySlotsRow({ clinicId, className = '', variant = 'card' }) {
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

  const isModal = variant === 'modal';

  if (loading) {
    return (
      <p
        className={`${isModal ? 'text-sm' : 'text-[11px]'} text-slate-500 flex items-center gap-2 ${className}`}
      >
        <FaIcon icon="fa-spinner" className={`fa-spin text-emerald-500 ${isModal ? '' : 'text-[10px]'}`} />
        {isModal ? 'Loading available slots…' : 'Loading slots…'}
      </p>
    );
  }

  if (!slots.length) {
    if (isModal) {
      return (
        <div
          className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-3.5 ${className}`}
        >
          <p className="text-sm font-semibold text-slate-800">No open slots today</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Pick another day when you book — availability updates in real time.
          </p>
        </div>
      );
    }
    return (
      <p className={`text-[11px] text-slate-500 ${className}`}>No slots available today</p>
    );
  }

  const slotClass = isModal
    ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold'
    : 'shrink-0 snap-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] font-semibold whitespace-nowrap';

  const listClass = isModal
    ? 'flex flex-wrap gap-2'
    : 'flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  return (
    <div className={className}>
      {!isModal && (
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Today&apos;s slots</p>
      )}
      <div className={listClass}>
        {slots.map((s) => {
          const time = s.time || s.value;
          const label = s.label || formatSlotLabel(time);
          return (
            <span key={time} className={slotClass}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
