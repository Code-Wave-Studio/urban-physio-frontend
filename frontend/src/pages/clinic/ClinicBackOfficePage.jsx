import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'inventory', label: 'Inventory', icon: 'fa-boxes-stacked' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: 'fa-cart-shopping' },
  { id: 'expenses', label: 'Expenses', icon: 'fa-receipt' },
  { id: 'profit-loss', label: 'Profit & Loss', icon: 'fa-scale-balanced' },
  { id: 'tasks', label: 'Tasks', icon: 'fa-list-check' },
  { id: 'equipment', label: 'Equipment', icon: 'fa-screwdriver-wrench' },
  { id: 'reports', label: 'Reports', icon: 'fa-file-export' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

const EXPENSE_CATS = [
  'rent',
  'staff_salary',
  'equipment',
  'utilities',
  'marketing',
  'repairs',
  'internet',
  'supplies',
  'miscellaneous',
];

const EMPTY_ITEM = {
  name: '',
  sku: '',
  barcode: '',
  unit: 'pcs',
  description: '',
  unit_price: 0,
  purchase_price: 0,
  qty_on_hand: 0,
  min_stock: 5,
  max_stock: '',
  batch_number: '',
  expiry_date: '',
  category_id: '',
  supplier_id: '',
  is_consumable: true,
};

const EMPTY_EXPENSE = {
  title: '',
  category: 'miscellaneous',
  amount: '',
  expense_date: new Date().toISOString().slice(0, 10),
  vendor: '',
  notes: '',
  receipt_url: '',
  invoice_url: '',
  status: 'pending',
};

const EMPTY_TASK = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  task_type: 'general',
  due_date: '',
};

const EMPTY_EQUIP = {
  name: '',
  asset_tag: '',
  serial_number: '',
  purchase_date: '',
  warranty_until: '',
  purchase_cost: '',
  location: '',
  next_service_date: '',
  calibration_due: '',
  maintenance_notes: '',
};

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function Kpi({ label, value, hint, tone = 'teal' }) {
  const tones = {
    teal: 'from-teal-500/15 to-cyan-500/5 text-teal-900',
    amber: 'from-amber-500/15 to-orange-500/5 text-amber-900',
    rose: 'from-rose-500/15 to-pink-500/5 text-rose-900',
    emerald: 'from-emerald-500/15 to-green-500/5 text-emerald-900',
    sky: 'from-sky-500/15 to-blue-500/5 text-sky-900',
    slate: 'from-slate-500/10 to-slate-200/20 text-slate-900',
  };
  return (
    <div
      className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone] || tones.teal} p-4 shadow-sm backdrop-blur-sm`}
    >
      <p className="text-[11px] uppercase tracking-wide opacity-70 font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint ? <p className="text-xs opacity-60 mt-1">{hint}</p> : null}
    </div>
  );
}

function downloadCsv(headers, rows, filename) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(',')];
  rows.forEach((r) => {
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

export default function ClinicBackOfficePage() {
  const { clinicId, can, loading: boot, clinic } = useClinicPortal();
  const [params, setParams] = useSearchParams();
  const section = params.get('tab') || 'dashboard';
  const setSection = (id) => setParams({ tab: id }, { replace: true });
  const canManage = can('backoffice.manage');

  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [pl, setPl] = useState(null);
  const [plRange, setPlRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  const [inventory, setInventory] = useState([]);
  const [invQ, setInvQ] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [board, setBoard] = useState({ todo: [], in_progress: [], completed: [] });

  const [itemModal, setItemModal] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [editingItem, setEditingItem] = useState(null);
  const [expModal, setExpModal] = useState(false);
  const [expForm, setExpForm] = useState(EMPTY_EXPENSE);
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [eqModal, setEqModal] = useState(false);
  const [eqForm, setEqForm] = useState(EMPTY_EQUIP);
  const [poModal, setPoModal] = useState(false);
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    expected_date: '',
    notes: '',
    items: [{ inventory_item_id: '', quantity: 1, unit_cost: 0 }],
  });
  const [catName, setCatName] = useState('');
  const [supName, setSupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [reportType, setReportType] = useState('expenses');

  const cid = Number(clinicId);

  const loadDash = useCallback(async () => {
    if (!cid) return;
    setLoading(true);
    try {
      const r = await clinicPortal.boDashboard(cid);
      setDash(r.data || r);
    } catch (e) {
      toast.error(e.message || 'Dashboard failed');
    } finally {
      setLoading(false);
    }
  }, [cid]);

  const loadInventory = useCallback(async () => {
    if (!cid) return;
    try {
      const r = await clinicPortal.boInventory(cid, {
        q: invQ || undefined,
        low_stock: lowOnly ? 1 : undefined,
      });
      setInventory((r.data || r)?.items || r.data || []);
    } catch (e) {
      toast.error(e.message || 'Inventory failed');
    }
  }, [cid, invQ, lowOnly]);

  const loadMeta = useCallback(async () => {
    if (!cid) return;
    try {
      const [c, s] = await Promise.all([
        clinicPortal.boCategories(cid),
        clinicPortal.boSuppliers(cid),
      ]);
      setCategories((c.data || c)?.categories || c.data || []);
      setSuppliers((s.data || s)?.suppliers || s.data || []);
    } catch {
      /* ignore */
    }
  }, [cid]);

  useEffect(() => {
    if (!cid) return;
    if (section === 'dashboard') loadDash();
  }, [cid, section, loadDash]);

  useEffect(() => {
    if (!cid || section !== 'inventory') return;
    const t = setTimeout(loadInventory, invQ ? 280 : 0);
    return () => clearTimeout(t);
  }, [cid, section, invQ, lowOnly, loadInventory]);

  useEffect(() => {
    if (!cid) return;
    if (['inventory', 'purchase-orders', 'settings'].includes(section)) loadMeta();
  }, [cid, section, loadMeta]);

  useEffect(() => {
    if (!cid || section !== 'purchase-orders') return;
    clinicPortal
      .boPurchaseOrders(cid)
      .then((r) => setPos((r.data || r)?.orders || r.data || []))
      .catch((e) => toast.error(e.message || 'POs failed'));
  }, [cid, section]);

  useEffect(() => {
    if (!cid || section !== 'expenses') return;
    clinicPortal
      .boExpenses(cid)
      .then((r) => setExpenses((r.data || r)?.expenses || r.data || []))
      .catch((e) => toast.error(e.message || 'Expenses failed'));
  }, [cid, section]);

  useEffect(() => {
    if (!cid || section !== 'profit-loss') return;
    clinicPortal
      .boProfitLoss(cid, plRange)
      .then((r) => setPl(r.data || r))
      .catch((e) => toast.error(e.message || 'P&L failed'));
  }, [cid, section, plRange]);

  useEffect(() => {
    if (!cid || section !== 'tasks') return;
    clinicPortal
      .boTasks(cid)
      .then((r) => {
        const d = r.data || r;
        setBoard(d.board || { todo: [], in_progress: [], completed: [] });
      })
      .catch((e) => toast.error(e.message || 'Tasks failed'));
  }, [cid, section]);

  useEffect(() => {
    if (!cid || section !== 'equipment') return;
    clinicPortal
      .boEquipment(cid)
      .then((r) => setEquipment((r.data || r)?.equipment || r.data || []))
      .catch((e) => toast.error(e.message || 'Equipment failed'));
  }, [cid, section]);

  useEffect(() => {
    if (!cid || section !== 'analytics') return;
    clinicPortal
      .boAnalytics(cid, { days: 90 })
      .then((r) => setAnalytics(r.data || r))
      .catch((e) => toast.error(e.message || 'Analytics failed'));
  }, [cid, section]);

  const kpis = dash?.kpis || {};
  const alerts = dash?.alerts || [];

  const expenseChart = useMemo(() => {
    const rows = analytics?.expense_trend || analytics?.expenses_by_month || [];
    return {
      labels: rows.map((r) => r.ym || r.month || ''),
      datasets: [
        {
          label: 'Expenses',
          data: rows.map((r) => Number(r.total || 0)),
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13,148,136,0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [analytics]);

  const plBreakdown = useMemo(() => {
    const rows = pl?.expense_breakdown || [];
    return {
      labels: rows.map((r) => r.category),
      datasets: [
        {
          data: rows.map((r) => r.amount),
          backgroundColor: [
            '#0d9488',
            '#0284c7',
            '#d97706',
            '#e11d48',
            '#7c3aed',
            '#059669',
            '#64748b',
            '#ea580c',
            '#0891b2',
          ],
        },
      ],
    };
  }, [pl]);

  const movementChart = useMemo(() => {
    const rows = analytics?.inventory_trend || analytics?.movement_trend || [];
    return {
      labels: rows.map((r) => (r.day || '').slice(5)),
      datasets: [
        {
          label: 'Outbound',
          data: rows.map((r) => Number(r.outbound || 0)),
          backgroundColor: 'rgba(225,29,72,0.55)',
          borderRadius: 6,
        },
        {
          label: 'Inbound',
          data: rows.map((r) => Number(r.inbound || 0)),
          backgroundColor: 'rgba(13,148,136,0.55)',
          borderRadius: 6,
        },
      ],
    };
  }, [analytics]);

  if (!boot && !can('backoffice.view')) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const refreshSection = () => {
    if (section === 'dashboard') loadDash();
    if (section === 'inventory') loadInventory();
    if (section === 'tasks') {
      clinicPortal.boTasks(cid).then((r) => setBoard((r.data || r).board || board));
    }
    if (section === 'expenses') {
      clinicPortal.boExpenses(cid).then((r) => setExpenses((r.data || r)?.expenses || []));
    }
    if (section === 'purchase-orders') {
      clinicPortal.boPurchaseOrders(cid).then((r) => setPos((r.data || r)?.orders || []));
    }
    if (section === 'equipment') {
      clinicPortal.boEquipment(cid).then((r) => setEquipment((r.data || r)?.equipment || []));
    }
  };

  const saveItem = async () => {
    if (!itemForm.name?.trim()) {
      toast.error('Name required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...itemForm,
        category_id: itemForm.category_id || null,
        supplier_id: itemForm.supplier_id || null,
        max_stock: itemForm.max_stock === '' ? null : itemForm.max_stock,
      };
      if (editingItem) {
        await clinicPortal.boUpdateInventory(cid, editingItem.id, payload);
        toast.success('Item updated');
      } else {
        await clinicPortal.boCreateInventory(cid, payload);
        toast.success('Item created');
      }
      setItemModal(false);
      setEditingItem(null);
      setItemForm(EMPTY_ITEM);
      loadInventory();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const archiveItem = async (it) => {
    if (!window.confirm(`Archive ${it.name}?`)) return;
    try {
      await clinicPortal.boArchiveInventory(cid, it.id);
      toast.success('Archived');
      loadInventory();
    } catch (e) {
      toast.error(e.message || 'Archive failed');
    }
  };

  const saveExpense = async () => {
    if (!expForm.title || !expForm.amount) {
      toast.error('Title and amount required');
      return;
    }
    setSaving(true);
    try {
      await clinicPortal.boCreateExpense(cid, {
        ...expForm,
        amount: Number(expForm.amount),
      });
      toast.success('Expense recorded');
      setExpModal(false);
      setExpForm(EMPTY_EXPENSE);
      clinicPortal.boExpenses(cid).then((r) => setExpenses((r.data || r)?.expenses || []));
    } catch (e) {
      toast.error(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const updateExpenseStatus = async (ex, status) => {
    try {
      await clinicPortal.boUpdateExpense(cid, ex.id, { status });
      toast.success(`Marked ${status}`);
      clinicPortal.boExpenses(cid).then((r) => setExpenses((r.data || r)?.expenses || []));
    } catch (e) {
      toast.error(e.message || 'Update failed');
    }
  };

  const saveTask = async () => {
    if (!taskForm.title?.trim()) {
      toast.error('Title required');
      return;
    }
    setSaving(true);
    try {
      await clinicPortal.boCreateTask(cid, taskForm);
      toast.success('Task created');
      setTaskModal(false);
      setTaskForm(EMPTY_TASK);
      refreshSection();
    } catch (e) {
      toast.error(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const moveTask = async (taskId, status) => {
    try {
      await clinicPortal.boUpdateTask(cid, taskId, { status });
      const r = await clinicPortal.boTasks(cid);
      setBoard((r.data || r).board || board);
    } catch (e) {
      toast.error(e.message || 'Move failed');
    }
  };

  const onDropColumn = (status) => {
    if (!dragId || !canManage) return;
    moveTask(dragId, status);
    setDragId(null);
  };

  const saveEquipment = async () => {
    if (!eqForm.name?.trim()) {
      toast.error('Name required');
      return;
    }
    setSaving(true);
    try {
      await clinicPortal.boCreateEquipment(cid, {
        ...eqForm,
        purchase_cost: eqForm.purchase_cost === '' ? null : Number(eqForm.purchase_cost),
      });
      toast.success('Equipment added');
      setEqModal(false);
      setEqForm(EMPTY_EQUIP);
      clinicPortal.boEquipment(cid).then((r) => setEquipment((r.data || r)?.equipment || []));
    } catch (e) {
      toast.error(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const savePo = async () => {
    const lines = (poForm.items || []).filter((l) => Number(l.inventory_item_id) > 0 && Number(l.quantity) > 0);
    if (!lines.length) {
      toast.error('Add at least one line item');
      return;
    }
    setSaving(true);
    try {
      await clinicPortal.boCreatePurchaseOrder(cid, {
        supplier_id: poForm.supplier_id || null,
        expected_date: poForm.expected_date || null,
        notes: poForm.notes,
        items: lines.map((l) => {
          const found = invList.find((x) => String(x.id) === String(l.inventory_item_id));
          return {
            item_id: Number(l.inventory_item_id),
            qty: Number(l.quantity),
            unit_cost: Number(l.unit_cost) || 0,
            description: found?.name || 'Item',
          };
        }),
      });
      toast.success('Purchase order created');
      setPoModal(false);
      clinicPortal.boPurchaseOrders(cid).then((r) => setPos((r.data || r)?.orders || []));
    } catch (e) {
      toast.error(e.message || 'PO failed');
    } finally {
      setSaving(false);
    }
  };

  const setPoStatus = async (po, status) => {
    try {
      await clinicPortal.boUpdatePurchaseOrderStatus(cid, po.id, { status });
      toast.success(`PO ${status}`);
      clinicPortal.boPurchaseOrders(cid).then((r) => setPos((r.data || r)?.orders || []));
      if (status === 'received') loadInventory();
    } catch (e) {
      toast.error(e.message || 'Status update failed');
    }
  };

  const addCategory = async () => {
    if (!catName.trim()) return;
    try {
      await clinicPortal.boCreateCategory(cid, { name: catName.trim() });
      setCatName('');
      loadMeta();
      toast.success('Category added');
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const addSupplier = async () => {
    if (!supName.trim()) return;
    try {
      await clinicPortal.boCreateSupplier(cid, { name: supName.trim() });
      setSupName('');
      loadMeta();
      toast.success('Supplier added');
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const runExport = async () => {
    try {
      const r = await clinicPortal.boExport(cid, {
        type: reportType,
        from: plRange.from,
        to: plRange.to,
      });
      const d = r.data || r;
      if (reportType === 'profit_loss') {
        toast.success(
          `P&L: Revenue ${money(d.revenue)} − Expenses ${money(d.expenses)} = ${money(d.net_profit)}`
        );
        return;
      }
      downloadCsv(d.headers || [], d.rows || [], `back-office-${reportType}.csv`);
      toast.success('CSV downloaded');
    } catch (e) {
      toast.error(e.message || 'Export failed');
    }
  };

  const printPl = () => {
    window.print();
  };

  const invList = Array.isArray(inventory) ? inventory : [];

  return (
    <ClinicPortalShell
      title="Back Office"
      subtitle="Inventory, purchases, expenses, equipment & operations"
    >
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                section === s.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white/70 text-slate-600 border border-slate-100 hover:bg-white'
              }`}
            >
              <FaIcon icon={s.icon} />
              {s.label}
            </button>
          ))}
        </div>

        {section === 'dashboard' && (
          <div className="space-y-4">
            {loading && !dash ? (
              <p className="text-sm text-slate-500 py-8 text-center">Loading dashboard…</p>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <Kpi label="Inventory SKUs" value={kpis.inventory_items ?? '—'} tone="teal" />
                  <Kpi label="Low Stock" value={kpis.low_stock ?? 0} tone="rose" hint="Below minimum" />
                  <Kpi label="Today's Expenses" value={money(kpis.expenses_today)} tone="amber" />
                  <Kpi label="Month Expenses" value={money(kpis.expenses_month)} tone="sky" />
                  <Kpi
                    label="Month Profit"
                    value={money(kpis.profit_month)}
                    tone={Number(kpis.profit_month) >= 0 ? 'emerald' : 'rose'}
                    hint={`Revenue ${money(kpis.revenue_month)}`}
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Kpi label="Pending POs" value={kpis.pending_pos ?? 0} tone="amber" />
                  <Kpi label="Maintenance Due" value={kpis.maintenance_due ?? 0} tone="rose" />
                  <Kpi label="Open Tasks" value={kpis.open_tasks ?? 0} tone="sky" />
                  <Kpi label="Active Equipment" value={kpis.equipment_active ?? 0} tone="slate" />
                </div>

                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="glass-card !p-4">
                      <p className="font-semibold text-slate-900 mb-3">Smart notifications</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(alerts.length ? alerts : [{ severity: 'success', title: 'All clear', message: 'No urgent alerts' }]).map(
                          (a, i) => (
                            <div
                              key={i}
                              className={`rounded-xl border px-3 py-2 text-sm ${
                                a.severity === 'high' || a.severity === 'warn'
                                  ? 'border-amber-200 bg-amber-50/80'
                                  : 'border-emerald-200 bg-emerald-50/60'
                              }`}
                            >
                              <p className="font-medium">{a.title}</p>
                              <p className="text-xs opacity-80">{a.message}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="glass-card !p-4">
                      <p className="font-semibold mb-2">Activity timeline</p>
                      <ul className="space-y-2 max-h-56 overflow-y-auto text-sm">
                        {(dash?.activity || []).slice(0, 15).map((a) => (
                          <li key={a.id} className="flex gap-2 border-b border-slate-50 pb-2">
                            <span className="text-[10px] text-slate-400 w-28 shrink-0">
                              {(a.created_at || '').slice(0, 16)}
                            </span>
                            <span className="text-slate-700">
                              <span className="font-medium">{a.action}</span>
                              {a.entity_type ? ` · ${a.entity_type}` : ''}
                            </span>
                          </li>
                        ))}
                        {!(dash?.activity || []).length && (
                          <li className="text-slate-500 text-sm">No activity yet.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="glass-card !p-4">
                      <p className="font-semibold mb-3">Quick actions</p>
                      <div className="flex flex-col gap-2">
                        {canManage && (
                          <>
                            <button
                              type="button"
                              className="btn-primary text-xs"
                              onClick={() => {
                                setEditingItem(null);
                                setItemForm(EMPTY_ITEM);
                                setItemModal(true);
                                setSection('inventory');
                              }}
                            >
                              <FaIcon icon="fa-plus" className="mr-1" /> Add inventory
                            </button>
                            <button
                              type="button"
                              className="btn-outline text-xs"
                              onClick={() => {
                                setExpForm(EMPTY_EXPENSE);
                                setExpModal(true);
                              }}
                            >
                              Record expense
                            </button>
                            <button type="button" className="btn-outline text-xs" onClick={() => setSection('tasks')}>
                              Open task board
                            </button>
                          </>
                        )}
                        <button type="button" className="btn-outline text-xs" onClick={() => setSection('profit-loss')}>
                          View P&amp;L
                        </button>
                      </div>
                    </div>
                    <div className="glass-card !p-4">
                      <p className="font-semibold mb-2">Branch</p>
                      <p className="text-sm text-slate-700">{clinic?.name || 'Current clinic'}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Inventory, expenses, and reports are scoped to this branch ({cid}).
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {section === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                className="input-field flex-1"
                placeholder="Search name, SKU, barcode…"
                value={invQ}
                onChange={(e) => setInvQ(e.target.value)}
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 shrink-0">
                <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
                Low stock only
              </label>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary text-xs shrink-0"
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm(EMPTY_ITEM);
                    setItemModal(true);
                  }}
                >
                  <FaIcon icon="fa-plus" className="mr-1" /> Add item
                </button>
              )}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70">
              <table className="min-w-full text-sm">
                <thead className="text-left text-[11px] uppercase text-slate-500 bg-slate-50/80">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Available</th>
                    <th className="px-3 py-2">Unit ₹</th>
                    <th className="px-3 py-2">Min</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {invList.map((it) => {
                    const avail = Math.max(0, Number(it.qty_on_hand || 0) - Number(it.qty_reserved || 0));
                    const low = Number(it.min_stock) > 0 && Number(it.qty_on_hand) <= Number(it.min_stock);
                    return (
                      <tr key={it.id} className={`border-t border-slate-50 ${low ? 'bg-rose-50/40' : ''}`}>
                        <td className="px-3 py-2 font-medium text-slate-900">{it.name}</td>
                        <td className="px-3 py-2 text-slate-500">{it.sku || '—'}</td>
                        <td className="px-3 py-2">
                          {it.qty_on_hand} {it.unit}
                        </td>
                        <td className="px-3 py-2">{avail}</td>
                        <td className="px-3 py-2">{money(it.unit_price)}</td>
                        <td className="px-3 py-2">{it.min_stock}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                className="text-xs text-teal-700 mr-2"
                                onClick={() => {
                                  setEditingItem(it);
                                  setItemForm({
                                    ...EMPTY_ITEM,
                                    ...it,
                                    category_id: it.category_id || '',
                                    supplier_id: it.supplier_id || '',
                                    max_stock: it.max_stock ?? '',
                                    expiry_date: it.expiry_date || '',
                                  });
                                  setItemModal(true);
                                }}
                              >
                                Edit
                              </button>
                              <button type="button" className="text-xs text-rose-600" onClick={() => archiveItem(it)}>
                                Archive
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!invList.length && <p className="text-center text-sm text-slate-500 py-10">No inventory items yet.</p>}
            </div>
          </div>
        )}

        {section === 'purchase-orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Create, approve, and receive stock against suppliers.</p>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => {
                    loadInventory();
                    setPoForm({
                      supplier_id: '',
                      expected_date: '',
                      notes: '',
                      items: [{ inventory_item_id: '', quantity: 1, unit_cost: 0 }],
                    });
                    setPoModal(true);
                  }}
                >
                  New PO
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(Array.isArray(pos) ? pos : []).map((po) => (
                <div key={po.id} className="glass-card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{po.po_number}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {po.status} · {money(po.total_amount)} · {po.expected_date || 'no ETA'}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      {po.status === 'draft' || po.status === 'pending' ? (
                        <>
                          <button type="button" className="btn-outline !py-1 !px-2 text-xs" onClick={() => setPoStatus(po, 'approved')}>
                            Approve
                          </button>
                          <button type="button" className="btn-outline !py-1 !px-2 text-xs" onClick={() => setPoStatus(po, 'rejected')}>
                            Reject
                          </button>
                        </>
                      ) : null}
                      {['approved', 'ordered'].includes(po.status) && (
                        <button type="button" className="btn-primary !py-1 !px-2 text-xs" onClick={() => setPoStatus(po, 'received')}>
                          Receive stock
                        </button>
                      )}
                      {!['received', 'cancelled', 'rejected'].includes(po.status) && (
                        <button type="button" className="text-xs text-rose-600" onClick={() => setPoStatus(po, 'cancelled')}>
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!pos?.length && <p className="text-sm text-slate-500 text-center py-8">No purchase orders.</p>}
            </div>
          </div>
        )}

        {section === 'expenses' && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <p className="text-sm text-slate-600">Track rent, salaries, utilities, marketing, and more.</p>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => {
                    setExpForm(EMPTY_EXPENSE);
                    setExpModal(true);
                  }}
                >
                  Add expense
                </button>
              )}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70">
              <table className="min-w-full text-sm">
                <thead className="text-left text-[11px] uppercase text-slate-500 bg-slate-50/80">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(expenses) ? expenses : []).map((ex) => (
                    <tr key={ex.id} className="border-t border-slate-50">
                      <td className="px-3 py-2">{ex.expense_date}</td>
                      <td className="px-3 py-2 font-medium">{ex.title}</td>
                      <td className="px-3 py-2 capitalize">{(ex.category || '').replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2">{money(ex.amount)}</td>
                      <td className="px-3 py-2 capitalize">{ex.status}</td>
                      <td className="px-3 py-2 text-right">
                        {canManage && ex.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="text-xs text-teal-700 mr-2"
                              onClick={() => updateExpenseStatus(ex, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="text-xs text-rose-600"
                              onClick={() => updateExpenseStatus(ex, 'rejected')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!expenses?.length && <p className="text-center text-sm text-slate-500 py-10">No expenses recorded.</p>}
            </div>
          </div>
        )}

        {section === 'profit-loss' && (
          <div className="space-y-4 print:space-y-2" id="bo-pl-print">
            <div className="flex flex-wrap gap-2 items-end print:hidden">
              <label className="text-xs">
                From
                <input
                  type="date"
                  className="input-field mt-1"
                  value={plRange.from}
                  onChange={(e) => setPlRange((p) => ({ ...p, from: e.target.value }))}
                />
              </label>
              <label className="text-xs">
                To
                <input
                  type="date"
                  className="input-field mt-1"
                  value={plRange.to}
                  onChange={(e) => setPlRange((p) => ({ ...p, to: e.target.value }))}
                />
              </label>
              <button type="button" className="btn-outline text-xs" onClick={printPl}>
                Print
              </button>
              <button
                type="button"
                className="btn-outline text-xs"
                onClick={async () => {
                  setReportType('profit_loss');
                  await runExport();
                }}
              >
                Export JSON
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Kpi label="Revenue" value={money(pl?.revenue)} tone="emerald" />
              <Kpi label="Expenses" value={money(pl?.expenses)} tone="amber" />
              <Kpi
                label="Net Profit"
                value={money(pl?.net_profit)}
                tone={Number(pl?.net_profit) >= 0 ? 'teal' : 'rose'}
              />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass-card !p-4">
                <p className="font-semibold mb-3">Expense breakdown</p>
                {plBreakdown.labels.length ? (
                  <div className="max-w-xs mx-auto">
                    <Doughnut data={plBreakdown} options={{ plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No expenses in range.</p>
                )}
              </div>
              <div className="glass-card !p-4">
                <p className="font-semibold mb-2">Formula</p>
                <p className="text-sm text-slate-600">
                  Revenue ({money(pl?.revenue)}) − Expenses ({money(pl?.expenses)}) ={' '}
                  <strong>{money(pl?.net_profit)}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Revenue pulls from clinic payments / invoices. Expenses from approved, paid, and pending back-office
                  expense records.
                </p>
              </div>
            </div>
          </div>
        )}

        {section === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <p className="text-sm text-slate-600">Kanban board — drag cards between columns.</p>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => {
                    setTaskForm(EMPTY_TASK);
                    setTaskModal(true);
                  }}
                >
                  New task
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { key: 'todo', label: 'To Do' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' },
              ].map((col) => (
                <div
                  key={col.key}
                  className="rounded-2xl bg-slate-50/80 border border-slate-100 min-h-[280px] p-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropColumn(col.key)}
                >
                  <p className="text-xs font-bold uppercase text-slate-500 mb-3">
                    {col.label} · {(board[col.key] || []).length}
                  </p>
                  <div className="space-y-2">
                    {(board[col.key] || []).map((t) => (
                      <div
                        key={t.id}
                        draggable={canManage}
                        onDragStart={() => setDragId(t.id)}
                        className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm cursor-grab active:cursor-grabbing"
                      >
                        <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1 capitalize">
                          {t.priority} · {t.task_type}
                          {t.due_date ? ` · due ${t.due_date}` : ''}
                        </p>
                        {t.description ? <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'equipment' && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <p className="text-sm text-slate-600">Warranty, calibration, and maintenance schedules.</p>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => {
                    setEqForm(EMPTY_EQUIP);
                    setEqModal(true);
                  }}
                >
                  Add equipment
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(Array.isArray(equipment) ? equipment : []).map((eq) => (
                <div key={eq.id} className="glass-card !p-4">
                  <p className="font-semibold">{eq.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {eq.asset_tag || 'No tag'} · {eq.status || 'active'}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Next service: {eq.next_service_date || '—'} · Warranty: {eq.warranty_until || '—'}
                  </p>
                  {eq.calibration_due ? (
                    <p className="text-xs text-amber-700 mt-1">Calibration due {eq.calibration_due}</p>
                  ) : null}
                </div>
              ))}
              {!equipment?.length && <p className="text-sm text-slate-500 col-span-full text-center py-8">No equipment yet.</p>}
            </div>
          </div>
        )}

        {section === 'reports' && (
          <div className="space-y-4 max-w-lg">
            <p className="text-sm text-slate-600">Export operational data as CSV (Excel-compatible).</p>
            <select className="input-field" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="expenses">Expenses</option>
              <option value="inventory">Inventory</option>
              <option value="purchase_orders">Purchase Orders</option>
              <option value="profit_loss">Profit &amp; Loss summary</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="input-field"
                value={plRange.from}
                onChange={(e) => setPlRange((p) => ({ ...p, from: e.target.value }))}
              />
              <input
                type="date"
                className="input-field"
                value={plRange.to}
                onChange={(e) => setPlRange((p) => ({ ...p, to: e.target.value }))}
              />
            </div>
            <button type="button" className="btn-primary text-sm" onClick={runExport}>
              <FaIcon icon="fa-download" className="mr-2" />
              Download / Export
            </button>
          </div>
        )}

        {section === 'analytics' && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass-card !p-4">
                <p className="font-semibold mb-3">Expense trends</p>
                {expenseChart.labels.length ? (
                  <Line data={expenseChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                ) : (
                  <p className="text-sm text-slate-500 py-8 text-center">No expense trend data yet.</p>
                )}
              </div>
              <div className="glass-card !p-4">
                <p className="font-semibold mb-3">Inventory movements</p>
                {movementChart.labels.length ? (
                  <Bar data={movementChart} options={{ responsive: true }} />
                ) : (
                  <p className="text-sm text-slate-500 py-8 text-center">No movement data yet.</p>
                )}
              </div>
            </div>
            <div className="glass-card !p-4">
              <p className="font-semibold mb-2">Purchase trends</p>
              <ul className="text-sm space-y-1">
                {(analytics?.purchase_trend || []).map((r) => (
                  <li key={r.ym} className="flex justify-between border-b border-slate-50 py-1">
                    <span>{r.ym}</span>
                    <span>
                      {r.orders} orders · {money(r.total)}
                    </span>
                  </li>
                ))}
                {!(analytics?.purchase_trend || []).length && (
                  <li className="text-slate-500">No purchase history in range.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {section === 'settings' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card !p-4 space-y-3">
              <p className="font-semibold">Inventory categories</p>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {categories.map((c) => (
                  <li key={c.id} className="text-slate-700">
                    {c.name}
                  </li>
                ))}
              </ul>
              {canManage && (
                <div className="flex gap-2">
                  <input className="input-field flex-1" placeholder="New category" value={catName} onChange={(e) => setCatName(e.target.value)} />
                  <button type="button" className="btn-primary text-xs" onClick={addCategory}>
                    Add
                  </button>
                </div>
              )}
            </div>
            <div className="glass-card !p-4 space-y-3">
              <p className="font-semibold">Suppliers</p>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {suppliers.map((s) => (
                  <li key={s.id} className="text-slate-700">
                    {s.name}
                  </li>
                ))}
              </ul>
              {canManage && (
                <div className="flex gap-2">
                  <input className="input-field flex-1" placeholder="New supplier" value={supName} onChange={(e) => setSupName(e.target.value)} />
                  <button type="button" className="btn-primary text-xs" onClick={addSupplier}>
                    Add
                  </button>
                </div>
              )}
            </div>
            <div className="glass-card !p-4 md:col-span-2">
              <p className="font-semibold mb-1">Security &amp; scope</p>
              <p className="text-sm text-slate-600">
                Access requires <code className="text-xs bg-slate-100 px-1 rounded">backoffice.view</code> /
                <code className="text-xs bg-slate-100 px-1 rounded ml-1">backoffice.manage</code>. All records are
                branch-scoped to clinic #{cid}. Invoice consumables with <code className="text-xs">inventory_item_id</code>{' '}
                auto-deduct stock inside the billing transaction.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Inventory modal */}
      <GlassModal open={itemModal} onClose={() => setItemModal(false)} size="lg">
        <GlassModalHeader title={editingItem ? 'Edit inventory' : 'Add inventory'} onClose={() => setItemModal(false)} />
        <GlassModalBody className="flex flex-col flex-1 min-h-0">
          <div className="grid sm:grid-cols-2 gap-3 overflow-y-auto">
            <label className="text-xs sm:col-span-2">
              Name *
              <input className="input-field mt-1" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            </label>
            <label className="text-xs">
              SKU
              <input className="input-field mt-1" value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} />
            </label>
            <label className="text-xs">
              Barcode / QR
              <input className="input-field mt-1" value={itemForm.barcode} onChange={(e) => setItemForm({ ...itemForm, barcode: e.target.value })} />
            </label>
            <label className="text-xs">
              Category
              <select className="input-field mt-1" value={itemForm.category_id} onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Supplier
              <select className="input-field mt-1" value={itemForm.supplier_id} onChange={(e) => setItemForm({ ...itemForm, supplier_id: e.target.value })}>
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {!editingItem && (
              <label className="text-xs">
                Opening qty
                <input
                  type="number"
                  className="input-field mt-1"
                  value={itemForm.qty_on_hand}
                  onChange={(e) => setItemForm({ ...itemForm, qty_on_hand: e.target.value })}
                />
              </label>
            )}
            <label className="text-xs">
              Unit
              <input className="input-field mt-1" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
            </label>
            <label className="text-xs">
              Unit price
              <input
                type="number"
                className="input-field mt-1"
                value={itemForm.unit_price}
                onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
              />
            </label>
            <label className="text-xs">
              Purchase price
              <input
                type="number"
                className="input-field mt-1"
                value={itemForm.purchase_price}
                onChange={(e) => setItemForm({ ...itemForm, purchase_price: e.target.value })}
              />
            </label>
            <label className="text-xs">
              Min stock
              <input
                type="number"
                className="input-field mt-1"
                value={itemForm.min_stock}
                onChange={(e) => setItemForm({ ...itemForm, min_stock: e.target.value })}
              />
            </label>
            <label className="text-xs">
              Max stock
              <input
                type="number"
                className="input-field mt-1"
                value={itemForm.max_stock}
                onChange={(e) => setItemForm({ ...itemForm, max_stock: e.target.value })}
              />
            </label>
            <label className="text-xs">
              Batch #
              <input
                className="input-field mt-1"
                value={itemForm.batch_number}
                onChange={(e) => setItemForm({ ...itemForm, batch_number: e.target.value })}
              />
            </label>
            <label className="text-xs">
              Expiry
              <input
                type="date"
                className="input-field mt-1"
                value={itemForm.expiry_date}
                onChange={(e) => setItemForm({ ...itemForm, expiry_date: e.target.value })}
              />
            </label>
            <label className="text-xs sm:col-span-2 inline-flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={!!itemForm.is_consumable}
                onChange={(e) => setItemForm({ ...itemForm, is_consumable: e.target.checked })}
              />
              Consumable (deduct on invoice)
            </label>
          </div>
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setItemModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={saving} onClick={saveItem}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </GlassModalFooter>
      </GlassModal>

      {/* Expense modal */}
      <GlassModal open={expModal} onClose={() => setExpModal(false)}>
        <GlassModalHeader title="Record expense" onClose={() => setExpModal(false)} />
        <GlassModalBody className="flex flex-col flex-1 min-h-0 space-y-3 overflow-y-auto">
          <input className="input-field" placeholder="Title" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} />
          <select className="input-field" value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
            {EXPENSE_CATS.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className="input-field"
              placeholder="Amount"
              value={expForm.amount}
              onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
            />
            <input
              type="date"
              className="input-field"
              value={expForm.expense_date}
              onChange={(e) => setExpForm({ ...expForm, expense_date: e.target.value })}
            />
          </div>
          <input className="input-field" placeholder="Vendor" value={expForm.vendor} onChange={(e) => setExpForm({ ...expForm, vendor: e.target.value })} />
          <input
            className="input-field"
            placeholder="Receipt URL"
            value={expForm.receipt_url}
            onChange={(e) => setExpForm({ ...expForm, receipt_url: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Invoice URL"
            value={expForm.invoice_url}
            onChange={(e) => setExpForm({ ...expForm, invoice_url: e.target.value })}
          />
          <textarea
            className="input-field"
            rows={2}
            placeholder="Notes"
            value={expForm.notes}
            onChange={(e) => setExpForm({ ...expForm, notes: e.target.value })}
          />
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setExpModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={saving} onClick={saveExpense}>
            Save
          </button>
        </GlassModalFooter>
      </GlassModal>

      {/* Task modal */}
      <GlassModal open={taskModal} onClose={() => setTaskModal(false)}>
        <GlassModalHeader title="New task" onClose={() => setTaskModal(false)} />
        <GlassModalBody className="space-y-3">
          <input className="input-field" placeholder="Title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          <textarea
            className="input-field"
            rows={2}
            placeholder="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select className="input-field" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select className="input-field" value={taskForm.task_type} onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}>
              {['admin', 'maintenance', 'general'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <input type="date" className="input-field" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setTaskModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={saving} onClick={saveTask}>
            Create
          </button>
        </GlassModalFooter>
      </GlassModal>

      {/* Equipment modal */}
      <GlassModal open={eqModal} onClose={() => setEqModal(false)}>
        <GlassModalHeader title="Add equipment" onClose={() => setEqModal(false)} />
        <GlassModalBody className="grid sm:grid-cols-2 gap-3 overflow-y-auto">
          <input className="input-field sm:col-span-2" placeholder="Name *" value={eqForm.name} onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })} />
          <input className="input-field" placeholder="Asset tag" value={eqForm.asset_tag} onChange={(e) => setEqForm({ ...eqForm, asset_tag: e.target.value })} />
          <input
            className="input-field"
            placeholder="Serial"
            value={eqForm.serial_number}
            onChange={(e) => setEqForm({ ...eqForm, serial_number: e.target.value })}
          />
          <label className="text-xs">
            Purchase date
            <input type="date" className="input-field mt-1" value={eqForm.purchase_date} onChange={(e) => setEqForm({ ...eqForm, purchase_date: e.target.value })} />
          </label>
          <label className="text-xs">
            Warranty until
            <input type="date" className="input-field mt-1" value={eqForm.warranty_until} onChange={(e) => setEqForm({ ...eqForm, warranty_until: e.target.value })} />
          </label>
          <label className="text-xs">
            Next service
            <input
              type="date"
              className="input-field mt-1"
              value={eqForm.next_service_date}
              onChange={(e) => setEqForm({ ...eqForm, next_service_date: e.target.value })}
            />
          </label>
          <label className="text-xs">
            Calibration due
            <input
              type="date"
              className="input-field mt-1"
              value={eqForm.calibration_due}
              onChange={(e) => setEqForm({ ...eqForm, calibration_due: e.target.value })}
            />
          </label>
          <input
            className="input-field sm:col-span-2"
            placeholder="Location"
            value={eqForm.location}
            onChange={(e) => setEqForm({ ...eqForm, location: e.target.value })}
          />
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setEqModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={saving} onClick={saveEquipment}>
            Save
          </button>
        </GlassModalFooter>
      </GlassModal>

      {/* PO modal */}
      <GlassModal open={poModal} onClose={() => setPoModal(false)} size="lg">
        <GlassModalHeader title="New purchase order" onClose={() => setPoModal(false)} />
        <GlassModalBody className="space-y-3 overflow-y-auto">
          <select className="input-field" value={poForm.supplier_id} onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })}>
            <option value="">Supplier (optional)</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input-field"
            value={poForm.expected_date}
            onChange={(e) => setPoForm({ ...poForm, expected_date: e.target.value })}
          />
          {(poForm.items || []).map((line, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <select
                className="input-field col-span-3 sm:col-span-1"
                value={line.inventory_item_id}
                onChange={(e) => {
                  const items = [...poForm.items];
                  items[i] = { ...items[i], inventory_item_id: e.target.value };
                  const found = invList.find((x) => String(x.id) === e.target.value);
                  if (found) items[i].unit_cost = found.purchase_price || 0;
                  setPoForm({ ...poForm, items });
                }}
              >
                <option value="">Item…</option>
                {invList.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input-field"
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) => {
                  const items = [...poForm.items];
                  items[i] = { ...items[i], quantity: e.target.value };
                  setPoForm({ ...poForm, items });
                }}
              />
              <input
                type="number"
                className="input-field"
                placeholder="Unit cost"
                value={line.unit_cost}
                onChange={(e) => {
                  const items = [...poForm.items];
                  items[i] = { ...items[i], unit_cost: e.target.value };
                  setPoForm({ ...poForm, items });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn-outline text-xs"
            onClick={() =>
              setPoForm({
                ...poForm,
                items: [...poForm.items, { inventory_item_id: '', quantity: 1, unit_cost: 0 }],
              })
            }
          >
            + Line
          </button>
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setPoModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={saving} onClick={savePo}>
            Create PO
          </button>
        </GlassModalFooter>
      </GlassModal>
    </ClinicPortalShell>
  );
}
