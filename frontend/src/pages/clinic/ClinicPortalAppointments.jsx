import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { CLINIC_NAV } from '../../constants/clinicNav';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';
import { STATUS_STYLES, TYPE_ICONS, formatTime, formatType } from '../../utils/appointmentListUtils';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function ClinicPortalAppointments() {
  const { clinicId, loading: bootLoading } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState('list'); // list | today

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const params = { limit: 150 };
      if (status !== 'all') params.status = status;
      if (q.trim()) params.q = q.trim();
      if (view === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        params.from = today;
        params.to = today;
      } else {
        if (from) params.from = from;
        if (to) params.to = to;
      }
      const res = await clinicPortal.appointments(clinicId, params);
      const data = res.data || res;
      setRows(data.items || data || []);
      setSummary(data.summary || {});
    } catch (e) {
      toast.error(e.message || 'Failed to load appointments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId, status, q, from, to, view]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const todayCount = useMemo(
    () => rows.filter((r) => r.appointment_date === new Date().toISOString().slice(0, 10)).length,
    [rows]
  );

  return (
    <DashboardLayout links={CLINIC_NAV} variant="clinic">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Appointments</h1>
            <p className="text-sm text-slate-500 mt-1">All clinic bookings across linked doctors</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                view === 'today' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
              onClick={() => setView('today')}
            >
              Today ({todayCount || '…'})
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                view === 'list' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
              onClick={() => setView('list')}
            >
              All list
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          {[
            ['Total shown', summary.total ?? rows.length, 'fa-calendar'],
            ['Pending', summary.pending ?? 0, 'fa-clock'],
            ['Confirmed', summary.confirmed ?? 0, 'fa-circle-check'],
            ['Completed', summary.completed ?? 0, 'fa-flag-checkered'],
          ].map(([label, value, icon]) => (
            <div key={label} className="glass-card !p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <FaIcon icon={icon} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card !p-4 flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  status === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className="input-field text-sm lg:max-w-xs"
            placeholder="Search booking, patient, doctor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {view === 'list' && (
            <>
              <input type="date" className="input-field text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input type="date" className="input-field text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
          <button type="button" className="btn-outline text-sm" onClick={load}>
            Refresh
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
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-teal-50/30">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.booking_id || a.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{a.patient_name || '—'}</p>
                        {a.patient_phone && <p className="text-xs text-slate-500">{a.patient_phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{a.doctor_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {a.appointment_date}
                        <span className="text-slate-400"> · </span>
                        {formatTime(a.start_time)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 capitalize text-slate-700">
                          <FaIcon icon={TYPE_ICONS[a.consultation_type] || 'fa-calendar'} className="text-teal-600 text-xs" />
                          {formatType(a.consultation_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{money(a.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        No appointments match these filters
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
