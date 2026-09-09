import FaIcon from '../FaIcon';
import MediaUrlOrUpload from './MediaUrlOrUpload';
import { CmsField, CmsPanel } from './CmsFormKit';
import { isFlagOn } from '../../constants/communityPreview';
import { ENROL_VISUALS, blankEnrolStep } from '../../constants/enrollmentDefaults';

function moveItem(list, index, dir) {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return list;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next.map((row, i) => ({ ...row, sort_order: i + 1 }));
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

export default function EnrollmentEditor({
  sections,
  onChange,
  uploadFn,
  accent = 'orange',
  scopeNote,
}) {
  const items = Array.isArray(sections.enrol_steps) ? sections.enrol_steps : [];
  const sectionOn = isFlagOn(sections.enrol_enabled ?? '1');
  const accentBtn = accent === 'teal' ? 'hover:border-teal-300' : 'hover:border-primary-300';
  const mediaAccent = accent === 'teal' ? 'emerald' : 'orange';
  const defaultId = String(sections.enrol_default_step || '');

  const updateItem = (i, patch) => {
    onChange(
      'enrol_steps',
      items.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    );
  };

  return (
    <div className="space-y-5">
      {scopeNote ? <p className="text-xs text-slate-500 -mb-1">{scopeNote}</p> : null}

      <CmsPanel title="Section visibility" icon="fa-eye">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Show How to Enrol</p>
            <p className="text-xs text-slate-500 mt-0.5">
              When off, the hexagonal enrollment pathway is hidden on the live page.
            </p>
          </div>
          <EnabledToggle on={sectionOn} onChange={(v) => onChange('enrol_enabled', v)} accent={accent} />
        </div>
      </CmsPanel>

      <CmsPanel title="Section copy" icon="fa-heading">
        <CmsField label="Section label" hint="Small uppercase label above the heading.">
          <input
            className="input-field"
            value={sections.enrol_label || ''}
            onChange={(e) => onChange('enrol_label', e.target.value)}
            placeholder="HOW TO ENROL"
          />
        </CmsField>
        <CmsField label="Main heading">
          <input
            className="input-field"
            value={sections.enrol_heading || ''}
            onChange={(e) => onChange('enrol_heading', e.target.value)}
          />
        </CmsField>
        <CmsField
          label="Accent phrase"
          hint="This phrase is coloured in the heading when it appears in the text."
        >
          <input
            className="input-field"
            value={sections.enrol_highlight || ''}
            onChange={(e) => onChange('enrol_highlight', e.target.value)}
            placeholder="Enrollment Made Simple:"
          />
        </CmsField>
        <CmsField label="Supporting description">
          <textarea
            className="input-field min-h-[72px]"
            value={sections.enrol_intro || ''}
            onChange={(e) => onChange('enrol_intro', e.target.value)}
          />
        </CmsField>
      </CmsPanel>

      <CmsPanel title="Enrollment steps" icon="fa-hexagon">
        <p className="text-xs text-slate-500 -mt-1">
          Clickable hexagons on the live page. Linear steps sit on the horizontal path; steps marked
          “circular loop” sit inside the ongoing-care circle. Reorder with the arrows. Disabled steps
          stay in CMS but are hidden on the page.
        </p>
        <div className="space-y-5">
          {items.map((item, i) => {
            const on = isFlagOn(item.enabled ?? '1');
            const inLoop = isFlagOn(item.in_loop);
            const isDefault = defaultId && defaultId === String(item.id || '');
            return (
              <div key={item.id || `enrol-${i}`} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Step {i + 1}
                    {item.label ? ` · ${item.label}` : ''}
                    {inLoop ? ' · loop' : ''}
                    {isDefault ? ' · default' : ''}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <EnabledToggle on={on} onChange={(v) => updateItem(i, { enabled: v })} accent={accent} />
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                      disabled={i === 0}
                      onClick={() => onChange('enrol_steps', moveItem(items, i, -1))}
                      aria-label="Move step up"
                    >
                      <FaIcon icon="fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 text-slate-400 hover:text-slate-700 rounded-md ${accentBtn}`}
                      disabled={i === items.length - 1}
                      onClick={() => onChange('enrol_steps', moveItem(items, i, 1))}
                      aria-label="Move step down"
                    >
                      <FaIcon icon="fa-arrow-down" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-md"
                      onClick={() => {
                        const next = items
                          .filter((_, j) => j !== i)
                          .map((row, idx) => ({ ...row, sort_order: idx + 1 }));
                        onChange('enrol_steps', next);
                        if (isDefault) onChange('enrol_default_step', next[0]?.id || '');
                      }}
                      aria-label="Delete step"
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Hexagon label" hint="Short text inside the hexagon.">
                    <input
                      className="input-field"
                      value={item.label || ''}
                      onChange={(e) => updateItem(i, { label: e.target.value })}
                      placeholder="Live Rehab Consultation"
                    />
                  </CmsField>
                  <CmsField label="Fallback illustration">
                    <select
                      className="input-field"
                      value={item.visual || 'consult'}
                      onChange={(e) => updateItem(i, { visual: e.target.value })}
                    >
                      {ENROL_VISUALS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </CmsField>
                </div>

                <CmsField label="Content title">
                  <input
                    className="input-field"
                    value={item.title || ''}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    placeholder="Weekly Check-In : Strategy Meets Support"
                  />
                </CmsField>
                <CmsField label="Description">
                  <textarea
                    className="input-field min-h-[80px]"
                    value={item.description || ''}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                </CmsField>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={inLoop}
                      onChange={(e) => updateItem(i, { in_loop: e.target.checked ? '1' : '0' })}
                    />
                    Place in circular loop
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="enrol-default-step"
                      checked={isDefault}
                      onChange={() => onChange('enrol_default_step', item.id || '')}
                    />
                    Default active step
                  </label>
                </div>

                <MediaUrlOrUpload
                  label="Step illustration"
                  hint="Shown in the content area when this step is selected. Leave empty to use the fallback illustration."
                  recommendedSize="PNG, JPG or WebP · square or landscape cutout"
                  previewFit="contain"
                  previewClass="max-h-64 max-w-[240px] w-full min-h-[9rem] bg-slate-50"
                  accent={mediaAccent}
                  icon="fa-image"
                  urlValue={item.image || ''}
                  onUrlChange={(v) => updateItem(i, { image: v })}
                  onUpload={uploadFn}
                  accept="image/png,image/jpeg,image/webp"
                  maxMb={4}
                  preview="image"
                />
                <CmsField label="Image alt text" hint="Used by screen readers. If empty, the step title is used.">
                  <input
                    className="input-field"
                    value={item.image_alt || ''}
                    onChange={(e) => updateItem(i, { image_alt: e.target.value })}
                    placeholder="Describe the visual for screen readers"
                  />
                </CmsField>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn-outline text-xs !py-2 mt-3"
          onClick={() => onChange('enrol_steps', [...items, blankEnrolStep(items.length)])}
        >
          <FaIcon icon="fa-plus" /> Add step
        </button>
      </CmsPanel>
    </div>
  );
}
