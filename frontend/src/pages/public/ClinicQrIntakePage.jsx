import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import { clinicQr } from '../../services/api';

function parse(value, fallback = []) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]') || fallback;
  } catch {
    return fallback;
  }
}

function PublicField({ field, value, onChange }) {
  const type = field.field_type || field.type || 'text';
  const options = parse(field.options || field.options_json);
  const common = {
    id: `field-${field.id || field.field_key}`,
    className: 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500',
    required: Boolean(Number(field.is_required ?? field.required)),
    value: value ?? '',
    onChange: (event) => onChange(event.target.value),
  };
  if (type === 'textarea') return <textarea {...common} rows={3} />;
  if (['dropdown', 'select', 'yesno'].includes(type)) {
    const choices = type === 'yesno' ? ['Yes', 'No'] : options;
    return (
      <select {...common}>
        <option value="">Select…</option>
        {choices.map((option) => <option key={String(option)} value={option}>{option}</option>)}
      </select>
    );
  }
  return <input {...common} type={type === 'phone' ? 'tel' : type} inputMode={type === 'phone' ? 'numeric' : undefined} />;
}

export default function ClinicQrIntakePage() {
  const { token: pathToken } = useParams();
  const [search] = useSearchParams();
  const token = pathToken || search.get('token') || '';
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [values, setValues] = useState({});
  const [assessment, setAssessment] = useState({});

  useEffect(() => {
    let active = true;
    clinicQr.resolve(token)
      .then((res) => {
        if (active) setResolved(res.data || res);
      })
      .catch((err) => {
        if (active) setError(err.message || 'This QR code is invalid or expired.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const qr = resolved?.qr || resolved || {};
  const fields = resolved?.registration_fields || resolved?.fields || [];
  const template = resolved?.assessment_template || resolved?.assessment || null;
  const assessmentFields = useMemo(() => parse(template?.fields || template?.fields_json), [template]);
  const clinicName = qr.clinic_name || qr.name || resolved?.clinic?.name || 'The Urban Physio Clinic';

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { token, ...values };
      if (template?.id && assessmentFields.length) {
        payload.template_id = template.id;
        payload.assessment_responses = assessment;
      }
      const res = await clinicQr.register(payload);
      const next = res.data || res;
      setResult(next);
      if (next.token) localStorage.setItem('token', next.token);
      toast.success(next.existing ? 'Welcome back' : 'Registration complete');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center"><div className="w-full max-w-xl h-96 rounded-3xl bg-white animate-pulse" /></main>;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-7 text-center">
          <FaIcon icon="fa-circle-exclamation" className="text-4xl text-rose-500" />
          <h1 className="text-xl font-bold text-slate-900 mt-4">Link unavailable</h1>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </main>
    );
  }

  if (qr.purpose && qr.purpose !== 'intake') {
    const target = qr.purpose === 'report' ? '/patient/progress' : '/book';
    return <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center"><div className="bg-white rounded-3xl p-8 text-center max-w-md"><h1 className="text-xl font-bold">{clinicName}</h1><p className="text-slate-500 mt-2">Continue to {qr.purpose}.</p><Link className="btn-primary inline-flex mt-5" to={target}>Continue</Link></div></main>;
  }

  if (result) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white p-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-teal-100 p-7 text-center">
          <span className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-2xl"><FaIcon icon="fa-check" /></span>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">{result.existing ? 'Welcome back' : 'You’re registered'}</h1>
          <p className="text-slate-500 mt-2">{result.existing ? 'We recognised your mobile number and signed you in.' : `${clinicName} now has your intake details.`}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <Link to="/book" className="btn-primary inline-flex justify-center items-center gap-2"><FaIcon icon="fa-calendar-plus" /> Book appointment</Link>
            <Link to={`/clinic-report/${token}`} className="btn-outline inline-flex justify-center items-center gap-2"><FaIcon icon="fa-chart-line" /> View report</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 via-slate-50 to-white px-4 py-8">
      <form onSubmit={submit} className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <header className="bg-teal-700 text-white p-6">
          <p className="text-xs uppercase tracking-widest text-teal-100">Patient intake</p>
          <h1 className="text-2xl font-bold mt-1">{clinicName}</h1>
          <p className="text-sm text-teal-50 mt-2">Complete your details before your visit.</p>
        </header>
        <div className="p-5 sm:p-7 space-y-5">
          {fields.map((field) => {
            const key = field.field_key || `custom_${field.id}`;
            return (
              <label key={field.id || key} htmlFor={`field-${field.id || key}`} className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {field.label} {Boolean(Number(field.is_required ?? field.required)) && <span className="text-rose-500">*</span>}
                </span>
                <PublicField field={field} value={values[key]} onChange={(value) => setValues((old) => ({ ...old, [key]: value }))} />
              </label>
            );
          })}
          {!fields.length && (
            <>
              {[['name', 'Full name', 'text'], ['mobile', 'Mobile number', 'tel'], ['email', 'Email (optional)', 'email']].map(([key, label, type]) => (
                <label key={key} className="block"><span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span><input className="w-full rounded-xl border border-slate-200 px-3 py-2.5" type={type} required={key !== 'email'} value={values[key] || ''} onChange={(e) => setValues((old) => ({ ...old, [key]: e.target.value }))} /></label>
              ))}
            </>
          )}
          {assessmentFields.length > 0 && (
            <section className="border-t border-slate-100 pt-5 space-y-4">
              <div><h2 className="font-bold text-slate-900">{template.name || 'Quick assessment'}</h2><p className="text-xs text-slate-500">Help your physiotherapist prepare.</p></div>
              {assessmentFields.map((field, index) => {
                const key = field.key || `question_${index}`;
                return <label key={key} className="block"><span className="block text-sm font-medium text-slate-700 mb-1">{field.label || field.question}</span><PublicField field={field} value={assessment[key]} onChange={(value) => setAssessment((old) => ({ ...old, [key]: value }))} /></label>;
              })}
            </section>
          )}
          <button type="submit" className="btn-primary w-full justify-center !py-3" disabled={submitting}>{submitting ? 'Submitting…' : 'Complete registration'}</button>
          <p className="text-[11px] text-center text-slate-400">Your details are shared securely with {clinicName} for care delivery.</p>
        </div>
      </form>
    </main>
  );
}
