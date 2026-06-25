import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import FaIcon from '../../components/FaIcon';
import { doctors } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

const emptyForm = () => ({
  name: '',
  description: '',
  features: '',
  consultation_type: 'any',
  duration_days: 7,
  total_sessions: 7,
  mrp_price: '',
  discount_price: '',
  is_enabled: 1,
});

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

export default function DoctorServicePackages() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    doctors.servicePackages
      .list()
      .then((res) => setList(res.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({
      name: pkg.name || '',
      description: pkg.description || '',
      features: Array.isArray(pkg.features_list) ? pkg.features_list.join('\n') : pkg.features || '',
      consultation_type: pkg.consultation_type || 'any',
      duration_days: pkg.duration_days || 7,
      total_sessions: pkg.total_sessions || 7,
      mrp_price: pkg.mrp_price ?? '',
      discount_price: pkg.discount_price ?? '',
      is_enabled: pkg.is_enabled ?? 1,
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      duration_days: Number(form.duration_days),
      total_sessions: Number(form.total_sessions),
      mrp_price: Number(form.mrp_price),
      discount_price: Number(form.discount_price),
      is_enabled: Number(form.is_enabled),
    };
    try {
      if (editing?.id) {
        await doctors.servicePackages.update(editing.id, payload);
        toast.success('Package updated — pending admin approval if content changed');
      } else {
        await doctors.servicePackages.create(payload);
        toast.success('Package submitted for admin approval');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (pkg) => {
    if (!window.confirm(`Delete "${pkg.name}"?`)) return;
    try {
      await doctors.servicePackages.delete(pkg.id);
      toast.success('Package deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggleEnabled = async (pkg) => {
    try {
      await doctors.servicePackages.update(pkg.id, { is_enabled: pkg.is_enabled ? 0 : 1 });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My service packages</h1>
          <p className="text-slate-600 text-sm mt-1">Create packages for patients — admin must approve before they appear publicly.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <FaIcon icon="fa-plus" /> New package
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-600">No packages yet. Create your first treatment package.</div>
      ) : (
        <div className="grid gap-4">
          {list.map((pkg) => (
            <article key={pkg.id} className="glass-card p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-slate-900">{pkg.name}</h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[pkg.approval_status] || STATUS_STYLE.pending}`}>
                      {pkg.approval_status}
                    </span>
                    {!Number(pkg.is_enabled) && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Disabled</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{pkg.description || '—'}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {pkg.total_sessions} sessions · {pkg.duration_days} days · {pkg.consultation_type}
                  </p>
                  <p className="mt-2 font-bold text-emerald-700">
                    ₹{Number(pkg.discount_price).toLocaleString('en-IN')}
                    {Number(pkg.mrp_price) > Number(pkg.discount_price) && (
                      <span className="text-sm text-slate-400 line-through font-normal ml-2">₹{Number(pkg.mrp_price).toLocaleString('en-IN')}</span>
                    )}
                  </p>
                  {pkg.admin_notes && pkg.approval_status === 'rejected' && (
                    <p className="text-xs text-red-700 mt-2">Admin note: {pkg.admin_notes}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button type="button" className="btn-outline text-sm" onClick={() => openEdit(pkg)}>Edit</button>
                  <button type="button" className="btn-outline text-sm" onClick={() => toggleEnabled(pkg)}>
                    {Number(pkg.is_enabled) ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" className="btn-outline text-sm border-red-200 text-red-700" onClick={() => remove(pkg)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <GlassModal open={modalOpen} onClose={() => !saving && setModalOpen(false)} size="lg" titleId="pkg-form" preventClose={saving}>
        <form onSubmit={save} className="flex flex-col min-h-0 flex-1">
          <GlassModalHeader
            titleId="pkg-form"
            title={editing ? 'Edit package' : 'New package'}
            subtitle="Packages require main admin approval before patients can book them."
            icon="fa-box-open"
            accent="primary"
            onClose={() => !saving && setModalOpen(false)}
            disabledClose={saving}
          />
          <GlassModalBody className="space-y-3">
            <input className="input-field" placeholder="Package name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <textarea className="input-field min-h-[72px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <textarea className="input-field min-h-[72px]" placeholder="Features (one per line)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
            <select className="input-field" value={form.consultation_type} onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}>
              <option value="any">Any consultation type</option>
              <option value="clinic">Clinic visit</option>
              <option value="online">Online consultation</option>
              <option value="home_visit">Home visit</option>
            </select>
            <div className="grid sm:grid-cols-2 gap-3">
              <input type="number" min={1} className="input-field" placeholder="Duration (days)" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
              <input type="number" min={1} className="input-field" placeholder="Sessions" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input type="number" min={0} className="input-field" placeholder="MRP (₹)" value={form.mrp_price} onChange={(e) => setForm({ ...form, mrp_price: e.target.value })} required />
              <input type="number" min={0} className="input-field" placeholder="Discount price (₹)" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} required />
            </div>
          </GlassModalBody>
          <GlassModalFooter>
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary ml-auto" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Submit for approval'}</button>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </DashboardLayout>
  );
}
