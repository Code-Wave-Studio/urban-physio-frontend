import FaIcon from '../FaIcon';

export const VISIT_PACKAGES = [
  { id: 'single', label: 'Single Visit', sessions: 1, days: 1 },
  { id: '7days', label: '7 Days', sessions: 7, days: 7 },
  { id: '10days', label: '10 Days', sessions: 10, days: 10 },
  { id: '15days', label: '15 Days', sessions: 15, days: 15 },
];

export default function BookingScheduleStep({
  form,
  patch,
  packageId,
  onPackageChange,
  availableDates,
  availableDatesLoading,
  timeSlots,
  slotsLoading,
  prefillTime,
}) {
  const selectedPkg = VISIT_PACKAGES.find((p) => p.id === packageId) || VISIT_PACKAGES[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Package & schedule</h2>
        <p className="text-sm text-slate-600 mt-1">
          Choose your visit package. Remaining sessions are saved to your account to book later.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VISIT_PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onPackageChange(pkg)}
            className={`rounded-2xl border-2 p-3 text-left transition ${
              packageId === pkg.id
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-slate-200 bg-white/80 hover:border-primary-200'
            }`}
          >
            <p className="text-xs font-bold text-primary-600 uppercase">{pkg.days === 1 ? '1 visit' : `${pkg.days} days`}</p>
            <p className="font-bold text-slate-900 text-sm mt-1">{pkg.label}</p>
            <p className="text-[11px] text-slate-500 mt-1">{pkg.sessions} session{pkg.sessions > 1 ? 's' : ''}</p>
          </button>
        ))}
      </div>

      {selectedPkg.sessions > 1 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200/70 px-4 py-3 text-sm text-emerald-900">
          <FaIcon icon="fa-circle-info" className="mr-1.5" />
          You can complete up to <strong>{selectedPkg.sessions}</strong> visits. Session 1 is booked now; remaining visits stay in your patient account.
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Appointment date</label>
        <input
          type="date"
          className="input-field"
          min={new Date().toISOString().split('T')[0]}
          value={form.appointment_date}
          onChange={(e) => patch({ appointment_date: e.target.value, start_time: '' })}
        />

        {(availableDatesLoading || availableDates.length > 0) && (
          <div className="rounded-xl bg-white/50 border border-slate-200/80 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Available dates</p>
            {availableDatesLoading ? (
              <p className="text-sm text-slate-500 mt-2">Loading…</p>
            ) : availableDates.length === 0 ? (
              <p className="text-sm text-amber-700 mt-2">No availability in the next 60 days.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {availableDates.slice(0, 14).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => patch({ appointment_date: d, start_time: prefillTime || '' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      form.appointment_date === d
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {form.appointment_date && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Time slot</p>
          {slotsLoading ? (
            <p className="text-slate-500 text-sm">Loading slots…</p>
          ) : timeSlots.length === 0 ? (
            <p className="text-amber-700 text-sm">No slots for this date — pick another date.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.value || slot.time}
                  type="button"
                  onClick={() => patch({ start_time: slot.time })}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                    form.start_time === slot.time
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                      : 'bg-white border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
