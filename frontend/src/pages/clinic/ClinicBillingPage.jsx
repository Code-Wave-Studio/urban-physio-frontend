import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import { clinicPortal } from '../../services/api';
import useClinicPortal from '../../hooks/useClinicPortal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'fa-gauge' },
  { id: 'pending', label: 'Pending', icon: 'fa-hourglass-half' },
  { id: 'payments', label: 'Payments', icon: 'fa-money-bill-wave' },
  { id: 'invoices', label: 'Invoices', icon: 'fa-file-invoice' },
  { id: 'receipts', label: 'Receipts', icon: 'fa-receipt' },
  { id: 'packages', label: 'Packages', icon: 'fa-box-open' },
  { id: 'gst', label: 'GST', icon: 'fa-percent' },
  { id: 'refunds', label: 'Refunds', icon: 'fa-rotate-left' },
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function Kpi({ label, value, icon, tint = 'teal' }) {
  const t = {
    teal: 'bg-teal-50 text-teal-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
  }[tint];
  return (
    <div className="glass-card !p-3.5">
      <div className="flex justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${t}`}>
          <FaIcon icon={icon} />
        </span>
      </div>
    </div>
  );
}

function printReceiptHtml(r) {
  const w = window.open('', '_blank', 'width=480,height=700');
  if (!w) return;
  const p = r.payment || {};
  const clinic = r.clinic || {};
  w.document.write(`<!doctype html><html><head><title>Receipt ${r.receipt_number || ''}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a;font-size:13px}
      h1{font-size:18px;margin:0 0 4px} h2{font-size:14px;margin:16px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      .muted{color:#64748b} .row{display:flex;justify-content:space-between;margin:4px 0}
      .box{border:1px solid #cbd5e1;border-radius:12px;padding:14px;margin-top:10px}
      .total{font-size:16px;font-weight:700}
    </style></head><body>
    <h1>${clinic.name || 'Clinic'}</h1>
    <p class="muted">${clinic.address || ''}</p>
    ${clinic.gstin ? `<p class="muted">GSTIN: ${clinic.gstin}</p>` : ''}
    <div class="box">
      <div class="row"><span>Receipt</span><strong>${r.receipt_number || '—'}</strong></div>
      <div class="row"><span>Invoice</span><strong>${r.invoice_number || '—'}</strong></div>
      <div class="row"><span>Date</span><span>${r.issued_at || ''}</span></div>
      <div class="row"><span>Patient</span><span>${r.patient?.name || '—'}</span></div>
      <div class="row"><span>Doctor</span><span>${r.doctor?.name || '—'}</span></div>
      <div class="row"><span>Booking</span><span>${r.appointment?.booking_id || '—'}</span></div>
      <div class="row"><span>Channel</span><span>${p.channel || '—'} / ${p.method || '—'}</span></div>
      ${Number(p.discount_amount) > 0 ? `<div class="row"><span>Discount</span><span>- ${money(p.discount_amount)}</span></div>` : ''}
      ${Number(p.gst_amount) > 0 ? `<div class="row"><span>GST (${p.gst_percent}%)</span><span>${money(p.gst_amount)}</span></div>` : ''}
      <div class="row total"><span>Paid</span><span>${money(p.amount)}</span></div>
      <div class="row"><span>Status</span><span>${p.status || '—'}</span></div>
    </div>
    <p class="muted" style="margin-top:16px">Computer-generated receipt — The Urban Physio</p>
    <script>window.print()</script></body></html>`);
  w.document.close();
}

export default function ClinicBillingPage() {
  const { clinicId, can, isAdminMode, loading: boot } = useClinicPortal();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pending, setPending] = useState([]);
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('all');
  const [q, setQ] = useState('');

  const [collectOpen, setCollectOpen] = useState(false);
  const [collectRow, setCollectRow] = useState(null);
  const [collectForm, setCollectForm] = useState({
    method: 'cash',
    channel: 'offline',
    amount: '',
    discount_amount: '',
    discount_note: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const qRef = useRef(q);
  qRef.current = q;

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const searchQ = String(qRef.current || '').trim() || undefined;
      const [ov, pay, pen, pkg, set] = await Promise.all([
        clinicPortal.billingOverview(clinicId),
        clinicPortal.billingPayments(clinicId, { q: searchQ }),
        clinicPortal.billingPending(clinicId),
        clinicPortal.billingPackages(clinicId),
        clinicPortal.billingSettings(clinicId),
      ]);
      setOverview(ov.data || ov);
      setPayments(pay.data || pay || []);
      setPending(pen.data || pen || []);
      setPackages(pkg.data || pkg || []);
      const s = set.data || set;
      setSettings(s);
      setSettingsForm(s);
    } catch (e) {
      toast.error(e.message || 'Could not load billing');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const filteredPayments = useMemo(() => {
    let rows = payments;
    if (channelFilter === 'online') {
      rows = rows.filter((p) => (p.channel || p.payment_channel) === 'online' || p.razorpay_payment_id);
    } else if (channelFilter === 'offline') {
      rows = rows.filter((p) => (p.channel || p.payment_channel) === 'offline' || !p.razorpay_payment_id);
    }
    return rows;
  }, [payments, channelFilter]);

  const refundRows = useMemo(
    () => payments.filter((p) => ['refunded', 'partial_refund'].includes(p.status)),
    [payments]
  );

  const openCollect = (row) => {
    setCollectRow(row);
    setCollectForm({
      method: 'cash',
      channel: 'offline',
      amount: String(row.amount || ''),
      discount_amount: '',
      discount_note: '',
      notes: '',
    });
    setCollectOpen(true);
  };

  const submitCollect = async (e) => {
    e.preventDefault();
    if (!clinicId || !collectRow) return;
    setBusy(true);
    try {
      const payload = {
        appointment_id: collectRow.id,
        method: collectForm.method,
        channel: collectForm.channel,
        amount: Number(collectForm.amount) || undefined,
        notes: collectForm.notes,
      };
      if (settings?.enable_discounts && Number(collectForm.discount_amount) > 0) {
        payload.discount_amount = Number(collectForm.discount_amount);
        payload.discount_note = collectForm.discount_note;
      }
      const res = await clinicPortal.billingCollect(clinicId, payload);
      const data = res.data || res;
      toast.success(`Collected ${money(data.amount)} · Receipt ${data.receipt_number || data.invoice_number}`);
      setCollectOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Collection failed');
    } finally {
      setBusy(false);
    }
  };

  const doRefund = async (payment) => {
    if (!can('billing.refund')) {
      toast.error('Refunds require Clinic Admin');
      return;
    }
    const reason = window.prompt('Refund reason (Razorpay refund):', 'Patient request');
    if (reason === null) return;
    const amtStr = window.prompt('Refund amount (blank = full):', String(payment.amount));
    if (amtStr === null) return;
    setBusy(true);
    try {
      await clinicPortal.billingRefund(clinicId, payment.id, {
        reason,
        amount: amtStr === '' ? 0 : Number(amtStr),
      });
      toast.success('Refund processed via Razorpay');
      load();
    } catch (e) {
      toast.error(e.message || 'Refund failed');
    } finally {
      setBusy(false);
    }
  };

  const printReceipt = async (paymentId) => {
    try {
      const res = await clinicPortal.billingReceipt(clinicId, paymentId);
      printReceiptHtml(res.data || res);
    } catch (e) {
      toast.error(e.message || 'Could not load receipt');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    if (!can('billing.settings')) {
      toast.error('Only Clinic Admin can change GST / billing settings');
      return;
    }
    setSavingSettings(true);
    try {
      await clinicPortal.updateBillingSettings(clinicId, {
        ...settingsForm,
        show_gst: !!settingsForm.show_gst,
        tax_percent: Number(settingsForm.tax_percent) || 0,
        enable_online_payment: !!settingsForm.enable_online_payment,
        enable_offline_payment: !!settingsForm.enable_offline_payment,
        enable_discounts: !!settingsForm.enable_discounts,
        enable_refunds: !!settingsForm.enable_refunds,
      });
      toast.success('Billing / GST settings saved');
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSavingSettings(false);
    }
  };

  const ov = overview || {};
  const visibleTabs = TABS.filter((t) => {
    if (t.id === 'gst' && !isAdminMode && !can('billing.settings')) return true; // view GST info
    return true;
  });

  return (
    <ClinicPortalShell
      title="Billing System"
      subtitle="Invoices, payments, pending, packages, GST, receipts, refunds & discounts"
    >
      {!boot && !can('billing.view') ? (
        <div className="glass-card text-center py-12 text-slate-500">No billing access.</div>
      ) : (
        <div className="space-y-4">
          <div className="portal-tabs pb-1">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  tab === t.id ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                <FaIcon icon={t.icon} />
                {t.label}
              </button>
            ))}
          </div>

          {loading || boot ? (
            <div className="portal-kpi-grid">
              {[1, 2, 3, 4].map((i) => <div key={i} className="glass-card h-24 animate-pulse" />)}
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-4">
                  <div className="portal-kpi-grid md:!grid-cols-3 xl:!grid-cols-5">
                    <Kpi label="Today's revenue" value={money(ov.revenue_today)} icon="fa-indian-rupee-sign" tint="emerald" />
                    <Kpi label="Month revenue" value={money(ov.revenue_month)} icon="fa-calendar" tint="violet" />
                    <Kpi label="Pending payments" value={`${ov.pending_count || 0} · ${money(ov.pending_amount)}`} icon="fa-hourglass-half" tint="rose" />
                    <Kpi label="Online / Offline" value={`${ov.online_payments || 0} / ${ov.offline_payments || 0}`} icon="fa-globe" tint="sky" />
                    <Kpi label="Refunds" value={`${ov.refund_count || 0} · ${money(ov.refund_amount)}`} icon="fa-rotate-left" tint="amber" />
                  </div>
                  <div className="glass-card !p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800 mb-1">Quick status</p>
                    <ul className="space-y-1">
                      <li>• Offline payments: {settings?.enable_offline_payment ? 'Enabled' : 'Disabled'}</li>
                      <li>• Online payments: {settings?.enable_online_payment ? 'Enabled' : 'Disabled'}</li>
                      <li>• Discounts: {settings?.enable_discounts ? 'Enabled' : 'Disabled'}</li>
                      <li>• Refunds: {settings?.enable_refunds ? 'Enabled' : 'Disabled'}</li>
                      <li>• GST: {settings?.show_gst ? `${settings.tax_percent}%` : 'Off'}</li>
                      <li>• Active packages: {ov.active_packages ?? 0}</li>
                    </ul>
                  </div>
                </div>
              )}

              {tab === 'pending' && (
                <div className="glass-card !p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h3 className="font-semibold text-slate-900">Pending payments</h3>
                    <button type="button" className="btn-outline text-xs w-full sm:w-auto" onClick={load}>Refresh</button>
                  </div>
                  {!pending.length ? (
                    <p className="px-4 py-10 text-center text-slate-500">No pending payments</p>
                  ) : (
                    <>
                      <div className="portal-mobile-list">
                        {pending.map((row) => (
                          <article key={row.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2 shadow-sm">
                            <div className="flex justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{row.patient_full_name || 'Patient'}</p>
                                <p className="text-[11px] font-mono text-slate-500">{row.booking_id}</p>
                              </div>
                              <p className="font-bold text-slate-900 shrink-0">{money(row.amount)}</p>
                            </div>
                            <p className="text-xs text-slate-600">{row.appointment_date} · {row.start_time} · {row.doctor_name || '—'}</p>
                            {can('billing.collect') && (
                              <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => openCollect(row)}>
                                Collect payment
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                      <div className="portal-desktop-table portal-table-wrap">
                        <table className="w-full text-sm">
                          <thead className="text-[11px] uppercase text-slate-500 bg-slate-50/80 text-left">
                            <tr>
                              <th className="px-4 py-3">Patient</th>
                              <th className="px-4 py-3">When</th>
                              <th className="px-4 py-3">Doctor</th>
                              <th className="px-4 py-3">Amount</th>
                              <th className="px-4 py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pending.map((row) => (
                              <tr key={row.id} className="border-t border-slate-100">
                                <td className="px-4 py-3">
                                  <p className="font-medium">{row.patient_full_name || 'Patient'}</p>
                                  <p className="text-xs text-slate-500">{row.booking_id}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">{row.appointment_date} · {row.start_time}</td>
                                <td className="px-4 py-3">{row.doctor_name || '—'}</td>
                                <td className="px-4 py-3 font-semibold">{money(row.amount)}</td>
                                <td className="px-4 py-3">
                                  {can('billing.collect') && (
                                    <button type="button" className="text-xs font-semibold text-teal-700 hover:underline" onClick={() => openCollect(row)}>
                                      Collect payment
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {(tab === 'payments' || tab === 'invoices' || tab === 'receipts') && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-end">
                    <input className="input-field text-sm w-full sm:max-w-xs" placeholder="Search patient / invoice…" value={q} onChange={(e) => setQ(e.target.value)} />
                    <div className="portal-toolbar-scroll">
                      {['all', 'online', 'offline'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setChannelFilter(c)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                            channelFilter === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="btn-outline text-sm" onClick={load}>Apply</button>
                  </div>
                  <div className="glass-card !p-0 overflow-hidden">
                    {!filteredPayments.length ? (
                      <p className="px-4 py-10 text-center text-slate-500">No payments found</p>
                    ) : (
                      <>
                        <div className="portal-mobile-list">
                          {filteredPayments.map((p) => (
                            <article key={p.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2 shadow-sm">
                              <div className="flex justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold truncate">{p.patient_full_name || '—'}</p>
                                  <p className="text-[11px] font-mono text-slate-500 truncate">{p.invoice_number || '—'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold">{money(p.amount)}</p>
                                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>{p.status}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 capitalize">
                                {(p.channel || p.payment_channel || (p.razorpay_payment_id ? 'online' : 'offline'))}
                                {p.payment_method ? ` · ${p.payment_method}` : ''}
                              </p>
                              <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
                                <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => printReceipt(p.id)}>Print receipt</button>
                                {can('billing.refund') && p.status === 'paid' && settings?.enable_refunds && (
                                  <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => doRefund(p)} disabled={busy}>Refund</button>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                        <div className="portal-desktop-table portal-table-wrap">
                          <table className="w-full text-sm">
                      <thead className="text-[11px] uppercase text-slate-500 bg-slate-50/80 text-left">
                        <tr>
                          <th className="px-4 py-3">Invoice / Receipt</th>
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Channel</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((p) => (
                          <tr key={p.id} className="border-t border-slate-100">
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs">{p.invoice_number || '—'}</p>
                              <p className="text-[11px] text-slate-500">{p.receipt_number || ''}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{p.patient_full_name || '—'}</p>
                              <p className="text-xs text-slate-500">{p.booking_id}</p>
                            </td>
                            <td className="px-4 py-3">
                              {money(p.amount)}
                              {Number(p.discount_amount) > 0 && (
                                <span className="block text-[10px] text-amber-700">Disc {money(p.discount_amount)}</span>
                              )}
                              {Number(p.gst_amount) > 0 && (
                                <span className="block text-[10px] text-violet-700">GST {money(p.gst_amount)}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 capitalize text-xs">
                              {(p.channel || p.payment_channel || (p.razorpay_payment_id ? 'online' : 'offline'))}
                              {p.payment_method ? ` · ${p.payment_method}` : ''}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>{p.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1 items-start">
                                <button type="button" className="text-[11px] font-semibold text-teal-700 hover:underline" onClick={() => printReceipt(p.id)}>
                                  Print receipt
                                </button>
                                {can('billing.refund') && p.status === 'paid' && settings?.enable_refunds && (
                                  <button type="button" className="text-[11px] font-semibold text-rose-600 hover:underline" onClick={() => doRefund(p)} disabled={busy}>
                                    Refund
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {tab === 'packages' && (
                <div className="glass-card !p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold">Patient packages</h3>
                    <p className="text-xs text-slate-500">Walk-in / clinic packages linked to billing</p>
                  </div>
                  <div className="portal-table-wrap">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-slate-500 bg-slate-50/80 text-left">
                      <tr>
                        <th className="px-4 py-3">Package</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Sessions</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg) => (
                        <tr key={pkg.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium">{pkg.package_name || 'Package'}</td>
                          <td className="px-4 py-3">{pkg.patient_name || '—'}<span className="block text-xs text-slate-500">{pkg.patient_phone}</span></td>
                          <td className="px-4 py-3">{pkg.completed_sessions ?? 0}/{pkg.total_sessions ?? '—'}</td>
                          <td className="px-4 py-3 capitalize">{pkg.status || '—'}</td>
                        </tr>
                      ))}
                      {!packages.length && (
                        <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No packages yet</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {tab === 'gst' && settingsForm && (
                <form onSubmit={saveSettings} className="glass-card !p-5 max-w-2xl space-y-3">
                  <h3 className="font-semibold text-slate-900">GST & billing settings</h3>
                  {!can('billing.settings') && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      View only — unlock Clinic Admin to edit GST / payment controls.
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Business name</label>
                      <input className="input-field" disabled={!can('billing.settings')} value={settingsForm.business_name || ''} onChange={(e) => setSettingsForm((f) => ({ ...f, business_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">GSTIN</label>
                      <input className="input-field" disabled={!can('billing.settings')} value={settingsForm.gstin || ''} onChange={(e) => setSettingsForm((f) => ({ ...f, gstin: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">PAN</label>
                      <input className="input-field" disabled={!can('billing.settings')} value={settingsForm.pan || ''} onChange={(e) => setSettingsForm((f) => ({ ...f, pan: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Tax %</label>
                      <input type="number" step="0.01" className="input-field" disabled={!can('billing.settings')} value={settingsForm.tax_percent ?? 0} onChange={(e) => setSettingsForm((f) => ({ ...f, tax_percent: e.target.value }))} />
                    </div>
                  </div>
                  <textarea className="input-field" rows={2} disabled={!can('billing.settings')} placeholder="Billing address" value={settingsForm.address || ''} onChange={(e) => setSettingsForm((f) => ({ ...f, address: e.target.value }))} />
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    {[
                      ['show_gst', 'Show GST on invoices'],
                      ['enable_online_payment', 'Online payments'],
                      ['enable_offline_payment', 'Offline payments'],
                      ['enable_discounts', 'Allow discounts'],
                      ['enable_refunds', 'Allow refunds'],
                    ].map(([key, label]) => (
                      <label key={key} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!can('billing.settings')}
                          checked={!!settingsForm[key]}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, [key]: e.target.checked }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {can('billing.settings') && (
                    <button type="submit" className="btn-primary" disabled={savingSettings}>
                      {savingSettings ? 'Saving…' : 'Save GST settings'}
                    </button>
                  )}
                </form>
              )}

              {tab === 'refunds' && (
                <div className="glass-card !p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold">Refund history</h3>
                    {!can('billing.refund') && (
                      <p className="text-xs text-slate-500 mt-1">Receptionist can view; Clinic Admin processes refunds from Payments tab.</p>
                    )}
                  </div>
                  <div className="portal-table-wrap">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-slate-500 bg-slate-50/80 text-left">
                      <tr>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Refunded</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundRows.map((p) => (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-mono text-xs">{p.invoice_number}</td>
                          <td className="px-4 py-3">{p.patient_full_name}</td>
                          <td className="px-4 py-3">{money(p.refund_amount)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{p.refund_reason || '—'}</td>
                          <td className="px-4 py-3 capitalize text-xs">{p.status}</td>
                        </tr>
                      ))}
                      {!refundRows.length && (
                        <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No refunds yet</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <GlassModal open={collectOpen} onClose={() => setCollectOpen(false)} size="md">
        <GlassModalHeader
          title="Collect payment"
          subtitle={collectRow ? `${collectRow.patient_full_name || 'Patient'} · ${money(collectRow.amount)}` : ''}
          icon="fa-indian-rupee-sign"
          onClose={() => setCollectOpen(false)}
        />
        <form onSubmit={submitCollect}>
          <GlassModalBody>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Method (offline)</label>
                <select className="input-field" value={collectForm.method} onChange={(e) => setCollectForm((f) => ({ ...f, method: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Channel</label>
                <input className="input-field bg-slate-50" value="Offline collection only" disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Amount</label>
                <input type="number" step="0.01" className="input-field" value={collectForm.amount} onChange={(e) => setCollectForm((f) => ({ ...f, amount: e.target.value }))} required />
              </div>
              {settings?.enable_discounts && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Discount</label>
                    <input type="number" step="0.01" className="input-field" value={collectForm.discount_amount} onChange={(e) => setCollectForm((f) => ({ ...f, discount_amount: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Discount note</label>
                    <input className="input-field" value={collectForm.discount_note} onChange={(e) => setCollectForm((f) => ({ ...f, discount_note: e.target.value }))} placeholder="e.g. Senior citizen" />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Notes</label>
                <input className="input-field" value={collectForm.notes} onChange={(e) => setCollectForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            {settings?.show_gst && (
              <p className="text-xs text-violet-700 mt-3">GST {settings.tax_percent}% will be added on the discounted subtotal.</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Online payments are received only through the platform Razorpay account. This popup is only for offline collection and receipt generation.
            </p>
          </GlassModalBody>
          <GlassModalFooter>
            <button type="button" className="btn-outline" onClick={() => setCollectOpen(false)} disabled={busy}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Collect & generate receipt'}</button>
          </GlassModalFooter>
        </form>
      </GlassModal>
    </ClinicPortalShell>
  );
}
