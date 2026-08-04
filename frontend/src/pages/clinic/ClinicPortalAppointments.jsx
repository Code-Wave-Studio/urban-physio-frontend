import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import ClinicCollectPaymentButton from '../../components/clinic/ClinicCollectPaymentButton';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
import ClinicRolloverModal from '../../components/clinic/ClinicRolloverModal';
import AppointmentDateNavigator, { computeRange } from '../../components/clinic/AppointmentDateNavigator';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';
import { STATUS_STYLES, TYPE_ICONS, formatTime, formatType } from '../../utils/appointmentListUtils';
import { to12Hour } from '../../utils/timeFormat';

const STATUS_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'pending',   label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function fmtApptTime(t) {
  return to12Hour(t) || formatTime(t);
}

export default function ClinicPortalAppointments() {
  const { clinicId, loading: bootLoading, can } = useClinicPortal();

  // ── Date navigator state ─────────────────────────────────────────────
  const [navView,   setNavView]   = useState('day');
  const [navAnchor, setNavAnchor] = useState(() => new Date());

  // Derive from / to from navigator
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return { from: today, to: today };
  });

  // ── Filters ──────────────────────────────────────────────────────────
  const [rows,    setRows]    = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('all');
  const [q,       setQ]       = useState('');

  // ── Modals ────────────────────────────────────────────────────────────
  const [acting,              setActing]              = useState(null);
  const [bookingOpen,         setBookingOpen]         = useState(false);
  const [rolloverAppointment, setRolloverAppointment] = useState(null);
  const [soapAppointment,     setSoapAppointment]     = useState(null);
  const [soap,            setSoap]            = useState({ subjective: '', objective: '', assessment: '', plan: '', visible_to_patient: false });
  const [soapSaving,      setSoapSaving]      = useState(false);

  // ── Load appointments ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const params = { limit: 300 };
      if (status !== 'all') params.status = status;
      if (q.trim()) params.q = q.trim();
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to)   params.to   = dateRange.to;

      const res  = await clinicPortal.appointments(clinicId, params);
      const data = res.data || res;
      setRows(data.items || data || []);
      setSummary(data.summary || {});
    } catch (e) {
      toast.error(e.message || 'Failed to load appointments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId, status, q, dateRange]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  useEffect(() => {
    const onChanged = () => load();
    window.addEventListener('clinic-appointments-changed', onChanged);
    return () => window.removeEventListener('clinic-appointments-changed', onChanged);
  }, [load]);

  // When navigator changes, update dateRange which triggers load via dependency
  const handleNavChange = ({ view, anchor, from, to }) => {
    setNavView(view);
    setNavAnchor(anchor);
    setDateRange({ from, to });
  };

  // ── Derived summary stats (fallback to local count) ───────────────────
  const stats = useMemo(() => ([
    ['Total shown',  summary.total     ?? rows.length, 'fa-calendar'],
    ['Pending',      summary.pending   ?? rows.filter((r) => r.status === 'pending').length,   'fa-clock'],
    ['Confirmed',    summary.confirmed ?? rows.filter((r) => r.status === 'confirmed').length, 'fa-circle-check'],
    ['Completed',    summary.completed ?? rows.filter((r) => r.status === 'completed').length, 'fa-flag-checkered'],
  ]), [summary, rows]);

  const canManage       = can('appointments.manage');
  const canBill         = can('billing.collect');
  const canUpdateStatus = can('billing.settings');

  // ── Actions ───────────────────────────────────────────────────────────
  const checkIn = async (a) => {
    setActing(a.id);
    try {
      const bed  = window.prompt('Bed ID (optional)', a.bed_id || '');
      if (bed === null) return;
      const room = window.prompt('Room ID (optional)', a.room_id || '');
      if (room === null) return;
      await clinicPortal.checkIn(clinicId, a.id, {
        bed_id:  bed  ? Number(bed)  : undefined,
        room_id: room ? Number(room) : undefined,
      });
      toast.success('Checked in');
      load();
    } catch (e) {
      toast.error(e.message || 'Check-in failed');
    } finally {
      setActing(null);
    }
  };

  const cancelRollover = (a) => {
    setRolloverAppointment(a);
  };

  const changeMode = async (a) => {
    const mode = window.prompt('New mode: clinic, home_visit, or online', a.consultation_type || 'clinic');
    if (!mode || mode === a.consultation_type) return;
    setActing(a.id);
    try {
      const res    = await clinicPortal.changeSessionMode(clinicId, a.id, { consultation_type: mode });
      const result = res.data || res || {};
      toast.success(result.difference ? `Mode changed · price difference ${money(result.difference)}` : 'Session mode changed');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not change mode');
    } finally {
      setActing(null);
    }
  };

  const generateMeeting = async (a) => {
    setActing(a.id);
    try {
      const res    = await clinicPortal.generateMeeting(clinicId, a.id, { provider: 'zoom' });
      const result = res.data || res || {};
      const link   = result.meeting_link || result.link || result.meeting?.meeting_link;
      if (link) {
        await navigator.clipboard?.writeText(link);
        toast.success('Zoom meeting created and link copied');
      } else toast.success('Zoom meeting created');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not generate meeting');
    } finally {
      setActing(null);
    }
  };

  const openSoap = async (a) => {
    setSoapAppointment(a);
    setSoap({ subjective: '', objective: '', assessment: '', plan: '', visible_to_patient: false });
    try {
      const res  = await clinicPortal.getSoap(clinicId, a.id);
      const note = res.data || res;
      if (note) setSoap({
        subjective:         note.subjective || '',
        objective:          note.objective  || '',
        assessment:         note.assessment || '',
        plan:               note.plan       || '',
        visible_to_patient: Boolean(Number(note.visible_to_patient)),
      });
    } catch (e) {
      toast.error(e.message || 'Could not load SOAP note');
    }
  };

  const saveSoap = async (event) => {
    event.preventDefault();
    setSoapSaving(true);
    try {
      await clinicPortal.saveSoap(clinicId, soapAppointment.id, soap);
      toast.success('SOAP note saved');
      setSoapAppointment(null);
    } catch (e) {
      toast.error(e.message || 'Could not save SOAP note');
    } finally {
      setSoapSaving(false);
    }
  };

  const setApptStatus = async (a, next) => {
    setActing(a.id);
    try {
      await clinicPortal.updateAppointment(clinicId, a.id, { status: next });
      toast.success(`Marked ${next}`);
      load();
    } catch (e) {
      toast.error(e.message || 'Update failed');
    } finally {
      setActing(null);
    }
  };

  const printSlip = (a) => {
    const w = window.open('', '_blank', 'width=420,height=600');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Appointment slip</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}
      h1{font-size:18px;margin:0 0 8px}p{margin:4px 0;font-size:13px}
      .box{border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin-top:12px}</style></head><body>
      <h1>The Urban Physio — Appointment Slip</h1>
      <div class="box">
        <p><strong>${a.patient_name || 'Patient'}</strong></p>
        <p>Booking: ${a.booking_id || a.id}</p>
        <p>Doctor: ${a.doctor_name || '—'}</p>
        <p>Date: ${a.appointment_date} · ${fmtApptTime(a.start_time)}</p>
        <p>Type: ${formatType(a.consultation_type)}</p>
        <p>Status: ${a.status}</p>
        <p>Amount: ${money(a.amount)} (${a.payment_status || 'unpaid'})</p>
      </div>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  // ── Grouped view for Agenda / Day (group by date then time) ───────────
  const groupedRows = useMemo(() => {
    if (navView === 'day' || navView === 'agenda') {
      const map = {};
      rows.forEach((r) => {
        const k = r.appointment_date || 'unknown';
        if (!map[k]) map[k] = [];
        map[k].push(r);
      });
      // Sort each day's appointments by start_time
      Object.values(map).forEach((arr) =>
        arr.sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')))
      );
      return map;
    }
    return null;
  }, [navView, rows]);

  // ── Range label for filter toolbar ────────────────────────────────────
  const rangeHint = useMemo(() => {
    if (!dateRange.from) return '';
    if (dateRange.from === dateRange.to) return dateRange.from;
    return `${dateRange.from} → ${dateRange.to}`;
  }, [dateRange]);

  return (
    <ClinicPortalShell
      title="Appointments"
      subtitle="Queue, check-in, reschedule status and payment collection"
      actions={
        <div className="portal-page-actions">
          {canManage && (
            <button type="button" className="btn-primary" onClick={() => setBookingOpen(true)}>
              <FaIcon icon="fa-calendar-plus" className="mr-1.5" />
              <span className="hidden sm:inline">Book New</span>
              <span className="sm:hidden">Book</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5">

        {/* ── KPI Summary Cards ── */}
        <div className="portal-kpi-grid">
          {stats.map(([label, value, icon]) => (
            <div key={label} className="glass-card !p-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <FaIcon icon={icon} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
                <p className="text-[11px] text-slate-500 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Date Navigator ── */}
        <AppointmentDateNavigator
          view={navView}
          anchor={navAnchor}
          onChange={handleNavChange}
        />

        {/* ── Filters toolbar ── */}
        <div className="glass-card !p-3 sm:!p-4 space-y-3">
          {/* Status tabs */}
          <div className="portal-tabs">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  status === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search + range hint + refresh */}
          <div className="portal-toolbar">
            <input
              className="input-field text-sm w-full sm:max-w-xs"
              placeholder="Search booking, patient, doctor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {rangeHint && (
              <span className="text-xs text-slate-400 hidden sm:inline shrink-0">
                <FaIcon icon="fa-calendar-range" className="mr-1 opacity-60" />
                {rangeHint}
              </span>
            )}
            <button type="button" className="btn-outline text-sm w-full sm:w-auto shrink-0" onClick={load}>
              <FaIcon icon="fa-rotate" className="mr-1.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Appointment list ── */}
        <div className="glass-card !p-0 overflow-hidden">
          {bootLoading || loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : !rows.length ? (
            <div className="px-4 py-14 text-center">
              <FaIcon icon="fa-calendar-xmark" className="text-3xl text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">No appointments found</p>
              <p className="text-sm text-slate-400 mt-1">
                {navView === 'day'
                  ? `Nothing scheduled for ${dateRange.from}`
                  : `No appointments in this ${navView} · try a different range or filter`}
              </p>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary mt-4 text-sm"
                  onClick={() => setBookingOpen(true)}
                >
                  <FaIcon icon="fa-calendar-plus" className="mr-1.5" />
                  Book appointment
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Agenda / Day: grouped by date ── */}
              {(navView === 'agenda' || navView === 'day') && groupedRows ? (
                <div className="divide-y divide-slate-100">
                  {Object.keys(groupedRows)
                    .sort()
                    .map((dateKey) => {
                      const dayAppointments = groupedRows[dateKey];
                      const dateObj = new Date(dateKey + 'T00:00:00');
                      const isToday = dateKey === new Date().toISOString().slice(0, 10);
                      return (
                        <section key={dateKey}>
                          {/* Day header */}
                          <header className={`px-4 py-2.5 flex items-center justify-between sticky top-0 z-10 ${isToday ? 'bg-teal-50/80' : 'bg-slate-50/80'} border-b border-slate-100`}>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold ${isToday ? 'text-teal-700' : 'text-slate-800'}`}>
                                {dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              {isToday && (
                                <span className="text-[10px] font-bold uppercase bg-teal-600 text-white rounded-full px-2 py-0.5">Today</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}</span>
                          </header>

                          {/* Day appointments */}
                          <AppointmentRows
                            rows={dayAppointments}
                            acting={acting}
                            canManage={canManage}
                            canBill={canBill}
                            canUpdateStatus={canUpdateStatus}
                            canSoap={can('soap.manage')}
                            clinicId={clinicId}
                            checkIn={checkIn}
                            cancelRollover={cancelRollover}
                            changeMode={changeMode}
                            generateMeeting={generateMeeting}
                            openSoap={openSoap}
                            setApptStatus={setApptStatus}
                            printSlip={printSlip}
                            onPayDone={load}
                          />
                        </section>
                      );
                    })}
                </div>
              ) : (
                /* ── Week / Month: flat list ── */
                <AppointmentRows
                  rows={rows}
                  acting={acting}
                  canManage={canManage}
                  canBill={canBill}
                  canUpdateStatus={canUpdateStatus}
                  canSoap={can('soap.manage')}
                  clinicId={clinicId}
                  checkIn={checkIn}
                  cancelRollover={cancelRollover}
                  changeMode={changeMode}
                  generateMeeting={generateMeeting}
                  openSoap={openSoap}
                  setApptStatus={setApptStatus}
                  printSlip={printSlip}
                  onPayDone={load}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Booking Modal ── */}
      <ClinicBookingModal
        clinicId={clinicId}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onBooked={load}
      />

      {/* ── SOAP Note Modal ── */}
      {soapAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 p-3 flex items-end sm:items-center justify-center">
          <form onSubmit={saveSoap} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <header className="sticky top-0 bg-white border-b px-4 sm:px-5 py-4 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <h2 className="font-bold">SOAP note</h2>
                <p className="text-xs text-slate-500 truncate">{soapAppointment.patient_name} · {soapAppointment.booking_id}</p>
              </div>
              <button type="button" onClick={() => setSoapAppointment(null)} className="w-9 h-9 rounded-full hover:bg-slate-100 shrink-0">
                <FaIcon icon="fa-xmark" />
              </button>
            </header>
            <div className="p-4 sm:p-5 grid sm:grid-cols-2 gap-4">
              {[['subjective', 'Subjective'], ['objective', 'Objective'], ['assessment', 'Assessment'], ['plan', 'Plan']].map(([key, label]) => (
                <label key={key} className="text-sm font-medium">
                  {label}
                  <textarea
                    className="input-field mt-1"
                    rows={5}
                    value={soap[key]}
                    onChange={(e) => setSoap((old) => ({ ...old, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <label className="sm:col-span-2 text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={soap.visible_to_patient}
                  onChange={(e) => setSoap((old) => ({ ...old, visible_to_patient: e.target.checked }))}
                />
                Visible to patient
              </label>
              <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button type="button" className="btn-outline w-full sm:w-auto" onClick={() => setSoapAppointment(null)}>Cancel</button>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={soapSaving}>
                  {soapSaving ? 'Saving…' : 'Save SOAP'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {rolloverAppointment && (
        <ClinicRolloverModal
          appointment={rolloverAppointment}
          clinicId={clinicId}
          onClose={() => setRolloverAppointment(null)}
          onSuccess={() => load()}
        />
      )}
    </ClinicPortalShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Extracted AppointmentRows — renders both mobile cards and desktop table
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentRows({
  rows,
  acting,
  canManage,
  canBill,
  canUpdateStatus,
  canSoap,
  clinicId,
  checkIn,
  cancelRollover,
  changeMode,
  generateMeeting,
  openSoap,
  setApptStatus,
  printSlip,
  onPayDone,
}) {
  return (
    <>
      {/* Mobile cards */}
      <div className="portal-mobile-list">
        {rows.map((a) => (
          <article key={a.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{a.patient_name || '—'}</p>
                <p className="text-[11px] font-mono text-slate-500 truncate">{a.booking_id || a.id}</p>
              </div>
              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}>
                {a.status}
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p><FaIcon icon="fa-user-doctor" className="text-teal-600 mr-1" />{a.doctor_name || '—'}</p>
              <p>
                <FaIcon icon="fa-calendar" className="text-teal-600 mr-1" />
                {a.appointment_date} · {fmtApptTime(a.start_time)}
              </p>
              <p className="capitalize">
                <FaIcon icon={TYPE_ICONS[a.consultation_type] || 'fa-calendar'} className="text-teal-600 mr-1" />
                {formatType(a.consultation_type)}
                {a.token_number != null && <span className="ml-2 font-bold text-teal-800">Token #{a.token_number}</span>}
              </p>
              <p className="font-semibold text-slate-800">
                {money(a.amount)}
                {a.payment_status !== 'paid' && Number(a.amount) > 0 && (
                  <span className="ml-2 text-[10px] text-rose-600 uppercase">Unpaid</span>
                )}
              </p>
            </div>
            <AppointmentActions
              a={a}
              acting={acting}
              canManage={canManage}
              canBill={canBill}
              canUpdateStatus={canUpdateStatus}
              canSoap={canSoap}
              clinicId={clinicId}
              checkIn={checkIn}
              cancelRollover={cancelRollover}
              changeMode={changeMode}
              generateMeeting={generateMeeting}
              openSoap={openSoap}
              setApptStatus={setApptStatus}
              printSlip={printSlip}
              onPayDone={onPayDone}
              mobile
            />
          </article>
        ))}
      </div>

      {/* Desktop table */}
      <div className="portal-desktop-table portal-table-wrap">
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
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-teal-50/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {a.booking_id || a.id}
                  {a.token_number && (
                    <span className="block mt-1 rounded bg-teal-100 text-teal-800 px-1.5 py-0.5 w-fit font-sans font-bold">
                      Token #{a.token_number}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{a.patient_name || '—'}</p>
                  {a.patient_phone && <p className="text-xs text-slate-500">{a.patient_phone}</p>}
                </td>
                <td className="px-4 py-3 text-slate-700">{a.doctor_name || '—'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {a.appointment_date}
                  <span className="text-slate-400"> · </span>
                  {fmtApptTime(a.start_time)}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 capitalize text-slate-700">
                    <FaIcon icon={TYPE_ICONS[a.consultation_type] || 'fa-calendar'} className="text-teal-600 text-xs" />
                    {formatType(a.consultation_type)}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  {money(a.amount)}
                  {a.payment_status !== 'paid' && Number(a.amount) > 0 && (
                    <span className="block text-[10px] text-rose-600 uppercase font-bold">Unpaid</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}>
                    {a.status}
                  </span>
                  {a.waiting_status && (
                    <span className="block text-[10px] font-semibold text-amber-700 capitalize mt-1">
                      {String(a.waiting_status).replace(/_/g, ' ')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <AppointmentActions
                    a={a}
                    acting={acting}
                    canManage={canManage}
                    canBill={canBill}
                    canUpdateStatus={canUpdateStatus}
                    canSoap={canSoap}
                    clinicId={clinicId}
                    checkIn={checkIn}
                    cancelRollover={cancelRollover}
                    changeMode={changeMode}
                    generateMeeting={generateMeeting}
                    openSoap={openSoap}
                    setApptStatus={setApptStatus}
                    printSlip={printSlip}
                    onPayDone={onPayDone}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppointmentActions — action links for a single appointment row
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentActions({
  a, acting, canManage, canBill, canUpdateStatus, canSoap,
  clinicId, checkIn, cancelRollover, changeMode, generateMeeting,
  openSoap, setApptStatus, printSlip, onPayDone, mobile,
}) {
  const cls = mobile
    ? 'flex flex-wrap gap-x-3 gap-y-1.5 pt-1 border-t border-slate-100'
    : 'flex flex-col gap-1 items-start';
  const btnCls = mobile ? 'text-xs font-semibold' : 'text-[11px] font-semibold hover:underline';

  return (
    <div className={cls}>
      {canUpdateStatus && a.status === 'pending' && (
        <button type="button" disabled={acting === a.id} onClick={() => checkIn(a)} className={`${btnCls} text-teal-700`}>Check in</button>
      )}
      {canUpdateStatus && a.status === 'confirmed' && (
        <button type="button" disabled={acting === a.id} onClick={() => setApptStatus(a, 'completed')} className={`${btnCls} text-emerald-700`}>Complete</button>
      )}
      {canUpdateStatus && !['cancelled', 'completed'].includes(a.status) && (
        <>
          <button type="button" disabled={acting === a.id} onClick={() => cancelRollover(a)} className={`${btnCls} text-rose-600`}>{mobile ? 'Rollover' : 'Cancel + rollover'}</button>
          <button type="button" disabled={acting === a.id} onClick={() => changeMode(a)} className={`${btnCls} text-sky-700`}>{mobile ? 'Mode' : 'Change mode'}</button>
        </>
      )}
      {canManage && a.consultation_type === 'online' && !a.google_meet_link && (
        <button type="button" disabled={acting === a.id} onClick={() => generateMeeting(a)} className={`${btnCls} text-violet-700`}>{mobile ? 'Meeting' : 'Generate meeting'}</button>
      )}
      {a.google_meet_link && (
        <a href={a.google_meet_link} target="_blank" rel="noreferrer" className={`${btnCls} text-violet-700`}>{mobile ? 'Open meet' : 'Open meeting'}</a>
      )}
      {canSoap && (
        <button type="button" onClick={() => openSoap(a)} className={`${btnCls} text-slate-700`}>SOAP note</button>
      )}
      {canBill && a.payment_status !== 'paid' && Number(a.amount) > 0 && (
        <ClinicCollectPaymentButton clinicId={clinicId} appointment={a} disabled={acting === a.id} label="Collect pay" onDone={onPayDone} />
      )}
      <button type="button" onClick={() => printSlip(a)} className={`${btnCls} text-slate-600`}>Print slip</button>
    </div>
  );
}
