import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { booking } from '../../services/api';
import { bookDoctorUrl } from '../../utils/bookUrl';

function formatDateLabel(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function ProfileSlotsPreview({ doctorId, clinicId = null, showTimes = true }) {
  const [dates, setDates] = useState([]);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loading, setLoading] = useState(true);

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
                return [date, slots.slice(0, 4)];
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
      })
      .finally(() => setLoading(false));
  }, [doctorId, clinicId, showTimes]);

  if (loading) {
    return (
      <p className="text-sm text-slate-500">
        <FaIcon icon="fa-spinner" className="fa-spin mr-2" />
        Loading available slots…
      </p>
    );
  }

  if (!dates.length) {
    return (
      <p className="text-sm text-slate-600">
        No open slots in the next few days.{' '}
        <Link to={bookDoctorUrl(doctorId)} className="text-primary-600 font-semibold hover:underline">
          Request appointment
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {dates.map((d) => (
        <div key={d}>
          <Link
            to={`${bookDoctorUrl(doctorId)}?date=${encodeURIComponent(d)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-100 transition mb-1.5"
          >
            <FaIcon icon="fa-calendar-day" className="text-primary-600" />
            {formatDateLabel(d)}
          </Link>
          {showTimes && (slotsByDate[d]?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pl-1">
              {slotsByDate[d].map((slot) => (
                <Link
                  key={`${d}-${slot.time}`}
                  to={`${bookDoctorUrl(doctorId)}?date=${encodeURIComponent(d)}&time=${encodeURIComponent(slot.value || slot.time)}`}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-800"
                >
                  {slot.label || slot.time}
                </Link>
              ))}
            </div>
          ) : showTimes && slotsByDate[d] ? (
            <p className="text-xs text-slate-500 pl-1">No times listed — pick date to book</p>
          ) : null)}
        </div>
      ))}
    </div>
  );
}
