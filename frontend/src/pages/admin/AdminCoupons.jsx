import { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    code: '', title: '', description: '', discount_type: 'percent', discount_value: 10,
    min_order_amount: 0, max_uses: '', valid_until: '', applies_to: 'all', is_active: 1,
  });

  const load = () => admin.couponsList().then((r) => setList(r.data || [])).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await admin.couponCreate({ ...form, max_uses: form.max_uses ? +form.max_uses : null });
      toast.success('Coupon created');
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Coupons & Promo Codes</h1>
      <form onSubmit={create} className="glass-card p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <input className="input-field uppercase" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <select className="input-field" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
          <option value="percent">Percent</option><option value="fixed">Fixed ₹</option>
        </select>
        <input className="input-field" type="number" placeholder="Discount value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
        <input className="input-field" type="number" placeholder="Min order" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
        <select className="input-field" value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })}>
          <option value="all">All</option><option value="online">Online</option><option value="clinic">Clinic</option><option value="home_visit">Home visit</option>
        </select>
        <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-3">Create coupon</button>
      </form>
      <div className="overflow-x-auto glass-card">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500 border-b"><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Used</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3 font-bold">{c.code}</td>
                <td className="p-3">{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                <td className="p-3">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td className="p-3">{c.is_active ? 'Active' : 'Off'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminDashboardLayout>
  );
}
