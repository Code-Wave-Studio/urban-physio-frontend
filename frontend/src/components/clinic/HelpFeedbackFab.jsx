import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { supportTickets } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

const FEEDBACK_CATS = ['Overall Experience', 'Booking', 'Staff', 'Facilities', 'App / Portal', 'Other'];

const PATIENT_SUPPORT = ['Appointment Issue', 'Billing', 'Medical Question', 'Portal Issue'];
const STAFF_SUPPORT = ['System Bug', 'Feature Request', 'Patient Issue', 'Hardware Issue'];

function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function detectBrowser() {
  const ua = navigator.userAgent || '';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Other';
}

/**
 * Floating Help & Feedback action button for the clinic portal.
 */
export default function HelpFeedbackFab() {
  const { clinicId, clinic, me, portalRole } = useClinicPortal();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'feedback' | 'support'
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [emoji, setEmoji] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactOk, setContactOk] = useState(true);
  const [attachments, setAttachments] = useState([]);

  const isStaff = portalRole === 'clinic_admin' || portalRole === 'clinic_receptionist' || !!clinicId;
  const categories = mode === 'feedback' ? FEEDBACK_CATS : isStaff ? STAFF_SUPPORT : PATIENT_SUPPORT;

  const context = useMemo(
    () => ({
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      browser: detectBrowser(),
      device: detectDevice(),
      screen_res: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
      requester_name: me?.full_name || me?.name || '',
      requester_email: me?.email || '',
      requester_phone: me?.phone || '',
      requester_role: portalRole || me?.role_slug || '',
      clinic_id: clinicId || undefined,
      clinic_name: clinic?.name || undefined,
    }),
    [me, portalRole, clinicId, clinic?.name]
  );

  const suggestions = useMemo(() => {
    if (mode !== 'support') return [];
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const tips = [];
    if (path.includes('appointments') || path.includes('calendar')) {
      tips.push('Try refreshing availability if a slot looks wrong.');
      tips.push('Check capacity settings under Availability Settings.');
    }
    if (path.includes('billing') || path.includes('invoice')) {
      tips.push('Ensure billing is enabled in clinic billing settings.');
    }
    if (path.includes('packages')) {
      tips.push('Expired packages cannot schedule new sessions.');
    }
    if (!tips.length) tips.push('Include steps to reproduce and a screenshot if possible.');
    return tips;
  }, [mode, open]);

  useEffect(() => {
    if (!open) {
      setMode(null);
      setRating(0);
      setEmoji('');
      setCategory('');
      setDescription('');
      setAttachments([]);
      setContactOk(true);
    }
  }, [open]);

  const onFiles = (files) => {
    const list = Array.from(files || []).slice(0, 5);
    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, type: file.type, size: file.size, data_url: String(reader.result).slice(0, 200000) },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const submit = async () => {
    if (!category || !description.trim()) {
      toast.error('Category and description are required');
      return;
    }
    if (mode === 'feedback' && !rating) {
      toast.error('Please rate your experience');
      return;
    }
    setSaving(true);
    try {
      await supportTickets.create({
        type: mode,
        category,
        description,
        rating: mode === 'feedback' ? rating : undefined,
        emoji: mode === 'feedback' ? emoji : undefined,
        contact_ok: contactOk,
        attachments,
        ...context,
      });
      toast.success(mode === 'feedback' ? 'Thanks for your feedback!' : 'Support request submitted');
      setOpen(false);
    } catch (e) {
      toast.error(e.message || 'Could not submit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 flex items-center justify-center"
        aria-label="Help and Feedback"
      >
        <FaIcon icon="fa-life-ring" className="text-xl" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90dvh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-bold">
                {!mode ? 'Help & Feedback' : mode === 'feedback' ? 'Give Feedback' : 'Request Support'}
              </p>
              <button type="button" onClick={() => (mode ? setMode(null) : setOpen(false))}>
                <FaIcon icon={mode ? 'fa-arrow-left' : 'fa-xmark'} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {!mode && (
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('feedback')}
                    className="rounded-xl border border-slate-200 p-4 text-left hover:border-teal-300 hover:bg-teal-50"
                  >
                    <p className="font-semibold flex items-center gap-2"><FaIcon icon="fa-face-smile" /> Give Feedback</p>
                    <p className="text-xs text-slate-500 mt-1">Rate your experience and share ideas</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('support')}
                    className="rounded-xl border border-slate-200 p-4 text-left hover:border-teal-300 hover:bg-teal-50"
                  >
                    <p className="font-semibold flex items-center gap-2"><FaIcon icon="fa-headset" /> Request Support</p>
                    <p className="text-xs text-slate-500 mt-1">Get help with appointments, billing, or bugs</p>
                  </button>
                </div>
              )}

              {mode && (
                <>
                  {mode === 'feedback' && (
                    <div>
                      <p className="text-sm font-medium mb-2">Rating</p>
                      <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setRating(n)} className="text-2xl">
                            <FaIcon icon="fa-star" className={n <= rating ? 'text-amber-400' : 'text-slate-200'} />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {['😀', '🙂', '😐', '😕', '😡'].map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setEmoji(e)}
                            className={`text-2xl w-10 h-10 rounded-full ${emoji === e ? 'bg-teal-100 ring-2 ring-teal-400' : 'bg-slate-50'}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="block text-sm font-medium">
                    Category
                    <select className="input-field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Select…</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>

                  <label className="block text-sm font-medium">
                    Description
                    <textarea
                      className="input-field mt-1"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell us more…"
                    />
                  </label>

                  {mode === 'support' && suggestions.length > 0 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs space-y-1">
                      <p className="font-semibold text-amber-800">Before you submit</p>
                      {suggestions.map((s) => <p key={s} className="text-amber-700">• {s}</p>)}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-1">Attachments / Screenshot</p>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-xs text-slate-500 cursor-pointer hover:border-teal-300">
                      <FaIcon icon="fa-cloud-arrow-up" className="text-lg mb-1" />
                      Drag & drop or click to upload
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => onFiles(e.target.files)}
                      />
                    </label>
                    {attachments.length > 0 && (
                      <ul className="mt-2 text-xs text-slate-600 space-y-1">
                        {attachments.map((a, i) => (
                          <li key={i} className="flex justify-between">
                            <span className="truncate">{a.name}</span>
                            <button type="button" className="text-rose-500" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>Remove</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={contactOk} onChange={(e) => setContactOk(e.target.checked)} />
                    It's OK to contact me about this
                  </label>

                  <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 space-y-0.5">
                    <p>Clinic: <span className="font-medium text-slate-700">{context.clinic_name || 'Current clinic'}</span></p>
                    <p>Submitted at: {new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    <p>Page: {context.page_url?.slice(0, 60)}…</p>
                    <p>{context.browser} · {context.device} · {context.screen_res}</p>
                    <p>{context.requester_name} · {context.requester_email}</p>
                  </div>

                  <button type="button" className="btn-primary w-full justify-center" disabled={saving} onClick={submit}>
                    {saving ? 'Submitting…' : 'Submit'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
