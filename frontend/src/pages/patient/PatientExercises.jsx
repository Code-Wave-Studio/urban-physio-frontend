import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import { exercisePrescriptions } from '../../services/api';
import { PATIENT_NAV } from '../../constants/patientNav';
import toast from 'react-hot-toast';

function ProgressBar({ percent = 0, className = '' }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className={`w-full h-2.5 rounded-full bg-slate-100 overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${p}%` }} />
    </div>
  );
}

function youtubeEmbed(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function PatientExercises() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [logItem, setLogItem] = useState(null);
  const [logForm, setLogForm] = useState({
    status: 'completed',
    pain_level: 3,
    feedback: '',
    patient_comment: '',
    media_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [previewEx, setPreviewEx] = useState(null);
  const [tab, setTab] = useState('today'); // today | progress | history

  const loadPlans = useCallback(() => {
    setLoading(true);
    exercisePrescriptions
      .list({ status: 'active' })
      .then((res) => {
        const items = res.data || [];
        setPlans(items);
        if (!activeId && items.length) setActiveId(items[0].id);
        if (activeId && !items.find((p) => p.id === activeId) && items.length) {
          setActiveId(items[0].id);
        }
      })
      .catch((e) => toast.error(e.message || 'Could not load exercises'))
      .finally(() => setLoading(false));
  }, [activeId]);

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDetail = useCallback((id) => {
    if (!id) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    exercisePrescriptions
      .get(id)
      .then((res) => setDetail(res.data || null))
      .catch((e) => toast.error(e.message || 'Could not load plan'))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    loadDetail(activeId);
  }, [activeId, loadDetail]);

  const progress = detail?.progress;
  const exercises = detail?.exercises || [];

  const todayDone = useMemo(
    () => exercises.filter((e) => e.today_log?.status === 'completed').length,
    [exercises]
  );

  const openLog = (item, status = 'completed') => {
    setLogItem(item);
    setLogForm({
      status,
      pain_level: item.today_log?.pain_level || 3,
      feedback: item.today_log?.feedback || '',
      patient_comment: item.today_log?.patient_comment || '',
      media_url: item.today_log?.media_url || '',
    });
  };

  const submitLog = async (e) => {
    e.preventDefault();
    if (!detail || !logItem) return;
    setSaving(true);
    try {
      await exercisePrescriptions.log(detail.id, {
        item_id: logItem.id,
        status: logForm.status,
        pain_level: logForm.pain_level,
        feedback: logForm.feedback,
        patient_comment: logForm.patient_comment,
        media_url: logForm.media_url || undefined,
      });
      toast.success(logForm.status === 'completed' ? 'Marked complete' : 'Marked skipped');
      setLogItem(null);
      loadDetail(detail.id);
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-5 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Exercises</h1>
        <p className="text-sm text-slate-600 mt-1">Your assigned rehabilitation plan — track daily progress and feedback.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="glass-card h-24 animate-pulse" />)}</div>
      ) : plans.length === 0 ? (
        <div className="glass-card text-center py-14 px-6">
          <FaIcon icon="fa-dumbbell" className="text-4xl text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No active exercise plan</p>
          <p className="text-sm text-slate-500 mt-1">When your doctor assigns exercises, they will appear here.</p>
        </div>
      ) : (
        <>
          {/* Plan picker */}
          {plans.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                    activeId === p.id
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {detailLoading || !detail ? (
            <div className="glass-card h-48 animate-pulse" />
          ) : (
            <div className="space-y-5">
              {/* Summary card */}
              <div className="glass-card !p-4 md:!p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{detail.title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Dr. {detail.doctor_first_name} {detail.doctor_last_name}
                      {detail.week_number ? ` · Week ${detail.week_number}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full self-start">
                    {todayDone}/{exercises.length} today
                  </span>
                </div>
                <ProgressBar percent={progress?.today?.percent ?? 0} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: 'Completion', value: `${progress?.today?.percent ?? 0}%` },
                    { label: 'This week', value: `${progress?.week?.percent ?? 0}%` },
                    { label: 'Pending', value: progress?.today?.pending ?? 0 },
                    { label: 'Avg pain', value: progress?.today?.pain_avg ?? '—' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-slate-50 px-3 py-2 text-center border border-slate-100">
                      <p className="text-[10px] uppercase text-slate-400 tracking-wide">{s.label}</p>
                      <p className="text-base font-bold text-slate-800">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1">
                {[
                  { key: 'today', label: 'Today', icon: 'fa-calendar-day' },
                  { key: 'progress', label: 'Progress', icon: 'fa-chart-line' },
                  { key: 'history', label: 'History', icon: 'fa-clock-rotate-left' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition ${
                      tab === t.key ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <FaIcon icon={t.icon} className="mr-1.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'today' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {exercises.map((ex) => {
                    const done = ex.today_log?.status === 'completed';
                    const skipped = ex.today_log?.status === 'skipped';
                    return (
                      <div
                        key={ex.id}
                        className={`glass-card !p-4 flex flex-col gap-3 ${
                          done ? 'ring-1 ring-emerald-200 bg-emerald-50/30' : skipped ? 'opacity-80' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {ex.image_url ? (
                            <img src={ex.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                              <FaIcon icon="fa-dumbbell" className="text-xl" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 leading-snug">
                              {ex.exercise_name}
                              {ex.is_mandatory && (
                                <span className="ml-2 text-[10px] uppercase font-bold text-rose-600">Must do</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {ex.sets} sets · {ex.reps} reps · {ex.frequency}
                              {ex.hold_seconds ? ` · hold ${ex.hold_seconds}s` : ''}
                            </p>
                            {ex.difficulty && (
                              <span className="inline-block mt-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">
                                {ex.difficulty}
                              </span>
                            )}
                          </div>
                        </div>

                        {ex.special_instructions && (
                          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-2">{ex.special_instructions}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-auto">
                          <button type="button" className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => setPreviewEx(ex)}>
                            <FaIcon icon="fa-eye" className="mr-1" /> View
                          </button>
                          {!done && (
                            <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => openLog(ex, 'completed')}>
                              <FaIcon icon="fa-check" className="mr-1" /> Complete
                            </button>
                          )}
                          {!done && !skipped && (
                            <button type="button" className="text-xs text-slate-500 font-medium px-2" onClick={() => openLog(ex, 'skipped')}>
                              Skip
                            </button>
                          )}
                          {(done || skipped) && (
                            <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-lg ${done ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                              {ex.today_log.status}
                              {ex.today_log.pain_level != null ? ` · pain ${ex.today_log.pain_level}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'progress' && (
                <div className="glass-card !p-4 md:!p-5 space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-2">Weekly progress</p>
                    <ProgressBar percent={progress?.week?.percent ?? 0} />
                    <p className="text-xs text-slate-500 mt-1.5">
                      {progress?.week?.completed ?? 0} completed this week · {progress?.week?.pending ?? 0} pending
                    </p>
                  </div>

                  {progress?.timeline?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-3">Recovery timeline</p>
                      <div className="relative pl-4 border-l-2 border-teal-100 space-y-4">
                        {progress.timeline.map((t) => (
                          <div key={t.from} className="relative">
                            <span className="absolute -left-[1.3rem] top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-white shadow" />
                            <p className="text-sm font-medium text-slate-800">{t.label}</p>
                            <p className="text-xs text-slate-500">
                              {t.percent}% complete
                              {t.pain_avg != null ? ` · avg pain ${t.pain_avg}/10` : ''}
                            </p>
                            <ProgressBar percent={t.percent} className="mt-1.5 max-w-xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {progress?.pain_trend?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-2">Pain trend</p>
                      <div className="flex items-end gap-1.5 h-28">
                        {progress.pain_trend.map((p) => (
                          <div key={p.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={`${p.date}: ${p.avg_pain}/10`}>
                            <span className="text-[10px] font-semibold text-amber-700">{p.avg_pain}</span>
                            <div
                              className="w-full max-w-[22px] rounded-t-md bg-gradient-to-t from-amber-500 to-amber-300"
                              style={{ height: `${Math.max(8, (p.avg_pain / 10) * 100)}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 text-center">Last 14 days · lower is better</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'history' && (
                <div className="glass-card !p-4 md:!p-5">
                  {!progress?.history?.length ? (
                    <p className="text-sm text-slate-500 text-center py-8">No history yet — complete an exercise to start tracking.</p>
                  ) : (
                    <ul className="space-y-2">
                      {progress.history.map((h) => (
                        <li key={h.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            h.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <FaIcon icon={h.status === 'completed' ? 'fa-check' : 'fa-forward'} className="text-xs" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">{h.exercise_name}</p>
                            <p className="text-xs text-slate-500">
                              {h.log_date} · <span className="capitalize">{h.status}</span>
                              {h.pain_level != null ? ` · pain ${h.pain_level}/10` : ''}
                            </p>
                            {(h.feedback || h.patient_comment) && (
                              <p className="text-xs text-slate-600 mt-1">{h.feedback || h.patient_comment}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Exercise preview */}
      <GlassModal open={!!previewEx} onClose={() => setPreviewEx(null)} size="lg">
        <GlassModalHeader
          title={previewEx?.exercise_name || 'Exercise'}
          subtitle={[previewEx?.difficulty, previewEx?.body_area || previewEx?.category].filter(Boolean).join(' · ')}
          icon="fa-dumbbell"
          onClose={() => setPreviewEx(null)}
        />
        <GlassModalBody>
          {previewEx && (
            <div className="space-y-4">
              {(() => {
                const yt = youtubeEmbed(previewEx.video_url);
                if (yt) {
                  return <iframe title="video" src={yt} className="w-full aspect-video rounded-xl bg-black" allowFullScreen />;
                }
                if (previewEx.video_url) {
                  return (
                    <video src={previewEx.video_url} controls className="w-full rounded-xl bg-black max-h-[360px]" />
                  );
                }
                if (previewEx.image_url) {
                  return <img src={previewEx.image_url} alt="" className="w-full max-h-[320px] object-contain rounded-xl bg-slate-50" />;
                }
                return null;
              })()}

              {previewEx.gallery_images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {previewEx.gallery_images.map((url) => (
                    <img key={url} src={url} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-slate-100 px-2 py-1 rounded-md">{previewEx.sets} sets</span>
                <span className="bg-slate-100 px-2 py-1 rounded-md">{previewEx.reps} reps</span>
                {previewEx.hold_seconds && <span className="bg-slate-100 px-2 py-1 rounded-md">Hold {previewEx.hold_seconds}s</span>}
                <span className="bg-slate-100 px-2 py-1 rounded-md">{previewEx.frequency}</span>
                {previewEx.equipment && <span className="bg-slate-100 px-2 py-1 rounded-md">{previewEx.equipment}</span>}
              </div>

              {previewEx.steps?.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
                  {previewEx.steps.map((s, i) => (
                    <li key={i}>{typeof s === 'string' ? s : s.text || s.step || JSON.stringify(s)}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{previewEx.exercise_instructions}</p>
              )}

              {previewEx.precautions && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-sm text-amber-900">
                  <FaIcon icon="fa-triangle-exclamation" className="mr-1.5" />
                  {previewEx.precautions}
                </div>
              )}

              {previewEx.pdf_url && (
                <a href={previewEx.pdf_url} target="_blank" rel="noreferrer" className="btn-outline inline-flex text-sm">
                  <FaIcon icon="fa-file-pdf" className="mr-1.5" /> Download PDF instructions
                </a>
              )}
            </div>
          )}
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setPreviewEx(null)}>Close</button>
          {previewEx && !previewEx.today_log && (
            <button type="button" className="btn-primary" onClick={() => { setPreviewEx(null); openLog(previewEx, 'completed'); }}>
              Mark complete
            </button>
          )}
        </GlassModalFooter>
      </GlassModal>

      {/* Log feedback modal */}
      <GlassModal open={!!logItem} onClose={() => setLogItem(null)} size="md">
        <form onSubmit={submitLog}>
          <GlassModalHeader
            title={logForm.status === 'skipped' ? 'Skip exercise' : 'Complete exercise'}
            subtitle={logItem?.exercise_name}
            icon={logForm.status === 'skipped' ? 'fa-forward' : 'fa-check'}
            onClose={() => setLogItem(null)}
          />
          <GlassModalBody>
            <div className="space-y-4">
              <div className="flex gap-2">
                {['completed', 'skipped'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLogForm((f) => ({ ...f, status: s }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${
                      logForm.status === s ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Pain level: <span className="text-teal-700 font-bold">{logForm.pain_level}/10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={logForm.pain_level}
                  onChange={(e) => setLogForm((f) => ({ ...f, pain_level: Number(e.target.value) }))}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>No pain</span>
                  <span>Severe</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Daily feedback</label>
                <textarea
                  className="input-field w-full min-h-[72px]"
                  placeholder="How did it feel?"
                  value={logForm.feedback}
                  onChange={(e) => setLogForm((f) => ({ ...f, feedback: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Question for your doctor</label>
                <input
                  className="input-field w-full"
                  placeholder="Optional comment or question"
                  value={logForm.patient_comment}
                  onChange={(e) => setLogForm((f) => ({ ...f, patient_comment: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Photo/video URL (optional)</label>
                <input
                  className="input-field w-full"
                  placeholder="https://…"
                  value={logForm.media_url}
                  onChange={(e) => setLogForm((f) => ({ ...f, media_url: e.target.value }))}
                />
              </div>
            </div>
          </GlassModalBody>
          <GlassModalFooter>
            <button type="button" className="btn-outline" onClick={() => setLogItem(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </DashboardLayout>
  );
}
