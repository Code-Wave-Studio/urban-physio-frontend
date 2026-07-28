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
    return <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />;
  }

  if (!rows.length) {
    return (
      <div className="text-sm text-slate-500 py-4 text-center">
        <p>No linked therapists yet.</p>
        <Link to="/clinic-portal/team" className="text-teal-700 font-semibold text-xs mt-2 inline-block">
          Manage team →
        </Link>
      </div>
    );
  }

  const available = rows.filter((r) => Boolean(Number(r.is_available)));
  const unavailable = rows.length - available.length;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-[11px]">
        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
          {available.length} available
        </span>
        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
          {unavailable} unavailable
        </span>
      </div>
      <ul className="space-y-2 max-h-52 overflow-y-auto">
        {rows.slice(0, 10).map((row) => {
          const on = Boolean(Number(row.is_available));
          return (
            <li key={row.doctor_id || row.id} className="flex items-center gap-2.5">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  on ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <FaIcon icon="fa-user-doctor" className="text-xs" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {row.doctor_name || row.name || 'Therapist'}
                </p>
                <p className={`text-[11px] ${on ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {on ? 'Available for bookings' : 'Unavailable'}
                </p>
              </div>
              <span className={`w-2 h-2 rounded-full shrink-0 ${on ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </li>
          );
        })}
      </ul>
      <Link to="/clinic-portal/team" className="text-xs font-semibold text-teal-700 hover:underline inline-block">
        Team & availability →
      </Link>
    </div>
  );
}
