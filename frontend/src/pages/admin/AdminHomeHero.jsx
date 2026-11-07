import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { admin, uploadCmsImage } from '../../services/api';
import { unwrapApiData } from '../../utils/contactText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { HERO_CONFIG_KEY, parseHeroConfig, serializeHeroConfig } from '../../constants/heroConfig';
import toast from 'react-hot-toast';

const MAX_SLIDES = 6;

const DEFAULT_POINTS = [
  { label: 'BPT/MPT qualified', icon: 'fa-circle-check' },
  { label: 'From ₹999 a session', icon: 'fa-circle-check' },
  { label: 'Male/Female physios', icon: 'fa-circle-check' },
  { label: 'Switch home ⇄ online', icon: 'fa-circle-check' },
];

const emptyForm = () => ({
  badge_text: '',
  title_prefix: '',
  title_highlight: '',
  subtitle: '',
  feature_pills: DEFAULT_POINTS,
});

function Section({ title, hint, children, action }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function AdminHomeHero() {
  const [form, setForm] = useState(emptyForm);
  const [config, setConfig] = useState(() => parseHeroConfig(null));
  const [sectionImages, setSectionImages] = useState({});
  const [tagsText, setTagsText] = useState(''); // popular tags: not shown in the hero any more, kept as-is on save
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .heroSettings()
      .then((res) => {
        const d = unwrapApiData(res);
        const tags = Array.isArray(d.popular_tags) ? d.popular_tags : [];
        const images = d.section_images && typeof d.section_images === 'object' ? d.section_images : {};
        setForm({
          badge_text: d.badge_text || '',
          title_prefix: d.title_prefix || '',
          title_highlight: d.title_highlight || '',
          subtitle: d.subtitle || '',
          feature_pills: Array.isArray(d.feature_pills) ? d.feature_pills : DEFAULT_POINTS,
        });
        setSectionImages(images);
        setConfig(parseHeroConfig(images[HERO_CONFIG_KEY]));
        setTagsText(tags.join('\n'));
      })
      .catch((e) => toast.error(e.message || 'Could not load hero settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setGroup = (group, key, value) => setConfig((c) => ({ ...c, [group]: { ...c[group], [key]: value } }));

  // Slides
  const setSlide = (i, key, value) =>
    setConfig((c) => ({ ...c, slides: c.slides.map((s, j) => (j === i ? { ...s, [key]: value } : s)) }));
  const addSlide = () =>
    setConfig((c) => ({ ...c, slides: [...c.slides, { image: '', title: '', link: '/' }].slice(0, MAX_SLIDES) }));
  const removeSlide = (i) => setConfig((c) => ({ ...c, slides: c.slides.filter((_, j) => j !== i) }));
  const moveSlide = (i, dir) =>
    setConfig((c) => {
      const slides = [...c.slides];
      const j = i + dir;
      if (j < 0 || j >= slides.length) return c;
      [slides[i], slides[j]] = [slides[j], slides[i]];
      return { ...c, slides };
    });

  // Avatars
  const setAvatar = (i, url) =>
    setConfig((c) => {
      const avatars = [...(c.patients.avatars || ['', '', ''])];
      avatars[i] = url;
      return { ...c, patients: { ...c.patients, avatars } };
    });

  // Proof points
  const setPoint = (i, value) =>
    setForm((f) => ({ ...f, feature_pills: f.feature_pills.map((p, j) => (j === i ? { ...p, label: value } : p)) }));
  const addPoint = () =>
    setForm((f) => ({ ...f, feature_pills: [...f.feature_pills, { label: '', icon: 'fa-circle-check' }] }));
  const removePoint = (i) => setForm((f) => ({ ...f, feature_pills: f.feature_pills.filter((_, j) => j !== i) }));

  const save = async (e) => {
    e.preventDefault();
    const slides = config.slides.filter((s) => s.image);
    if (!slides.length) {
      toast.error('Add at least one slide with an image');
      return;
    }
    const tags = tagsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const stored = serializeHeroConfig({ ...config, slides });
    setSaving(true);
    try {
      await admin.updateHeroSettings({
        ...form,
        popular_tags: tags,
        feature_pills: form.feature_pills
          .filter((p) => p.label?.trim())
          .map((p) => ({ label: p.label.trim(), icon: p.icon || 'fa-circle-check' })),
        section_images: { ...sectionImages, [HERO_CONFIG_KEY]: stored },
      });
      // Confirm the server kept the slider/rating settings, not just the basic fields.
      const check = unwrapApiData(await admin.heroSettings());
      const kept = check?.section_images?.[HERO_CONFIG_KEY];
      const same = typeof kept === 'string' ? kept === stored : kept && JSON.stringify(kept) === stored;
      if (same) toast.success('Homepage hero saved');
      else toast.error('Text saved, but the server did not keep the slider, buttons or rating. Ask your developer to allow section_images.hero_config.', { duration: 9000 });
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-house-medical-circle-check" className="text-[#376299]" />
            Homepage hero
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Slider, buttons, Google rating, patient count and the points under the buttons. Leave a rating or patient
            number empty to hide it.
          </p>
        </div>

        {loading ? (
          <div className="glass-card h-72 animate-pulse bg-white/40" />
        ) : (
          <form onSubmit={save} className="glass-card !p-6 md:!p-8 space-y-8">
            <Section
              title="Slider"
              hint={`Up to ${MAX_SLIDES} slides. Wide photos work best (16:9, at least 1600×900). Keep headlines under ~35 characters.`}
              action={
                config.slides.length < MAX_SLIDES && (
                  <button type="button" onClick={addSlide} className="text-xs font-semibold text-[#376299] hover:underline shrink-0">
                    + Add slide
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {config.slides.map((s, i) => {
                  const preview = resolveMediaUrl(s.image) || s.image;
                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Slide {i + 1}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveSlide(i, -1)} disabled={i === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Move up">
                            <FaIcon icon="fa-arrow-up" />
                          </button>
                          <button type="button" onClick={() => moveSlide(i, 1)} disabled={i === config.slides.length - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Move down">
                            <FaIcon icon="fa-arrow-down" />
                          </button>
                          <button type="button" onClick={() => removeSlide(i)} className="p-1.5 text-slate-400 hover:text-red-600" aria-label="Remove slide">
                            <FaIcon icon="fa-trash" />
                          </button>
                        </div>
                      </div>
                      {preview && (
                        <div className="relative rounded-xl overflow-hidden aspect-[16/9] max-w-md bg-slate-100">
                          <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/70" />
                          <span className="absolute left-3 bottom-2 right-3 text-white font-bold text-sm leading-tight">{s.title}</span>
                        </div>
                      )}
                      <MediaUrlOrUpload
                        label="Image URL or upload"
                        icon="fa-image"
                        accent="primary"
                        urlValue={s.image}
                        onUrlChange={(v) => setSlide(i, 'image', v)}
                        onUpload={(file) => uploadCmsImage(file)}
                        accept="image/jpeg,image/png,image/webp"
                        maxMb={4}
                        preview="none"
                      />
                      <div className="grid sm:grid-cols-[1fr_200px] gap-3">
                        <Field label="Headline">
                          <input className="input-field" value={s.title} maxLength={60} onChange={(e) => setSlide(i, 'title', e.target.value)} />
                        </Field>
                        <Field label="Opens page">
                          <input className="input-field" placeholder="/home-physiotherapy" value={s.link} onChange={(e) => setSlide(i, 'link', e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">The first slide's headline is the page's main heading for Google, so keep "physiotherapy" in it.</p>
            </Section>

            <Section title="Buttons" hint="The two buttons under the search bar.">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-500">Main button (blue)</span>
                  <Field label="Text">
                    <input className="input-field" maxLength={22} value={config.primary_button.label} onChange={(e) => setGroup('primary_button', 'label', e.target.value)} />
                  </Field>
                  <Field label="Opens page">
                    <input className="input-field" value={config.primary_button.link} onChange={(e) => setGroup('primary_button', 'link', e.target.value)} />
                  </Field>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-500">Second button (light)</span>
                  <Field label="Text">
                    <input className="input-field" maxLength={22} value={config.secondary_button.label} onChange={(e) => setGroup('secondary_button', 'label', e.target.value)} />
                  </Field>
                  <Field label="Opens page">
                    <input className="input-field" value={config.secondary_button.link} onChange={(e) => setGroup('secondary_button', 'link', e.target.value)} />
                  </Field>
                </div>
              </div>
            </Section>

            <Section title="Google rating" hint="Use your real Google Business rating. Leave the rating empty to hide it.">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Rating">
                  <input className="input-field" placeholder="4.8" value={config.rating.value} onChange={(e) => setGroup('rating', 'value', e.target.value)} />
                </Field>
                <Field label="Number of reviews (optional)">
                  <input className="input-field" placeholder="120" value={config.rating.reviews} onChange={(e) => setGroup('rating', 'reviews', e.target.value)} />
                </Field>
                <Field label="Label">
                  <input className="input-field" placeholder="Google rating" value={config.rating.label} onChange={(e) => setGroup('rating', 'label', e.target.value)} />
                </Field>
                <Field label="Google reviews link (optional)">
                  <input className="input-field" placeholder="https://g.page/r/…" value={config.rating.url} onChange={(e) => setGroup('rating', 'url', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Patients" hint="Leave the number empty to hide it. Use photos only of patients who agreed, or leave them empty for icons.">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Number">
                  <input className="input-field" placeholder="2.5K+" value={config.patients.value} onChange={(e) => setGroup('patients', 'value', e.target.value)} />
                </Field>
                <Field label="Label">
                  <input className="input-field" placeholder="Happy patients" value={config.patients.label} onChange={(e) => setGroup('patients', 'label', e.target.value)} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => {
                  const url = config.patients.avatars?.[i] || '';
                  const preview = resolveMediaUrl(url) || url;
                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white/70 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <FaIcon icon="fa-user" />}
                        </span>
                        <span className="text-xs font-bold text-slate-500">Photo {i + 1}</span>
                        {url && (
                          <button type="button" onClick={() => setAvatar(i, '')} className="ml-auto text-xs text-slate-400 hover:text-red-600">
                            Remove
                          </button>
                        )}
                      </div>
                      <MediaUrlOrUpload
                        label="Square photo"
                        icon="fa-user"
                        accent="primary"
                        urlValue={url}
                        onUrlChange={(v) => setAvatar(i, v)}
                        onUpload={(file) => uploadCmsImage(file)}
                        accept="image/jpeg,image/png,image/webp"
                        maxMb={2}
                        preview="none"
                      />
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section
              title="Points under the buttons"
              hint="Short, one line each. Four fit best."
              action={
                <button type="button" onClick={addPoint} className="text-xs font-semibold text-[#376299] hover:underline shrink-0">
                  + Add point
                </button>
              }
            >
              <div className="space-y-2">
                {form.feature_pills.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <FaIcon icon="fa-circle-check" className="text-emerald-500" />
                    <input className="input-field flex-1" maxLength={32} value={p.label} onChange={(e) => setPoint(i, e.target.value)} />
                    <button type="button" onClick={() => removePoint(i)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Remove point">
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Desktop headline" hint="Shown on laptops and desktops only, beside the slider. On phones the slide headlines take its place.">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="First line">
                  <input className="input-field" placeholder="Book a physio" value={form.title_prefix} onChange={(e) => set('title_prefix', e.target.value)} />
                </Field>
                <Field label="Second line (blue)">
                  <input className="input-field" placeholder="in minutes." value={form.title_highlight} onChange={(e) => set('title_highlight', e.target.value)} />
                </Field>
              </div>
              <Field label="Line under the headline">
                <input className="input-field" placeholder="At home, in clinic or online across Noida." value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
              </Field>
            </Section>

            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save homepage hero'}
            </button>
          </form>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
