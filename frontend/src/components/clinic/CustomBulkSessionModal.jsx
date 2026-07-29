import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { clinicPortal } from '../../services/api';

const SERVICE_MODES = [
  { id: 'clinic',     label: 'Clinic',      icon: 'fa-hospital' },
  { id: 'home_visit', label: 'Home Visit',   icon: 'fa-house-medical' },
  { id: 'online',     label: 'Online',       icon: 'fa-video' },
];

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'online'];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function calcFinal(price, discountType, discountValue) {
  const p = Number(price) || 0;
  const d = Number(discountValue) || 0;
  if (!discountType) return p;
  if (discountType === 'flat') return Math.max(0, p - d);
  if (discountType === 'percent') return Math.max(0, p - (p * d) / 100);
  return p;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const EMPTY = {
  // Step 1
  clinic_patient_id: '',
  patient_name: '',
  patient_phone: '',
  // Step 2
  service_type: '',
  service_mode: 'clinic',
  // Step 3
  total_sessions: 10,
  never_expires: false,
  duration_days: 30,
  // Step 4
  price: 0,
  discount_type: '',
  discount_value: 0,
  payment_method: 'cash',
  notes: '',
};

export default function CustomBulkSessionModal({ clinicId, onClose, onCreated }) {
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  // Step 1 patient search
  const [searchQ, setSearchQ]       = useState('');
  const [patients, setPatients]     = useState([]);
  const [searching, setSearching]   = useState(false);

  // Step 2 service types
  const [serviceTypes, setServiceTypes] = useState([]);

  const debounce = useRef(null);

  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Patient search ────────────────────────────────────────────────────
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = searchQ.trim();
    if (q.length < 2) { setPatients([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await clinicPortal.packagePatientSearch(clinicId, q);
        setPatients(res.data || res || []);
      } catch {
        setPatients([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [searchQ, clinicId]);

  // ── Service types ─────────────────────────────────────────────────────
  useEffect(() => {
    clinicPortal.serviceTypes(clinicId)
      .then((r) => setServiceTypes(r.data || r || []))
      .catch(() => setServiceTypes([]));
  }, [clinicId]);

  // ── Derived ──────────────────────────────────────────────────────────
  const finalPrice = calcFinal(form.price, form.discount_type, form.discount_value);
  const expiryDate = !form.never_expires && form.duration_days > 0
    ? addDays(new Date().toISOString().split('T')[0], Number(form.duration_days))
    : null;

  // ── Submit ───────────────────────────────────────────────────────────
  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        clinic_patient_id: form.clinic_patient_id,
        service_type:      form.service_type || null,
        service_mode:      form.service_mode,
        total_sessions:    Number(form.total_sessions),
        never_expires:     form.never_expires,
        duration_days:     form.never_expires ? 0 : Number(form.duration_days),
        price:             Number(form.price),
        discount_type:     form.discount_type || null,
        discount_value:    Number(form.discount_value),
        payment_method:    form.payment_method,
        notes:             form.notes,
      };
      const res = await clinicPortal.createCustomBulk(clinicId, payload);
      toast.success('Custom bulk session package created');
      onCreated && onCreated(res.data || res);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Could not create package');
    } finally {
      setSaving(false);
    }
  };

  const canNext1 = !!form.clinic_patient_id;
  const canNext2 = !!form.service_mode;
  const canNext3 = Number(form.total_sessions) >= 1 && (form.never_expires || Number(form.duration_days) >= 1);
  const canSubmit = canNext1 && canNext2 && canNext3;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-bold text-slate-900 text-base">Create Custom Bulk Session</p>
            <p className="text-xs text-slate-500 mt-0.5">Step {step} of 4</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <FaIcon icon="fa-xmark" className="text-lg" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex px-5 py-3 gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all ${
                s < step ? 'bg-teal-500' : s === step ? 'bg-teal-300' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">

          {/* ── STEP 1: Select Patient ─────────────────────────────── */}
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-slate-700">Select Patient</p>
              {form.clinic_patient_id ? (
                <div className="flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {(form.patient_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{form.patient_name}</p>
                    {form.patient_phone && <p className="text-xs text-slate-500">{form.patient_phone}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { field('clinic_patient_id', ''); field('patient_name', ''); field('patient_phone', ''); setSearchQ(''); setPatients([]); }}
                    className="ml-auto text-xs text-teal-700 font-medium hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search by name or mobile…"
                      className="input-field pl-9"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                    />
                    {searching && (
                      <FaIcon icon="fa-spinner fa-spin" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}
                  </div>
                  {patients.length > 0 && (
                    <ul className="rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                      {patients.map((p) => (
                        <li key={p.clinic_patient_id}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                            onClick={() => {
                              field('clinic_patient_id', p.clinic_patient_id);
                              field('patient_name', p.name || `${p.first_name} ${p.last_name || ''}`.trim());
                              field('patient_phone', p.phone || '');
                              setPatients([]);
                              setSearchQ('');
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                              {(p.name || p.first_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{p.name || `${p.first_name} ${p.last_name || ''}`}</p>
                              {p.phone && <p className="text-xs text-slate-500">{p.phone}</p>}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchQ.length >= 2 && !searching && patients.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No patients found</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Service Details ────────────────────────────── */}
          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-slate-700">Service Details</p>
              <label className="block text-sm font-medium">
                Service Type
                <select
                  className="input-field mt-1"
                  value={
                    form.service_type
                    && !serviceTypes.includes(form.service_type)
                    && form.service_type !== ''
                      ? '__custom__'
                      : form.service_type
                  }
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      field('service_type', '');
                      field('_custom_service', true);
                    } else {
                      field('_custom_service', false);
                      field('service_type', e.target.value);
                    }
                  }}
                >
                  <option value="">Select service type…</option>
                  {serviceTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__custom__">Other (type below)</option>
                </select>
              </label>
              {(form._custom_service || (form.service_type && !serviceTypes.includes(form.service_type) && form.service_type !== '')) && (
                <label className="block text-sm font-medium">
                  Custom Service Type
                  <input
                    className="input-field mt-1"
                    placeholder="e.g. Occupational Therapy"
                    value={form._custom_service ? (form.service_type || '') : form.service_type}
                    onChange={(e) => {
                      field('_custom_service', true);
                      field('service_type', e.target.value);
                    }}
                  />
                </label>
              )}
              <fieldset>
                <legend className="text-sm font-medium mb-2">Service Mode</legend>
                <div className="grid grid-cols-3 gap-2">
                  {SERVICE_MODES.map((m) => (
                    <label
                      key={m.id}
                      className={`flex flex-col items-center gap-1.5 border rounded-xl p-3 cursor-pointer transition-all text-xs font-medium ${
                        form.service_mode === m.id
                          ? 'bg-teal-50 border-teal-400 text-teal-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input type="radio" name="service_mode" value={m.id} checked={form.service_mode === m.id}
                        onChange={() => field('service_mode', m.id)} className="sr-only" />
                      <FaIcon icon={m.icon} className="text-base" />
                      {m.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {/* ── STEP 3: Sessions & Validity ───────────────────────── */}
          {step === 3 && (
            <>
              <p className="text-sm font-semibold text-slate-700">Sessions &amp; Validity</p>
              <label className="block text-sm font-medium">
                Number of Sessions
                <input
                  type="number"
                  min="1"
                  max="365"
                  className="input-field mt-1"
                  value={form.total_sessions}
                  onChange={(e) => field('total_sessions', e.target.value)}
                />
              </label>

              <label className="flex items-center gap-3 text-sm font-medium cursor-pointer select-none">
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.never_expires ? 'bg-teal-500' : 'bg-slate-300'}`}
                  onClick={() => field('never_expires', !form.never_expires)}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.never_expires ? 'translate-x-5' : ''}`}
                  />
                </div>
                Never Expires
              </label>

              {!form.never_expires && (
                <>
                  <label className="block text-sm font-medium">
                    Validity (days)
                    <input
                      type="number"
                      min="1"
                      className="input-field mt-1"
                      value={form.duration_days}
                      onChange={(e) => field('duration_days', e.target.value)}
                    />
                  </label>
                  {expiryDate && (
                    <p className="text-xs text-slate-500">
                      Expires on <span className="font-semibold text-slate-700">{new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {/* ── STEP 4: Pricing ───────────────────────────────────── */}
          {step === 4 && (
            <>
              <p className="text-sm font-semibold text-slate-700">Pricing</p>
              <label className="block text-sm font-medium">
                Base Amount (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field mt-1"
                  value={form.price}
                  onChange={(e) => field('price', e.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Discount Type
                  <select
                    className="input-field mt-1"
                    value={form.discount_type}
                    onChange={(e) => field('discount_type', e.target.value)}
                  >
                    <option value="">No Discount</option>
                    <option value="flat">Flat (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </label>
                {form.discount_type && (
                  <label className="block text-sm font-medium">
                    Discount Value
                    <input
                      type="number"
                      min="0"
                      className="input-field mt-1"
                      value={form.discount_value}
                      onChange={(e) => field('discount_value', e.target.value)}
                    />
                  </label>
                )}
              </div>

              {/* Final price */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex justify-between items-center">
                <p className="text-sm font-semibold text-emerald-800">Amount Due</p>
                <p className="text-lg font-bold text-emerald-700">{money(finalPrice)}</p>
              </div>

              <fieldset>
                <legend className="text-sm font-medium mb-2">Payment Method</legend>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m}
                      className={`px-3 py-1.5 rounded-xl border text-xs capitalize cursor-pointer ${
                        form.payment_method === m
                          ? 'bg-teal-50 border-teal-400 text-teal-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input type="radio" name="pay_method" value={m} checked={form.payment_method === m}
                        onChange={() => field('payment_method', m)} className="sr-only" />
                      {m.toUpperCase()}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block text-sm font-medium">
                Notes (optional)
                <textarea
                  className="input-field mt-1"
                  rows={3}
                  placeholder="Any special instructions or notes…"
                  value={form.notes}
                  onChange={(e) => field('notes', e.target.value)}
                />
              </label>

              {/* Summary */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs space-y-1">
                <p className="font-semibold text-slate-700 mb-2">Package Summary</p>
                <p><span className="text-slate-500">Patient:</span> <span className="font-medium">{form.patient_name}</span></p>
                {form.service_type && <p><span className="text-slate-500">Service:</span> <span className="font-medium">{form.service_type}</span></p>}
                <p><span className="text-slate-500">Mode:</span> <span className="font-medium capitalize">{form.service_mode.replace('_', ' ')}</span></p>
                <p><span className="text-slate-500">Sessions:</span> <span className="font-medium">{form.total_sessions}</span></p>
                <p><span className="text-slate-500">Validity:</span> <span className="font-medium">{form.never_expires ? 'Never Expires' : `${form.duration_days} days${expiryDate ? ` (until ${new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}`}</span></p>
                <p><span className="text-slate-500">Amount:</span> <span className="font-medium">{money(finalPrice)}</span></p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t bg-white">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-outline text-sm gap-1.5 inline-flex items-center">
              <FaIcon icon="fa-arrow-left" /> Back
            </button>
          ) : (
            <button type="button" onClick={onClose} className="btn-outline text-sm">
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : !canNext3}
              onClick={() => setStep(step + 1)}
              className="btn-primary text-sm gap-1.5 inline-flex items-center disabled:opacity-50"
            >
              Next <FaIcon icon="fa-arrow-right" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={submit}
              className="btn-primary text-sm gap-1.5 inline-flex items-center disabled:opacity-50"
            >
              {saving ? (
                <><FaIcon icon="fa-spinner fa-spin" /> Creating…</>
              ) : (
                <><FaIcon icon="fa-check" /> Create Package</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
