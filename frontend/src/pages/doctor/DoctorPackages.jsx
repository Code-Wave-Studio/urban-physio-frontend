import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import PackageProgressPanel from '../../components/PackageProgressPanel';
import { doctors, patientPackages, treatmentPackages } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

export default function DoctorPackages() {
  const [enrollments, setEnrollments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient_id: '', package_id: '', start_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [doctorId, setDoctorId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      patientPackages.list(),
      treatmentPackages.list(),
      doctors.getProfile(),
    ])
      .then(([ppRes, pkgRes, docRes]) => {
        setEnrollments(ppRes.data || []);
        setPackages(pkgRes.data || []);
        setDoctorId(docRes.data?.doctor_id ?? docRes.data?.id);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    doctors.patients().then((res) => setPatients(res.data || [])).catch(() => {});
  }, [load]);

  const enroll = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.package_id || !doctorId) {
      toast.error('Select patient and package');
      return;
    }
    setSaving(true);
    try {
      await patientPackages.enroll({
        patient_id: parseInt(form.patient_id, 10),
        package_id: parseInt(form.package_id, 10),
        doctor_id: doctorId,
        start_date: form.start_date,
        notes: form.notes,
      });
      toast.success('Patient enrolled');
      setModalOpen(false);
      setForm({ patient_id: '', package_id: '', start_date: new Date().toISOString().slice(0, 10), notes: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Treatment Packages</h1>
          <p className="text-slate-600 text-sm mt-1">Enroll patients and track session progress</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <FaIcon icon="fa-user-plus" /> Enroll patient
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : enrollments.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-600">No package enrollments yet.</div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((pkg) => (
            <article key={pkg.id} className="glass-card p-4">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-800">{pkg.package_name}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {pkg.patient_first_name} {pkg.patient_last_name} · {pkg.completed_sessions}/{pkg.total_sessions} sessions
                    </p>
                  </div>
                  <FaIcon icon={expandedId === pkg.id ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400" />
                </div>
              </button>
              {expandedId === pkg.id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <PackageProgressPanel packageId={pkg.id} canEdit onUpdated={load} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <form onSubmit={enroll} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Enroll in package</h2>
            <div className="space-y-3">
              <select className="input-field" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
              <select className="input-field" value={form.package_id} onChange={(e) => setForm({ ...form, package_id: e.target.value })} required>
                <option value="">Select package</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.duration_days} days)
                  </option>
                ))}
              </select>
              <input className="input-field" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              <textarea className="input-field min-h-[60px]" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Enrolling…' : 'Enroll'}</button>
              <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
