import FaIcon from '../FaIcon';
import MediaUrlOrUpload from './MediaUrlOrUpload';
import { CmsField, CmsPanel } from './CmsFormKit';
import { isFlagOn } from '../../constants/communityPreview';
import { blankPainArea } from '../../constants/painMapDefaults';

function moveItem(list, index, dir) {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return list;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

export default function PainMapEditor({
  sections,
  onChange,
  uploadFn,
  accent = 'orange',
  scopeNote,
}) {
  const areas = Array.isArray(sections.pain_areas) ? sections.pain_areas : [];
  const sectionOn = isFlagOn(sections.pain_section_enabled ?? '1');
  const accentBtn = accent === 'teal' ? 'hover:border-teal-300' : 'hover:border-primary-300';
  const mediaAccent = accent === 'teal' ? 'emerald' : 'orange';

  const updateArea = (i, patch) => {
    const next = areas.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
    onChange('pain_areas', next);
  };

  const handleChipChange = (i, chipLabel) => {
    const row = areas[i] || {};
    const autoSlug = !row.slug || row.slug === slugify(row.chip_label);
    updateArea(i, {
      chip_label: chipLabel,
      slug: autoSlug ? slugify(chipLabel) : row.slug,
      label: !row.label || row.label === row.chip_label ? chipLabel : row.label,
    });
  };

  return (
    <div className="space-y-5">
      {scopeNote ? (
        <p className="text-xs text-slate-500 -mb-1">
          {scopeNote}
        </p>
      ) : null}
      <CmsPanel title="Section visibility" icon="fa-eye">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Show body-area map</p>
            <p className="text-xs text-slate-500 mt-0.5">
              When off, this interactive section is hidden on the live page.
            </p>
          </div>
          <EnabledToggle
            on={sectionOn}
            onChange={(v) => onChange('pain_section_enabled', v)}
            accent={accent}
          />
        </div>
      </CmsPanel>

      <CmsPanel title="Section copy" icon="fa-heading">
        <CmsField label="Eyebrow / label" hint="Small uppercase label above the heading.">
          <input
            className="input-field"
            value={sections.pain_eyebrow || ''}
            onChange={(e) => onChange('pain_eyebrow', e.target.value)}
          />
        </CmsField>
        <div className="grid sm:grid-cols-2 gap-3">
          <CmsField label="Heading line 1">
            <input
              className="input-field"
              value={sections.pain_line1 || ''}
              onChange={(e) => onChange('pain_line1', e.target.value)}
              placeholder="Healing / Recover"
            />
          </CmsField>
          <CmsField label="Line 1 highlighted text" hint="Accent-coloured phrase.">
            <input
              className="input-field"
              value={sections.pain_accent1 || ''}
              onChange={(e) => onChange('pain_accent1', e.target.value)}
              placeholder="Comes Home."
            />
          </CmsField>
          <CmsField label="Heading line 2">
            <input
              className="input-field"
              value={sections.pain_line2 || ''}
              onChange={(e) => onChange('pain_line2', e.target.value)}
              placeholder="Mobility / Train"
            />
          </CmsField>
          <CmsField label="Line 2 highlighted text">
            <input
              className="input-field"
              value={sections.pain_accent2 || ''}
              onChange={(e) => onChange('pain_accent2', e.target.value)}
              placeholder="Without the Commute."
            />
          </CmsField>
        </div>
        <CmsField label="Description" hint="Desktop supporting copy beside the figure.">
          <textarea
            className="input-field min-h-[88px]"
            value={sections.pain_description || ''}
            onChange={(e) => onChange('pain_description', e.target.value)}
          />
        </CmsField>
        <CmsField label="Mobile description" hint="Shorter copy shown on small screens.">
          <textarea
            className="input-field min-h-[64px]"
            value={sections.pain_mobile_description || ''}
            onChange={(e) => onChange('pain_mobile_description', e.target.value)}
          />
        </CmsField>
        <CmsField label="Other areas list heading">
          <input
            className="input-field"
            value={sections.pain_other_label || ''}
            onChange={(e) => onChange('pain_other_label', e.target.value)}
            placeholder="Other body areas"
          />
        </CmsField>
      </CmsPanel>

      <CmsPanel title="Figure image" icon="fa-person-running">
        <MediaUrlOrUpload
          label="Body map illustration"
          hint="Leave empty to use the default anatomical figure. Square images keep hotspot positions aligned."
          recommendedSize="1000 × 1000 px"
          aspectRatio="1:1"
          accent={mediaAccent}
          icon="fa-image"
          urlValue={sections.pain_image || ''}
          onUrlChange={(v) => onChange('pain_image', v)}
          onUpload={uploadFn}
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          maxMb={4}
          preview="image"
        />
      </CmsPanel>

      <CmsPanel title="Buttons" icon="fa-link">
        <div className="grid sm:grid-cols-2 gap-3">
          <CmsField label="Know more button label">
            <input
              className="input-field"
              value={sections.pain_know_more_label || ''}
              onChange={(e) => onChange('pain_know_more_label', e.target.value)}
            />
          </CmsField>
          <CmsField label="Know more default link" hint="Used when a body area has no specific link.">
            <input
              className="input-field"
              value={sections.pain_know_more_link || ''}
              onChange={(e) => onChange('pain_know_more_link', e.target.value)}
              placeholder="/treatments"
            />
          </CmsField>
          <CmsField label="Book button label">
            <input
              className="input-field"
              value={sections.pain_book_label || ''}
              onChange={(e) => onChange('pain_book_label', e.target.value)}
            />
          </CmsField>
          <CmsField
            label="Book button link override"
            hint="Optional. Leave empty to use this page’s booking flow with the selected body area."
          >
            <input
              className="input-field"
              value={sections.pain_book_link || ''}
              onChange={(e) => onChange('pain_book_link', e.target.value)}
              placeholder="/book?type=home_visit"
            />
          </CmsField>
        </div>
        <CmsField label="Close (X) link">
          <input
            className="input-field"
            value={sections.pain_close_link || ''}
            onChange={(e) => onChange('pain_close_link', e.target.value)}
            placeholder="/treatments"
          />
        </CmsField>
      </CmsPanel>

      <CmsPanel title="Body areas" icon="fa-list">
        <p className="text-xs text-slate-500 -mt-1">
          Reorder with the arrows. Disabled areas stay in CMS but are hidden on the live page. Hotspot left/top are
          percentages on the figure (same coordinate system as the homepage map).
        </p>
        <div className="space-y-4">
          {areas.map((item, i) => {
            const on = isFlagOn(item.is_active ?? '1');
            return (
              <div key={`pain-area-${item.slug || i}`} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {item.chip_label || `Area ${i + 1}`}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <EnabledToggle on={on} onChange={(v) => updateArea(i, { is_active: v })} accent={accent} />
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                      disabled={i === 0}
                      onClick={() => onChange('pain_areas', moveItem(areas, i, -1))}
                      aria-label="Move up"
                    >
                      <FaIcon icon="fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 text-slate-400 hover:text-slate-700 rounded-md ${accentBtn}`}
                      disabled={i === areas.length - 1}
                      onClick={() => onChange('pain_areas', moveItem(areas, i, 1))}
                      aria-label="Move down"
                    >
                      <FaIcon icon="fa-arrow-down" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-md"
                      onClick={() => onChange('pain_areas', areas.filter((_, j) => j !== i))}
                      aria-label="Delete body area"
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Name (chip / list)">
                    <input
                      className="input-field"
                      value={item.chip_label || ''}
                      onChange={(e) => handleChipChange(i, e.target.value)}
                      placeholder="Neck"
                    />
                  </CmsField>
                  <CmsField label="Full label">
                    <input
                      className="input-field"
                      value={item.label || ''}
                      onChange={(e) => updateArea(i, { label: e.target.value })}
                      placeholder="Neck Pain at Home"
                    />
                  </CmsField>
                </div>
                <CmsField label="Slug" hint="Unique id used internally. Auto-fills from the name.">
                  <input
                    className="input-field font-mono text-sm"
                    value={item.slug || ''}
                    onChange={(e) => updateArea(i, { slug: slugify(e.target.value) || e.target.value })}
                    placeholder="neck"
                  />
                </CmsField>
                <CmsField label="Short headline">
                  <input
                    className="input-field"
                    value={item.headline || ''}
                    onChange={(e) => updateArea(i, { headline: e.target.value })}
                  />
                </CmsField>
                <CmsField label="Treatment / detail copy" hint="Shown in the info card when this area is selected.">
                  <textarea
                    className="input-field min-h-[88px]"
                    value={item.accordion_description || ''}
                    onChange={(e) => updateArea(i, { accordion_description: e.target.value })}
                  />
                </CmsField>
                <div className="grid sm:grid-cols-3 gap-3">
                  <CmsField label="Hotspot left %">
                    <input
                      className="input-field"
                      value={item.highlight_left || ''}
                      onChange={(e) => updateArea(i, { highlight_left: e.target.value })}
                      placeholder="52%"
                    />
                  </CmsField>
                  <CmsField label="Hotspot top %">
                    <input
                      className="input-field"
                      value={item.highlight_top || ''}
                      onChange={(e) => updateArea(i, { highlight_top: e.target.value })}
                      placeholder="27%"
                    />
                  </CmsField>
                  <CmsField label="Icon (Font Awesome)">
                    <input
                      className="input-field font-mono text-sm"
                      value={item.icon || ''}
                      onChange={(e) => updateArea(i, { icon: e.target.value })}
                      placeholder="fa-bone"
                    />
                  </CmsField>
                </div>
                <CmsField label="Know more link for this area" hint="Optional. Overrides the section default.">
                  <input
                    className="input-field"
                    value={item.know_more_link || ''}
                    onChange={(e) => updateArea(i, { know_more_link: e.target.value })}
                    placeholder="/treatments/neck-pain"
                  />
                </CmsField>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn-outline text-xs !py-2"
          onClick={() => onChange('pain_areas', [...areas, blankPainArea()])}
        >
          <FaIcon icon="fa-plus" /> Add body area
        </button>
      </CmsPanel>
    </div>
  );
}
