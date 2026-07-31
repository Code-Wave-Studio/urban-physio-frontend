import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import ConditionFormModal from '../../components/admin/ConditionFormModal';
import { admin } from '../../services/api';
import { CONDITION_CATEGORIES } from '../../utils/conditionHelpers';
import toast from 'react-hot-toast';

const CATEGORIES = CONDITION_CATEGORIES.filter((c) => c.id);

const EMPTY_FORM = {
  title: '',
  slug: '',
  category: 'injury',
  short_description: '',
  description: '',
  causes: '',
  symptoms: '',
  rehab_program: '',
  goals: '',
  when_to_see: '',
  image_url: '',
  is_active: 1,
  sort_order: 0,
};

export default function AdminConditions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter) params.category = filter;
    if (search.trim()) params.search = search.trim();
    admin
      .conditionsList(params)
      .then((res) => setList(res.data || []))
      .catch((err) => toast.error(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setLoadingEdit(false);
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setModalOpen(true);
    setLoadingEdit(true);
    setEditingId(id);
    try {
      const res = await admin.conditionGet(id);
      const c = res.data;
      setForm({
        title: c.title || '',
        slug: c.slug || '',
        category: c.category || 'injury',
        short_description: c.short_description || '',
        description: c.description || '',
        causes: c.causes || '',
        symptoms: c.symptoms || '',
        rehab_program: c.rehab_program || '',
        goals: c.goals || '',
        when_to_see: c.when_to_see || '',
        image_url: c.image_url || '',
        is_active: c.is_active ? 1 : 0,
        sort_order: c.sort_order ?? 0,
      });
    } catch (err) {
      toast.error(err.message || 'Could not load condition');
      setModalOpen(false);
      setEditingId(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setLoadingEdit(false);
  };

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      is_active: form.is_active ? 1 : 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    try {
      if (editingId) {
        await admin.conditionUpdate(editingId, payload);
        toast.success('Condition updated');
      } else {
        await admin.conditionCreate(payload);
        toast.success('Condition created');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id, title) => {
    if (!window.confirm(`Deactivate "${title}"? It will be hidden from the public site.`)) return;
    try {
      await admin.conditionDelete(id);
      toast.success('Condition deactivated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePermanentDelete = async (id, title) => {
    if (!window.confirm(`PERMANENTLY delete "${title}"? This cannot be undone.`)) return;
    try {
      await admin.conditionDelete(id, true);
      toast.success('Condition deleted permanently');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      await admin.conditionUpdate(item.id, { is_active: item.is_active ? 0 : 1 });
      toast.success(item.is_active ? 'Deactivated' : 'Activated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manage Conditions</h1>
          <p className="text-slate-600 text-sm mt-1">Add, edit, or remove rehab programs shown on the website</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <FaIcon icon="fa-plus" />
          Add Condition
        </button>
      </div>

      <div className="card mb-6 space-y-4">
        <input
          type="search"
          className="input-field"
          placeholder="Search by title or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm ${!filter ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${filter === c.id ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card h-40 animate-pulse bg-white/40" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="p-4">#</th>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Order</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-white/30">
                  <td className="p-4 text-slate-400">{c.id}</td>
                  <td className="p-4 font-medium text-slate-800 max-w-[200px]">
                    {c.title}
                    {c.short_description && (
                      <p className="text-xs text-slate-500 font-normal line-clamp-1 mt-0.5">
                        {c.short_description}
                      </p>
                    )}
                  </td>
                  <td className="p-4 capitalize">{c.category}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{c.slug}</td>
                  <td className="p-4">{c.sort_order}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => toggleActive(c)}
                      className={`badge cursor-pointer ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {c.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {c.is_active && (
                        <Link
                          to={`/conditions/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-primary-600 p-1"
                          title="Preview"
                        >
                          <FaIcon icon="fa-external-link" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(c.id)}
                        className="text-primary-600 hover:text-primary-800 font-medium text-xs px-2 py-1"
                      >
                        Edit
                      </button>
                      {c.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(c.id, c.title)}
                          className="text-amber-700 hover:text-amber-900 font-medium text-xs px-2 py-1"
                        >
                          Hide
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(c.id, c.title)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <p className="text-center text-slate-500 py-12">No conditions found. Add your first one.</p>
          )}
        </div>
      )}

      <ConditionFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        form={form}
        patch={patch}
        editingId={editingId}
        saving={saving}
        loadingEdit={loadingEdit}
      />
    </AdminDashboardLayout>
  );
}
