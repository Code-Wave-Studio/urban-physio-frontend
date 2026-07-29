import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import SuggestionChips from './SuggestionChips';
import { erpAssessments } from '../../services/api';

function renderField({ field, value, onChange, chips = [] }) {
  const id  = `afield_${field.id}`;
  const cls = 'w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400';

  const withChips = (children) => (
    <div className="space-y-1">
      {children}
      {(field.type === 'textarea' || field.type === 'text') && chips.filter((c) => !c.category || c.category === field.id).length > 0 && (
        <SuggestionChips
          chips={chips.filter((c) => !c.category || c.category === field.id)}
          onInsert={(text) => onChange((value || '') + (value ? ' ' : '') + text)}
        />
      )}
    </div>
  );

  if (field.type === 'display') {
    return <p className="text-sm text-slate-600 italic">{field.label}</p>;
  }
  if (field.type === 'signature') {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
        Digital signature will be captured via OTP
      </div>
    );
  }
  if (field.type === 'textarea') {
    return withChips(
      <textarea
        id={id}
        rows={3}
        className={`${cls} resize-none`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select id={id} className={cls} value={value || ''} onChange={(e) => onChange(e.target.value)} required={field.required}>
        <option value="">— Select —</option>
        {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  if (field.type === 'number') {
    return (
      <input
        id={id} type="number"
        className={cls}
        value={value ?? ''}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        required={field.required}
      />
    );
  }
  return withChips(
    <input
      id={id}
      type={field.type || 'text'}
      className={cls}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
    />
  );
}

export default function AssessmentResponseForm({ clinicId, responseId, patientKey, templateId, onSaved }) {
  const [response, setResponse]     = useState(null);
  const [schema, setSchema]         = useState([]);
  const [answers, setAnswers]       = useState({});
  const [chips, setChips]           = useState([]);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [otpPhase, setOtpPhase]     = useState(null); // null | 'input' | 'verify'
  const [otpPhone, setOtpPhone]     = useState('');
  const [otp, setOtp]               = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (responseId) {
        const r   = await erpAssessments.getResponse(responseId);
        const d   = r.data || r;
        setResponse(d);
        setAnswers(d.responses || {});
        setSchema(d.template_schema || []);
      } else if (templateId) {
        const t   = await erpAssessments.getTemplate(templateId);
        const d   = t.data || t;
        setSchema(Array.isArray(d.schema) ? d.schema : []);
      }
      const chipRes = await erpAssessments.listChips({});
      setChips(chipRes.data || chipRes || []);
    } catch { toast.error('Could not load assessment'); }
    finally { setLoading(false); }
  }, [responseId, templateId]);

  useEffect(() => { load(); }, [load]);

  const setAnswer = (fieldId, value) => setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const save = async (newStatus = 'draft') => {
    setSaving(true);
    try {
      if (responseId) {
        await erpAssessments.updateResponse(responseId, { responses: answers, status: newStatus });
        toast.success(newStatus === 'completed' ? 'Assessment completed' : 'Saved');
      } else {
        const r = await erpAssessments.createResponse({ template_id: templateId, responses: answers, ...resolvePatientIds(patientKey) });
        toast.success('Assessment created');
        onSaved?.(r.id);
      }
    } catch (e) { toast.error(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const sendOtp = async () => {
    if (!otpPhone) return toast.error('Enter phone number');
    try {
      await erpAssessments.sendOtp(responseId, { phone: otpPhone, method: 'sms' });
      toast.success('OTP sent');
      setOtpPhase('verify');
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  const verifyOtp = async () => {
    if (!otp) return toast.error('Enter OTP');
    try {
      await erpAssessments.verifyOtp(responseId, { otp });
      toast.success('Assessment signed!');
      setOtpPhase(null);
      load();
    } catch (e) { toast.error(e.message || 'Invalid OTP'); }
  };

  if (loading) return <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />;

  const isSigned   = response?.status === 'signed' || response?.status === 'locked';
  const isComplete = response?.status === 'completed' || isSigned;

  return (
    <div className="space-y-5">
      {/* Status badge */}
      {response && (
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            isSigned ? 'bg-green-100 text-green-700' :
            isComplete ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {response.status}
          </span>
          {response.otp_verified && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
              <FaIcon icon="fa-solid fa-shield-check" className="text-[10px]" /> OTP Verified
            </span>
          )}
          {isSigned && (
            <span className="text-xs text-slate-400">Signed {String(response.signed_at || '').slice(0, 10)}</span>
          )}
        </div>
      )}

      {/* Sections */}
      {schema.filter((s) => s.visible !== false).map((section) => (
        <div key={section.id} className="glass-card !p-4 space-y-3">
          <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-2">{section.title}</h3>
          <div className="space-y-3">
            {(section.fields || []).map((field) => (
              <div key={field.id}>
                {field.type !== 'checkbox' && (
                  <label htmlFor={`afield_${field.id}`} className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                )}
                {renderField({
                  field,
                  value: answers[field.id],
                  onChange: (v) => !isSigned && setAnswer(field.id, v),
                  chips,
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      {!isSigned && (
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => save('draft')} disabled={saving} className="btn-outline text-sm">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          {responseId && (
            <>
              <button type="button" onClick={() => save('completed')} disabled={saving} className="btn-primary text-sm">
                Mark Complete
              </button>
              <button type="button" onClick={() => setOtpPhase('input')} className="btn-outline text-sm flex items-center gap-2">
                <FaIcon icon="fa-solid fa-signature" /> Get Digital Signature
              </button>
            </>
          )}
        </div>
      )}

      {/* OTP signing flow */}
      {otpPhase === 'input' && (
        <div className="glass-card !p-4 space-y-3">
          <h3 className="font-semibold text-sm">Send OTP for Digital Signature</h3>
          <input
            type="tel"
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Patient phone number"
            value={otpPhone}
            onChange={(e) => setOtpPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" onClick={sendOtp} className="btn-primary text-sm flex items-center gap-2">
              <FaIcon icon="fa-solid fa-paper-plane" /> Send OTP
            </button>
            <button type="button" onClick={() => setOtpPhase(null)} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {otpPhase === 'verify' && (
        <div className="glass-card !p-4 space-y-3">
          <h3 className="font-semibold text-sm">Enter OTP to Sign Assessment</h3>
          <input
            type="text"
            className="w-full border rounded-xl px-3 py-2 text-sm tracking-widest text-center text-lg font-mono"
            placeholder="_ _ _ _ _ _"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex gap-2">
            <button type="button" onClick={verifyOtp} className="btn-primary text-sm flex items-center gap-2">
              <FaIcon icon="fa-solid fa-check-double" /> Verify & Sign
            </button>
            <button type="button" onClick={() => setOtpPhase('input')} className="btn-outline text-sm">Resend OTP</button>
            <button type="button" onClick={() => setOtpPhase(null)} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function resolvePatientIds(key) {
  if (!key) return {};
  if (key.startsWith('cp-')) return { clinic_patient_id: Number(key.slice(3)) };
  if (key.startsWith('p-'))  return { patient_id: Number(key.slice(2)) };
  return {};
}
