import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import { clinicPortal } from '../../services/api';
import { to12Hour } from '../../utils/timeFormat';

const MODES = [
  { id: 'clinic', label: 'In-Clinic', hint: 'At the clinic', icon: 'fa-hospital' },
  { id: 'home_visit', label: 'Home Visit', hint: 'At patient home', icon: 'fa-house-medical' },
  { id: 'online', label: 'Online', hint: 'Video session', icon: 'fa-video' },
];

const PLATFORM_LABELS = {
  zoom: 'Zoom',
};

const STEPS = [
  { id: 1, label: 'Services', icon: 'fa-hand-holding-medical' },
  { id: 2, label: 'Package', icon: 'fa-box-open' },
  { id: 3, label: 'Physio', icon: 'fa-user-doctor' },
  { id: 4, label: 'Schedule', icon: 'fa-calendar-day' },
  { id: 5, label: 'Patient', icon: 'fa-user' },
  { id: 6, label: 'Checkout', icon: 'fa-circle-check' },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function patientKey(p) {
  return p.clinic_patient_id ? `cp-${p.clinic_patient_id}` : `p-${p.patient_id}`;
}

function patientDisplayName(p) {
  if (!p) return '';
  return (
    p.patient_name ||
    `${p.first_name || ''} ${p.last_name || ''}`.trim() ||
    'Patient'
  );
}

function SelectCheck({ on }) {
  return (
    <span
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
        on ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
      }`}
      aria-hidden
    >
      {on ? <FaIcon icon="fa-check" className="text-[10px]" /> : null}
    </span>
  );
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
    setPlatform('zoom');
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
        setTimeout(() => {
          if (!cancelled) setStep(1);
        }, 650);
      } catch (e) {
        toast.error(e.message || 'Could not load booking data');
        onClose?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, clinicId]); // eslint-disable-line react-hooks/exhaustive-deps

  const services = Array.isArray(boot?.services) ? boot.services : [];
  const doctors = Array.isArray(boot?.doctors) ? boot.doctors : [];
  const packages = Array.isArray(boot?.packages) ? boot.packages : [];
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
    () =>
      selectedServices.some((id) => {
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
    return list
      .filter((p) => {
        const blob = `${p.first_name || ''} ${p.last_name || ''} ${p.phone || ''} ${p.patient_name || ''}`.toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 30);
  }, [patients, patientQ]);

  const priceLabel =
    hasTbd && !totalPrice ? 'TBD' : `${money(totalPrice)}${hasTbd && totalPrice ? ' + TBD' : ''}`;

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) || prev.includes(String(id))
        ? prev.filter((x) => String(x) !== String(id))
        : [...prev, id]
    );
  };

  const isServiceOn = (id) =>
    selectedServices.some((x) => String(x) === String(id));

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
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, clinicId, date, doctorId, anyDoctor]);

  const canGoNext = () => {
    if (step === 1) return selectedServices.length > 0;
    if (step === 2) return true;
    if (step === 3) return anyDoctor || !!doctorId;
    if (step === 4) return !!date && !!slot;
    if (step === 5) return !!selectedPatient;
    return true;
  };

  const goNext = () => {
    if (step === 2 && !existingPackageId && !skipPackage && !assignTemplateId) {
      setSkipPackage(true);
    }
    if (!canGoNext()) {
      if (step === 1) toast.error('Select at least one service');
      else if (step === 3) toast.error('Select a physiotherapist');
      else if (step === 4) toast.error('Pick a date and time slot');
      else if (step === 5) toast.error('Select a patient');
      return;
    }
    if (step === 1 && mode === 'online') setPlatform('zoom');
    setStep((s) => Math.min(6, s + 1));
  };

  const submit = async () => {
    if (!selectedPatient) return toast.error('Select a patient');
    if (!slot) return toast.error('Select a time slot');
    const resolvedDoctor = anyDoctor ? doctors[0]?.id || doctorId : doctorId;
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

      const endTime =
        slot.end_time ||
        (() => {
          const [h, m] = slot.start_time.split(':').map(Number);
          const t = h * 60 + m + 30;
          return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
        })();

      const amount = totalPrice;
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
          online_platform: mode === 'online' ? (platform || 'zoom') : null,
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

  const ServiceCard = ({ s }) => {
    const on = isServiceOn(s.id);
    return (
      <button
        type="button"
        onClick={() => toggleService(s.id)}
        aria-pressed={on}
        className={`group relative text-left rounded-2xl border p-3.5 sm:p-4 transition touch-manipulation active:scale-[0.99] ${
          on
            ? 'border-teal-400 bg-teal-50/90 shadow-sm ring-1 ring-teal-200'
            : 'border-slate-200/90 bg-white hover:border-teal-200 hover:bg-slate-50/80'
        }`}
      >
        <div className="flex items-start gap-3">
          <SelectCheck on={on} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-slate-900 leading-snug">{s.name}</p>
              <span
                className={`text-xs font-bold shrink-0 tabular-nums ${
                  on ? 'text-teal-700' : 'text-slate-600'
                }`}
              >
                {Number(s.price_tbd) ? 'TBD' : money(s.price)}
              </span>
            </div>
            {s.description ? (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {s.description}
              </p>
            ) : null}
          </div>
        </div>
      </button>
    );
  };

  const SectionLabel = ({ children, hint }) => (
    <div className="mb-2.5 flex items-baseline justify-between gap-2">
      <p className="text-sm font-semibold text-slate-800">{children}</p>
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );

  const stepMeta = STEPS.find((s) => s.id === step);
  const subtitle =
    step === 0
      ? 'Getting things ready…'
      : stepMeta
        ? `Step ${step} of ${STEPS.length} · ${stepMeta.label}`
        : '';

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      size="lg"
      zIndex={10000}
      titleId="book-appointment-title"
      preventClose={saving}
      panelClassName="!max-h-[100dvh] sm:!max-h-[min(calc(100dvh-2.5rem),820px)]"
    >
      <GlassModalHeader
        titleId="book-appointment-title"
        title="Book Appointment"
        subtitle={subtitle}
        icon="fa-calendar-plus"
        accent="cyan"
        onClose={saving ? undefined : onClose}
        disabledClose={saving}
      >
        {step > 0 && (
          <div className="mt-4">
            <div className="flex gap-1 sm:gap-1.5">
              {STEPS.map((s) => {
                const done = s.id < step;
                const current = s.id === step;
                return (
                  <div key={s.id} className="flex-1 min-w-0">
                    <div
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        done ? 'bg-teal-500' : current ? 'bg-teal-400' : 'bg-slate-200'
                      }`}
                    />
                    <p
                      className={`mt-1.5 text-[10px] sm:text-[11px] font-medium truncate text-center ${
                        current ? 'text-teal-700' : done ? 'text-slate-500' : 'text-slate-300'
                      }`}
                    >
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{s.id}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassModalHeader>

      <GlassModalBody className="!px-4 !py-4 sm:!px-6 sm:!py-5">
        {/* Splash */}
        {step === 0 && (
          <div className="flex flex-col items-center justify-center py-14 sm:py-16 gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-teal-200/40 blur-xl animate-pulse" />
              {clinic.logo_url ? (
                <img
                  src={clinic.logo_url}
                  alt=""
                  className="relative h-16 w-16 object-contain rounded-2xl bg-white border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 text-teal-700 flex items-center justify-center text-2xl font-bold border border-teal-100">
                  {(clinic.name || 'C').charAt(0)}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">{clinic.name || 'Loading clinic…'}</p>
              <p className="text-sm text-slate-500 mt-1 inline-flex items-center gap-2">
                <FaIcon icon="fa-spinner" className="fa-spin text-teal-600" />
                Preparing booking…
              </p>
            </div>
          </div>
        )}

        {/* Step 1 — Services */}
        {step === 1 && (
          <div className="space-y-6">
            <section>
              <SectionLabel hint="Required">Session mode</SectionLabel>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {MODES.map((m) => {
                  const on = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMode(m.id);
                        if (m.id === 'online') setPlatform('zoom');
                      }}
                      aria-pressed={on}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 sm:py-3.5 text-center transition touch-manipulation ${
                        on
                          ? 'bg-teal-50 border-teal-400 text-teal-900 ring-1 ring-teal-200 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          on ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <FaIcon icon={m.icon} />
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold leading-tight">{m.label}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:block leading-tight">{m.hint}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {mode === 'online' && (
              <section>
                <SectionLabel>Meeting platform</SectionLabel>
                <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3.5">
                  <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-video" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-violet-900">Zoom</p>
                    <p className="text-xs text-violet-700/80 mt-0.5">
                      Meeting link is created automatically after booking
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-violet-600 bg-white/80 border border-violet-200 px-2 py-1 rounded-full shrink-0">
                    Default
                  </span>
                </div>
              </section>
            )}

            {coreServices.length > 0 && (
              <section>
                <SectionLabel hint="Pick one or more">Core services</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {coreServices.map((s) => (
                    <ServiceCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            )}

            {addonServices.length > 0 && (
              <section>
                <SectionLabel hint="Optional">Add-ons</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {addonServices.map((s) => (
                    <ServiceCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            )}

            {customServices.length > 0 && (
              <section>
                <SectionLabel hint="Price set later">Custom request</SectionLabel>
                <div className="grid grid-cols-1 gap-2.5">
                  {customServices.map((s) => (
                    <ServiceCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            )}

            {!services.length && (
              <p className="text-sm text-slate-400 text-center py-8">No services configured for this clinic.</p>
            )}
          </div>
        )}

        {/* Step 2 — Package */}
        {step === 2 && (
          <div className="space-y-4">
            {existingPackageId ? (
              <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-box-open" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-teal-900">Using existing package</p>
                    <p className="text-xs text-teal-800/80 mt-1 leading-relaxed">
                      This booking will deduct one session from package #{existingPackageId}.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Save more with a multi-session package, or continue with a single visit.
                </p>
                <div className="space-y-2.5">
                  {packages.slice(0, 5).map((p) => {
                    const on = assignTemplateId === String(p.id) && !skipPackage;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setAssignTemplateId(String(p.id));
                          setSkipPackage(false);
                        }}
                        aria-pressed={on}
                        className={`w-full flex items-center gap-3 text-left rounded-2xl border p-3.5 sm:p-4 transition ${
                          on
                            ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-200'
                            : 'border-slate-200 hover:border-teal-200 bg-white'
                        }`}
                      >
                        <SelectCheck on={on} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {p.total_sessions} sessions · {money(p.price)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  {!packages.length && (
                    <p className="text-sm text-slate-400 text-center py-6 rounded-2xl border border-dashed border-slate-200">
                      No packages in catalog — continue with a single session.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSkipPackage(true);
                    setAssignTemplateId('');
                  }}
                  aria-pressed={skipPackage}
                  className={`w-full flex items-center gap-3 text-left rounded-2xl border p-3.5 transition ${
                    skipPackage
                      ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200'
                      : 'border-slate-200 hover:border-orange-200 bg-white'
                  }`}
                >
                  <SelectCheck on={skipPackage} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Single session only</p>
                    <p className="text-xs text-slate-500 mt-0.5">Skip package and book one visit</p>
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Physio */}
        {step === 3 && (
          <div className="space-y-2.5">
            <SectionLabel>Choose physiotherapist</SectionLabel>
            <button
              type="button"
              onClick={() => {
                setAnyDoctor(true);
                setDoctorId('');
              }}
              aria-pressed={anyDoctor}
              className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 sm:p-4 text-left transition ${
                anyDoctor
                  ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-200'
                  : 'border-slate-200 hover:border-teal-200 bg-white'
              }`}
            >
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-100 to-sky-100 text-teal-700 flex items-center justify-center shrink-0">
                <FaIcon icon="fa-user-group" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">Any available</p>
                <p className="text-xs text-slate-500">We’ll assign the best free provider</p>
              </div>
              <SelectCheck on={anyDoctor} />
            </button>
            {doctors.map((d) => {
              const on = !anyDoctor && doctorId === String(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setAnyDoctor(false);
                    setDoctorId(String(d.id));
                  }}
                  aria-pressed={on}
                  className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                    on
                      ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-200'
                      : 'border-slate-200 hover:border-teal-200 bg-white'
                  }`}
                >
                  {d.avatar ? (
                    <img src={d.avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                      {(d.name || '?').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{d.name}</p>
                    <p className="text-xs text-slate-500 truncate">{d.specialization || 'Physiotherapist'}</p>
                  </div>
                  <SelectCheck on={on} />
                </button>
              );
            })}
            {!doctors.length && (
              <p className="text-sm text-slate-400 text-center py-6">No physiotherapists linked yet.</p>
            )}
          </div>
        )}

        {/* Step 4 — Schedule */}
        {step === 4 && (
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Date</span>
              <input
                type="date"
                className="input-field mt-2"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlot(null);
                }}
              />
            </label>
            <div>
              <SectionLabel hint={slotsLoading ? 'Loading…' : undefined}>Available slots</SectionLabel>
              {slotsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[4.5rem] rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {slots.map((s) => {
                    const disabled = !!s.disabled || s.status === 'full';
                    const selected = slot?.start_time === s.start_time;
                    return (
                      <button
                        key={s.start_time}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSlot(s)}
                        aria-pressed={selected}
                        className={`rounded-2xl border p-3 text-left transition touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed ${
                          selected
                            ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-200 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-teal-200'
                        }`}
                      >
                        <p className="font-semibold text-sm text-slate-900">{to12Hour(s.start_time)}</p>
                        <p
                          className={`mt-1 text-[11px] font-medium ${
                            disabled
                              ? 'text-rose-600'
                              : s.remaining <= 1
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                          }`}
                        >
                          {disabled
                            ? 'Fully booked'
                            : `${s.remaining} of ${s.capacity} left`}
                        </p>
                      </button>
                    );
                  })}
                  {!slots.length && (
                    <p className="col-span-full text-sm text-slate-400 text-center py-10 rounded-2xl border border-dashed border-slate-200">
                      No slots for this date — try another day
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5 — Patient */}
        {step === 5 && (
          <div className="space-y-4">
            <SectionLabel>Select patient</SectionLabel>
            {selectedPatient ? (
              <div className="flex items-center gap-3 rounded-2xl bg-teal-50 border border-teal-200 px-4 py-3.5">
                <div className="w-11 h-11 rounded-full bg-teal-200/80 flex items-center justify-center font-bold text-teal-800 shrink-0">
                  {patientDisplayName(selectedPatient).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-slate-900">{patientDisplayName(selectedPatient)}</p>
                  <p className="text-xs text-slate-500">{selectedPatient.phone || 'No phone'}</p>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1.5 rounded-lg hover:bg-teal-100/80"
                  onClick={() => setPatientKeySel('')}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <FaIcon
                    icon="fa-magnifying-glass"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
                  />
                  <input
                    className="input-field !pl-10"
                    placeholder="Search by name or mobile…"
                    value={patientQ}
                    onChange={(e) => setPatientQ(e.target.value)}
                    autoFocus
                  />
                </div>
                <ul className="rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-56 sm:max-h-64 overflow-y-auto bg-white">
                  {filteredPatients.map((p) => (
                    <li key={patientKey(p)}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-slate-50 active:bg-teal-50/50 transition"
                        onClick={() => setPatientKeySel(patientKey(p))}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {patientDisplayName(p).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-slate-900">{patientDisplayName(p)}</p>
                          <p className="text-xs text-slate-500">{p.phone || '—'}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                  {!filteredPatients.length && (
                    <li className="px-4 py-8 text-center text-sm text-slate-400">No patients match your search</li>
                  )}
                </ul>
              </>
            )}
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Chief complaint</span>
              <span className="text-slate-400 font-normal text-xs ml-1">(optional)</span>
              <input
                className="input-field mt-2"
                value={painType}
                onChange={(e) => setPainType(e.target.value)}
                placeholder="e.g. Lower back pain"
              />
            </label>
          </div>
        )}

        {/* Step 6 — Checkout */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5 space-y-3 text-sm">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <FaIcon icon="fa-receipt" className="text-teal-600" />
                Booking summary
              </p>
              <dl className="space-y-2.5">
                {[
                  [
                    'Services',
                    selectedServices
                      .map((id) => services.find((s) => String(s.id) === String(id))?.name)
                      .filter(Boolean)
                      .join(', ') || '—',
                  ],
                  [
                    'Mode',
                    `${MODES.find((m) => m.id === mode)?.label || '—'}${
                      mode === 'online' && platform ? ` · ${PLATFORM_LABELS[platform] || platform}` : ''
                    }`,
                  ],
                  [
                    'Physio',
                    anyDoctor ? 'Any available' : doctors.find((d) => String(d.id) === doctorId)?.name || '—',
                  ],
                  ['When', `${date} · ${slot ? to12Hour(slot.start_time) : '—'}`],
                  ['Patient', patientDisplayName(selectedPatient) || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 justify-between">
                    <dt className="text-slate-400 shrink-0">{k}</dt>
                    <dd className="text-slate-800 font-medium text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between gap-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Total</span>
                <span className="font-bold text-xl text-teal-700 tabular-nums">
                  {existingPackageId || (assignTemplateId && !skipPackage)
                    ? 'Package covered'
                    : hasTbd && totalPrice === 0
                      ? 'Price TBD'
                      : priceLabel}
                </span>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800 mb-2.5">Payment</legend>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayAtClinic(false)}
                  aria-pressed={!payAtClinic}
                  className={`rounded-2xl border p-3.5 text-sm font-semibold transition ${
                    !payAtClinic
                      ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-200 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <FaIcon icon="fa-globe" className="mb-1 block text-base opacity-80" />
                  Pay online
                </button>
                <button
                  type="button"
                  onClick={() => setPayAtClinic(true)}
                  aria-pressed={payAtClinic}
                  className={`rounded-2xl border p-3.5 text-sm font-semibold transition ${
                    payAtClinic
                      ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-200 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <FaIcon icon="fa-hospital" className="mb-1 block text-base opacity-80" />
                  Pay at clinic
                </button>
              </div>
              {payAtClinic && (
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                  Confirmed now · payment marked due. Reception can collect later.
                </p>
              )}
            </fieldset>
          </div>
        )}
      </GlassModalBody>

      {step > 0 && (
        <GlassModalFooter>
          <div className="w-full space-y-2.5">
            {step === 1 && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">
                  <span className="font-semibold text-slate-800">{selectedServices.length}</span> selected
                </span>
                <span className="font-bold text-teal-700 tabular-nums">Total {priceLabel}</span>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  className="btn-outline text-sm w-full sm:w-auto sm:min-w-[6.5rem] justify-center"
                  disabled={saving}
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-outline text-sm w-full sm:w-auto sm:min-w-[6.5rem] justify-center"
                  onClick={onClose}
                >
                  Cancel
                </button>
              )}
              {step < 6 ? (
                <button
                  type="button"
                  className="btn-primary text-sm w-full sm:flex-1 justify-center disabled:opacity-50"
                  disabled={!canGoNext()}
                  onClick={goNext}
                >
                  Continue
                  <FaIcon icon="fa-arrow-right" className="ml-1.5 text-xs opacity-90" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary text-sm w-full sm:flex-1 justify-center disabled:opacity-50"
                  disabled={saving}
                  onClick={submit}
                >
                  {saving ? (
                    <>
                      <FaIcon icon="fa-spinner" className="fa-spin" />
                      Booking…
                    </>
                  ) : (
                    <>
                      <FaIcon icon="fa-circle-check" />
                      Confirm booking
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </GlassModalFooter>
      )}
    </GlassModal>
  );
}
