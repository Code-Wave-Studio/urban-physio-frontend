import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function emptyItem() {
  return { description: '', detail: '', qty: 1, unit_price: 0, discount_type: '', discount_value: 0 };
}

function compute(items, opts) {
  let subtotal = 0;
  items.forEach((it) => {
    const qty = Math.max(1, Number(it.qty) || 1);
    const price = Number(it.unit_price) || 0;
    let line = price * qty;
    if (it.discount_type === 'flat') line -= Number(it.discount_value) || 0;
    if (it.discount_type === 'percent') line -= line * ((Number(it.discount_value) || 0) / 100);
    subtotal += Math.max(0, line);
  });
  let discountAmount = 0;
  if (opts.discount_type === 'flat') discountAmount = Number(opts.discount_value) || 0;
  if (opts.discount_type === 'percent') discountAmount = subtotal * ((Number(opts.discount_value) || 0) / 100);
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
  const taxable = Math.max(0, subtotal - discountAmount);
  let cgst = 0; let sgst = 0; let igst = 0;
  if (opts.tax_type === 'cgst_sgst') {
    cgst = +(taxable * (Number(opts.cgst_rate) || 0) / 100).toFixed(2);
    sgst = +(taxable * (Number(opts.sgst_rate) || 0) / 100).toFixed(2);
  } else if (opts.tax_type === 'igst') {
    igst = +(taxable * (Number(opts.igst_rate) || 0) / 100).toFixed(2);
  }
  const tax = cgst + sgst + igst;
  const grand = +(taxable + tax).toFixed(2);
  const paid = Number(opts.amount_paid) || 0;
  return { subtotal, discountAmount, cgst, sgst, igst, tax, grand, due: Math.max(0, +(grand - paid).toFixed(2)) };
}

export default function ClinicInvoiceGeneratorPage() {
  const { clinicId, loading: boot, clinic } = useClinicPortal();
  const [params] = useSearchParams();
  const [settings, setSettings] = useState(null);
  const [items, setItems] = useState([emptyItem()]);
  const [opts, setOpts] = useState({
    discount_type: '',
    discount_value: 0,
    tax_type: 'cgst_sgst',
    cgst_rate: 9,
    sgst_rate: 9,
    igst_rate: 18,
    amount_paid: 0,
    payment_method: 'upi',
    notes: '',
    patient_id: '',
    appointment_id: '',
    package_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);

  const totals = useMemo(() => compute(items, opts), [items, opts]);

  const loadSettings = useCallback(async () => {
    if (!clinicId) return;
    try {
      const res = await clinicPortal.invoicesSettings(clinicId);
      const s = res.data || res;
      setSettings(s);
      setOpts((o) => ({
        ...o,
        tax_type: s.default_tax_type || 'cgst_sgst',
        cgst_rate: Number(s.default_cgst) || 9,
        sgst_rate: Number(s.default_sgst) || 9,
        igst_rate: Number(s.default_igst) || 18,
      }));
    } catch {
      setSettings({});
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) loadSettings();
  }, [clinicId, loadSettings]);

  // Prefill from appointment / package query params
  useEffect(() => {
    if (!clinicId) return;
    const appt = params.get('appointment_id');
    const pkg = params.get('package_id');
    if (!appt && !pkg) return;
    clinicPortal
      .invoicesFromSource(clinicId, {
        appointment_id: appt || undefined,
        package_id: pkg || undefined,
      })
      .then((res) => {
        const data = res.data || res;
        if (data.line_items?.length) setItems(data.line_items);
        setOpts((o) => ({
          ...o,
          patient_id: data.patient_id || '',
          appointment_id: data.appointment_id || '',
          package_id: data.package_id || '',
        }));
      })
      .catch(() => {});
  }, [clinicId, params]);

  const updateItem = (i, patch) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const brandColor = settings?.brand_color || clinic?.brand_color || '#0d9488';
  const logo = settings?.logo_url || clinic?.logo_url;
  const upiId = settings?.upi_id || '';

  const upiQrUrl = useMemo(() => {
    if (!upiId || totals.due <= 0) return null;
    const pa = encodeURIComponent(upiId);
    const am = encodeURIComponent(String(totals.due));
    const tn = encodeURIComponent('Urban Physio Invoice');
    const data = `upi://pay?pa=${pa}&am=${am}&cu=INR&tn=${tn}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data)}`;
  }, [upiId, totals.due]);

  const save = async (issue = false) => {
    if (!items.some((it) => it.description)) {
      toast.error('Add at least one line item');
      return;
    }
    setSaving(true);
    try {
      const res = await clinicPortal.invoicesCreate(clinicId, {
        ...opts,
        line_items: items,
        discount_type: opts.discount_type || null,
        status: issue ? 'issued' : 'draft',
        issue: issue,
        upi_id: upiId,
        footer_notes: settings?.footer_notes,
      });
      const inv = res.data || res;
      setSavedInvoice(inv);
      toast.success(issue ? 'Invoice issued' : 'Draft saved');
    } catch (e) {
      toast.error(e.message || 'Could not save invoice');
    } finally {
      setSaving(false);
    }
  };

  const shareWhatsApp = () => {
    const inv = savedInvoice;
    const text = [
      `Invoice ${inv?.invoice_number || '(draft)'}`,
      `Amount Due: ${money(totals.due)}`,
      `Total: ${money(totals.grand)}`,
      inv?.payment_link ? `Pay Now: ${inv.payment_link}` : upiId ? `UPI: ${upiId}` : '',
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Invoice ${savedInvoice?.invoice_number || ''}`.trim());
    const body = encodeURIComponent(
      `Please find your invoice summary.\n\nTotal: ${money(totals.grand)}\nAmount Due: ${money(totals.due)}\n\nThank you.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const printPreview = () => {
    const el = document.getElementById('invoice-a4-preview');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Invoice</title></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  const Preview = () => (
    <div
      id="invoice-a4-preview"
      className="bg-white shadow-lg mx-auto"
      style={{ width: '100%', maxWidth: 640, minHeight: 800, fontFamily: 'Segoe UI, system-ui, sans-serif' }}
    >
      <div className="p-6 sm:p-8" style={{ borderTop: `4px solid ${brandColor}` }}>
        <div className="flex justify-between gap-4 items-start">
          <div>
            {logo ? <img src={logo} alt="" className="h-12 object-contain mb-2" /> : null}
            <p className="font-bold text-lg" style={{ color: brandColor }}>{clinic?.name || 'Clinic'}</p>
            {settings?.gstin && <p className="text-xs text-slate-500">GSTIN: {settings.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-slate-400">Invoice</p>
            <p className="font-bold">{savedInvoice?.invoice_number || 'DRAFT'}</p>
            <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <table className="w-full mt-6 text-sm">
          <thead>
            <tr style={{ background: `${brandColor}15` }}>
              <th className="text-left p-2">Item</th>
              <th className="text-center p-2">Qty</th>
              <th className="text-right p-2">Rate</th>
              <th className="text-right p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.filter((it) => it.description).map((it, i) => {
              const qty = Math.max(1, Number(it.qty) || 1);
              const amt = qty * (Number(it.unit_price) || 0);
              return (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-2">
                    <strong>{it.description}</strong>
                    {it.detail && <div className="text-xs text-slate-400">{it.detail}</div>}
                  </td>
                  <td className="p-2 text-center">{qty}</td>
                  <td className="p-2 text-right">{money(it.unit_price)}</td>
                  <td className="p-2 text-right font-medium">{money(amt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 ml-auto max-w-xs text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(totals.subtotal)}</span></div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600"><span>Discount</span><span>-{money(totals.discountAmount)}</span></div>
          )}
          {opts.tax_type === 'cgst_sgst' && (
            <>
              <div className="flex justify-between"><span className="text-slate-500">CGST ({opts.cgst_rate}%)</span><span>{money(totals.cgst)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">SGST ({opts.sgst_rate}%)</span><span>{money(totals.sgst)}</span></div>
            </>
          )}
          {opts.tax_type === 'igst' && (
            <div className="flex justify-between"><span className="text-slate-500">IGST ({opts.igst_rate}%)</span><span>{money(totals.igst)}</span></div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ color: brandColor }}>
            <span>Grand Total</span><span>{money(totals.grand)}</span>
          </div>
          <div className="flex justify-between"><span className="text-slate-500">Paid</span><span>{money(opts.amount_paid)}</span></div>
          <div className="flex justify-between font-semibold text-amber-700"><span>Balance Due</span><span>{money(totals.due)}</span></div>
        </div>

        {upiQrUrl && totals.due > 0 && (
          <div className="mt-6 flex items-center gap-4">
            <img src={upiQrUrl} alt="UPI QR" className="w-28 h-28 rounded-lg border" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold">Pay via UPI</p>
              <p>{upiId}</p>
              <p className="mt-1">Amount: {money(totals.due)}</p>
            </div>
          </div>
        )}

        {(settings?.footer_notes || opts.notes) && (
          <p className="mt-6 text-xs text-slate-500 border-t pt-3">{opts.notes || settings?.footer_notes}</p>
        )}
        {settings?.signature_url && (
          <div className="mt-4 text-right">
            <img src={settings.signature_url} alt="Signature" className="h-12 ml-auto object-contain" />
            <p className="text-[10px] text-slate-400">Authorized Signature</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ClinicPortalShell
      title="Invoice Generator"
      subtitle="Live A4 preview · GST · UPI QR · WhatsApp & Email share"
      actions={
        <div className="portal-page-actions">
          <button type="button" className="btn-outline text-sm lg:hidden" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
          <button type="button" className="btn-outline text-sm" disabled={saving} onClick={() => save(false)}>
            Save Draft
          </button>
          <button type="button" className="btn-primary text-sm" disabled={saving} onClick={() => save(true)}>
            Issue Invoice
          </button>
        </div>
      }
    >
      {boot ? (
        <div className="glass-card h-64 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: settings + line items */}
          <div className="space-y-4">
            <div className="glass-card !p-4 space-y-3">
              <p className="font-semibold text-sm">Line Items</p>
              {items.map((it, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-3 space-y-2">
                  <input
                    className="input-field text-sm"
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" min="1" className="input-field text-xs" placeholder="Qty"
                      value={it.qty} onChange={(e) => updateItem(i, { qty: e.target.value })} />
                    <input type="number" min="0" className="input-field text-xs" placeholder="Unit ₹"
                      value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: e.target.value })} />
                    <button type="button" className="text-xs text-rose-600" onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="input-field text-xs" value={it.discount_type || ''}
                      onChange={(e) => updateItem(i, { discount_type: e.target.value })}>
                      <option value="">No line discount</option>
                      <option value="flat">Flat ₹</option>
                      <option value="percent">%</option>
                    </select>
                    {it.discount_type && (
                      <input type="number" className="input-field text-xs" value={it.discount_value}
                        onChange={(e) => updateItem(i, { discount_value: e.target.value })} />
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="btn-outline text-xs w-full" onClick={() => setItems((p) => [...p, emptyItem()])}>
                + Add Item
              </button>
            </div>

            <div className="glass-card !p-4 space-y-3">
              <p className="font-semibold text-sm">Discounts & Tax</p>
              <div className="grid grid-cols-2 gap-2">
                <select className="input-field text-sm" value={opts.discount_type}
                  onChange={(e) => setOpts({ ...opts, discount_type: e.target.value })}>
                  <option value="">No grand discount</option>
                  <option value="flat">Flat ₹</option>
                  <option value="percent">Percent %</option>
                </select>
                {opts.discount_type && (
                  <input type="number" className="input-field text-sm" value={opts.discount_value}
                    onChange={(e) => setOpts({ ...opts, discount_value: e.target.value })} />
                )}
              </div>
              <select className="input-field text-sm" value={opts.tax_type}
                onChange={(e) => setOpts({ ...opts, tax_type: e.target.value })}>
                <option value="cgst_sgst">CGST + SGST</option>
                <option value="igst">IGST</option>
                <option value="none">No Tax</option>
              </select>
              {opts.tax_type === 'cgst_sgst' && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs">CGST %
                    <input type="number" className="input-field mt-1" value={opts.cgst_rate}
                      onChange={(e) => setOpts({ ...opts, cgst_rate: e.target.value })} />
                  </label>
                  <label className="text-xs">SGST %
                    <input type="number" className="input-field mt-1" value={opts.sgst_rate}
                      onChange={(e) => setOpts({ ...opts, sgst_rate: e.target.value })} />
                  </label>
                </div>
              )}
              {opts.tax_type === 'igst' && (
                <label className="text-xs">IGST %
                  <input type="number" className="input-field mt-1" value={opts.igst_rate}
                    onChange={(e) => setOpts({ ...opts, igst_rate: e.target.value })} />
                </label>
              )}
            </div>

            <div className="glass-card !p-4 space-y-3">
              <p className="font-semibold text-sm">Payment</p>
              <div className="flex flex-wrap gap-2">
                {['cash', 'upi', 'card', 'online'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setOpts({ ...opts, payment_method: m })}
                    className={`px-3 py-1.5 rounded-full text-xs capitalize border ${
                      opts.payment_method === m ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <label className="text-xs">Amount Paid (partial / split)
                <input type="number" className="input-field mt-1" value={opts.amount_paid}
                  onChange={(e) => setOpts({ ...opts, amount_paid: e.target.value })} />
              </label>
              <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total</span><strong>{money(totals.grand)}</strong></div>
                <div className="flex justify-between"><span>Paid</span><span>{money(opts.amount_paid)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Remaining</span><strong>{money(totals.due)}</strong></div>
              </div>
              <textarea className="input-field text-sm" rows={2} placeholder="Notes / footer"
                value={opts.notes} onChange={(e) => setOpts({ ...opts, notes: e.target.value })} />
            </div>

            {savedInvoice && (
              <div className="glass-card !p-4 flex flex-wrap gap-2">
                <button type="button" className="btn-outline text-xs" onClick={printPreview}>
                  <FaIcon icon="fa-print" className="mr-1" /> Print / PDF
                </button>
                <button type="button" className="btn-outline text-xs" onClick={shareEmail}>
                  <FaIcon icon="fa-envelope" className="mr-1" /> Email
                </button>
                <button type="button" className="btn-primary text-xs" onClick={shareWhatsApp}>
                  <FaIcon icon="fa-whatsapp" brand className="mr-1" /> WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Right: live preview (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-4 max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-100 p-4">
              <Preview />
            </div>
          </div>
        </div>
      )}

      {/* Mobile preview drawer */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[92dvh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between">
              <p className="font-bold">Invoice Preview</p>
              <button type="button" onClick={() => setPreviewOpen(false)}><FaIcon icon="fa-xmark" /></button>
            </div>
            <div className="p-3"><Preview /></div>
          </div>
        </div>
      )}
    </ClinicPortalShell>
  );
}
