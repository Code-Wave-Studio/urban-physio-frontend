import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

const EMPTY = {
  type: 'blog',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author_name: '',
  featured_image: '',
  audio_url: '',
  video_url: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  status: 'draft',
  is_active: 1,
  sort_order: 0,
};

const TYPE_META = {
  blog: { icon: 'fa-newspaper', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  condition: { icon: 'fa-notes-medical', tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  podcast: { icon: 'fa-podcast', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const STATUS_META = {
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
};

function slugFromTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminPhysioFeed() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter) params.type = filter;
    if (statusFilter) params.status = statusFilter;
    admin
      .physioFeedList(params)
      .then((r) => setList(r.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [filter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = async (id) => {
    setEditId(id);
    setModal(true);
    try {
      const res = await admin.physioFeedGet(id);
      const p = res.data;
      setForm({
        ...EMPTY,
        ...p,
        slug: p.slug || slugFromTitle(p.title),
        is_active: p.is_active ? 1 : 0,
        status: p.status === 'published' ? 'published' : 'draft',
      });
    } catch (e) {
      toast.error(e.message || 'Could not load post');
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    const payload = {
      ...form,
      slug: form.slug?.trim() || slugFromTitle(form.title),
      is_active: form.status === 'published' ? 1 : form.is_active,
    };
    if (payload.status === 'published') {
      payload.is_active = 1;
    }
    setSaving(true);
    try {
      if (editId) await admin.physioFeedUpdate(editId, payload);
      else await admin.physioFeedCreate(payload);
      toast.success(payload.status === 'published' ? 'Published on website' : 'Draft saved');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const bannerSrc = resolveMediaUrl(form.featured_image) || form.featured_image;

  return (
    <AdminDashboardLayout>
      <div className="rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-sky-50/80 p-5 sm:p-7 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-1">Content studio</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">PhysioFeed CMS</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Publish blogs, conditions & podcasts — live on{' '}
              <Link to="/physiofeed" className="text-violet-700 font-semibold hover:underline" target="_blank">
                /physiofeed
              </Link>
            </p>
          </div>
          <button type="button" onClick={openNew} className="btn-primary text-sm shrink-0 !bg-violet-600 hover:!bg-violet-700">
            <FaIcon icon="fa-plus" /> New post
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <select className="input-field max-w-[10rem] text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="blog">Blog</option>
          <option value="condition">Condition</option>
          <option value="podcast">Podcast</option>
        </select>
        <select className="input-field max-w-[10rem] text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-500">
          <FaIcon icon="fa-spinner" className="fa-spin text-2xl mb-2" />
          <p>Loading posts…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FaIcon icon="fa-rss" className="text-4xl text-violet-300 mb-3" />
          <p className="text-slate-600">No posts yet. Create your first PhysioFeed article.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((p) => {
            const typeMeta = TYPE_META[p.type] || TYPE_META.blog;
            const statusCls = STATUS_META[p.status] || STATUS_META.draft;
            return (
              <div
                key={p.id}
                className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${typeMeta.tone}`}>
                      <FaIcon icon={typeMeta.icon} className="mr-1" />
                      {p.type}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border capitalize ${statusCls}`}>
                      {p.status}
                    </span>
                  </div>
                  <h2 className="font-bold text-slate-900 truncate">{p.title}</h2>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    /physiofeed/{p.slug || `post-${p.id}`} · {p.view_count || 0} views
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {p.status === 'published' && p.slug && (
                    <Link
                      to={`/physiofeed/${p.slug}`}
                      target="_blank"
                      className="btn-outline text-xs py-2"
                    >
                      <FaIcon icon="fa-arrow-up-right-from-square" /> View
                    </Link>
                  )}
                  <button type="button" onClick={() => openEdit(p.id)} className="btn-primary text-xs py-2 !bg-violet-600 hover:!bg-violet-700">
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GlassModal open={modal} onClose={() => !saving && setModal(false)} size="xl" titleId="physio-feed-form" preventClose={saving}>
        <form onSubmit={save} className="flex flex-col min-h-0 flex-1">
          <GlassModalHeader
            titleId="physio-feed-form"
            title={editId ? 'Edit PhysioFeed post' : 'New PhysioFeed post'}
            subtitle="Draft or publish instantly — banner image, SEO & rich content"
            icon="fa-rss"
            accent="violet"
            onClose={() => !saving && setModal(false)}
            disabledClose={saving}
          />
          <GlassModalBody className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select className="input-field" value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="blog">Blog</option>
                  <option value="condition">Condition</option>
                  <option value="podcast">Podcast</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published (live on website)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: f.slug || slugFromTitle(title),
                    seo_title: f.seo_title || title,
                  }));
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL slug</label>
              <input
                className="input-field font-mono text-sm"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="auto-from-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Short excerpt</label>
              <textarea className="input-field min-h-[72px]" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <FaIcon icon="fa-image" className="text-violet-600" />
                Banner / featured image
              </p>
              <input
                className="input-field text-sm"
                placeholder="https://… image URL for card & article header"
                value={form.featured_image}
                onChange={(e) => set('featured_image', e.target.value)}
              />
              {bannerSrc && (
                <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[21/9] max-h-40 bg-slate-200">
                  <img src={bannerSrc} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <textarea
                className="input-field min-h-[160px] font-mono text-sm"
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Author name</label>
                <input className="input-field" value={form.author_name || ''} onChange={(e) => set('author_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sort order</label>
                <input type="number" className="input-field" value={form.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>

            {form.type === 'podcast' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Audio URL</label>
                <input className="input-field" value={form.audio_url || ''} onChange={(e) => set('audio_url', e.target.value)} />
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4 space-y-3">
              <p className="text-sm font-semibold text-violet-900">SEO</p>
              <input className="input-field text-sm" placeholder="SEO title" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} />
              <input className="input-field text-sm" placeholder="SEO description" value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
              <input className="input-field text-sm" placeholder="SEO keywords (comma separated)" value={form.seo_keywords} onChange={(e) => set('seo_keywords', e.target.value)} />
            </div>
          </GlassModalBody>
          <GlassModalFooter>
            <button type="button" onClick={() => setModal(false)} className="btn-outline" disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary ml-auto !bg-violet-600 hover:!bg-violet-700">
              {saving ? 'Saving…' : form.status === 'published' ? 'Publish' : 'Save draft'}
            </button>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </AdminDashboardLayout>
  );
}
