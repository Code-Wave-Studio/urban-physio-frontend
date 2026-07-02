import { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const CONSULTATION_TYPES = [
  { id: 'any', label: 'Any' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'online', label: 'Online' },
  { id: 'home_visit', label: 'Home visit' },
];

function emptyForm() {
  return {
    name: '',
    description: '',
    features: '',
    consultation_type: 'any',
    duration_days: 1,
    total_sessions: 1,
    mrp_price: 0,
    discount_price: 0,
    is_enabled: 1,
    approval_status: 'pending',
  };
}

function packageToForm(pkg) {
  const features = Array.isArray(pkg.features_list)
    ? pkg.features_list.join('\n')
    : typeof pkg.features === 'string'
      ? pkg.features
      : '';
  return {
    name: pkg.name || '',
    description: pkg.description || '',
    features,
    consultation_type: pkg.consultation_type || 'any',
    duration_days: Number(pkg.duration_days) || 1,
    total_sessions: Number(pkg.total_sessions) || 1,
    mrp_price: Number(pkg.mrp_price) || 0,
    discount_price: Number(pkg.discount_price) || 0,
    is_enabled: pkg.is_enabled ? 1 : 0,
    approval_status: pkg.approval_status || 'pending',
  };
}

function EditPackageModal({ open, onClose, pkg, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && pkg) setForm(packageToForm(pkg));
  }, [open, pkg]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Package name is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        features: form.features
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} size="lg" titleId="edit-doctor-package">
      <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
        <GlassModalHeader
          titleId="edit-doctor-package"
          title="Edit package"
          subtitle={pkg ? `Dr. ${pkg.first_name} ${pkg.last_name}` : ''}
          icon="fa-box-open"
          accent="primary"
          onClose={onClose}
        />
        <GlassModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Package name</label>
            <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Features (one per line)</label>
            <textarea className="input-field" rows={3} value={form.features} onChange={(e) => set('features', e.target.value)} placeholder={'Home visit\nExercise plan\nProgress tracking'} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Consultation type</label>
              <select className="input-field" value={form.consultation_type} onChange={(e) => set('consultation_type', e.target.value)}>
                {CONSULTATION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="input-field" value={form.approval_status} onChange={(e) => set('approval_status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sessions</label>
              <input type="number" min="1" className="input-field" value={form.total_sessions} onChange={(e) => set('total_sessions', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (days)</label>
              <input type="number" min="1" className="input-field" value={form.duration_days} onChange={(e) => set('duration_days', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MRP price (₹)</label>
              <input type="number" min="0" className="input-field" value={form.mrp_price} onChange={(e) => set('mrp_price', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount price (₹)</label>
              <input type="number" min="0" className="input-field" value={form.discount_price} onChange={(e) => set('discount_price', e.target.value)} />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600" checked={!!form.is_enabled} onChange={(e) => set('is_enabled', e.target.checked ? 1 : 0)} />
            Enabled (visible to patients when approved)
          </label>
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline text-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary text-sm ml-auto" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </GlassModalFooter>
      </form>
    </GlassModal>
  );
}

export default function AdminDoctorPackages() {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editPkg, setEditPkg] = useState(null);

  const load = () => {
    setLoading(true);
    admin
      .doctorPackagesList(status ? { status } : {})
      .then((res) => setList(res.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const approve = async (id) => {
    try {
      await admin.approveDoctorPackage(id);
      toast.success('Package approved');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const reject = async (pkg) => {
    const reason = window.prompt('Rejection reason (optional):', pkg.admin_notes || '');
    if (reason === null) return;
    try {
      await admin.rejectDoctorPackage(pkg.id, reason);
      toast.success('Package rejected');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openEdit = (pkg) => {
    setEditPkg(pkg);
    setEditOpen(true);
  };

  const saveEdit = async (data) => {
    try {
      await admin.updateDoctorPackage(editPkg.id, data);
      toast.success('Package updated');
      setEditOpen(false);
      setEditPkg(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (pkg) => {
    if (!window.confirm(`Delete package "${pkg.name}"? This cannot be undone.`)) return;
    try {
      await admin.deleteDoctorPackage(pkg.id);
      toast.success('Package deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Doctor packages</h1>
        <p className="text-sm text-slate-600 mt-1">Review, edit, approve and remove treatment packages created by doctors.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id || 'all'}
            type="button"
            onClick={() => setStatus(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              status === t.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse h-32 bg-slate-200 rounded-2xl" />
      ) : list.length === 0 ? (
        <p className="text-slate-600">No packages in this view.</p>
      ) : (
        <div className="space-y-4">
          {list.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl border border-white/70 bg-white/60 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900">{pkg.name}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Dr. {pkg.first_name} {pkg.last_name} · {pkg.specialization || '—'}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{pkg.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {pkg.total_sessions} sessions · {pkg.duration_days} days · {pkg.consultation_type} ·{' '}
                    <span className="capitalize">{pkg.approval_status}</span>
                  </p>
                  <p className="font-bold text-emerald-700 mt-2">
                    ₹{Number(pkg.discount_price).toLocaleString('en-IN')}
                    {Number(pkg.mrp_price) > Number(pkg.discount_price) && (
                      <span className="text-slate-400 line-through font-normal text-sm ml-2">₹{Number(pkg.mrp_price).toLocaleString('en-IN')}</span>
                    )}
                    {pkg.discount_percent > 0 && <span className="text-xs ml-2 text-emerald-800">({pkg.discount_percent}% off)</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {pkg.approval_status === 'pending' && (
                    <>
                      <button type="button" className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-700" onClick={() => approve(pkg.id)}>
                        <FaIcon icon="fa-check" /> Approve
                      </button>
                      <button type="button" className="btn-outline text-sm border-red-200 text-red-700" onClick={() => reject(pkg)}>
                        Reject
                      </button>
                    </>
                  )}
                  <button type="button" className="btn-outline text-sm inline-flex items-center gap-1.5" onClick={() => openEdit(pkg)}>
                    <FaIcon icon="fa-pen" /> Edit
                  </button>
                  <button type="button" className="btn-outline text-sm border-red-200 text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5" onClick={() => remove(pkg)}>
                    <FaIcon icon="fa-trash" /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <EditPackageModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditPkg(null); }}
        pkg={editPkg}
        onSave={saveEdit}
      />
    </AdminDashboardLayout>
  );
}
