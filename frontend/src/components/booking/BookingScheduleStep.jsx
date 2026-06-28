import { useEffect, useMemo, useState } from 'react';
import FaIcon from '../FaIcon';
import TreatmentPackagesBrowser from '../packages/TreatmentPackagesBrowser';

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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateChip(d) {
  if (d === todayIso()) return 'Today';
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
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

  const structuredPackages = useMemo(
    () => [
      ...adminPackages.map((p) => ({ ...p, package_source: 'admin' })),
      ...doctorPackages.map((p) => ({ ...p, package_source: 'doctor' })),
    ],
    [adminPackages, doctorPackages]
  );

  const allPackages = structuredPackages;

  const selectedPkg = useMemo(() => {
    if (selectedPackageId === SINGLE_PACKAGE_ID || !selectedPackageId) {
      return { id: SINGLE_PACKAGE_ID, label: 'Single visit', sessions: 1, days: 1 };
    }
    if (selectedPackageId === CUSTOM_PACKAGE_ID) {
      return { id: CUSTOM_PACKAGE_ID, label: 'Flexible consultation', sessions: scheduleSessions.length || 1, days: null };
    }
    const parsed = parsePackageKey(selectedPackageId);
    const found = allPackages.find((p) => {
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
  }, [selectedPackageId, allPackages, scheduleSessions.length]);

  const requiredSessions =
    selectedPackageId === CUSTOM_PACKAGE_ID ? Math.max(1, scheduleSessions.length) : selectedPkg.sessions;

  useEffect(() => {
    if (scheduleSessions.length < requiredSessions) {
      const next = [...scheduleSessions];
      while (next.length < requiredSessions) next.push({ date: '', time: '' });
      onScheduleChange(next);
    } else if (selectedPackageId !== CUSTOM_PACKAGE_ID && scheduleSessions.length > requiredSessions) {
      onScheduleChange(scheduleSessions.slice(0, requiredSessions));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredSessions, selectedPackageId]);

  useEffect(() => {
    const first = scheduleSessions[0];
    if (first?.date) patch({ appointment_date: first.date, start_time: first.time || '' });
    patch({ number_of_sessions: requiredSessions, package_label: selectedPkg.label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleSessions, requiredSessions, selectedPkg.label]);

  const updateSession = (index, fields) => {
    onScheduleChange(scheduleSessions.map((s, i) => (i === index ? { ...s, ...fields } : s)));
  };

  const addCustomSession = () => {
    onScheduleChange([...scheduleSessions, { date: '', time: '' }]);
    setActiveSessionIndex(scheduleSessions.length);
  };

  const removeCustomSession = (index) => {
    if (scheduleSessions.length <= 1) return;
    onScheduleChange(scheduleSessions.filter((_, i) => i !== index));
    setActiveSessionIndex(0);
  };

  const activeSession = scheduleSessions[activeSessionIndex] || { date: '', time: '' };
  const activeSlots = activeSession.date ? slotsCache[activeSession.date] || [] : [];

  useEffect(() => {
    if (activeSession.date && loadSlotsForDate) loadSlotsForDate(activeSession.date);
  }, [activeSession.date, loadSlotsForDate]);

  const hasStructuredPackage =
    selectedPackageId !== SINGLE_PACKAGE_ID && selectedPackageId !== CUSTOM_PACKAGE_ID;

  const defaultCategory =
    form.consultation_type && ['clinic', 'home_visit', 'online'].includes(form.consultation_type)
      ? form.consultation_type
      : 'clinic';

  const handlePackageSelect = (key, pkg) => {
    onPackageChange(key, { ...pkg, package_source: pkg.package_source || 'doctor' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Package & schedule</h2>
        <p className="text-sm text-slate-600 mt-1">
          Choose a treatment package by service type, or book without a package.
        </p>
      </div>

      {structuredPackages.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700 flex items-center gap-2">
            <FaIcon icon="fa-box-open" />
            Treatment packages
          </p>
          <TreatmentPackagesBrowser
            packages={structuredPackages}
            interaction="select"
            selectedKey={hasStructuredPackage ? selectedPackageId : null}
            defaultCategory={defaultCategory}
            getPackageKey={(pkg) =>
              pkg.package_source === 'admin' ? adminPackageKey(pkg.id) : doctorPackageKey(pkg.id)
            }
            onSelect={handlePackageSelect}
            bookLabel="Select package"
          />
        </section>
      )}

      <section className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700 flex items-center gap-2">
          <FaIcon icon="fa-calendar-plus" />
          Without package
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPackageChange(CUSTOM_PACKAGE_ID)}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              selectedPackageId === CUSTOM_PACKAGE_ID
                ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                : 'border-slate-200 bg-white hover:border-violet-200 hover:shadow-md'
            }`}
          >
            <p className="text-xs font-bold text-violet-700 uppercase">Flexible</p>
            <p className="font-bold text-slate-900 text-sm mt-1">No package / custom schedule</p>
            <p className="text-[11px] text-slate-500 mt-1">Pick multiple dates & times freely</p>
          </button>

          <button
            type="button"
            onClick={() => onPackageChange(SINGLE_PACKAGE_ID)}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              selectedPackageId === SINGLE_PACKAGE_ID
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-slate-200 bg-white hover:border-primary-200 hover:shadow-md'
            }`}
          >
            <p className="text-xs font-bold text-primary-600 uppercase">Single visit</p>
            <p className="font-bold text-slate-900 text-sm mt-1">One appointment only</p>
            <p className="text-[11px] text-slate-500 mt-1">Pay per session — no package</p>
          </button>
        </div>
      </section>

      {hasStructuredPackage && (
        <div className="rounded-xl bg-sky-50 border border-sky-200/70 px-4 py-3 text-sm text-sky-900">
          <FaIcon icon="fa-circle-info" className="mr-1.5" />
          Select all <strong>{requiredSessions}</strong> session dates and preferred times below.
        </div>
      )}

      {selectedPackageId === CUSTOM_PACKAGE_ID && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Add as many sessions as you need.</p>
          <button type="button" className="btn-outline text-sm" onClick={addCustomSession}>
            <FaIcon icon="fa-plus" /> Add session
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {scheduleSessions.map((sess, i) => {
            const complete = sess.date && sess.time;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSessionIndex(i)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  activeSessionIndex === i
                    ? 'bg-primary-600 text-white border-primary-600'
                    : complete
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Session {i + 1}
                {complete && <FaIcon icon="fa-check" className="text-[10px]" />}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-800">
              Session {activeSessionIndex + 1} of {scheduleSessions.length}
            </p>
            {selectedPackageId === CUSTOM_PACKAGE_ID && scheduleSessions.length > 1 && (
              <button type="button" className="text-xs text-red-600 font-semibold" onClick={() => removeCustomSession(activeSessionIndex)}>
                Remove
              </button>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Date</p>
            <input
              type="date"
              className="input-field"
              min={todayIso()}
              value={activeSession.date || ''}
              onChange={(e) => updateSession(activeSessionIndex, { date: e.target.value, time: '' })}
            />
            {(availableDatesLoading || availableDates.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {availableDatesLoading ? (
                  <span className="text-xs text-slate-500">Loading dates…</span>
                ) : (
                  availableDates.slice(0, 14).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateSession(activeSessionIndex, { date: d, time: '' })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        activeSession.date === d
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {formatDateChip(d)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {activeSession.date && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Time</p>
              {slotsLoadingDate === activeSession.date ? (
                <p className="text-slate-500 text-sm">Loading slots…</p>
              ) : activeSlots.length === 0 ? (
                <p className="text-amber-700 text-sm">No slots — try another date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {activeSlots.map((slot) => (
                    <button
                      key={slot.value || slot.time}
                      type="button"
                      onClick={() => updateSession(activeSessionIndex, { time: slot.time })}
                      className={`py-2 rounded-xl text-sm font-medium border transition ${
                        activeSession.time === slot.time
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white border-slate-200 hover:border-primary-300'
                      }`}
                    >
                      {slot.label || slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold">
          {scheduleSessions.filter((s) => s.date && s.time).length} / {scheduleSessions.length}
        </span>{' '}
        sessions scheduled
      </div>
    </div>
  );
}
