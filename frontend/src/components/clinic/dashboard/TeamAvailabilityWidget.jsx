import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';

export default function TeamAvailabilityWidget({ clinicId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return undefined;
    let cancelled = false;
    setLoading(true);
    clinicPortal
      .doctorAvailability(clinicId)
      .then((res) => {
        if (!cancelled) setRows(res.data || res || []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  if (loading) {
    return <div className="h-28 rounded-xl bg-primary-50/50 animate-pulse border border-primary-100/50" />;
  }

  if (!rows.length) {
    return (
      <div className="dash-empty !py-8">
        <p>No linked therapists yet.</p>
        <Link to="/clinic-portal/team" className="dash-widget-link mt-2 inline-block">
          Manage team →
        </Link>
      </div>
    );
  }

  const available = rows.filter((r) => Boolean(Number(r.is_available)));
  const unavailable = rows.length - available.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
          {available.length} available
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 font-bold border border-slate-100">
          {unavailable} unavailable
        </span>
      </div>
      <ul className="space-y-2.5 max-h-52 overflow-y-auto pr-0.5">
        {rows.slice(0, 10).map((row) => {
          const on = Boolean(Number(row.is_available));
          return (
            <li
              key={row.doctor_id || row.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100/90 px-3 py-2.5"
              style={{
                background: on
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,247,237,0.4) 100%)'
                  : 'rgba(248, 250, 252, 0.8)',
              }}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  on
                    ? 'bg-primary-50 text-primary-600 border-primary-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                <FaIcon icon="fa-user-doctor" className="text-xs" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {row.doctor_name || row.name || 'Therapist'}
                </p>
                <p className={`text-[11px] font-medium ${on ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {on ? 'Available for bookings' : 'Unavailable'}
                </p>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${on ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </li>
          );
        })}
      </ul>
      <Link to="/clinic-portal/team" className="dash-widget-link inline-flex">
        Team & availability →
      </Link>
    </div>
  );
}
