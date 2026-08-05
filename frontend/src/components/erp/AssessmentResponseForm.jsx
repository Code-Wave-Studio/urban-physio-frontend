import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import SuggestionChips from './SuggestionChips';
import AssessmentFormChrome, { defaultLetterhead } from './AssessmentFormChrome';
import { erpAssessments } from '../../services/api';

function ImageField({ value, onChange, disabled }) {
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  const onFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files allowed');
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Image must be under 4 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onChange([...urls, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {urls.map((src, i) => (
          <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
            <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-xs text-slate-400 cursor-pointer hover:border-teal-400 hover:text-teal-600 transition-colors">
            <FaIcon icon="fa-solid fa-cloud-arrow-up" className="text-lg" />
            Upload image
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFile} />
          </label>
        )}
      </div>
    </div>
  );
}

function renderField({ field, value, onChange, chips = [], disabled }) {
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
  if (field.type === 'image') {
    return <ImageField value={value} onChange={onChange} disabled={disabled} />;
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
        disabled={disabled}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select id={id} className={cls} value={value || ''} onChange={(e) => onChange(e.target.value)} required={field.required} disabled={disabled}>
        <option value="">— Select —</option>
        {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (field.type === 'radio') {
    return (
      <div className="flex flex-wrap gap-3">
        {(field.options || []).map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name={id} checked={value === o} onChange={() => onChange(o)} disabled={disabled} />
            {o}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
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
        disabled={disabled}
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
      disabled={disabled}
    />
  );
}

export default function AssessmentResponseForm({ clinicId, responseId, patientKey, templateId, patient, onSaved }) {
  const [response, setResponse]     = useState(null);
  const [schema, setSchema]         = useState([]);
  const [letterhead, setLetterhead] = useState(() => defaultLetterhead());
  const [answers, setAnswers]       = useState({});
  const [checklist, setChecklist]   = useState({});
  const [chips, setChips]           = useState([]);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [otpPhase, setOtpPhase]     = useState(null); // null | 'input' | 'verify'
  const [otpPhone, setOtpPhone]     = useState('');
  const [otp, setOtp]               = useState('');

  const draftKey = `tup_assessment_draft_${clinicId}_${patientKey || 'global'}_${templateId || 'def'}`;

  // Save to localStorage draft on answers update
  useEffect(() => {
    if (!loading && !response?.status && Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ answers, checklist, savedAt: Date.now() }));
      } catch {
        /* ignore */
      }
    }
  }, [answers, checklist, loading, response, draftKey]);

  // Session recovery prompt on mount
  useEffect(() => {
    if (!loading && !responseId && Object.keys(answers).length === 0) {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.answers && Object.keys(parsed.answers).length > 0) {
            toast(
              (t) => (
                <div className="flex items-center gap-3">
                  <span className="text-xs">Unsaved assessment draft found. Restore session?</span>
                  <button
                    onClick={() => {
                      setAnswers(parsed.answers);
                      if (parsed.checklist) setChecklist(parsed.checklist);
                      toast.dismiss(t.id);
                      toast.success('Draft session restored');
                    }}
                    className="bg-teal-600 text-white text-xs px-2.5 py-1 rounded-md font-bold shadow-xs hover:bg-teal-700"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem(draftKey);
                      toast.dismiss(t.id);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Discard
                  </button>
                </div>
              ),
              { duration: 8000 }
            );
          }
        }
      } catch {
        /* ignore */
      }
    }
  }, [loading, responseId, draftKey, answers]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = clinicId ? { clinic_id: clinicId } : undefined;
      if (responseId) {
        const r   = await erpAssessments.getResponse(responseId, q);
        const d   = r.data || r;
        setResponse(d);
        const rawAnswers = d.responses || {};
        const { _checklist: savedChecklist, ...fieldAnswers } = rawAnswers;
        setAnswers(fieldAnswers);
        setChecklist(savedChecklist || {});
        setSchema(d.template_schema || []);
        if (d.letterhead && Object.keys(d.letterhead).length) {
          setLetterhead(defaultLetterhead(d.letterhead));
        } else if (d.template_id) {
          const t = await erpAssessments.getTemplate(d.template_id, q);
          const td = t.data || t;
          if (!d.template_schema?.length) setSchema(Array.isArray(td.schema) ? td.schema : []);
          setLetterhead(defaultLetterhead(td.letterhead || {}));
        }
      } else if (templateId) {
        const t   = await erpAssessments.getTemplate(templateId, q);
        const d   = t.data || t;
        setSchema(Array.isArray(d.schema) ? d.schema : []);
        setLetterhead(defaultLetterhead(d.letterhead || {}));
      }
      const chipRes = await erpAssessments.listChips(q || {});
      setChips(chipRes.data || chipRes || []);
    } catch { toast.error('Could not load assessment'); }
    finally { setLoading(false); }
  }, [responseId, templateId, clinicId]);

  useEffect(() => { load(); }, [load]);

  const setAnswer = (fieldId, value) => setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const clinicParams = clinicId ? { clinic_id: clinicId } : undefined;

  const save = async (newStatus = 'draft') => {
    setSaving(true);
    try {
      const payloadAnswers = { ...answers, _checklist: checklist };
      if (responseId) {
        await erpAssessments.updateResponse(responseId, { responses: payloadAnswers, status: newStatus }, clinicParams);
        toast.success(newStatus === 'completed' ? 'Assessment completed' : 'Saved');
      } else {
        const r = await erpAssessments.createResponse({ template_id: templateId, responses: payloadAnswers, ...resolvePatientIds(patientKey) }, clinicParams);
        try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
        toast.success('Assessment created');
        onSaved?.(r.id);
      }
    } catch (e) { toast.error(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleUploadToDocuments = async () => {
    if (!responseId) return toast.error('Please save assessment first');
    setUploadingDoc(true);
    try {
      await erpAssessments.uploadDocument(responseId, clinicParams);
      toast.success('Assessment report saved to Documents module!');
    } catch (e) {
      toast.error(e.message || 'Could not upload to documents');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteResponse = async () => {
    if (!responseId) return;
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await erpAssessments.deleteResponse(responseId, clinicParams);
      toast.success('Assessment deleted');
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      onSaved?.(null);
    } catch (e) {
      toast.error(e.message || 'Could not delete assessment');
    }
  };

  const sendOtp = async () => {
    if (!otpPhone) return toast.error('Enter phone number');
    try {
      await erpAssessments.sendOtp(responseId, { phone: otpPhone, method: 'sms' }, clinicParams);
      toast.success('OTP sent');
      setOtpPhase('verify');
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  const verifyOtp = async () => {
    if (!otp) return toast.error('Enter OTP');
    try {
      await erpAssessments.verifyOtp(responseId, { otp }, clinicParams);
      toast.success('Assessment signed!');
      setOtpPhase(null);
      load();
    } catch (e) { toast.error(e.message || 'Invalid OTP'); }
  };

  if (loading) return <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />;

  const isSigned   = response?.status === 'signed' || response?.status === 'locked';
  const isComplete = response?.status === 'completed' || isSigned;
  const digitalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/clinic-portal/patients/${patientKey || ''}`
    : '';

  return (
    <div className="space-y-4">
      {response && (
        <div className="flex flex-wrap items-center gap-2" data-print-hide>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            isSigned ? 'bg-green-100 text-green-700' :
            isComplete ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {response.status}
          </span>
          {response.otp_verified && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
              <FaIcon icon="fa-solid fa-shield-halved" className="text-[10px]" /> OTP Verified
            </span>
          )}
          {isSigned && (
            <span className="text-xs text-slate-400">Signed {String(response.signed_at || '').slice(0, 10)}</span>
          )}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button type="button" className="btn-outline text-xs !py-1.5 inline-flex items-center gap-1.5" onClick={() => window.print()}>
              <FaIcon icon="fa-solid fa-print" /> Print A4 Report
            </button>
            {responseId && (
              <button
                type="button"
                disabled={uploadingDoc}
                className="btn-outline text-xs !py-1.5 inline-flex items-center gap-1.5 text-teal-700 border-teal-200 bg-teal-50/50 hover:bg-teal-50"
                onClick={handleUploadToDocuments}
              >
                <FaIcon icon={uploadingDoc ? 'fa-solid fa-circle-notch' : 'fa-solid fa-file-pdf'} className={uploadingDoc ? 'animate-spin' : ''} />
                <span>{uploadingDoc ? 'Uploading...' : 'Save to Documents'}</span>
              </button>
            )}
            {responseId && !isSigned && (
              <button
                type="button"
                className="btn-outline text-xs !py-1.5 inline-flex items-center gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={handleDeleteResponse}
              >
                <FaIcon icon="fa-solid fa-trash-can" /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
        <AssessmentFormChrome
          letterhead={letterhead}
          patient={patient || {}}
          visit={{
            type: letterhead.subtitle?.includes('Re-') ? 'Follow-up' : 'New',
            mode: 'Clinic',
            assessment_date: response?.created_at || new Date().toISOString(),
          }}
          checklist={checklist}
          onChecklistChange={!isSigned ? setChecklist : undefined}
          digitalRecordUrl={digitalUrl}
          mode="screen"
        >
          <div className="space-y-5">
            {schema.filter((s) => s.visible !== false).map((section) => (
              <div key={section.id} className="space-y-3 border-b border-slate-100 pb-4 last:border-0">
                <h3 className="font-semibold text-slate-900 text-sm">{section.title}</h3>
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
                        disabled: isSigned,
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AssessmentFormChrome>
      </div>

      {!isSigned && (
        <div className="flex flex-wrap gap-2 items-center" data-print-hide>
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

      {otpPhase === 'input' && (
        <div className="glass-card !p-4 space-y-3" data-print-hide>
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
        <div className="glass-card !p-4 space-y-3" data-print-hide>
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
