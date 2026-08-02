import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../GlassModal';
import ClinicOfflinePatientForm from './ClinicOfflinePatientForm';
import ClinicBookingModal from './ClinicBookingModal';
import { supportTickets } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';
import { setFloatingActionsHidden } from '../../utils/floatingActionsBus';

const FEEDBACK_CATS = ['Overall Experience', 'Booking', 'Staff', 'Facilities', 'App / Portal', 'Other'];
const PATIENT_SUPPORT = ['Appointment Issue', 'Billing', 'Medical Question', 'Portal Issue'];
const STAFF_SUPPORT = ['System Bug', 'Feature Request', 'Patient Issue', 'Hardware Issue'];

/** Single rating control: emoji = sentiment, value = 1–5 stars sent to API */
const RATING_OPTIONS = [
  { value: 1, emoji: '😡', label: 'Poor' },
  { value: 2, emoji: '😕', label: 'Fair' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😀', label: 'Great' },
];

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

function formatBytes(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Clinic portal FAB — Plus shortcuts for New Patient / New Appointment,
 * plus Help & Feedback (without leaving the current page).
 */
export default function HelpFeedbackFab() {
  const { clinicId, clinic, me, portalRole } = useClinicPortal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'feedback' | 'support'
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [emoji, setEmoji] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactOk, setContactOk] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const isStaff = portalRole === 'clinic_admin' || portalRole === 'clinic_receptionist' || !!clinicId;
  const categories = mode === 'feedback' ? FEEDBACK_CATS : isStaff ? STAFF_SUPPORT : PATIENT_SUPPORT;

  const canAddPatient = !!clinicId;
  const canBook = !!clinicId;

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
  }, [mode, helpOpen]);

  useEffect(() => {
    const onFab = (e) => {
      const mode = e.detail?.mode;
      setMenuOpen(false);
      if (mode === 'patient') setPatientOpen(true);
      if (mode === 'booking') setBookingOpen(true);
    };
    window.addEventListener('clinic-fab-open', onFab);
    return () => window.removeEventListener('clinic-fab-open', onFab);
  }, []);

  useEffect(() => {
    const anyOverlay = menuOpen || patientOpen || bookingOpen || helpOpen;
    setFloatingActionsHidden(anyOverlay, 'clinic-fab');
    return () => setFloatingActionsHidden(false, 'clinic-fab');
  }, [menuOpen, patientOpen, bookingOpen, helpOpen]);

  useEffect(() => {
    if (!helpOpen) {
      setMode(null);
      setRating(0);
      setEmoji('');
      setCategory('');
      setDescription('');
      setAttachments([]);
      setContactOk(true);
      setDragOver(false);
    }
  }, [helpOpen]);

  const onFiles = useCallback((files) => {
    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    setAttachments((prev) => {
      const room = Math.max(0, 5 - prev.length);
      if (room === 0) {
        toast.error('Maximum 5 attachments');
        return prev;
      }
      const list = incoming.slice(0, room);
      list.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((cur) => {
            if (cur.length >= 5) return cur;
            return [
              ...cur,
              { name: file.name, type: file.type, size: file.size, data_url: String(reader.result).slice(0, 200000) },
            ];
          });
        };
        reader.readAsDataURL(file);
      });
      return prev;
    });
  }, []);

  const pickRating = (opt) => {
    setRating(opt.value);
    setEmoji(opt.emoji);
  };

  const submittedAtLabel = useMemo(
    () =>
      new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    [helpOpen, mode]
  );

  const helpTitle = !mode ? 'Help & Feedback' : mode === 'feedback' ? 'Give Feedback' : 'Request Support';
  const helpSubtitle = !mode
    ? 'Tell us how we can improve or get help'
    : mode === 'feedback'
      ? 'Rate your experience — takes under a minute'
      : 'Describe the issue and we will follow up';
  const helpIcon = !mode ? 'fa-life-ring' : mode === 'feedback' ? 'fa-face-smile' : 'fa-headset';

  const submitHelp = async () => {
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
      setHelpOpen(false);
    } catch (e) {
      toast.error(e.message || 'Could not submit');
    } finally {
      setSaving(false);
    }
  };

  const openPatient = () => {
    setMenuOpen(false);
    setPatientOpen(true);
  };

  const openBooking = () => {
    setMenuOpen(false);
    setBookingOpen(true);
  };

  const openHelp = () => {
    setMenuOpen(false);
    setHelpOpen(true);
  };

  const speedActions = [
    canAddPatient && {
      id: 'patient',
      label: 'New patient',
      icon: 'fa-user-plus',
      tone: 'bg-teal-600 hover:bg-teal-700',
      onClick: openPatient,
    },
    canBook && {
      id: 'appointment',
      label: 'New appointment',
      icon: 'fa-calendar-plus',
      tone: 'bg-orange-500 hover:bg-orange-600',
      onClick: openBooking,
    },
    {
      id: 'help',
      label: 'Help & feedback',
      icon: 'fa-life-ring',
      tone: 'bg-slate-700 hover:bg-slate-800',
      onClick: openHelp,
    },
  ].filter(Boolean);

  return (
    <>
      {/* Speed-dial menu */}
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px]"
          aria-label="Close quick actions"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        {menuOpen && (
          <div className="flex flex-col items-end gap-2.5 pointer-events-auto mb-1">
            {speedActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className="group flex items-center gap-2"
              >
                <span className="text-xs font-semibold text-slate-700 bg-white/95 border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-lg">
                  {action.label}
                </span>
                <span
                  className={`w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center ${action.tone}`}
                  aria-hidden
                >
                  <FaIcon icon={action.icon} />
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`pointer-events-auto w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all ${
            menuOpen ? 'bg-slate-800 rotate-45' : 'bg-teal-600 hover:bg-teal-700'
          }`}
          aria-label={menuOpen ? 'Close quick add' : 'Quick add'}
          aria-expanded={menuOpen}
        >
          <FaIcon icon="fa-plus" className="text-xl" />
        </button>
      </div>

      {/* New patient — inline modal (no page navigation) */}
      <GlassModal open={patientOpen} onClose={() => setPatientOpen(false)} size="md" zIndex={10000}>
        <GlassModalHeader
          title="New patient"
          subtitle="Walk-in / offline patient with optional invite"
          icon="fa-user-plus"
          onClose={() => setPatientOpen(false)}
        />
        <GlassModalBody>
          <ClinicOfflinePatientForm
            clinicId={clinicId}
            onCreated={() => {
              setPatientOpen(false);
              window.dispatchEvent(new Event('clinic-patients-changed'));
            }}
          />
        </GlassModalBody>
      </GlassModal>

      {/* New appointment — same booking wizard used on calendar / appointments */}
      <ClinicBookingModal
        clinicId={clinicId}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onBooked={() => {
          setBookingOpen(false);
          window.dispatchEvent(new Event('clinic-appointments-changed'));
        }}
      />

      {/* Help & Feedback — responsive GlassModal */}
      <GlassModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        size="sm"
        zIndex={10000}
        titleId="help-feedback-title"
        panelClassName="!max-h-[100dvh] sm:!max-h-[min(calc(100dvh-3rem),720px)]"
      >
        <GlassModalHeader
          titleId="help-feedback-title"
          title={helpTitle}
          subtitle={helpSubtitle}
          icon={helpIcon}
          accent="cyan"
          onClose={() => setHelpOpen(false)}
        >
          {mode && (
            <button
              type="button"
              onClick={() => setMode(null)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-teal-700 transition"
            >
              <FaIcon icon="fa-arrow-left" className="text-xs" />
              Back to options
            </button>
          )}
        </GlassModalHeader>

        <GlassModalBody className="!px-4 !py-4 sm:!px-5 sm:!py-5 space-y-5">
          {!mode && (
            <div className="grid gap-3 sm:gap-3.5">
              <button
                type="button"
                onClick={() => setMode('feedback')}
                className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-teal-50/40 p-4 sm:p-5 text-left transition hover:border-teal-300 hover:shadow-sm active:scale-[0.99]"
              >
                <span className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-200/80 transition">
                  <FaIcon icon="fa-face-smile" className="text-lg" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-900 block">Give Feedback</span>
                  <span className="text-xs sm:text-sm text-slate-500 mt-0.5 block leading-relaxed">
                    Rate your experience and share ideas
                  </span>
                </span>
                <FaIcon icon="fa-chevron-right" className="text-slate-300 mt-3 shrink-0 group-hover:text-teal-500" />
              </button>
              <button
                type="button"
                onClick={() => setMode('support')}
                className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-sky-50/50 p-4 sm:p-5 text-left transition hover:border-sky-300 hover:shadow-sm active:scale-[0.99]"
              >
                <span className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-200/80 transition">
                  <FaIcon icon="fa-headset" className="text-lg" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-900 block">Request Support</span>
                  <span className="text-xs sm:text-sm text-slate-500 mt-0.5 block leading-relaxed">
                    Help with appointments, billing, or bugs
                  </span>
                </span>
                <FaIcon icon="fa-chevron-right" className="text-slate-300 mt-3 shrink-0 group-hover:text-sky-500" />
              </button>
            </div>
          )}

          {mode && (
            <div className="space-y-5">
              {mode === 'feedback' && (
                <fieldset className="border-0 p-0 m-0">
                  <legend className="text-sm font-semibold text-slate-800 mb-3">How was your experience?</legend>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {RATING_OPTIONS.map((opt) => {
                      const selected = rating === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => pickRating(opt)}
                          aria-pressed={selected}
                          aria-label={`${opt.label} (${opt.value} of 5)`}
                          className={`flex flex-col items-center gap-1 rounded-xl py-2.5 sm:py-3 px-1 transition touch-manipulation ${
                            selected
                              ? 'bg-teal-50 ring-2 ring-teal-400 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-2xl sm:text-[1.75rem] leading-none select-none">{opt.emoji}</span>
                          <span
                            className={`text-[10px] sm:text-[11px] font-medium leading-tight ${
                              selected ? 'text-teal-800' : 'text-slate-500'
                            }`}
                          >
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {rating > 0 && (
                    <div className="mt-2.5 flex items-center justify-center gap-1" aria-hidden>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <FaIcon
                          key={n}
                          icon="fa-star"
                          className={`text-sm ${n <= rating ? 'text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  )}
                </fieldset>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const selected = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        aria-pressed={selected}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition touch-manipulation ${
                          selected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-800'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Description</span>
                <textarea
                  className="input-field mt-2 min-h-[6.5rem] sm:min-h-[7.5rem] resize-y text-sm"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    mode === 'feedback'
                      ? 'What went well? What could be better?'
                      : 'What happened? Include steps if you can…'
                  }
                />
                <span className="mt-1 block text-[11px] text-slate-400 text-right">
                  {description.trim().length} characters
                </span>
              </label>

              {mode === 'support' && suggestions.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-100/80 p-3.5 text-xs space-y-1.5">
                  <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <FaIcon icon="fa-lightbulb" />
                    Before you submit
                  </p>
                  {suggestions.map((s) => (
                    <p key={s} className="text-amber-800/90 pl-1 leading-relaxed">
                      • {s}
                    </p>
                  ))}
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">
                  Attachments
                  <span className="font-normal text-slate-400 ml-1">(optional · max 5)</span>
                </p>
                <label
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    onFiles(e.dataTransfer.files);
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-2xl px-4 py-5 sm:py-6 text-center cursor-pointer transition touch-manipulation ${
                    dragOver
                      ? 'border-teal-400 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-slate-50/60 text-slate-500 hover:border-teal-300 hover:bg-teal-50/40'
                  }`}
                >
                  <span className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-teal-600 shadow-sm">
                    <FaIcon icon="fa-cloud-arrow-up" />
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {dragOver ? 'Drop files here' : 'Tap to upload or drag & drop'}
                  </span>
                  <span className="text-[11px] text-slate-400">Images or PDF</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      onFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
                {attachments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {attachments.map((a, i) => (
                      <li
                        key={`${a.name}-${i}`}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-2.5 py-2 text-xs"
                      >
                        {a.type?.startsWith('image/') && a.data_url ? (
                          <img
                            src={a.data_url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-100"
                          />
                        ) : (
                          <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <FaIcon icon="fa-file" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-700">{a.name}</span>
                          <span className="text-slate-400">{formatBytes(a.size)}</span>
                        </span>
                        <button
                          type="button"
                          className="shrink-0 w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                          aria-label={`Remove ${a.name}`}
                          onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                        >
                          <FaIcon icon="fa-xmark" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contactOk}
                  onChange={(e) => setContactOk(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>It&apos;s OK to contact me about this</span>
              </label>

              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3 text-[11px] sm:text-xs text-slate-500 space-y-1">
                <p className="flex flex-wrap gap-x-1">
                  <span className="text-slate-400">Clinic</span>
                  <span className="font-semibold text-slate-700">{context.clinic_name || 'Current clinic'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Time</span>{' '}
                  <span className="text-slate-600">{submittedAtLabel}</span>
                </p>
                <p className="truncate text-slate-400">
                  {context.browser} · {context.device} · {context.screen_res}
                </p>
              </div>
            </div>
          )}
        </GlassModalBody>

        {mode && (
          <GlassModalFooter>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full">
              <button
                type="button"
                className="btn-outline w-full sm:w-auto sm:min-w-[7rem] justify-center disabled:opacity-50"
                disabled={saving}
                onClick={() => setMode(null)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary w-full sm:flex-1 justify-center"
                disabled={saving}
                onClick={submitHelp}
              >
                {saving ? (
                  <>
                    <FaIcon icon="fa-spinner" className="fa-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <FaIcon icon="fa-paper-plane" />
                    {mode === 'feedback' ? 'Send feedback' : 'Submit request'}
                  </>
                )}
              </button>
            </div>
          </GlassModalFooter>
        )}
      </GlassModal>
    </>
  );
}
