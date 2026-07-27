import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import ClinicCollectPaymentButton from '../../components/clinic/ClinicCollectPaymentButton';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
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
  const { clinicId, loading: bootLoading, can } = useClinicPortal();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState('list');
  const [acting, setActing] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [soapAppointment, setSoapAppointment] = useState(null);
  const [soap, setSoap] = useState({ subjective: '', objective: '', assessment: '', plan: '', visible_to_patient: false });
  const [soapSaving, setSoapSaving] = useState(false);

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

  const canManage = can('appointments.manage');
  const canBill = can('billing.collect');

  const checkIn = async (a) => {
    setActing(a.id);
    try {
      const bed = window.prompt('Bed ID (optional)', a.bed_id || '');
      if (bed === null) return;
      const room = window.prompt('Room ID (optional)', a.room_id || '');
      if (room === null) return;
      await clinicPortal.checkIn(clinicId, a.id, {
        bed_id: bed ? Number(bed) : undefined,
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

  const cancelRollover = async (a) => {
    if (!window.confirm('Cancel this session and move it to the next available slot?')) return;
    setActing(a.id);
    try {
      const res = await clinicPortal.cancelWithRollover(clinicId, a.id);
      const next = res.data || res || {};
      toast.success(next.slot?.date ? `Rolled over to ${next.slot.date}` : 'Session cancelled and rolled over');
      load();
    } catch (e) {
      toast.error(e.message || 'Rollover failed');
    } finally {
      setActing(null);
    }
  };

  const changeMode = async (a) => {
    const mode = window.prompt('New mode: clinic, home_visit, or online', a.consultation_type || 'clinic');
    if (!mode || mode === a.consultation_type) return;
    setActing(a.id);
    try {
      const res = await clinicPortal.changeSessionMode(clinicId, a.id, { consultation_type: mode });
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
      const res = await clinicPortal.generateMeeting(clinicId, a.id, { provider: 'jitsi' });
      const result = res.data || res || {};
      const link = result.meeting_link || result.link || result.meeting?.meeting_link;
      if (link) {
        await navigator.clipboard?.writeText(link);
        toast.success('Meeting created and link copied');
      } else toast.success('Meeting created');
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
      const res = await clinicPortal.getSoap(clinicId, a.id);
      const note = res.data || res;
      if (note) setSoap({
        subjective: note.subjective || '',
        objective: note.objective || '',
        assessment: note.assessment || '',
        plan: note.plan || '',
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
        <p>Date: ${a.appointment_date} · ${formatTime(a.start_time)}</p>
        <p>Type: ${formatType(a.consultation_type)}</p>
        <p>Status: ${a.status}</p>
        <p>Amount: ${money(a.amount)} (${a.payment_status || 'unpaid'})</p>
      </div>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <ClinicPortalShell
      title="Appointments"
      subtitle="Queue, check-in, reschedule status and payment collection"
      actions={
        <div className="flex gap-2">
          {canManage && (
            <button type="button" className="btn-primary text-sm !py-2" onClick={() => setBookingOpen(true)}>
              <FaIcon icon="fa-calendar-plus" className="mr-2" />Book New
            </button>
          )}
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
      }
    >
      <div className="space-y-5">
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
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-teal-50/30">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {a.booking_id || a.id}
                        {a.token_number && <span className="block mt-1 rounded bg-teal-100 text-teal-800 px-1.5 py-0.5 w-fit font-sans font-bold">Token #{a.token_number}</span>}
                      </td>
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
                        {a.waiting_status && <span className="block text-[10px] font-semibold text-amber-700 capitalize mt-1">{String(a.waiting_status).replace(/_/g, ' ')}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          {canManage && a.status === 'pending' && (
                            <button type="button" disabled={acting === a.id} onClick={() => checkIn(a)} className="text-[11px] font-semibold text-teal-700 hover:underline">
                              Check in
                            </button>
                          )}
                          {canManage && a.status === 'confirmed' && (
                            <button type="button" disabled={acting === a.id} onClick={() => setApptStatus(a, 'completed')} className="text-[11px] font-semibold text-emerald-700 hover:underline">
                              Complete
                            </button>
                          )}
                          {canManage && !['cancelled', 'completed'].includes(a.status) && (
                            <button type="button" disabled={acting === a.id} onClick={() => cancelRollover(a)} className="text-[11px] font-semibold text-rose-600 hover:underline">
                              Cancel + rollover
                            </button>
                          )}
                          {canManage && !['cancelled', 'completed'].includes(a.status) && (
                            <button type="button" disabled={acting === a.id} onClick={() => changeMode(a)} className="text-[11px] font-semibold text-sky-700 hover:underline">
                              Change mode
                            </button>
                          )}
                          {canManage && a.consultation_type === 'online' && !a.google_meet_link && (
                            <button type="button" disabled={acting === a.id} onClick={() => generateMeeting(a)} className="text-[11px] font-semibold text-violet-700 hover:underline">
                              Generate meeting
                            </button>
                          )}
                          {a.google_meet_link && <a href={a.google_meet_link} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-violet-700 hover:underline">Open meeting</a>}
                          {can('soap.manage') && (
                            <button type="button" onClick={() => openSoap(a)} className="text-[11px] font-semibold text-slate-700 hover:underline">
                              SOAP note
                            </button>
                          )}
                          {canBill && a.payment_status !== 'paid' && Number(a.amount) > 0 && (
                            <ClinicCollectPaymentButton
                              clinicId={clinicId}
                              appointment={a}
                              disabled={acting === a.id}
                              label="Collect pay"
                              onDone={load}
                            />
                          )}
                          <button type="button" onClick={() => printSlip(a)} className="text-[11px] font-semibold text-slate-600 hover:underline">
                            Print slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
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
      <ClinicBookingModal
        clinicId={clinicId}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onBooked={load}
      />
      {soapAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 p-3 flex items-center justify-center">
          <form onSubmit={saveSoap} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <header className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center">
              <div><h2 className="font-bold">SOAP note</h2><p className="text-xs text-slate-500">{soapAppointment.patient_name} · {soapAppointment.booking_id}</p></div>
              <button type="button" onClick={() => setSoapAppointment(null)} className="w-9 h-9 rounded-full hover:bg-slate-100"><FaIcon icon="fa-xmark" /></button>
            </header>
            <div className="p-5 grid sm:grid-cols-2 gap-4">
              {[['subjective', 'Subjective'], ['objective', 'Objective'], ['assessment', 'Assessment'], ['plan', 'Plan']].map(([key, label]) => (
                <label key={key} className="text-sm font-medium">{label}<textarea className="input-field mt-1" rows={5} value={soap[key]} onChange={(e) => setSoap((old) => ({ ...old, [key]: e.target.value }))} /></label>
              ))}
              <label className="sm:col-span-2 text-sm flex items-center gap-2"><input type="checkbox" checked={soap.visible_to_patient} onChange={(e) => setSoap((old) => ({ ...old, visible_to_patient: e.target.checked }))} />Visible to patient</label>
              <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => setSoapAppointment(null)}>Cancel</button><button type="submit" className="btn-primary" disabled={soapSaving}>{soapSaving ? 'Saving…' : 'Save SOAP'}</button></div>
            </div>
          </form>
        </div>
      )}
    </ClinicPortalShell>
  );
}
