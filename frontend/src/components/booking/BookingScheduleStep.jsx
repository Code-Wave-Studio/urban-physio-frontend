import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FaIcon from '../FaIcon';
import TreatmentPackagesBrowser from '../packages/TreatmentPackagesBrowser';
import HorizontalScrollRow, { scrollChipClass } from './HorizontalScrollRow';
import { packageMatchesCategory } from '../../utils/packageHelpers';
import {
  formatDateChip,
  formatDateHeading,
  formatSlotLabel,
  isStructuredPackageId,
  todayIso,
} from '../../utils/bookingScheduleUtils';

export const CUSTOM_PACKAGE_ID = 'custom';
export const SINGLE_PACKAGE_ID = 'single';

export function adminPackageKey(id) {
  return `admin-${id}`;
}

export function doctorPackageKey(id) {
  return `doctor-${id}`;
}

export function parsePackageKey(key) {
  if (!key || key === SINGLE_PACKAGE_ID || key === CUSTOM_PACKAGE_ID) {
    return { source: key, id: null };
  }
  if (String(key).startsWith('admin-')) {
    return { source: 'admin', id: parseInt(String(key).slice(6), 10) };
  }
  if (String(key).startsWith('doctor-')) {
    return { source: 'doctor', id: parseInt(String(key).slice(7), 10) };
  }
  return { source: 'doctor', id: parseInt(key, 10) };
}

export default function BookingScheduleStep({
  form,
  patch,
  adminPackages = [],
  doctorPackages = [],
  selectedPackageId,
  onPackageChange,
  scheduleSessions,
  onScheduleChange,
  availableDates,
  availableDatesLoading,
  loadSlotsForDate,
  slotsCache = {},
  slotsLoadingDate,
}) {
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const sessionScrollRef = useRef(null);

  const serviceType = form.consultation_type;
  const isStructured = isStructuredPackageId(selectedPackageId);
  const isCustom = selectedPackageId === CUSTOM_PACKAGE_ID;
  const isSingle = selectedPackageId === SINGLE_PACKAGE_ID || !selectedPackageId;

  const structuredPackages = useMemo(
    () => [
      ...adminPackages.map((p) => ({ ...p, package_source: 'admin' })),
      ...doctorPackages.map((p) => ({ ...p, package_source: 'doctor' })),
    ],
    [adminPackages, doctorPackages]
  );

  const packagesForService = useMemo(
    () => (serviceType ? structuredPackages.filter((p) => packageMatchesCategory(p, serviceType)) : structuredPackages),
    [structuredPackages, serviceType]
  );

  const selectedPkg = useMemo(() => {
    if (isSingle) {
      return { id: SINGLE_PACKAGE_ID, label: 'Single visit', sessions: 1, days: 1 };
    }
    if (isCustom) {
      return { id: CUSTOM_PACKAGE_ID, label: 'Flexible consultation', sessions: scheduleSessions.length || 1, days: null };
    }
    const parsed = parsePackageKey(selectedPackageId);
    const found = structuredPackages.find((p) => {
      if (parsed.source === 'admin') return String(p.id) === String(parsed.id) && p.package_source === 'admin';
      if (parsed.source === 'doctor') return String(p.id) === String(parsed.id) && p.package_source === 'doctor';
      return String(p.id) === String(selectedPackageId);
    });
    if (found) {
      return {
        id: selectedPackageId,
        label: found.name,
        sessions: found.total_sessions || found.duration_days || 1,
        days: found.duration_days,
        price: found.discount_price ?? found.price,
        mrp: found.mrp_price,
      };
    }
    return { id: SINGLE_PACKAGE_ID, label: 'Single visit', sessions: 1, days: 1 };
  }, [selectedPackageId, structuredPackages, scheduleSessions.length, isSingle, isCustom]);

  const packageTotalSessions = isStructured ? selectedPkg.sessions : isCustom ? scheduleSessions.length : 1;
  const preferredTime = scheduleSessions[0]?.time || '';

  useEffect(() => {
    if (isStructured || isSingle) {
      if (scheduleSessions.length !== 1) {
        onScheduleChange([scheduleSessions[0] || { date: '', time: '' }]);
      }
      return;
    }
    if (isCustom && scheduleSessions.length < 1) {
      onScheduleChange([{ date: '', time: '' }]);
    }
  }, [isStructured, isSingle, isCustom, scheduleSessions, onScheduleChange]);

  useEffect(() => {
    const first = scheduleSessions[0];
    if (first?.date) patch({ appointment_date: first.date, start_time: first.time || '' });
    patch({
      number_of_sessions: isStructured ? selectedPkg.sessions : isCustom ? scheduleSessions.length : 1,
      package_label: selectedPkg.label,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleSessions, selectedPkg.label, selectedPkg.sessions, isStructured, isCustom]);

  const updateSession = (index, fields) => {
    const nextFields = { ...fields };
    if (nextFields.date != null && index > 0 && !nextFields.time && preferredTime) {
      nextFields.time = preferredTime;
    }
    onScheduleChange(scheduleSessions.map((s, i) => (i === index ? { ...s, ...nextFields } : s)));
  };

  const pickDate = (index, d) => {
    const time =
      index > 0 && preferredTime
        ? preferredTime
        : scheduleSessions[index]?.date === d
          ? scheduleSessions[index]?.time || ''
          : '';
    updateSession(index, { date: d, time });
  };

  const addCustomSession = () => {
    const last = scheduleSessions[scheduleSessions.length - 1];
    onScheduleChange([
      ...scheduleSessions,
      { date: last?.date || '', time: preferredTime || last?.time || '' },
    ]);
    setActiveSessionIndex(scheduleSessions.length);
  };

  const removeCustomSession = (index) => {
    if (scheduleSessions.length <= 1) return;
    onScheduleChange(scheduleSessions.filter((_, i) => i !== index));
    setActiveSessionIndex(0);
  };

  const activeSession = scheduleSessions[activeSessionIndex] || { date: '', time: '' };
  const activeSlots = activeSession.date ? slotsCache[activeSession.date] || [] : [];
  const scheduledCount = scheduleSessions.filter((s) => s.date && s.time).length;
  const progressTotal = isStructured ? 1 : scheduleSessions.length;
  const progressDone = isStructured
    ? scheduleSessions[0]?.date && scheduleSessions[0]?.time
      ? 1
      : 0
    : scheduledCount;
  const progressPct = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;

  useEffect(() => {
    if (activeSession.date && loadSlotsForDate) loadSlotsForDate(activeSession.date);
  }, [activeSession.date, loadSlotsForDate]);

  useEffect(() => {
    const sess = scheduleSessions[activeSessionIndex];
    if (activeSessionIndex > 0 && sess?.date && !sess?.time && preferredTime) {
      updateSession(activeSessionIndex, { time: preferredTime });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionIndex, preferredTime]);

  useEffect(() => {
    if (!isCustom || scheduleSessions.length <= 1) return;
    const el = sessionScrollRef.current?.querySelector(`[data-session-idx="${activeSessionIndex}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeSessionIndex, isCustom, scheduleSessions.length]);

  const serviceLabel =
    serviceType === 'home_visit' ? 'Home visit' : serviceType === 'online' ? 'Online' : 'Clinic';

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Package &amp; schedule</h2>
        <p className="text-sm text-slate-600 mt-1">
          {serviceLabel} — swipe sessions &amp; dates sideways on mobile.
        </p>
      </div>

      {packagesForService.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700 flex items-center gap-2">
            <FaIcon icon="fa-box-open" />
            {serviceLabel} packages
          </p>
          <TreatmentPackagesBrowser
            packages={packagesForService}
            interaction="select"
            selectedKey={isStructured ? selectedPackageId : null}
            defaultCategory={serviceType || 'clinic'}
            lockCategory
            getPackageKey={(pkg) =>
              pkg.package_source === 'admin' ? adminPackageKey(pkg.id) : doctorPackageKey(pkg.id)
            }
            onSelect={(key, pkg) => onPackageChange(key, { ...pkg, package_source: pkg.package_source || 'doctor' })}
            bookLabel="Select package"
          />
        </section>
      )}

      <section className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700 flex items-center gap-2">
          <FaIcon icon="fa-calendar-plus" />
          Without package
        </p>
        <HorizontalScrollRow ariaLabel="Booking type">
          <button
            type="button"
            onClick={() => onPackageChange(CUSTOM_PACKAGE_ID)}
            className={`${scrollChipClass(isCustom, 'session')} !min-w-[11rem] !text-left !py-3 ${
              isCustom ? '!bg-violet-600 !border-violet-600 !text-white' : ''
            }`}
          >
            <span className="block text-[10px] uppercase opacity-80">Flexible</span>
            Multi-session
          </button>
          <button
            type="button"
            onClick={() => onPackageChange(SINGLE_PACKAGE_ID)}
            className={`${scrollChipClass(isSingle, 'session')} !min-w-[11rem] !text-left !py-3 ${
              isSingle ? '!bg-primary-600 !border-primary-600 !text-white' : ''
            }`}
          >
            <span className="block text-[10px] uppercase opacity-80">Single</span>
            One visit
          </button>
        </HorizontalScrollRow>
      </section>

      {isStructured && (
        <div className="rounded-2xl bg-sky-50 border border-sky-200/80 px-3 py-2.5 text-sm text-sky-900">
          <strong>{selectedPkg.label}</strong> — book session 1 now;{' '}
          <strong>{Math.max(0, packageTotalSessions - 1)}</strong> later from dashboard.
        </div>
      )}

      {isCustom && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-600">Swipe sessions →</p>
          <button type="button" className="btn-outline text-xs !py-2 !px-3 min-h-[40px]" onClick={addCustomSession}>
            <FaIcon icon="fa-plus" /> Add
          </button>
        </div>
      )}

      {/* Session picker — horizontal only, never wraps */}
      {isCustom && scheduleSessions.length >= 1 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center justify-between">
            <span>Sessions</span>
            <span className="text-slate-400 font-normal normal-case">{scheduleSessions.length} total</span>
          </p>
          <div ref={sessionScrollRef}>
            <HorizontalScrollRow ariaLabel="Sessions">
              {scheduleSessions.map((sess, i) => {
                const complete = sess.date && sess.time;
                const selected = activeSessionIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    data-session-idx={i}
                    onClick={() => setActiveSessionIndex(i)}
                    className={`${scrollChipClass(selected, 'session')} inline-flex items-center gap-1.5 ${
                      !selected && complete ? '!bg-emerald-50 !text-emerald-800 !border-emerald-200' : ''
                    }`}
                  >
                    Session {i + 1}
                    {complete && <FaIcon icon="fa-check" className="text-[10px]" />}
                  </button>
                );
              })}
            </HorizontalScrollRow>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedPackageId}-${activeSessionIndex}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80">
            <p className="font-bold text-slate-900 text-sm">
              {isStructured ? (
                <>Session 1 <span className="text-slate-500 font-medium">/ {packageTotalSessions}</span></>
              ) : isCustom ? (
                <>Session {activeSessionIndex + 1} <span className="text-slate-500 font-medium">/ {scheduleSessions.length}</span></>
              ) : (
                'Your visit'
              )}
            </p>
            {isCustom && scheduleSessions.length > 1 && (
              <button
                type="button"
                className="text-[11px] text-red-600 font-semibold px-2 min-h-[36px]"
                onClick={() => removeCustomSession(activeSessionIndex)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="p-3 sm:p-4 space-y-4">
            {/* Dates — horizontal scroll */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Date</p>
                <button
                  type="button"
                  className="text-[11px] text-primary-600 font-semibold"
                  onClick={() => setShowDatePicker((v) => !v)}
                >
                  {showDatePicker ? 'Hide calendar' : 'Other date'}
                </button>
              </div>
              {showDatePicker && (
                <input
                  type="date"
                  className="input-field mb-2 min-h-[44px] text-sm"
                  min={todayIso()}
                  value={activeSession.date || ''}
                  onChange={(e) => pickDate(activeSessionIndex, e.target.value)}
                />
              )}
              {availableDatesLoading ? (
                <p className="text-xs text-slate-500 py-2">Loading dates…</p>
              ) : availableDates.length > 0 ? (
                <HorizontalScrollRow ariaLabel="Available dates">
                  {availableDates.map((d) => {
                    const selected = activeSession.date === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => pickDate(activeSessionIndex, d)}
                        className={scrollChipClass(selected, 'date')}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              selected ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <FaIcon icon="fa-calendar-day" className="text-[10px]" />
                          </span>
                          <span className={`text-xs font-semibold leading-tight ${selected ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {formatDateChip(d)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </HorizontalScrollRow>
              ) : null}
            </div>

            {/* Times — horizontal scroll */}
            {activeSession.date && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {formatDateHeading(activeSession.date)}
                  {activeSlots.length > 0 && (
                    <span className="text-emerald-600 normal-case"> · {activeSlots.length} slots</span>
                  )}
                </p>
                {slotsLoadingDate === activeSession.date ? (
                  <p className="text-slate-500 text-xs py-2">Loading times…</p>
                ) : activeSlots.length === 0 ? (
                  <p className="text-amber-800 text-xs bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    No slots — swipe to another date.
                  </p>
                ) : (
                  <HorizontalScrollRow ariaLabel="Time slots">
                    {activeSlots.map((slot) => {
                      const time = slot.time || slot.value;
                      const label = slot.label || formatSlotLabel(time);
                      const selected = activeSession.time === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => updateSession(activeSessionIndex, { time })}
                          className={scrollChipClass(selected, 'time')}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${selected ? 'bg-emerald-600' : 'bg-emerald-500'}`} />
                          {label}
                        </button>
                      );
                    })}
                  </HorizontalScrollRow>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-800">
          <span>
            {progressDone} / {progressTotal} scheduled
          </span>
          <span className="text-emerald-700">{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-primary-500 rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
