import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={`flex items-center justify-between gap-3 glass-card !p-3 ${disabled ? 'opacity-60' : ''}`}>
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="scale-125" />
    </label>
  );
}

export default function AdminBillingPage() {
  const [data, setData] = useState(null);
  const [controls, setControls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refundBusy, setRefundBusy] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .billingOverview()
      .then((res) => {
        const d = res.data || res;
        setData(d);
        setControls(d.controls || {});
      })
      .catch((e) => toast.error(e.message || 'Failed to load billing'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveControls = async () => {
    setSaving(true);
    try {
      const res = await admin.updateBillingControls(controls);
      setControls(res.data || res);
      toast.success('Platform billing controls saved');
      load();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleClinic = async (clinic, key) => {
    try {
      await admin.updateClinicBilling(clinic.id, { [key]: !clinic[key] });
      toast.success('Clinic billing updated');
      load();
    } catch (e) {
      toast.error(e.message || 'Update failed');
    }
  };

  const doRefund = async (payment) => {
    const reason = window.prompt('Refund reason:', 'Admin refund');
    if (reason === null) return;
    const amt = window.prompt('Amount (blank = full):', String(payment.amount));
    if (amt === null) return;
    setRefundBusy(payment.id);
    try {
      await admin.refund({
        payment_id: payment.id,
        amount: amt === '' ? 0 : Number(amt),
        reason,
      });
      toast.success('Refund processed');
      load();
    } catch (e) {
      toast.error(e.message || 'Refund failed');
    } finally {
      setRefundBusy(null);
    }
  };

  const k = data?.kpis || {};

  return (
    <AdminDashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Billing System</h1>
            <p className="text-sm text-slate-500 mt-1">
              Platform control for invoices, payments, GST, refunds, discounts, online &amp; offline collection
            </p>
          </div>
          <Link to="/admin/invoice-settings" className="btn-outline text-sm inline-flex items-center gap-2">
            <FaIcon icon="fa-file-invoice" /> Invoice / GST template
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="glass-card h-24 animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Paid volume', money(k.paid_amount), `${k.paid_count || 0} payments`],
                ['Pending', money(k.pending_amount), `${k.pending_count || 0} appointments`],
                ['Refunds', money(k.refund_amount), `${k.refund_count || 0} records`],
                ['Online / Offline', `${k.online_count || 0} / ${k.offline_count || 0}`, 'channels'],
              ].map(([label, value, sub]) => (
                <div key={label} className="glass-card !p-4">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass-card !p-5 space-y-3">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FaIcon icon="fa-sliders" className="text-teal-600" />
                  Platform billing controls
                </h2>
                <p className="text-xs text-slate-500">These master switches apply to all clinics (clinic admin can still tighten further).</p>
                {controls && (
                  <div className="space-y-2">
                    <Toggle label="Enable clinic billing module" checked={controls.enable_clinic_billing} onChange={(v) => setControls((c) => ({ ...c, enable_clinic_billing: v }))} />
                    <Toggle label="Online payments" checked={controls.enable_online_payment} onChange={(v) => setControls((c) => ({ ...c, enable_online_payment: v }))} />
                    <Toggle label="Offline payments" checked={controls.enable_offline_payment} onChange={(v) => setControls((c) => ({ ...c, enable_offline_payment: v }))} />
                    <Toggle label="Discounts" checked={controls.enable_discounts} onChange={(v) => setControls((c) => ({ ...c, enable_discounts: v }))} />
                    <Toggle label="Refunds" checked={controls.enable_refunds} onChange={(v) => setControls((c) => ({ ...c, enable_refunds: v }))} />
                    <Toggle label="GST on invoices" checked={controls.enable_gst} onChange={(v) => setControls((c) => ({ ...c, enable_gst: v }))} />
                    <Toggle label="Packages billing" checked={controls.enable_packages_billing} onChange={(v) => setControls((c) => ({ ...c, enable_packages_billing: v }))} />
                  </div>
                )}
                <button type="button" className="btn-primary" onClick={saveControls} disabled={saving}>
                  {saving ? 'Saving…' : 'Save controls'}
                </button>
              </div>

              <div className="glass-card !p-5">
                <h2 className="font-semibold text-slate-900 mb-2">Platform invoice template</h2>
                <p className="text-sm text-slate-600 mb-3">
                  Business header, GSTIN and default tax % used when clinic GST is enabled.
                </p>
                <dl className="text-sm space-y-1.5">
                  <div className="flex justify-between gap-2"><dt className="text-slate-500">Business</dt><dd className="font-medium">{data?.invoice_settings?.business_name || '—'}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-500">GSTIN</dt><dd className="font-medium">{data?.invoice_settings?.gstin || '—'}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-500">Show GST</dt><dd className="font-medium">{data?.invoice_settings?.show_gst ? 'Yes' : 'No'}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-500">Tax %</dt><dd className="font-medium">{data?.invoice_settings?.tax_percent ?? 0}%</dd></div>
                </dl>
                <Link to="/admin/invoice-settings" className="btn-outline text-sm mt-4 inline-flex">Edit invoice settings</Link>
              </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-semibold">Clinic billing flags</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase text-slate-500 bg-slate-50/80 text-left">
                    <tr>
                      <th className="px-4 py-3">Clinic</th>
                      <th className="px-4 py-3">GSTIN</th>
                      <th className="px-4 py-3">GST</th>
                      <th className="px-4 py-3">Offline</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Refund</th>
                      <th className="px-4 py-3">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.clinics || []).map((c) => (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-xs">{c.gstin || '—'}</td>
                        <td className="px-4 py-3">
                          <button type="button" className="text-xs font-semibold text-teal-700 hover:underline" onClick={() => toggleClinic(c, 'show_gst')}>
                            {Number(c.show_gst) ? `${c.tax_percent || 0}%` : 'Off'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" className="text-xs font-semibold hover:underline" onClick={() => toggleClinic(c, 'enable_offline_payment')}>
                            {Number(c.enable_offline_payment) !== 0 ? 'On' : 'Off'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" className="text-xs font-semibold hover:underline" onClick={() => toggleClinic(c, 'enable_discounts')}>
                            {Number(c.enable_discounts) !== 0 ? 'On' : 'Off'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" className="text-xs font-semibold hover:underline" onClick={() => toggleClinic(c, 'enable_refunds')}>
                            {Number(c.enable_refunds) !== 0 ? 'On' : 'Off'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" className="text-xs font-semibold hover:underline" onClick={() => toggleClinic(c, 'is_active')}>
                            {Number(c.is_active) !== 0 ? 'Active' : 'Off'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!(data?.clinics || []).length && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No clinics</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
                <h2 className="font-semibold">Recent payments</h2>
                <button type="button" className="text-xs font-semibold text-teal-700" onClick={load}>Refresh</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase text-slate-500 bg-slate-50/80 text-left">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Clinic / Patient</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recent_payments || []).map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-mono text-xs">{p.invoice_number || p.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.clinic_name || '—'}</p>
                          <p className="text-xs text-slate-500">{p.patient_full_name}</p>
                        </td>
                        <td className="px-4 py-3">{money(p.amount)}</td>
                        <td className="px-4 py-3 capitalize text-xs">{p.status}</td>
                        <td className="px-4 py-3">
                          {p.status === 'paid' && (
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-600 hover:underline"
                              disabled={refundBusy === p.id}
                              onClick={() => doRefund(p)}
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
