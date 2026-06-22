import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import ClinicLogo from '../../components/ClinicLogo';
import { doctors } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }) {
  const s = status || 'pending';
  return <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[s] || STATUS_STYLE.pending}`}>{s}</span>;
}

export default function DoctorClinics() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    doctors
      .clinics()
      .then((res) => setList(res.data || []))
      .catch((e) => toast.error(e.message || 'Could not load clinics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return list;
    return list.filter((c) => String(c.approval_status) === filter);
  }, [list, filter]);

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Clinics</h1>
          <p className="text-sm text-slate-600 mt-1">Add clinics, track approval status, and manage your clinic schedule.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/doctor/clinics/new" className="btn-primary text-sm inline-flex items-center gap-2">
            <FaIcon icon="fa-plus" />
            Add clinic
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        {[
          ['', 'All'],
          ['pending', 'Pending'],
          ['approved', 'Approved'],
          ['rejected', 'Rejected'],
        ].map(([id, label]) => (
          <button
            key={id || 'all'}
            type="button"
            onClick={() => setFilter(id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                : 'bg-white/70 text-slate-600 border border-slate-200 hover:border-primary-300'
            }`}
          >
            {label}
          </button>
        ))}
        <button type="button" className="shrink-0 ml-auto text-xs text-primary-600 font-semibold hover:underline px-2" onClick={load}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-12 md:py-16 px-6">
          <FaIcon icon="fa-hospital" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold">No clinics found</p>
          <p className="text-sm text-slate-500 mt-1">Add your first clinic to start accepting clinic bookings.</p>
          <Link to="/doctor/clinics/new" className="btn-primary text-sm mt-5 inline-flex">
            Add clinic
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="glass-card !p-4 md:!p-5 border border-white/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0">
                  <ClinicLogo clinic={c} size="lg" />
                  <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{c.name}</p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{c.address}</p>
                  <p className="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {c.city_name && (
                      <span className="inline-flex items-center gap-1">
                        <FaIcon icon="fa-location-dot" className="text-slate-400" /> {c.city_name}
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <FaIcon icon="fa-phone" className="text-slate-400" /> {c.phone}
                      </span>
                    )}
                  </p>
                  </div>
                </div>
                <StatusBadge status={c.approval_status} />
              </div>

              {c.approval_status === 'rejected' && c.rejection_reason && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  <p className="font-semibold mb-1">Rejected</p>
                  <p className="text-red-800">{c.rejection_reason}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/doctor/clinic-availability" className="btn-outline text-sm inline-flex items-center gap-2">
                  <FaIcon icon="fa-calendar-days" />
                  Set availability
                </Link>
                <Link to={`/doctor/clinics/new?edit=${c.id}`} className="btn-outline text-sm inline-flex items-center gap-2">
                  <FaIcon icon="fa-pen" />
                  {c.approval_status === 'approved' ? 'Edit profile' : 'Edit'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

