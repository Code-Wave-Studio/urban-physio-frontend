import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { CmsField, CmsListEditor, CmsPanel } from '../../components/admin/CmsFormKit';
import CommunityPreviewEditor from '../../components/admin/CommunityPreviewEditor';
import { admin, uploadCmsImage } from '../../services/api';
import { TELEPHYSIO_DEFAULTS } from '../../constants/telephysioDefaults';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'hero', label: 'Hero & trust', icon: 'fa-flag' },
  { id: 'overview', label: 'Overview & suitability', icon: 'fa-circle-info' },
  { id: 'steps', label: 'Steps & timeline', icon: 'fa-list-ol' },
  { id: 'benefits', label: 'Benefits & conditions', icon: 'fa-certificate' },
  { id: 'pricing', label: 'Pricing & journey', icon: 'fa-tag' },
  { id: 'voice', label: 'Reviews & FAQ', icon: 'fa-comments' },
  { id: 'community', label: 'Social & portal', icon: 'fa-share-nodes' },
  { id: 'seo', label: 'SEO', icon: 'fa-magnifying-glass-chart' },
];

export default function AdminTelePhysio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('hero');
  const [form, setForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    seo_title: '',
    seo_description: '',
    sections: { ...TELEPHYSIO_DEFAULTS.sections },
  });

  useEffect(() => {
    admin
      .telephysioSettings()
      .then((res) => {
        const d = res.data ?? res;
        setForm({
          hero_title: d.hero_title || '',
          hero_subtitle: d.hero_subtitle || '',
          hero_image: d.hero_image || '',
          seo_title: d.seo_title || '',
          seo_description: d.seo_description || '',
          sections: { ...TELEPHYSIO_DEFAULTS.sections, ...(d.sections || {}) },
        });
      })
      .catch((e) => toast.error(e.message || 'Could not load TelePhysio page settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSection = (k, v) => setForm((f) => ({ ...f, sections: { ...f.sections, [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.updateTelePhysioSettings(form);
      toast.success('TelePhysio by Myoreset page published');
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
          Loading TelePhysio by Myoreset page…
        </div>
      </AdminDashboardLayout>
    );
  }

  const s = form.sections;

  return (
    <AdminDashboardLayout>
      <div className="rounded-3xl border border-teal-200/60 bg-gradient-to-br from-teal-50 via-white to-primary-50/80 p-5 sm:p-7 mb-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">Website CMS</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">TelePhysio by Myoreset</h1>
            <p className="text-sm text-slate-600 mt-1">
              Online consultation and remote rehabilitation.{' '}
              <Link to="/telephysio" target="_blank" className="text-teal-700 font-semibold hover:underline">
                /telephysio
              </Link>
            </p>
          </div>
          <Link to="/telephysio" target="_blank" className="btn-outline text-sm shrink-0 inline-flex items-center gap-2">
            <FaIcon icon="fa-arrow-up-right-from-square" />
            Preview live page
          </Link>
        </div>
      </div>

      <form onSubmit={save} className="max-w-5xl space-y-6">
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
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  active
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                }`}
              >
                <FaIcon icon={t.icon} className="text-xs" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: HERO & TRUST */}
        {tab === 'hero' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="Hero Section" icon="fa-flag">
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="Hero badge">
                  <input
                    className="input-field"
                    value={s.hero_badge || ''}
                    onChange={(e) => setSection('hero_badge', e.target.value)}
                  />
                </CmsField>
                <CmsField label="Primary CTA button label">
                  <input
                    className="input-field"
                    value={s.hero_cta_label || ''}
                    onChange={(e) => setSection('hero_cta_label', e.target.value)}
                  />
                </CmsField>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="Primary CTA button link">
                  <input
                    className="input-field"
                    value={s.hero_cta_link || ''}
                    onChange={(e) => setSection('hero_cta_link', e.target.value)}
                  />
                </CmsField>
                <CmsField label="Secondary CTA label (WhatsApp)">
                  <input
                    className="input-field"
                    value={s.secondary_cta_label || ''}
                    onChange={(e) => setSection('secondary_cta_label', e.target.value)}
                  />
                </CmsField>
              </div>
              <CmsField label="Headline">
                <textarea
                  className="input-field min-h-[72px]"
                  value={form.hero_title}
                  onChange={(e) => set('hero_title', e.target.value)}
                  required
                />
              </CmsField>
              <CmsField label="Subheadline">
                <textarea
                  className="input-field min-h-[100px]"
                  value={form.hero_subtitle}
                  onChange={(e) => set('hero_subtitle', e.target.value)}
                />
              </CmsField>
              <MediaUrlOrUpload
                label="Hero image"
                hint="Shown beside the headline — A 4:3 high-resolution landscape photo is recommended for desktop & mobile."
                recommendedSize="1200 × 900 px (4:3 ratio)"
                aspectRatio="4/3"
                devicePreview="4:3"
                accent="emerald"
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
                  onChange={(e) =>
                    setSection(
                      'trust_signals',
                      e.target.value.split('\n').map((x) => x.trim()).filter(Boolean)
                    )
                  }
                />
              </CmsField>
            </CmsPanel>

            <CmsPanel title="Trust Bar Strip" icon="fa-shield-halved">
              <CmsListEditor
                items={s.trust_bar || []}
                onChange={(v) => setSection('trust_bar', v)}
                addLabel="Add trust bar item"
                fields={[
                  { key: 'icon', label: 'Icon (e.g. fa-user-doctor)' },
                  { key: 'label', label: 'Label' },
                ]}
              />
            </CmsPanel>
          </div>
        )}

        {/* TAB 2: OVERVIEW & SUITABILITY */}
        {tab === 'overview' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="What Is TelePhysio?" icon="fa-circle-info">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.what_heading || ''}
                  onChange={(e) => setSection('what_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Body description">
                <textarea
                  className="input-field min-h-[100px]"
                  value={s.what_body || ''}
                  onChange={(e) => setSection('what_body', e.target.value)}
                />
              </CmsField>
              <CmsField label="Use cases title">
                <input
                  className="input-field"
                  value={s.what_use_cases_title || ''}
                  onChange={(e) => setSection('what_use_cases_title', e.target.value)}
                />
              </CmsField>
              <CmsField label="Use cases checklist" hint="One line per use case">
                <textarea
                  className="input-field min-h-[120px]"
                  value={(s.what_use_cases || []).join('\n')}
                  onChange={(e) =>
                    setSection(
                      'what_use_cases',
                      e.target.value.split('\n').map((x) => x.trim()).filter(Boolean)
                    )
                  }
                />
              </CmsField>
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="Section CTA label">
                  <input
                    className="input-field"
                    value={s.what_cta_label || ''}
                    onChange={(e) => setSection('what_cta_label', e.target.value)}
                  />
                </CmsField>
                <CmsField label="Section CTA link">
                  <input
                    className="input-field"
                    value={s.what_cta_link || ''}
                    onChange={(e) => setSection('what_cta_link', e.target.value)}
                  />
                </CmsField>
              </div>
            </CmsPanel>

            <CmsPanel title="Is Online Physiotherapy Right for You?" icon="fa-users">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.who_heading || ''}
                  onChange={(e) => setSection('who_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <textarea
                  className="input-field min-h-[60px]"
                  value={s.who_subheading || ''}
                  onChange={(e) => setSection('who_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.who_cards || []}
                onChange={(v) => setSection('who_cards', v)}
                addLabel="Add patient profile card"
                fields={[
                  { key: 'title', label: 'Title (e.g. Busy Professionals)' },
                  { key: 'icon', label: 'Icon (e.g. fa-briefcase)' },
                  { key: 'description', label: 'Description', type: 'textarea' },
                ]}
              />
              <CmsField label="Clinical advisory note">
                <textarea
                  className="input-field min-h-[70px]"
                  value={s.who_clinical_note || ''}
                  onChange={(e) => setSection('who_clinical_note', e.target.value)}
                />
              </CmsField>
            </CmsPanel>
          </div>
        )}

        {/* TAB 3: STEPS & TIMELINE */}
        {tab === 'steps' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="How TelePhysio Works" icon="fa-list-ol">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.how_heading || ''}
                  onChange={(e) => setSection('how_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <input
                  className="input-field"
                  value={s.how_subheading || ''}
                  onChange={(e) => setSection('how_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.how_steps || []}
                onChange={(v) => setSection('how_steps', v)}
                addLabel="Add process step"
                fields={[
                  { key: 'step', label: 'Step number (e.g. 01)' },
                  { key: 'title', label: 'Step title' },
                  { key: 'icon', label: 'Icon (e.g. fa-video)' },
                  { key: 'description', label: 'Description', type: 'textarea' },
                ]}
              />
            </CmsPanel>

            <CmsPanel title="What Happens During Your TelePhysio Session?" icon="fa-clock">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.session_heading || ''}
                  onChange={(e) => setSection('session_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <input
                  className="input-field"
                  value={s.session_subheading || ''}
                  onChange={(e) => setSection('session_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.session_timeline || []}
                onChange={(v) => setSection('session_timeline', v)}
                addLabel="Add session timeline item"
                fields={[
                  { key: 'number', label: 'Step number (e.g. 1)' },
                  { key: 'title', label: 'Title' },
                  { key: 'description', label: 'Description', type: 'textarea' },
                ]}
              />
              <CmsField label="Session disclaimer">
                <textarea
                  className="input-field min-h-[60px]"
                  value={s.session_disclaimer || ''}
                  onChange={(e) => setSection('session_disclaimer', e.target.value)}
                />
              </CmsField>
            </CmsPanel>
          </div>
        )}

        {/* TAB 4: BENEFITS & CONDITIONS */}
        {tab === 'benefits' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="Why Choose TelePhysio?" icon="fa-certificate">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.benefits_heading || ''}
                  onChange={(e) => setSection('benefits_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <input
                  className="input-field"
                  value={s.benefits_subheading || ''}
                  onChange={(e) => setSection('benefits_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.benefits || []}
                onChange={(v) => setSection('benefits', v)}
                addLabel="Add benefit card"
                fields={[
                  { key: 'title', label: 'Benefit title' },
                  { key: 'icon', label: 'Icon (e.g. fa-house-circle-check)' },
                  { key: 'description', label: 'Description', type: 'textarea' },
                ]}
              />
            </CmsPanel>

            <CmsPanel title="Conditions We Can Support Online" icon="fa-notes-medical">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.conditions_heading || ''}
                  onChange={(e) => setSection('conditions_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <input
                  className="input-field"
                  value={s.conditions_subheading || ''}
                  onChange={(e) => setSection('conditions_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.conditions || []}
                onChange={(v) => setSection('conditions', v)}
                addLabel="Add condition"
                fields={[
                  { key: 'name', label: 'Condition name' },
                  { key: 'icon', label: 'Icon (e.g. fa-person-cane)' },
                  { key: 'desc', label: 'Short description', type: 'textarea' },
                ]}
              />
              <CmsField label="Clinical note">
                <input
                  className="input-field"
                  value={s.conditions_clinical_note || ''}
                  onChange={(e) => setSection('conditions_clinical_note', e.target.value)}
                />
              </CmsField>
            </CmsPanel>
          </div>
        )}

        {/* TAB 5: PRICING & JOURNEY */}
        {tab === 'pricing' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="Pricing Cards" icon="fa-tag">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.pricing_heading || ''}
                  onChange={(e) => setSection('pricing_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <input
                  className="input-field"
                  value={s.pricing_subheading || ''}
                  onChange={(e) => setSection('pricing_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.pricing_cards || []}
                onChange={(v) => setSection('pricing_cards', v)}
                addLabel="Add pricing plan"
                fields={[
                  { key: 'title', label: 'Plan title' },
                  { key: 'badge', label: 'Badge (optional)' },
                  { key: 'price', label: 'Price (e.g. ₹499)' },
                  { key: 'original_price', label: 'Original price (e.g. ₹799)' },
                  { key: 'duration', label: 'Duration / Sessions (e.g. 30–45 mins)' },
                  { key: 'features', label: 'Features (separate with · or new line)', type: 'textarea' },
                  { key: 'cta_label', label: 'Button label' },
                  { key: 'cta_link', label: 'Button link' },
                ]}
              />
              <CmsField label="Pricing footer note">
                <input
                  className="input-field"
                  value={s.pricing_note || ''}
                  onChange={(e) => setSection('pricing_note', e.target.value)}
                />
              </CmsField>
            </CmsPanel>

            <CmsPanel title="Final CTA Banner" icon="fa-bullhorn">
              <CmsField label="Banner headline">
                <input
                  className="input-field"
                  value={s.final_heading || ''}
                  onChange={(e) => setSection('final_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Banner subheading">
                <textarea
                  className="input-field min-h-[60px]"
                  value={s.final_subheading || ''}
                  onChange={(e) => setSection('final_subheading', e.target.value)}
                />
              </CmsField>
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="Primary CTA button label">
                  <input
                    className="input-field"
                    value={s.final_primary_cta_label || ''}
                    onChange={(e) => setSection('final_primary_cta_label', e.target.value)}
                  />
                </CmsField>
                <CmsField label="Primary CTA button link">
                  <input
                    className="input-field"
                    value={s.final_primary_cta_link || ''}
                    onChange={(e) => setSection('final_primary_cta_link', e.target.value)}
                  />
                </CmsField>
              </div>
              <CmsField label="Secondary CTA label">
                <input
                  className="input-field"
                  value={s.final_secondary_cta_label || ''}
                  onChange={(e) => setSection('final_secondary_cta_label', e.target.value)}
                />
              </CmsField>
            </CmsPanel>
          </div>
        )}

        {/* TAB 6: REVIEWS & FAQ */}
        {tab === 'voice' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="Patient Testimonials" icon="fa-comment-dots">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.testimonials_heading || ''}
                  onChange={(e) => setSection('testimonials_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <input
                  className="input-field"
                  value={s.testimonials_subheading || ''}
                  onChange={(e) => setSection('testimonials_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.testimonials || []}
                onChange={(v) => setSection('testimonials', v)}
                addLabel="Add testimonial"
                fields={[
                  { key: 'name', label: 'Patient name' },
                  { key: 'condition', label: 'Condition / Recovery type' },
                  { key: 'location', label: 'City / Location' },
                  { key: 'quote', label: 'Testimonial quote', type: 'textarea' },
                ]}
              />
            </CmsPanel>

            <CmsPanel title="Frequently Asked Questions" icon="fa-circle-question">
              <CmsField label="Section heading">
                <input
                  className="input-field"
                  value={s.faq_heading || ''}
                  onChange={(e) => setSection('faq_heading', e.target.value)}
                />
              </CmsField>
              <CmsField label="Section subheading">
                <input
                  className="input-field"
                  value={s.faq_subheading || ''}
                  onChange={(e) => setSection('faq_subheading', e.target.value)}
                />
              </CmsField>
              <CmsListEditor
                items={s.faqs || []}
                onChange={(v) => setSection('faqs', v)}
                addLabel="Add FAQ item"
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
            <CommunityPreviewEditor
              sections={s}
              onChange={setSection}
              uploadFn={uploadCmsImage}
              accent="teal"
            />
          </div>
        )}

        {/* TAB 7: SEO */}
        {tab === 'seo' && (
          <div className="space-y-5" role="tabpanel">
            <CmsPanel title="Search Engine Optimization" icon="fa-magnifying-glass-chart">
              <CmsField label="Meta Title">
                <input
                  className="input-field"
                  value={form.seo_title || ''}
                  onChange={(e) => set('seo_title', e.target.value)}
                  placeholder="TelePhysio by Myoreset | Online Physiotherapy Consultation"
                />
              </CmsField>
              <CmsField label="Meta Description">
                <textarea
                  className="input-field min-h-[90px]"
                  value={form.seo_description || ''}
                  onChange={(e) => set('seo_description', e.target.value)}
                  placeholder="Book online physiotherapy consultations..."
                />
              </CmsField>
            </CmsPanel>
          </div>
        )}

        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Unsaved changes will not appear on the live site until published.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary !bg-teal-700 hover:!bg-teal-800 text-white font-bold py-2.5 px-6 rounded-xl inline-flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <FaIcon icon={saving ? 'fa-spinner' : 'fa-floppy-disk'} className={saving ? 'fa-spin' : ''} />
            {saving ? 'Publishing…' : 'Publish TelePhysio Page'}
          </button>
        </div>
      </form>
    </AdminDashboardLayout>
  );
}
