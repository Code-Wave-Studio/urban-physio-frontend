import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminBadges() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', icon: 'fa-award', color: 'orange', entity_type: 'both' });
  const [assign, setAssign] = useState({ doctor_id: '', clinic_id: '', badge_id: '' });

  const load = useCallback(() => {
    admin.badgesList().then((r) => setList(r.data || [])).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await admin.badgeCreate(form);
      toast.success('Badge created');
      setForm({ name: '', description: '', icon: 'fa-award', color: 'orange', entity_type: 'both' });
      load();
    } catch (err) { toast.error(err.message); }
  };

  const assignDoctor = async (e) => {
    e.preventDefault();
    try {
      await admin.badgeAssignDoctor({ doctor_id: +assign.doctor_id, badge_id: +assign.badge_id });
      toast.success('Assigned to doctor');
    } catch (err) { toast.error(err.message); }
  };

  const assignClinic = async (e) => {
    e.preventDefault();
    try {
      await admin.badgeAssignClinic({ clinic_id: +assign.clinic_id, badge_id: +assign.badge_id });
      toast.success('Assigned to clinic');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Badge Management</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={create} className="glass-card p-4 space-y-3">
          <h2 className="font-bold">Create badge</h2>
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="input-field" value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })}>
            <option value="both">Doctor & Clinic</option><option value="doctor">Doctor only</option><option value="clinic">Clinic only</option>
          </select>
          <button type="submit" className="btn-primary w-full">Create</button>
        </form>
        <div className="glass-card p-4 space-y-4">
          <h2 className="font-bold">Assign badges</h2>
          <select className="input-field" value={assign.badge_id} onChange={(e) => setAssign({ ...assign, badge_id: e.target.value })}>
            <option value="">Select badge</option>
            {list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <form onSubmit={assignDoctor} className="flex gap-2">
            <input className="input-field flex-1" placeholder="Doctor ID" value={assign.doctor_id} onChange={(e) => setAssign({ ...assign, doctor_id: e.target.value })} />
            <button type="submit" className="btn-outline shrink-0">→ Doctor</button>
          </form>
          <form onSubmit={assignClinic} className="flex gap-2">
            <input className="input-field flex-1" placeholder="Clinic ID" value={assign.clinic_id} onChange={(e) => setAssign({ ...assign, clinic_id: e.target.value })} />
            <button type="submit" className="btn-outline shrink-0">→ Clinic</button>
          </form>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {list.map((b) => (
          <article key={b.id} className="glass-card p-4">
            <p className="font-bold">{b.name}</p>
            <p className="text-xs text-slate-500 capitalize mt-1">{b.entity_type} · {b.color}</p>
            <p className="text-sm text-slate-600 mt-2">{b.description}</p>
          </article>
        ))}
      </div>
    </AdminDashboardLayout>
  );
}
