import { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [tab, setTab] = useState('doctors');
  const [doctorReviews, setDoctorReviews] = useState([]);
  const [clinicReviews, setClinicReviews] = useState([]);

  const load = () => {
    admin.doctorReviewsList().then((r) => setDoctorReviews(r.data || [])).catch((e) => toast.error(e.message));
    admin.clinicReviewsList().then((r) => setClinicReviews(r.data || [])).catch((e) => toast.error(e.message));
  };
  useEffect(() => { load(); }, []);

  const moderate = async (type, id, approved) => {
    try {
      if (type === 'doctor') await admin.moderateDoctorReview(id, { is_approved: approved ? 1 : 0 });
      else await admin.moderateClinicReview(id, { is_approved: approved ? 1 : 0 });
      toast.success('Updated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const rows = tab === 'doctors' ? doctorReviews : clinicReviews;

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Reviews & Ratings</h1>
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setTab('doctors')} className={tab === 'doctors' ? 'btn-primary text-sm' : 'btn-outline text-sm'}>Doctor reviews</button>
        <button type="button" onClick={() => setTab('clinics')} className={tab === 'clinics' ? 'btn-primary text-sm' : 'btn-outline text-sm'}>Clinic reviews</button>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <article key={r.id} className="glass-card p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-slate-800">{tab === 'doctors' ? `Dr. ${r.doctor_first_name} ${r.doctor_last_name}` : r.clinic_name}</p>
                <p className="text-xs text-slate-500">{r.patient_first_name} · {'★'.repeat(r.rating)} · {r.created_at?.slice(0, 10)}</p>
                {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment}</p>}
              </div>
              <div className="flex gap-2 items-start">
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {r.is_approved ? 'Approved' : 'Pending'}
                </span>
                {!r.is_approved && (
                  <button type="button" onClick={() => moderate(tab === 'doctors' ? 'doctor' : 'clinic', r.id, true)} className="text-xs text-primary-600 font-semibold">Approve</button>
                )}
                {r.is_approved && (
                  <button type="button" onClick={() => moderate(tab === 'doctors' ? 'doctor' : 'clinic', r.id, false)} className="text-xs text-red-600 font-semibold">Hide</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminDashboardLayout>
  );
}
