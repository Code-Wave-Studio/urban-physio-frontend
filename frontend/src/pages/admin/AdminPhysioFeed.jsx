import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = {
  type: 'blog', title: '', slug: '', excerpt: '', content: '', author_name: '', featured_image: '',
  audio_url: '', video_url: '', seo_title: '', seo_description: '', seo_keywords: '',
  status: 'draft', scheduled_at: '', published_at: '', is_active: 1, sort_order: 0,
};

export default function AdminPhysioFeed() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    admin.physioFeedList(filter ? { type: filter } : {}).then((r) => setList(r.data || [])).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = async (id) => {
    setEditId(id);
    setModal(true);
    const res = await admin.physioFeedGet(id);
    const p = res.data;
    setForm({ ...EMPTY, ...p, is_active: p.is_active ? 1 : 0 });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await admin.physioFeedUpdate(editId, form);
      else await admin.physioFeedCreate(form);
      toast.success('Saved');
      setModal(false);
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <AdminDashboardLayout>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">PhysioFeed CMS</h1>
          <p className="text-sm text-slate-600">Blogs, conditions & podcasts with SEO & scheduling</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => admin.physioFeedPublishScheduled().then(() => toast.success('Scheduled posts published')).catch((e) => toast.error(e.message))} className="btn-outline text-sm">Publish scheduled</button>
          <button type="button" onClick={() => { setEditId(null); setForm(EMPTY); setModal(true); }} className="btn-primary text-sm"><FaIcon icon="fa-plus" /> New post</button>
        </div>
      </div>

      <select className="input-field max-w-xs mb-4" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All types</option>
        <option value="blog">Blog</option>
        <option value="condition">Condition</option>
        <option value="podcast">Podcast</option>
      </select>

      {loading ? <p>Loading…</p> : (
        <div className="overflow-x-auto glass-card">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b"><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Views</th><th className="p-3">Actions</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 capitalize">{p.type}</td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="p-3">{p.view_count}</td>
                  <td className="p-3"><button type="button" onClick={() => openEdit(p.id)} className="text-primary-600 font-semibold">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-3">
            <h2 className="font-bold text-lg">{editId ? 'Edit post' : 'New post'}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="blog">Blog</option><option value="condition">Condition</option><option value="podcast">Podcast</option>
              </select>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option>
              </select>
            </div>
            <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input-field min-h-[60px]" placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <textarea className="input-field min-h-[120px]" placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
            <input className="input-field" placeholder="SEO title" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
            <input className="input-field" placeholder="SEO description" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
            <input className="input-field" placeholder="Scheduled at (YYYY-MM-DD HH:MM:SS)" value={form.scheduled_at || ''} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            <input className="input-field" placeholder="Audio URL (podcast)" value={form.audio_url || ''} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
