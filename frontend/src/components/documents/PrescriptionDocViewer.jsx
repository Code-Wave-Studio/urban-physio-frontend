import { useEffect, useState } from 'react';
import FaIcon from '../FaIcon';

function formatDate(dStr) {
  if (!dStr) return '—';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dStr);
  }
}

/**
 * Pure printable A4 Prescription Sheet markup
 */
export function PrescriptionA4Sheet({ rx, patientName = '', patientKey = '' }) {
  if (!rx) return null;

  return (
    <div
      id="urban-physio-print-root"
      className="bg-white text-slate-800 p-6 sm:p-10 shadow-2xl rounded-sm border border-slate-200 w-full max-w-[210mm] mx-auto space-y-6 text-left"
      style={{ minHeight: '297mm', boxSizing: 'border-box' }}
    >
      {/* Official Clinic & Doctor Letterhead */}
      <div className="border-b-2 border-teal-600 pb-5 flex flex-wrap justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-teal-800 font-extrabold text-xl tracking-tight">
            <span className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-base font-bold shadow-sm">
              UP
            </span>
            <span>THE URBAN PHYSIO CLINIC</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Healthcare &amp; Rehabilitation Center</p>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p className="font-extrabold text-sm text-slate-900">{rx.doctor_name || 'Dr. Priya Sharma'}</p>
          <p className="text-teal-700 font-medium">{rx.doctor_qualification || 'PT, MPT (Ortho), MIAP'}</p>
          <p className="text-slate-500 font-mono">Reg No: {rx.doctor_reg_no || 'MH-54912'}</p>
        </div>
      </div>

      {/* Patient & Prescription Meta Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {patientName && (
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient Name</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{patientName}</p>
          </div>
        )}
        <div>
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient ID</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{patientKey || rx.patient_key || 'p-13'}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Prescription No.</p>
          <p className="font-bold text-teal-800 font-mono mt-0.5">{rx.rx_number || 'RX-2026-0041'}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Date</p>
          <p className="font-semibold text-slate-700 mt-0.5">{formatDate(rx.date)}</p>
        </div>
      </div>

      {/* Vitals Strip */}
      {rx.vitals && Object.values(rx.vitals).some(Boolean) && (
        <div className="flex flex-wrap items-center gap-4 text-xs bg-teal-50/60 border border-teal-200/70 px-4 py-2.5 rounded-lg">
          <span className="font-bold text-teal-800 uppercase text-[10px]">Vitals:</span>
          {rx.vitals.bp && <span>BP: <strong>{rx.vitals.bp}</strong></span>}
          {rx.vitals.pulse && <span>Pulse: <strong>{rx.vitals.pulse}</strong></span>}
          {rx.vitals.weight && <span>Weight: <strong>{rx.vitals.weight}</strong></span>}
          {rx.vitals.temp && <span>Temp: <strong>{rx.vitals.temp}</strong></span>}
        </div>
      )}

      {/* Clinical Diagnosis & Complaints */}
      <div className="space-y-2 text-xs">
        {rx.chief_complaint && (
          <p><strong className="text-slate-700 uppercase text-[10px]">Chief Complaints:</strong> {rx.chief_complaint}</p>
        )}
        {rx.diagnosis && (
          <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200">
            <p className="font-bold text-slate-900 text-sm">Diagnosis: {rx.diagnosis}</p>
          </div>
        )}
      </div>

      {/* Rx Medication Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xl">
          <span className="font-serif italic font-extrabold text-2xl">Rx</span>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Medications &amp; Dosage</span>
        </div>
        <table className="w-full text-left text-xs border-collapse rounded-xl border border-slate-200 overflow-hidden">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold uppercase text-[10px]">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Medicine Name</th>
              <th className="py-2.5 px-3">Dosage</th>
              <th className="py-2.5 px-3">Frequency</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Instructions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rx.medications || []).length > 0 ? (
              rx.medications.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-2.5 px-3 font-bold text-slate-400">{i + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{m.dosage || '1 Tab'}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{m.frequency}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{m.duration}</td>
                  <td className="py-2.5 px-3 text-slate-600 italic">{m.instructions || '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400 italic">No medications listed</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Special Advice & Follow-up */}
      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        {rx.special_advice && (
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
            <p className="font-bold text-amber-900 uppercase text-[10px] mb-1">Special Advice &amp; Instructions</p>
            <p className="text-slate-700 leading-relaxed">{rx.special_advice}</p>
          </div>
        )}
        {rx.follow_up_date && (
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col justify-center">
            <p className="font-bold text-teal-900 uppercase text-[10px]">Follow-Up Date</p>
            <p className="font-extrabold text-teal-800 text-sm mt-0.5">{formatDate(rx.follow_up_date)}</p>
          </div>
        )}
      </div>

      {/* Doctor Sign-off & Physical Stamp Box */}
      <div className="pt-8 flex justify-between items-end text-xs border-t border-slate-200 mt-8">
        <div className="text-[10px] text-slate-500 space-y-1 max-w-[280px]">
          <p className="font-bold text-slate-700 uppercase tracking-wide">Notice:</p>
          <p>This is an official medical prescription document issued by The Urban Physio Clinic. Valid when physically signed &amp; stamped by the attending clinician.</p>
          <p className="text-slate-400 font-mono">Prescription ID: {rx.rx_number || 'RX-2026-0041'} &bull; v{rx.version || 1}.0</p>
        </div>
        <div>
          <div className="w-56 h-24 border border-slate-300 rounded-lg bg-slate-50/30 flex items-center justify-center p-3 text-center">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Doctor's Signature &amp; Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Clean, Distraction-Free Prescription Document Preview
 */
export default function PrescriptionDocViewer({ doc, rx: rxProp, rxNumber: rxNumProp, patientKey: patientKeyProp }) {
  const [rx, setRx] = useState(rxProp || null);
  const [patientKey, setPatientKey] = useState(patientKeyProp || doc?.patient_key || 'p-13');
  const [patientName, setPatientName] = useState(doc?.patient_name || '');
  const [loading, setLoading] = useState(!rxProp);

  useEffect(() => {
    if (rxProp) {
      setRx(rxProp);
      setLoading(false);
      return;
    }

    // Resolve rxNumber & patientKey from doc or props
    let targetRxNum = rxNumProp;
    let targetPatientKey = patientKeyProp || doc?.patient_key || doc?.patient_id || 'p-13';

    if (!targetRxNum && doc) {
      if (doc.rx_number) {
        targetRxNum = doc.rx_number;
      } else {
        const fileUrl = typeof doc.file_url === 'string' ? doc.file_url : '';
        const linkUrl = typeof doc.link_url === 'string' ? doc.link_url : '';
        const urlStr = fileUrl || linkUrl;
        if (urlStr) {
          try {
            const u = new URL(urlStr, window.location.origin);
            targetRxNum = u.searchParams.get('rx');
            const p = u.searchParams.get('patient');
            if (p) targetPatientKey = p;
          } catch {
            /* ignore */
          }
        }
        if (!targetRxNum && doc.title) {
          const match = doc.title.match(/RX-\d{4}-\d+/i);
          if (match) targetRxNum = match[0];
        }
      }
    }

    if (!targetRxNum) targetRxNum = 'RX-2026-0041';
    setPatientKey(targetPatientKey);

    // Try finding in localStorage
    try {
      // 1. Direct patient key lookup
      const storageKey = `tup_prescriptions_${targetPatientKey}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw);
        const match = list.find((item) => item.rx_number === targetRxNum || item.id === targetRxNum);
        if (match) {
          setRx(match);
          setLoading(false);
          return;
        }
      }

      // 2. Global search across all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tup_prescriptions_')) {
          const rawItem = localStorage.getItem(k);
          if (rawItem) {
            const list = JSON.parse(rawItem);
            const match = list.find((item) => item.rx_number === targetRxNum || item.id === targetRxNum);
            if (match) {
              setRx(match);
              setLoading(false);
              return;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }

    // Fallback default prescription
    setRx({
      id: 'rx_101',
      rx_number: targetRxNum,
      date: doc?.created_at ? doc.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      doctor_name: doc?.doctor_name || 'Dr. Priya Sharma',
      doctor_qualification: 'PT, MPT (Ortho), MIAP',
      doctor_reg_no: 'MH-54912',
      vitals: { bp: '120/80 mmHg', pulse: '72 bpm', weight: '68 kg', temp: '98.6 °F' },
      chief_complaint: 'Lower Back Pain radiating to right leg (2 weeks)',
      diagnosis: doc?.title ? doc.title.replace(/^Prescription\s*\w*\s*-\s*/i, '') : 'L4-L5 Lumbar Disc Radiculopathy',
      medications: [
        { name: 'Tab Zerodol-SP', dosage: '1 Tab', frequency: 'Twice daily (1-0-1)', duration: '5 Days', instructions: 'After meals' },
        { name: 'Cap Pantocid 40mg', dosage: '1 Cap', frequency: 'Once daily (1-0-0)', duration: '5 Days', instructions: 'Before breakfast' },
        { name: 'Gel Volini / Omnigel', dosage: 'Apply thin layer', frequency: '3 times daily', duration: '7 Days', instructions: 'Gentle application on lower back' },
      ],
      special_advice: 'Avoid lifting heavy weights. Maintain lumbar roll while sitting. Perform hot pack application 15 mins daily.',
      follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      version: doc?.version || 1,
    });
    setLoading(false);
  }, [doc, rxProp, rxNumProp, patientKeyProp]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-medium text-sm gap-2">
        <FaIcon icon="fa-spinner" className="fa-spin text-teal-600 text-lg" />
        <span>Loading Prescription Document…</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] overflow-auto bg-slate-900/90 p-4 sm:p-8 flex justify-center items-start rounded-2xl shadow-2xl">
      <div className="w-full flex justify-center">
        <PrescriptionA4Sheet rx={rx} patientName={patientName} patientKey={patientKey} />
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #urban-physio-print-root {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            transform: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 15mm 10mm;
          }
        }
      `}</style>
    </div>
  );
}
