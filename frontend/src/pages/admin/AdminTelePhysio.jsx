import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { CmsField, CmsListEditor, CmsPanel } from '../../components/admin/CmsFormKit';
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

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 ${
              tab === t.id
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FaIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* TAB 1: HERO & TRUST */}
        {tab === 'hero' && (
          <div className="space-y-6">
            <CmsPanel title="Hero section" subtitle="Main banner at top of /telephysio">
              <div className="grid md:grid-cols-2 gap-4">
                <CmsField
                  label="Hero badge"
                  value={s.hero_badge}
                  onChange={(v) => setSection('hero_badge', v)}
                  placeholder="TelePhysio by Myoreset"
                />
                <CmsField
                  label="Primary CTA label"
                  value={s.hero_cta_label}
                  onChange={(v) => setSection('hero_cta_label', v)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <CmsField
                  label="Primary CTA link"
                  value={s.hero_cta_link}
                  onChange={(v) => setSection('hero_cta_link', v)}
                />
                <CmsField
                  label="Secondary CTA label"
                  value={s.secondary_cta_label}
                  onChange={(v) => setSection('secondary_cta_label', v)}
                />
              </div>
              <CmsField
                label="Hero title"
                value={form.hero_title}
                onChange={(v) => set('hero_title', v)}
                required
              />
              <CmsField
                label="Hero subtitle"
                type="textarea"
                rows={3}
                value={form.hero_subtitle}
                onChange={(v) => set('hero_subtitle', v)}
              />
              <MediaUrlOrUpload
                label="Hero image"
                value={form.hero_image}
                onChange={(v) => set('hero_image', v)}
                onUpload={(file) => uploadCmsImage(file, 'telephysio')}
                helperText="Professional telemedicine / video consultation photo (1200×900 recommended)"
              />
            </CmsPanel>

            <CmsPanel title="Trust indicators" subtitle="Checkmark pills shown in the hero">
              <CmsListEditor
                items={s.trust_signals || []}
                onChange={(next) => setSection('trust_signals', next)}
                addLabel="Add trust indicator"
                itemPlaceholder="e.g. Qualified Physiotherapists"
              />
            </CmsPanel>

            <CmsPanel title="Trust bar strip" subtitle="Compact 6-item trust banner below hero">
              <div className="space-y-3">
                {(s.trust_bar || []).map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      className="input-field w-32"
                      value={item.icon}
                      onChange={(e) => {
                        const copy = [...s.trust_bar];
                        copy[idx] = { ...copy[idx], icon: e.target.value };
                        setSection('trust_bar', copy);
                      }}
                      placeholder="fa-video"
                    />
                    <input
                      type="text"
                      className="input-field flex-1"
                      value={item.label}
                      onChange={(e) => {
                        const copy = [...s.trust_bar];
                        copy[idx] = { ...copy[idx], label: e.target.value };
                        setSection('trust_bar', copy);
                      }}
                      placeholder="Feature label"
                    />
                  </div>
                ))}
              </div>
            </CmsPanel>
          </div>
        )}

        {/* TAB 2: OVERVIEW & SUITABILITY */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <CmsPanel title="What Is TelePhysio?" subtitle="Explanation and ideal use cases">
              <CmsField
                label="Section heading"
                value={s.what_heading}
                onChange={(v) => setSection('what_heading', v)}
              />
              <CmsField
                label="Body description"
                type="textarea"
                rows={4}
                value={s.what_body}
                onChange={(v) => setSection('what_body', v)}
              />
              <CmsField
                label="Use cases title"
                value={s.what_use_cases_title}
                onChange={(v) => setSection('what_use_cases_title', v)}
              />
              <CmsListEditor
                items={s.what_use_cases || []}
                onChange={(next) => setSection('what_use_cases', next)}
                addLabel="Add use case"
                itemPlaceholder="e.g. Follow-up consultations"
              />
            </CmsPanel>

            <CmsPanel title="Who Is TelePhysio For?" subtitle="6 target patient cards">
              <CmsField
                label="Section heading"
                value={s.who_heading}
                onChange={(v) => setSection('who_heading', v)}
              />
              <CmsField
                label="Section subheading"
                value={s.who_subheading}
                onChange={(v) => setSection('who_subheading', v)}
              />
              <div className="space-y-3 mt-4">
                {(s.who_cards || []).map((card, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="input-field w-32"
                        value={card.icon}
                        onChange={(e) => {
                          const copy = [...s.who_cards];
                          copy[idx] = { ...copy[idx], icon: e.target.value };
                          setSection('who_cards', copy);
                        }}
                        placeholder="fa-icon"
                      />
                      <input
                        type="text"
                        className="input-field flex-1 font-bold"
                        value={card.title}
                        onChange={(e) => {
                          const copy = [...s.who_cards];
                          copy[idx] = { ...copy[idx], title: e.target.value };
                          setSection('who_cards', copy);
                        }}
                        placeholder="Card title"
                      />
                    </div>
                    <textarea
                      rows={2}
                      className="input-field w-full text-xs"
                      value={card.description}
                      onChange={(e) => {
                        const copy = [...s.who_cards];
                        copy[idx] = { ...copy[idx], description: e.target.value };
                        setSection('who_cards', copy);
                      }}
                      placeholder="Card description"
                    />
                  </div>
                ))}
              </div>
              <CmsField
                label="Clinical advisory note"
                type="textarea"
                rows={2}
                value={s.who_clinical_note}
                onChange={(v) => setSection('who_clinical_note', v)}
              />
            </CmsPanel>
          </div>
        )}

        {/* TAB 3: STEPS & TIMELINE */}
        {tab === 'steps' && (
          <div className="space-y-6">
            <CmsPanel title="How TelePhysio Works" subtitle="4-step process">
              <CmsField
                label="Section heading"
                value={s.how_heading}
                onChange={(v) => setSection('how_heading', v)}
              />
              <CmsField
                label="Section subheading"
                value={s.how_subheading}
                onChange={(v) => setSection('how_subheading', v)}
              />
              <div className="space-y-3 mt-4">
                {(s.how_steps || []).map((step, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="input-field w-20 font-mono"
                        value={step.step}
                        onChange={(e) => {
                          const copy = [...s.how_steps];
                          copy[idx] = { ...copy[idx], step: e.target.value };
                          setSection('how_steps', copy);
                        }}
                      />
                      <input
                        type="text"
                        className="input-field flex-1 font-bold"
                        value={step.title}
                        onChange={(e) => {
                          const copy = [...s.how_steps];
                          copy[idx] = { ...copy[idx], title: e.target.value };
                          setSection('how_steps', copy);
                        }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      className="input-field w-full text-xs"
                      value={step.description}
                      onChange={(e) => {
                        const copy = [...s.how_steps];
                        copy[idx] = { ...copy[idx], description: e.target.value };
                        setSection('how_steps', copy);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CmsPanel>

            <CmsPanel title="Session Timeline" subtitle="7-point session breakdown">
              <CmsField
                label="Section heading"
                value={s.session_heading}
                onChange={(v) => setSection('session_heading', v)}
              />
              <CmsField
                label="Section subheading"
                value={s.session_subheading}
                onChange={(v) => setSection('session_subheading', v)}
              />
              <div className="space-y-3 mt-4">
                {(s.session_timeline || []).map((tl, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex gap-3">
                      <span className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {tl.number || idx + 1}
                      </span>
                      <input
                        type="text"
                        className="input-field flex-1 font-bold"
                        value={tl.title}
                        onChange={(e) => {
                          const copy = [...s.session_timeline];
                          copy[idx] = { ...copy[idx], title: e.target.value };
                          setSection('session_timeline', copy);
                        }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      className="input-field w-full text-xs"
                      value={tl.description}
                      onChange={(e) => {
                        const copy = [...s.session_timeline];
                        copy[idx] = { ...copy[idx], description: e.target.value };
                        setSection('session_timeline', copy);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CmsPanel>
          </div>
        )}

        {/* TAB 4: BENEFITS & CONDITIONS */}
        {tab === 'benefits' && (
          <div className="space-y-6">
            <CmsPanel title="Why Choose TelePhysio?" subtitle="6 key benefit cards">
              <CmsField
                label="Section heading"
                value={s.benefits_heading}
                onChange={(v) => setSection('benefits_heading', v)}
              />
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {(s.benefits || []).map((ben, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input-field w-28"
                        value={ben.icon}
                        onChange={(e) => {
                          const copy = [...s.benefits];
                          copy[idx] = { ...copy[idx], icon: e.target.value };
                          setSection('benefits', copy);
                        }}
                      />
                      <input
                        type="text"
                        className="input-field flex-1 font-bold"
                        value={ben.title}
                        onChange={(e) => {
                          const copy = [...s.benefits];
                          copy[idx] = { ...copy[idx], title: e.target.value };
                          setSection('benefits', copy);
                        }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      className="input-field w-full text-xs"
                      value={ben.description}
                      onChange={(e) => {
                        const copy = [...s.benefits];
                        copy[idx] = { ...copy[idx], description: e.target.value };
                        setSection('benefits', copy);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CmsPanel>

            <CmsPanel title="Conditions We Support Online" subtitle="8 clinical condition tiles">
              <CmsField
                label="Section heading"
                value={s.conditions_heading}
                onChange={(v) => setSection('conditions_heading', v)}
              />
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {(s.conditions || []).map((cond, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input-field w-28"
                        value={cond.icon}
                        onChange={(e) => {
                          const copy = [...s.conditions];
                          copy[idx] = { ...copy[idx], icon: e.target.value };
                          setSection('conditions', copy);
                        }}
                      />
                      <input
                        type="text"
                        className="input-field flex-1 font-bold"
                        value={cond.name}
                        onChange={(e) => {
                          const copy = [...s.conditions];
                          copy[idx] = { ...copy[idx], name: e.target.value };
                          setSection('conditions', copy);
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      className="input-field w-full text-xs"
                      value={cond.desc}
                      onChange={(e) => {
                        const copy = [...s.conditions];
                        copy[idx] = { ...copy[idx], desc: e.target.value };
                        setSection('conditions', copy);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CmsPanel>
          </div>
        )}

        {/* TAB 5: PRICING & JOURNEY */}
        {tab === 'pricing' && (
          <div className="space-y-6">
            <CmsPanel title="Pricing Cards" subtitle="Admin-configurable pricing plans">
              <CmsField
                label="Pricing heading"
                value={s.pricing_heading}
                onChange={(v) => setSection('pricing_heading', v)}
              />
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {(s.pricing_cards || []).map((pkg, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex gap-3">
                      <CmsField
                        label="Card title"
                        value={pkg.title}
                        onChange={(v) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], title: v };
                          setSection('pricing_cards', copy);
                        }}
                      />
                      <CmsField
                        label="Badge"
                        value={pkg.badge}
                        onChange={(v) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], badge: v };
                          setSection('pricing_cards', copy);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <CmsField
                        label="Price"
                        value={pkg.price}
                        onChange={(v) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], price: v };
                          setSection('pricing_cards', copy);
                        }}
                      />
                      <CmsField
                        label="Original"
                        value={pkg.original_price}
                        onChange={(v) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], original_price: v };
                          setSection('pricing_cards', copy);
                        }}
                      />
                      <CmsField
                        label="Duration"
                        value={pkg.duration}
                        onChange={(v) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], duration: v };
                          setSection('pricing_cards', copy);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <CmsField
                        label="CTA label"
                        value={pkg.cta_label}
                        onChange={(v) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], cta_label: v };
                          setSection('pricing_cards', copy);
                        }}
                      />
                      <CmsField
                        label="CTA link"
                        value={pkg.cta_link}
                        onChange={(v) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], cta_link: v };
                          setSection('pricing_cards', copy);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Features</label>
                      <CmsListEditor
                        items={pkg.features || []}
                        onChange={(next) => {
                          const copy = [...s.pricing_cards];
                          copy[idx] = { ...copy[idx], features: next };
                          setSection('pricing_cards', copy);
                        }}
                        addLabel="Add feature"
                        itemPlaceholder="e.g. 1-on-1 video session"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CmsPanel>

            <CmsPanel title="Final CTA Banner" subtitle="Bottom conversion banner">
              <CmsField
                label="Heading"
                value={s.final_heading}
                onChange={(v) => setSection('final_heading', v)}
              />
              <CmsField
                label="Subheading"
                value={s.final_subheading}
                onChange={(v) => setSection('final_subheading', v)}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <CmsField
                  label="Primary CTA label"
                  value={s.final_primary_cta_label}
                  onChange={(v) => setSection('final_primary_cta_label', v)}
                />
                <CmsField
                  label="Primary CTA link"
                  value={s.final_primary_cta_link}
                  onChange={(v) => setSection('final_primary_cta_link', v)}
                />
              </div>
            </CmsPanel>
          </div>
        )}

        {/* TAB 6: REVIEWS & FAQ */}
        {tab === 'voice' && (
          <div className="space-y-6">
            <CmsPanel title="Patient Testimonials" subtitle="Social proof from recovering patients">
              <div className="space-y-4">
                {(s.testimonials || []).map((t, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        className="input-field font-bold"
                        value={t.name}
                        onChange={(e) => {
                          const copy = [...s.testimonials];
                          copy[idx] = { ...copy[idx], name: e.target.value };
                          setSection('testimonials', copy);
                        }}
                        placeholder="Patient name"
                      />
                      <input
                        type="text"
                        className="input-field"
                        value={t.condition}
                        onChange={(e) => {
                          const copy = [...s.testimonials];
                          copy[idx] = { ...copy[idx], condition: e.target.value };
                          setSection('testimonials', copy);
                        }}
                        placeholder="Condition"
                      />
                      <input
                        type="text"
                        className="input-field"
                        value={t.location}
                        onChange={(e) => {
                          const copy = [...s.testimonials];
                          copy[idx] = { ...copy[idx], location: e.target.value };
                          setSection('testimonials', copy);
                        }}
                        placeholder="Location"
                      />
                    </div>
                    <textarea
                      rows={2}
                      className="input-field w-full text-xs"
                      value={t.quote}
                      onChange={(e) => {
                        const copy = [...s.testimonials];
                        copy[idx] = { ...copy[idx], quote: e.target.value };
                        setSection('testimonials', copy);
                      }}
                      placeholder="Patient quote / review"
                    />
                  </div>
                ))}
              </div>
            </CmsPanel>

            <CmsPanel title="Frequently Asked Questions" subtitle="10 accessible accordion items">
              <div className="space-y-4">
                {(s.faqs || []).map((faq, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-teal-700 w-6">#{idx + 1}</span>
                      <input
                        type="text"
                        className="input-field flex-1 font-bold"
                        value={faq.q}
                        onChange={(e) => {
                          const copy = [...s.faqs];
                          copy[idx] = { ...copy[idx], q: e.target.value };
                          setSection('faqs', copy);
                        }}
                        placeholder="Question"
                      />
                    </div>
                    <textarea
                      rows={3}
                      className="input-field w-full text-xs"
                      value={faq.a}
                      onChange={(e) => {
                        const copy = [...s.faqs];
                        copy[idx] = { ...copy[idx], a: e.target.value };
                        setSection('faqs', copy);
                      }}
                      placeholder="Answer"
                    />
                  </div>
                ))}
              </div>
            </CmsPanel>
          </div>
        )}

        {/* TAB 7: SEO */}
        {tab === 'seo' && (
          <div className="space-y-6">
            <CmsPanel title="Search engine optimization" subtitle="Meta tags for /telephysio">
              <CmsField
                label="SEO page title"
                value={form.seo_title}
                onChange={(v) => set('seo_title', v)}
                placeholder="TelePhysio by Myoreset | Online Physiotherapy Consultation"
              />
              <CmsField
                label="SEO meta description"
                type="textarea"
                rows={3}
                value={form.seo_description}
                onChange={(v) => set('seo_description', v)}
                placeholder="Book online physiotherapy consultations..."
              />
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
