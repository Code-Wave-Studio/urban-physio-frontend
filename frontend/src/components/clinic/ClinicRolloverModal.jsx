import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import GlassModal, { GlassModalHeader, GlassModalBody } from '../GlassModal';
import FaIcon from '../FaIcon';
import { booking, clinicPortal } from '../../services/api';

function getIsoToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default function ClinicRolloverModal({ appointment, clinicId, onClose, onSuccess }) {
  const todayIso = useMemo(() => getIsoToday(), []);
  
  // Default month view is current month or appointment month
  const [viewDate, setViewDate] = useState(() => {
    const apptDate = appointment?.appointment_date;
    if (apptDate && apptDate >= todayIso) {
      return new Date(`${apptDate}T00:00:00`);
    }
    return new Date();
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const apptDate = appointment?.appointment_date;
    return apptDate && apptDate >= todayIso ? apptDate : todayIso;
  });

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Month navigation helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const isCurrentRealMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month;
  }, [year, month]);

  const handlePrevMonth = () => {
    if (isCurrentRealMonth) return;
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i += 1) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateIso = `${year}-${monthStr}-${dayStr}`;
      const isPast = dateIso < todayIso;
      const isToday = dateIso === todayIso;
      const isSelected = dateIso === selectedDate;
      days.push({ dayNum: d, dateIso, isPast, isToday, isSelected });
    }

    return days;
  }, [year, month, todayIso, selectedDate]);

  // Load available time slots when selectedDate changes
  const fetchSlots = useCallback(async (dateToFetch) => {
    if (!dateToFetch || !appointment) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const docId = appointment.doctor_id;
      const res = await booking.slotsForClinic(docId, clinicId, dateToFetch);
      const data = res.data || res || [];
      const list = Array.isArray(data) ? data : (data.slots || []);
      setSlots(list);
    } catch (e) {
      toast.error(e.message || 'Failed to load available slots');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [appointment, clinicId]);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const handleConfirm = async () => {
    if (!selectedDate) {
      toast.error('Please select a date on the calendar');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select an available time slot');
      return;
    }

    const startTime = selectedSlot.start_time || selectedSlot.time;
    const endTime = selectedSlot.end_time || undefined;

    setSubmitting(true);
    try {
      const res = await clinicPortal.cancelWithRollover(clinicId, appointment.id, {
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
      });

      const next = res.data || res || {};
      const newSlotDate = next.slot?.date || selectedDate;
      const newSlotTime = formatSlotTime(next.slot?.start_time || startTime);

      toast.success(`Appointment successfully rescheduled to ${formatDateLabel(newSlotDate)} at ${newSlotTime}!`, {
        duration: 5000,
      });

      onSuccess?.(next);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!appointment) return null;

  const doctorName = appointment.doctor_name
    || (appointment.doctor_first_name
      ? `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name || ''}`.trim()
      : 'Assigned Doctor');

  const patientName = appointment.patient_full_name || 'Patient';
  const currentApptDate = formatDateLabel(appointment.appointment_date);
  const currentApptTime = formatSlotTime(appointment.start_time);

  return (
    <GlassModal open onClose={onClose} size="lg" titleId="rollover-modal">
      <GlassModalHeader
        titleId="rollover-modal"
        title="Reschedule Appointment (Cancel + Rollover)"
        subtitle="Select a future date & time slot for the doctor to move this session."
        icon="fa-calendar-days"
        accent="primary"
        onClose={onClose}
      />

      <GlassModalBody className="p-4 sm:p-6 space-y-6">
        {/* Appointment Overview Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient & Doctor</div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <FaIcon icon="fa-user" className="text-sky-600 text-xs" />
              {patientName}
              {appointment.patient_mobile && (
                <span className="font-normal text-slate-500 text-xs">({appointment.patient_mobile})</span>
              )}
            </div>
            <div className="text-slate-700 text-xs flex items-center gap-2">
              <FaIcon icon="fa-user-doctor" className="text-teal-600 text-xs" />
              {doctorName}
            </div>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Appointment</div>
            <div className="font-medium text-rose-700 text-xs flex items-center gap-2">
              <FaIcon icon="fa-calendar-xmark" className="text-rose-500 text-xs" />
              {currentApptDate} at {currentApptTime}
            </div>
            <div className="text-slate-500 text-[11px] capitalize">
              Mode: <span className="font-semibold text-slate-700">{appointment.consultation_type || 'clinic'}</span> • Ref: {appointment.booking_id}
            </div>
          </div>
        </div>

        {/* Calendar and Slot Picker Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Monthly Calendar (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">{monthName}</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={isCurrentRealMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
                  title="Previous Month"
                >
                  <FaIcon icon="fa-chevron-left" className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  title="Next Month"
                >
                  <FaIcon icon="fa-chevron-right" className="text-xs" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Day Tiles */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => {
                if (!item) {
                  return <div key={`empty-${idx}`} className="h-9 sm:h-10" />;
                }
                const { dayNum, dateIso, isPast, isToday, isSelected } = item;
                return (
                  <button
                    key={dateIso}
                    type="button"
                    disabled={isPast}
                    onClick={() => setSelectedDate(dateIso)}
                    className={`h-9 sm:h-10 rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 ring-2 ring-sky-600 ring-offset-1 font-bold'
                        : isPast
                        ? 'text-slate-300 cursor-not-allowed bg-slate-50/50'
                        : isToday
                        ? 'bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 border border-slate-100'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-sky-500 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Available Slots for Selected Date (5 cols on lg) */}
          <div className="lg:col-span-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <FaIcon icon="fa-clock" className="text-sky-600 text-xs" />
                  Available Slots
                </h4>
                <span className="text-xs text-slate-500 font-medium">{formatDateLabel(selectedDate)}</span>
              </div>

              {slotsLoading ? (
                <div className="py-8 text-center space-y-2">
                  <FaIcon icon="fa-spinner" className="fa-spin text-2xl text-sky-600" />
                  <p className="text-xs text-slate-500 font-medium">Checking doctor availability…</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/60">
                  <FaIcon icon="fa-calendar-xmark" className="text-2xl text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No available slots</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dr. has no free time slots on this date. Please pick another date on the calendar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {slots.map((s, idx) => {
                    const startStr = s.start_time || s.time;
                    const label = s.label || formatSlotTime(startStr);
                    const isSelected = selectedSlot?.start_time === startStr || selectedSlot?.time === startStr;

                    return (
                      <button
                        key={s.start_time || s.time || idx}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition text-left flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-600 ring-offset-1'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && <FaIcon icon="fa-check" className="text-[10px]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Preview Box */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-[11px] text-slate-500 uppercase font-bold mb-1">New Target Slot</div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FaIcon icon="fa-calendar-check" className="text-emerald-600" />
                {selectedDate && selectedSlot ? (
                  <span>
                    {formatDateLabel(selectedDate)} at {selectedSlot.label || formatSlotTime(selectedSlot.start_time || selectedSlot.time)}
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal italic">Please select a date & slot above</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !selectedDate || !selectedSlot}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 shadow-md shadow-sky-500/20 inline-flex items-center gap-2 transition"
          >
            {submitting ? (
              <>
                <FaIcon icon="fa-spinner" className="fa-spin" />
                Rescheduling…
              </>
            ) : (
              <>
                <FaIcon icon="fa-arrow-right-arrow-left" />
                Confirm &amp; Reschedule
              </>
            )}
          </button>
        </div>
      </GlassModalBody>
    </GlassModal>
  );
}
