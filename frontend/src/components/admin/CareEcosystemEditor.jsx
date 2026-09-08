import FaIcon from '../FaIcon';
import MediaUrlOrUpload from './MediaUrlOrUpload';
import { CmsField, CmsPanel } from './CmsFormKit';
import { isFlagOn } from '../../constants/communityPreview';
import { blankEcosystemItem } from '../../constants/careEcosystemDefaults';

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

export default function CareEcosystemEditor({
  sections,
  onChange,
  uploadFn,
  accent = 'orange',
  scopeNote,
}) {
  const items = Array.isArray(sections.ecosystem_items) ? sections.ecosystem_items : [];
  const sectionOn = isFlagOn(sections.ecosystem_enabled ?? '1');
  const accentBtn = accent === 'teal' ? 'hover:border-teal-300' : 'hover:border-primary-300';
  const mediaAccent = accent === 'teal' ? 'emerald' : 'orange';

  const updateItem = (i, patch) => {
    onChange(
      'ecosystem_items',
      items.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    );
  };

  return (
    <div className="space-y-5">
      {scopeNote ? <p className="text-xs text-slate-500 -mb-1">{scopeNote}</p> : null}

      <CmsPanel title="Section visibility" icon="fa-eye">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Show care ecosystem</p>
            <p className="text-xs text-slate-500 mt-0.5">
              When off, this scroll-driven feature showcase is hidden on the live page.
            </p>
          </div>
          <EnabledToggle
            on={sectionOn}
            onChange={(v) => onChange('ecosystem_enabled', v)}
            accent={accent}
          />
        </div>
      </CmsPanel>

      <CmsPanel title="Section copy" icon="fa-heading">
        <CmsField label="Section label" hint="Small uppercase label above the heading.">
          <input
            className="input-field"
            value={sections.ecosystem_label || ''}
            onChange={(e) => onChange('ecosystem_label', e.target.value)}
            placeholder="The program"
          />
        </CmsField>
        <CmsField label="Main heading">
          <input
            className="input-field"
            value={sections.ecosystem_heading || ''}
            onChange={(e) => onChange('ecosystem_heading', e.target.value)}
          />
        </CmsField>
        <CmsField label="Accent word" hint="This phrase is coloured in the heading when it appears in the text.">
          <input
            className="input-field"
            value={sections.ecosystem_highlight || ''}
            onChange={(e) => onChange('ecosystem_highlight', e.target.value)}
            placeholder="Care Ecosystem"
          />
        </CmsField>
        <CmsField label="Supporting description">
          <textarea
            className="input-field min-h-[88px]"
            value={sections.ecosystem_intro || ''}
            onChange={(e) => onChange('ecosystem_intro', e.target.value)}
          />
        </CmsField>
      </CmsPanel>

      <CmsPanel title="Care ecosystem items" icon="fa-layer-group">
        <p className="text-xs text-slate-500 -mt-1">
          Each item has its own visual. Reorder with the arrows — the live page follows this list order. Disabled items
          stay in CMS but are hidden on the page.
        </p>
        <div className="space-y-5">
          {items.map((item, i) => {
            const on = isFlagOn(item.enabled ?? '1');
            return (
              <div key={item.id || `eco-${i}`} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {item.number || `Item ${i + 1}`}
                    {item.title ? ` · ${item.title}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <EnabledToggle on={on} onChange={(v) => updateItem(i, { enabled: v })} accent={accent} />
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                      disabled={i === 0}
                      onClick={() => onChange('ecosystem_items', moveItem(items, i, -1))}
                      aria-label="Move item up"
                    >
                      <FaIcon icon="fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 text-slate-400 hover:text-slate-700 rounded-md ${accentBtn}`}
                      disabled={i === items.length - 1}
                      onClick={() => onChange('ecosystem_items', moveItem(items, i, 1))}
                      aria-label="Move item down"
                    >
                      <FaIcon icon="fa-arrow-down" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-md"
                      onClick={() =>
                        onChange(
                          'ecosystem_items',
                          items.filter((_, j) => j !== i).map((row, idx) => ({ ...row, sort_order: idx + 1 }))
                        )
                      }
                      aria-label="Delete item"
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Feature number">
                    <input
                      className="input-field"
                      value={item.number || ''}
                      onChange={(e) => updateItem(i, { number: e.target.value })}
                      placeholder="01"
                    />
                  </CmsField>
                  <CmsField label="Icon (Font Awesome, optional)">
                    <input
                      className="input-field font-mono text-sm"
                      value={item.icon || ''}
                      onChange={(e) => updateItem(i, { icon: e.target.value })}
                      placeholder="fa-clipboard-list"
                    />
                  </CmsField>
                </div>
                <CmsField label="Feature title">
                  <input
                    className="input-field"
                    value={item.title || ''}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                  />
                </CmsField>
                <CmsField label="Short description">
                  <textarea
                    className="input-field min-h-[80px]"
                    value={item.description || ''}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                </CmsField>
                <MediaUrlOrUpload
                  label="Feature image"
                  hint="Displayed on the right (desktop) or above the feature list (mobile). Use object-fit contain — PNG cutouts and screenshots both work. Leave empty for a branded placeholder."
                  recommendedSize="PNG, JPG or WebP · landscape or product screenshot"
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
                <CmsField label="Image alt text" hint="Used by screen readers. If empty, the feature title is used.">
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
          onClick={() => onChange('ecosystem_items', [...items, blankEcosystemItem(items.length)])}
        >
          <FaIcon icon="fa-plus" /> Add item
        </button>
      </CmsPanel>
    </div>
  );
}
