import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'pages', label: 'Pages', icon: 'fa-file-lines' },
  { id: 'settings', label: 'Global', icon: 'fa-sliders' },
  { id: 'social', label: 'Social & Schema', icon: 'fa-share-nodes' },
  { id: 'robots', label: 'Sitemap & Robots', icon: 'fa-robot' },
  { id: 'redirects', label: 'Redirects', icon: 'fa-arrows-turn-right' },
  { id: 'monitor', label: '404 & Links', icon: 'fa-link-slash' },
  { id: 'checklist', label: 'Checklist', icon: 'fa-list-check' },
];

const SCHEMA_TYPES = [
  '',
  'None',
  'WebSite',
  'Organization',
  'BreadcrumbList',
  'Article',
  'FAQPage',
  'LocalBusiness',
  'Physician',
  'MedicalClinic',
  'ItemList',
  'WebPage',
];

const emptyPage = () => ({
  page_key: '',
  page_path: '',
  page_label: '',
  custom_slug: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  focus_keyword: '',
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
  schema_type: 'WebPage',
  schema_json: '',
  breadcrumb_json: '',
  image_alt: '',
  image_title: '',
  is_active: 1,
  include_in_sitemap: 1,
  priority: 0.5,
  changefreq: 'weekly',
});

const emptySettings = () => ({
  site_name: 'The Urban Physio',
  default_title: '',
  default_description: '',
  default_keywords: '',
  title_separator: '|',
  default_og_image: '',
  twitter_handle: '',
  twitter_card_type: 'summary_large_image',
  default_robots_index: 'index',
  default_robots_follow: 'follow',
  canonical_base_url: '',
  organization_name: 'The Urban Physio',
  organization_logo: '',
  organization_phone: '',
  organization_email: '',
  organization_address: '',
  organization_same_as: [],
  schema_organization_enabled: 1,
  schema_website_enabled: 1,
  schema_local_business_enabled: 1,
  local_business_type: 'MedicalBusiness',
  local_business_lat: '',
  local_business_lng: '',
  local_business_price_range: '₹₹',
  robots_txt: '',
  sitemap_enabled: 1,
  sitemap_include_images: 0,
  google_search_console_code: '',
  google_analytics_id: '',
  google_tag_manager_id: '',
  bing_webmaster_code: '',
  auto_meta_enabled: 1,
  breadcrumb_enabled: 1,
  og_enabled: 1,
  twitter_enabled: 1,
});

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

export default function AdminSeo() {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [settings, setSettings] = useState(emptySettings);
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pageForm, setPageForm] = useState(emptyPage);
  const [redirects, setRedirects] = useState([]);
  const [redirectForm, setRedirectForm] = useState({ from_path: '', to_url: '', status_code: 301, notes: '' });
  const [logs404, setLogs404] = useState([]);
  const [broken, setBroken] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [sitemapStatus, setSitemapStatus] = useState(null);
  const [sameAsText, setSameAsText] = useState('');

  const selectedScore = pageForm?.seo_score || (selectedId && pages.find((p) => p.id === selectedId)?.seo_score);

  const loadCore = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, sett, pageList] = await Promise.all([
        admin.seoDashboard(),
        admin.seoSettings(),
        admin.seoPages(),
      ]);
      setDashboard(dash.data || dash);
      const s = { ...emptySettings(), ...(sett.data || sett) };
      setSettings(s);
      setSameAsText(Array.isArray(s.organization_same_as) ? s.organization_same_as.join('\n') : '');
      const list = pageList.data || pageList || [];
      setPages(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(e.message || 'Failed to load SEO module');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (tab === 'redirects') {
      admin.seoRedirects().then((r) => setRedirects(r.data || r || [])).catch(() => {});
    }
    if (tab === 'monitor') {
      Promise.all([admin.seo404Logs({ limit: 100 }), admin.seoBrokenLinks()])
        .then(([a, b]) => {
          setLogs404(a.data || a || []);
          setBroken(b.data || b || []);
        })
        .catch(() => {});
    }
    if (tab === 'checklist') {
      admin.seoChecklist().then((r) => setChecklist(r.data || r)).catch(() => {});
    }
    if (tab === 'robots') {
      admin.seoSitemapStatus().then((r) => setSitemapStatus(r.data || r)).catch(() => {});
    }
  }, [tab]);

  const setSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const setPageField = (key, value) => setPageForm((f) => ({ ...f, [key]: value }));

  const openPage = (page) => {
    setSelectedId(page.id);
    setPageForm({ ...emptyPage(), ...page, seo_score: page.seo_score });
    setTab('pages');
  };

  const newPage = () => {
    setSelectedId(null);
    setPageForm(emptyPage());
    setTab('pages');
  };

  const saveSettings = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        organization_same_as: sameAsText
          .split(/[\r\n,]+/)
          .map((x) => x.trim())
          .filter(Boolean),
      };
      const res = await admin.updateSeoSettings(payload);
      const s = { ...emptySettings(), ...(res.data || res) };
      setSettings(s);
      setSameAsText(Array.isArray(s.organization_same_as) ? s.organization_same_as.join('\n') : '');
      toast.success('SEO settings saved');
      loadCore();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const savePage = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const payload = { ...pageForm };
      delete payload.seo_score;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.id;
      let res;
      if (selectedId) {
        res = await admin.seoPageUpdate(selectedId, payload);
      } else {
        res = await admin.seoPageCreate(payload);
      }
      const saved = res.data || res;
      toast.success(selectedId ? 'Page SEO updated' : 'Page SEO created');
      setSelectedId(saved.id);
      setPageForm({ ...emptyPage(), ...saved });
      const list = await admin.seoPages();
      setPages(list.data || list || []);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const autoGenerate = async () => {
    if (!selectedId) {
      toast.error('Save the page first, then auto-generate');
      return;
    }
    try {
      const res = await admin.seoPageAutoGenerate(selectedId);
      const saved = res.data || res;
      setPageForm({ ...emptyPage(), ...saved });
      toast.success('Meta auto-generated');
      const list = await admin.seoPages();
      setPages(list.data || list || []);
    } catch (err) {
      toast.error(err.message || 'Auto-generate failed');
    }
  };

  const deletePage = async () => {
    if (!selectedId || !window.confirm('Delete this SEO page record?')) return;
    try {
      await admin.seoPageDelete(selectedId);
      toast.success('Deleted');
      setSelectedId(null);
      setPageForm(emptyPage());
      loadCore();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const saveRedirect = async (e) => {
    e.preventDefault();
    try {
      await admin.seoRedirectCreate(redirectForm);
      toast.success('Redirect added');
      setRedirectForm({ from_path: '', to_url: '', status_code: 301, notes: '' });
      const r = await admin.seoRedirects();
      setRedirects(r.data || r || []);
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const liveTitle = pageForm.meta_title || settings.default_title;
  const liveDesc = pageForm.meta_description || settings.default_description;
  const liveImage = pageForm.og_image || settings.default_og_image;

  const statusBadge = useMemo(() => {
    const s = dashboard?.status;
    if (s === 'excellent') return 'bg-emerald-100 text-emerald-800';
    if (s === 'good') return 'bg-sky-100 text-sky-800';
    return 'bg-amber-100 text-amber-900';
  }, [dashboard]);

  return (
    <AdminDashboardLayout>
      <div className="max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">SEO Module</h1>
            <p className="text-slate-600 text-sm">
              Manage meta tags, slugs, sitemap, robots.txt, schema, redirects, and technical SEO.
            </p>
          </div>
          {dashboard && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusBadge}`}>
              Overall: {dashboard.status?.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                tab === t.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FaIcon icon={t.icon} />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass-card h-64 animate-pulse bg-white/40" />
        ) : (
          <>
            {tab === 'dashboard' && dashboard && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Avg SEO score', value: dashboard.avg_seo_score, icon: 'fa-chart-simple' },
                    { label: 'Managed pages', value: dashboard.pages_total, icon: 'fa-file' },
                    { label: '404 hits tracked', value: dashboard.logs_404, icon: 'fa-circle-exclamation' },
                    { label: 'Broken links', value: dashboard.broken_links, icon: 'fa-link-slash' },
                  ].map((c) => (
                    <div key={c.label} className="glass-card !p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
                        <FaIcon icon={c.icon} />
                        {c.label}
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    ['Sitemap', dashboard.sitemap_enabled],
                    ['robots.txt', dashboard.robots_configured],
                    ['Search Console', dashboard.gsc_configured],
                    ['Analytics', dashboard.ga_configured],
                    ['Open Graph', dashboard.og_enabled],
                    ['Schema', dashboard.schema_enabled],
                  ].map(([label, ok]) => (
                    <div key={label} className="glass-card !p-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                      <span className={`text-xs font-bold ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {ok ? 'Ready' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
                {dashboard.checklist && (
                  <div className="glass-card !p-5">
                    <h2 className="font-bold text-slate-900 mb-2">
                      Technical checklist — {dashboard.checklist.percent}%
                    </h2>
                    <div className="h-2 rounded-full bg-slate-100 mb-4 overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${dashboard.checklist.percent}%` }}
                      />
                    </div>
                    <ul className="space-y-2">
                      {(dashboard.checklist.items || []).map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm">
                          <FaIcon
                            icon={item.done ? 'fa-circle-check' : 'fa-circle'}
                            className={item.done ? 'text-emerald-600 mt-0.5' : 'text-slate-300 mt-0.5'}
                          />
                          <div>
                            <p className="font-medium text-slate-800">{item.label}</p>
                            {!item.done && <p className="text-xs text-slate-500">{item.tip}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === 'pages' && (
              <div className="grid lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 glass-card !p-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-slate-900 text-sm">Pages</h2>
                    <button type="button" className="btn-outline !py-1 !px-2 text-xs" onClick={newPage}>
                      + New
                    </button>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto space-y-1">
                    {pages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => openPage(p)}
                        className={`w-full text-left rounded-lg px-3 py-2 border ${
                          selectedId === p.id
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-slate-800 truncate">{p.page_label}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${scoreColor(
                              p.seo_score?.score || 0
                            )}`}
                          >
                            {p.seo_score?.score ?? 0}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{p.page_path}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={savePage} className="lg:col-span-3 space-y-4">
                  <div className="glass-card !p-5 space-y-3">
                    <div className="flex flex-wrap gap-2 justify-between items-center">
                      <h2 className="font-bold text-slate-900">
                        {selectedId ? 'Edit page SEO' : 'New page SEO'}
                      </h2>
                      <div className="flex gap-2">
                        {selectedId && (
                          <>
                            <button type="button" className="btn-outline !py-1.5 text-xs" onClick={autoGenerate}>
                              Auto meta
                            </button>
                            <button type="button" className="btn-outline !py-1.5 text-xs text-rose-600" onClick={deletePage}>
                              Delete
                            </button>
                          </>
                        )}
                        <button type="submit" className="btn-primary !py-1.5 text-xs" disabled={saving}>
                          {saving ? 'Saving…' : 'Save page'}
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="input-field" placeholder="Label *" value={pageForm.page_label} onChange={(e) => setPageField('page_label', e.target.value)} required />
                      <input className="input-field" placeholder="Key * (home)" value={pageForm.page_key} onChange={(e) => setPageField('page_key', e.target.value)} required disabled={!!selectedId} />
                      <input className="input-field" placeholder="Path * (/about)" value={pageForm.page_path} onChange={(e) => setPageField('page_path', e.target.value)} required />
                      <input className="input-field" placeholder="Custom slug note" value={pageForm.custom_slug || ''} onChange={(e) => setPageField('custom_slug', e.target.value)} />
                      <input className="input-field sm:col-span-2" placeholder="Meta title" value={pageForm.meta_title || ''} onChange={(e) => setPageField('meta_title', e.target.value)} />
                      <textarea className="input-field sm:col-span-2 min-h-[70px]" placeholder="Meta description" value={pageForm.meta_description || ''} onChange={(e) => setPageField('meta_description', e.target.value)} />
                      <input className="input-field" placeholder="Focus keyword" value={pageForm.focus_keyword || ''} onChange={(e) => setPageField('focus_keyword', e.target.value)} />
                      <input className="input-field" placeholder="Keywords" value={pageForm.meta_keywords || ''} onChange={(e) => setPageField('meta_keywords', e.target.value)} />
                      <input className="input-field sm:col-span-2" placeholder="Canonical URL" value={pageForm.canonical_url || ''} onChange={(e) => setPageField('canonical_url', e.target.value)} />
                      <select className="input-field" value={pageForm.robots_index || ''} onChange={(e) => setPageField('robots_index', e.target.value)}>
                        <option value="">Robots index (default)</option>
                        <option value="index">index</option>
                        <option value="noindex">noindex</option>
                      </select>
                      <select className="input-field" value={pageForm.robots_follow || ''} onChange={(e) => setPageField('robots_follow', e.target.value)}>
                        <option value="">Robots follow (default)</option>
                        <option value="follow">follow</option>
                        <option value="nofollow">nofollow</option>
                      </select>
                    </div>
                  </div>

                  <div className="glass-card !p-5 space-y-3">
                    <h3 className="font-bold text-sm text-slate-800">Open Graph & Twitter</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="input-field sm:col-span-2" placeholder="OG title" value={pageForm.og_title || ''} onChange={(e) => setPageField('og_title', e.target.value)} />
                      <textarea className="input-field sm:col-span-2 min-h-[60px]" placeholder="OG description" value={pageForm.og_description || ''} onChange={(e) => setPageField('og_description', e.target.value)} />
                      <input className="input-field sm:col-span-2" placeholder="OG image URL" value={pageForm.og_image || ''} onChange={(e) => setPageField('og_image', e.target.value)} />
                      <input className="input-field" placeholder="Twitter title" value={pageForm.twitter_title || ''} onChange={(e) => setPageField('twitter_title', e.target.value)} />
                      <input className="input-field" placeholder="Twitter image URL" value={pageForm.twitter_image || ''} onChange={(e) => setPageField('twitter_image', e.target.value)} />
                      <textarea className="input-field sm:col-span-2 min-h-[60px]" placeholder="Twitter description" value={pageForm.twitter_description || ''} onChange={(e) => setPageField('twitter_description', e.target.value)} />
                    </div>
                  </div>

                  <div className="glass-card !p-5 space-y-3">
                    <h3 className="font-bold text-sm text-slate-800">Schema, image SEO & sitemap</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <select className="input-field" value={pageForm.schema_type || ''} onChange={(e) => setPageField('schema_type', e.target.value)}>
                        {SCHEMA_TYPES.map((t) => (
                          <option key={t || 'empty'} value={t}>
                            {t || 'Schema type'}
                          </option>
                        ))}
                      </select>
                      <input className="input-field" placeholder="Priority 0–1" type="number" step="0.1" min="0" max="1" value={pageForm.priority} onChange={(e) => setPageField('priority', e.target.value)} />
                      <input className="input-field" placeholder="Image alt text" value={pageForm.image_alt || ''} onChange={(e) => setPageField('image_alt', e.target.value)} />
                      <input className="input-field" placeholder="Image title" value={pageForm.image_title || ''} onChange={(e) => setPageField('image_title', e.target.value)} />
                      <textarea className="input-field sm:col-span-2 font-mono text-xs min-h-[80px]" placeholder='Custom schema JSON (optional)' value={pageForm.schema_json || ''} onChange={(e) => setPageField('schema_json', e.target.value)} />
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={!!pageForm.is_active} onChange={(e) => setPageField('is_active', e.target.checked ? 1 : 0)} />
                        Active
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={!!pageForm.include_in_sitemap} onChange={(e) => setPageField('include_in_sitemap', e.target.checked ? 1 : 0)} />
                        Include in sitemap
                      </label>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <GooglePreview title={liveTitle} description={liveDesc} path={pageForm.page_path} />
                    <SocialPreview title={pageForm.og_title || liveTitle} description={pageForm.og_description || liveDesc} image={liveImage} />
                  </div>

                  {(selectedScore || pageForm.seo_score) && (
                    <div className={`glass-card !p-5 border ${scoreColor((selectedScore || pageForm.seo_score).score || 0)}`}>
                      <h3 className="font-bold mb-1">
                        SEO score: {(selectedScore || pageForm.seo_score).score}/100 (
                        {(selectedScore || pageForm.seo_score).grade})
                      </h3>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {((selectedScore || pageForm.seo_score).suggestions || []).map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                        {!((selectedScore || pageForm.seo_score).suggestions || []).length && (
                          <li>Looking good — no critical suggestions.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </form>
              </div>
            )}

            {(tab === 'settings' || tab === 'social') && (
              <form onSubmit={saveSettings} className="space-y-4">
                {tab === 'settings' && (
                  <>
                    <div className="glass-card !p-5 space-y-3">
                      <h2 className="font-bold text-slate-900">Default meta</h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input className="input-field" placeholder="Site name" value={settings.site_name} onChange={(e) => setSetting('site_name', e.target.value)} />
                        <input className="input-field" placeholder="Title separator" value={settings.title_separator} onChange={(e) => setSetting('title_separator', e.target.value)} />
                        <input className="input-field sm:col-span-2" placeholder="Default title" value={settings.default_title} onChange={(e) => setSetting('default_title', e.target.value)} />
                        <textarea className="input-field sm:col-span-2 min-h-[70px]" placeholder="Default description" value={settings.default_description} onChange={(e) => setSetting('default_description', e.target.value)} />
                        <input className="input-field sm:col-span-2" placeholder="Default keywords" value={settings.default_keywords || ''} onChange={(e) => setSetting('default_keywords', e.target.value)} />
                        <input className="input-field sm:col-span-2" placeholder="Canonical base URL" value={settings.canonical_base_url || ''} onChange={(e) => setSetting('canonical_base_url', e.target.value)} />
                        <select className="input-field" value={settings.default_robots_index} onChange={(e) => setSetting('default_robots_index', e.target.value)}>
                          <option value="index">Default index</option>
                          <option value="noindex">Default noindex</option>
                        </select>
                        <select className="input-field" value={settings.default_robots_follow} onChange={(e) => setSetting('default_robots_follow', e.target.value)}>
                          <option value="follow">Default follow</option>
                          <option value="nofollow">Default nofollow</option>
                        </select>
                      </div>
                    </div>
                    <div className="glass-card !p-5 space-y-3">
                      <h2 className="font-bold text-slate-900">Google / Bing</h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input className="input-field sm:col-span-2" placeholder="Google Search Console verification code" value={settings.google_search_console_code || ''} onChange={(e) => setSetting('google_search_console_code', e.target.value)} />
                        <input className="input-field" placeholder="GA4 ID (G-XXXX)" value={settings.google_analytics_id || ''} onChange={(e) => setSetting('google_analytics_id', e.target.value)} />
                        <input className="input-field" placeholder="GTM ID (GTM-XXXX)" value={settings.google_tag_manager_id || ''} onChange={(e) => setSetting('google_tag_manager_id', e.target.value)} />
                        <input className="input-field sm:col-span-2" placeholder="Bing Webmaster code" value={settings.bing_webmaster_code || ''} onChange={(e) => setSetting('bing_webmaster_code', e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {tab === 'social' && (
                  <>
                    <div className="glass-card !p-5 space-y-3">
                      <h2 className="font-bold text-slate-900">Open Graph & Twitter defaults</h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input className="input-field sm:col-span-2" placeholder="Default OG image URL" value={settings.default_og_image || ''} onChange={(e) => setSetting('default_og_image', e.target.value)} />
                        <input className="input-field" placeholder="Twitter @handle" value={settings.twitter_handle || ''} onChange={(e) => setSetting('twitter_handle', e.target.value)} />
                        <select className="input-field" value={settings.twitter_card_type} onChange={(e) => setSetting('twitter_card_type', e.target.value)}>
                          <option value="summary_large_image">summary_large_image</option>
                          <option value="summary">summary</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.og_enabled} onChange={(e) => setSetting('og_enabled', e.target.checked ? 1 : 0)} /> OG enabled</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.twitter_enabled} onChange={(e) => setSetting('twitter_enabled', e.target.checked ? 1 : 0)} /> Twitter cards enabled</label>
                      </div>
                      <SocialPreview title={settings.default_title} description={settings.default_description} image={settings.default_og_image} />
                    </div>
                    <div className="glass-card !p-5 space-y-3">
                      <h2 className="font-bold text-slate-900">Organization / Local Business schema</h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input className="input-field" placeholder="Organization name" value={settings.organization_name || ''} onChange={(e) => setSetting('organization_name', e.target.value)} />
                        <input className="input-field" placeholder="Logo URL" value={settings.organization_logo || ''} onChange={(e) => setSetting('organization_logo', e.target.value)} />
                        <input className="input-field" placeholder="Phone" value={settings.organization_phone || ''} onChange={(e) => setSetting('organization_phone', e.target.value)} />
                        <input className="input-field" placeholder="Email" value={settings.organization_email || ''} onChange={(e) => setSetting('organization_email', e.target.value)} />
                        <textarea className="input-field sm:col-span-2" rows={2} placeholder="Address" value={settings.organization_address || ''} onChange={(e) => setSetting('organization_address', e.target.value)} />
                        <textarea className="input-field sm:col-span-2" rows={3} placeholder="sameAs social URLs (one per line)" value={sameAsText} onChange={(e) => setSameAsText(e.target.value)} />
                        <input className="input-field" placeholder="Business type" value={settings.local_business_type || ''} onChange={(e) => setSetting('local_business_type', e.target.value)} />
                        <input className="input-field" placeholder="Price range" value={settings.local_business_price_range || ''} onChange={(e) => setSetting('local_business_price_range', e.target.value)} />
                        <input className="input-field" placeholder="Latitude" value={settings.local_business_lat || ''} onChange={(e) => setSetting('local_business_lat', e.target.value)} />
                        <input className="input-field" placeholder="Longitude" value={settings.local_business_lng || ''} onChange={(e) => setSetting('local_business_lng', e.target.value)} />
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.schema_organization_enabled} onChange={(e) => setSetting('schema_organization_enabled', e.target.checked ? 1 : 0)} /> Organization</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.schema_website_enabled} onChange={(e) => setSetting('schema_website_enabled', e.target.checked ? 1 : 0)} /> Website</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.schema_local_business_enabled} onChange={(e) => setSetting('schema_local_business_enabled', e.target.checked ? 1 : 0)} /> Local Business</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.breadcrumb_enabled} onChange={(e) => setSetting('breadcrumb_enabled', e.target.checked ? 1 : 0)} /> Breadcrumbs</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.auto_meta_enabled} onChange={(e) => setSetting('auto_meta_enabled', e.target.checked ? 1 : 0)} /> Auto meta</label>
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save settings'}
                </button>
              </form>
            )}

            {tab === 'robots' && (
              <form onSubmit={saveSettings} className="space-y-4">
                <div className="glass-card !p-5 space-y-3">
                  <h2 className="font-bold text-slate-900">XML Sitemap</h2>
                  {sitemapStatus && (
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>
                        URL:{' '}
                        <a className="text-primary-600 underline break-all" href={sitemapStatus.url} target="_blank" rel="noreferrer">
                          {sitemapStatus.url}
                        </a>
                      </p>
                      <p>Managed static pages in sitemap: {sitemapStatus.managed_pages}</p>
                      <p>{sitemapStatus.last_hint}</p>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!settings.sitemap_enabled} onChange={(e) => setSetting('sitemap_enabled', e.target.checked ? 1 : 0)} />
                    Sitemap enabled
                  </label>
                </div>
                <div className="glass-card !p-5 space-y-3">
                  <h2 className="font-bold text-slate-900">robots.txt editor</h2>
                  <p className="text-xs text-slate-500">
                    Saved to database and served live via <code>/backend/api/seo/robots.txt</code> (proxied from Cloudflare).
                  </p>
                  <textarea
                    className="input-field font-mono text-xs min-h-[220px]"
                    value={settings.robots_txt || ''}
                    onChange={(e) => setSetting('robots_txt', e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save sitemap & robots'}
                </button>
              </form>
            )}

            {tab === 'redirects' && (
              <div className="space-y-4">
                <form onSubmit={saveRedirect} className="glass-card !p-5 grid sm:grid-cols-2 gap-3">
                  <h2 className="font-bold text-slate-900 sm:col-span-2">301 Redirect manager</h2>
                  <input className="input-field" placeholder="From path (/old-page)" value={redirectForm.from_path} onChange={(e) => setRedirectForm((f) => ({ ...f, from_path: e.target.value }))} required />
                  <input className="input-field" placeholder="To URL or path" value={redirectForm.to_url} onChange={(e) => setRedirectForm((f) => ({ ...f, to_url: e.target.value }))} required />
                  <select className="input-field" value={redirectForm.status_code} onChange={(e) => setRedirectForm((f) => ({ ...f, status_code: Number(e.target.value) }))}>
                    <option value={301}>301</option>
                    <option value={302}>302</option>
                    <option value={307}>307</option>
                    <option value={308}>308</option>
                  </select>
                  <input className="input-field" placeholder="Notes" value={redirectForm.notes} onChange={(e) => setRedirectForm((f) => ({ ...f, notes: e.target.value }))} />
                  <button type="submit" className="btn-primary sm:col-span-2">Add redirect</button>
                </form>
                <div className="glass-card !p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">From</th>
                        <th className="px-4 py-3">To</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Hits</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {redirects.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-mono text-xs">{r.from_path}</td>
                          <td className="px-4 py-2 font-mono text-xs break-all">{r.to_url}</td>
                          <td className="px-4 py-2">{r.status_code}</td>
                          <td className="px-4 py-2">{r.hit_count}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              className="text-rose-600 text-xs font-semibold"
                              onClick={async () => {
                                await admin.seoRedirectDelete(r.id);
                                setRedirects((list) => list.filter((x) => x.id !== r.id));
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!redirects.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            No redirects yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'monitor' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async () => {
                      try {
                        const res = await admin.seoScanBrokenLinks();
                        const data = res.data || res;
                        setBroken(data.items || []);
                        toast.success(`Scan done — ${data.broken} broken / ${data.checked} checked`);
                      } catch (e) {
                        toast.error(e.message || 'Scan failed');
                      }
                    }}
                  >
                    Scan broken links
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={async () => {
                      await admin.seoClear404({});
                      setLogs404([]);
                      toast.success('404 logs cleared');
                    }}
                  >
                    Clear 404 logs
                  </button>
                </div>

                <div className="glass-card !p-5">
                  <h2 className="font-bold mb-3">404 monitoring</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-slate-500 text-left">
                        <tr>
                          <th className="py-2">Path</th>
                          <th className="py-2">Hits</th>
                          <th className="py-2">Last seen</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {logs404.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="py-2 font-mono text-xs break-all">{row.path}</td>
                            <td className="py-2">{row.hit_count}</td>
                            <td className="py-2 text-xs text-slate-500">{row.last_seen_at}</td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                className="text-xs text-primary-600 font-semibold mr-3"
                                onClick={() => {
                                  setRedirectForm({
                                    from_path: row.path,
                                    to_url: '/',
                                    status_code: 301,
                                    notes: 'From 404 log',
                                  });
                                  setTab('redirects');
                                }}
                              >
                                Redirect
                              </button>
                              <button
                                type="button"
                                className="text-xs text-rose-600 font-semibold"
                                onClick={async () => {
                                  await admin.seoClear404({ id: row.id });
                                  setLogs404((list) => list.filter((x) => x.id !== row.id));
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!logs404.length && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-500">
                              No 404s logged yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card !p-5">
                  <h2 className="font-bold mb-3">Broken links</h2>
                  <ul className="space-y-2 text-sm">
                    {broken.map((b) => (
                      <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <p className="font-mono text-xs break-all">{b.target_url}</p>
                          <p className="text-xs text-slate-500">
                            from {b.source_path} · {b.status_code || '—'} · {b.error_message}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-emerald-700"
                          onClick={async () => {
                            await admin.seoResolveBrokenLink(b.id);
                            setBroken((list) => list.filter((x) => x.id !== b.id));
                          }}
                        >
                          Resolve
                        </button>
                      </li>
                    ))}
                    {!broken.length && <li className="text-slate-500">No unresolved broken links</li>}
                  </ul>
                </div>
              </div>
            )}

            {tab === 'checklist' && checklist && (
              <div className="space-y-4">
                <div className="glass-card !p-5">
                  <h2 className="font-bold mb-3">
                    Technical SEO checklist — {checklist.technical?.percent}%
                  </h2>
                  <ul className="space-y-2">
                    {(checklist.technical?.items || []).map((item) => (
                      <li key={item.id} className="flex gap-2 text-sm">
                        <FaIcon icon={item.done ? 'fa-circle-check' : 'fa-circle-xmark'} className={item.done ? 'text-emerald-600' : 'text-rose-500'} />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.tip}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card !p-5">
                  <h2 className="font-bold mb-3">Core Web Vitals recommendations</h2>
                  <div className="grid md:grid-cols-3 gap-3">
                    {(checklist.core_web_vitals || []).map((m) => (
                      <div key={m.metric} className="rounded-xl border border-slate-200 p-3">
                        <p className="font-bold text-slate-900">
                          {m.metric} <span className="text-xs font-normal text-slate-500">{m.target}</span>
                        </p>
                        <p className="text-xs text-slate-500 mb-2">{m.label}</p>
                        <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                          {m.tips.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card !p-5">
                  <h2 className="font-bold mb-3">Mobile SEO recommendations</h2>
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {(checklist.mobile_seo || []).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
