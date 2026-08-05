import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import DashboardKpiCard from '../../components/clinic/dashboard/DashboardKpiCard';
import AnalyticsPrintReportModal from '../../components/clinic/dashboard/AnalyticsPrintReportModal';
import DashboardWidgetBoard, {
  DashboardCustomizeToolbar,
} from '../../components/clinic/dashboard/DashboardWidgetBoard';
import useDashboardLayout from '../../components/clinic/dashboard/useDashboardLayout';
import { dashChartOptions, DASH_CHART_COLORS } from '../../components/clinic/dashboard/dashboardChartOptions';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'insights', label: 'AI Insights', icon: 'fa-lightbulb' },
  { id: 'financial', label: 'Financial', icon: 'fa-coins' },
  { id: 'appointments', label: 'Appointments', icon: 'fa-calendar-check' },
  { id: 'patients', label: 'Patients', icon: 'fa-user-group' },
  { id: 'clinical', label: 'Clinical', icon: 'fa-heart-pulse' },
  { id: 'communication', label: 'Communication', icon: 'fa-comments' },
  { id: 'staff', label: 'Staff', icon: 'fa-user-doctor' },
  { id: 'branches', label: 'Branch', icon: 'fa-code-branch' },
  { id: 'reports', label: 'Reports', icon: 'fa-file-export' },
];

const WIDGET_DEFS = [
  { id: 'kpi_finance' },
  { id: 'kpi_ops' },
  { id: 'chart_revenue' },
  { id: 'chart_appointments' },
  { id: 'insights' },
  { id: 'links' },
];

const PRESETS = [
  { id: '7d', label: '7D', days: 7 },
  { id: '30d', label: '30D', days: 30 },
  { id: '90d', label: '90D', days: 90 },
  { id: 'ytd', label: 'YTD', days: null },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function downloadCsv(headers, rows, filename) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(',')];
  (rows || []).forEach((r) => {
    lines.push(headers.map((h) => esc(r[h])).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function priorityClass(p) {
  if (p === 'high') return 'border-rose-200 bg-rose-50/90 text-rose-950';
  if (p === 'medium') return 'border-amber-200 bg-amber-50/90 text-amber-950';
  return 'border-emerald-200 bg-emerald-50/80 text-emerald-950';
}

function toLocalDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return new Date().toISOString().slice(0, 10);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangeFromPreset(preset) {
  const now = new Date();
  const to = toLocalDate(now);
  if (preset === 'ytd') {
    return { from: `${now.getFullYear()}-01-01`, to };
  }
  const days = PRESETS.find((p) => p.id === preset)?.days || 30;
  const fromDate = new Date(now.getTime() - (days - 1) * 86400000);
  return { from: toLocalDate(fromDate), to };
}

function formatKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\bpct\b/gi, '%')
    .replace(/\bavg\b/gi, 'Avg.')
    .replace(/\b(.)/g, (c) => c.toUpperCase());
}

function formatVal(key, val) {
  if (val == null) return '—';
  if (typeof val === 'number') {
    if (
      key.includes('revenue') ||
      key.includes('profit') ||
      key.includes('expenses') ||
      key.includes('outstanding') ||
      key.includes('total') ||
      key.includes('amount')
    ) {
      return money(val);
    }
    if (key.includes('pct') || key.includes('rate') || key.includes('adherence') || key.includes('margin')) {
      return `${val}%`;
    }
    return val.toLocaleString('en-IN');
  }
  return String(val);
}

function renderSupportingData(data) {
  if (!data || typeof data !== 'object' || !Object.keys(data).length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5">
      {Object.entries(data).map(([key, val]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/80 text-slate-700 border border-slate-200/80 shadow-xs"
        >
          <span className="text-[11px] text-slate-500 font-medium">{formatKey(key)}:</span>
          <span className="text-slate-900 font-bold">{formatVal(key, val)}</span>
        </span>
      ))}
    </div>
  );
}

export default function ClinicAiAnalyticsPage() {
  const { clinicId, can, loading: boot, clinic } = useClinicPortal();
  const [params, setParams] = useSearchParams();
  const section = params.get('tab') || 'dashboard';
  const setSection = (id) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const [preset, setPreset] = useState('30d');
  const [filters, setFilters] = useState(() => rangeFromPreset('30d'));
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [insights, setInsights] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [patients, setPatients] = useState(null);
  const [clinical, setClinical] = useState(null);
  const [communication, setCommunication] = useState(null);
  const [staff, setStaff] = useState(null);
  const [branches, setBranches] = useState(null);
  const [reportType, setReportType] = useState('insights');
  const [viewName, setViewName] = useState('default');
  const [exporting, setExporting] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printReportData, setPrintReportData] = useState(null);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const cid = Number(clinicId);
  const storageKey = `clinic-ai-analytics-v1-${cid || 'x'}-${viewName}`;
  const layout = useDashboardLayout(storageKey, WIDGET_DEFS);

  const filterParams = useMemo(
    () => ({
      from: filters.from,
      to: filters.to,
      view: viewName,
      doctor_id: filters.doctor_id || undefined,
      consultation_type: filters.consultation_type || undefined,
    }),
    [filters, viewName]
  );

  const runExport = async () => {
    if (!cid) return;
    setExporting(true);
    try {
      const res = await clinicPortal.aiExport(cid, { type: reportType, ...filterParams });
      const data = res?.data || res || {};
      const headers = data.headers || [];
      const rows = data.rows || [];
      const reportTitle = data.report_title || `${reportType.toUpperCase()} Analytics Report`;
      const clinicName = data.clinic_name || clinic?.name || `Clinic #${cid}`;
      const dateFrom = filterParams.from || 'All Time';
      const dateTo = filterParams.to || 'Present';
      const timestamp = new Date().toLocaleString('en-IN');

      // Create CSV with UTF-8 BOM byte order mark (\uFEFF) for Excel compatibility
      let csvContent = '\uFEFF';

      // Metadata Header Rows
      csvContent += `"THE URBAN PHYSIO — ANALYTICS & REPORTING SYSTEM"\n`;
      csvContent += `"Report Title:","${reportTitle.replace(/"/g, '""')}"\n`;
      csvContent += `"Clinic / Branch:","${clinicName.replace(/"/g, '""')}"\n`;
      csvContent += `"Date Range:","${dateFrom} to ${dateTo}"\n`;
      csvContent += `"Generated On:","${timestamp}"\n\n`;

      // Data Table Headers
      csvContent += headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';

      // Data Table Rows
      rows.forEach((row) => {
        const line = headers
          .map((h) => {
            const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',');
        csvContent += line + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `urban-physio-${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`${reportTitle} CSV downloaded successfully`);
    } catch (e) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const openPrintStudio = async () => {
    if (!cid) return;
    setPrintModalOpen(true);
    setLoadingPrint(true);
    try {
      const res = await clinicPortal.aiExport(cid, { type: reportType, ...filterParams });
      setPrintReportData(res?.data || res || null);
    } catch (e) {
      toast.error(e.message || 'Could not prepare print report');
      setPrintReportData(null);
    } finally {
      setLoadingPrint(false);
    }
  };

  const applyPreset = (id) => {
    setPreset(id);
    setFilters((f) => ({ ...f, ...rangeFromPreset(id) }));
  };

  const loadDash = useCallback(async () => {
    if (!cid) return;
    setLoading(true);
    try {
      const r = await clinicPortal.aiDash(cid, filterParams);
      setDash(r.data || r);
    } catch (e) {
      toast.error(e.message || 'Dashboard failed');
    } finally {
      setLoading(false);
    }
  }, [cid, filterParams]);

  useEffect(() => {
    if (!cid) return;
    if (section === 'dashboard') loadDash();
  }, [cid, section, loadDash]);

  useEffect(() => {
    if (!cid || section !== 'insights') return;
    clinicPortal
      .aiInsights(cid, filterParams)
      .then((r) => setInsights((r.data || r)?.insights || []))
      .catch((e) => toast.error(e.message || 'Insights failed'));
  }, [cid, section, filterParams]);

  useEffect(() => {
    if (!cid || section !== 'financial') return;
    clinicPortal
      .aiFinancial(cid, filterParams)
      .then((r) => setFinancial(r.data || r))
      .catch((e) => toast.error(e.message || 'Financial failed'));
  }, [cid, section, filterParams]);

  useEffect(() => {
    if (!cid || section !== 'appointments') return;
    clinicPortal
      .aiAppointments(cid, filterParams)
      .then((r) => setAppointments(r.data || r))
      .catch((e) => toast.error(e.message || 'Appointments failed'));
  }, [cid, section, filterParams]);

  useEffect(() => {
    if (!cid || section !== 'patients') return;
    clinicPortal
      .aiPatients(cid, filterParams)
      .then((r) => setPatients(r.data || r))
      .catch((e) => toast.error(e.message || 'Patients failed'));
  }, [cid, section, filterParams]);

  useEffect(() => {
    if (!cid || section !== 'clinical') return;
    clinicPortal
      .aiClinical(cid, filterParams)
      .then((r) => setClinical(r.data || r))
      .catch((e) => toast.error(e.message || 'Clinical failed'));
  }, [cid, section, filterParams]);

  useEffect(() => {
    if (!cid || section !== 'communication') return;
    clinicPortal
      .aiCommunication(cid, filterParams)
      .then((r) => setCommunication(r.data || r))
      .catch((e) => toast.error(e.message || 'Communication failed'));
  }, [cid, section, filterParams]);

  useEffect(() => {
    if (!cid || section !== 'staff') return;
    clinicPortal
      .aiStaff(cid, filterParams)
      .then((r) => setStaff(r.data || r))
      .catch((e) => toast.error(e.message || 'Staff failed'));
  }, [cid, section, filterParams]);

  useEffect(() => {
    if (!cid || section !== 'branches') return;
    clinicPortal
      .aiBranches(cid, filterParams)
      .then((r) => setBranches(r.data || r))
      .catch((e) => toast.error(e.message || 'Branch analytics failed'));
  }, [cid, section, filterParams]);

  // Sync server layout once per view
  useEffect(() => {
    if (!cid) return;
    clinicPortal
      .aiGetLayout(cid, { view: viewName })
      .then((r) => {
        const remote = (r.data || r)?.layout;
        if (Array.isArray(remote) && remote.length) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(remote));
            window.dispatchEvent(new Event('storage'));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }, [cid, viewName, storageKey]);

  const k = dash?.kpis || {};
  const revChart = useMemo(() => {
    const rows = dash?.charts?.revenue_daily || [];
    return {
      labels: rows.map((d) => (d.day || '').slice(5)),
      datasets: [
        {
          label: 'Revenue',
          data: rows.map((d) => Number(d.revenue || 0)),
          borderColor: DASH_CHART_COLORS?.line?.border || '#ea580c',
          backgroundColor: DASH_CHART_COLORS?.line?.fill || 'rgba(249,115,22,0.12)',
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [dash]);

  const apptChart = useMemo(() => {
    const rows = dash?.charts?.appointments_daily || appointments?.daily || [];
    return {
      labels: rows.map((d) => (d.day || '').slice(5)),
      datasets: [
        {
          label: 'Appointments',
          data: rows.map((d) => Number(d.appointments || 0)),
          backgroundColor: 'rgba(14,165,233,0.75)',
          borderRadius: 6,
        },
        {
          label: 'Lost',
          data: rows.map((d) => Number(d.lost || 0)),
          backgroundColor: 'rgba(244,63,94,0.65)',
          borderRadius: 6,
        },
      ],
    };
  }, [dash, appointments]);

  const expenseDonut = useMemo(() => {
    const rows = financial?.profit_loss?.expense_breakdown || [];
    return {
      labels: rows.map((r) => r.category),
      datasets: [
        {
          data: rows.map((r) => Number(r.amount || 0)),
          backgroundColor: ['#0d9488', '#0284c7', '#d97706', '#e11d48', '#7c3aed', '#059669', '#64748b'],
        },
      ],
    };
  }, [financial]);

  if (!boot && !can('analytics.view')) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const saveLayoutRemote = async () => {
    try {
      await clinicPortal.aiSaveLayout(cid, {
        view_key: viewName,
        layout: layout.layout,
      });
      toast.success('Dashboard layout saved');
    } catch (e) {
      toast.error(e.message || 'Could not save layout');
    }
  };

  const widgetMap = {
    kpi_finance: {
      id: 'kpi_finance',
      title: 'Financial KPIs',
      span: 'full',
      node: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DashboardKpiCard label="Revenue (range)" value={money(k.revenue_range)} tint="teal" icon="fa-indian-rupee-sign" />
          <DashboardKpiCard label="Expenses" value={money(k.expenses_range)} tint="amber" icon="fa-receipt" />
          <DashboardKpiCard
            label="Net Profit"
            value={money(k.profit_range)}
            tint={Number(k.profit_range) >= 0 ? 'emerald' : 'rose'}
            icon="fa-chart-line"
          />
          <DashboardKpiCard label="Outstanding" value={money(k.outstanding)} tint="rose" icon="fa-clock-rotate-left" />
        </div>
      ),
    },
    kpi_ops: {
      id: 'kpi_ops',
      title: 'Operations KPIs',
      span: 'full',
      node: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DashboardKpiCard label="Today's Appts" value={k.appointments_today ?? '—'} icon="fa-calendar-day" />
          <DashboardKpiCard label="Active Patients" value={k.active_patients ?? '—'} icon="fa-users" />
          <DashboardKpiCard label="New Patients" value={k.new_patients ?? '—'} icon="fa-user-plus" tint="teal" />
          <DashboardKpiCard
            label="Rehab Adherence"
            value={k.rehab_adherence != null ? `${k.rehab_adherence}%` : '—'}
            icon="fa-dumbbell"
          />
          <DashboardKpiCard label="No Shows" value={k.no_shows ?? 0} tint="rose" icon="fa-user-xmark" />
          <DashboardKpiCard label="Cancellations" value={k.cancellations ?? 0} tint="amber" icon="fa-ban" />
          <DashboardKpiCard
            label="Satisfaction"
            value={k.satisfaction != null ? `${k.satisfaction}★` : '—'}
            icon="fa-star"
          />
          <DashboardKpiCard
            label="Comm Delivery"
            value={k.comm_delivery_rate != null ? `${k.comm_delivery_rate}%` : '—'}
            icon="fa-paper-plane"
          />
        </div>
      ),
    },
    chart_revenue: {
      id: 'chart_revenue',
      title: 'Revenue trend',
      node: revChart.labels.length ? (
        <div className="relative h-56 w-full">
          <Line data={revChart} options={dashChartOptions} />
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-8 text-center">No revenue points in range.</p>
      ),
    },
    chart_appointments: {
      id: 'chart_appointments',
      title: 'Appointment volume',
      node: apptChart.labels.length ? (
        <div className="relative h-56 w-full">
          <Bar data={apptChart} options={dashChartOptions} />
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-8 text-center">No appointment trend data.</p>
      ),
    },
    insights: {
      id: 'insights',
      title: 'AI insight preview',
      node: (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {(dash?.insights_preview || []).map((ins, i) => (
            <div key={ins.id || i} className={`rounded-xl border px-3 py-2 text-sm ${priorityClass(ins.priority)}`}>
              <p className="font-semibold">{ins.title}</p>
              <p className="text-xs opacity-80 mt-0.5">{ins.reason}</p>
              {renderSupportingData(ins.supporting_data)}
              <p className="text-[11px] mt-1.5 font-medium">→ {ins.suggested_action}</p>
            </div>
          ))}
          {!dash?.insights_preview?.length && (
            <p className="text-sm text-slate-500">Insights appear after data loads.</p>
          )}
          <button type="button" className="text-xs font-semibold text-teal-700 mt-2" onClick={() => setSection('insights')}>
            Open AI Insight Center →
          </button>
        </div>
      ),
    },
    links: {
      id: 'links',
      title: 'Related modules',
      node: (
        <div className="flex flex-wrap gap-2 text-xs">
          <Link className="btn-outline !py-1.5 !px-3" to="/clinic-portal/admin">
            Admin Dashboard
          </Link>
          <Link className="btn-outline !py-1.5 !px-3" to="/clinic-portal/reports">
            Classic Reports
          </Link>
          <Link className="btn-outline !py-1.5 !px-3" to="/clinic-portal/earnings">
            Finance
          </Link>
          <Link className="btn-outline !py-1.5 !px-3" to="/clinic-portal/back-office?tab=profit-loss">
            Back Office P&amp;L
          </Link>
          <Link className="btn-outline !py-1.5 !px-3" to="/clinic-portal/rehab?tab=analytics">
            HEP Analytics
          </Link>
          <Link className="btn-outline !py-1.5 !px-3" to="/clinic-portal/communication?tab=analytics">
            Comm Analytics
          </Link>
        </div>
      ),
    },
  };

  const widgets = WIDGET_DEFS.map((w) => widgetMap[w.id]).filter(Boolean);

  return (
    <ClinicPortalShell
      title="Analytics Center"
      subtitle="AI-driven business intelligence — reuses finance, billing, appointments, HEP & communication aggregations"
    >
      <div className="space-y-4">
        {/* Global filters */}
        <div className="glass-card !p-3 flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  preset === p.id ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="text-xs">
            From
            <input
              type="date"
              className="input-field mt-1"
              value={filters.from}
              onChange={(e) => {
                setPreset('custom');
                setFilters((f) => ({ ...f, from: e.target.value }));
              }}
            />
          </label>
          <label className="text-xs">
            To
            <input
              type="date"
              className="input-field mt-1"
              value={filters.to}
              onChange={(e) => {
                setPreset('custom');
                setFilters((f) => ({ ...f, to: e.target.value }));
              }}
            />
          </label>
          <p className="text-[11px] text-slate-500 lg:ml-auto">
            Branch: <strong>{clinic?.name || `#${cid}`}</strong>
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                section === s.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white/70 text-slate-600 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              <FaIcon icon={s.icon} />
              {s.label}
            </button>
          ))}
        </div>

        {section === 'dashboard' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <DashboardCustomizeToolbar
                customize={layout.customize}
                onToggle={() => layout.setCustomize((v) => !v)}
                onReset={() => layout.reset()}
              />
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="input-field !py-1.5 text-xs w-auto"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                >
                  <option value="default">View: Executive</option>
                  <option value="ops">View: Operations</option>
                  <option value="finance">View: Finance</option>
                </select>
                <button type="button" className="btn-outline text-xs" onClick={saveLayoutRemote}>
                  Save layout
                </button>
              </div>
            </div>
            {loading && !dash ? (
              <p className="text-sm text-slate-500 text-center py-10">Loading executive analytics…</p>
            ) : (
              <DashboardWidgetBoard
                widgets={widgets.map((w) => ({
                  id: w.id,
                  title: w.title,
                  span: w.span || 'full',
                  bodyClassName: w.id.startsWith('chart_') ? 'h-56' : undefined,
                  render: () => w.node,
                }))}
                visibleIds={layout.visibleIds}
                customize={layout.customize}
                isHidden={layout.isHidden}
                onReorder={layout.reorder}
                onToggleHidden={layout.toggleHidden}
                toolbar={
                  <button type="button" className="btn-outline text-xs !py-1.5" onClick={saveLayoutRemote}>
                    Save to cloud
                  </button>
                }
              />
            )}
          </div>
        )}

        {section === 'insights' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Virtual Data Analyst — priority insights with reason, supporting data, and suggested actions.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {insights.map((ins, i) => (
                <div key={(ins.id || '') + ins.title + i} className={`rounded-2xl border p-4 ${priorityClass(ins.priority)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{ins.title}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wide opacity-70">{ins.priority}</span>
                  </div>
                  <p className="text-sm mt-2 opacity-90">{ins.reason}</p>
                  {renderSupportingData(ins.supporting_data)}
                  <p className="text-xs font-semibold mt-3">Suggested: {ins.suggested_action}</p>
                  <p className="text-[10px] uppercase tracking-wide mt-1 opacity-60">{ins.category}</p>
                </div>
              ))}
              {!insights.length && <p className="text-sm text-slate-500 col-span-full text-center py-8">No insights yet for the selected period.</p>}
            </div>
          </div>
        )}

        {section === 'financial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <DashboardKpiCard label="Cash inflow" value={money(financial?.cash_flow?.inflow)} tint="emerald" icon="fa-circle-arrow-down" />
              <DashboardKpiCard label="Outflow" value={money(financial?.cash_flow?.outflow)} tint="amber" icon="fa-circle-arrow-up" />
              <DashboardKpiCard label="Net" value={money(financial?.cash_flow?.net)} tint="teal" icon="fa-scale-balanced" />
              <DashboardKpiCard label="Pending dues" value={money(financial?.billing_overview?.pending_amount)} tint="rose" icon="fa-clock-rotate-left" />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass-card !p-4">
                <p className="font-semibold mb-3">Expense breakdown</p>
                {expenseDonut.labels.length ? (
                  <div className="relative h-64 w-full max-w-xs mx-auto">
                    <Doughnut
                      data={expenseDonut}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No expense data (uses Back Office expenses).</p>
                )}
              </div>
              <div className="glass-card !p-4 space-y-2 text-sm">
                <p className="font-semibold">GST / Tax summary</p>
                <p>Taxable estimate: {money(financial?.gst_summary?.estimated_taxable)}</p>
                <p>Est. GST ({financial?.gst_summary?.tax_percent || 0}%): {money(financial?.gst_summary?.estimated_gst)}</p>
                <p className="font-semibold pt-2">Payment methods</p>
                <ul className="space-y-1">
                  {(financial?.payment_methods || []).map((m) => (
                    <li key={m.method} className="flex justify-between border-b border-slate-50 py-1">
                      <span className="capitalize">{m.method}</span>
                      <span>
                        {m.cnt} · {money(m.total)}
                      </span>
                    </li>
                  ))}
                  {!(financial?.payment_methods || []).length && <li className="text-slate-500">No payment breakdown.</li>}
                </ul>
                <Link to="/clinic-portal/back-office?tab=profit-loss" className="text-xs text-teal-700 font-semibold inline-block mt-2">
                  Open full P&amp;L →
                </Link>
              </div>
            </div>
          </div>
        )}

        {section === 'appointments' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DashboardKpiCard label="Volume" value={appointments?.kpis?.volume ?? '—'} icon="fa-calendar-check" />
              <DashboardKpiCard label="Completed" value={appointments?.kpis?.completed ?? '—'} tint="emerald" icon="fa-circle-check" />
              <DashboardKpiCard label="Utilization" value={`${appointments?.kpis?.utilization_rate ?? 0}%`} tint="teal" icon="fa-chart-pie" />
            </div>
            <div className="glass-card !p-4">
              <p className="font-semibold mb-3">Daily volume</p>
              {apptChart.labels.length ? (
                <div className="relative h-64 sm:h-72 w-full">
                  <Bar data={apptChart} options={dashChartOptions} />
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-6 text-center">No appointment data in selected date range.</p>
              )}
            </div>
            <div className="glass-card !p-4 overflow-x-auto">
              <p className="font-semibold mb-2">Therapist occupancy</p>
              <table className="min-w-full text-sm">
                <thead className="text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="text-left py-1">Therapist</th>
                    <th className="text-right py-1">Appts</th>
                    <th className="text-right py-1">Done</th>
                    <th className="text-right py-1">Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {(appointments?.therapist_occupancy || []).map((t) => (
                    <tr key={t.doctor_id} className="border-t border-slate-50">
                      <td className="py-1.5">{t.name}</td>
                      <td className="text-right">{t.appointments}</td>
                      <td className="text-right">{t.completed}</td>
                      <td className="text-right">{t.lost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(appointments?.therapist_occupancy || []).length && (
                <p className="text-xs text-slate-400 text-center py-4">No occupancy data.</p>
              )}
            </div>
          </div>
        )}

        {section === 'patients' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DashboardKpiCard label="Active" value={patients?.kpis?.active_patients ?? '—'} icon="fa-users" />
            <DashboardKpiCard label="New" value={patients?.kpis?.new_patients ?? '—'} tint="teal" icon="fa-user-plus" />
            <DashboardKpiCard label="Returning" value={patients?.kpis?.returning_patients ?? '—'} tint="emerald" icon="fa-rotate-right" />
            <DashboardKpiCard label="Retention" value={`${patients?.kpis?.retention_rate ?? 0}%`} icon="fa-user-shield" />
            <DashboardKpiCard label="Dropout" value={`${patients?.kpis?.dropout_rate ?? 0}%`} tint="rose" icon="fa-user-minus" />
            <DashboardKpiCard label="Avg visits" value={patients?.kpis?.avg_visits ?? '—'} icon="fa-clipboard-user" />
          </div>
        )}

        {section === 'clinical' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <DashboardKpiCard label="Active HEPs" value={clinical?.hep_kpis?.active_programs ?? '—'} icon="fa-dumbbell" />
              <DashboardKpiCard
                label="Avg adherence"
                value={clinical?.hep_kpis?.avg_adherence != null ? `${clinical.hep_kpis.avg_adherence}%` : '—'}
                icon="fa-chart-line"
              />
              <DashboardKpiCard label="High pain" value={clinical?.hep_kpis?.high_pain_patients ?? '—'} tint="rose" icon="fa-hospital-user" />
              <DashboardKpiCard label="Missed today" value={clinical?.hep_kpis?.missed_today ?? '—'} tint="amber" icon="fa-circle-exclamation" />
            </div>
            {clinical?.note && <p className="text-xs text-slate-500">{clinical.note}</p>}
            <Link to="/clinic-portal/rehab?tab=analytics" className="btn-outline text-xs inline-flex">
              Open Exercise &amp; Rehab Analytics
            </Link>
          </div>
        )}

        {section === 'communication' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <DashboardKpiCard label="Messages" value={communication?.kpis?.total_messages ?? '—'} icon="fa-comments" />
              <DashboardKpiCard label="Delivery" value={`${communication?.kpis?.delivery_rate ?? 0}%`} tint="teal" icon="fa-paper-plane" />
              <DashboardKpiCard label="Read rate" value={`${communication?.kpis?.read_rate ?? 0}%`} icon="fa-envelope-open-text" />
              <DashboardKpiCard label="Failed" value={communication?.kpis?.failed_messages ?? 0} tint="rose" icon="fa-triangle-exclamation" />
            </div>
            <Link to="/clinic-portal/communication?tab=analytics" className="btn-outline text-xs inline-flex">
              Open Communication Analytics
            </Link>
          </div>
        )}

        {section === 'staff' && (
          <div className="glass-card !p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="text-left py-2">Therapist</th>
                  <th className="text-right py-2">Load</th>
                  <th className="text-right py-2">Completed</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {(staff?.therapists || []).map((t) => (
                  <tr key={t.doctor_id} className="border-t border-slate-50">
                    <td className="py-2 font-medium">{t.name}</td>
                    <td className="text-right">{t.patient_load}</td>
                    <td className="text-right">{t.sessions_completed}</td>
                    <td className="text-right">{money(t.revenue)}</td>
                    <td className="text-right">{t.productivity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(staff?.therapists || []).length && <p className="text-sm text-slate-500 text-center py-8">No staff metrics in range.</p>}
          </div>
        )}

        {section === 'branches' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{branches?.comparison_note}</p>
            {(branches?.branches || []).map((b) => (
              <div key={b.clinic_id} className="glass-card !p-4 grid sm:grid-cols-3 gap-3">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-slate-500">Clinic #{b.clinic_id}</p>
                </div>
                <div className="text-sm space-y-1">
                  <p>Revenue {money(b.revenue)}</p>
                  <p>Expenses {money(b.expenses)}</p>
                  <p>Profit {money(b.profit)}</p>
                </div>
                <div className="text-sm space-y-1">
                  <p>Patients {b.patients}</p>
                  <p>Appts {b.appointments}</p>
                  <p>
                    Growth rev {b.growth_revenue_pct}% · patients {b.growth_patients_pct}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {section === 'reports' && (
          <div className="space-y-4 max-w-2xl">
            <div className="glass-card !p-6 space-y-4 shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
                  <FaIcon icon="fa-file-export" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Analytics Reports Studio</h3>
                  <p className="text-xs text-slate-500">
                    Generate Excel-compatible CSV exports and publication-ready printable reports.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Report Type
                </label>
                <select className="input-field text-sm" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <option value="insights">AI Virtual Analyst Priority Insights</option>
                  <option value="finance">Financial &amp; P&amp;L Summary</option>
                  <option value="appointments">Appointments Volume &amp; Occupancy</option>
                  <option value="patients">Patient Retention &amp; Demographics</option>
                  <option value="staff">Staff Performance &amp; Productivity</option>
                  <option value="clinical">Clinical &amp; Exercise Rehab Analytics</option>
                  <option value="communication">Communication &amp; Messaging Delivery</option>
                  <option value="branches">Multi-Branch Performance Comparison</option>
                </select>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-800">Active Date Range:</strong> {filters.from || 'All time'} &mdash; {filters.to || 'Present'}
                </p>
                <p>
                  <strong className="text-slate-800">Active View:</strong> {viewName}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 shadow-xs hover:shadow-md disabled:opacity-50"
                  onClick={runExport}
                  disabled={exporting}
                >
                  <FaIcon icon={exporting ? 'fa-circle-notch' : 'fa-download'} className={exporting ? 'animate-spin' : ''} />
                  <span>{exporting ? 'Generating CSV...' : 'Download Excel CSV'}</span>
                </button>
                <button
                  type="button"
                  className="btn-outline text-sm px-5 py-2.5 flex items-center gap-2 hover:bg-slate-50"
                  onClick={openPrintStudio}
                >
                  <FaIcon icon="fa-print" />
                  <span>Open Print Studio</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Need detailed individual billing or patient records CSV? Visit{' '}
              <Link to="/clinic-portal/reports" className="text-teal-700 font-semibold underline">
                Classic Reports &amp; Downloads
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      {/* Analytics Print Studio Modal */}
      <AnalyticsPrintReportModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        reportData={printReportData}
        loading={loadingPrint}
        clinicDetails={clinic}
      />
    </ClinicPortalShell>
  );
}
