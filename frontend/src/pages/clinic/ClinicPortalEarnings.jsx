import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function ClinicPortalEarnings() {
  const { clinicId, loading: bootLoading, isAdminMode, can } = useClinicPortal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modePrices, setModePrices] = useState({ clinic: 0, home_visit: 0, online: 0 });
  const [savingPrices, setSavingPrices] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [res, priceRes] = await Promise.all([
        clinicPortal.earnings(clinicId),
        clinicPortal.getModePrices(clinicId),
      ]);
      setData(res.data || res);
      setModePrices((old) => ({ ...old, ...(priceRes.data || priceRes || {}) }));
    } catch (e) {
      toast.error(e.message || 'Failed to load earnings');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId && isAdminMode && can('earnings.view')) load();
  }, [load, clinicId, isAdminMode, can]);

  const totals = data?.totals || {};
  const byMonth = data?.by_month || [];
  const byType = data?.by_type || [];
  const byDoctor = data?.by_doctor || [];

  const monthChart = useMemo(() => {
    const labels = byMonth.map((r) => {
      const [y, m] = String(r.ym).split('-');
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    });
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: byMonth.map((r) => Number(r.revenue || 0)),
          backgroundColor: 'rgba(13, 148, 136, 0.75)',
          borderRadius: 8,
        },
      ],
    };
  }, [byMonth]);

  const typeChart = useMemo(() => {
    const labels = byType.map((r) => String(r.consultation_type || 'other').replace(/_/g, ' '));
    const colors = ['#0d9488', '#0284c7', '#f59e0b', '#8b5cf6', '#ef4444'];
    return {
      labels,
      datasets: [
        {
          data: byType.map((r) => Number(r.revenue || 0)),
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [byType]);

  const cards = [
    { label: 'Lifetime revenue', value: money(totals.revenue_total), icon: 'fa-sack-dollar', tone: 'text-emerald-600 bg-emerald-100' },
    { label: 'This month', value: money(totals.revenue_month), icon: 'fa-calendar-check', tone: 'text-teal-600 bg-teal-100' },
    { label: 'Today', value: money(totals.revenue_today), icon: 'fa-bolt', tone: 'text-amber-600 bg-amber-100' },
    { label: 'Completed sessions', value: totals.completed_sessions ?? 0, icon: 'fa-circle-check', tone: 'text-sky-600 bg-sky-100' },
  ];

  if (!bootLoading && (!isAdminMode || !can('earnings.view'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const savePrices = async () => {
    setSavingPrices(true);
    try {
      await clinicPortal.saveModePrices(clinicId, Object.fromEntries(Object.entries(modePrices).map(([key, value]) => [key, Number(value)])));
      toast.success('Session mode prices saved');
    } catch (error) {
      toast.error(error.message || 'Could not save mode prices');
    } finally {
      setSavingPrices(false);
    }
  };

  return (
    <ClinicPortalShell
      title="Finance & Earnings"
      subtitle="Clinic revenue from confirmed & completed appointments"
      actions={
        <Link to="/clinic-portal/appointments" className="btn-outline text-sm inline-flex items-center gap-2">
          <FaIcon icon="fa-calendar-check" />
          View appointments
        </Link>
      }
    >
      <div className="space-y-6">
        {bootLoading || loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cards.map((c) => (
                <div key={c.label} className="glass-card !p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${c.tone}`}>
                    <FaIcon icon={c.icon} />
                  </div>
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{c.value}</p>
                </div>
              ))}
            </div>

            {Number(totals.pending_amount) > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <FaIcon icon="fa-triangle-exclamation" className="mr-2 text-amber-600" />
                Pending / unpaid bookings: <strong>{money(totals.pending_amount)}</strong>
              </div>
            )}

            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-4">Revenue — last 12 months</h2>
                {byMonth.length ? (
                  <Bar
                    data={monthChart}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <p className="text-sm text-slate-500 py-10 text-center">No revenue data yet</p>
                )}
              </div>
              <div className="lg:col-span-2 glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-4">By consultation type</h2>
                {byType.length ? (
                  <div className="max-w-[240px] mx-auto">
                    <Doughnut data={typeChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-10 text-center">No data</p>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-3">By doctor</h2>
                <ul className="space-y-2">
                  {byDoctor.map((d) => (
                    <li key={d.doctor_id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-slate-900">{d.doctor_name || 'Doctor'}</p>
                        <p className="text-xs text-slate-500">{d.sessions} sessions</p>
                      </div>
                      <p className="font-bold text-emerald-700">{money(d.revenue)}</p>
                    </li>
                  ))}
                  {!byDoctor.length && <p className="text-sm text-slate-500">No doctor revenue yet</p>}
                </ul>
              </div>
              <div className="glass-card !p-5">
                <h2 className="font-bold text-slate-900 mb-3">Recent revenue appointments</h2>
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {(data?.recent || []).map((a) => (
                    <li key={a.id} className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{a.patient_name}</p>
                        <p className="text-xs text-slate-500">
                          {a.appointment_date} · {a.doctor_name || '—'}
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-700 shrink-0">{money(a.amount)}</p>
                    </li>
                  ))}
                  {!data?.recent?.length && <p className="text-sm text-slate-500">No paid sessions yet</p>}
                </ul>
              </div>
            </div>

            <div className="glass-card !p-5 max-w-md">
              <h2 className="font-bold text-slate-900">Session mode prices</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">Default price used for clinic-created bookings and mode changes.</p>
              <div className="space-y-3">
                {['clinic', 'home_visit', 'online'].map((mode) => (
                  <label key={mode} className="flex items-center justify-between gap-3 text-sm font-medium capitalize">
                    {mode === 'clinic' ? 'At clinic' : mode.replace('_', ' ')}
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field !w-36 !pl-7"
                        value={modePrices[mode] ?? ''}
                        onChange={(e) => setModePrices((old) => ({ ...old, [mode]: e.target.value }))}
                      />
                    </div>
                  </label>
                ))}
              </div>
              {can('billing.settings') && (
                <button type="button" className="btn-primary w-full justify-center mt-4" disabled={savingPrices} onClick={savePrices}>
                  {savingPrices ? 'Saving…' : 'Save prices'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </ClinicPortalShell>
  );
}
