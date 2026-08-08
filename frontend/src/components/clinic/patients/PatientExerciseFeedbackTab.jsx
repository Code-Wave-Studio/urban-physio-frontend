import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';

export default function PatientExerciseFeedbackTab({ clinicId, patientKey, onConvertToNoteSuccess }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [summary, setSummary] = useState({ total: 0, high_pain_count: 0, skipped_count: 0, pending_count: 0 });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('');
  const [painFilter, setPainFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Action Modals
  const [replyModalLog, setReplyModalLog] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadFeedback = useCallback(async () => {
    if (!clinicId || !patientKey) return;
    setLoading(true);
    try {
      const res = await clinicPortal.patientExerciseFeedback(clinicId, patientKey, {
        q,
        exercise: exerciseFilter,
        status: statusFilter,
        review_status: reviewStatusFilter,
        pain_level: painFilter,
        date_from: dateFrom,
        date_to: dateTo,
      });
      const data = res.data || res || {};
      setFeedbackList(data.feedback || []);
      setSummary(data.summary || { total: 0, high_pain_count: 0, skipped_count: 0, pending_count: 0 });
      setAlerts(data.alerts || []);
    } catch (err) {
      toast.error(err.message || 'Could not load exercise feedback');
    } finally {
      setLoading(false);
    }
  }, [clinicId, patientKey, q, exerciseFilter, statusFilter, reviewStatusFilter, painFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const toggleReviewStatus = async (log) => {
    const nextStatus = log.review_status === 'reviewed' ? 'pending' : 'reviewed';
    try {
      await clinicPortal.updateExerciseFeedback(clinicId, log.id, { review_status: nextStatus });
      toast.success(nextStatus === 'reviewed' ? 'Marked as reviewed' : 'Marked as pending review');
      loadFeedback();
    } catch (err) {
      toast.error(err.message || 'Could not update review status');
    }
  };

  const openReplyModal = (log) => {
    setReplyModalLog(log);
    setReplyText(log.therapist_response || '');
    setInternalNoteText(log.internal_note || '');
  };

  const saveReplyAndNote = async (e) => {
    e.preventDefault();
    if (!replyModalLog) return;
    setSubmittingAction(true);
    try {
      await clinicPortal.updateExerciseFeedback(clinicId, replyModalLog.id, {
        therapist_response: replyText,
        internal_note: internalNoteText,
        review_status: 'reviewed',
      });
      toast.success('Response & internal note saved');
      setReplyModalLog(null);
      loadFeedback();
    } catch (err) {
      toast.error(err.message || 'Could not save response');
    } finally {
      setSubmittingAction(false);
    }
  };

  const convertToClinicalNote = async (log) => {
    if (!window.confirm(`Convert feedback for "${log.exercise_name}" into a Clinical Note?`)) return;
    try {
      await clinicPortal.convertFeedbackToClinicalNote(clinicId, log.id);
      toast.success('Feedback converted into Clinical Note!');
      loadFeedback();
      if (typeof onConvertToNoteSuccess === 'function') {
        onConvertToNoteSuccess();
      }
    } catch (err) {
      toast.error(err.message || 'Could not convert to clinical note');
    }
  };

  return (
    <div className="space-y-4">
      {/* Rule-based Exercise Feedback Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alt) => {
            const isCritical = alt.severity === 'critical';
            const isWarning = alt.severity === 'warning';
            return (
              <div
                key={alt.id}
                className={`rounded-xl border p-3.5 flex items-start gap-3 shadow-xs ${
                  isCritical
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : isWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-teal-50 border-teal-200 text-teal-900'
                }`}
              >
                <div className={`p-2 rounded-lg text-sm shrink-0 ${
                  isCritical ? 'bg-rose-100 text-rose-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                }`}>
                  <FaIcon icon={isCritical ? 'fa-triangle-exclamation' : isWarning ? 'fa-triangle-exclamation' : 'fa-bell'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">{alt.title}</h4>
                  <p className="text-xs mt-0.5 opacity-90">{alt.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{summary.total}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Logs</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center">
          <p className="text-xl font-bold text-rose-700">{summary.high_pain_count}</p>
          <p className="text-[10px] text-rose-600 font-semibold uppercase">High Pain (≥7)</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center">
          <p className="text-xl font-bold text-amber-800">{summary.skipped_count}</p>
          <p className="text-[10px] text-amber-700 font-semibold uppercase">Skipped</p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 text-center">
          <p className="text-xl font-bold text-teal-800">{summary.pending_count}</p>
          <p className="text-[10px] text-teal-700 font-semibold uppercase">Pending Review</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[140px]">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-2.5 text-xs text-slate-400" />
            <input
              type="text"
              placeholder="Search exercise or feedback..."
              className="input-field text-xs pl-8 py-1.5 bg-white w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Pain filter */}
          <select
            className="input-field text-xs py-1.5 px-2 bg-white"
            value={painFilter}
            onChange={(e) => setPainFilter(e.target.value)}
          >
            <option value="">All Pain Scores</option>
            <option value="7">Severe Pain (≥7)</option>
            <option value="4">Moderate Pain (≥4)</option>
            <option value="1">Mild Pain (≥1)</option>
          </select>

          {/* Completion Status */}
          <select
            className="input-field text-xs py-1.5 px-2 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>

          {/* Review Status */}
          <select
            className="input-field text-xs py-1.5 px-2 bg-white"
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value)}
          >
            <option value="">All Review Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            className="input-field text-xs py-1.5 px-2 bg-white"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="glass-card h-48 animate-pulse" />
      ) : !feedbackList.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <FaIcon icon="fa-dumbbell" className="text-3xl text-slate-300 mb-2 block mx-auto" />
          No patient exercise feedback logs found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {feedbackList.map((log) => {
            const pain = log.pain_level !== null ? Number(log.pain_level) : null;
            const isSeverePain = pain !== null && pain >= 7;
            const isSkipped = log.status === 'skipped';
            const isReviewed = log.review_status === 'reviewed';
            const comment = log.patient_comment || log.feedback;

            return (
              <article
                key={log.id}
                className={`rounded-2xl border bg-white shadow-xs p-4 transition-all ${
                  isSeverePain
                    ? 'border-rose-200 bg-rose-50/20'
                    : isSkipped
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                        isSkipped ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isSkipped ? 'Skipped' : 'Completed'}
                      </span>

                      {pain !== null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSeverePain ? 'bg-rose-100 text-rose-800 border border-rose-300' : pain >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Pain Score: {pain}/10
                        </span>
                      )}

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isReviewed ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-teal-50 text-teal-800 border-teal-200'
                      }`}>
                        {isReviewed ? 'Reviewed' : 'Pending Review'}
                      </span>

                      <h4 className="font-bold text-slate-900 text-sm">{log.exercise_name || 'Prescribed Exercise'}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>
                        <FaIcon icon="fa-clock" className="mr-1 text-slate-400" />
                        {log.log_date ? new Date(log.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                      {log.sets_done && (
                        <span>Sets done: <strong>{log.sets_done}</strong></span>
                      )}
                      {log.reps_done && (
                        <span>Reps: <strong>{log.reps_done}</strong></span>
                      )}
                      {log.prescription_title && (
                        <span className="text-slate-400">Plan: {log.prescription_title}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleReviewStatus(log)}
                      className={`btn-outline text-xs !py-1 !px-2.5 ${isReviewed ? 'text-slate-600' : 'text-teal-700 border-teal-200 bg-teal-50'}`}
                      title={isReviewed ? 'Mark as pending review' : 'Mark as reviewed'}
                    >
                      <FaIcon icon={isReviewed ? 'fa-arrow-rotate-left' : 'fa-check'} className="mr-1" />
                      {isReviewed ? 'Unreview' : 'Mark Reviewed'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openReplyModal(log)}
                      className="btn-primary text-xs !py-1 !px-2.5 inline-flex items-center gap-1"
                      title="Reply or Add Internal Note"
                    >
                      <FaIcon icon="fa-reply" />
                      <span>Reply / Note</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => convertToClinicalNote(log)}
                      className="btn-outline text-xs !py-1 !px-2.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      title="Convert this exercise feedback into a Clinical Note"
                    >
                      <FaIcon icon="fa-file-lines" className="mr-1" />
                      <span>To Clinical Note</span>
                    </button>
                  </div>
                </div>

                {/* Comment & Feedback text */}
                {comment ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-100">
                    <p className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1">Patient Comment</p>
                    <p className="leading-relaxed whitespace-pre-wrap">{comment}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs italic text-slate-400">No written comment provided by patient.</p>
                )}

                {/* Therapist Response */}
                {log.therapist_response && (
                  <div className="mt-2 rounded-xl bg-teal-50/60 p-3 text-xs text-teal-900 border border-teal-100">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-bold text-teal-800 uppercase tracking-wide text-[10px]">
                        Therapist Response ({log.therapist_name || 'Therapist'})
                      </p>
                      <span className="text-[10px] text-teal-600">
                        {log.therapist_response_at ? new Date(log.therapist_response_at).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{log.therapist_response}</p>
                  </div>
                )}

                {/* Internal Note */}
                {log.internal_note && (
                  <div className="mt-2 rounded-xl bg-purple-50/60 p-2.5 text-xs text-purple-900 border border-purple-100">
                    <p className="font-bold text-purple-800 uppercase tracking-wide text-[10px] mb-0.5">Internal Clinical Note (Staff Only)</p>
                    <p className="leading-relaxed">{log.internal_note}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Reply & Internal Note Modal */}
      {replyModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaIcon icon="fa-reply" className="text-teal-600 text-sm" />
                Therapist Response & Internal Note
              </h3>
              <button type="button" onClick={() => setReplyModalLog(null)} className="text-slate-400 hover:text-slate-600 text-sm p-1">
                <FaIcon icon="fa-xmark" />
              </button>
            </div>

            <form onSubmit={saveReplyAndNote} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900">{replyModalLog.exercise_name}</p>
                <p className="text-slate-600">Log Date: {replyModalLog.log_date}</p>
                {replyModalLog.patient_comment && (
                  <p className="text-slate-700 italic border-t pt-1 mt-1">"{replyModalLog.patient_comment}"</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reply to Patient</label>
                <textarea
                  className="input-field text-xs w-full py-2 resize-none"
                  rows={3}
                  placeholder="Type guidance or instructions for the patient..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Internal Note (Clinic Staff Only)</label>
                <textarea
                  className="input-field text-xs w-full py-2 resize-none bg-purple-50/30"
                  rows={2}
                  placeholder="Internal observations or notes for team..."
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setReplyModalLog(null)} className="btn-outline text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={submittingAction} className="btn-primary text-xs py-2 px-5">
                  {submittingAction ? 'Saving...' : 'Save Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
