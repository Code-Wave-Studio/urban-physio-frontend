import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { CmsField, CmsListEditor, CmsPanel } from '../../components/admin/CmsFormKit';
import CommunityPreviewEditor from '../../components/admin/CommunityPreviewEditor';
import PainMapEditor from '../../components/admin/PainMapEditor';
import RecoveryRoadmapEditor from '../../components/admin/RecoveryRoadmapEditor';
import CareEcosystemEditor from '../../components/admin/CareEcosystemEditor';
import EnrollmentEditor from '../../components/admin/EnrollmentEditor';
import SectionVisibilityToggle from '../../components/admin/SectionVisibilityToggle';
import { admin, uploadCmsImage } from '../../services/api';
import { HOME_PHYSIO_DEFAULTS, mergeHomePhysioSections } from '../../constants/homePhysioDefaults';
import { isSectionOn } from '../../constants/sectionVisibility';
import {
  applyPricingSessionsToTiers,
  pricingSessionsFromTiers,
  syncTierPriceLabels,
} from '../../constants/homePhysioTiers';
import toast from 'react-hot-toast';

function HeroButtonSwitch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(on ? '0' : '1')}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        on ? 'bg-primary-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const TABS = [
  { id: 'hero', label: 'Hero & trust', icon: 'fa-flag' },
  { id: 'story', label: 'Story', icon: 'fa-book-open' },
  { id: 'pain', label: 'Body areas', icon: 'fa-person-running' },
  { id: 'roadmap', label: 'Recovery journey', icon: 'fa-route' },
  { id: 'ecosystem', label: 'Care ecosystem', icon: 'fa-layer-group' },
  { id: 'enrol', label: 'How to enrol', icon: 'fa-hexagon' },
  { id: 'book', label: 'Tiers & booking', icon: 'fa-user-doctor' },
  { id: 'price', label: 'Pricing & areas', icon: 'fa-tag' },
  { id: 'voice', label: 'Reviews & FAQ', icon: 'fa-comments' },
  { id: 'community', label: 'Social & portal', icon: 'fa-share-nodes' },
  { id: 'seo', label: 'SEO', icon: 'fa-magnifying-glass-chart' },
];

export default function AdminHomePhysio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('hero');
  const [form, setForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    seo_title: '',
    seo_description: '',
    sections: { ...HOME_PHYSIO_DEFAULTS.sections },
  });

  useEffect(() => {
    admin
      .homePhysioSettings()
      .then((res) => {
        const d = res.data ?? res;
        setForm({
          hero_title: d.hero_title || '',
          hero_subtitle: d.hero_subtitle || '',
          hero_image: d.hero_image || '',
          seo_title: d.seo_title || '',
          seo_description: d.seo_description || '',
          sections: mergeHomePhysioSections(d.sections || {}),
        });
      })
      .catch((e) => toast.error(e.message || 'Could not load Home Physiotherapy page'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSection = (k, v) => setForm((f) => ({ ...f, sections: { ...f.sections, [k]: v } }));
  const setTiers = (tiers) =>
    setForm((f) => {
      const next = syncTierPriceLabels(f.sections.tiers, tiers);
      return {
        ...f,
        sections: {
          ...f.sections,
          tiers: next,
          pricing_sessions: pricingSessionsFromTiers(next),
        },
      };
    });
  const setPricingSessions = (sessions) =>
    setForm((f) => {
      const tiers = applyPricingSessionsToTiers(f.sections.tiers, sessions);
      return {
        ...f,
        sections: {
          ...f.sections,
          tiers,
          pricing_sessions: pricingSessionsFromTiers(tiers),
        },
      };
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await admin.updateHomePhysioSettings(form);
      const d = saved?.data && typeof saved.data === 'object' ? saved.data : null;
      if (d?.sections) {
        setForm({
          hero_title: d.hero_title ?? '',
          hero_subtitle: d.hero_subtitle ?? '',
          hero_image: d.hero_image ?? '',
          seo_title: d.seo_title ?? '',
          seo_description: d.seo_description ?? '',
          sections: mergeHomePhysioSections(d.sections),
        });
      }
      toast.success('Home Physiotherapy page published');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="glass-card p-12 text-center text-slate-500">
          <FaIcon icon="fa-spinner" className="fa-spin text-2xl mb-2" />
          Loading Home Physiotherapy page…
        </div>
      </AdminDashboardLayout>
    );
  }

  const s = form.sections;

  return (
    <AdminDashboardLayout>
      <div className="rounded-3xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-white to-primary-50/80 p-5 sm:p-7 mb-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">Website CMS</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Home Physiotherapy</h1>
            <p className="text-sm text-slate-600 mt-1">
              Content only — layout stays the same.{' '}
              <Link to="/home-physiotherapy" target="_blank" className="text-primary-700 font-semibold hover:underline">
                /home-physiotherapy
              </Link>
            </p>
          </div>
          <Link to="/home-physiotherapy" target="_blank" className="btn-outline text-sm shrink-0 inline-flex items-center gap-2">
            <FaIcon icon="fa-arrow-up-right-from-square" />
            Preview live page
          </Link>
        </div>
        <Link
          to="/admin/physiotherapists"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-800 bg-white/80 border border-orange-200 rounded-xl px-3 py-2 hover:bg-orange-50"
        >
          <FaIcon icon="fa-user-doctor" />
          Manage Our Physiotherapists (shared with TelePhysio)
        </Link>
      </div>

      <form onSubmit={save} className="max-w-5xl">
        <div
          className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1"
          role="tablist"
          aria-label="Page content sections"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  active
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-200'
                }`}
              >
                <FaIcon icon={t.icon} className="text-xs" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'hero' && (
          <div className="space-y-5" role="tabpanel">
            <SectionVisibilityToggle
              label="Show hero & trust"
              description="When off, the hero and trust bar are hidden on the live page."
              on={isSectionOn(s, 'hero_enabled')}
              onChange={(v) => setSection('hero_enabled', v)}
            />
            <CmsPanel title="Hero" icon="fa-flag">
              <CmsField label="Headline">
                <textarea className="input-field min-h-[72px]" value={form.hero_title} onChange={(e) => set('hero_title', e.target.value)} />
              </CmsField>
              <CmsField label="Subheadline">
                <textarea className="input-field min-h-[100px]" value={form.hero_subtitle} onChange={(e) => set('hero_subtitle', e.target.value)} />
              </CmsField>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Book via WhatsApp</p>
                    <p className="text-xs text-slate-500 mt-0.5">Primary hero button. Hidden when this is off.</p>
                  </div>
                  <HeroButtonSwitch
                    label="Show Book via WhatsApp"
                    on={isSectionOn(s, 'hero_cta_enabled')}
                    onChange={(v) => setSection('hero_cta_enabled', v)}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Label">
                    <input className="input-field" value={s.hero_cta_label || ''} onChange={(e) => setSection('hero_cta_label', e.target.value)} />
                  </CmsField>
                  <CmsField label="Link">
                    <input className="input-field" value={s.hero_cta_link || ''} onChange={(e) => setSection('hero_cta_link', e.target.value)} />
                  </CmsField>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Call Now</p>
                    <p className="text-xs text-slate-500 mt-0.5">Shown beside Book via WhatsApp. Opens the phone number with tel:.</p>
                  </div>
                  <HeroButtonSwitch
                    label="Show Call Now"
                    on={isSectionOn(s, 'hero_call_enabled')}
                    onChange={(v) => setSection('hero_call_enabled', v)}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <CmsField label="Label">
                    <input className="input-field" value={s.hero_call_label || ''} onChange={(e) => setSection('hero_call_label', e.target.value)} />
                  </CmsField>
                  <CmsField label="Phone number" hint="Leave blank to use the site contact phone. Saved and opened as tel:.">
                    <input
                      className="input-field"
                      inputMode="tel"
                      placeholder="+91 98765 43210"
                      value={s.hero_call_link || ''}
                      onChange={(e) => setSection('hero_call_link', e.target.value)}
                    />
                  </CmsField>
                </div>
              </div>
              <MediaUrlOrUpload
                label="Hero image"
                hint="Displayed in the hero banner beside the headline. A 4:3 high-resolution landscape photo is recommended for desktop & mobile."
                recommendedSize="1200 × 900 px (4:3 ratio)"
                aspectRatio="4/3"
                devicePreview="4:3"
                accent="orange"
                icon="fa-image"
                urlValue={form.hero_image}
                onUrlChange={(v) => set('hero_image', v)}
                onUpload={uploadCmsImage}
                accept="image/jpeg,image/png,image/webp"
                maxMb={4}
                preview="image"
              />
              <CmsField label="Trust signals" hint="One line per tick shown under the hero.">
                <textarea
                  className="input-field min-h-[90px]"
                  value={(s.trust_signals || []).join('\n')}
                  onChange={(e) => setSection('trust_signals', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
                />
              </CmsField>
            </CmsPanel>
            <CmsPanel title="Trust bar" icon="fa-shield-halved">
              <CmsListEditor
                items={s.trust_bar}
                onChange={(v) => setSection('trust_bar', v)}
                addLabel="Add trust item"
                fields={[
                  { key: 'icon', label: 'Icon (e.g. fa-user-doctor)' },
                  { key: 'label', label: 'Label' },
                ]}
              />
            </CmsPanel>
          </div>
        )}

        {tab === 'story' && (
          <div className="space-y-5" role="tabpanel">
            <SectionVisibilityToggle
              label="Show story"
              description="When off, the format, outcomes, and difference sections are hidden on the live page."
              on={isSectionOn(s, 'story_enabled')}
              onChange={(v) => setSection('story_enabled', v)}
            />
            <CmsPanel title="Is home physio right for you?" icon="fa-scale-balanced">
              <CmsField label="Heading">
                <input className="input-field" value={s.fit_heading} onChange={(e) => setSection('fit_heading', e.target.value)} />
              </CmsField>
              <CmsField label="Intro">
                <textarea className="input-field min-h-[72px]" value={s.fit_intro} onChange={(e) => setSection('fit_intro', e.target.value)} />
              </CmsField>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <CmsField label="Home column title">
                    <input className="input-field" value={s.fit_home_title} onChange={(e) => setSection('fit_home_title', e.target.value)} />
                  </CmsField>
                  <CmsField label="Home bullets" hint="One per line">
                    <textarea
                      className="input-field min-h-[120px]"
                      value={(s.fit_home_items || []).join('\n')}
                      onChange={(e) => setSection('fit_home_items', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
                    />
                  </CmsField>
                </div>
                <div className="space-y-2">
                  <CmsField label="Clinic column title">
                    <input className="input-field" value={s.fit_clinic_title} onChange={(e) => setSection('fit_clinic_title', e.target.value)} />
                  </CmsField>
                  <CmsField label="Clinic bullets" hint="One per line">
                    <textarea
                      className="input-field min-h-[120px]"
                      value={(s.fit_clinic_items || []).join('\n')}
                      onChange={(e) => setSection('fit_clinic_items', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
                    />
                  </CmsField>
                </div>
              </div>
              <CmsField label="Reassurance">
                <textarea className="input-field min-h-[72px]" value={s.fit_reassurance} onChange={(e) => setSection('fit_reassurance', e.target.value)} />
              </CmsField>
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="Toggle label">
                  <input className="input-field" value={s.fit_toggle} onChange={(e) => setSection('fit_toggle', e.target.value)} />
                </CmsField>
                <CmsField label="CTA label">
                  <input className="input-field" value={s.fit_cta_label} onChange={(e) => setSection('fit_cta_label', e.target.value)} />
                </CmsField>
              </div>
            </CmsPanel>
            <CmsPanel title="Why it works" icon="fa-heart-pulse">
              <CmsField label="Heading">
                <input className="input-field" value={s.why_heading} onChange={(e) => setSection('why_heading', e.target.value)} />
              </CmsField>
              <CmsField label="Intro">
                <textarea className="input-field min-h-[72px]" value={s.why_intro} onChange={(e) => setSection('why_intro', e.target.value)} />
              </CmsField>
              <CmsField label="Toggle label">
                <input className="input-field" value={s.why_toggle} onChange={(e) => setSection('why_toggle', e.target.value)} />
              </CmsField>
              <CmsListEditor
                items={s.why_items}
                onChange={(v) => setSection('why_items', v)}
                addLabel="Add reason"
                fields={[
                  { key: 'title', label: 'Title' },
                  { key: 'body', label: 'Description', type: 'textarea' },
                ]}
              />
            </CmsPanel>
            <CmsPanel title="The TUP difference" icon="fa-star">
              <CmsField label="Heading">
                <input className="input-field" value={s.difference_heading} onChange={(e) => setSection('difference_heading', e.target.value)} />
              </CmsField>
              <CmsField label="Intro">
                <textarea className="input-field min-h-[72px]" value={s.difference_intro} onChange={(e) => setSection('difference_intro', e.target.value)} />
              </CmsField>
              <CmsField label="Toggle label">
                <input className="input-field" value={s.difference_toggle} onChange={(e) => setSection('difference_toggle', e.target.value)} />
              </CmsField>
              <CmsListEditor
                items={s.difference_items}
                onChange={(v) => setSection('difference_items', v)}
                addLabel="Add point"
                fields={[
                  { key: 'title', label: 'Title' },
                  { key: 'body', label: 'Description', type: 'textarea' },
                ]}
              />
            </CmsPanel>
          </div>
        )}

        {tab === 'pain' && (
          <div className="space-y-5" role="tabpanel">
            <PainMapEditor
              sections={s}
              onChange={setSection}
              uploadFn={uploadCmsImage}
              accent="orange"
              scopeNote="PhysioAtHome only. The homepage Pain map and TeleRehab body areas are stored separately — edits here will not change those pages."
            />
          </div>
        )}

        {tab === 'roadmap' && (
          <div className="space-y-5" role="tabpanel">
            <RecoveryRoadmapEditor
              sections={s}
              onChange={setSection}
              uploadFn={uploadCmsImage}
              accent="orange"
              scopeNote="PhysioAtHome only. TeleRehab / TelePhysio journey content is stored separately — edits here will not change that page."
            />
          </div>
        )}

        {tab === 'ecosystem' && (
          <div className="space-y-5" role="tabpanel">
            <CareEcosystemEditor
              sections={s}
              onChange={setSection}
              uploadFn={uploadCmsImage}
              accent="orange"
              scopeNote="PhysioAtHome only. TeleRehab care-ecosystem items and images are stored separately — edits here will not change that page."
            />
          </div>
        )}

        {tab === 'enrol' && (
          <div className="space-y-5" role="tabpanel">
            <EnrollmentEditor
              sections={s}
              onChange={setSection}
              uploadFn={uploadCmsImage}
              accent="orange"
              scopeNote="PhysioAtHome only. TelePhysio enrollment copy, steps and images are stored separately — edits here will not change that page."
            />
          </div>
        )}

        {tab === 'book' && (
          <div className="space-y-5" role="tabpanel">
            <SectionVisibilityToggle
              label="Show tiers & booking"
              description="When off, the physiotherapist tiers, how-it-works steps, and conditions are hidden on the live page."
              on={isSectionOn(s, 'book_enabled')}
              onChange={(v) => setSection('book_enabled', v)}
            />
            <CmsPanel title="Physiotherapist tiers" icon="fa-user-doctor">
              <CmsField label="Heading">
                <input className="input-field" value={s.tiers_heading} onChange={(e) => setSection('tiers_heading', e.target.value)} />
              </CmsField>
              <CmsField label="Intro">
                <textarea className="input-field min-h-[72px]" value={s.tiers_intro} onChange={(e) => setSection('tiers_intro', e.target.value)} />
              </CmsField>
              <CmsListEditor
                items={s.tiers}
                onChange={setTiers}
                addLabel="Add tier"
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'badge', label: 'Badge (optional)' },
                  { key: 'price', label: 'Price' },
                  { key: 'original', label: 'Original price' },
                  { key: 'summary', label: 'Summary', type: 'textarea' },
                  { key: 'qualification', label: 'Qualification' },
                  { key: 'experience', label: 'Experience' },
                  { key: 'speciality', label: 'Speciality', type: 'textarea' },
                  { key: 'case_handling', label: 'Case handling', type: 'textarea' },
                  { key: 'cta_label', label: 'Button label' },
                  { key: 'cta_link', label: 'Button link' },
                  { key: 'key', label: 'Tier id (certified / senior / specialist)' },
                ]}
              />
              <CmsField label="Bottom note">
                <textarea className="input-field min-h-[60px]" value={s.tiers_note} onChange={(e) => setSection('tiers_note', e.target.value)} />
              </CmsField>
            </CmsPanel>
            <CmsPanel title="How it works" icon="fa-list-ol">
              <CmsField label="Heading">
                <input className="input-field" value={s.how_heading} onChange={(e) => setSection('how_heading', e.target.value)} />
              </CmsField>
              <CmsListEditor
                items={s.how_steps}
                onChange={(v) => setSection('how_steps', v)}
                addLabel="Add step"
                fields={[
                  { key: 'title', label: 'Step title' },
                  { key: 'body', label: 'Description', type: 'textarea' },
                ]}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="CTA label">
                  <input className="input-field" value={s.how_cta_label} onChange={(e) => setSection('how_cta_label', e.target.value)} />
                </CmsField>
                <CmsField label="CTA link">
                  <input className="input-field" value={s.how_cta_link} onChange={(e) => setSection('how_cta_link', e.target.value)} />
                </CmsField>
              </div>
            </CmsPanel>
            <CmsPanel title="Conditions" icon="fa-notes-medical">
              <CmsField label="Heading">
                <input className="input-field" value={s.conditions_heading} onChange={(e) => setSection('conditions_heading', e.target.value)} />
              </CmsField>
              <CmsField label="Featured tiles" hint="One per line">
                <textarea
                  className="input-field min-h-[90px]"
                  value={(s.conditions_featured || []).join('\n')}
                  onChange={(e) => setSection('conditions_featured', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
                />
              </CmsField>
              <CmsListEditor
                items={s.conditions_categories}
                onChange={(v) => setSection('conditions_categories', v)}
                addLabel="Add category"
                fields={[
                  { key: 'name', label: 'Category name' },
                  { key: 'items', label: 'Conditions ( · or new line)', type: 'textarea' },
                ]}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="Toggle label">
                  <input className="input-field" value={s.conditions_toggle} onChange={(e) => setSection('conditions_toggle', e.target.value)} />
                </CmsField>
                <CmsField label="CTA label">
                  <input className="input-field" value={s.conditions_cta_label} onChange={(e) => setSection('conditions_cta_label', e.target.value)} />
                </CmsField>
              </div>
            </CmsPanel>
          </div>
        )}

        {tab === 'price' && (
          <div className="space-y-5" role="tabpanel">
            <SectionVisibilityToggle
              label="Show pricing & areas"
              description="When off, the rates and service-area sections are hidden on the live page."
              on={isSectionOn(s, 'pricing_enabled')}
              onChange={(v) => setSection('pricing_enabled', v)}
            />
            <CmsPanel title="Pricing" icon="fa-tag">
              <CmsField label="Heading">
                <input className="input-field" value={s.pricing_heading} onChange={(e) => setSection('pricing_heading', e.target.value)} />
              </CmsField>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Single sessions</p>
              <p className="text-xs text-slate-500">
                These rows are the Certified, Senior, and Specialist tier prices. Editing one updates that tier card.
              </p>
              <CmsListEditor
                items={s.pricing_sessions}
                onChange={setPricingSessions}
                addLabel="Add session price"
                fields={[
                  { key: 'name', label: 'Tier name' },
                  { key: 'original', label: 'Original' },
                  { key: 'price', label: 'Current' },
                ]}
              />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Packages</p>
              <CmsListEditor
                items={s.pricing_packages}
                onChange={(v) => setSection('pricing_packages', v)}
                addLabel="Add package"
                fields={[
                  { key: 'name', label: 'Package name' },
                  { key: 'sessions', label: 'Sessions label' },
                  { key: 'price', label: 'Price' },
                  { key: 'save', label: 'Save label' },
                ]}
              />
              <CmsField label="Package toggle label">
                <input className="input-field" value={s.pricing_toggle} onChange={(e) => setSection('pricing_toggle', e.target.value)} />
              </CmsField>
              <CmsField label="Offer note">
                <textarea className="input-field min-h-[60px]" value={s.pricing_offer} onChange={(e) => setSection('pricing_offer', e.target.value)} />
              </CmsField>
              <CmsField label="Payment methods">
                <input className="input-field" value={s.pricing_payment} onChange={(e) => setSection('pricing_payment', e.target.value)} />
              </CmsField>
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="CTA label">
                  <input className="input-field" value={s.pricing_cta_label} onChange={(e) => setSection('pricing_cta_label', e.target.value)} />
                </CmsField>
                <CmsField label="CTA link">
                  <input className="input-field" value={s.pricing_cta_link} onChange={(e) => setSection('pricing_cta_link', e.target.value)} />
                </CmsField>
              </div>
            </CmsPanel>
            <CmsPanel title="Service areas" icon="fa-map-location-dot">
              <CmsField label="Heading">
                <input className="input-field" value={s.areas_heading} onChange={(e) => setSection('areas_heading', e.target.value)} />
              </CmsField>
              <CmsListEditor
                items={s.areas}
                onChange={(v) => setSection('areas', v)}
                addLabel="Add city"
                fields={[
                  { key: 'name', label: 'City' },
                  { key: 'localities', label: 'Locality details', type: 'textarea' },
                ]}
              />
              <CmsField label="Pincode message">
                <textarea className="input-field min-h-[60px]" value={s.areas_pincode} onChange={(e) => setSection('areas_pincode', e.target.value)} />
              </CmsField>
            </CmsPanel>
          </div>
        )}

        {tab === 'voice' && (
          <div className="space-y-5" role="tabpanel">
            <SectionVisibilityToggle
              label="Show reviews & FAQ"
              description="When off, patient stories and the FAQ are hidden on the live page."
              on={isSectionOn(s, 'voice_enabled')}
              onChange={(v) => setSection('voice_enabled', v)}
            />
            <CmsPanel title="Testimonials" icon="fa-comment-dots">
              <CmsField label="Heading">
                <input className="input-field" value={s.testimonials_heading} onChange={(e) => setSection('testimonials_heading', e.target.value)} />
              </CmsField>
              <CmsListEditor
                items={s.testimonials}
                onChange={(v) => setSection('testimonials', v)}
                addLabel="Add testimonial"
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'city', label: 'Locality' },
                  { key: 'rating', label: 'Rating (1–5)' },
                  { key: 'text', label: 'Quote', type: 'textarea' },
                ]}
              />
            </CmsPanel>
            <CmsPanel title="FAQs" icon="fa-circle-question">
              <CmsField label="Heading">
                <input className="input-field" value={s.faq_heading} onChange={(e) => setSection('faq_heading', e.target.value)} />
              </CmsField>
              <CmsListEditor
                items={s.faqs}
                onChange={(v) => setSection('faqs', v)}
                addLabel="Add question"
                fields={[
                  { key: 'q', label: 'Question' },
                  { key: 'a', label: 'Answer', type: 'textarea' },
                ]}
              />
            </CmsPanel>
          </div>
        )}

        {tab === 'community' && (
          <div className="space-y-5" role="tabpanel">
            <SectionVisibilityToggle
              label="Show social & portal"
              description="When off, the community and portal preview is hidden on the live page."
              on={isSectionOn(s, 'community_enabled')}
              onChange={(v) => setSection('community_enabled', v)}
            />
            <CommunityPreviewEditor
              sections={s}
              onChange={setSection}
              uploadFn={uploadCmsImage}
              accent="orange"
            />
          </div>
        )}

        {tab === 'seo' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="Search listing" icon="fa-magnifying-glass-chart">
              <CmsField label="SEO title">
                <input className="input-field" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} />
              </CmsField>
              <CmsField label="SEO description">
                <textarea className="input-field min-h-[80px]" value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
              </CmsField>
              <p className="text-xs text-slate-500">
                Used as the live page title and description. If an active{' '}
                <Link to="/admin/seo" className="text-primary-700 font-semibold hover:underline">
                  SEO settings
                </Link>{' '}
                entry exists for <code>/home-physiotherapy</code>, that entry takes priority (it also controls sitemap and
                Open Graph overrides).
              </p>
            </CmsPanel>
          </div>
        )}

        <div className="sticky bottom-3 z-20 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-white/95 backdrop-blur-md shadow-lg px-4 py-3">
            <p className="text-xs text-slate-500 hidden sm:block">Publishes content to the live Home Physiotherapy page.</p>
            <button type="submit" disabled={saving} className="btn-primary !px-7 min-h-11">
              {saving ? 'Saving…' : 'Save & publish'}
            </button>
          </div>
        </div>
      </form>
    </AdminDashboardLayout>
  );
}
