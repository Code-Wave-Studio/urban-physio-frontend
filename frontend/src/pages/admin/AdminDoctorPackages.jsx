import { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function AdminDoctorPackages() {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminDashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Doctor packages</h1>
        <p className="text-sm text-slate-600 mt-1">Review and approve treatment packages created by doctors.</p>
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
                {pkg.approval_status === 'pending' && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button type="button" className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-700" onClick={() => approve(pkg.id)}>
                      <FaIcon icon="fa-check" /> Approve
                    </button>
                    <button type="button" className="btn-outline text-sm border-red-200 text-red-700" onClick={() => reject(pkg)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminDashboardLayout>
  );
}
