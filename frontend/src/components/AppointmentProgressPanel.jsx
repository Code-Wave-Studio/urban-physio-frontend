import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import HorizontalScrollRow, { scrollChipClass } from './booking/HorizontalScrollRow';
import { appointmentProgress, booking } from '../services/api';
import { formatDateChip, formatSlotLabel } from '../utils/bookingScheduleUtils';

const STATUS_STYLES = {
  scheduled: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  missed: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
};

function SessionScheduler({ appointmentId, sessionNumber, progress, preferredTime, onScheduled }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState(preferredTime || '');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    if (!progress?.doctor_id) return;
    const params =
      progress.consultation_type === 'clinic' && progress.clinic_id
        ? { doctor_id: progress.doctor_id, clinic_id: progress.clinic_id, from: new Date().toISOString().slice(0, 10), days: 30 }
        : { doctor_id: progress.doctor_id, from: new Date().toISOString().slice(0, 10), days: 30 };
    booking
      .availableDates(params)
      .then((res) => setDates(res.data || []))
      .catch(() => setDates([]));
  }, [progress?.doctor_id, progress?.clinic_id, progress?.consultation_type]);

  useEffect(() => {
    if (!date || !progress?.doctor_id) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    const req =
      progress.consultation_type === 'clinic' && progress.clinic_id
        ? booking.slotsForClinic(progress.doctor_id, progress.clinic_id, date)
        : booking.slots(progress.doctor_id, date);
    req
      .then((res) => {
        const list = res.data || [];
        setSlots(list);
        if (!time && preferredTime && list.some((s) => (s.time || s.value) === preferredTime)) {
          setTime(preferredTime);
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, progress?.doctor_id, progress?.clinic_id, progress?.consultation_type, preferredTime, time]);

  const save = async () => {
    if (!date || !time) {
      toast.error('Pick date and time');
      return;
    }
    setSaving(true);
    try {
      await appointmentProgress.scheduleSession(appointmentId, sessionNumber, {
        session_date: date,
        start_time: time,
      });
      toast.success('Session scheduled');
      onScheduled?.();
    } catch (err) {
      toast.error(err.message || 'Could not schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50/40 p-3 space-y-3">
      <p className="text-xs font-bold text-primary-800 uppercase tracking-wide">Schedule this visit</p>
      <HorizontalScrollRow ariaLabel="Dates">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDate(d);
              if (preferredTime) setTime(preferredTime);
            }}
            className={`${scrollChipClass(date === d, 'date')} !min-w-[7.5rem]`}
          >
            <span className="text-xs font-semibold">{formatDateChip(d)}</span>
          </button>
        ))}
      </HorizontalScrollRow>
      {date && (
        <div>
          {loadingSlots ? (
            <p className="text-xs text-slate-500">Loading times…</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-amber-800">No slots — swipe to another date.</p>
          ) : (
            <HorizontalScrollRow ariaLabel="Times">
              {slots.map((slot) => {
                const t = slot.time || slot.value;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={scrollChipClass(time === t, 'time')}
                  >
                    {slot.label || formatSlotLabel(t)}
                  </button>
                );
              })}
            </HorizontalScrollRow>
          )}
        </div>
      )}
      <button type="button" disabled={saving} onClick={save} className="btn-primary text-xs w-full sm:w-auto min-h-[44px]">
        {saving ? 'Saving…' : 'Confirm schedule'}
      </button>
    </div>
  );
}

export default function AppointmentProgressPanel({
  appointmentId,
  canEdit = false,
  patientView = false,
  onUpdated,
}) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [schedulingSession, setSchedulingSession] = useState(null);

  const load = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const res = await appointmentProgress.get(appointmentId);
      setProgress(res?.data ?? res);
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const completeSession = async (sessionNumber) => {
    setUpdating(sessionNumber);
    try {
      await appointmentProgress.completeSession(appointmentId, sessionNumber, {});
      toast.success('Session marked complete');
      await load();
      onUpdated?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading progress…</p>;
  }
  if (!progress?.sessions?.length) {
    return null;
  }

  const pct = progress.progress_percent ?? 0;
  const preferredTime = progress.sessions.find((s) => s.start_time)?.start_time
    ? String(progress.sessions.find((s) => s.start_time).start_time).slice(0, 5)
    : '';

  return (
    <div className="rounded-2xl border border-white/70 bg-white/50 p-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
        <FaIcon icon="fa-chart-line" className="text-primary-600 text-xs" />
        Treatment progress
        <span className="text-xs font-normal text-slate-500 capitalize">
          ({progress.progress_status?.replace(/_/g, ' ')})
        </span>
      </h3>
      {progress.package_label && (
        <p className="text-xs text-slate-600 mb-3">{progress.package_label}</p>
      )}

      <HorizontalScrollRow ariaLabel="Progress stats" className="mb-4">
        <div className="shrink-0 snap-start min-w-[5.5rem] rounded-xl bg-slate-50 border border-slate-100 py-2 px-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Done</p>
          <p className="text-lg font-bold text-emerald-700">{progress.completed_sessions}</p>
        </div>
        <div className="shrink-0 snap-start min-w-[5.5rem] rounded-xl bg-slate-50 border border-slate-100 py-2 px-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Upcoming</p>
          <p className="text-lg font-bold text-sky-700">{progress.upcoming_sessions ?? 0}</p>
        </div>
        <div className="shrink-0 snap-start min-w-[5.5rem] rounded-xl bg-amber-50 border border-amber-100 py-2 px-3 text-center">
          <p className="text-[10px] uppercase font-bold text-amber-700">To book</p>
          <p className="text-lg font-bold text-amber-800">{progress.remaining_to_schedule ?? 0}</p>
        </div>
        <div className="shrink-0 snap-start min-w-[5.5rem] rounded-xl bg-slate-50 border border-slate-100 py-2 px-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Left</p>
          <p className="text-lg font-bold text-slate-800">{progress.remaining_sessions ?? 0}</p>
        </div>
      </HorizontalScrollRow>

      {progress.package_expires_at && (
        <p className="text-xs text-slate-600 mb-3 flex items-center gap-1.5">
          <FaIcon icon="fa-hourglass-half" className="text-amber-600" />
          Package valid until <strong>{progress.package_expires_at}</strong>
        </p>
      )}

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>
            {progress.completed_sessions} / {progress.total_sessions} sessions done
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {progress.sessions.map((s) => {
          const needsSchedule = !s.session_date || !s.start_time;
          const showScheduler = patientView && needsSchedule && s.status !== 'completed' && schedulingSession === s.session_number;

          return (
            <div
              key={s.session_number}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Session {s.session_number}</p>
                  <p className="text-xs text-slate-500">
                    {s.session_date || 'Not scheduled yet'}
                    {s.start_time ? ` · ${String(s.start_time).slice(0, 5)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[s.status] || STATUS_STYLES.scheduled}`}>
                    {needsSchedule && patientView ? 'pending schedule' : s.status?.replace(/_/g, ' ')}
                  </span>
                  {patientView && needsSchedule && s.status !== 'completed' && (
                    <button
                      type="button"
                      className="text-xs btn-outline !py-1 !px-2.5 min-h-[36px]"
                      onClick={() => setSchedulingSession(showScheduler ? null : s.session_number)}
                    >
                      {showScheduler ? 'Close' : 'Schedule'}
                    </button>
                  )}
                  {canEdit && s.status !== 'completed' && s.status !== 'cancelled' && !needsSchedule && (
                    <button
                      type="button"
                      disabled={updating === s.session_number}
                      className="text-xs btn-primary !py-1 !px-2.5"
                      onClick={() => completeSession(s.session_number)}
                    >
                      {updating === s.session_number ? '…' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
              {showScheduler && (
                <SessionScheduler
                  appointmentId={appointmentId}
                  sessionNumber={s.session_number}
                  progress={progress}
                  preferredTime={preferredTime}
                  onScheduled={() => {
                    setSchedulingSession(null);
                    load();
                    onUpdated?.();
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
