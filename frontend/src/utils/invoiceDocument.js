function esc(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  return String(t).slice(0, 5);
}

/**
 * Build printable HTML for a paid invoice (data from GET /payments/:appointmentId).
 * @param {object} data — InvoiceBuilder payload
 */
export function buildInvoiceHtml(data) {
  const s = data.settings || {};
  const patient = data.patient || {};
  const doctor = data.doctor || {};
  const appt = data.appointment || {};
  const totals = data.totals || {};
  const pay = data.payment || {};
  const lines = data.line_items || [];

  const lineRows = lines
    .map(
      (row) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;">
        <strong>${esc(row.description)}</strong>
        ${row.detail ? `<br><span style="color:#64748b;font-size:12px;">${esc(row.detail)}</span>` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${row.quantity || 1}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(row.unit_price)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${money(row.amount)}</td>
    </tr>`
    )
    .join('');

  const taxRow =
    totals.tax_percent > 0
      ? `<tr><td colspan="3" style="padding:8px;text-align:right;color:#64748b;">GST (${totals.tax_percent}%)</td><td style="padding:8px;text-align:right;">${money(totals.tax_amount)}</td></tr>`
      : '';

  const dueLater =
    totals.amount_due_later > 0
      ? `<p style="margin:8px 0 0;font-size:13px;color:#b45309;background:#fffbeb;padding:10px 12px;border-radius:8px;border:1px solid #fde68a;">
        Balance ${totals.pay_later_label || 'due later'}: <strong>${money(totals.amount_due_later)}</strong> (appointment total ${money(totals.appointment_total)})
      </p>`
      : '';

  const bankBlock =
    s.bank_name && s.bank_account
      ? `<div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;font-size:12px;color:#475569;">
        <strong>Bank details</strong><br>
        ${esc(s.bank_name)} · A/C ${esc(s.bank_account)}${s.bank_ifsc ? ` · IFSC ${esc(s.bank_ifsc)}` : ''}
      </div>`
      : '';

  const logoRaw = s.logo_url || s.logo || s.clinic_logo || data.clinic_logo;
  const logoSrc = resolveMediaUrl(logoRaw);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${esc(data.invoice_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #f1f5f9; }
    @media print { body { background: #fff; padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:800px;margin:0 auto 16px;display:flex;gap:8px;">
    <button onclick="window.print()" style="padding:10px 20px;background:#0284c7;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Print / Save PDF</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer;">Close</button>
  </div>
  <div style="max-width:800px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.08);">
    <div style="background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;padding:28px 32px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          ${logoSrc ? `<img src="${esc(logoSrc)}" alt="" style="max-height:48px;max-width:200px;object-fit:contain;margin-bottom:12px;display:block;" />` : ''}
          <h1 style="margin:0;font-size:26px;font-weight:800;">${esc(s.business_name || 'The Urban Physio')}</h1>
          ${s.tagline ? `<p style="margin:6px 0 0;opacity:.9;font-size:14px;">${esc(s.tagline)}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:12px;opacity:.85;text-transform:uppercase;letter-spacing:.08em;">Tax Invoice</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:700;">${esc(data.invoice_number)}</p>
          <p style="margin:4px 0 0;font-size:13px;opacity:.9;">${formatDate(data.issued_at)}</p>
        </div>
      </div>
    </div>
    <div style="padding:28px 32px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
        <div>
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.06em;">From</p>
          <p style="margin:0;font-weight:600;">${esc(s.business_name)}</p>
          ${s.address ? `<p style="margin:4px 0 0;font-size:13px;color:#475569;">${esc(s.address)}</p>` : ''}
          ${s.city_state ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">${esc(s.city_state)}</p>` : ''}
          ${s.phone ? `<p style="margin:6px 0 0;font-size:13px;">${esc(s.phone)}</p>` : ''}
          ${s.email ? `<p style="margin:2px 0 0;font-size:13px;">${esc(s.email)}</p>` : ''}
          ${s.gstin ? `<p style="margin:8px 0 0;font-size:12px;color:#64748b;">GSTIN: ${esc(s.gstin)}</p>` : ''}
          ${s.pan ? `<p style="margin:2px 0 0;font-size:12px;color:#64748b;">PAN: ${esc(s.pan)}</p>` : ''}
        </div>
        <div>
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.06em;">Bill to</p>
          <p style="margin:0;font-weight:600;">${esc(patient.name)}</p>
          ${patient.email ? `<p style="margin:4px 0 0;font-size:13px;color:#475569;">${esc(patient.email)}</p>` : ''}
          ${patient.phone ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">${esc(patient.phone)}</p>` : ''}
          ${patient.address ? `<p style="margin:6px 0 0;font-size:13px;color:#475569;">${esc(patient.address)}</p>` : ''}
          ${patient.age || patient.gender ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${patient.age ? `Age ${patient.age}` : ''}${patient.age && patient.gender ? ' · ' : ''}${patient.gender ? esc(patient.gender) : ''}</p>` : ''}
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
        <span style="background:#f0f9ff;color:#0369a1;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;">Booking: ${esc(data.booking_id)}</span>
        <span style="background:#f0fdf4;color:#15803d;padding:8px 14px;border-radius:8px;font-size:13px;">Paid</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;">Description</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;">Rate</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;">Amount</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
      <div style="margin-top:8px;display:flex;justify-content:flex-end;">
        <table style="width:280px;font-size:14px;">
          <tr><td style="padding:8px;text-align:right;color:#64748b;">Amount paid (this invoice)</td><td style="padding:8px;text-align:right;font-weight:600;">${money(totals.amount_paid_online)}</td></tr>
          ${taxRow}
          <tr style="background:#f0f9ff;">
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:#0369a1;">Total on invoice</td>
            <td style="padding:12px 8px;text-align:right;font-weight:800;font-size:18px;color:#0369a1;">${money(totals.grand_total)}</td>
          </tr>
        </table>
      </div>
      ${dueLater}
      <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px;font-size:13px;">
        <p style="margin:0 0 8px;font-weight:700;color:#334155;">Appointment</p>
        <p style="margin:0;color:#475569;">
          ${esc(appt.consultation_label)} with ${esc(doctor.name)}${doctor.specialization ? ` (${esc(doctor.specialization)})` : ''}<br>
          ${formatDate(appt.date)} · ${formatTime(appt.start_time)}${appt.end_time ? ` – ${formatTime(appt.end_time)}` : ''}
          ${appt.clinic_name ? `<br>${esc(appt.clinic_name)}${appt.clinic_address ? ` — ${esc(appt.clinic_address)}` : ''}` : ''}
        </p>
      </div>
      ${pay.razorpay_payment_id ? `<p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">Payment ref: ${esc(pay.razorpay_payment_id)}</p>` : ''}
      ${bankBlock}
      ${s.terms_text ? `<p style="margin:20px 0 0;font-size:11px;color:#64748b;line-height:1.5;">${esc(s.terms_text)}</p>` : ''}
      ${s.footer_note ? `<p style="margin:12px 0 0;font-size:12px;color:#475569;text-align:center;">${esc(s.footer_note)}</p>` : ''}
    </div>
  </div>
</body>
</html>`;
}
