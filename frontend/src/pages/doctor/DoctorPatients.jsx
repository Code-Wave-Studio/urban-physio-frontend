import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import PatientAvatar from '../../components/PatientAvatar';
import PatientProfileCard from '../../components/PatientProfileCard';
import AppointmentDetailCard from '../../components/AppointmentDetailCard';
import { doctors } from '../../services/api';
import PatientReportsSection from '../../components/PatientReportsSection';
import KinesteXAiPerformancePanel from '../../components/exercise/KinesteXAiPerformancePanel';
import toast from 'react-hot-toast';
import { DOCTOR_NAV } from '../../constants/doctorNav';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    doctors
      .patients()
      .then((res) => setPatients(res.data || []))
      .catch((err) => toast.error(err.message || 'Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? patients.filter((p) => {
        const blob = [
          p.first_name,
          p.last_name,
          p.phone,
          p.email,
          p.city_name,
          ...(p.appointments || []).map((a) => a.booking_id),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      })
    : patients;

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Patient History</h1>
          <p className="text-slate-600 text-sm mt-1">
            Full patient profile and every booking with you
          </p>
        </div>
        <button type="button" onClick={load} className="btn-outline text-sm py-2 px-3 inline-flex items-center gap-2">
          <FaIcon icon="fa-arrows-rotate" />
          Refresh
        </button>
      </div>

      <div className="glass-card mb-6 p-4">
        <div className="relative">
          <FaIcon
            icon="fa-magnifying-glass"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 text-sm"
          />
          <input
            className="input-field pl-9"
            placeholder="Search name, phone, email, booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-40 animate-pulse bg-white/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-16 text-slate-600">
          <FaIcon icon="fa-users" className="text-3xl text-primary-600 mb-3" />
          <p>No patients found yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            <strong>{filtered.length}</strong> patient{filtered.length !== 1 ? 's' : ''} — tap to expand
            full history
          </p>
          {filtered.map((p) => {
            const open = expandedId === p.id;
            const apptCount = p.appointments?.length ?? p.visit_count ?? 0;
            return (
              <div key={p.id} className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="w-full glass-card text-left hover:border-primary-200/60 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <PatientAvatar patient={p} size="md" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {p.phone} · {p.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="text-slate-600">
                        <strong>{apptCount}</strong> visits
                      </span>
                      <span className="text-slate-500">Last: {p.last_visit || '—'}</span>
                      {p.total_paid > 0 && (
                        <span className="font-semibold text-primary-700">
                          ₹{Number(p.total_paid).toLocaleString('en-IN')}
                        </span>
                      )}
                      <FaIcon
                        icon={open ? 'fa-chevron-up' : 'fa-chevron-down'}
                        className="text-slate-400 ml-auto sm:ml-0"
                      />
                    </div>
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 pl-0 sm:pl-2 animate-slide-up">
                    <PatientProfileCard patient={p} />
                    <PatientReportsSection patientId={p.patient_id ?? p.id} />
                    <KinesteXAiPerformancePanel patientId={p.patient_id ?? p.id} />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FaIcon icon="fa-clock-rotate-left" className="text-primary-600" />
                        Appointment history ({apptCount})
                      </h3>
                      {p.appointments?.length ? (
                        <div className="space-y-4">
                          {p.appointments.map((a) => (
                            <AppointmentDetailCard key={a.id} appt={a} view="doctor" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 glass-card py-6 text-center">
                          No appointments on record.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
