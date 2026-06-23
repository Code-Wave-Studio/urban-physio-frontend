import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { booking } from '../../services/api';
import { clinicBookUrl } from '../../utils/profileUrls';

function formatDateLabel(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function ClinicSlotsPreview({ clinicId }) {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    setLoadingDates(true);
    booking
      .availableDates({ clinic_id: clinicId, days: 21 })
      .then((res) => {
        const list = (res?.data ?? res ?? []).slice(0, 8);
        setDates(list);
        setSelectedDate(list[0] || '');
      })
      .catch(() => {
        setDates([]);
        setSelectedDate('');
      })
      .finally(() => setLoadingDates(false));
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    booking
      .slots(null, selectedDate, clinicId)
      .then((res) => setSlots(res?.data ?? res ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [clinicId, selectedDate]);

  const openCount = useMemo(() => slots.filter((s) => s.available !== false).length, [slots]);

  if (loadingDates) {
    return (
      <p className="text-sm text-slate-500">
        <FaIcon icon="fa-spinner" className="fa-spin mr-2" />
        Loading appointment slots…
      </p>
    );
  }

  if (!dates.length) {
    return (
      <p className="text-sm text-slate-600">
        No open slots in the next few weeks.{' '}
        <Link to={clinicBookUrl({ id: clinicId })} className="text-emerald-700 font-semibold hover:underline">
          Request a visit
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDate(d)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              selectedDate === d
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <FaIcon icon="fa-calendar-day" className="text-emerald-600 text-xs" />
            {formatDateLabel(d)}
          </button>
        ))}
      </div>

      {selectedDate && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            {formatDateLabel(selectedDate)} · {loadingSlots ? '…' : `${openCount} open slot${openCount === 1 ? '' : 's'}`}
          </p>
          {loadingSlots ? (
            <p className="text-sm text-slate-500">
              <FaIcon icon="fa-spinner" className="fa-spin mr-1" />
              Checking times…
            </p>
          ) : slots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <Link
                  key={slot.time || slot.value}
                  to={`${clinicBookUrl({ id: clinicId })}?date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(slot.time || slot.value)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {slot.label || slot.time}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Fully booked on this day — try another date above.</p>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-400 flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-300" /> Booked slots are hidden
        </span>
      </p>
    </div>
  );
}
