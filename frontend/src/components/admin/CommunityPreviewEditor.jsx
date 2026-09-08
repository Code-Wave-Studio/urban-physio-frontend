import FaIcon from '../FaIcon';
import MediaUrlOrUpload from './MediaUrlOrUpload';
import { CmsField, CmsPanel } from './CmsFormKit';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  COMMUNITY_PLATFORMS,
  SCREENSHOT_SLOTS,
  blankScreenshot,
  blankSocial,
  isFlagOn,
  platformMeta,
  screenshotSlotMeta,
} from '../../constants/communityPreview';

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

export default function CommunityPreviewEditor({ sections, onChange, uploadFn, accent = 'orange' }) {
  const socials = Array.isArray(sections.community_socials) ? sections.community_socials : [];
  const shots = Array.isArray(sections.community_screenshots) ? sections.community_screenshots : [];
  const accentBtn = accent === 'teal' ? 'hover:border-teal-300' : 'hover:border-primary-300';

  const updateSocial = (i, patch) => {
    const next = socials.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
    onChange('community_socials', next);
  };
  const updateShot = (i, patch) => {
    const next = shots.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
    onChange('community_screenshots', next);
  };

  return (
    <div className="space-y-5">
      <CmsPanel title="Section copy" icon="fa-heading">
        <div className="grid sm:grid-cols-2 gap-3">
          <CmsField label="Heading">
            <input
              className="input-field"
              value={sections.community_heading || ''}
              onChange={(e) => onChange('community_heading', e.target.value)}
            />
          </CmsField>
          <CmsField label="Accent word" hint="This word is coloured in the heading.">
            <input
              className="input-field"
              value={sections.community_highlight || ''}
              onChange={(e) => onChange('community_highlight', e.target.value)}
            />
          </CmsField>
        </div>
        <CmsField label="Supporting description">
          <textarea
            className="input-field min-h-[80px]"
            value={sections.community_intro || ''}
            onChange={(e) => onChange('community_intro', e.target.value)}
          />
        </CmsField>
      </CmsPanel>

      <CmsPanel title="Social media links" icon="fa-share-nodes">
        <p className="text-xs text-slate-500 -mt-1">
          Only enabled links with a URL appear on the live page. Add Instagram, Facebook, LinkedIn, YouTube, or any other platform.
        </p>
        <div className="space-y-3">
          {socials.map((item, i) => {
            const meta = platformMeta(item.platform);
            const on = isFlagOn(item.enabled);
            return (
              <div key={`social-${i}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-2">
                    <FaIcon icon={meta.icon} brand={meta.brand} className="text-slate-500" />
                    Link {i + 1}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <EnabledToggle on={on} onChange={(v) => updateSocial(i, { enabled: v })} accent={accent} />
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                      disabled={i === 0}
                      onClick={() => onChange('community_socials', moveItem(socials, i, -1))}
                      aria-label="Move up"
                    >
                      <FaIcon icon="fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 text-slate-400 hover:text-slate-700 rounded-md ${accentBtn}`}
                      disabled={i === socials.length - 1}
                      onClick={() => onChange('community_socials', moveItem(socials, i, 1))}
                      aria-label="Move down"
                    >
                      <FaIcon icon="fa-arrow-down" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-md"
                      onClick={() => onChange('community_socials', socials.filter((_, j) => j !== i))}
                      aria-label="Delete social link"
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Platform">
                    <select
                      className="input-field"
                      value={item.platform || 'other'}
                      onChange={(e) => {
                        const next = e.target.value;
                        const plat = platformMeta(next);
                        updateSocial(i, {
                          platform: next,
                          label: item.label?.startsWith('Join') || !item.label ? `Join us on ${plat.label}` : item.label,
                        });
                      }}
                    >
                      {COMMUNITY_PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </CmsField>
                  <CmsField label="Button label">
                    <input
                      className="input-field"
                      value={item.label || ''}
                      onChange={(e) => updateSocial(i, { label: e.target.value })}
                      placeholder="Join us on Instagram"
                    />
                  </CmsField>
                </div>
                <CmsField label="URL">
                  <input
                    type="url"
                    className="input-field"
                    value={item.url || ''}
                    onChange={(e) => updateSocial(i, { url: e.target.value })}
                    placeholder="https://"
                  />
                </CmsField>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn-outline text-xs !py-2"
          onClick={() => onChange('community_socials', [...socials, blankSocial()])}
        >
          <FaIcon icon="fa-plus" /> Add social link
        </button>
      </CmsPanel>

      <CmsPanel title="Portal screenshots" icon="fa-mobile-screen">
        <p className="text-xs text-slate-500 -mt-1">
          Upload full mobile portal screenshots. The first 5 enabled images fill the live gallery from Far Left to Far Right. Extra enabled images stay available in the lightbox. Reorder with the arrows.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {SCREENSHOT_SLOTS.map((slot) => (
            <span
              key={slot.key}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                slot.key === 'center'
                  ? accent === 'teal'
                    ? 'border-teal-200 bg-teal-50 text-teal-800'
                    : 'border-orange-200 bg-orange-50 text-orange-800'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {slot.label}
            </span>
          ))}
        </div>
        <div className="space-y-4">
          {shots.map((item, i) => {
            const on = isFlagOn(item.enabled);
            const slot = screenshotSlotMeta(shots, i);
            const thumb = resolveMediaUrl(item.url) || item.url;
            const isCenter = slot.key === 'center';
            return (
              <div key={`shot-${i}`} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-[4.4rem] rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <FaIcon icon="fa-image" className="text-slate-300 text-sm" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                          isCenter ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {slot.short}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{slot.hint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <EnabledToggle on={on} onChange={(v) => updateShot(i, { enabled: v })} accent={accent} />
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                      disabled={i === 0}
                      onClick={() => onChange('community_screenshots', moveItem(shots, i, -1))}
                      aria-label="Move screenshot up"
                    >
                      <FaIcon icon="fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 text-slate-400 hover:text-slate-700 rounded-md ${accentBtn}`}
                      disabled={i === shots.length - 1}
                      onClick={() => onChange('community_screenshots', moveItem(shots, i, 1))}
                      aria-label="Move screenshot down"
                    >
                      <FaIcon icon="fa-arrow-down" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-md"
                      onClick={() => onChange('community_screenshots', shots.filter((_, j) => j !== i))}
                      aria-label="Delete screenshot"
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                </div>
                <MediaUrlOrUpload
                  label="Portal screenshot"
                  hint="Upload the complete mobile screenshot. It is shown in full — nothing is cropped."
                  recommendedSize="1080 × 2340 px"
                  aspectRatio="9:19.5"
                  previewFit="contain"
                  accent={accent === 'teal' ? 'emerald' : 'orange'}
                  icon="fa-mobile-screen"
                  urlValue={item.url || ''}
                  onUrlChange={(v) => updateShot(i, { url: v })}
                  onUpload={uploadFn}
                  accept="image/jpeg,image/png,image/webp"
                  maxMb={4}
                  preview="image"
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Title / label">
                    <input
                      className="input-field"
                      value={item.title || ''}
                      onChange={(e) => updateShot(i, { title: e.target.value })}
                      placeholder="Dashboard"
                    />
                  </CmsField>
                  <CmsField label="Alt text">
                    <input
                      className="input-field"
                      value={item.alt || ''}
                      onChange={(e) => updateShot(i, { alt: e.target.value })}
                      placeholder="PhysioAtHome admin dashboard"
                    />
                  </CmsField>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn-outline text-xs !py-2"
          onClick={() => onChange('community_screenshots', [...shots, blankScreenshot()])}
        >
          <FaIcon icon="fa-plus" /> Add screenshot
        </button>
      </CmsPanel>
    </div>
  );
}
