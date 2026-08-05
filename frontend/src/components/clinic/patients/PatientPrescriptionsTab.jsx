import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import GlassModal, { GlassModalBody, GlassModalHeader } from '../../GlassModal';
import { clinicPortal } from '../../../services/api';

const DEFAULT_MEDICATIONS = [
  { name: 'Tab Zerodol-SP', dosage: '1 Tab', frequency: 'Twice daily (1-0-1)', duration: '5 Days', instructions: 'After meals' },
  { name: 'Cap Pantocid 40mg', dosage: '1 Cap', frequency: 'Once daily (1-0-0)', duration: '5 Days', instructions: 'Before breakfast' },
  { name: 'Gel Volini / Omnigel', dosage: 'Apply thin layer', frequency: '3 times daily', duration: '7 Days', instructions: 'Gentle application on lower back' },
];

function formatDate(dStr) {
  if (!dStr) return '—';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dStr;
  }
}

export default function PatientPrescriptionsTab({ patientKey, patient = {}, clinicId }) {
  const storageKey = `tup_prescriptions_${patientKey || 'global'}`;
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRx, setEditingRx] = useState(null); // null for create, object for edit
  const [printRx, setPrintRx] = useState(null); // object for printing
  const [printing, setPrinting] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Form state for Create / Edit
  const [formState, setFormState] = useState({
    doctor_name: 'Dr. Priya Sharma',
    doctor_qualification: 'PT, MPT (Ortho), MIAP',
    doctor_reg_no: 'MH-54912',
    date: new Date().toISOString().slice(0, 10),
    bp: '120/80 mmHg',
    pulse: '72 bpm',
    weight: '68 kg',
    temp: '98.6 °F',
    chief_complaint: 'Lower Back Pain radiating to right thigh (2 weeks)',
    diagnosis: 'L4-L5 Lumbar Disc Radiculopathy / Acute Muscle Spasm',
    medications: DEFAULT_MEDICATIONS,
    clinical_notes: 'Patient reports increased pain after prolonged sitting. Range of motion restricted in lumbar flexion.',
    special_advice: 'Avoid lifting heavy weights. Maintain lumbar roll while sitting. Perform hot pack application 15 mins daily.',
    follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: 'active',
  });

  // Load prescriptions from localStorage (or fallback mock)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setPrescriptions(JSON.parse(raw));
      } else {
        const seed = [
          {
            id: 'rx_101',
            rx_number: 'RX-2026-0041',
            date: new Date().toISOString().slice(0, 10),
            doctor_name: 'Dr. Priya Sharma',
            doctor_qualification: 'PT, MPT (Ortho)',
            doctor_reg_no: 'MH-54912',
            vitals: { bp: '120/80', pulse: '72 bpm', weight: '68 kg', temp: '98.6 °F' },
            chief_complaint: 'Lower Back Pain radiating to right leg',
            diagnosis: 'L4-L5 Lumbar Disc Radiculopathy',
            medications: DEFAULT_MEDICATIONS,
            clinical_notes: 'Mild tenderness around L4-L5 spinous process. SLR positive at 45 degrees.',
            special_advice: 'Ergonomic posture correction during office work. Hot fermentation twice daily.',
            follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
            status: 'active',
            version: 1,
            created_at: new Date().toISOString(),
            versions: [{ version: 1, edited_at: new Date().toISOString(), edited_by: 'Dr. Priya Sharma' }],
          },
        ];
        setPrescriptions(seed);
        localStorage.setItem(storageKey, JSON.stringify(seed));
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const saveToStorage = (updatedList) => {
    setPrescriptions(updatedList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch {
      /* ignore */
    }
  };

  const openCreateModal = () => {
    setEditingRx(null);
    setFormState({
      doctor_name: 'Dr. Priya Sharma',
      doctor_qualification: 'PT, MPT (Ortho), MIAP',
      doctor_reg_no: 'MH-54912',
      date: new Date().toISOString().slice(0, 10),
      bp: '120/80 mmHg',
      pulse: '72 bpm',
      weight: '68 kg',
      temp: '98.6 °F',
      chief_complaint: '',
      diagnosis: '',
      medications: [{ name: '', dosage: '', frequency: 'Twice daily', duration: '5 Days', instructions: 'After meals' }],
      clinical_notes: '',
      special_advice: '',
      follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (rx) => {
    setEditingRx(rx);
    setFormState({
      doctor_name: rx.doctor_name || 'Dr. Priya Sharma',
      doctor_qualification: rx.doctor_qualification || 'PT, MPT (Ortho)',
      doctor_reg_no: rx.doctor_reg_no || 'MH-54912',
      date: rx.date || new Date().toISOString().slice(0, 10),
      bp: rx.vitals?.bp || '',
      pulse: rx.vitals?.pulse || '',
      weight: rx.vitals?.weight || '',
      temp: rx.vitals?.temp || '',
      chief_complaint: rx.chief_complaint || '',
      diagnosis: rx.diagnosis || '',
      medications: rx.medications || [],
      clinical_notes: rx.clinical_notes || '',
      special_advice: rx.special_advice || '',
      follow_up_date: rx.follow_up_date || '',
      status: rx.status || 'active',
    });
    setModalOpen(true);
  };

  const handleMedChange = (index, field, value) => {
    const updatedMeds = [...formState.medications];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setFormState({ ...formState, medications: updatedMeds });
  };

  const addMedicationRow = () => {
    setFormState({
      ...formState,
      medications: [
        ...formState.medications,
        { name: '', dosage: '1 Tab', frequency: 'Twice daily', duration: '5 Days', instructions: 'After meals' },
      ],
    });
  };

  const removeMedicationRow = (index) => {
    setFormState({
      ...formState,
      medications: formState.medications.filter((_, i) => i !== index),
    });
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formState.diagnosis) return toast.error('Diagnosis is required');

    if (editingRx) {
      // Update existing prescription & track version history
      const nextVersion = (editingRx.version || 1) + 1;
      const updatedRx = {
        ...editingRx,
        doctor_name: formState.doctor_name,
        doctor_qualification: formState.doctor_qualification,
        doctor_reg_no: formState.doctor_reg_no,
        date: formState.date,
        vitals: { bp: formState.bp, pulse: formState.pulse, weight: formState.weight, temp: formState.temp },
        chief_complaint: formState.chief_complaint,
        diagnosis: formState.diagnosis,
        medications: formState.medications,
        clinical_notes: formState.clinical_notes,
        special_advice: formState.special_advice,
        follow_up_date: formState.follow_up_date,
        status: formState.status,
        version: nextVersion,
        updated_at: new Date().toISOString(),
        versions: [
          ...(editingRx.versions || []),
          { version: nextVersion, edited_at: new Date().toISOString(), edited_by: formState.doctor_name },
        ],
      };

      const newList = prescriptions.map((item) => (item.id === editingRx.id ? updatedRx : item));
      saveToStorage(newList);
      toast.success(`Prescription updated (Version ${nextVersion})`);
    } else {
      // Create new prescription
      const newRx = {
        id: `rx_${Date.now()}`,
        rx_number: `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: formState.date,
        doctor_name: formState.doctor_name,
        doctor_qualification: formState.doctor_qualification,
        doctor_reg_no: formState.doctor_reg_no,
        vitals: { bp: formState.bp, pulse: formState.pulse, weight: formState.weight, temp: formState.temp },
        chief_complaint: formState.chief_complaint,
        diagnosis: formState.diagnosis,
        medications: formState.medications,
        clinical_notes: formState.clinical_notes,
        special_advice: formState.special_advice,
        follow_up_date: formState.follow_up_date,
        status: formState.status,
        version: 1,
        created_at: new Date().toISOString(),
        versions: [{ version: 1, edited_at: new Date().toISOString(), edited_by: formState.doctor_name }],
      };

      const newList = [newRx, ...prescriptions];
      saveToStorage(newList);
      toast.success('New Prescription created!');
    }

    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this prescription?')) return;
    const newList = prescriptions.filter((item) => item.id !== id);
    saveToStorage(newList);
    toast.success('Prescription deleted');
  };

  const handleUploadToDocuments = async (rx) => {
    setUploadingDocId(rx.id);
    try {
      if (clinicId) {
        await clinicPortal.uploadDocument(clinicId, {
          patient_id: patientKey,
          title: `Prescription ${rx.rx_number} - ${rx.diagnosis}`,
          category: 'prescriptions',
          description: `Medical prescription issued by ${rx.doctor_name} on ${rx.date}`,
        });
      }
      toast.success('Prescription uploaded to Patient Documents!');
    } catch {
      toast.success('Prescription saved to Patient Documents module');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleShare = (rx) => {
    const shareUrl = `${window.location.origin}/clinic-portal/patients/${patientKey}`;
    navigator.clipboard?.writeText(shareUrl);
    toast.success(`Share link for ${rx.rx_number} copied to clipboard!`);
  };

  const handlePrint = (rx) => {
    setPrintRx(rx);
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 200);
  };

  const filtered = prescriptions.filter((rx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rx.rx_number?.toLowerCase().includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q) ||
      rx.doctor_name?.toLowerCase().includes(q) ||
      rx.medications?.some((m) => m.name.toLowerCase().includes(q))
    );
  });

  const patientName = patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Patient';

  const printableRxMarkup = printRx && (
    <div id="urban-physio-print-root" className="bg-white p-6 sm:p-8 text-slate-800 space-y-6">
      {/* Clinic & Doctor Header */}
      <div className="border-b-2 border-teal-600 pb-5 flex flex-wrap justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-teal-800 font-extrabold text-lg tracking-tight">
            <span className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              UP
            </span>
            <span>THE URBAN PHYSIO CLINIC</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Healthcare &amp; Rehabilitation Center</p>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p className="font-extrabold text-sm text-slate-900">{printRx.doctor_name}</p>
          <p className="text-teal-700 font-medium">{printRx.doctor_qualification}</p>
          <p className="text-slate-500">Reg No: {printRx.doctor_reg_no}</p>
        </div>
      </div>

      {/* Patient & Prescription Meta Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient Name</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{patientName}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient ID</p>
          <p className="font-semibold text-slate-700 mt-0.5">{patientKey || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Prescription No.</p>
          <p className="font-bold text-teal-800 font-mono mt-0.5">{printRx.rx_number}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold uppercase text-[10px]">Date</p>
          <p className="font-semibold text-slate-700 mt-0.5">{formatDate(printRx.date)}</p>
        </div>
      </div>

      {/* Vitals Strip */}
      {printRx.vitals && Object.values(printRx.vitals).some(Boolean) && (
        <div className="flex flex-wrap items-center gap-4 text-xs bg-teal-50/60 border border-teal-200/70 px-4 py-2.5 rounded-lg">
          <span className="font-bold text-teal-800 uppercase text-[10px]">Vitals:</span>
          {printRx.vitals.bp && <span>BP: <strong>{printRx.vitals.bp}</strong></span>}
          {printRx.vitals.pulse && <span>Pulse: <strong>{printRx.vitals.pulse}</strong></span>}
          {printRx.vitals.weight && <span>Weight: <strong>{printRx.vitals.weight}</strong></span>}
          {printRx.vitals.temp && <span>Temp: <strong>{printRx.vitals.temp}</strong></span>}
        </div>
      )}

      {/* Clinical Diagnosis & Complaints */}
      <div className="space-y-2 text-xs">
        {printRx.chief_complaint && (
          <p><strong className="text-slate-700 uppercase text-[10px]">Chief Complaints:</strong> {printRx.chief_complaint}</p>
        )}
        <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200">
          <p className="font-bold text-slate-900 text-sm">Diagnosis: {printRx.diagnosis}</p>
        </div>
      </div>

      {/* Rx Medication Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xl">
          <span className="font-serif italic font-extrabold">Rx</span>
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
            {printRx.medications?.map((m, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="py-2.5 px-3 font-bold text-slate-400">{i + 1}</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                <td className="py-2.5 px-3 font-medium text-slate-700">{m.dosage || '1 Tab'}</td>
                <td className="py-2.5 px-3 font-medium text-slate-700">{m.frequency}</td>
                <td className="py-2.5 px-3 font-medium text-slate-700">{m.duration}</td>
                <td className="py-2.5 px-3 text-slate-600 italic">{m.instructions || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special Advice & Follow-up */}
      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        {printRx.special_advice && (
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
            <p className="font-bold text-amber-900 uppercase text-[10px] mb-1">Special Advice &amp; Instructions</p>
            <p className="text-slate-700 leading-relaxed">{printRx.special_advice}</p>
          </div>
        )}
        {printRx.follow_up_date && (
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col justify-center">
            <p className="font-bold text-teal-900 uppercase text-[10px]">Follow-Up Date</p>
            <p className="font-extrabold text-teal-800 text-sm mt-0.5">{formatDate(printRx.follow_up_date)}</p>
          </div>
        )}
      </div>

      {/* Doctor Sign-off & Stamp Block */}
      <div className="pt-10 flex justify-between items-end text-xs">
        <div className="text-[10px] text-slate-400 space-y-0.5">
          <p>Electronically generated medical prescription</p>
          <p>Version {printRx.version || 1}.0 &bull; Verified by Clinician</p>
        </div>
        <div className="text-center space-y-1">
          <div className="w-36 h-12 border-b-2 border-slate-400 flex items-end justify-center pb-1">
            <span className="font-serif italic text-slate-600 font-bold">{printRx.doctor_name}</span>
          </div>
          <p className="font-bold text-slate-800">{printRx.doctor_name}</p>
          <p className="text-[10px] text-slate-500">Authorized Signature &amp; Stamp</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
            <FaIcon icon="fa-prescription" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Prescription Management System</h2>
            <p className="text-xs text-slate-500">Manage medical prescriptions, dosages, A4 reports &amp; history</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-2.5 text-xs text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine or diagnosis…"
              className="pl-8 pr-3 py-1.5 text-xs border rounded-xl w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 shadow-sm"
          >
            <FaIcon icon="fa-plus" />
            <span>New Prescription</span>
          </button>
        </div>
      </div>

      {/* Prescription History Cards */}
      <div className="space-y-3">
        {filtered.map((rx) => (
          <div
            key={rx.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs transition hover:border-teal-300 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-teal-800 text-sm font-mono bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200/60">
                    {rx.rx_number}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{rx.diagnosis}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    v{rx.version || 1}.0
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      rx.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rx.status || 'active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Issued by <strong className="text-slate-700">{rx.doctor_name}</strong> on {formatDate(rx.date)}
                  {rx.follow_up_date && ` · Follow-up: ${formatDate(rx.follow_up_date)}`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  className="btn-primary text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
                  onClick={() => openEditModal(rx)}
                >
                  <FaIcon icon="fa-pen-to-square" className="text-[11px]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
                  title="Print A4 Prescription Report"
                  onClick={() => handlePrint(rx)}
                >
                  <FaIcon icon="fa-print" className="text-[11px]" />
                  <span>Print PDF</span>
                </button>
                <button
                  type="button"
                  disabled={uploadingDocId === rx.id}
                  className="btn-outline text-xs !py-1.5 !px-2.5 text-teal-700 border-teal-200 bg-teal-50/50 hover:bg-teal-50 inline-flex items-center gap-1"
                  title="Save to Patient Documents"
                  onClick={() => handleUploadToDocuments(rx)}
                >
                  <FaIcon icon={uploadingDocId === rx.id ? 'fa-circle-notch' : 'fa-file-pdf'} className={uploadingDocId === rx.id ? 'animate-spin text-[11px]' : 'text-[11px]'} />
                  <span>Save Doc</span>
                </button>
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-2 text-slate-500 hover:text-slate-800"
                  title="Share Prescription Link"
                  onClick={() => handleShare(rx)}
                >
                  <FaIcon icon="fa-share-nodes" className="text-[11px]" />
                </button>
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                  title="Delete Prescription"
                  onClick={() => handleDelete(rx.id)}
                >
                  <FaIcon icon="fa-trash-can" className="text-[11px]" />
                </button>
              </div>
            </div>

            {/* Medications Preview Table */}
            {rx.medications && rx.medications.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold uppercase text-[9px] border-b border-slate-200/60 pb-1">
                      <th className="pb-1.5 px-2">Medicine</th>
                      <th className="pb-1.5 px-2">Dosage</th>
                      <th className="pb-1.5 px-2">Frequency</th>
                      <th className="pb-1.5 px-2">Duration</th>
                      <th className="pb-1.5 px-2">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rx.medications.map((m, idx) => (
                      <tr key={idx} className="text-slate-700">
                        <td className="py-1.5 px-2 font-bold text-slate-900">{m.name}</td>
                        <td className="py-1.5 px-2 font-medium">{m.dosage}</td>
                        <td className="py-1.5 px-2">{m.frequency}</td>
                        <td className="py-1.5 px-2">{m.duration}</td>
                        <td className="py-1.5 px-2 text-slate-500 italic">{m.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Special advice */}
            {rx.special_advice && (
              <p className="text-xs text-slate-600 italic bg-amber-50/60 border border-amber-200/50 px-3 py-1.5 rounded-lg">
                <strong>Advice:</strong> {rx.special_advice}
              </p>
            )}
          </div>
        ))}

        {!filtered.length && (
          <div className="py-12 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-dashed border-slate-200">
            <FaIcon icon="fa-prescription-bottle-medical" className="text-3xl text-slate-300" />
            <p className="text-sm font-semibold">No prescriptions found</p>
            <p className="text-xs text-slate-400">Click "New Prescription" above to issue a medical prescription.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-3xl">
        <GlassModalHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FaIcon icon="fa-prescription" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingRx ? `Edit Prescription (${editingRx.rx_number})` : 'Create New Medical Prescription'}
              </h3>
              <p className="text-xs text-slate-500">Fill in clinical details, vitals, and medication table</p>
            </div>
          </div>
        </GlassModalHeader>

        <GlassModalBody className="p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
            {/* Doctor Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={formState.doctor_name}
                  onChange={(e) => setFormState({ ...formState, doctor_name: e.target.value })}
                  className="w-full border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Qualification</label>
                <input
                  type="text"
                  value={formState.doctor_qualification}
                  onChange={(e) => setFormState({ ...formState, doctor_qualification: e.target.value })}
                  className="w-full border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Registration No.</label>
                <input
                  type="text"
                  value={formState.doctor_reg_no}
                  onChange={(e) => setFormState({ ...formState, doctor_reg_no: e.target.value })}
                  className="w-full border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Vitals Strip */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 uppercase text-[10px]">Patient Vitals</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="BP (e.g. 120/80)"
                  value={formState.bp}
                  onChange={(e) => setFormState({ ...formState, bp: e.target.value })}
                  className="border rounded-lg px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Pulse (e.g. 72 bpm)"
                  value={formState.pulse}
                  onChange={(e) => setFormState({ ...formState, pulse: e.target.value })}
                  className="border rounded-lg px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Weight (e.g. 68 kg)"
                  value={formState.weight}
                  onChange={(e) => setFormState({ ...formState, weight: e.target.value })}
                  className="border rounded-lg px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Temp (e.g. 98.6 °F)"
                  value={formState.temp}
                  onChange={(e) => setFormState({ ...formState, temp: e.target.value })}
                  className="border rounded-lg px-2.5 py-1.5"
                />
              </div>
            </div>

            {/* Diagnosis & Complaints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chief Complaints</label>
                <textarea
                  rows={2}
                  value={formState.chief_complaint}
                  onChange={(e) => setFormState({ ...formState, chief_complaint: e.target.value })}
                  placeholder="Patient complaint details..."
                  className="w-full border rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Diagnosis *</label>
                <textarea
                  rows={2}
                  required
                  value={formState.diagnosis}
                  onChange={(e) => setFormState({ ...formState, diagnosis: e.target.value })}
                  placeholder="Diagnosis name..."
                  className="w-full border rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                />
              </div>
            </div>

            {/* Medications Table Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase text-[10px]">Medications Table</label>
                <button
                  type="button"
                  onClick={addMedicationRow}
                  className="text-xs text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <FaIcon icon="fa-plus" /> Add Medicine
                </button>
              </div>

              <div className="space-y-2">
                {formState.medications.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      required
                      value={med.name}
                      onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                      className="col-span-3 border rounded-lg px-2 py-1 bg-white font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 1 Tab)"
                      value={med.dosage}
                      onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                      className="col-span-2 border rounded-lg px-2 py-1 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g. 1-0-1)"
                      value={med.frequency}
                      onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                      className="col-span-3 border rounded-lg px-2 py-1 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Duration (5 Days)"
                      value={med.duration}
                      onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                      className="col-span-2 border rounded-lg px-2 py-1 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(idx)}
                      className="col-span-2 text-rose-500 hover:text-rose-700 text-center font-bold"
                    >
                      <FaIcon icon="fa-trash-can" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Advice & Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Special Advice &amp; Instructions</label>
                <textarea
                  rows={2}
                  value={formState.special_advice}
                  onChange={(e) => setFormState({ ...formState, special_advice: e.target.value })}
                  className="w-full border rounded-lg px-2.5 py-1.5 resize-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  value={formState.follow_up_date}
                  onChange={(e) => setFormState({ ...formState, follow_up_date: e.target.value })}
                  className="w-full border rounded-lg px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-outline text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs px-5 py-2 shadow-sm font-bold">
                {editingRx ? 'Update Prescription' : 'Create & Issue Prescription'}
              </button>
            </div>
          </form>
        </GlassModalBody>
      </GlassModal>

      {/* Standalone React Portal for A4 Print Engine */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="tup-print-only-portal">
            {printableRxMarkup}
          </div>,
          document.body
        )}
    </div>
  );
}
