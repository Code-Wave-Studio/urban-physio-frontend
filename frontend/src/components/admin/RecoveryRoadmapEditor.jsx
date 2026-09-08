import FaIcon from '../FaIcon';
import MediaUrlOrUpload from './MediaUrlOrUpload';
import { CmsField, CmsPanel } from './CmsFormKit';
import { isFlagOn } from '../../constants/communityPreview';
import { blankRoadmapPhase, blankRoadmapSpec } from '../../constants/recoveryRoadmapDefaults';

function moveItem(list, index, dir) {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return list;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function EnabledToggle({ on, onChange, accent }) {
  const active = accent === 'teal' ? 'bg-teal-600' : 'bg-primary-600';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(on ? '0' : '1')}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        on ? active : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <span className="sr-only">{on ? 'Enabled' : 'Disabled'}</span>
    </button>
  );
}

export default function RecoveryRoadmapEditor({
  sections,
  onChange,
  uploadFn,
  accent = 'orange',
  scopeNote,
}) {
  const phases = Array.isArray(sections.roadmap_phases) ? sections.roadmap_phases : [];
  const sectionOn = isFlagOn(sections.roadmap_enabled ?? '1');
  const accentBtn = accent === 'teal' ? 'hover:border-teal-300' : 'hover:border-primary-300';
  const mediaAccent = accent === 'teal' ? 'emerald' : 'orange';

  const updatePhase = (i, patch) => {
    onChange(
      'roadmap_phases',
      phases.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    );
  };

  const updateSpec = (phaseIndex, specIndex, patch) => {
    const specs = Array.isArray(phases[phaseIndex]?.specs) ? [...phases[phaseIndex].specs] : [];
    specs[specIndex] = { ...specs[specIndex], ...patch };
    updatePhase(phaseIndex, { specs });
  };

  return (
    <div className="space-y-5">
      {scopeNote ? <p className="text-xs text-slate-500 -mb-1">{scopeNote}</p> : null}

      <CmsPanel title="Section visibility" icon="fa-eye">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Show recovery roadmap</p>
            <p className="text-xs text-slate-500 mt-0.5">
              When off, this interactive journey is hidden on the live page.
            </p>
          </div>
          <EnabledToggle
            on={sectionOn}
            onChange={(v) => onChange('roadmap_enabled', v)}
            accent={accent}
          />
        </div>
      </CmsPanel>

      <CmsPanel title="Section copy" icon="fa-heading">
        <CmsField label="Section label" hint="Small uppercase label above the heading.">
          <input
            className="input-field"
            value={sections.roadmap_label || ''}
            onChange={(e) => onChange('roadmap_label', e.target.value)}
            placeholder="Our approach"
          />
        </CmsField>
        <CmsField label="Main heading">
          <input
            className="input-field"
            value={sections.roadmap_heading || ''}
            onChange={(e) => onChange('roadmap_heading', e.target.value)}
          />
        </CmsField>
        <CmsField label="Introduction">
          <textarea
            className="input-field min-h-[88px]"
            value={sections.roadmap_intro || ''}
            onChange={(e) => onChange('roadmap_intro', e.target.value)}
          />
        </CmsField>
      </CmsPanel>

      <CmsPanel title="Journey phases" icon="fa-route">
        <p className="text-xs text-slate-500 -mt-1">
          Reorder with the arrows. Disabled phases stay in CMS but are hidden on the live page. Display order is the
          list order below.
        </p>
        <div className="space-y-5">
          {phases.map((phase, i) => {
            const on = isFlagOn(phase.enabled ?? '1');
            const specs = Array.isArray(phase.specs) ? phase.specs : [];
            return (
              <div key={phase.id || `phase-${i}`} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {phase.number || `Phase ${i + 1}`}
                    {phase.title ? ` · ${phase.title}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <EnabledToggle on={on} onChange={(v) => updatePhase(i, { enabled: v })} accent={accent} />
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                      disabled={i === 0}
                      onClick={() => onChange('roadmap_phases', moveItem(phases, i, -1))}
                      aria-label="Move phase up"
                    >
                      <FaIcon icon="fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 text-slate-400 hover:text-slate-700 rounded-md ${accentBtn}`}
                      disabled={i === phases.length - 1}
                      onClick={() => onChange('roadmap_phases', moveItem(phases, i, 1))}
                      aria-label="Move phase down"
                    >
                      <FaIcon icon="fa-arrow-down" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-md"
                      onClick={() => onChange('roadmap_phases', phases.filter((_, j) => j !== i))}
                      aria-label="Delete phase"
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Phase number">
                    <input
                      className="input-field"
                      value={phase.number || ''}
                      onChange={(e) => updatePhase(i, { number: e.target.value })}
                      placeholder="Phase 1"
                    />
                  </CmsField>
                  <CmsField label="Subtitle / category">
                    <input
                      className="input-field"
                      value={phase.subtitle || ''}
                      onChange={(e) => updatePhase(i, { subtitle: e.target.value })}
                      placeholder="First visit"
                    />
                  </CmsField>
                </div>
                <CmsField label="Phase title">
                  <input
                    className="input-field"
                    value={phase.title || ''}
                    onChange={(e) => updatePhase(i, { title: e.target.value })}
                  />
                </CmsField>
                <CmsField label="Phase description">
                  <textarea
                    className="input-field min-h-[80px]"
                    value={phase.description || ''}
                    onChange={(e) => updatePhase(i, { description: e.target.value })}
                  />
                </CmsField>
                <MediaUrlOrUpload
                  label="Phase image"
                  hint="Shown beside the phase copy. A portrait or 3:4 photo works best."
                  recommendedSize="900 × 1200 px (3:4 ratio)"
                  aspectRatio="4:3"
                  devicePreview="4:3"
                  accent={mediaAccent}
                  icon="fa-image"
                  urlValue={phase.image || ''}
                  onUrlChange={(v) => updatePhase(i, { image: v })}
                  onUpload={uploadFn}
                  accept="image/jpeg,image/png,image/webp"
                  maxMb={4}
                  preview="image"
                />
                <CmsField label="Image alt text">
                  <input
                    className="input-field"
                    value={phase.image_alt || ''}
                    onChange={(e) => updatePhase(i, { image_alt: e.target.value })}
                    placeholder="Describe the photograph for screen readers"
                  />
                </CmsField>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Specifications</p>
                  {specs.map((spec, si) => {
                    const specOn = isFlagOn(spec.enabled ?? '1');
                    return (
                      <div key={`spec-${i}-${si}`} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Point {si + 1}
                          </p>
                          <div className="flex items-center gap-1">
                            <EnabledToggle
                              on={specOn}
                              onChange={(v) => updateSpec(i, si, { enabled: v })}
                              accent={accent}
                            />
                            <button
                              type="button"
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                              disabled={si === 0}
                              onClick={() => updatePhase(i, { specs: moveItem(specs, si, -1) })}
                              aria-label="Move specification up"
                            >
                              <FaIcon icon="fa-arrow-up" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                              disabled={si === specs.length - 1}
                              onClick={() => updatePhase(i, { specs: moveItem(specs, si, 1) })}
                              aria-label="Move specification down"
                            >
                              <FaIcon icon="fa-arrow-down" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 text-red-500 hover:text-red-700 rounded-md"
                              onClick={() =>
                                updatePhase(
                                  i,
                                  { specs: specs.filter((_, j) => j !== si) }
                                )
                              }
                              aria-label="Delete specification"
                            >
                              <FaIcon icon="fa-trash" />
                            </button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <CmsField label="Icon (Font Awesome)">
                            <input
                              className="input-field font-mono text-sm"
                              value={spec.icon || ''}
                              onChange={(e) => updateSpec(i, si, { icon: e.target.value })}
                              placeholder="fa-shield-halved"
                            />
                          </CmsField>
                          <CmsField label="Title">
                            <input
                              className="input-field"
                              value={spec.title || ''}
                              onChange={(e) => updateSpec(i, si, { title: e.target.value })}
                            />
                          </CmsField>
                        </div>
                        <CmsField label="Description">
                          <textarea
                            className="input-field min-h-[64px] text-sm"
                            value={spec.description || ''}
                            onChange={(e) => updateSpec(i, si, { description: e.target.value })}
                          />
                        </CmsField>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className="btn-outline text-xs !py-2"
                    onClick={() => updatePhase(i, { specs: [...specs, blankRoadmapSpec()] })}
                  >
                    <FaIcon icon="fa-plus" /> Add specification
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn-outline text-xs !py-2 mt-3"
          onClick={() => onChange('roadmap_phases', [...phases, blankRoadmapPhase(phases.length)])}
        >
          <FaIcon icon="fa-plus" /> Add phase
        </button>
      </CmsPanel>
    </div>
  );
}
