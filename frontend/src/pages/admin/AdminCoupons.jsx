import { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const APPLIES_OPTIONS = [
  { value: 'all', label: 'All bookings' },
  { value: 'online', label: 'Online consultation' },
  { value: 'clinic', label: 'Clinic visit' },
  { value: 'home_visit', label: 'Home visit' },
  { value: 'package', label: 'Treatment packages' },
];

const EMPTY = {
  code: '',
  title: '',
  description: '',
  discount_type: 'percent',
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: '',
  max_uses: '',
  valid_until: '',
  applies_to: 'all',
  is_active: 1,
};

const appliesLabel = (v) => APPLIES_OPTIONS.find((o) => o.value === v)?.label || v;

export default function AdminCoupons() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    admin
      .couponsList()
      .then((r) => setList(r.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.couponCreate({
        ...form,
        code: form.code.toUpperCase().trim(),
        max_uses: form.max_uses ? +form.max_uses : null,
        max_discount_amount: form.max_discount_amount ? +form.max_discount_amount : null,
        valid_until: form.valid_until || null,
      });
      toast.success('Coupon created');
      setModalOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await admin.couponUpdate(c.id, { is_active: c.is_active ? 0 : 1 });
      toast.success(c.is_active ? 'Coupon deactivated' : 'Coupon activated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Coupons & Promo Codes</h1>
          <p className="text-slate-600 text-sm mt-1">Create discounts for appointments and treatment packages</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <FaIcon icon="fa-plus" /> Create coupon
        </button>
      </div>

      <div className="overflow-x-auto glass-card">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="p-3">Code</th>
              <th className="p-3">Title</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Applies to</th>
              <th className="p-3">Used</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-500">Loading…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-500">No coupons yet</td></tr>
            ) : (
              list.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-primary-800 tracking-wide">{c.code}</td>
                  <td className="p-3 text-slate-800">{c.title}</td>
                  <td className="p-3">
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${Number(c.discount_value).toLocaleString('en-IN')}`}
                  </td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{appliesLabel(c.applies_to)}</span>
                  </td>
                  <td className="p-3">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.is_active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button type="button" onClick={() => toggleActive(c)} className="text-sm font-semibold text-primary-600 hover:underline">
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <GlassModal open={modalOpen} onClose={() => !saving && setModalOpen(false)} size="lg" titleId="coupon-form" preventClose={saving}>
        <form onSubmit={create} className="flex flex-col min-h-0 flex-1">
          <GlassModalHeader
            titleId="coupon-form"
            title="Create promo code"
            subtitle="Patients can apply this at checkout on appointments or package bookings"
            icon="fa-tag"
            accent="violet"
            onClose={() => !saving && setModalOpen(false)}
            disabledClose={saving}
          />
          <GlassModalBody className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                <input className="input-field uppercase" value={form.code} onChange={(e) => set('code', e.target.value)} required placeholder="SAVE20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="Summer offer" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount type</label>
                <select className="input-field" value={form.discount_type} onChange={(e) => set('discount_type', e.target.value)}>
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount value</label>
                <input className="input-field" type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => set('discount_value', e.target.value)} required />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min order (₹)</label>
                <input className="input-field" type="number" min="0" value={form.min_order_amount} onChange={(e) => set('min_order_amount', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max discount (₹, optional)</label>
                <input className="input-field" type="number" min="0" value={form.max_discount_amount} onChange={(e) => set('max_discount_amount', e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Applies to</label>
                <select className="input-field" value={form.applies_to} onChange={(e) => set('applies_to', e.target.value)}>
                  {APPLIES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max uses (optional)</label>
                <input className="input-field" type="number" min="1" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid until (optional)</label>
              <input className="input-field" type="datetime-local" value={form.valid_until} onChange={(e) => set('valid_until', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </GlassModalBody>
          <GlassModalFooter>
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary ml-auto" disabled={saving}>{saving ? 'Creating…' : 'Create coupon'}</button>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </AdminDashboardLayout>
  );
}
