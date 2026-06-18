import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import PackageProgressPanel from '../../components/PackageProgressPanel';
import { patientPackages } from '../../services/api';
import { PATIENT_NAV } from '../../constants/patientNav';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  paused: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function PatientPackages() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    patientPackages
      .list()
      .then((res) => setList(res.data || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Treatment Packages</h1>
          <p className="text-slate-600 text-sm mt-1">Track your rehab program sessions</p>
        </div>
        <Link to="/packages" className="btn-outline text-sm inline-flex items-center gap-2">
          <FaIcon icon="fa-box-open" /> Browse packages
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <FaIcon icon="fa-box-open" className="text-3xl text-slate-300 mb-3" />
          <p className="text-slate-600">No active packages yet.</p>
          <Link to="/packages" className="btn-primary mt-4 inline-block">
            View available packages
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((pkg) => (
            <article key={pkg.id} className="glass-card p-4">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-800">{pkg.package_name}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Dr. {pkg.doctor_first_name} {pkg.doctor_last_name} · {pkg.start_date} – {pkg.end_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[pkg.status] || STATUS_COLORS.active}`}>
                      {pkg.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {pkg.completed_sessions}/{pkg.total_sessions} ({pkg.progress_percent}%)
                    </span>
                    <FaIcon icon={expandedId === pkg.id ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400" />
                  </div>
                </div>
              </button>
              {expandedId === pkg.id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <PackageProgressPanel packageId={pkg.id} onUpdated={load} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
