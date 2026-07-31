import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
import RichSessionCard from '../../components/RichSessionCard';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal, erpAssessments, exercisePrescriptions } from '../../services/api';
import PatientOverviewTab from '../../components/erp/PatientOverviewTab';
import PatientTimelineTab from '../../components/erp/PatientTimelineTab';
import AssessmentResponseForm from '../../components/erp/AssessmentResponseForm';
import PackageCard from '../../components/clinic/PackageCard';
import PatientCommLog from '../../components/clinic/communication/PatientCommLog';

const TABS = ['Overview', 'Timeline', 'Assessments', 'Packages', 'Protocols', 'Payments', 'SOAP', 'Documents', 'Reports', 'Communication'];
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const parse = (value) => {
  if (typeof value !== 'string') return value || {};
  try { return JSON.parse(value); } catch { return {}; }
};

function Empty({ children }) {
  return <div className="py-10 text-center text-sm text-slate-500">{children}</div>;
}

function KeyValues({ data }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {Object.entries(data || {}).map(([key, value]) => (
        <div key={key} className="rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] uppercase text-slate-400">{key.replace(/_/g, ' ')}</p>
          <p className="text-sm text-slate-700 mt-1">{Array.isArray(value) ? value.join(', ') : String(value ?? '—')}</p>
        </div>
      ))}
    </div>
  );
}

/** Normalize cp_1 / p_2 → cp-1 / p-2 (hyphen is the canonical key). */
function normalizePatientKey(raw) {
  const key = String(raw || '').trim();
  const m = key.match(/^(cp|p)[_-](\d+)$/i);
  if (m) return `${m[1].toLowerCase()}-${m[2]}`;
  return key;
}

export default function ClinicPatientDetailPage() {
  const { patientKey: rawPatientKey } = useParams();
  const patientKey = normalizePatientKey(rawPatientKey);
  const { clinicId, can, loading: boot } = useClinicPortal();
  const [data, setData] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [erpResponses, setErpResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [booking, setBooking] = useState(false);
  const [bookingSeed, setBookingSeed] = useState({});
  const [activeAssessment, setActiveAssessment] = useState(null); // { responseId?, templateId? }
  const [pickTemplate, setPickTemplate] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId || !patientKey) return;
    setLoading(true);
    try {
      const res = await clinicPortal.patientDetail(clinicId, patientKey);
      setData(res.data || res);
    } catch (error) {
      toast.error(error.message || 'Could not load patient');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clinicId, patientKey]);

  const loadErpAssessments = useCallback(async () => {
    if (!clinicId || !patientKey) return;
    try {
      const [tplRes, respRes] = await Promise.all([
        erpAssessments.listTemplates({ status: 'published', clinic_id: clinicId }),
        erpAssessments.listResponses({ patient_key: patientKey, clinic_id: clinicId }),
      ]);
      setTemplates(tplRes.data || tplRes || []);
      setErpResponses(respRes.data || respRes || []);
    } catch (error) {
      setTemplates([]);
      setErpResponses([]);
      toast.error(error.message || 'Could not load assessments');
    }
  }, [clinicId, patientKey]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  useEffect(() => {
    if (clinicId) loadErpAssessments();
  }, [clinicId, loadErpAssessments]);

  const profile = data?.profile || {};
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.name || 'Patient';
  const patientIds = useMemo(() => {
    const key = data?.patient_key || patientKey;
    if (String(key).startsWith('p-')) {
      return { patient_id: Number(String(key).slice(2)) || undefined };
    }
    if (String(key).startsWith('cp-')) {
      return { clinic_patient_id: Number(String(key).slice(3)) || undefined };
    }
    return {};
  }, [data, patientKey]);

  const assessmentPatient = useMemo(() => ({
    ...profile,
    name,
    id_code: data?.patient_key || patientKey,
    patient_id_display: data?.patient_key || patientKey,
    dob: profile.date_of_birth || profile.dob || null,
    photo_url: profile.avatar || profile.photo_url || null,
  }), [profile, name, data, patientKey]);

  const startAssessment = async (templateId) => {
    if (!templateId) return;
    if (!patientIds.patient_id && !patientIds.clinic_patient_id) {
      return toast.error('Patient identity missing — reload the page and try again');
    }
    setTriggering(true);
    try {
      const res = await erpAssessments.createResponse({
        template_id: Number(templateId),
        responses: {},
        ...patientIds,
      }, { clinic_id: clinicId });
      const id = res.id || res.data?.id;
      if (!id) throw new Error('Assessment created but no id returned');
      toast.success('Assessment started');
      setPickTemplate(false);
      setActiveAssessment({ responseId: id, templateId: Number(templateId) });
      await loadErpAssessments();
    } catch (error) {
      toast.error(error.message || 'Could not start assessment');
    } finally {
      setTriggering(false);
    }
  };

  const triggerAssessment = () => {
    if (!templates.length) {
      return toast.error('Publish an Assessment Builder template first (Settings → Assessment Builder)');
    }
    if (templates.length === 1) {
      startAssessment(templates[0].id);
      return;
    }
    setPickTemplate(true);
  };

  const terminate = async (pkg) => {
    if (!window.confirm(`Terminate ${pkg.package_name || pkg.name || 'this package'}?`)) return;
    try {
      const res = await clinicPortal.terminatePackage(clinicId, pkg.id, {});
      const out = res.data || res || {};
      toast.success(
        out.refund_amount != null
          ? `Package terminated · refund ${money(out.refund_amount)}`
          : 'Package terminated'
      );
      load();
    } catch (error) {
      toast.error(error.message || 'Termination failed');
    }
  };

  const timeline = useMemo(
    () =>
      (data?.appointments || [])
        .flatMap((a) => {
          const events = parse(a.session_timeline_json || a.timeline_json);
          return Array.isArray(events) && events.length
            ? events.map((event) => ({ ...event, appointment: a }))
            : [{ type: a.status || 'appointment', at: `${a.appointment_date} ${a.start_time}`, appointment: a }];
        })
        .sort((a, b) => String(b.at || b.created_at).localeCompare(String(a.at || a.created_at))),
    [data]
  );

  return (
    <ClinicPortalShell
      title={loading ? 'Patient' : name}
      subtitle="Clinical, package and payment history in one place"
      actions={(
        <div className="portal-page-actions">
          <Link to="/clinic-portal/patients" className="btn-outline inline-flex items-center gap-2">
            <FaIcon icon="fa-arrow-left" />
            <span className="hidden sm:inline">Patients</span>
            <span className="sm:hidden">Back</span>
          </Link>
          {can('appointments.manage') && (
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => {
              setBookingSeed({});
              setBooking(true);
            }}>
              <FaIcon icon="fa-calendar-plus" />
              Book
            </button>
          )}
        </div>
      )}
    >
      <ClinicBookingModal
        clinicId={clinicId}
        open={booking}
        initialPatient={bookingSeed.patient || data?.patient_key || patientKey}
        initialPackageAssignmentId={bookingSeed.packageAssignmentId}
        initialMode={bookingSeed.mode}
        onClose={() => {
          setBooking(false);
          setBookingSeed({});
        }}
        onBooked={() => {
          setBooking(false);
          setBookingSeed({});
          load();
        }}
      />
      {boot || loading ? (
        <div className="glass-card h-72 animate-pulse" />
      ) : !data ? (
        <div className="glass-card"><Empty>Patient could not be found.</Empty></div>
      ) : (
        <div className="space-y-4">
          <section className="glass-card !p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-slate-900">{name}</h1>
              <p className="text-sm text-slate-500">{profile.phone || 'No phone'} · {profile.email || 'No email'}</p>
              <p className="text-xs text-slate-400 mt-1">{data.patient_key}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="font-bold">{data.appointments?.length || 0}</p>
                <p className="text-[10px] text-slate-500">Visits</p>
              </div>
              <div>
                <p className="font-bold">{data.packages?.length || 0}</p>
                <p className="text-[10px] text-slate-500">Packages</p>
              </div>
            </div>
          </section>

          <div className="portal-tabs">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`px-3 py-2 rounded-full text-xs font-semibold ${
                  tab === item ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <section className="glass-card !p-3 sm:!p-4 md:!p-5 min-w-0">
            {tab === 'Overview' && (
              <PatientOverviewTab
                patientKey={data.patient_key || patientKey}
                clinicId={clinicId}
                initialData={data._erpOverview}
                onSaved={() => load()}
              />
            )}

            {tab === 'Timeline' && (
              <PatientTimelineTab patientKey={data.patient_key || patientKey} />
            )}

            {tab === 'Assessments' && (
              <>
                {activeAssessment ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-bold">Fill assessment</h2>
                      <button
                        type="button"
                        className="btn-outline text-xs !py-2"
                        onClick={() => {
                          setActiveAssessment(null);
                          loadErpAssessments();
                        }}
                      >
                        ← Back to list
                      </button>
                    </div>
                    <AssessmentResponseForm
                      clinicId={clinicId}
                      responseId={activeAssessment.responseId}
                      templateId={activeAssessment.templateId}
                      patientKey={data.patient_key || patientKey}
                      patient={assessmentPatient}
                      onSaved={() => {
                        loadErpAssessments();
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <h2 className="font-bold">Assessments</h2>
                      {can('assessments.manage') && (
                        <button className="btn-primary text-xs !py-2" type="button" onClick={triggerAssessment} disabled={triggering}>
                          {triggering ? 'Starting…' : 'Trigger reassessment'}
                        </button>
                      )}
                    </div>

                    {pickTemplate && (
                      <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50/50 p-3 space-y-2">
                        <p className="text-sm font-semibold text-slate-800">Choose a published template</p>
                        {templates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            disabled={triggering}
                            onClick={() => startAssessment(t.id)}
                            className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-teal-400 transition-colors"
                          >
                            <span className="font-medium">{t.name}</span>
                            <span className="text-xs text-slate-400 ml-2">v{t.version}</span>
                          </button>
                        ))}
                        <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => setPickTemplate(false)}>
                          Cancel
                        </button>
                      </div>
                    )}

                    {templates.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">Available templates</p>
                        <div className="flex flex-wrap gap-2">
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => can('assessments.manage') && startAssessment(t.id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100"
                            >
                              <FaIcon icon="fa-solid fa-clipboard-list" className="text-[10px]" />
                              {t.name}
                              <span className="text-teal-500">v{t.version}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {erpResponses.map((a) => (
                        <div key={`erp-${a.id}`} className="rounded-xl border border-slate-100 p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{a.template_name || 'Assessment'}</p>
                            <p className="text-xs text-slate-400">
                              v{a.template_version} · {a.status} · {String(a.created_at || '').slice(0, 10)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-outline text-xs !py-1.5 shrink-0"
                            onClick={() => setActiveAssessment({ responseId: a.id, templateId: a.template_id })}
                          >
                            {a.status === 'signed' || a.status === 'locked' ? 'View' : 'Continue'}
                          </button>
                        </div>
                      ))}
                      {(data.assessments || []).map((a) => (
                        <details key={`legacy-${a.id}`} className="rounded-xl border border-slate-100 p-3">
                          <summary className="font-semibold text-sm cursor-pointer">
                            {a.template_name} · v{a.template_version}
                            <span className="float-right text-xs text-slate-400">{String(a.created_at || '').slice(0, 10)}</span>
                          </summary>
                          <div className="mt-3"><KeyValues data={parse(a.responses_json)} /></div>
                        </details>
                      ))}
                      {!erpResponses.length && !data.assessments?.length && (
                        <Empty>
                          {templates.length
                            ? 'No assessments yet — pick a template above to start.'
                            : 'No assessments. Publish a template in Assessment Builder first.'}
                        </Empty>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'Packages' && (
              <div className="space-y-3">
                {data.packages?.map((p) => (
                  <PackageCard
                    key={p.id}
                    pkg={p}
                    canManage={can('packages.manage')}
                    onTerminate={can('packages.manage') ? terminate : null}
                    onSchedule={can('appointments.manage') ? (pkg) => {
                      setBookingSeed({
                        patient: data.patient_key || patientKey,
                        packageAssignmentId: pkg.id,
                        mode: ['clinic', 'home_visit', 'online'].includes(pkg.service_mode) ? pkg.service_mode : 'clinic',
                      });
                      setBooking(true);
                    } : undefined}
                    onReturnCredit={can('packages.manage') ? async (pkg) => {
                      if (!window.confirm(`Return one session credit to "${pkg.package_name || 'this package'}"?`)) return;
                      try {
                        await clinicPortal.returnCredit(clinicId, pkg.id);
                        toast.success('Session credit returned');
                        load();
                      } catch (e) {
                        toast.error(e.message || 'Could not return credit');
                      }
                    } : null}
                  />
                ))}
                {!data.packages?.length && <Empty>No packages. Assign a catalog package or create a custom bulk session from the Packages page.</Empty>}
              </div>
            )}

            {tab === 'Protocols' && (
              <div className="space-y-3">
                {(data.exercise_prescriptions || []).map((rx) => (
                  <div key={rx.id} className="rounded-xl border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 flex items-center gap-2">
                        {rx.is_protocol == 1 && <FaIcon icon="fa-notes-medical" className="text-teal-600 text-xs" />}
                        {rx.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 capitalize">
                        {rx.publish_status || 'published'} · {rx.status}
                        {rx.published_at ? ` · published ${String(rx.published_at).slice(0, 10)}` : ''}
                      </p>
                      {rx.protocol_goals && <p className="text-xs text-slate-600 mt-2">{rx.protocol_goals}</p>}
                    </div>
                    {(rx.publish_status === 'draft') && (
                      <button
                        type="button"
                        className="btn-primary text-xs py-1.5 px-3"
                        onClick={async () => {
                          try {
                            await exercisePrescriptions.publish(rx.id, { is_protocol: true });
                            toast.success('Protocol published to patient');
                            load();
                          } catch (e) {
                            toast.error(e.message || 'Publish failed');
                          }
                        }}
                      >
                        Publish to patient
                      </button>
                    )}
                  </div>
                ))}
                {!data.exercise_prescriptions?.length && <Empty>No treatment protocols / exercise plans.</Empty>}
              </div>
            )}

            {tab === 'Payments' && (
              <>
                {!data.payments?.length ? (
                  <Empty>No payments recorded.</Empty>
                ) : (
                  <>
                    <div className="portal-mobile-list !p-0 space-y-3">
                      {(data.payments || []).map((pay) => (
                        <article key={pay.id} className="rounded-xl border border-slate-100 p-3 flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{pay.booking_id || '—'}</p>
                            <p className="text-xs text-slate-500">{String(pay.created_at || pay.appointment_date || '').slice(0, 10)} · <span className="capitalize">{pay.status || '—'}</span></p>
                          </div>
                          <p className="font-semibold text-emerald-700 shrink-0">{money(pay.amount)}</p>
                        </article>
                      ))}
                    </div>
                    <div className="portal-desktop-table portal-table-wrap">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[11px] uppercase text-slate-500 bg-slate-50">
                          <tr>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Booking</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.payments || []).map((pay) => (
                            <tr key={pay.id} className="border-t">
                              <td className="px-3 py-3 whitespace-nowrap">{String(pay.created_at || pay.appointment_date || '').slice(0, 10)}</td>
                              <td className="px-3 py-3">{pay.booking_id || '—'}</td>
                              <td className="px-3 py-3 capitalize">{pay.status || '—'}</td>
                              <td className="px-3 py-3 text-right font-semibold">{money(pay.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'SOAP' && (
              <div className="space-y-3">
                {data.soap_notes?.map((note) => (
                  <div key={note.id} className="rounded-xl border p-4">
                    <p className="text-xs text-slate-400 mb-3">{String(note.updated_at || note.created_at || '').slice(0, 10)}</p>
                    <KeyValues data={{ subjective: note.subjective, objective: note.objective, assessment: note.assessment, plan: note.plan }} />
                  </div>
                ))}
                {!data.soap_notes?.length && <Empty>No SOAP notes.</Empty>}
              </div>
            )}

            {tab === 'Documents' && (
              <div>
                <div className="flex justify-between">
                  <h2 className="font-bold">Documents</h2>
                  <Link to="/clinic-portal/documents" className="btn-outline text-xs !py-2">Open document manager</Link>
                </div>
                <div className="mt-4">
                  {data.documents?.map((doc) => (
                    <div key={doc.id} className="border-t py-3 text-sm flex justify-between">
                      <span>{doc.title || doc.file_name || 'Document'}</span>
                      <span className="text-slate-400">{String(doc.created_at || '').slice(0, 10)}</span>
                    </div>
                  ))}
                  {!data.documents?.length && <Empty>No documents.</Empty>}
                </div>
              </div>
            )}

            {tab === 'Reports' && (
              <div>
                <div className="flex justify-between">
                  <h2 className="font-bold">Reports</h2>
                  <Link to="/clinic-portal/reports" className="btn-outline text-xs !py-2">Reports dashboard</Link>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  Progress reports can be created and shared from the reports dashboard using this patient key:{' '}
                  <strong>{data.patient_key}</strong>.
                </p>
              </div>
            )}

            {tab === 'Communication' && clinicId && (
              <PatientCommLog clinicId={clinicId} patientKey={data.patient_key || patientKey} />
            )}
          </section>
        </div>
      )}
    </ClinicPortalShell>
  );
}
