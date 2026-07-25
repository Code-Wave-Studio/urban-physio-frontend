import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import TreatmentJourneyTimeline, {
  JourneyCompareSummary,
} from '../../components/treatmentJourney/TreatmentJourneyTimeline';
import { PATIENT_NAV } from '../../constants/patientNav';
import { treatmentJourney } from '../../services/api';

export default function PatientTreatmentJourney() {
  const [journey, setJourney] = useState({ sessions: [], summary: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    treatmentJourney
      .list()
      .then((res) => {
        const data = res.data || res || {};
        setJourney({ sessions: data.sessions || [], summary: data.summary || null });
      })
      .catch((e) => toast.error(e.message || 'Failed to load treatment history'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Treatment Journey</h1>
        <p className="text-slate-600 text-sm mt-1">
          Your complete session-by-session treatment history, recorded by your doctors
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-36 animate-pulse bg-white/30" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {journey.sessions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="glass-card !p-4">
                <p className="text-xs text-slate-500">Total sessions</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {journey.summary?.total_sessions ?? journey.sessions.length}
                </p>
              </div>
              <div className="glass-card !p-4">
                <p className="text-xs text-slate-500">First visit</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {journey.summary?.first?.visit_date || '—'}
                </p>
              </div>
              <div className="glass-card !p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-500">Latest visit</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {journey.summary?.latest?.visit_date || '—'}
                </p>
              </div>
            </div>
          )}

          <JourneyCompareSummary summary={journey.summary} />

          <TreatmentJourneyTimeline sessions={journey.sessions} />

          {journey.sessions.length > 0 && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pb-4">
              <FaIcon icon="fa-lock" />
              Read-only — these records are maintained by your treating doctors.
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
