import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import GlassModal, { GlassModalHeader, GlassModalProgress, GlassModalFooter } from '../GlassModal';
import { TREATMENT_BODY_AREAS, parsePlanPhases } from '../../utils/treatmentHelpers';

const BODY_AREAS = TREATMENT_BODY_AREAS.filter((c) => c.id);

const TABS = [
  { id: 'basic', label: 'Basics', icon: 'fa-circle-info', desc: 'Title, body area & summary' },
  { id: 'medical', label: 'Medical', icon: 'fa-stethoscope', desc: 'Causes, symptoms & goals' },
  { id: 'plan', label: 'Treatment Plan', icon: 'fa-route', desc: 'Physio program steps' },
  { id: 'publish', label: 'Publish', icon: 'fa-globe', desc: 'Visibility & ordering' },
];

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function Field({ label, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500 mt-0.5 mb-1.5">{hint}</p>}
      {!hint && <div className="mt-1.5" />}
      {children}
    </div>
  );
}

export default function TreatmentFormModal({
  open,
  onClose,
  onSubmit,
  form,
  patch,
  editingId,
  saving,
  loadingEdit,
}) {
  const [tab, setTab] = useState('basic');
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (open) {
      setTab('basic');
      setSlugManual(!!form.slug);
    }
  }, [open, editingId]);

  const handleTitleChange = useCallback(
    (title) => {
      if (!slugManual) {
        patch({ title, slug: slugify(title) });
      } else {
        patch({ title });
      }
    },
    [slugManual, patch]
  );

  const phases = parsePlanPhases(form.treatment_plan);
  const shortLen = (form.short_description || '').length;
  const tabIndex = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const stepNum = tabIndex + 1;

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      preventClose={saving}
      size="xl"
      titleId="treatment-modal-title"
      panelClassName="flex flex-col max-h-[min(720px,calc(100vh-2rem))]"
    >
        <GlassModalHeader
          titleId="treatment-modal-title"
          title={editingId ? 'Edit Treatment' : 'New Treatment'}
          subtitle={editingId ? `ID #${editingId}` : 'Create a public treatment page'}
          icon={editingId ? 'fa-pen-to-square' : 'fa-plus'}
          accent="cyan"
          onClose={onClose}
          disabledClose={saving}
        >
          <GlassModalProgress step={stepNum} total={TABS.length} accent="cyan" />
        </GlassModalHeader>

        {loadingEdit ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-500 text-sm mt-4">Loading treatment...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
              {/* Side tabs — desktop */}
              <nav className="hidden md:flex flex-col w-52 shrink-0 glass-modal-sidebar p-3 gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`text-left px-3 py-3 rounded-xl transition ${
                      tab === t.id
                        ? 'bg-white shadow-sm border border-primary-200 text-primary-700'
                        : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <FaIcon icon={t.icon} className="text-xs" />
                      {t.label}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 pl-5">{t.desc}</span>
                  </button>
                ))}
              </nav>

              
              <div className="md:hidden flex gap-1 p-2 overflow-x-auto border-b border-white/70 bg-white/40 backdrop-blur-md">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      tab === t.id ? 'bg-primary-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    <FaIcon icon={t.icon} className="text-[10px]" />
                    {t.label}
                  </button>
                ))}
              </div>

              
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
                {tab === 'basic' && (
                  <div className="space-y-5 max-w-xl">
                    <Field label="Treatment title" required hint="Shown on cards and page heading">
                      <input
                        className="input-field"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. ACL Injury Rehabilitation"
                        autoFocus
                      />
                    </Field>

                    <Field
                      label="URL slug"
                      hint="Auto-generated from title. Edit only if you need a custom URL."
                    >
                      <div className="flex rounded-xl overflow-hidden border border-white/60 focus-within:ring-2 focus-within:ring-primary-400/50">
                        <span className="flex items-center px-3 bg-slate-100 text-slate-500 text-sm font-mono shrink-0 border-r border-slate-200">
                          /treatments/
                        </span>
                        <input
                          className="flex-1 px-4 py-2.5 bg-white/80 outline-none font-mono text-sm min-w-0"
                          value={form.slug}
                          onChange={(e) => {
                            setSlugManual(true);
                            patch({ slug: slugify(e.target.value) });
                          }}
                          placeholder="acl-injury"
                        />
                      </div>
                      {form.slug && editingId && form.is_active && (
                        <Link
                          to={`/treatments/${form.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium mt-2 hover:underline"
                        >
                          <FaIcon icon="fa-external-link" />
                          Preview live page
                        </Link>
                      )}
                    </Field>

                    <Field label="Body area" required>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {BODY_AREAS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => patch({ body_area: c.id })}
                            className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition flex flex-col items-center gap-1 ${
                              form.body_area === c.id
                                ? 'border-primary-500 bg-primary-50 text-primary-800'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                            }`}
                          >
                            <FaIcon icon={c.icon} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field
                      label="Short description"
                      hint={`Card teaser on home & listing (${shortLen}/160 chars)`}
                    >
                      <textarea
                        className="input-field resize-none"
                        rows={2}
                        maxLength={160}
                        value={form.short_description}
                        onChange={(e) => patch({ short_description: e.target.value })}
                        placeholder="One line summary for cards..."
                      />
                    </Field>

                    <Field label="Overview" hint="Main description on the detail page">
                      <textarea
                        className="input-field"
                        rows={4}
                        value={form.description}
                        onChange={(e) => patch({ description: e.target.value })}
                        placeholder="What is this condition? Who is it for?"
                      />
                    </Field>
                  </div>
                )}

                {tab === 'medical' && (
                  <div className="space-y-5 max-w-xl">
                    <Field label="Common causes" hint="Comma-separated or short sentences">
                      <textarea
                        className="input-field"
                        rows={3}
                        value={form.causes}
                        onChange={(e) => patch({ causes: e.target.value })}
                        placeholder="Poor posture, sports injury, ..."
                      />
                    </Field>
                    <Field label="Signs & symptoms">
                      <textarea
                        className="input-field"
                        rows={3}
                        value={form.symptoms}
                        onChange={(e) => patch({ symptoms: e.target.value })}
                        placeholder="Pain, stiffness, swelling..."
                      />
                    </Field>
                    <Field label="Treatment goals" hint="What success looks like for the patient">
                      <textarea
                        className="input-field"
                        rows={3}
                        value={form.goals}
                        onChange={(e) => patch({ goals: e.target.value })}
                      />
                    </Field>
                    <Field label="When to see a physiotherapist">
                      <textarea
                        className="input-field"
                        rows={2}
                        value={form.when_to_see}
                        onChange={(e) => patch({ when_to_see: e.target.value })}
                        placeholder="e.g. If pain lasts more than 2 weeks..."
                      />
                    </Field>
                  </div>
                )}

                {tab === 'plan' && (
                  <div className="space-y-5 max-w-xl">
                    <Field
                      label="Treatment plan"
                      hint="Separate steps with → (arrow). Example: Assessment → Manual therapy → Strengthening"
                    >
                      <textarea
                        className="input-field font-mono text-sm"
                        rows={5}
                        value={form.treatment_plan}
                        onChange={(e) => patch({ treatment_plan: e.target.value })}
                      />
                    </Field>
                    {phases.length > 0 && (
                      <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
                        <p className="text-xs font-semibold text-primary-800 mb-3 flex items-center gap-1">
                          <FaIcon icon="fa-eye" />
                          Step preview
                        </p>
                        <ol className="space-y-2">
                          {phases.map((phase, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-700">
                              <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center shrink-0 font-bold">
                                {i + 1}
                              </span>
                              <span className="pt-0.5">{phase}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'publish' && (
                  <div className="space-y-5 max-w-xl">
                    <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4 bg-slate-50/50">
                      <div>
                        <p className="font-medium text-slate-800">Visible on website</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {form.is_active
                            ? 'Patients can see this on /treatments'
                            : 'Hidden from public — only visible in admin'}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!form.is_active}
                        onClick={() => patch({ is_active: form.is_active ? 0 : 1 })}
                        className={`relative w-14 h-8 rounded-full transition ${
                          form.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
                            form.is_active ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    <Field label="Sort order" hint="Lower numbers appear first in listings">
                      <input
                        type="number"
                        min={0}
                        className="input-field w-32"
                        value={form.sort_order}
                        onChange={(e) => patch({ sort_order: e.target.value })}
                      />
                    </Field>

                    <Field label="Cover image URL" hint="Optional — full image URL for future use">
                      <input
                        className="input-field"
                        type="url"
                        value={form.image_url}
                        onChange={(e) => patch({ image_url: e.target.value })}
                        placeholder="https://..."
                      />
                      {form.image_url && (
                        <img
                          src={form.image_url}
                          alt=""
                          className="mt-3 h-24 w-auto rounded-lg border object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </Field>
                  </div>
                )}
              </div>
            </div>


            <GlassModalFooter>
              <div className="flex items-center justify-between gap-3 w-full">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <FaIcon icon="fa-keyboard" />
                <span>Esc to cancel</span>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="btn-outline flex-1 sm:flex-none sm:min-w-[100px] py-2.5"
                >
                  Cancel
                </button>
                {tab !== 'publish' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = TABS.findIndex((t) => t.id === tab);
                      if (idx < TABS.length - 1) setTab(TABS[idx + 1].id);
                    }}
                    className="btn-primary flex-1 sm:flex-none sm:min-w-[120px] py-2.5 inline-flex items-center justify-center gap-2"
                  >
                    Next
                    <FaIcon icon="fa-arrow-right" className="text-xs" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving || !form.title.trim()}
                    className="btn-primary flex-1 sm:flex-none sm:min-w-[140px] py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaIcon icon={editingId ? 'fa-check' : 'fa-plus'} />
                        {editingId ? 'Save changes' : 'Create treatment'}
                      </>
                    )}
                  </button>
                )}
              </div>
              </div>
            </GlassModalFooter>
          </form>
        )}
    </GlassModal>
  );
}
