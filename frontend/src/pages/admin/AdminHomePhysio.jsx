import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { admin, uploadCmsImage } from '../../services/api';
import { HOME_PHYSIO_DEFAULTS } from '../../constants/homePhysioDefaults';
import toast from 'react-hot-toast';

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function ListEditor({ items, onChange, fields, addLabel }) {
  const list = items || [];
  return (
    <div className="space-y-3">
      {list.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2 relative">
          <button
            type="button"
            className="absolute top-2 right-2 text-red-500 text-sm"
            onClick={() => onChange(list.filter((_, j) => j !== i))}
            aria-label="Remove"
          >
            <FaIcon icon="fa-trash" />
          </button>
          {fields.map((f) =>
            f.type === 'textarea' ? (
              <textarea
                key={f.key}
                className="input-field text-sm min-h-[64px] pr-8"
                placeholder={f.label}
                value={
                  typeof item === 'string'
                    ? item
                    : Array.isArray(item[f.key])
                      ? item[f.key].join(' · ')
                      : item[f.key] || ''
                }
                onChange={(e) => {
                  if (typeof item === 'string') {
                    const next = [...list];
                    next[i] = e.target.value;
                    onChange(next);
                  } else {
                    const next = [...list];
                    const raw = e.target.value;
                    next[i] = {
                      ...next[i],
                      [f.key]: f.key === 'items' ? raw.split(/\s*[·\n]\s*/).filter(Boolean) : raw,
                    };
                    onChange(next);
                  }
                }}
              />
            ) : (
              <input
                key={f.key}
                className="input-field text-sm pr-8"
                placeholder={f.label}
                value={typeof item === 'string' ? item : item[f.key] || ''}
                onChange={(e) => {
                  if (typeof item === 'string') {
                    const next = [...list];
                    next[i] = e.target.value;
                    onChange(next);
                  } else {
                    const next = [...list];
                    next[i] = { ...next[i], [f.key]: e.target.value };
                    onChange(next);
                  }
                }}
              />
            )
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn-outline text-xs !py-1.5"
        onClick={() => {
          const blank = fields.length === 1 && fields[0].key === 'value' ? '' : Object.fromEntries(fields.map((f) => [f.key, '']));
          onChange([...list, blank]);
        }}
      >
        <FaIcon icon="fa-plus" /> {addLabel}
      </button>
    </div>
  );
}

export default function AdminHomePhysio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          sections: { ...HOME_PHYSIO_DEFAULTS.sections, ...(d.sections || {}) },
        });
      })
      .catch((e) => toast.error(e.message || 'Could not load Home Physiotherapy page'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSection = (k, v) => setForm((f) => ({ ...f, sections: { ...f.sections, [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.updateHomePhysioSettings(form);
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
      <div className="rounded-3xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-white to-primary-50/80 p-5 sm:p-7 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">Website CMS</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Home Physiotherapy page</h1>
            <p className="text-sm text-slate-600 mt-1">
              Edit all content on{' '}
              <Link to="/home-physiotherapy" target="_blank" className="text-primary-700 font-semibold hover:underline">
                /home-physiotherapy
              </Link>
            </p>
          </div>
          <Link to="/home-physiotherapy" target="_blank" className="btn-outline text-sm shrink-0 inline-flex items-center gap-2">
            <FaIcon icon="fa-arrow-up-right-from-square" />
            Preview page
          </Link>
        </div>
      </div>

      <form onSubmit={save} className="space-y-6 max-w-4xl">
        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Hero</h2>
          <Field label="Headline">
            <textarea className="input-field min-h-[72px]" value={form.hero_title} onChange={(e) => set('hero_title', e.target.value)} />
          </Field>
          <Field label="Subheadline">
            <textarea className="input-field min-h-[100px]" value={form.hero_subtitle} onChange={(e) => set('hero_subtitle', e.target.value)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Button label">
              <input className="input-field" value={s.hero_cta_label} onChange={(e) => setSection('hero_cta_label', e.target.value)} />
            </Field>
            <Field label="Button link">
              <input className="input-field" value={s.hero_cta_link} onChange={(e) => setSection('hero_cta_link', e.target.value)} />
            </Field>
          </div>
          <MediaUrlOrUpload
            label="Hero image"
            hint="Shown beside the headline — URL or upload"
            icon="fa-image"
            urlValue={form.hero_image}
            onUrlChange={(v) => set('hero_image', v)}
            onUpload={uploadCmsImage}
            accept="image/jpeg,image/png,image/webp"
            maxMb={4}
            preview="image"
          />
          <Field label="Trust signals (one per line)">
            <textarea
              className="input-field min-h-[90px]"
              value={(s.trust_signals || []).join('\n')}
              onChange={(e) => setSection('trust_signals', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
            />
          </Field>
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-3">
          <h2 className="font-bold text-slate-900">Trust bar</h2>
          <ListEditor
            items={s.trust_bar}
            onChange={(v) => setSection('trust_bar', v)}
            addLabel="Add trust item"
            fields={[
              { key: 'icon', label: 'Icon (e.g. fa-user-doctor)' },
              { key: 'label', label: 'Label' },
            ]}
          />
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Is home physio right for you?</h2>
          <input className="input-field" value={s.fit_heading} onChange={(e) => setSection('fit_heading', e.target.value)} placeholder="Heading" />
          <textarea className="input-field min-h-[72px]" value={s.fit_intro} onChange={(e) => setSection('fit_intro', e.target.value)} placeholder="Intro" />
          <input className="input-field" value={s.fit_home_title} onChange={(e) => setSection('fit_home_title', e.target.value)} placeholder="Home column title" />
          <textarea
            className="input-field min-h-[90px]"
            value={(s.fit_home_items || []).join('\n')}
            onChange={(e) => setSection('fit_home_items', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
          />
          <input className="input-field" value={s.fit_clinic_title} onChange={(e) => setSection('fit_clinic_title', e.target.value)} placeholder="Clinic column title" />
          <textarea
            className="input-field min-h-[72px]"
            value={(s.fit_clinic_items || []).join('\n')}
            onChange={(e) => setSection('fit_clinic_items', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
          />
          <textarea className="input-field min-h-[72px]" value={s.fit_reassurance} onChange={(e) => setSection('fit_reassurance', e.target.value)} placeholder="Reassurance" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input-field" value={s.fit_toggle} onChange={(e) => setSection('fit_toggle', e.target.value)} placeholder="Toggle label" />
            <input className="input-field" value={s.fit_cta_label} onChange={(e) => setSection('fit_cta_label', e.target.value)} placeholder="CTA label" />
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Why it works</h2>
          <input className="input-field" value={s.why_heading} onChange={(e) => setSection('why_heading', e.target.value)} />
          <textarea className="input-field min-h-[72px]" value={s.why_intro} onChange={(e) => setSection('why_intro', e.target.value)} />
          <input className="input-field" value={s.why_toggle} onChange={(e) => setSection('why_toggle', e.target.value)} />
          <ListEditor
            items={s.why_items}
            onChange={(v) => setSection('why_items', v)}
            addLabel="Add reason"
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'body', label: 'Description', type: 'textarea' },
            ]}
          />
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">The TUP difference</h2>
          <input className="input-field" value={s.difference_heading} onChange={(e) => setSection('difference_heading', e.target.value)} />
          <textarea className="input-field min-h-[72px]" value={s.difference_intro} onChange={(e) => setSection('difference_intro', e.target.value)} />
          <input className="input-field" value={s.difference_toggle} onChange={(e) => setSection('difference_toggle', e.target.value)} />
          <ListEditor
            items={s.difference_items}
            onChange={(v) => setSection('difference_items', v)}
            addLabel="Add point"
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'body', label: 'Description', type: 'textarea' },
            ]}
          />
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Physiotherapist tiers</h2>
          <input className="input-field" value={s.tiers_heading} onChange={(e) => setSection('tiers_heading', e.target.value)} />
          <textarea className="input-field min-h-[72px]" value={s.tiers_intro} onChange={(e) => setSection('tiers_intro', e.target.value)} />
          <ListEditor
            items={s.tiers}
            onChange={(v) => setSection('tiers', v)}
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
          <textarea className="input-field min-h-[60px]" value={s.tiers_note} onChange={(e) => setSection('tiers_note', e.target.value)} placeholder="Bottom note" />
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">How it works</h2>
          <input className="input-field" value={s.how_heading} onChange={(e) => setSection('how_heading', e.target.value)} />
          <ListEditor
            items={s.how_steps}
            onChange={(v) => setSection('how_steps', v)}
            addLabel="Add step"
            fields={[
              { key: 'title', label: 'Step title' },
              { key: 'body', label: 'Description', type: 'textarea' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input-field" value={s.how_cta_label} onChange={(e) => setSection('how_cta_label', e.target.value)} placeholder="CTA label" />
            <input className="input-field" value={s.how_cta_link} onChange={(e) => setSection('how_cta_link', e.target.value)} placeholder="CTA link" />
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Conditions</h2>
          <input className="input-field" value={s.conditions_heading} onChange={(e) => setSection('conditions_heading', e.target.value)} />
          <Field label="Featured tiles (one per line)">
            <textarea
              className="input-field min-h-[90px]"
              value={(s.conditions_featured || []).join('\n')}
              onChange={(e) => setSection('conditions_featured', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
            />
          </Field>
          <ListEditor
            items={s.conditions_categories}
            onChange={(v) => setSection('conditions_categories', v)}
            addLabel="Add category"
            fields={[
              { key: 'name', label: 'Category name' },
              { key: 'items', label: 'Conditions ( · separated)', type: 'textarea' },
            ]}
          />
          <p className="text-xs text-slate-500">For each category, list conditions separated by · (middle dot) or new lines. They are shown as a joined list on the website.</p>
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Pricing</h2>
          <input className="input-field" value={s.pricing_heading} onChange={(e) => setSection('pricing_heading', e.target.value)} />
          <ListEditor
            items={s.pricing_sessions}
            onChange={(v) => setSection('pricing_sessions', v)}
            addLabel="Add session price"
            fields={[
              { key: 'name', label: 'Tier name' },
              { key: 'original', label: 'Original' },
              { key: 'price', label: 'Current' },
            ]}
          />
          <ListEditor
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
          <textarea className="input-field min-h-[60px]" value={s.pricing_offer} onChange={(e) => setSection('pricing_offer', e.target.value)} placeholder="Offer note" />
          <input className="input-field" value={s.pricing_payment} onChange={(e) => setSection('pricing_payment', e.target.value)} placeholder="Payment methods" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input-field" value={s.pricing_cta_label} onChange={(e) => setSection('pricing_cta_label', e.target.value)} placeholder="CTA label" />
            <input className="input-field" value={s.pricing_cta_link} onChange={(e) => setSection('pricing_cta_link', e.target.value)} placeholder="CTA link" />
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Service areas</h2>
          <input className="input-field" value={s.areas_heading} onChange={(e) => setSection('areas_heading', e.target.value)} />
          <ListEditor
            items={s.areas}
            onChange={(v) => setSection('areas', v)}
            addLabel="Add city"
            fields={[
              { key: 'name', label: 'City' },
              { key: 'localities', label: 'Locality details', type: 'textarea' },
            ]}
          />
          <textarea className="input-field min-h-[60px]" value={s.areas_pincode} onChange={(e) => setSection('areas_pincode', e.target.value)} />
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Testimonials</h2>
          <input className="input-field" value={s.testimonials_heading} onChange={(e) => setSection('testimonials_heading', e.target.value)} />
          <ListEditor
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
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-slate-900">FAQs</h2>
          <input className="input-field" value={s.faq_heading} onChange={(e) => setSection('faq_heading', e.target.value)} />
          <ListEditor
            items={s.faqs}
            onChange={(v) => setSection('faqs', v)}
            addLabel="Add question"
            fields={[
              { key: 'q', label: 'Question' },
              { key: 'a', label: 'Answer', type: 'textarea' },
            ]}
          />
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-3 border-dashed border-violet-200">
          <h2 className="font-bold text-violet-900 text-sm">SEO</h2>
          <input className="input-field text-sm" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="SEO title" />
          <textarea className="input-field text-sm min-h-[60px]" value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} placeholder="SEO description" />
        </section>

        <div className="flex flex-wrap gap-3 sticky bottom-4 z-10">
          <button type="submit" disabled={saving} className="btn-primary !px-8">
            {saving ? 'Saving…' : 'Save Home Physiotherapy page'}
          </button>
        </div>
      </form>
    </AdminDashboardLayout>
  );
}
