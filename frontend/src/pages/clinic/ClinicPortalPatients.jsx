import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ClinicPortalPatients() {
  const { clinicId, loading: bootLoading } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.patients(clinicId, { q: q.trim() || undefined });
      setRows(res.data || res || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load patients');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId, q]);

  useEffect(() => {
    if (!clinicId) return undefined;
    const t = setTimeout(load, q ? 280 : 0);
    return () => clearTimeout(t);
  }, [clinicId, load, q]);

  const totalVisits = rows.reduce((s, r) => s + (Number(r.visit_count) || 0), 0);
  const totalSpent = rows.reduce((s, r) => s + (Number(r.total_spent) || 0), 0);

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">People who booked appointments at your clinic</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="glass-card !p-4">
            <p className="text-xs text-slate-500">Patients</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{rows.length}</p>
          </div>
          <div className="glass-card !p-4">
            <p className="text-xs text-slate-500">Total visits</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalVisits}</p>
          </div>
          <div className="glass-card !p-4">
            <p className="text-xs text-slate-500">Revenue from list</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{money(totalSpent)}</p>
          </div>
        </div>

        <div className="glass-card !p-4 flex flex-col sm:flex-row gap-3">
          <input
            className="input-field flex-1"
            placeholder="Search name, phone, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="btn-outline text-sm" onClick={load}>
            Search
          </button>
        </div>

        <div className="glass-card !p-0 overflow-hidden">
          {bootLoading || loading ? (
            <div className="h-40 animate-pulse bg-slate-100 m-4 rounded-xl" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/80 text-left">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Visits</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">First / last visit</th>
                    <th className="px-4 py-3">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.patient_id} className="border-t border-slate-100 hover:bg-teal-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                            {(p.patient_name || 'P').slice(0, 1).toUpperCase()}
                          </div>
                          <p className="font-medium text-slate-900">{p.patient_name || 'Patient'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{p.phone || '—'}</p>
                        <p className="text-xs text-slate-400">{p.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">{p.visit_count}</td>
                      <td className="px-4 py-3">{p.completed_visits}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {formatDate(p.first_visit)}
                        <br />
                        → {formatDate(p.last_visit)}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-700">{money(p.total_spent)}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        <FaIcon icon="fa-users" className="text-3xl text-slate-300 mb-2" />
                        <p>No patients yet — bookings will appear here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
