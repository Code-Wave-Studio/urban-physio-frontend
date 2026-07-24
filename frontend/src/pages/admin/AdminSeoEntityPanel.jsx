import { useCallback, useEffect, useMemo, useState } from 'react';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { admin, uploadCmsImage } from '../../services/api';
import toast from 'react-hot-toast';

const SCHEMA_TYPES = [
  '',
  'None',
  'WebPage',
  'ItemList',
  'Physician',
  'MedicalClinic',
  'LocalBusiness',
  'FAQPage',
  'Organization',
];

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
}

function GooglePreview({ title, description, path }) {
  const url = `https://theurbanphysio.com${path || '/'}`;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500 mb-2">Google search preview</p>
      <p className="text-[#1a0dab] text-lg leading-snug truncate">{title || 'Page title'}</p>
      <p className="text-[#006621] text-sm truncate">{url}</p>
      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{description || 'Meta description preview…'}</p>
    </div>
  );
}

function SocialPreview({ title, description, image }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <p className="text-xs font-semibold text-slate-500 px-4 pt-3">Social share preview</p>
      <div className="aspect-[1.91/1] bg-slate-100 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-400 text-sm">No OG image</span>
        )}
      </div>
      <div className="p-3 border-t border-slate-100">
        <p className="text-[11px] uppercase text-slate-400 tracking-wide">theurbanphysio.com</p>
        <p className="font-semibold text-slate-900 text-sm line-clamp-2">{title || 'Title'}</p>
        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{description || 'Description'}</p>
      </div>
    </div>
  );
}

const emptyEntity = () => ({
  page_label: '',
  page_path: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  focus_keyword: '',
  h1: '',
  intro_content: '',
  related_keywords: '',
  faq_json: '',
  canonical_url: '',
  robots_index: '',
  robots_follow: '',
  og_title: '',
  og_description: '',
  og_image: '',
  og_type: 'website',
  twitter_title: '',
  twitter_description: '',
  twitter_image: '',
  twitter_card: '',
  schema_type: '',
  schema_json: '',
  image_alt: '',
  image_title: '',
  priority: 0.8,
  changefreq: 'weekly',
  include_in_sitemap: 1,
  is_active: 1,
  is_cornerstone: 0,
  needs_refresh: 0,
  hreflang: 'en-IN',
});

/**
 * Admin SEO panel for doctor / clinic / city entity pages.
 * @param {{ entityType: 'doctor'|'clinic'|'city_clinics'|'city_doctors', title: string, defaultOg?: string }} props
 */
export default function AdminSeoEntityPanel({ entityType, title, defaultOg = '' }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyEntity);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admin.seoEntities({ type: entityType, q: q.trim() || undefined });
      const list = res.data || res || [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(e.message || 'Failed to load entity SEO pages');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, q]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const openRow = (row) => {
    setSelectedId(row.id);
    setForm({ ...emptyEntity(), ...row, seo_score: row.seo_score });
  };

  const save = async (e) => {
    e?.preventDefault?.();
    if (!selectedId) {
      toast.error('Select a page first');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.seo_score;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.id;
      delete payload.entity_type;
      delete payload.entity_id;
      delete payload.page_key;
      const res = await admin.seoEntityUpdate(selectedId, payload);
      const saved = res.data || res;
      toast.success('Entity SEO saved');
      setForm({ ...emptyEntity(), ...saved });
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await admin.seoEntitiesSync();
      const stats = res.data || res || {};
      toast.success(
        `Synced: ${stats.doctors || 0} doctors, ${stats.clinics || 0} clinics, ${stats.city_pages || 0} city pages`
      );
      load();
    } catch (err) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const score = form.seo_score || rows.find((r) => r.id === selectedId)?.seo_score;
  const liveTitle = form.meta_title || form.page_label;
  const liveDesc = form.meta_description || '';
  const liveImage = form.og_image || defaultOg;

  const filteredHint = useMemo(() => {
    if (entityType === 'doctor') return 'Verified doctor public profiles (/doctor/slug)';
    if (entityType === 'clinic') return 'Approved clinic public profiles (/clinic/slug)';
    if (entityType === 'city_clinics') return 'Best physiotherapy clinic in {city}';
    return 'Best physiotherapist in {city}';
  }, [entityType]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filteredHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline text-sm" disabled={syncing} onClick={syncAll}>
            <FaIcon icon="fa-arrows-rotate" className="mr-1.5" />
            {syncing ? 'Syncing…' : 'Sync all entity pages'}
          </button>
          <button type="button" className="btn-outline text-sm" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
        <div className="glass-card !p-4 space-y-3">
          <input
            className="input-field"
            placeholder="Search name, path, keyword…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          <button type="button" className="btn-primary text-sm w-full sm:w-auto" onClick={load}>
            Search
          </button>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              <p>No entity SEO pages yet.</p>
              <p className="mt-1">Click “Sync all entity pages” to create them from approved doctors/clinics/cities.</p>
            </div>
          ) : (
            <ul className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100">
              {rows.map((row) => {
                const s = row.seo_score?.score ?? 0;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => openRow(row)}
                      className={`w-full text-left px-3 py-3 hover:bg-primary-50/60 transition ${
                        selectedId === row.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{row.page_label}</p>
                          <p className="text-xs text-slate-500 truncate">{row.page_path}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreColor(s)}`}>
                          {s}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {!!row.needs_refresh && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Refresh</span>
                        )}
                        {!!row.is_cornerstone && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">Cornerstone</span>
                        )}
                        {!row.include_in_sitemap && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">No sitemap</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form onSubmit={save} className="space-y-4">
          {!selectedId ? (
            <div className="glass-card text-center py-16 text-slate-500 text-sm">
              Select a page from the list to edit SEO fields.
            </div>
          ) : (
            <>
              <div className="glass-card !p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Basic</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input-field sm:col-span-2" value={form.page_label || ''} disabled readOnly />
                  <input className="input-field sm:col-span-2 font-mono text-xs" value={form.page_path || ''} disabled readOnly />
                  <input
                    className="input-field sm:col-span-2"
                    placeholder="Meta title"
                    value={form.meta_title || ''}
                    onChange={(e) => setField('meta_title', e.target.value)}
                  />
                  <textarea
                    className="input-field sm:col-span-2 min-h-[70px]"
                    placeholder="Meta description"
                    value={form.meta_description || ''}
                    onChange={(e) => setField('meta_description', e.target.value)}
                  />
                  <input
                    className="input-field sm:col-span-2"
                    placeholder="Canonical URL (blank = page path)"
                    value={form.canonical_url || ''}
                    onChange={(e) => setField('canonical_url', e.target.value)}
                  />
                  <select className="input-field" value={form.robots_index || ''} onChange={(e) => setField('robots_index', e.target.value)}>
                    <option value="">Robots index (default)</option>
                    <option value="index">index</option>
                    <option value="noindex">noindex</option>
                  </select>
                  <select className="input-field" value={form.robots_follow || ''} onChange={(e) => setField('robots_follow', e.target.value)}>
                    <option value="">Robots follow (default)</option>
                    <option value="follow">follow</option>
                    <option value="nofollow">nofollow</option>
                  </select>
                </div>
              </div>

              <div className="glass-card !p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="Focus keyword"
                    value={form.focus_keyword || ''}
                    onChange={(e) => setField('focus_keyword', e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="Related / LSI keywords"
                    value={form.related_keywords || ''}
                    onChange={(e) => setField('related_keywords', e.target.value)}
                  />
                  <input
                    className="input-field sm:col-span-2"
                    placeholder="H1"
                    value={form.h1 || ''}
                    onChange={(e) => setField('h1', e.target.value)}
                  />
                  <textarea
                    className="input-field sm:col-span-2 min-h-[100px]"
                    placeholder="Intro content (shown on city pages; used for score/word count)"
                    value={form.intro_content || ''}
                    onChange={(e) => setField('intro_content', e.target.value)}
                  />
                  <textarea
                    className="input-field sm:col-span-2 font-mono text-xs min-h-[80px]"
                    placeholder='FAQ JSON e.g. [{"q":"...","a":"..."}]'
                    value={form.faq_json || ''}
                    onChange={(e) => setField('faq_json', e.target.value)}
                  />
                  <input
                    className="input-field sm:col-span-2"
                    placeholder="Meta keywords"
                    value={form.meta_keywords || ''}
                    onChange={(e) => setField('meta_keywords', e.target.value)}
                  />
                </div>
              </div>

              <div className="glass-card !p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Social & images</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="input-field sm:col-span-2"
                    placeholder="OG title"
                    value={form.og_title || ''}
                    onChange={(e) => setField('og_title', e.target.value)}
                  />
                  <textarea
                    className="input-field sm:col-span-2 min-h-[60px]"
                    placeholder="OG description"
                    value={form.og_description || ''}
                    onChange={(e) => setField('og_description', e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <MediaUrlOrUpload
                      label="OG image"
                      hint="Upload or paste URL"
                      icon="fa-image"
                      urlValue={form.og_image || ''}
                      onUrlChange={(url) => setField('og_image', url)}
                      onUpload={uploadCmsImage}
                      accept="image/jpeg,image/png,image/webp"
                      maxMb={4}
                    />
                  </div>
                  <input
                    className="input-field"
                    placeholder="Image alt"
                    value={form.image_alt || ''}
                    onChange={(e) => setField('image_alt', e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="Image title"
                    value={form.image_title || ''}
                    onChange={(e) => setField('image_title', e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="Twitter title"
                    value={form.twitter_title || ''}
                    onChange={(e) => setField('twitter_title', e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="Twitter image"
                    value={form.twitter_image || ''}
                    onChange={(e) => setField('twitter_image', e.target.value)}
                  />
                  <textarea
                    className="input-field sm:col-span-2 min-h-[60px]"
                    placeholder="Twitter description"
                    value={form.twitter_description || ''}
                    onChange={(e) => setField('twitter_description', e.target.value)}
                  />
                </div>
              </div>

              <div className="glass-card !p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schema & advanced</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <select className="input-field" value={form.schema_type || ''} onChange={(e) => setField('schema_type', e.target.value)}>
                    {SCHEMA_TYPES.map((t) => (
                      <option key={t || 'empty'} value={t}>
                        {t || 'Schema type'}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input-field"
                    placeholder="hreflang"
                    value={form.hreflang || 'en-IN'}
                    onChange={(e) => setField('hreflang', e.target.value)}
                  />
                  <input
                    className="input-field"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    placeholder="Sitemap priority"
                    value={form.priority}
                    onChange={(e) => setField('priority', e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="changefreq"
                    value={form.changefreq || ''}
                    onChange={(e) => setField('changefreq', e.target.value)}
                  />
                  <textarea
                    className="input-field sm:col-span-2 font-mono text-xs min-h-[70px]"
                    placeholder="Custom schema JSON (optional)"
                    value={form.schema_json || ''}
                    onChange={(e) => setField('schema_json', e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={!!form.include_in_sitemap} onChange={(e) => setField('include_in_sitemap', e.target.checked ? 1 : 0)} />
                    Include in sitemap
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={!!form.is_active} onChange={(e) => setField('is_active', e.target.checked ? 1 : 0)} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={!!form.is_cornerstone} onChange={(e) => setField('is_cornerstone', e.target.checked ? 1 : 0)} />
                    Cornerstone content
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={!!form.needs_refresh} onChange={(e) => setField('needs_refresh', e.target.checked ? 1 : 0)} />
                    Needs content refresh
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <GooglePreview title={liveTitle} description={liveDesc} path={form.page_path} />
                <SocialPreview title={form.og_title || liveTitle} description={form.og_description || liveDesc} image={liveImage} />
              </div>

              {score && (
                <div className={`glass-card !p-5 border ${scoreColor(score.score || 0)}`}>
                  <p className="font-bold">
                    SEO score: {score.score}/100 ({score.grade})
                    {score.word_count != null && (
                      <span className="font-normal text-sm ml-2">
                        · {score.word_count} words · density {score.keyword_density}% · readability {score.readability_score}
                      </span>
                    )}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(score.suggestions || []).map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                    {!(score.suggestions || []).length && <li>Looking solid — keep content fresh.</li>}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save entity SEO'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
