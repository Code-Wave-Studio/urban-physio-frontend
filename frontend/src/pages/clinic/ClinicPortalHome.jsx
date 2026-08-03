import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import PasswordSetupAlert from '../../components/PasswordSetupAlert';
import ClinicPortalShell, { ClinicQuickActions } from '../../components/clinic/ClinicPortalShell';
import ClinicQuickWork from '../../components/clinic/ClinicQuickWork';
import ClinicCollectPaymentButton from '../../components/clinic/ClinicCollectPaymentButton';
import DashboardKpiCard from '../../components/clinic/dashboard/DashboardKpiCard';
import DashboardWidgetBoard, {
  DashboardCustomizeToolbar,
} from '../../components/clinic/dashboard/DashboardWidgetBoard';
import MiniMonthCalendar from '../../components/clinic/dashboard/MiniMonthCalendar';
import TeamAvailabilityWidget from '../../components/clinic/dashboard/TeamAvailabilityWidget';
import useDashboardLayout from '../../components/clinic/dashboard/useDashboardLayout';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';
import useClinicLiveSync from '../../hooks/useClinicLiveSync';
import { STATUS_STYLES, formatTime, formatType } from '../../utils/appointmentListUtils';

const RECEPTION_WIDGET_DEFS = [
  { id: 'quick_actions' },
  { id: 'appointment_summary' },
  { id: 'queue' },
  { id: 'pending_payments' },
  { id: 'followups' },
  { id: 'team' },
  { id: 'calendar' },
  { id: 'tasks' },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function ClinicPortalHome() {
  const { clinicId, portalReady, isAdminMode, loading: boot, reload, can, clinic } = useClinicPortal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [shortcutsAtTop, setShortcutsAtTop] = useState(false);

  const storageKey = `clinic-dash-reception-v1-${clinicId || 'x'}`;
  const layout = useDashboardLayout(storageKey, RECEPTION_WIDGET_DEFS);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.receptionDashboard(clinicId);
      setData(res.data || res);
    } catch (e) {
      toast.error(e.message || 'Could not load front desk');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId && !isAdminMode) load();
  }, [clinicId, isAdminMode, load]);

  useEffect(() => {
    const h = () => reload().then(() => load()).catch(() => {});
    window.addEventListener('clinic-role-changed', h);
    return () => window.removeEventListener('clinic-role-changed', h);
  }, [reload, load]);

  const handleLiveEvent = useCallback(() => {
    load();
  }, [load]);
  const { connected: liveConnected, lastEventAt } = useClinicLiveSync(clinicId, handleLiveEvent, {
    enabled: Boolean(clinicId && !isAdminMode),
  });

  const checkIn = useCallback(
    async (appt) => {
      setActing(appt.id);
      try {
        await clinicPortal.checkIn(clinicId, appt.id, {});
        toast.success('Patient checked in');
        load();
      } catch (e) {
        toast.error(e.message || 'Check-in failed');
      } finally {
        setActing(null);
      }
    },
    [clinicId, load]
  );

  const m = data?.metrics || {};
  const queue = data?.queue || [];
  const followups = data?.followups || [];
  const unpaidQueue = useMemo(
    () => queue.filter((a) => a.payment_status !== 'paid' && Number(a.amount) > 0),
    [queue]
  );
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const widgets = useMemo(
    () => [
      {
        id: 'quick_actions',
        title: 'Front-desk shortcuts',
        icon: 'fa-bolt',
        span: 'full',
        bodyClassName: 'reception-widget-body reception-widget-body--flush',
        render: () => <ClinicQuickActions />,
      },
      {
        id: 'appointment_summary',
        title: "Today's appointment mix",
        icon: 'fa-chart-pie',
        span: '2',
        bodyClassName: 'reception-widget-body',
        render: () => {
          const total = Number(m.today_total || 0) || 1;
          const rows = [
            { label: 'Pending', value: m.today_pending ?? 0, color: 'bg-amber-400' },
            { label: 'Confirmed', value: m.today_confirmed ?? 0, color: 'bg-emerald-500' },
            { label: 'Completed', value: m.today_completed ?? 0, color: 'bg-primary-500' },
          ];
          return (
            <div className="space-y-3.5">
              {rows.map((r) => (
                <div key={r.label} className="reception-stat-row">
                  <div className="flex justify-between items-center gap-3 text-xs mb-2">
                    <span className="font-semibold text-slate-700">{r.label}</span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-slate-900">{r.value}</span>
                      <span className="text-[11px] text-slate-400">
                        {Math.round((Number(r.value) / total) * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.color} transition-all`}
                      style={{ width: `${Math.min(100, (Number(r.value) / total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <Link to="/clinic-portal/appointments" className="dash-widget-link inline-block">
                Open appointments →
              </Link>
            </div>
          );
        },
      },
      {
        id: 'queue',
        title: "Today's queue",
        icon: 'fa-list-ol',
        span: '4',
        bodyClassName: 'reception-widget-body reception-widget-body--flush',
        action: (
          <Link to="/clinic-portal/appointments" className="dash-widget-link">
            View all
          </Link>
        ),
        render: () =>
          queue.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No appointments scheduled for today.</p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {queue.map((a) => (
                <li key={a.id} className="dash-queue-item">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {a.patient_name || 'Patient'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatTime(a.start_time)} · {a.doctor_name || 'Unassigned'} ·{' '}
                        {formatType(a.consultation_type)}
                      </p>
                      <span
                        className={`inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.status}
                      </span>
                      {a.payment_status !== 'paid' && Number(a.amount) > 0 && (
                        <span className="ml-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                          Unpaid
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 items-end">
                      {a.status === 'pending' && (
                        <button
                          type="button"
                          disabled={acting === a.id}
                          onClick={() => checkIn(a)}
                          className="text-[11px] font-semibold dash-widget-link"
                        >
                          Check in
                        </button>
                      )}
                      {can('billing.collect') && a.payment_status !== 'paid' && Number(a.amount) > 0 && (
                        <ClinicCollectPaymentButton
                          clinicId={clinicId}
                          appointment={a}
                          disabled={acting === a.id}
                          onDone={load}
                        />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'pending_payments',
        title: 'Pending payments',
        icon: 'fa-file-invoice-dollar',
        span: '2',
        bodyClassName: 'reception-widget-body',
        action: (
          <Link to="/clinic-portal/billing" className="dash-widget-link">
            Billing
          </Link>
        ),
        render: () =>
          unpaidQueue.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">All caught up — no unpaid bookings today.</p>
          ) : (
            <ul className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {unpaidQueue.slice(0, 8).map((a) => (
                <li key={a.id} className="reception-payment-item">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{a.patient_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatTime(a.start_time)} · Booking {a.booking_id || a.id}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-rose-700">{money(a.amount)}</p>
                    {can('billing.collect') && (
                      <ClinicCollectPaymentButton
                        clinicId={clinicId}
                        appointment={a}
                        disabled={acting === a.id}
                        label="Collect"
                        onDone={load}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'followups',
        title: 'Follow-up queue',
        icon: 'fa-rotate',
        span: '2',
        bodyClassName: 'reception-widget-body',
        render: () => (
          <>
            {followups.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No pending follow-ups.</p>
            ) : (
              <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {followups.slice(0, 8).map((f) => (
                  <li key={f.id} className="reception-followup-item">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 text-xs border border-amber-100">
                      <FaIcon icon="fa-phone" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{f.patient_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Last visit {f.appointment_date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/clinic-portal/patients"
              className="btn-outline !py-1.5 text-xs mt-3 inline-flex w-full justify-center"
            >
              Register / search patients
            </Link>
          </>
        ),
      },
      {
        id: 'team',
        title: 'Team availability',
        icon: 'fa-user-doctor',
        span: '3',
        bodyClassName: 'reception-widget-body',
        render: () => <TeamAvailabilityWidget clinicId={clinicId} />,
      },
      {
        id: 'calendar',
        title: 'Calendar',
        icon: 'fa-calendar-days',
        span: '3',
        bodyClassName: 'reception-widget-body',
        render: () => <MiniMonthCalendar markedDates={[todayStr]} />,
      },
      {
        id: 'tasks',
        title: 'Front-desk checklist',
        icon: 'fa-list-check',
        span: 'full',
        bodyClassName: 'reception-widget-body',
        render: () => (
          <ul className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm text-slate-600">
            {[
              { icon: 'fa-indian-rupee-sign', text: 'Confirm unpaid bookings before session' },
              { icon: 'fa-phone', text: 'Call follow-up patients this week' },
              { icon: 'fa-file-signature', text: 'Upload consent forms for walk-ins' },
            ].map((t) => (
              <li
                key={t.text}
                className="flex items-start gap-2.5 rounded-xl border border-primary-100/80 bg-primary-50/40 px-3.5 py-3"
              >
                <FaIcon icon={t.icon} className="text-primary-600 mt-0.5" />
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
        ),
      },
    ],
    [m, queue, unpaidQueue, followups, clinicId, acting, can, todayStr, load, checkIn]
  );

  if (!boot && isAdminMode) {
    return <Navigate to="/clinic-portal/admin" replace />;
  }

  return (
    <ClinicPortalShell
      title="Receptionist — Front Desk"
      subtitle="Check-ins, queue, walk-ins, billing and follow-ups"
      actions={
        <DashboardCustomizeToolbar
          customize={layout.customize}
          onToggle={() => layout.setCustomize((v) => !v)}
          onReset={layout.reset}
        />
      }
    >
      <PasswordSetupAlert className="mb-4" />

      <div className="dash-hero">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <span className="dash-hero-badge">
              <FaIcon icon="fa-sun" />
              Today at a glance
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3 truncate">
              {clinic?.name || 'Your clinic'}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <div className="dash-live-pill shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
            />
            {liveConnected ? 'Live queue sync' : 'Reconnecting…'}
            {lastEventAt && (
              <span className="text-slate-400">
                · {lastEventAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {!portalReady && (
        <div className="glass-card !p-4 mb-4 border border-amber-200 bg-amber-50/50 text-sm text-amber-900">
          Clinic profile is pending approval. You can still prepare patients and appointments.
        </div>
      )}

      {loading || boot ? (
        <div className="space-y-4">
          <div className="portal-kpi-grid md:!grid-cols-3 xl:!grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="dash-kpi h-24 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="portal-kpi-grid mb-5 md:!grid-cols-3 xl:!grid-cols-5">
            <DashboardKpiCard
              icon="fa-calendar-day"
              label="Today's appointments"
              value={m.today_total ?? 0}
              hint={`${m.today_completed ?? 0} completed`}
            />
            <DashboardKpiCard
              icon="fa-hourglass-half"
              label="Pending"
              value={m.today_pending ?? 0}
              tint="amber"
            />
            <DashboardKpiCard
              icon="fa-circle-check"
              label="Confirmed"
              value={m.today_confirmed ?? 0}
              tint="emerald"
            />
            <DashboardKpiCard
              icon="fa-indian-rupee-sign"
              label="Unpaid today"
              value={m.unpaid_today ?? 0}
              tint="rose"
              hint="Needs collection"
            />
            <DashboardKpiCard
              icon="fa-person-walking"
              label="Walk-ins today"
              value={m.walkins_today ?? 0}
              tint="violet"
            />
          </div>

          {shortcutsAtTop && (
            <ClinicQuickWork variant="reception" onPlaceAtTopChange={setShortcutsAtTop} />
          )}

          <DashboardWidgetBoard
            widgets={widgets}
            visibleIds={layout.visibleIds}
            customize={layout.customize}
            isHidden={layout.isHidden}
            onReorder={layout.reorder}
            onToggleHidden={layout.toggleHidden}
            boardClassName="reception-dash-board"
          />

          {!shortcutsAtTop && (
            <ClinicQuickWork variant="reception" onPlaceAtTopChange={setShortcutsAtTop} />
          )}
        </>
      )}
    </ClinicPortalShell>
  );
}
