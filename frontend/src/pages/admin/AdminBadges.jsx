import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import SearchableEntitySelect from '../../components/admin/SearchableEntitySelect';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminBadges() {
  const [list, setList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', icon: 'fa-award', color: 'orange', entity_type: 'both' });
  const [assign, setAssign] = useState({ doctor_id: '', clinic_id: '', badge_id: '' });

  const load = useCallback(() => {
    admin.badgesList().then((r) => setList(r.data || [])).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    load();
    admin.users({ role: 'doctor', status: 'active' }).then((r) => setDoctors(r.data || [])).catch(() => {});
    admin.clinics().then((r) => setClinics(r.data || [])).catch(() => {});
  }, [load]);

  const doctorOptions = useMemo(
    () =>
      doctors
        .filter((d) => d.doctor_id)
        .map((d) => ({
          id: d.doctor_id,
          label: `Dr. ${d.first_name} ${d.last_name}`.trim(),
          sub: d.specialization || d.email || '',
        })),
    [doctors]
  );

  const clinicOptions = useMemo(
    () =>
      clinics.map((c) => ({
        id: c.id,
        label: c.name,
        sub: [c.city_name, c.phone].filter(Boolean).join(' · '),
      })),
    [clinics]
  );

  const assignableBadges = useMemo(() => {
    return list.filter((b) => b.is_active !== 0);
  }, [list]);

  const selectedBadge = assignableBadges.find((b) => String(b.id) === String(assign.badge_id));

  const create = async (e) => {
    e.preventDefault();
    try {
      await admin.badgeCreate(form);
      toast.success('Badge created');
      setForm({ name: '', description: '', icon: 'fa-award', color: 'orange', entity_type: 'both' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const assignDoctor = async (e) => {
    e.preventDefault();
    if (!assign.badge_id || !assign.doctor_id) {
      toast.error('Select a badge and doctor');
      return;
    }
    try {
      await admin.badgeAssignDoctor({ doctor_id: +assign.doctor_id, badge_id: +assign.badge_id });
      toast.success('Badge assigned to doctor');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const assignClinic = async (e) => {
    e.preventDefault();
    if (!assign.badge_id || !assign.clinic_id) {
      toast.error('Select a badge and clinic');
      return;
    }
    try {
      await admin.badgeAssignClinic({ clinic_id: +assign.clinic_id, badge_id: +assign.badge_id });
      toast.success('Badge assigned to clinic');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const canAssignDoctor = !selectedBadge || ['both', 'doctor'].includes(selectedBadge.entity_type);
  const canAssignClinic = !selectedBadge || ['both', 'clinic'].includes(selectedBadge.entity_type);

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Badge Management</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={create} className="glass-card p-4 md:p-5 space-y-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FaIcon icon="fa-award" className="text-amber-500" /> Create badge
          </h2>
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="input-field" value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })}>
            <option value="both">Doctor & Clinic</option>
            <option value="doctor">Doctor only</option>
            <option value="clinic">Clinic only</option>
          </select>
          <button type="submit" className="btn-primary w-full">Create badge</button>
        </form>

        <div className="glass-card p-4 md:p-5 space-y-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FaIcon icon="fa-link" className="text-primary-600" /> Assign badges
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
            <select className="input-field" value={assign.badge_id} onChange={(e) => setAssign({ ...assign, badge_id: e.target.value })}>
              <option value="">Select badge</option>
              {assignableBadges.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.entity_type})</option>
              ))}
            </select>
          </div>

          {canAssignDoctor && (
            <form onSubmit={assignDoctor} className="space-y-3 pt-2 border-t border-slate-100">
              <SearchableEntitySelect
                label="Doctor"
                placeholder="Search doctor name or email…"
                options={doctorOptions}
                value={assign.doctor_id}
                onChange={(id) => setAssign({ ...assign, doctor_id: id })}
                getOptionValue={(o) => o.id}
                getOptionLabel={(o) => o.label}
                getOptionSub={(o) => o.sub}
              />
              <button type="submit" className="btn-primary w-full">Assign to doctor</button>
            </form>
          )}

          {canAssignClinic && (
            <form onSubmit={assignClinic} className="space-y-3 pt-2 border-t border-slate-100">
              <SearchableEntitySelect
                label="Clinic"
                placeholder="Search clinic name…"
                options={clinicOptions}
                value={assign.clinic_id}
                onChange={(id) => setAssign({ ...assign, clinic_id: id })}
                getOptionValue={(o) => o.id}
                getOptionLabel={(o) => o.label}
                getOptionSub={(o) => o.sub}
              />
              <button type="submit" className="btn-outline w-full border-primary-200 text-primary-800">Assign to clinic</button>
            </form>
          )}
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
