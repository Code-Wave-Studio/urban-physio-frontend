import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { booking } from '../../services/api';
import { bookDoctorUrl } from '../../utils/bookUrl';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(d) {
  if (d === todayIso()) return 'Today';
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTimeLabel(slot) {
  const label = slot.label || slot.time || '';
  if (!label) return '';
  if (label.toLowerCase() === 'today') return label;
  return label;
}

export default function ProfileSlotsPreview({ doctorId, clinicId = null, showTimes = true }) {
  const [dates, setDates] = useState([]);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    const params = { doctor_id: doctorId };
    if (clinicId) params.clinic_id = clinicId;

    booking
      .availableDates(params)
      .then((res) => {
        const list = (res?.data ?? res ?? []).slice(0, 5);
        setDates(list);
        setSelectedDate(list[0] || '');

        if (!showTimes || !list.length) {
          setSlotsByDate({});
          return;
        }

        return Promise.all(
          list.slice(0, 3).map((date) =>
            booking
              .slots(doctorId, date, clinicId)
              .then((slotRes) => {
                const slots = (slotRes?.data ?? slotRes ?? []).filter((s) => s.available !== false);
                return [date, slots.slice(0, 6)];
              })
              .catch(() => [date, []])
          )
        ).then((entries) => {
          setSlotsByDate(Object.fromEntries(entries));
        });
      })
      .catch(() => {
        setDates([]);
        setSlotsByDate({});
        setSelectedDate('');
      })
      .finally(() => setLoading(false));
  }, [doctorId, clinicId, showTimes]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
        <p className="text-sm text-slate-500 inline-flex items-center gap-2">
          <FaIcon icon="fa-spinner" className="fa-spin text-primary-500" />
          Loading available slots…
        </p>
      </div>
    );
  }

  if (!dates.length) {
    return (
      <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3 text-sm text-amber-900">
        No open slots in the next few days.{' '}
        <Link to={bookDoctorUrl(doctorId)} className="text-primary-700 font-semibold hover:underline">
          Request appointment
        </Link>
      </div>
    );
  }

  const activeDate = selectedDate || dates[0];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50/90 to-white px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Next available</p>
        <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
          <FaIcon icon="fa-calendar-day" className="text-primary-600 text-sm" />
          {formatDateLabel(activeDate)}
          {activeDate !== todayIso() && (
            <span className="text-sm font-medium text-slate-500">
              {new Date(`${activeDate}T12:00:00`).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDate(d)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              activeDate === d
                ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'
            }`}
          >
            {formatDateLabel(d)}
          </button>
        ))}
      </div>

      {showTimes && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Times on {formatDateLabel(activeDate)}</p>
          {slotsByDate[activeDate]?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slotsByDate[activeDate].map((slot) => (
                <Link
                  key={`${activeDate}-${slot.time}`}
                  to={bookDoctorUrl(doctorId, {
                    date: activeDate,
                    time: slot.value || slot.time,
                  })}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 transition"
                >
                  {formatTimeLabel(slot)}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              to={bookDoctorUrl(doctorId, { date: activeDate })}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:underline"
            >
              <FaIcon icon="fa-calendar-check" />
              Book on {formatDateLabel(activeDate)}
            </Link>
          )}
        </div>
      )}

      <Link
        to={bookDoctorUrl(doctorId)}
        className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800"
      >
        View full booking calendar
        <FaIcon icon="fa-arrow-right" className="text-xs" />
      </Link>
    </div>
  );
}
