import { useState } from 'react';
import FaIcon from '../FaIcon';
import PatientReportsPanel from '../PatientReportsPanel';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime, DAYS } from '../../utils/adminUserUtils';

function DoctorRatingEditor({ doctorId, initialAvg, initialCount }) {
  const [avg, setAvg] = useState(initialAvg ?? '');
  const [count, setCount] = useState(initialCount ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await admin.updateDoctorRating(doctorId, {
        rating_avg: Number(avg),
        rating_count: count === '' ? undefined : Number(count),
      });
      toast.success('Doctor rating updated — shown everywhere on the platform');
    } catch (e) {
      toast.error(e.message || 'Could not update rating');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900 mb-2">Admin rating (single source of truth)</p>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-slate-600">Average (0–5)</label>
          <input type="number" min={0} max={5} step={0.1} className="input-field !py-2 !text-sm w-24 mt-0.5" value={avg} onChange={(e) => setAvg(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-600">Review count</label>
          <input type="number" min={0} className="input-field !py-2 !text-sm w-24 mt-0.5" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        <button type="button" className="btn-primary text-sm !py-2" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save rating'}
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm text-slate-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

const SERVICE_LABELS = {
  online: 'Online consultation',
  home_visit: 'Home visit',
  clinic: 'Clinic visit',
};

export default function AdminUserDetailPanel({
  detail,
  loading,
  onApproveServices,
  onRejectServices,
  actionLoading,
}) {
  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-20 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!detail) {
    return <p className="p-6 text-sm text-slate-500">Could not load user details.</p>;
  }

  const { user, profile, stats } = detail;
  const doctor = profile?.doctor;
  const patient = profile?.patient;
  const recent = profile?.recent_appointments || [];
  const availability = profile?.availability || [];
  const serviceSettings = profile?.service_settings || [];
  const clinicAvailability = profile?.clinic_availability || [];
  const doctorClinics = profile?.clinics || [];
  const patientReportsList = profile?.reports || [];
  const hasPendingServices = serviceSettings.some((s) => s.approval_status === 'pending');

  return (
    <div className="p-4 md:p-6 bg-slate-50/80 border-t border-slate-200/80 space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Detail label="User ID" value={`#${user.id}`} mono />
        <Detail label="Joined" value={formatDateTime(user.created_at)} />
        <Detail label="Last login" value={formatDateTime(user.last_login_at)} />
        <Detail label="Phone" value={user.phone} />
        <Detail label="City" value={[user.city_name, user.state_name].filter(Boolean).join(', ') || '—'} />
        <Detail label="Address" value={user.address} />
        {user.latitude != null && (
          <Detail
            label="Coordinates"
            value={`${parseFloat(user.latitude).toFixed(5)}, ${parseFloat(user.longitude).toFixed(5)}`}
            mono
          />
        )}
      </div>

      {user.role_slug === 'doctor' && doctor && (
        <>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-stethoscope" className="text-violet-600" />
              Doctor profile
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-xl bg-white border border-slate-200 p-4">
              <Detail label="Doctor ID" value={`#${doctor.id}`} mono />
              <Detail label="Specialization" value={doctor.specialization} />
              <Detail label="License" value={doctor.license_number} />
              <Detail label="Experience" value={doctor.experience_years != null ? `${doctor.experience_years} years` : null} />
              <Detail
                label="Verified"
                value={Number(doctor.is_verified) === 1 ? `Yes — ${formatDateTime(doctor.verified_at)}` : 'Not verified'}
              />
              <Detail label="Rating" value={Number(doctor.rating_avg) > 0 ? `${doctor.rating_avg} (${doctor.rating_count} reviews)` : 'Not set'} />
              <Detail label="Clinic fee" value={money(doctor.consultation_fee)} />
              <Detail label="Online fee" value={money(doctor.online_fee)} />
              <Detail label="Home visit fee" value={money(doctor.home_visit_fee)} />
              <Detail label="Home radius" value={doctor.service_radius_km ? `${doctor.service_radius_km} km` : null} />
            </div>
            <DoctorRatingEditor doctorId={doctor.id} initialAvg={doctor.rating_avg} initialCount={doctor.rating_count} />
            {doctor.bio && (
              <p className="text-sm text-slate-600 mt-3 rounded-lg bg-white border border-slate-200 p-3">{doctor.bio}</p>
            )}
          </div>

          {Object.keys(stats || {}).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {[
                ['Total bookings', stats.total_appointments],
                ['Pending', stats.pending],
                ['Confirmed', stats.confirmed],
                ['Completed', stats.completed],
                ['Cancelled', stats.cancelled],
              ].map(([label, val]) => (
                <span key={label} className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700">
                  <span className="text-slate-500">{label}:</span> <strong>{val ?? 0}</strong>
                </span>
              ))}
            </div>
          )}

          {serviceSettings.length > 0 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FaIcon icon="fa-briefcase-medical" className="text-violet-600" />
                  Consultation services
                </h4>
                {hasPendingServices && onApproveServices && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onApproveServices(doctor.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve all pending
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onRejectServices(doctor.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-700 font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject pending
                    </button>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                {serviceSettings.map((s) => {
                  const live = Number(s.is_enabled) === 1 && s.approval_status === 'approved';
                  const pending = s.approval_status === 'pending';
                  const wantsOn = Number(s.requested_enabled) === 1;
                  return (
                    <div
                      key={s.service_type}
                      className={`rounded-xl border p-3 text-sm ${
                        pending
                          ? 'border-amber-300 bg-amber-50/80'
                          : live
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className="font-semibold text-slate-800">{SERVICE_LABELS[s.service_type] || s.service_type}</p>
                      <p className="text-xs mt-1 text-slate-600">
                        Live: <strong>{live ? 'On' : 'Off'}</strong>
                        {pending && (
                          <>
                            {' '}
                            · Requested: <strong>{wantsOn ? 'On' : 'Off'}</strong>
                          </>
                        )}
                      </p>
                      <p className="text-[11px] mt-1 capitalize text-slate-500">{s.approval_status}</p>
                      {pending && onApproveServices && (
                        <div className="flex gap-1 mt-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            className="text-[11px] px-2 py-1 rounded bg-emerald-600 text-white"
                            onClick={() => onApproveServices(doctor.id, s.service_type)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            className="text-[11px] px-2 py-1 rounded border border-red-200 text-red-700"
                            onClick={() => onRejectServices(doctor.id, s.service_type)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {doctorClinics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Mapped clinics</h4>
              <div className="flex flex-wrap gap-2">
                {doctorClinics.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700"
                  >
                    {c.name}
                    {Number(c.is_primary) === 1 && ' · Primary'}
                    <span className="text-slate-400"> ({c.approval_status})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {availability.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Online & home hours</h4>
              <div className="flex flex-wrap gap-2">
                {availability
                  .filter((s) => s.is_active)
                  .map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200"
                    >
                      {DAYS[s.day_of_week] ?? s.day_of_week} {String(s.start_time).slice(0, 5)}–
                      {String(s.end_time).slice(0, 5)}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {clinicAvailability.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Clinic-wise availability</h4>
              <div className="space-y-2">
                {Object.entries(
                  clinicAvailability.reduce((acc, row) => {
                    const key = row.clinic_name || `Clinic #${row.clinic_id}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(row);
                    return acc;
                  }, {})
                ).map(([clinicName, rows]) => (
                  <div key={clinicName} className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-700 mb-2">{clinicName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rows
                        .filter((s) => s.is_active)
                        .map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100"
                          >
                            {DAYS[s.day_of_week] ?? s.day_of_week} {String(s.start_time).slice(0, 5)}–
                            {String(s.end_time).slice(0, 5)}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {user.role_slug === 'patient' && patient && (
        <>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-user-injured" className="text-sky-600" />
              Patient profile
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-xl bg-white border border-slate-200 p-4">
              <Detail label="Patient ID" value={`#${patient.id}`} mono />
              <Detail label="Date of birth" value={formatDate(patient.date_of_birth)} />
              <Detail label="Gender" value={patient.gender} />
              <Detail label="Emergency contact" value={patient.emergency_contact} />
            </div>
            {patient.medical_notes && (
              <p className="text-sm text-slate-600 mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <span className="font-medium text-amber-900">Medical notes: </span>
                {patient.medical_notes}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200">
              Appointments: <strong>{stats.total_appointments ?? 0}</strong>
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200">
              Paid: <strong>{money(stats.total_paid)}</strong>
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200">
              Booked value: <strong>{money(stats.total_booked_amount)}</strong>
            </span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FaIcon icon="fa-file-medical" className="text-sky-600" />
              Uploaded medical reports
              <span className="text-xs font-normal text-slate-500">({patientReportsList.length})</span>
            </h4>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <PatientReportsPanel
                reports={patientReportsList}
                emptyHint="No reports on file for this patient."
              />
            </div>
          </div>
        </>
      )}

      {recent.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Recent appointments</h4>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Booking</th>
                  <th className="px-3 py-2 font-medium">With</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => {
                  const withName =
                    user.role_slug === 'doctor'
                      ? [a.patient_first_name, a.patient_last_name].filter(Boolean).join(' ')
                      : `Dr. ${[a.doctor_first_name, a.doctor_last_name].filter(Boolean).join(' ')}`;
                  return (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{a.booking_id || `#${a.id}`}</td>
                      <td className="px-3 py-2">{withName || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {formatDate(a.appointment_date)} {String(a.start_time || '').slice(0, 5)}
                      </td>
                      <td className="px-3 py-2 capitalize">{a.status}</td>
                      <td className="px-3 py-2 text-right font-medium">{money(a.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
