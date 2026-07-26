import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { PATIENT_NAV } from '../../constants/patientNav';
import { patientPortal } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function pct(done, total) {
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.round((Number(done || 0) / t) * 100));
}

function ProgressBar({ value, tone = 'bg-primary-500' }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function PatientProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientPortal
      .progress()
      .then((r) => setData(r.data))
      .catch((e) => toast.error(e.message || 'Could not load progress'))
      .finally(() => setLoading(false));
  }, []);

  const courses = data?.appointment_courses || [];
  const packages = data?.packages || [];
  const exercises = data?.exercises || [];
  const painTrend = data?.pain_trend || [];

  const painChart = useMemo(() => {
    if (!painTrend.length) return null;
    return {
      data: {
        labels: painTrend.map((p) => `S${p.session_number}`),
        datasets: [
          {
            label: 'Pain score',
            data: painTrend.map((p) => Number(p.pain_score)),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 10, ticks: { stepSize: 2 } } },
      },
    };
  }, [painTrend]);

  const firstPain = painTrend[0]?.pain_score;
  const lastPain = painTrend[painTrend.length - 1]?.pain_score;
  const painDelta = firstPain != null && lastPain != null ? Number(firstPain) - Number(lastPain) : null;

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Progress</h1>
        <p className="text-sm text-slate-500 mt-1">Track your recovery — sessions completed, exercise adherence and pain trend.</p>
      </div>

      {loading ? (
        <div className="glass-card p-10 text-center text-slate-400">
          <FaIcon icon="fa-spinner" className="fa-spin text-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pain trend */}
          <section className="glass-card !p-4 md:!p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FaIcon icon="fa-heart-pulse" className="text-rose-500" /> Pain trend
              </h2>
              {painDelta != null && (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    painDelta > 0 ? 'bg-emerald-50 text-emerald-700' : painDelta < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {painDelta > 0 ? `▼ ${painDelta} pts improved` : painDelta < 0 ? `▲ ${Math.abs(painDelta)} pts` : 'No change'}
                </span>
              )}
            </div>
            {painChart ? (
              <div className="h-56">
                <Line data={painChart.data} options={painChart.options} />
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">No pain scores recorded yet.</p>
            )}
          </section>

          {/* Session courses */}
          <section>
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-list-check" className="text-primary-600" /> Treatment courses
            </h2>
            {courses.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-400 text-sm">No multi-session courses yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {courses.map((c) => {
                  const p = pct(c.completed_sessions, c.number_of_sessions);
                  return (
                    <div key={c.id} className="glass-card !p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm truncate">Dr. {c.doctor_name}</p>
                        <span className="text-xs text-slate-500">{c.booking_id}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">{c.pain_type || 'Treatment'}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={p} />
                        <span className="text-xs font-bold text-slate-700 shrink-0">
                          {c.completed_sessions}/{c.number_of_sessions}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Packages */}
          {packages.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FaIcon icon="fa-box-open" className="text-orange-600" /> Package progress
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {packages.map((pk) => {
                  const p = pct(pk.completed_sessions, pk.total_sessions);
                  return (
                    <div key={pk.id} className="glass-card !p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm truncate">{pk.package_name}</p>
                        <span className="text-xs capitalize text-slate-500">{pk.status}</span>
                      </div>
                      {pk.doctor_name && <p className="text-xs text-slate-500 mt-0.5">Dr. {pk.doctor_name}</p>}
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={p} tone="bg-orange-500" />
                        <span className="text-xs font-bold text-slate-700 shrink-0">
                          {pk.completed_sessions}/{pk.total_sessions}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Exercise adherence */}
          <section>
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-dumbbell" className="text-emerald-600" /> Exercise adherence
            </h2>
            {exercises.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-400 text-sm">No exercise plans yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {exercises.map((ex) => (
                  <div key={ex.id} className="glass-card !p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm truncate">{ex.title || 'Exercise plan'}</p>
                      <span
                        className={`text-[11px] capitalize px-2 py-0.5 rounded-full border ${
                          ex.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {ex.status}
                      </span>
                    </div>
                    {ex.doctor_name && <p className="text-xs text-slate-500 mt-0.5">Dr. {ex.doctor_name}</p>}
                    <p className="text-xs text-slate-600 mt-2">
                      <FaIcon icon="fa-circle-check" className="text-emerald-500 mr-1" />
                      {ex.completed_logs} completions · {ex.total_items} exercise{Number(ex.total_items) !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
