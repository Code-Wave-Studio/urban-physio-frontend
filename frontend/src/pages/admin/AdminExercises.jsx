import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import FaIcon from '../../components/FaIcon';
import { admin, uploadCmsImage, uploadCmsVideo } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '',
  slug: '',
  body_area: 'general',
  difficulty: 'beginner',
  instructions: '',
  default_sets: 3,
  default_reps: '10',
  default_hold_seconds: '',
  equipment: '',
  video_url: '',
  image_url: '',
  is_active: 1,
  sort_order: 0,
};

export default function AdminExercises() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search.trim()) params.search = search.trim();
    admin
      .exercisesList(params)
      .then((res) => setList(res.data || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setModalOpen(true);
    setEditingId(id);
    try {
      const res = await admin.exerciseGet(id);
      const ex = res.data;
      setForm({
        name: ex.name || '',
        slug: ex.slug || '',
        body_area: ex.body_area || 'general',
        difficulty: ex.difficulty || 'beginner',
        instructions: ex.instructions || '',
        default_sets: ex.default_sets ?? 3,
        default_reps: ex.default_reps || '10',
        default_hold_seconds: ex.default_hold_seconds ?? '',
        equipment: ex.equipment || '',
        video_url: ex.video_url || '',
        image_url: ex.image_url || '',
        is_active: ex.is_active ? 1 : 0,
        sort_order: ex.sort_order ?? 0,
      });
    } catch (err) {
      toast.error(err.message);
      setModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.instructions.trim()) {
      toast.error('Name and instructions are required');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      default_sets: parseInt(form.default_sets, 10) || 3,
      default_hold_seconds: form.default_hold_seconds ? parseInt(form.default_hold_seconds, 10) : null,
      is_active: form.is_active ? 1 : 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    try {
      if (editingId) {
        await admin.exerciseUpdate(editingId, payload);
        toast.success('Exercise updated');
      } else {
        await admin.exerciseCreate(payload);
        toast.success('Exercise created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this exercise?')) return;
    try {
      await admin.exerciseDelete(id);
      toast.success('Exercise deactivated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Exercise Library</h1>
          <p className="text-slate-600 text-sm mt-1">Manage rehab exercises with sets & reps</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <FaIcon icon="fa-plus" /> Add exercise
        </button>
      </div>

      <div className="glass-card p-4 mb-6">
        <input className="input-field" placeholder="Search exercises…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((ex) => (
            <article key={ex.id} className="glass-card p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-slate-800">{ex.name}</h3>
                  <p className="text-xs text-slate-500 capitalize mt-1">
                    {ex.body_area} · {ex.difficulty} · {ex.default_sets}×{ex.default_reps}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${ex.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}`}>
                  {ex.is_active ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{ex.instructions}</p>
              <div className="flex gap-3 mt-3">
                <button type="button" onClick={() => openEdit(ex.id)} className="text-primary-600 font-semibold text-sm">
                  Edit
                </button>
                {ex.is_active && (
                  <button type="button" onClick={() => deactivate(ex.id)} className="text-red-600 font-semibold text-sm">
                    Deactivate
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <GlassModal open={modalOpen} onClose={() => !saving && setModalOpen(false)} size="lg" titleId="exercise-form" preventClose={saving}>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <GlassModalHeader
            titleId="exercise-form"
            title={editingId ? 'Edit exercise' : 'Add exercise'}
            subtitle="Sets, reps, body area and instructions for the exercise library"
            icon="fa-dumbbell"
            accent="cyan"
            onClose={() => !saving && setModalOpen(false)}
            disabledClose={saving}
          />
          <GlassModalBody className="space-y-3">
            <input className="input-field" placeholder="Exercise name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Body area" value={form.body_area} onChange={(e) => setForm({ ...form, body_area: e.target.value })} />
              <select className="input-field" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input className="input-field" type="number" placeholder="Sets" value={form.default_sets} onChange={(e) => setForm({ ...form, default_sets: e.target.value })} />
              <input className="input-field" placeholder="Reps" value={form.default_reps} onChange={(e) => setForm({ ...form, default_reps: e.target.value })} />
              <input className="input-field" type="number" placeholder="Hold (s)" value={form.default_hold_seconds} onChange={(e) => setForm({ ...form, default_hold_seconds: e.target.value })} />
            </div>
            <input className="input-field" placeholder="Equipment (optional)" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} />
            <MediaUrlOrUpload
              label="Exercise video (URL or upload)"
              hint="MP4 or external video link"
              icon="fa-video"
              urlValue={form.video_url}
              onUrlChange={(v) => setForm({ ...form, video_url: v })}
              onUpload={uploadCmsVideo}
              accept="video/mp4,video/webm"
              maxMb={50}
              preview="none"
            />
            <MediaUrlOrUpload
              label="Demo GIF / image (URL or upload)"
              hint="Animated GIF or still image for the exercise"
              icon="fa-image"
              urlValue={form.image_url}
              onUrlChange={(v) => setForm({ ...form, image_url: v })}
              onUpload={uploadCmsImage}
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxMb={8}
              preview="image"
            />
            <textarea className="input-field min-h-[100px]" placeholder="Step-by-step instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
              Active on website
            </label>
          </GlassModalBody>
          <GlassModalFooter>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline" disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary ml-auto">{saving ? 'Saving…' : 'Save exercise'}</button>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </AdminDashboardLayout>
  );
}
