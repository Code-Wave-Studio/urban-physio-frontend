import { useMemo } from 'react';
import FaIcon from '../FaIcon';

/**
 * Default letterhead config for Physiotherapy Assessment Form (3-zone header/footer).
 */
export function defaultLetterhead(brand = {}) {
  return {
    form_title: brand.form_title || 'Physiotherapy Assessment Form',
    subtitle: brand.subtitle || 'Initial Evaluation',
    form_code: brand.form_code || 'TUP-AF-001',
    form_version: brand.form_version || 'v1.0',
    revision_date: brand.revision_date || new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    department: brand.department || 'Orthopaedic Physiotherapy',
    language: brand.language || 'English',
    clinic_name: brand.clinic_name || '',
    tagline: brand.tagline || '',
    branch_name: brand.branch_name || '',
    address: brand.address || '',
    phone: brand.phone || '',
    whatsapp: brand.whatsapp || '',
    email: brand.email || '',
    website: brand.website || 'theurbanphysio.com',
    registration_no: brand.registration_no || '',
    gstin: brand.gstin || '',
    logo_url: brand.logo_url || '',
    primary_color: brand.primary_color || '#0d9488',
    accreditation_urls: brand.accreditation_urls || [],
    checklist: {
      id_proof: false,
      referral_letter: false,
      reports: false,
      insurance: false,
      consent: false,
      ...(brand.checklist || {}),
    },
    consent_text:
      brand.consent_text ||
      'I confirm that the information provided above is accurate to the best of my knowledge and I consent to physiotherapy assessment and treatment as recommended.',
    disclaimer:
      brand.disclaimer ||
      'This document contains personal health information protected under the Digital Personal Data Protection Act, 2023. Unauthorised access or disclosure is prohibited.',
  };
}

function initials(name) {
  return String(name || 'C')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'C';
}

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(String(d).includes('T') ? d : `${d}T12:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(d).slice(0, 10);
  }
}

/**
 * Sticky 3-zone assessment letterhead + footer for screen + @media print.
 */
export default function AssessmentFormChrome({
  letterhead: lhIn,
  patient = {},
  visit = {},
  physio = {},
  checklist: checklistIn,
  mode = 'screen', // screen | preview | print
  children,
  pageLabel = '1',
  totalPages = '—',
  digitalRecordUrl = '',
  onChecklistChange,
}) {
  const lh = useMemo(() => defaultLetterhead(lhIn || {}), [lhIn]);
  const primary = lh.primary_color || '#0d9488';
  const checklist = { ...lh.checklist, ...(checklistIn || {}) };
  const age = patient.age ?? ageFromDob(patient.dob || patient.date_of_birth);
  const patientId = patient.patient_id_display || patient.id_code || patient.id || '—';
  const patientName = patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(' ') || '—';
  const qrUrl = digitalRecordUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(digitalRecordUrl)}`
    : null;
  const barcodeUrl = patientId && patientId !== '—'
    ? `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(String(patientId))}&code=Code128&translate-esc=on&dpi=96`
    : null;

  const toggleCheck = (key) => {
    if (!onChecklistChange) return;
    onChecklistChange({ ...checklist, [key]: !checklist[key] });
  };

  const CHECK_ITEMS = [
    ['id_proof', 'ID Proof'],
    ['referral_letter', 'Referral Letter'],
    ['reports', 'Reports'],
    ['insurance', 'Insurance'],
    ['consent', 'Consent'],
  ];

  return (
    <div className={`af-chrome ${mode === 'print' ? 'af-chrome--print' : ''}`} style={{ ['--af-primary']: primary }}>
      <style>{AF_PRINT_CSS}</style>

      {/* ── HEADER (sticky) ── */}
      <header className="af-header">
        <div className="af-header-zones">
          {/* Zone 1 — Clinic */}
          <div className="af-zone af-zone-clinic">
            <div className="af-logo-row">
              {lh.logo_url ? (
                <img src={lh.logo_url} alt="" className="af-logo" />
              ) : (
                <span className="af-logo-fallback" style={{ background: primary }}>
                  {initials(lh.clinic_name)}
                </span>
              )}
              {(lh.accreditation_urls || []).slice(0, 2).map((url, i) => (
                <img key={i} src={url} alt="Accreditation" className="af-badge" />
              ))}
            </div>
            <p className="af-clinic-name">{lh.clinic_name || 'Clinic'}</p>
            {lh.tagline ? <p className="af-muted">{lh.tagline}</p> : null}
            {lh.branch_name ? <p className="af-muted">{lh.branch_name}</p> : null}
            {lh.address ? <p className="af-tiny">{lh.address}</p> : null}
            <p className="af-tiny">
              {[lh.phone, lh.whatsapp ? `WA ${lh.whatsapp}` : '', lh.email].filter(Boolean).join(' · ')}
            </p>
            {lh.website ? <p className="af-tiny">{lh.website}</p> : null}
            <p className="af-tiny">
              {[lh.registration_no && `Reg: ${lh.registration_no}`, lh.gstin && `GST: ${lh.gstin}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          {/* Zone 2 — Form */}
          <div className="af-zone af-zone-form">
            <p className="af-form-title">{lh.form_title}</p>
            <p className="af-subtitle">{lh.subtitle}</p>
            <p className="af-meta">
              {lh.form_code} · {lh.form_version}
            </p>
            <p className="af-tiny">Dept: {lh.department}</p>
            <p className="af-tiny">Language: {lh.language} · Rev: {lh.revision_date}</p>
          </div>

          {/* Zone 3 — Patient */}
          <div className="af-zone af-zone-patient">
            <div className="af-patient-top">
              {patient.photo_url ? (
                <img src={patient.photo_url} alt="" className="af-photo" />
              ) : (
                <span className="af-photo-fallback">{initials(patientName)}</span>
              )}
              <div className="min-w-0">
                <p className="af-patient-name">{patientName}</p>
                <p className="af-tiny">ID: {patientId}</p>
              </div>
            </div>
            <p className="af-tiny">
              DOB: {fmtDate(patient.dob || patient.date_of_birth)}
              {age != null ? ` (${age} yrs)` : ''} · {patient.gender || '—'}
              {patient.blood_group ? ` · BG: ${patient.blood_group}` : ''}
            </p>
            <p className="af-tiny">
              Visit: {visit.type || 'New'} · {visit.mode || 'Clinic'}
              {visit.number ? ` · Visit ${visit.number}` : ''}
            </p>
            <p className="af-tiny">Assessed: {fmtDate(visit.assessment_date || visit.date)}</p>
            {physio.name ? (
              <p className="af-tiny">
                Physio: {physio.name}
                {physio.qualification ? ` · ${physio.qualification}` : ''}
              </p>
            ) : null}
            {physio.referred_by ? <p className="af-tiny">Referred by: {physio.referred_by}</p> : null}
          </div>
        </div>

        {/* Quick reference strip */}
        <div className="af-quick-strip">
          Patient: <strong>{patientName}</strong>
          {' | '}ID: <strong>{patientId}</strong>
          {' | '}DOB: {fmtDate(patient.dob || patient.date_of_birth)}
          {age != null ? ` (${age} yrs)` : ''}
          {' | '}Physio: {physio.name || '—'}
          {' | '}Date: {fmtDate(visit.assessment_date || visit.date || new Date().toISOString())}
          {' | '}
          {visit.type || 'New'} · {visit.mode || 'Clinic'}
        </div>

        {/* Checklist */}
        <div className="af-checklist">
          {CHECK_ITEMS.map(([key, label]) => (
            <label key={key} className="af-check-item">
              <input
                type="checkbox"
                checked={!!checklist[key]}
                disabled={!onChecklistChange}
                onChange={() => toggleCheck(key)}
              />
              <span className={checklist[key] ? 'af-check-on' : ''}>{label}</span>
            </label>
          ))}
        </div>
      </header>

      <main className="af-body">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="af-footer">
        <div className="af-footer-zones">
          <div className="af-zone">
            <p className="af-foot-title">Clinician sign-off</p>
            <p className="af-line">Assessed by: {physio.name || '________________'}</p>
            <p className="af-line">Qualification: {physio.qualification || '________________'}</p>
            <p className="af-line">Reg No: {physio.registration_no || '________________'}</p>
            <p className="af-line">Specialization: {physio.specialization || '________________'}</p>
            <div className="af-sign-boxes">
              <div className="af-sign-box">
                <span>Signature</span>
                {physio.signature_url ? <img src={physio.signature_url} alt="" className="af-sign-img" /> : null}
              </div>
              <div className="af-sign-box af-stamp">
                <span>Stamp</span>
              </div>
            </div>
            <p className="af-line">Date: {fmtDate(visit.assessment_date) || '________'}</p>
          </div>

          <div className="af-zone">
            <p className="af-foot-title">Patient consent</p>
            <p className="af-consent-text">{lh.consent_text}</p>
            <p className="af-line">Patient/Guardian: ________________</p>
            <p className="af-line">Relationship: ________________</p>
            <div className="af-sign-box">
              <span>Signature</span>
            </div>
            <p className="af-line">Date: ________</p>
            <label className="af-check-item mt-1">
              <input type="checkbox" checked={!!checklist.consent} readOnly disabled />
              <span>I consent to treatment</span>
            </label>
          </div>

          <div className="af-zone">
            <p className="af-foot-title">Internal use only</p>
            <p className="af-line">Reviewed by: ________________</p>
            <p className="af-line">Approved by: ________________</p>
            <p className="af-line">File No: ________________</p>
            <p className="af-line">Episode No: ________________</p>
            <p className="af-line">Next review: ________________</p>
            <p className="af-line">Discharge date: ________________</p>
          </div>
        </div>

        <div className="af-bottom-strip">
          <div className="af-barcode">
            {barcodeUrl ? <img src={barcodeUrl} alt={`Barcode ${patientId}`} /> : <FaIcon icon="fa-barcode" className="text-xl text-slate-400" />}
          </div>
          <div className="af-page-meta">
            <p>
              Page {pageLabel} of {totalPages} | {lh.form_code} {lh.form_version} | Confidential
            </p>
            <p className="af-disclaimer">{lh.disclaimer}</p>
            <p className="af-copy">© {new Date().getFullYear()} The Urban Physio · {lh.website || 'theurbanphysio.com'} · DPDP Act 2023</p>
          </div>
          <div className="af-qr">
            {qrUrl ? (
              <>
                <img src={qrUrl} alt="Digital record QR" />
                <p>Scan to view digital record</p>
              </>
            ) : (
              <p className="af-tiny text-center text-slate-400">QR on publish</p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

const AF_PRINT_CSS = `
.af-chrome { --af-primary: #0d9488; background: #fff; color: #0f172a; font-family: 'Segoe UI', system-ui, sans-serif; }
.af-header { position: sticky; top: 0; z-index: 20; background: #fff; border-bottom: 3px solid var(--af-primary); box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.af-header-zones, .af-footer-zones { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 12px; padding: 12px 14px; }
.af-zone { min-width: 0; font-size: 11px; line-height: 1.35; }
.af-logo-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.af-logo { height: 42px; max-width: 90px; object-fit: contain; }
.af-logo-fallback { width: 42px; height: 42px; border-radius: 999px; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.af-badge { height: 22px; object-fit: contain; }
.af-clinic-name { font-weight: 700; font-size: 14px; color: var(--af-primary); }
.af-muted { color: #64748b; font-size: 10px; }
.af-tiny { color: #475569; font-size: 10px; margin-top: 1px; }
.af-form-title { font-size: 15px; font-weight: 800; text-align: center; letter-spacing: .02em; text-transform: uppercase; }
.af-subtitle { text-align: center; font-size: 12px; font-weight: 600; color: var(--af-primary); margin-top: 2px; }
.af-meta { text-align: center; font-size: 10px; color: #64748b; margin-top: 4px; }
.af-patient-top { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.af-photo, .af-photo-fallback { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; flex-shrink: 0; }
.af-photo-fallback { background: #e2e8f0; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; color: #475569; }
.af-patient-name { font-weight: 700; font-size: 13px; }
.af-quick-strip { background: #f1f5f9; padding: 6px 14px; font-size: 10px; color: #334155; border-top: 1px solid #e2e8f0; }
.af-checklist { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; padding: 6px 14px; border-top: 1px solid #e2e8f0; font-size: 10px; }
.af-check-item { display: inline-flex; align-items: center; gap: 4px; cursor: default; }
.af-check-on { font-weight: 600; color: var(--af-primary); }
.af-body { padding: 16px 14px; min-height: 120px; }
.af-footer { border-top: 2px solid var(--af-primary); margin-top: 16px; background: #fff; }
.af-foot-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--af-primary); margin-bottom: 6px; }
.af-line { font-size: 10px; margin: 3px 0; color: #334155; }
.af-consent-text { font-size: 10px; font-style: italic; color: #475569; margin-bottom: 8px; }
.af-sign-boxes { display: flex; gap: 8px; margin: 8px 0; }
.af-sign-box { flex: 1; min-height: 48px; border: 1px dashed #94a3b8; border-radius: 6px; padding: 4px 6px; font-size: 9px; color: #94a3b8; position: relative; }
.af-stamp { max-width: 72px; }
.af-sign-img { max-height: 40px; max-width: 100%; object-fit: contain; }
.af-bottom-strip { display: grid; grid-template-columns: 100px 1fr 100px; gap: 10px; align-items: center; padding: 10px 14px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
.af-barcode img { max-width: 100%; height: 36px; object-fit: contain; }
.af-qr { text-align: center; font-size: 8px; color: #64748b; }
.af-qr img { width: 72px; height: 72px; margin: 0 auto 2px; }
.af-page-meta { text-align: center; font-size: 9px; color: #475569; }
.af-disclaimer { font-style: italic; margin-top: 4px; font-size: 8px; color: #64748b; }
.af-copy { margin-top: 2px; font-size: 8px; color: #94a3b8; }

@media (max-width: 768px) {
  .af-header-zones, .af-footer-zones, .af-bottom-strip { grid-template-columns: 1fr; }
  .af-header { position: relative; }
}

@media print {
  @page { size: A4; margin: 12mm 10mm 18mm; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .site-header, .admin-sidebar, .admin-sidebar-backdrop, .portal-page-actions,
  .btn-primary, .btn-outline, .site-header-spacer, .help-fab, [data-print-hide] {
    display: none !important;
  }
  .af-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    box-shadow: none;
    border-bottom-width: 2px;
    background: #fff !important;
  }
  .af-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    break-inside: avoid;
    page-break-inside: avoid;
    background: #fff !important;
  }
  .af-body {
    padding: 8px 0;
    margin-top: 210px;
    margin-bottom: 220px;
  }
  .af-quick-strip { background: #f1f5f9 !important; }
  .af-sign-box:not(:has(img))::after {
    content: '________________';
    display: block;
    margin-top: 28px;
    color: #94a3b8;
  }
  .af-chrome { overflow: visible !important; }
}
`;
