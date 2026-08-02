import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { clinicPortal } from '../../services/api';
import { to12Hour } from '../../utils/timeFormat';

const MODES = [
  { id: 'clinic', label: 'In-Clinic', icon: 'fa-hospital' },
  { id: 'home_visit', label: 'Home Visit', icon: 'fa-house-medical' },
  { id: 'online', label: 'Online Session', icon: 'fa-video' },
];

const PLATFORM_LABELS = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  teams: 'Microsoft Teams',
  jitsi: 'Jitsi',
  whatsapp: 'WhatsApp',
};

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function patientKey(p) {
  return p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
}

/**
 * Advanced multi-step booking engine.
 * Drop-in replacement for the previous single-form ClinicBookingModal.
 */
export default function AdvancedBookingWizard({
  clinicId,
  open,
  onClose,
  onBooked,
  initialPatient,
  initialDate,
  initialDoctorId,
  initialStartTime,
  initialEndTime,
  /** Existing clinic_patient_packages.id — schedule against this package (no new assign) */
  initialPackageAssignmentId,
  initialMode,
}) {
  const [step, setStep] = useState(0); // 0 = splash
  const [boot, setBoot] = useState(null);
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [mode, setMode] = useState('clinic');
  const [platform, setPlatform] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [skipPackage, setSkipPackage] = useState(false);
  const [assignTemplateId, setAssignTemplateId] = useState('');
  const [existingPackageId, setExistingPackageId] = useState(null);
  const [doctorId, setDoctorId] = useState('');
  const [anyDoctor, setAnyDoctor] = useState(false);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [patientKeySel, setPatientKeySel] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [payAtClinic, setPayAtClinic] = useState(true);
  const [painType, setPainType] = useState('');

  const reset = useCallback(() => {
    setStep(0);
    setMode('clinic');
    setPlatform('');
    setSelectedServices([]);
    setSkipPackage(false);
    setAssignTemplateId('');
    setExistingPackageId(null);
    setDoctorId('');
    setAnyDoctor(false);
    setSlot(null);
    setSlots([]);
    setPatientKeySel('');
    setPatientQ('');
    setPayAtClinic(true);
    setPainType('');
  }, []);

  // Splash + bootstrap
  useEffect(() => {
    if (!open || !clinicId) return;
    reset();
    setDate(initialDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    if (initialDoctorId) setDoctorId(String(initialDoctorId));
    if (initialStartTime) {
      setSlot({
        start_time: String(initialStartTime).slice(0, 5),
        end_time: String(initialEndTime || '').slice(0, 5) || undefined,
      });
    }
    if (initialMode && ['clinic', 'home_visit', 'online'].includes(initialMode)) {
      setMode(initialMode);
    }
    if (initialPackageAssignmentId) {
      setExistingPackageId(Number(initialPackageAssignmentId));
      setSkipPackage(true);
    }

    let cancelled = false;
    (async () => {
      try {
        const [bootRes, patRes] = await Promise.all([
          clinicPortal.bookingBootstrap(clinicId),
          clinicPortal.patients(clinicId, { page: 1, per_page: 100 }),
        ]);
        if (cancelled) return;
        setBoot(bootRes.data || bootRes);
        const patPayload = patRes.data || patRes || {};
        const patRows = Array.isArray(patPayload)
          ? patPayload
          : Array.isArray(patPayload.items)
            ? patPayload.items
            : Array.isArray(patPayload.patients)
              ? patPayload.patients
              : [];
        setPatients(patRows);
        if (initialPatient) setPatientKeySel(initialPatient);
        // Brief splash then advance
        setTimeout(() => {
          if (!cancelled) setStep(1);
        }, 900);
      } catch (e) {
        toast.error(e.message || 'Could not load booking data');
        onClose?.();
      }
    })();
    return () => { cancelled = true; };
  }, [open, clinicId]); // eslint-disable-line react-hooks/exhaustive-deps

  const services = Array.isArray(boot?.services) ? boot.services : [];
  const doctors = Array.isArray(boot?.doctors) ? boot.doctors : [];
  const packages = Array.isArray(boot?.packages) ? boot.packages : [];
  const platforms = Array.isArray(boot?.online_platforms) ? boot.online_platforms : [];
  const clinic = boot?.clinic || {};

  const coreServices = services.filter((s) => s.bucket === 'core');
  const addonServices = services.filter((s) => s.bucket === 'addon');
  const customServices = services.filter((s) => s.bucket === 'custom');

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, id) => {
      const s = services.find((x) => String(x.id) === String(id));
      if (!s || Number(s.price_tbd)) return sum;
      return sum + Number(s.price || 0);
    }, 0);
  }, [selectedServices, services]);

  const hasTbd = useMemo(
    () => selectedServices.some((id) => {
      const s = services.find((x) => String(x.id) === String(id));
      return s && Number(s.price_tbd);
    }),
    [selectedServices, services]
  );

  const selectedPatient = useMemo(() => {
    if (!Array.isArray(patients) || !patientKeySel) return undefined;
    return patients.find((p) => patientKey(p) === patientKeySel);
  }, [patients, patientKeySel]);

  const filteredPatients = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];
    const q = patientQ.trim().toLowerCase();
    if (!q) return list.slice(0, 30);
    return list.filter((p) => {
      const blob = `${p.first_name || ''} ${p.last_name || ''} ${p.phone || ''} ${p.patient_name || ''}`.toLowerCase();
      return blob.includes(q);
    }).slice(0, 30);
  }, [patients, patientQ]);

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Load capacity slots when on Schedule step (step 4)
  useEffect(() => {
    if (step !== 4 || !clinicId || !date) return undefined;
    let cancelled = false;
    setSlotsLoading(true);
    clinicPortal
      .bookingCapacitySlots(clinicId, {
        date,
        doctor_id: anyDoctor ? 0 : doctorId || 0,
      })
      .then((res) => {
        if (cancelled) return;
        setSlots(res.data?.slots || res.slots || []);
      })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [step, clinicId, date, doctorId, anyDoctor]);

  const STEPS = [
    { id: 1, label: 'Services' },
    { id: 2, label: 'Package' },
    { id: 3, label: 'Physio' },
    { id: 4, label: 'Schedule' },
    { id: 5, label: 'Patient' },
    { id: 6, label: 'Checkout' },
  ];

  const submit = async () => {
    if (!selectedPatient) return toast.error('Select a patient');
    if (!slot) return toast.error('Select a time slot');
    const resolvedDoctor = anyDoctor
      ? (doctors[0]?.id || doctorId)
      : doctorId;
    if (!resolvedDoctor) return toast.error('Select a physiotherapist');

    setSaving(true);
    try {
      let packageAssignmentId = existingPackageId ? Number(existingPackageId) : undefined;
      if (!packageAssignmentId && assignTemplateId && !skipPackage) {
        const assigned = await clinicPortal.assignPackageTemplate(clinicId, {
          template_id: Number(assignTemplateId),
          patient_id: selectedPatient.patient_id || undefined,
          clinic_patient_id: selectedPatient.clinic_patient_id || undefined,
          doctor_id: Number(resolvedDoctor),
        });
        const pkg = assigned.data || assigned;
        packageAssignmentId = pkg?.id ? Number(pkg.id) : undefined;
      }

      const servicePayload = selectedServices.map((id) => {
        const s = services.find((x) => String(x.id) === String(id));
        return s
          ? {
              id: s.id,
              name: s.name,
              bucket: s.bucket,
              price: Number(s.price_tbd) ? 0 : Number(s.price),
              price_tbd: !!Number(s.price_tbd),
            }
          : { id };
      });

      const endTime = slot.end_time || (() => {
        const [h, m] = slot.start_time.split(':').map(Number);
        const t = h * 60 + m + 30;
        return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
      })();

      const amount = hasTbd ? totalPrice : totalPrice;
      const payload = {
        doctor_id: Number(resolvedDoctor),
        consultation_type: mode,
        dates: [{ date, start_time: slot.start_time, end_time: endTime }],
        pain_type: painType,
        patient_id: selectedPatient.patient_id || undefined,
        clinic_patient_id: selectedPatient.clinic_patient_id || undefined,
        package_assignment_id: packageAssignmentId,
        amount: packageAssignmentId ? 0 : amount,
        payment_status: payAtClinic ? 'due' : 'pending_online',
        booking_meta: {
          services: servicePayload,
          online_platform: mode === 'online' ? platform : null,
          pay_at_clinic: payAtClinic,
          any_doctor: anyDoctor,
        },
      };

      await clinicPortal.createBooking(clinicId, payload);
      toast.success(
        payAtClinic
          ? 'Appointment confirmed · Payment due at clinic'
          : 'Appointment booked · Complete online payment'
      );
      onBooked?.();
      onClose?.();
      reset();
    } catch (e) {
      toast.error(e.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const ServiceCard = ({ s }) => {
    const on = selectedServices.includes(s.id) || selectedServices.includes(String(s.id));
    return (
      <button
        type="button"
        onClick={() => toggleService(s.id)}
        className={`text-left rounded-xl border p-3 transition ${
          on ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex justify-between gap-2">
          <p className="font-semibold text-sm text-slate-900">{s.name}</p>
          <span className="text-xs font-bold text-teal-700 shrink-0">
            {Number(s.price_tbd) ? 'TBD' : money(s.price)}
          </span>
        </div>
        {s.description && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{s.description}</p>}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[94dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 truncate">Book Appointment</h2>
            {step > 0 && (
              <p className="text-[11px] text-slate-500">
                Step {step} of 6 · {STEPS.find((s) => s.id === step)?.label}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 shrink-0">
            <FaIcon icon="fa-xmark" />
          </button>
        </header>

        {step > 0 && (
          <div className="flex gap-1 px-4 py-2 shrink-0">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex-1 h-1 rounded-full ${s.id < step ? 'bg-teal-500' : s.id === step ? 'bg-teal-300' : 'bg-slate-100'}`}
              />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
          {/* SPLASH */}
          {step === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              {clinic.logo_url ? (
                <img src={clinic.logo_url} alt="" className="h-16 w-16 object-contain rounded-xl" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-bold">
                  {(clinic.name || 'C').charAt(0)}
                </div>
              )}
              <p className="font-semibold text-slate-800">{clinic.name || 'Loading clinic…'}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FaIcon icon="fa-spinner fa-spin" />
                Preparing booking…
              </div>
            </div>
          )}

          {/* STEP 1: Services */}
          {step === 1 && (
            <div className="space-y-4 pb-20">
              <fieldset>
                <legend className="text-sm font-semibold mb-2">Session Mode</legend>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium ${
                        mode === m.id ? 'bg-teal-50 border-teal-400 text-teal-800' : 'border-slate-200'
                      }`}
                    >
                      <FaIcon icon={m.icon} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {mode === 'online' && (
                <fieldset>
                  <legend className="text-sm font-semibold mb-2">Meeting Platform</legend>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${
                          platform === p ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200'
                        }`}
                      >
                        {PLATFORM_LABELS[p] || p}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">Core Services</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {coreServices.map((s) => <ServiceCard key={s.id} s={s} />)}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Add-on Services</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {addonServices.map((s) => <ServiceCard key={s.id} s={s} />)}
                </div>
              </div>
              {customServices.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Custom Request</p>
                  <div className="grid grid-cols-1 gap-2">
                    {customServices.map((s) => <ServiceCard key={s.id} s={s} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Package upsell */}
          {step === 2 && (
            <div className="space-y-4">
              {existingPackageId ? (
                <>
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                    <p className="text-sm font-semibold text-teal-900">Using existing package</p>
                    <p className="text-xs text-teal-800 mt-1">
                      This booking will deduct one session from the selected package (#{existingPackageId}).
                    </p>
                  </div>
                  <button type="button" className="btn-primary text-sm w-full" onClick={() => setStep(3)}>
                    Continue to physiotherapist
                  </button>
                </>
              ) : (
                <>
              <p className="text-sm text-slate-600">Save more with a multi-session package before booking a single visit.</p>
              <div className="space-y-2">
                {packages.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setAssignTemplateId(String(p.id)); setSkipPackage(false); }}
                    className={`w-full text-left rounded-xl border p-3 ${
                      assignTemplateId === String(p.id) && !skipPackage
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.total_sessions} sessions · {money(p.price)}
                    </p>
                  </button>
                ))}
                {!packages.length && (
                  <p className="text-sm text-slate-400 text-center py-4">No packages in catalog.</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSkipPackage(false); if (assignTemplateId) setStep(3); else toast.error('Select a package or continue single'); }}
                  className="btn-outline text-sm"
                  disabled={!assignTemplateId}
                >
                  View / Use Package
                </button>
                <button
                  type="button"
                  onClick={() => { setSkipPackage(true); setAssignTemplateId(''); setStep(3); }}
                  className="btn-primary text-sm"
                >
                  Continue Single Session
                </button>
              </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Physiotherapist */}
          {step === 3 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => { setAnyDoctor(true); setDoctorId(''); }}
                className={`w-full rounded-xl border p-3 text-left ${
                  anyDoctor ? 'border-teal-400 bg-teal-50' : 'border-slate-200'
                }`}
              >
                <p className="font-semibold text-sm">Any Available Physiotherapist</p>
                <p className="text-xs text-slate-500">We'll assign the best available provider</p>
              </button>
              {doctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setAnyDoctor(false); setDoctorId(String(d.id)); }}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left ${
                    !anyDoctor && doctorId === String(d.id) ? 'border-teal-400 bg-teal-50' : 'border-slate-200'
                  }`}
                >
                  {d.avatar ? (
                    <img src={d.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {(d.name || '?').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{d.name}</p>
                    <p className="text-xs text-slate-500 truncate">{d.specialization || 'Physiotherapist'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 4: Smart Calendar */}
          {step === 4 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                Date
                <input
                  type="date"
                  className="input-field mt-1"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => { setDate(e.target.value); setSlot(null); }}
                />
              </label>
              <div>
                <p className="text-sm font-semibold mb-2">Available Slots</p>
                {slotsLoading ? (
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const disabled = !!s.disabled || s.status === 'full';
                      const selected = slot?.start_time === s.start_time;
                      return (
                        <button
                          key={s.start_time}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSlot(s)}
                          className={`rounded-xl border p-2.5 text-left text-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                            selected ? 'border-teal-400 bg-teal-50' : 'border-slate-200'
                          }`}
                        >
                          <p className="font-semibold text-sm">{to12Hour(s.start_time)}</p>
                          <p className={`mt-0.5 ${disabled ? 'text-rose-600' : s.remaining <= 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {disabled
                              ? 'Fully Booked'
                              : `${s.booked}/${s.capacity} Slots · ${s.remaining} left`}
                          </p>
                        </button>
                      );
                    })}
                    {!slots.length && !slotsLoading && (
                      <p className="col-span-full text-sm text-slate-400 text-center py-6">No slots for this date</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Patient */}
          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Select Patient</p>
              {selectedPatient ? (
                <div className="flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-teal-200 flex items-center justify-center font-bold text-teal-800">
                    {(selectedPatient.first_name || selectedPatient.patient_name || '?').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {selectedPatient.patient_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}
                    </p>
                    <p className="text-xs text-slate-500">{selectedPatient.phone}</p>
                  </div>
                  <button type="button" className="text-xs text-teal-700 font-medium" onClick={() => setPatientKeySel('')}>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="input-field"
                    placeholder="Search patient by name or mobile…"
                    value={patientQ}
                    onChange={(e) => setPatientQ(e.target.value)}
                    autoFocus
                  />
                  <ul className="divide-y divide-slate-50 border rounded-xl max-h-64 overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <li key={patientKey(p)}>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                          onClick={() => setPatientKeySel(patientKey(p))}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                            {(p.first_name || p.patient_name || '?').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {p.patient_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()}
                            </p>
                            <p className="text-xs text-slate-500">{p.phone}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <label className="block text-sm font-medium">
                Chief complaint / pain area (optional)
                <input className="input-field mt-1" value={painType} onChange={(e) => setPainType(e.target.value)} />
              </label>
            </div>
          )}

          {/* STEP 6: Checkout */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
                <p className="font-semibold text-slate-800 mb-2">Booking Summary</p>
                <p><span className="text-slate-500">Services:</span>{' '}
                  {selectedServices.map((id) => services.find((s) => String(s.id) === String(id))?.name).filter(Boolean).join(', ')}
                </p>
                <p><span className="text-slate-500">Mode:</span> {MODES.find((m) => m.id === mode)?.label}
                  {mode === 'online' && platform ? ` · ${PLATFORM_LABELS[platform] || platform}` : ''}
                </p>
                <p><span className="text-slate-500">Physio:</span>{' '}
                  {anyDoctor ? 'Any available' : (doctors.find((d) => String(d.id) === doctorId)?.name || '—')}
                </p>
                <p><span className="text-slate-500">When:</span> {date} · {slot ? to12Hour(slot.start_time) : '—'}</p>
                <p><span className="text-slate-500">Patient:</span>{' '}
                  {selectedPatient?.patient_name || `${selectedPatient?.first_name || ''} ${selectedPatient?.last_name || ''}`.trim()}
                </p>
                <p className="pt-2 border-t font-bold text-lg text-teal-700">
                  Total: {hasTbd && totalPrice === 0 ? 'Price TBD' : money(totalPrice)}
                  {hasTbd && totalPrice > 0 ? ' + TBD' : ''}
                  {existingPackageId || (assignTemplateId && !skipPackage) ? ' (covered by package)' : ''}
                </p>
              </div>

              <fieldset>
                <legend className="text-sm font-semibold mb-2">Payment</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayAtClinic(false)}
                    className={`rounded-xl border p-3 text-sm font-medium ${!payAtClinic ? 'bg-teal-50 border-teal-400' : 'border-slate-200'}`}
                  >
                    Pay Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAtClinic(true)}
                    className={`rounded-xl border p-3 text-sm font-medium ${payAtClinic ? 'bg-teal-50 border-teal-400' : 'border-slate-200'}`}
                  >
                    Pay at Clinic
                  </button>
                </div>
                {payAtClinic && (
                  <p className="text-xs text-slate-500 mt-2">
                    Status = Confirmed · Payment = Due. Reception can collect later.
                  </p>
                )}
              </fieldset>
            </div>
          )}
        </div>

        {/* Sticky total + footer */}
        {step > 0 && (
          <footer className="shrink-0 border-t bg-white px-4 sm:px-5 py-3 space-y-2">
            {step === 1 && (
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600">{selectedServices.length} selected</span>
                <span className="text-teal-700">
                  Total {hasTbd && !totalPrice ? 'TBD' : money(totalPrice)}{hasTbd && totalPrice ? ' + TBD' : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              {step > 1 ? (
                <button type="button" className="btn-outline text-sm" onClick={() => setStep(step - 1)}>
                  Back
                </button>
              ) : (
                <button type="button" className="btn-outline text-sm" onClick={onClose}>Cancel</button>
              )}
              {step < 6 ? (
                <button
                  type="button"
                  className="btn-primary text-sm disabled:opacity-50"
                  disabled={
                    (step === 1 && (!selectedServices.length || (mode === 'online' && !platform))) ||
                    (step === 3 && !anyDoctor && !doctorId) ||
                    (step === 4 && (!date || !slot)) ||
                    (step === 5 && !selectedPatient)
                  }
                  onClick={() => {
                    if (step === 2) {
                      // handled by package buttons mostly
                      setStep(3);
                      return;
                    }
                    setStep(step + 1);
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary text-sm disabled:opacity-50"
                  disabled={saving}
                  onClick={submit}
                >
                  {saving ? 'Booking…' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
