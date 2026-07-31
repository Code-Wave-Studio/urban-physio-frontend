import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  return { description: '', detail: '', qty: 1, unit_price: 0, discount_type: '', discount_value: 0, inventory_item_id: null };
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

function patientKey(p) {
  if (p.clinic_patient_id) return `cp-${p.clinic_patient_id}`;
  if (p.patient_id) return `p-${p.patient_id}`;
  return '';
}

function buildPrintHtml({ clinicName, brandColor, logo, settings, items, opts, totals, savedInvoice, upiQrUrl, insurance }) {
  const rows = items.filter((it) => it.description).map((it) => {
    const qty = Math.max(1, Number(it.qty) || 1);
    const amt = qty * (Number(it.unit_price) || 0);
    const medCols = insurance?.ready
      ? `<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:11px">${insurance.diagnosis || '—'}</td>
         <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:11px">${insurance.treatment || '—'}</td>`
      : '';
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>${it.description}</strong>${it.detail ? `<div style="color:#94a3b8;font-size:11px">${it.detail}</div>` : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${qty}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${money(it.unit_price)}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${money(amt)}</td>
      ${medCols}
    </tr>`;
  }).join('');

  const medHead = insurance?.ready
    ? `<th style="text-align:left;padding:8px">Diagnosis</th><th style="text-align:left;padding:8px">Treatment</th>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${savedInvoice?.invoice_number || 'Draft'}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 0; background: #fff; }
  .sheet { max-width: 800px; margin: 0 auto; border-top: 5px solid ${brandColor}; padding: 28px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
  thead tr { background: ${brandColor}18; }
  th { padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
  .totals { width: 280px; margin-left: auto; margin-top: 16px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
  .grand { font-size: 16px; font-weight: 700; color: ${brandColor}; border-top: 1px solid #e2e8f0; padding-top: 8px !important; margin-top: 6px; }
  .due { color: #b45309; font-weight: 600; }
  .meta { display:flex; justify-content:space-between; gap:16px; }
  .qr { display:flex; gap:16px; align-items:center; margin-top:24px; }
  .qr img { width:120px; height:120px; border:1px solid #e2e8f0; border-radius:8px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="sheet">
  <div class="meta">
    <div>
      ${logo ? `<img src="${logo}" style="height:48px;object-fit:contain;margin-bottom:8px" alt=""/>` : ''}
      <div style="font-size:18px;font-weight:700;color:${brandColor}">${clinicName || 'Clinic'}</div>
      ${settings?.gstin ? `<div style="font-size:12px;color:#64748b">GSTIN: ${settings.gstin}</div>` : ''}
      ${insurance?.ready && insurance?.doctorReg ? `<div style="font-size:12px;color:#64748b">Doctor Reg: ${insurance.doctorReg}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;letter-spacing:.12em;color:#94a3b8;text-transform:uppercase">Invoice</div>
      <div style="font-weight:700;font-size:16px">${savedInvoice?.invoice_number || 'DRAFT'}</div>
      <div style="font-size:12px;color:#64748b">${new Date().toLocaleDateString('en-IN')}</div>
      ${insurance?.ready ? `<div style="margin-top:6px;font-size:10px;font-weight:700;color:${brandColor};border:1px solid ${brandColor};display:inline-block;padding:2px 8px;border-radius:999px">MEDICLAIM READY</div>` : ''}
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th>${medHead}
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
    ${totals.discountAmount > 0 ? `<div style="color:#e11d48"><span>Discount</span><span>-${money(totals.discountAmount)}</span></div>` : ''}
    ${opts.tax_type === 'cgst_sgst' ? `<div><span>CGST (${opts.cgst_rate}%)</span><span>${money(totals.cgst)}</span></div><div><span>SGST (${opts.sgst_rate}%)</span><span>${money(totals.sgst)}</span></div>` : ''}
    ${opts.tax_type === 'igst' ? `<div><span>IGST (${opts.igst_rate}%)</span><span>${money(totals.igst)}</span></div>` : ''}
    <div class="grand"><span>Grand Total</span><span>${money(totals.grand)}</span></div>
    <div><span>Paid</span><span>${money(opts.amount_paid)}</span></div>
    <div class="due"><span>Balance Due</span><span>${money(totals.due)}</span></div>
  </div>
  ${upiQrUrl && totals.due > 0 ? `<div class="qr"><img src="${upiQrUrl}" alt="UPI QR"/><div style="font-size:12px"><strong>Pay via UPI</strong><div>${settings?.upi_id || ''}</div><div>Amount: ${money(totals.due)}</div>${savedInvoice?.payment_link ? `<div style="margin-top:6px"><a href="${savedInvoice.payment_link}">Pay online</a></div>` : ''}</div></div>` : ''}
  ${(opts.notes || settings?.footer_notes) ? `<p style="margin-top:24px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px">${opts.notes || settings?.footer_notes}</p>` : ''}
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
}

export default function ClinicInvoiceGeneratorPage() {
  const { clinicId, loading: boot, clinic, can } = useClinicPortal();
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
    clinic_patient_id: '',
    appointment_id: '',
    package_id: '',
    insurance_ready: false,
    doctor_reg_number: '',
    diagnosis_code: '',
    treatment_codes: '',
  });
  const [patientLabel, setPatientLabel] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [patientHits, setPatientHits] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [gatewayForm, setGatewayForm] = useState({
    payment_routing: 'tup',
    gateway_provider: 'razorpay',
    gateway_key_id: '',
    gateway_key_secret: '',
    gateway_upi_vpa: '',
    upi_id: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const searchTimer = useRef(null);
  const [stockItems, setStockItems] = useState([]);

  const totals = useMemo(() => compute(items, opts), [items, opts]);

  useEffect(() => {
    if (!clinicId || !can('backoffice.view')) return undefined;
    let cancelled = false;
    clinicPortal
      .boInventory(clinicId)
      .then((r) => {
        if (!cancelled) setStockItems((r.data || r)?.items || []);
      })
      .catch(() => {
        if (!cancelled) setStockItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]); // eslint-disable-line react-hooks/exhaustive-deps — can() is stable enough at mount

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
      setGatewayForm({
        payment_routing: s.payment_routing || 'tup',
        gateway_provider: s.gateway_provider || 'razorpay',
        gateway_key_id: s.gateway_key_id || '',
        gateway_key_secret: s.gateway_key_secret_set ? '********' : '',
        gateway_upi_vpa: s.gateway_upi_vpa || '',
        upi_id: s.upi_id || '',
      });
    } catch {
      setSettings({});
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) loadSettings();
  }, [clinicId, loadSettings]);

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
          clinic_patient_id: data.clinic_patient_id || '',
          appointment_id: data.appointment_id || '',
          package_id: data.package_id || '',
        }));
        if (data.patient_id || data.clinic_patient_id) {
          setPatientLabel(data.patient_id ? `Patient #${data.patient_id}` : `Walk-in #${data.clinic_patient_id}`);
        }
      })
      .catch(() => {});
  }, [clinicId, params]);

  useEffect(() => {
    if (!clinicId || patientQ.trim().length < 2) {
      setPatientHits([]);
      return undefined;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setPatientSearching(true);
      try {
        const res = await clinicPortal.patientSearch(clinicId, patientQ.trim());
        setPatientHits(res.data || res || []);
      } catch {
        setPatientHits([]);
      } finally {
        setPatientSearching(false);
      }
    }, 280);
    return () => clearTimeout(searchTimer.current);
  }, [clinicId, patientQ]);

  const updateItem = (i, patch) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const brandColor = settings?.brand_color || clinic?.brand_color || '#0d9488';
  const logo = settings?.logo_url || clinic?.logo_url || clinic?.logo;
  const upiId = gatewayForm.gateway_upi_vpa || gatewayForm.upi_id || settings?.upi_id || '';

  const upiQrUrl = useMemo(() => {
    if (!upiId || totals.due <= 0) return null;
    const data = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${encodeURIComponent(String(totals.due))}&cu=INR&tn=${encodeURIComponent(savedInvoice?.invoice_number || 'Invoice')}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data)}`;
  }, [upiId, totals.due, savedInvoice]);

  const selectPatient = (p) => {
    setOpts((o) => ({
      ...o,
      patient_id: p.patient_id || '',
      clinic_patient_id: p.clinic_patient_id || '',
    }));
    setPatientLabel(
      p.name || p.patient_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || patientKey(p)
    );
    setPatientQ('');
    setPatientHits([]);
  };

  const payloadBase = () => ({
    ...opts,
    line_items: items,
    discount_type: opts.discount_type || null,
    upi_id: upiId,
    footer_notes: settings?.footer_notes,
    insurance_ready: !!opts.insurance_ready,
    doctor_reg_number: opts.insurance_ready ? opts.doctor_reg_number : null,
    diagnosis_code: opts.insurance_ready ? opts.diagnosis_code : null,
    treatment_codes: opts.insurance_ready ? opts.treatment_codes : null,
  });

  const save = async (issue = false) => {
    if (!items.some((it) => it.description)) {
      toast.error('Add at least one line item');
      return;
    }
    setSaving(true);
    try {
      const res = await clinicPortal.invoicesCreate(clinicId, {
        ...payloadBase(),
        status: issue ? 'issued' : 'draft',
        issue,
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

  const finalizeAndShare = async () => {
    if (!items.some((it) => it.description)) {
      toast.error('Add at least one line item');
      return;
    }
    setSaving(true);
    try {
      let inv = savedInvoice;
      if (!inv?.id) {
        const res = await clinicPortal.invoicesCreate(clinicId, {
          ...payloadBase(),
          status: 'issued',
          issue: true,
        });
        inv = res.data || res;
      }
      const shared = await clinicPortal.invoicesFinalizeShare(clinicId, inv.id);
      const out = shared.data || shared;
      setSavedInvoice(out);
      toast.success('Invoice finalized · published to patient portal · notifications sent');
    } catch (e) {
      toast.error(e.message || 'Could not finalize & share');
    } finally {
      setSaving(false);
    }
  };

  const printOrSharePdf = async (share = false) => {
    const html = buildPrintHtml({
      clinicName: clinic?.name,
      brandColor,
      logo,
      settings: { ...settings, upi_id: upiId },
      items,
      opts,
      totals,
      savedInvoice,
      upiQrUrl,
      insurance: opts.insurance_ready
        ? {
            ready: true,
            doctorReg: opts.doctor_reg_number,
            diagnosis: opts.diagnosis_code,
            treatment: opts.treatment_codes,
          }
        : null,
    });

    if (share && navigator.share && navigator.canShare) {
      try {
        const blob = new Blob([html], { type: 'text/html' });
        const file = new File([blob], `${savedInvoice?.invoice_number || 'invoice'}.html`, { type: 'text/html' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice ${savedInvoice?.invoice_number || ''}`.trim(),
            text: `Invoice total ${money(totals.grand)} · Due ${money(totals.due)}${savedInvoice?.payment_link ? `\nPay: ${savedInvoice.payment_link}` : ''}`,
            files: [file],
          });
          return;
        }
      } catch {
        /* fall through to print */
      }
    }

    const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
    if (!w) {
      toast.error('Allow pop-ups to print / share PDF');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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

  const saveGatewaySettings = async () => {
    setSavingSettings(true);
    try {
      const payload = {
        payment_routing: gatewayForm.payment_routing,
        gateway_provider: gatewayForm.gateway_provider,
        gateway_key_id: gatewayForm.gateway_key_id,
        gateway_upi_vpa: gatewayForm.gateway_upi_vpa,
        upi_id: gatewayForm.upi_id,
      };
      if (gatewayForm.gateway_key_secret && gatewayForm.gateway_key_secret !== '********') {
        payload.gateway_key_secret = gatewayForm.gateway_key_secret;
      }
      const res = await clinicPortal.invoicesSaveSettings(clinicId, payload);
      setSettings(res.data || res);
      toast.success('Billing & payment settings saved');
      loadSettings();
    } catch (e) {
      toast.error(e.message || 'Could not save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const Preview = () => (
    <div
      id="invoice-a4-preview"
      className="bg-white shadow-lg mx-auto overflow-hidden"
      style={{ width: '100%', maxWidth: 640, minHeight: 800, fontFamily: 'Segoe UI, system-ui, sans-serif', borderTop: `4px solid ${brandColor}` }}
    >
      <div className="p-6 sm:p-8">
        <div className="flex justify-between gap-4 items-start">
          <div>
            {logo ? <img src={logo} alt="" className="h-12 object-contain mb-2" /> : null}
            <p className="font-bold text-lg" style={{ color: brandColor }}>{clinic?.name || 'Clinic'}</p>
            {settings?.gstin && <p className="text-xs text-slate-500">GSTIN: {settings.gstin}</p>}
            {opts.insurance_ready && opts.doctor_reg_number && (
              <p className="text-xs text-slate-500">Doctor Reg: {opts.doctor_reg_number}</p>
            )}
            {patientLabel && <p className="text-xs text-slate-600 mt-1">Bill to: <strong>{patientLabel}</strong></p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-slate-400">Invoice</p>
            <p className="font-bold">{savedInvoice?.invoice_number || 'DRAFT'}</p>
            <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-IN')}</p>
            {opts.insurance_ready && (
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: brandColor, borderColor: brandColor }}>
                MEDICLAIM READY
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: `${brandColor}15` }}>
                <th className="text-left p-2">Item</th>
                <th className="text-center p-2">Qty</th>
                <th className="text-right p-2">Rate</th>
                <th className="text-right p-2">Amount</th>
                {opts.insurance_ready && (
                  <>
                    <th className="text-left p-2 text-xs">Diagnosis</th>
                    <th className="text-left p-2 text-xs">Treatment</th>
                  </>
                )}
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
                    {opts.insurance_ready && (
                      <>
                        <td className="p-2 text-xs text-slate-600">{opts.diagnosis_code || '—'}</td>
                        <td className="p-2 text-xs text-slate-600">{opts.treatment_codes || '—'}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
              {savedInvoice?.payment_link && (
                <a href={savedInvoice.payment_link} className="text-teal-700 underline mt-1 inline-block" target="_blank" rel="noreferrer">
                  Magic payment link
                </a>
              )}
            </div>
          </div>
        )}

        {(settings?.footer_notes || opts.notes) && (
          <p className="mt-6 text-xs text-slate-500 border-t pt-3">{opts.notes || settings?.footer_notes}</p>
        )}
      </div>
    </div>
  );

  return (
    <ClinicPortalShell
      title="Invoice Generator"
      subtitle="Live A4 preview · GST · Mediclaim · Dual payment routing · Share"
      actions={
        <div className="portal-page-actions">
          <button type="button" className="btn-outline text-sm lg:hidden" onClick={() => setPreviewOpen(true)}>Preview</button>
          <button type="button" className="btn-outline text-sm" disabled={saving} onClick={() => save(false)}>Save Draft</button>
          <button type="button" className="btn-outline text-sm" disabled={saving} onClick={() => save(true)}>Issue</button>
          <button type="button" className="btn-primary text-sm" disabled={saving} onClick={finalizeAndShare}>
            Finalize & Share
          </button>
        </div>
      }
    >
      {boot ? (
        <div className="glass-card h-64 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Patient search */}
            <div className="glass-card !p-4 space-y-2 relative">
              <p className="font-semibold text-sm">Patient</p>
              {patientLabel ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-teal-50 border border-teal-100 px-3 py-2">
                  <span className="text-sm font-medium text-teal-900 truncate">{patientLabel}</span>
                  <button type="button" className="text-xs text-rose-600" onClick={() => { setPatientLabel(''); setOpts((o) => ({ ...o, patient_id: '', clinic_patient_id: '' })); }}>
                    Clear
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="input-field text-sm"
                    placeholder="Search patient by name / phone…"
                    value={patientQ}
                    onChange={(e) => setPatientQ(e.target.value)}
                  />
                  {patientSearching && <p className="text-[11px] text-slate-400">Searching…</p>}
                  {!!patientHits.length && (
                    <ul className="absolute z-20 left-4 right-4 mt-1 max-h-48 overflow-y-auto rounded-xl border bg-white shadow-lg">
                      {patientHits.slice(0, 12).map((p) => (
                        <li key={patientKey(p) || p.id}>
                          <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={() => selectPatient(p)}>
                            <span className="font-medium">{p.name || p.patient_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()}</span>
                            <span className="text-xs text-slate-400 ml-2">{p.phone || ''}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="glass-card !p-4 space-y-3">
              <p className="font-semibold text-sm">Line Items</p>
              {items.map((it, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-3 space-y-2">
                  {stockItems.length > 0 && (
                    <select
                      className="input-field text-xs"
                      value={it.inventory_item_id || ''}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : null;
                        const found = stockItems.find((s) => s.id === id);
                        updateItem(i, {
                          inventory_item_id: id,
                          description: found ? found.name : it.description,
                          unit_price: found ? found.unit_price : it.unit_price,
                        });
                      }}
                    >
                      <option value="">Manual line (no stock deduct)</option>
                      {stockItems.filter((s) => Number(s.is_consumable) !== 0).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · stock {s.available_qty ?? s.qty_on_hand} {s.unit}
                        </option>
                      ))}
                    </select>
                  )}
                  <input className="input-field text-sm" placeholder="Description" value={it.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" min="1" className="input-field text-xs" placeholder="Qty" value={it.qty}
                      onChange={(e) => updateItem(i, { qty: e.target.value })} />
                    <input type="number" min="0" className="input-field text-xs" placeholder="Unit ₹" value={it.unit_price}
                      onChange={(e) => updateItem(i, { unit_price: e.target.value })} />
                    <button type="button" className="text-xs text-rose-600" onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>Remove</button>
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
              <button type="button" className="btn-outline text-xs w-full" onClick={() => setItems((p) => [...p, emptyItem()])}>+ Add Item</button>
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

            {/* Mediclaim */}
            <div className="glass-card !p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">Make Insurance Ready</p>
                  <p className="text-[11px] text-slate-500">Adds mediclaim columns to the PDF</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={opts.insurance_ready}
                  onClick={() => setOpts({ ...opts, insurance_ready: !opts.insurance_ready })}
                  className={`relative w-12 h-7 rounded-full transition ${opts.insurance_ready ? 'bg-teal-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition ${opts.insurance_ready ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              {opts.insurance_ready && (
                <div className="space-y-2">
                  <input className="input-field text-sm" placeholder="Treating Doctor Registration Number"
                    value={opts.doctor_reg_number} onChange={(e) => setOpts({ ...opts, doctor_reg_number: e.target.value })} />
                  <input className="input-field text-sm" placeholder="Patient Diagnosis Code (ICD-10)"
                    value={opts.diagnosis_code} onChange={(e) => setOpts({ ...opts, diagnosis_code: e.target.value })} />
                  <input className="input-field text-sm" placeholder="Treatment Codes"
                    value={opts.treatment_codes} onChange={(e) => setOpts({ ...opts, treatment_codes: e.target.value })} />
                </div>
              )}
            </div>

            <div className="glass-card !p-4 space-y-3">
              <p className="font-semibold text-sm">Payment</p>
              <div className="flex flex-wrap gap-2">
                {['cash', 'upi', 'card', 'online'].map((m) => (
                  <button key={m} type="button" onClick={() => setOpts({ ...opts, payment_method: m })}
                    className={`px-3 py-1.5 rounded-full text-xs capitalize border ${
                      opts.payment_method === m ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200'
                    }`}>{m}</button>
                ))}
              </div>
              <label className="text-xs">Amount Paid
                <input type="number" className="input-field mt-1" value={opts.amount_paid}
                  onChange={(e) => setOpts({ ...opts, amount_paid: e.target.value })} />
              </label>
              <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total</span><strong>{money(totals.grand)}</strong></div>
                <div className="flex justify-between text-amber-700"><span>Remaining</span><strong>{money(totals.due)}</strong></div>
              </div>
              <textarea className="input-field text-sm" rows={2} placeholder="Notes / footer"
                value={opts.notes} onChange={(e) => setOpts({ ...opts, notes: e.target.value })} />
            </div>

            {/* Dual routing settings */}
            {can('billing.settings') && (
              <div className="glass-card !p-4 space-y-3">
                <p className="font-semibold text-sm">Billing & Payments</p>
                <div className="grid gap-2">
                  <label className={`rounded-xl border p-3 text-sm cursor-pointer ${gatewayForm.payment_routing === 'tup' ? 'border-teal-400 bg-teal-50' : 'border-slate-200'}`}>
                    <input type="radio" className="mr-2" checked={gatewayForm.payment_routing === 'tup'}
                      onChange={() => setGatewayForm({ ...gatewayForm, payment_routing: 'tup' })} />
                    Use The Urban Physio Secure Pay (Default)
                  </label>
                  <label className={`rounded-xl border p-3 text-sm cursor-pointer ${gatewayForm.payment_routing === 'clinic' ? 'border-teal-400 bg-teal-50' : 'border-slate-200'}`}>
                    <input type="radio" className="mr-2" checked={gatewayForm.payment_routing === 'clinic'}
                      onChange={() => setGatewayForm({ ...gatewayForm, payment_routing: 'clinic' })} />
                    Connect Custom Gateway
                  </label>
                </div>
                <input className="input-field text-sm" placeholder="Clinic UPI VPA (for QR)"
                  value={gatewayForm.upi_id} onChange={(e) => setGatewayForm({ ...gatewayForm, upi_id: e.target.value })} />
                {gatewayForm.payment_routing === 'clinic' && (
                  <div className="space-y-2 border-t pt-3">
                    <select className="input-field text-sm" value={gatewayForm.gateway_provider}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, gateway_provider: e.target.value })}>
                      <option value="razorpay">Razorpay</option>
                    </select>
                    <input className="input-field text-sm" placeholder="Gateway API Key (Key ID)"
                      value={gatewayForm.gateway_key_id} onChange={(e) => setGatewayForm({ ...gatewayForm, gateway_key_id: e.target.value })} />
                    <input className="input-field text-sm" type="password" placeholder="Gateway API Secret"
                      value={gatewayForm.gateway_key_secret} onChange={(e) => setGatewayForm({ ...gatewayForm, gateway_key_secret: e.target.value })} />
                    <input className="input-field text-sm" placeholder="Direct UPI VPA (optional)"
                      value={gatewayForm.gateway_upi_vpa} onChange={(e) => setGatewayForm({ ...gatewayForm, gateway_upi_vpa: e.target.value })} />
                  </div>
                )}
                <button type="button" className="btn-outline text-xs" disabled={savingSettings} onClick={saveGatewaySettings}>
                  {savingSettings ? 'Saving…' : 'Save payment settings'}
                </button>
              </div>
            )}

            <div className="glass-card !p-4 flex flex-wrap gap-2">
              <button type="button" className="btn-outline text-xs" onClick={() => printOrSharePdf(false)}>
                <FaIcon icon="fa-print" className="mr-1" /> Print / PDF
              </button>
              <button type="button" className="btn-outline text-xs" onClick={() => printOrSharePdf(true)}>
                <FaIcon icon="fa-share-nodes" className="mr-1" /> Share PDF
              </button>
              <button type="button" className="btn-outline text-xs" onClick={shareWhatsApp} disabled={!savedInvoice}>
                <FaIcon icon="fa-whatsapp" brand className="mr-1" /> WhatsApp
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-4 max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-100 p-4">
              <Preview />
            </div>
          </div>
        </div>
      )}

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
