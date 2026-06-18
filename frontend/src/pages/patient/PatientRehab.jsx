import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { exercisePrescriptions } from '../../services/api';
import { PATIENT_NAV } from '../../constants/patientNav';
import toast from 'react-hot-toast';

export default function PatientRehab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    exercisePrescriptions
      .list({ status: 'active' })
      .then((res) => setList(res.data || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await exercisePrescriptions.get(id);
      setDetail(res.data ?? res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Rehab Plan</h1>
          <p className="text-slate-600 text-sm mt-1">Exercise prescriptions from your physiotherapist</p>
        </div>
        <Link to="/exercises" className="btn-outline text-sm inline-flex items-center gap-2">
          <FaIcon icon="fa-dumbbell" /> Exercise library
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <FaIcon icon="fa-person-walking" className="text-3xl text-slate-300 mb-3" />
          <p className="text-slate-600">No active prescriptions yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((rx) => (
            <article key={rx.id} className="glass-card p-4">
              <h2 className="font-bold text-slate-800">{rx.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Dr. {rx.doctor_first_name} {rx.doctor_last_name} · From {rx.start_date}
              </p>
              <p className="text-sm text-slate-600 mt-2">{rx.exercise_count || 0} exercises prescribed</p>
              <button type="button" onClick={() => openDetail(rx.id)} className="btn-primary text-sm mt-3">
                View plan
              </button>
            </article>
          ))}
        </div>
      )}

      {(detail || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            {loadingDetail ? (
              <p className="text-slate-500">Loading…</p>
            ) : detail ? (
              <>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{detail.title}</h2>
                    {detail.diagnosis_notes && (
                      <p className="text-sm text-slate-600 mt-1">{detail.diagnosis_notes}</p>
                    )}
                  </div>
                  <button type="button" onClick={() => setDetail(null)} className="text-slate-400">
                    <FaIcon icon="fa-xmark" />
                  </button>
                </div>
                <div className="space-y-4">
                  {(detail.exercises || []).map((ex, i) => (
                    <div key={ex.id || i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <h3 className="font-bold text-slate-800">{ex.exercise_name}</h3>
                      <p className="text-xs text-slate-500 mt-1 capitalize">{ex.body_area}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-white rounded border">{ex.sets} sets × {ex.reps} reps</span>
                        {ex.hold_seconds && <span className="px-2 py-0.5 bg-white rounded border">Hold {ex.hold_seconds}s</span>}
                        <span className="px-2 py-0.5 bg-white rounded border">{ex.frequency}</span>
                      </div>
                      {ex.special_instructions && (
                        <p className="text-sm text-slate-600 mt-2">{ex.special_instructions}</p>
                      )}
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{ex.exercise_instructions}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
