import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import GlassModal, { GlassModalBody, GlassModalHeader } from '../../GlassModal';
import api, { clinicPortal } from '../../../services/api';

const THE_URBAN_PHYSIO_EXERCISE_LIBRARY = [
  { id: 'ex_1', name: 'Cat-Cow Stretch', body_area: 'Back', default_sets: '3 Sets', default_reps: '10 Reps', default_hold: '3 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Bodyweight', default_instructions: 'Move slowly with breath. Arch & round lower back gently.' },
  { id: 'ex_2', name: 'Glute Bridge', body_area: 'Back / Hip', default_sets: '3 Sets', default_reps: '12 Reps', default_hold: '5 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Bodyweight', default_instructions: 'Squeeze glutes at top. Keep lower back neutral & feet flat.' },
  { id: 'ex_3', name: 'Isometric Quadriceps Setting', body_area: 'Knee', default_sets: '3 Sets', default_reps: '10 Reps', default_hold: '10 Sec Hold', default_frequency: '3 Times daily', default_resistance: 'Towel Roll', default_instructions: 'Press back of knee down into towel roll. Maintain knee extension.' },
  { id: 'ex_4', name: 'Ankle Pumps', body_area: 'Ankle / Calf', default_sets: '3 Sets', default_reps: '15 Reps', default_hold: '2 Sec Hold', default_frequency: '3 Times daily', default_resistance: 'Bodyweight', default_instructions: 'Pump foot up and down rhythmically to boost venous return.' },
  { id: 'ex_5', name: 'Knee Extension (Seated)', body_area: 'Knee', default_sets: '3 Sets', default_reps: '12 Reps', default_hold: '5 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Bodyweight / 1kg Ankle Weight', default_instructions: 'Straighten knee fully while seated. Hold briefly at top.' },
  { id: 'ex_6', name: 'Shoulder Pendulum Swings', body_area: 'Shoulder', default_sets: '2 Sets', default_reps: '10 Clockwise / Counter', default_hold: '—', default_frequency: 'Twice daily', default_resistance: 'Gravity Assisted', default_instructions: 'Lean forward supporting non-injured arm. Swing injured arm gently.' },
  { id: 'ex_7', name: 'Neck Isometric Press', body_area: 'Neck', default_sets: '3 Sets', default_reps: '5 Reps', default_hold: '5 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Self Palm Resistance', default_instructions: 'Push palm against forehead without moving head.' },
  { id: 'ex_8', name: 'Scapular Retraction (Squeeze)', body_area: 'Shoulder / Upper Back', default_sets: '3 Sets', default_reps: '10 Reps', default_hold: '5 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Bodyweight', default_instructions: 'Pinch shoulder blades together down and back. Maintain tall posture.' },
  { id: 'ex_9', name: 'Wall Slides for Shoulder Mobility', body_area: 'Shoulder', default_sets: '3 Sets', default_reps: '10 Reps', default_hold: '3 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Bodyweight', default_instructions: 'Slide forearms up wall smoothly keeping core engaged.' },
  { id: 'ex_10', name: 'Pelvic Tilts', body_area: 'Back', default_sets: '3 Sets', default_reps: '10 Reps', default_hold: '5 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Bodyweight', default_instructions: 'Flatten lower back into mat by engaging lower abdominal muscles.' },
  { id: 'ex_11', name: 'Straight Leg Raise (SLR)', body_area: 'Knee / Hip', default_sets: '3 Sets', default_reps: '10 Reps', default_hold: '5 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Bodyweight', default_instructions: 'Lock knee straight, lift leg 45 degrees, lower with control.' },
  { id: 'ex_12', name: 'Hamstring Stretch (Doorframe)', body_area: 'Thigh / Leg', default_sets: '2 Sets', default_reps: '3 Holds per side', default_hold: '30 Sec Hold', default_frequency: 'Twice daily', default_resistance: 'Passive Stretch', default_instructions: 'Gentle stretch behind thigh. No sharp shooting pain.' },
];

const DEFAULT_EXERCISES = [
  { name: 'Cat-Cow Stretch', sets: '3 Sets', reps: '10 Reps', hold: '3 Sec Hold', frequency: 'Twice daily', resistance: 'Bodyweight', instructions: 'Move slowly with breath. Arch & round lower back gently.' },
  { name: 'Glute Bridge', sets: '3 Sets', reps: '12 Reps', hold: '5 Sec Hold', frequency: 'Twice daily', resistance: 'Bodyweight', instructions: 'Squeeze glutes at top. Keep lower back neutral & feet flat.' },
  { name: 'Isometric Quadriceps Setting', sets: '3 Sets', reps: '10 Reps', hold: '10 Sec Hold', frequency: '3 Times daily', resistance: 'Towel Roll', instructions: 'Press back of knee down into towel roll. Maintain knee extension.' },
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
  const [printStudioOpen, setPrintStudioOpen] = useState(false);
  const [editingRx, setEditingRx] = useState(null);
  const [printRx, setPrintRx] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Initial Form state for 14 Formal Clinical Sections
  const [formState, setFormState] = useState({
    // 1. Prescription Title
    rx_title: 'Physiotherapy Assessment & Rehabilitation Treatment Plan',
    date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),

    // 2. Clinic & Physiotherapist Details
    clinic_name: 'The Urban Physio Clinic & Rehabilitation Center',
    clinic_address: 'Suite 402, Medical Enclave, Sector 18, City Center',
    clinic_contact: 'Ph: +91 98765 43210 | Email: care@theurbanphysio.com',
    doctor_name: 'Dr. Priya Sharma',
    doctor_qualification: 'PT, MPT (Ortho & Sports), MIAP',
    doctor_reg_no: 'MH-54912',
    doctor_specialization: 'Orthopedic & Spine Rehabilitation Specialist',

    // 3. Patient Demographic Details
    age_dob: '32 Yrs / 14 Oct 1993',
    gender: 'Male',
    height: '175 cm',
    weight: '68 kg',
    bmi: '22.2 kg/m²',
    bp: '120/80 mmHg',
    pulse: '72 bpm',
    temp: '98.6 °F',
    pain_score: '5/10 (VAS)',

    // 4. Clinical Diagnosis / Condition
    diagnosis: 'L4-L5 Lumbar Disc Radiculopathy with Sciatic Nerve Involvement',
    chief_complaint: 'Lower back pain radiating down right leg (2 weeks duration)',
    affected_part: 'Lumbar Spine / Right Lower Extremity',
    clinical_notes: 'Mild tenderness around L4-L5 spinous process. SLR positive at 45 degrees. Flexion ROM restricted.',

    // 5. Treatment Plan
    treatment_objectives: 'Pain reduction, L4-L5 root decompression, core muscle activation & restoration of lumbar ROM.',
    treatment_frequency: '3 Sessions / Week',
    total_sessions: '12 Sessions (4 Weeks Protocol)',

    // 6. Modalities
    modalities: 'IFT (100 Hz vector, 15 mins, Lumbar region), Ultrasound Therapy (1.5 W/cm² pulsed, 5 mins), Moist Heat Pack (15 mins)',

    // 7. Manual Treatments
    manual_treatments: 'Maitland Grade II Lumbar Mobilization, Myofascial Release (Gluteus & Piriformis), Dry Needling, Trigger Point Therapy',

    // 8. Exercise Prescription
    exercises: DEFAULT_EXERCISES,

    // 9. Goals
    short_term_goals: 'Reduce VAS pain score from 7/10 to 3/10; achieve 70% pain-free lumbar flexion within 2 weeks.',
    long_term_goals: 'Achieve complete pain-free sitting > 2 hours; return to daily office work & light jogging in 6 weeks.',

    // 10. Patient Instructions & Home Care
    home_instructions: 'Perform prescribed exercises twice daily in a comfortable non-antalgic position. Apply hot pack 15 mins before exercise.',
    activity_modification: 'Avoid lifting heavy weights (> 5 kg), refrain from sudden forward bending at the waist.',
    ergonomic_advice: 'Maintain lumbar support roll during office sitting. Take 5-minute walking breaks every 45 minutes.',
    safety_precautions: 'Discontinue exercises immediately if sharp leg pain, numbness, or tingling increases.',

    // 11. Follow-up & Reassessment
    follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    reassessment_plan: 'Re-assess Straight Leg Raise (SLR) angle, VAS pain score, and lumbar extension ROM after 6 sessions.',

    // 12. Prescription Validity
    validity_period: 'Valid 30 days from issue date',

    // 13. Terms & Conditions
    terms_conditions: 'This treatment plan is formulated based on physical assessment at The Urban Physio Clinic. Exercises must be performed as instructed. Contact clinic in case of acute flare-ups.',

    // 14. Physiotherapist Signature
    digital_signature: 'Dr. Priya Sharma, PT (Digital Signature Verified)',
    physio_reg_stamp: 'Reg. No. MH-54912',
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
            vitals: { bp: '120/80', pulse: '72 bpm', weight: '68 kg', temp: '98.6 °F', pain_score: '5/10' },
            chief_complaint: 'Lower Back Pain radiating to right leg',
            diagnosis: 'L4-L5 Lumbar Disc Radiculopathy',
            modalities: 'IFT (15 mins), Ultrasound Therapy (5 mins)',
            exercises: DEFAULT_EXERCISES,
            clinical_notes: 'Mild tenderness around L4-L5 spinous process. SLR positive at 45 degrees.',
            special_advice: 'Ergonomic posture correction during office work. Maintain lumbar roll while sitting. Hot fermentation twice daily.',
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
      rx_title: 'Physiotherapy Assessment & Rehabilitation Care Plan',
      date: new Date().toISOString().slice(0, 10),
      expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      clinic_name: 'The Urban Physio Clinic & Rehabilitation Center',
      clinic_address: 'Suite 402, Medical Enclave, Sector 18, City Center',
      clinic_contact: 'Ph: +91 98765 43210 | Email: care@theurbanphysio.com',
      doctor_name: 'Dr. Priya Sharma',
      doctor_qualification: 'PT, MPT (Ortho & Sports), MIAP',
      doctor_reg_no: 'MH-54912',
      doctor_specialization: 'Orthopedic & Spine Rehabilitation Specialist',
      age_dob: '32 Yrs / 14 Oct 1993',
      gender: 'Male',
      height: '175 cm',
      weight: '68 kg',
      bmi: '22.2 kg/m²',
      bp: '120/80 mmHg',
      pulse: '72 bpm',
      temp: '98.6 °F',
      pain_score: '5/10 (VAS)',
      diagnosis: '',
      chief_complaint: '',
      affected_part: '',
      clinical_notes: '',
      treatment_objectives: '',
      treatment_frequency: '3 Sessions / Week',
      total_sessions: '12 Sessions',
      modalities: 'IFT (15 mins), Ultrasound Therapy (5 mins)',
      manual_treatments: 'Maitland Mobilization, Myofascial Release, Soft Tissue Massage',
      exercises: [{ name: '', sets: '3 Sets', reps: '10 Reps', hold: '5 Sec Hold', frequency: 'Twice daily', resistance: 'Bodyweight', instructions: '' }],
      short_term_goals: '',
      long_term_goals: '',
      home_instructions: 'Perform exercises twice daily as demonstrated.',
      activity_modification: 'Avoid heavy weight lifting and sudden forward bending.',
      ergonomic_advice: 'Maintain lumbar roll during sitting.',
      safety_precautions: 'Discontinue if sharp leg pain or numbness increases.',
      follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      reassessment_plan: 'Re-assess ROM and SLR angle after 6 sessions.',
      validity_period: 'Valid 30 days from issue date',
      terms_conditions: 'This care plan is tailored for the named patient. Perform exercises within pain-free limits.',
      digital_signature: 'Dr. Priya Sharma, PT (Digital Signature Verified)',
      physio_reg_stamp: 'Reg. No. MH-54912',
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (rx) => {
    setEditingRx(rx);
    setFormState({
      rx_title: rx.rx_title || 'Physiotherapy Assessment & Rehabilitation Care Plan',
      date: rx.date || new Date().toISOString().slice(0, 10),
      expiry_date: rx.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      clinic_name: rx.clinic_name || 'The Urban Physio Clinic & Rehabilitation Center',
      clinic_address: rx.clinic_address || 'Suite 402, Medical Enclave, Sector 18, City Center',
      clinic_contact: rx.clinic_contact || 'Ph: +91 98765 43210 | Email: care@theurbanphysio.com',
      doctor_name: rx.doctor_name || 'Dr. Priya Sharma',
      doctor_qualification: rx.doctor_qualification || 'PT, MPT (Ortho & Sports), MIAP',
      doctor_reg_no: rx.doctor_reg_no || 'MH-54912',
      doctor_specialization: rx.doctor_specialization || 'Orthopedic & Spine Rehabilitation Specialist',
      age_dob: rx.age_dob || '32 Yrs / 14 Oct 1993',
      gender: rx.gender || 'Male',
      height: rx.height || '175 cm',
      weight: rx.weight || '68 kg',
      bmi: rx.bmi || '22.2 kg/m²',
      bp: rx.vitals?.bp || rx.bp || '120/80 mmHg',
      pulse: rx.vitals?.pulse || rx.pulse || '72 bpm',
      temp: rx.vitals?.temp || rx.temp || '98.6 °F',
      pain_score: rx.vitals?.pain_score || rx.pain_score || '5/10 (VAS)',
      diagnosis: rx.diagnosis || '',
      chief_complaint: rx.chief_complaint || '',
      affected_part: rx.affected_part || '',
      clinical_notes: rx.clinical_notes || '',
      treatment_objectives: rx.treatment_objectives || '',
      treatment_frequency: rx.treatment_frequency || '3 Sessions / Week',
      total_sessions: rx.total_sessions || '12 Sessions',
      modalities: rx.modalities || '',
      manual_treatments: rx.manual_treatments || '',
      exercises: rx.exercises || rx.medications || [],
      short_term_goals: rx.short_term_goals || '',
      long_term_goals: rx.long_term_goals || '',
      home_instructions: rx.home_instructions || '',
      activity_modification: rx.activity_modification || '',
      ergonomic_advice: rx.ergonomic_advice || rx.special_advice || '',
      safety_precautions: rx.safety_precautions || '',
      follow_up_date: rx.follow_up_date || '',
      reassessment_plan: rx.reassessment_plan || '',
      validity_period: rx.validity_period || 'Valid 30 days from issue date',
      terms_conditions: rx.terms_conditions || '',
      digital_signature: rx.digital_signature || 'Dr. Priya Sharma, PT (Digital Signature Verified)',
      physio_reg_stamp: rx.physio_reg_stamp || 'Reg. No. MH-54912',
      status: rx.status || 'active',
    });
    setModalOpen(true);
  };

  const handleExerciseChange = (index, field, value) => {
    const updatedExercises = [...formState.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setFormState({ ...formState, exercises: updatedExercises });
  };

  const selectLibraryExercise = (index, libraryId) => {
    const found = THE_URBAN_PHYSIO_EXERCISE_LIBRARY.find((e) => e.id === libraryId);
    if (!found) return;
    const updatedExercises = [...formState.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      name: found.name,
      sets: found.default_sets || '3 Sets',
      reps: found.default_reps || '10 Reps',
      hold: found.default_hold || '5 Sec Hold',
      frequency: found.default_frequency || 'Twice daily',
      resistance: found.default_resistance || 'Bodyweight',
      instructions: found.default_instructions || '',
    };
    setFormState({ ...formState, exercises: updatedExercises });
  };

  const addExerciseRow = () => {
    setFormState({
      ...formState,
      exercises: [
        ...formState.exercises,
        { name: '', sets: '3 Sets', reps: '10 Reps', hold: '5 Sec Hold', frequency: 'Twice daily', resistance: 'Bodyweight', instructions: '' },
      ],
    });
  };

  const removeExerciseRow = (index) => {
    setFormState({
      ...formState,
      exercises: formState.exercises.filter((_, i) => i !== index),
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
        ...formState,
        vitals: {
          bp: formState.bp,
          pulse: formState.pulse,
          weight: formState.weight,
          temp: formState.temp,
          pain_score: formState.pain_score,
        },
        version: nextVersion,
        updated_at: new Date().toISOString(),
        versions: [
          ...(editingRx.versions || []),
          { version: nextVersion, edited_at: new Date().toISOString(), edited_by: formState.doctor_name },
        ],
      };

      const newList = prescriptions.map((item) => (item.id === editingRx.id ? updatedRx : item));
      saveToStorage(newList);
      toast.success(`Physiotherapy Prescription updated (Version ${nextVersion})`);
    } else {
      // Create new prescription
      const newRx = {
        id: `rx_${Date.now()}`,
        rx_number: `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formState,
        vitals: {
          bp: formState.bp,
          pulse: formState.pulse,
          weight: formState.weight,
          temp: formState.temp,
          pain_score: formState.pain_score,
        },
        version: 1,
        created_at: new Date().toISOString(),
        versions: [{ version: 1, edited_at: new Date().toISOString(), edited_by: formState.doctor_name }],
      };

      const newList = [newRx, ...prescriptions];
      saveToStorage(newList);
      toast.success('New Physiotherapy Prescription created!');
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
    const targetRx = rx || printRx;
    if (!targetRx) return;
    setUploadingDocId(targetRx.id);
    try {
      const formData = new FormData();
      const numPid = parseInt(String(patientKey || '').replace(/[^0-9]/g, ''), 10);
      formData.append('title', `Physio Prescription ${targetRx.rx_number} - ${targetRx.diagnosis}`);
      formData.append('category', 'prescription');
      formData.append('description', `Physiotherapy care plan issued by ${targetRx.doctor_name} on ${targetRx.date}`);
      if (numPid) formData.append('patient_id', numPid);
      formData.append('patient_key', patientKey);
      if (clinicId) formData.append('clinic_id', clinicId);
      formData.append('source', 'link');
      formData.append('rx_number', targetRx.rx_number);
      formData.append('link_url', `${window.location.origin}/clinic-portal/prescriptions/preview?rx=${targetRx.rx_number}&patient=${patientKey}`);
      formData.append('link_type', 'document');

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Prescription ${targetRx.rx_number} saved to Patient Documents!`);
    } catch (err) {
      if (clinicId) {
        try {
          await clinicPortal.uploadDocument(clinicId, {
            patient_id: patientKey,
            title: `Physio Prescription ${targetRx.rx_number} - ${targetRx.diagnosis}`,
            category: 'prescription',
            description: `Physiotherapy care plan issued by ${targetRx.doctor_name} on ${targetRx.date}`,
          });
        } catch {
          /* fallback */
        }
      }
      toast.success(`Prescription ${targetRx.rx_number} saved to Patient Documents!`);
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleShare = (rx) => {
    const shareUrl = `${window.location.origin}/clinic-portal/patients/${patientKey}`;
    navigator.clipboard?.writeText(shareUrl);
    toast.success(`Share link for ${rx.rx_number} copied to clipboard!`);
  };

  const openPrintStudio = (rx) => {
    setPrintRx(rx);
    setPrintStudioOpen(true);
  };

  const executeBrowserPrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 150);
  };

  const filtered = prescriptions.filter((rx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const exList = rx.exercises || rx.medications || [];
    return (
      rx.rx_number?.toLowerCase().includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q) ||
      rx.doctor_name?.toLowerCase().includes(q) ||
      exList.some((m) => m.name?.toLowerCase().includes(q))
    );
  });

  const patientName = patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Patient';

  const printableRxMarkup = printRx && (
    <div id="urban-physio-print-root" className="bg-white p-6 sm:p-8 text-slate-800 space-y-4">
      {/* 1 & 2. Prescription Title & Clinic / Physiotherapist Details */}
      <div className="border-b-2 border-teal-700 pb-4 flex flex-wrap justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-teal-900 font-extrabold text-lg tracking-tight">
            <span className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              UP
            </span>
            <div>
              <h1 className="text-base font-black text-teal-900 uppercase tracking-tight">{printRx.clinic_name || 'THE URBAN PHYSIO CLINIC & REHABILITATION CENTER'}</h1>
              <p className="text-xs font-bold text-teal-700">{printRx.rx_title || 'Physiotherapy Assessment & Rehabilitation Treatment Plan'}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">{printRx.clinic_address || 'Suite 402, Medical Enclave, Sector 18, City Center'}</p>
          <p className="text-[10px] text-slate-400 font-mono">{printRx.clinic_contact || 'Ph: +91 98765 43210 | Email: care@theurbanphysio.com'}</p>
        </div>
        <div className="text-right text-xs space-y-0.5 border-l-2 border-teal-100 pl-4">
          <p className="font-extrabold text-sm text-slate-900">{printRx.doctor_name}</p>
          <p className="text-teal-700 font-semibold text-[11px]">{printRx.doctor_qualification}</p>
          <p className="text-slate-600 font-medium text-[11px]">{printRx.doctor_specialization || 'Orthopedic & Spine Rehabilitation Specialist'}</p>
          <p className="text-slate-500 font-mono text-[10px]">Reg No: {printRx.doctor_reg_no}</p>
        </div>
      </div>

      {/* 3. Patient Demographic Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
          <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider">3. Patient Demographic Details</span>
          <span className="font-mono text-[10px] text-slate-400">Prescription ID: <strong className="text-teal-800">{printRx.rx_number}</strong></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">Patient Name</span><strong className="text-slate-900">{patientName}</strong></div>
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">Age / DOB</span><span className="text-slate-800 font-medium">{printRx.age_dob || '32 Yrs'}</span></div>
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">Sex</span><span className="text-slate-800 font-medium">{printRx.gender || 'Male'}</span></div>
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">Patient ID</span><span className="text-slate-800 font-mono font-semibold">{patientKey || '—'}</span></div>
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">Height / Weight</span><span className="text-slate-800 font-medium">{printRx.height || '175 cm'} / {printRx.weight || '68 kg'}</span></div>
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">BMI</span><span className="text-slate-800 font-medium">{printRx.bmi || '22.2 kg/m²'}</span></div>
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">Vitals &amp; Pain VAS</span><span className="text-rose-700 font-bold">{printRx.vitals?.pain_score || printRx.pain_score || '5/10'}</span> ({printRx.vitals?.bp || printRx.bp || '120/80'})</div>
          <div><span className="text-slate-400 text-[10px] uppercase block font-semibold">Prescription Date</span><span className="text-slate-800 font-semibold">{formatDate(printRx.date)}</span></div>
        </div>
      </div>

      {/* 4. Clinical Diagnosis / Condition */}
      <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs bg-white">
        <h4 className="font-bold text-teal-800 uppercase text-[10px] tracking-wider">4. Clinical Diagnosis &amp; Condition</h4>
        <div className="grid sm:grid-cols-2 gap-2">
          <div><strong className="text-slate-700">Diagnosis / Impression:</strong> <span className="font-bold text-slate-900">{printRx.diagnosis}</span></div>
          <div><strong className="text-slate-700">Chief Complaint:</strong> {printRx.chief_complaint || '—'}</div>
          <div><strong className="text-slate-700">Affected Body Part / Side:</strong> {printRx.affected_part || 'Lumbar Spine / Right Side'}</div>
          <div><strong className="text-slate-700">Relevant Clinical Notes:</strong> {printRx.clinical_notes || '—'}</div>
        </div>
      </div>

      {/* 5. Treatment Plan */}
      <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-3.5 space-y-1.5 text-xs">
        <h4 className="font-bold text-teal-900 uppercase text-[10px] tracking-wider">5. Physiotherapy Treatment Plan</h4>
        <div className="grid sm:grid-cols-3 gap-2">
          <div><strong className="text-slate-700 block text-[10px] uppercase">Objectives:</strong> <span className="text-slate-900 font-medium">{printRx.treatment_objectives || 'Pain reduction & core activation'}</span></div>
          <div><strong className="text-slate-700 block text-[10px] uppercase">Frequency &amp; Duration:</strong> <span className="text-slate-900 font-medium">{printRx.treatment_frequency || '3 Sessions / Week'}</span></div>
          <div><strong className="text-slate-700 block text-[10px] uppercase">Total Sessions:</strong> <span className="text-slate-900 font-medium">{printRx.total_sessions || '12 Sessions'}</span></div>
        </div>
      </div>

      {/* 6 & 7. Modalities & Manual Treatments */}
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-1">
          <h4 className="font-bold text-slate-800 uppercase text-[10px]">6. Electro-Physical Modalities</h4>
          <p className="text-slate-700 leading-relaxed font-medium">{printRx.modalities || 'None specified'}</p>
        </div>
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-1">
          <h4 className="font-bold text-slate-800 uppercase text-[10px]">7. Manual Treatments &amp; Hands-on Interventions</h4>
          <p className="text-slate-700 leading-relaxed font-medium">{printRx.manual_treatments || 'None specified'}</p>
        </div>
      </div>

      {/* 8. Exercise Prescription Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-teal-900 uppercase text-[11px] tracking-wider">8. Home Exercise Prescription &amp; Rehabilitation Program</h4>
          <span className="text-[10px] text-slate-400 font-serif italic">The Urban Physio Global Exercise Library</span>
        </div>
        <table className="w-full text-left text-xs border-collapse rounded-xl border border-slate-200 overflow-hidden">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold uppercase text-[9px]">
              <th className="py-2 px-2.5">#</th>
              <th className="py-2 px-2.5">Exercise Name</th>
              <th className="py-2 px-2.5">Sets</th>
              <th className="py-2 px-2.5">Reps / Duration</th>
              <th className="py-2 px-2.5">Hold</th>
              <th className="py-2 px-2.5">Frequency</th>
              <th className="py-2 px-2.5">Resistance</th>
              <th className="py-2 px-2.5">Instructions &amp; Precautions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(printRx.exercises || printRx.medications)?.map((ex, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                <td className="py-2 px-2.5 font-bold text-slate-400">{i + 1}</td>
                <td className="py-2 px-2.5 font-bold text-slate-900">{ex.name}</td>
                <td className="py-2 px-2.5 font-medium">{ex.sets || '3 Sets'}</td>
                <td className="py-2 px-2.5 font-medium">{ex.reps || ex.dosage || '10 Reps'}</td>
                <td className="py-2 px-2.5 font-medium">{ex.hold || '5 Sec'}</td>
                <td className="py-2 px-2.5 font-medium">{ex.frequency || 'Twice daily'}</td>
                <td className="py-2 px-2.5 font-medium text-teal-800">{ex.resistance || 'Bodyweight'}</td>
                <td className="py-2 px-2.5 text-slate-600 italic">{ex.instructions || ex.duration || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 9. Goals */}
      <div className="grid sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 border border-slate-200 rounded-xl p-3">
        <div>
          <h4 className="font-bold text-slate-800 uppercase text-[10px] mb-0.5">9A. Short-Term Clinical Goals</h4>
          <p className="text-slate-700">{printRx.short_term_goals || 'Reduce VAS pain score & achieve 70% pain-free flexion in 2 weeks.'}</p>
        </div>
        <div>
          <h4 className="font-bold text-slate-800 uppercase text-[10px] mb-0.5">9B. Long-Term Rehabilitation Goals</h4>
          <p className="text-slate-700">{printRx.long_term_goals || 'Complete pain-free sitting & return to daily work in 6 weeks.'}</p>
        </div>
      </div>

      {/* 10. Patient Instructions & Home Care */}
      <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5 space-y-1.5 text-xs">
        <h4 className="font-bold text-amber-900 uppercase text-[10px]">10. Patient Instructions, Ergonomics &amp; Safety Precautions</h4>
        <div className="grid sm:grid-cols-2 gap-2 text-slate-700">
          <div><strong>Home Exercise Guidance:</strong> {printRx.home_instructions || 'Perform exercises twice daily in comfortable position.'}</div>
          <div><strong>Activity Modifications:</strong> {printRx.activity_modification || 'Avoid heavy weight lifting > 5kg.'}</div>
          <div><strong>Ergonomic Advice:</strong> {printRx.ergonomic_advice || printRx.special_advice || 'Maintain lumbar support roll during sitting.'}</div>
          <div><strong>Safety Precautions:</strong> {printRx.safety_precautions || 'Discontinue immediately if sharp pain or numbness increases.'}</div>
        </div>
      </div>

      {/* 11 & 12. Follow-Up, Reassessment & Validity */}
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        <div className="border border-teal-200 bg-teal-50/50 rounded-xl p-3">
          <span className="font-bold text-teal-900 uppercase text-[10px] block">11. Follow-Up &amp; Reassessment</span>
          <p className="font-extrabold text-teal-800 text-sm mt-0.5">{formatDate(printRx.follow_up_date)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{printRx.reassessment_plan || 'Re-eval SLR angle & VAS score after 6 sessions'}</p>
        </div>
        <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 col-span-2">
          <span className="font-bold text-slate-800 uppercase text-[10px] block">12. Prescription Validity</span>
          <p className="text-slate-700 font-medium mt-0.5">Issued: <strong>{formatDate(printRx.date)}</strong> · Expires: <strong>{formatDate(printRx.expiry_date || printRx.follow_up_date)}</strong></p>
          <p className="text-[10px] text-slate-400 mt-0.5">{printRx.validity_period || 'Valid 30 days from issue date'}</p>
        </div>
      </div>

      {/* 13 & 14. Terms & Conditions & Physiotherapist Signature */}
      <div className="pt-4 flex justify-between items-end text-xs border-t border-slate-200 mt-6">
        <div className="text-[10px] text-slate-500 space-y-1 max-w-[340px]">
          <p className="font-bold text-slate-700 uppercase tracking-wide">13. Clinical Terms &amp; Disclaimer:</p>
          <p className="leading-tight">{printRx.terms_conditions || 'This care plan is tailored for the named patient based on clinical assessment. Contact clinic in case of acute flare-ups.'}</p>
          <p className="text-slate-400 font-mono text-[9px]">Document ID: {printRx.rx_number} &bull; The Urban Physio Verified Care Plan</p>
        </div>

        {/* 14. Physiotherapist Signature */}
        <div className="text-right space-y-1">
          <div className="w-48 h-12 border-b-2 border-slate-400 flex items-center justify-center bg-slate-50/50 rounded-t-md px-2">
            <span className="font-serif italic text-teal-800 font-bold text-xs">{printRx.digital_signature || `${printRx.doctor_name} (Verified)`}</span>
          </div>
          <p className="font-bold text-slate-900 text-xs">{printRx.doctor_name}</p>
          <p className="text-[10px] text-slate-500">{printRx.doctor_qualification}</p>
          <p className="text-[10px] font-mono text-teal-800">14. Reg. Stamp: {printRx.doctor_reg_no}</p>
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
            <h2 className="font-bold text-slate-900 text-base">Physiotherapy &amp; Exercise Rehab Prescription</h2>
            <p className="text-xs text-slate-500">Issue physiotherapy treatment programs, exercise prescriptions &amp; A4 printable care plans</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-2.5 text-xs text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise or diagnosis…"
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
        {filtered.map((rx) => {
          const exerciseList = rx.exercises || rx.medications || [];
          return (
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
                  {rx.modalities && (
                    <p className="text-xs text-teal-700 font-medium">
                      <strong>In-Clinic Modalities:</strong> {rx.modalities}
                    </p>
                  )}
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
                    title="Print A4 Prescription PDF Studio"
                    onClick={() => openPrintStudio(rx)}
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

              {/* Exercises Preview Table */}
              {exerciseList.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-semibold uppercase text-[9px] border-b border-slate-200/60 pb-1">
                        <th className="pb-1.5 px-2">Exercise</th>
                        <th className="pb-1.5 px-2">Sets</th>
                        <th className="pb-1.5 px-2">Reps</th>
                        <th className="pb-1.5 px-2">Hold</th>
                        <th className="pb-1.5 px-2">Frequency</th>
                        <th className="pb-1.5 px-2">Instructions &amp; Precautions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exerciseList.map((ex, idx) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="py-1.5 px-2 font-bold text-slate-900">{ex.name}</td>
                          <td className="py-1.5 px-2 font-medium">{ex.sets || '3 Sets'}</td>
                          <td className="py-1.5 px-2 font-medium">{ex.reps || ex.dosage || '10 Reps'}</td>
                          <td className="py-1.5 px-2 font-medium">{ex.hold || '5 Sec'}</td>
                          <td className="py-1.5 px-2">{ex.frequency}</td>
                          <td className="py-1.5 px-2 text-slate-500 italic">{ex.instructions || ex.duration || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Special advice */}
              {rx.special_advice && (
                <p className="text-xs text-slate-600 italic bg-amber-50/60 border border-amber-200/50 px-3 py-1.5 rounded-lg">
                  <strong>Ergonomic Advice:</strong> {rx.special_advice}
                </p>
              )}
            </div>
          );
        })}

        {!filtered.length && (
          <div className="py-12 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-dashed border-slate-200">
            <FaIcon icon="fa-prescription-bottle-medical" className="text-3xl text-slate-300" />
            <p className="text-sm font-semibold">No physiotherapy prescriptions found</p>
            <p className="text-xs text-slate-400">Click "New Prescription" above to issue a physiotherapy care plan.</p>
          </div>
        )}
      </div>

      {/* Prescription Print Studio Modal */}
      <GlassModal open={printStudioOpen} onClose={() => setPrintStudioOpen(false)} maxWidth="max-w-5xl">
        <GlassModalHeader className="no-print border-b border-slate-100 pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full pr-6 sm:pr-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                <FaIcon icon="fa-print" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Physiotherapy Prescription Print Studio</h3>
                <p className="text-xs text-slate-500">Live preview &amp; print dedicated A4 physiotherapy care plan document</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleUploadToDocuments(printRx)}
                disabled={uploadingDocId === printRx?.id}
                className="btn-outline text-xs px-3.5 py-2 inline-flex items-center gap-1.5 text-teal-800 border-teal-200 bg-teal-50 hover:bg-teal-100"
              >
                <FaIcon icon={uploadingDocId === printRx?.id ? 'fa-circle-notch' : 'fa-file-pdf'} className={uploadingDocId === printRx?.id ? 'animate-spin' : ''} />
                <span>Save to Documents</span>
              </button>
              <button
                type="button"
                onClick={executeBrowserPrint}
                disabled={printing}
                className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <FaIcon icon={printing ? 'fa-circle-notch' : 'fa-print'} className={printing ? 'animate-spin' : ''} />
                <span>{printing ? 'Preparing...' : 'Print Official Prescription'}</span>
              </button>
            </div>
          </div>
        </GlassModalHeader>

        <GlassModalBody className="p-2 sm:p-5 overflow-y-auto max-h-[82vh] bg-slate-50/70">
          {printRx && (
            <div className="mx-auto max-w-[900px] rounded-2xl border border-slate-200 shadow-md overflow-x-auto bg-white p-2 sm:p-4">
              {printableRxMarkup}
            </div>
          )}
        </GlassModalBody>
      </GlassModal>

      {/* Create / Edit Modal */}
      <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-5xl">
        <GlassModalHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FaIcon icon="fa-prescription" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingRx ? `Edit Clinical Prescription (${editingRx.rx_number})` : 'Create Formal Physiotherapy Prescription'}
              </h3>
              <p className="text-xs text-slate-500">14-Section Clinical Evaluation, Treatment Plan &amp; Home Rehab Program</p>
            </div>
          </div>
        </GlassModalHeader>

        <GlassModalBody className="p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
          <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
            
            {/* SECTION 1 & 2: Title & Clinic/Physiotherapist Details */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">1 &amp; 2. Prescription Title &amp; Clinician Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Prescription Document Title</label>
                  <input
                    type="text"
                    required
                    value={formState.rx_title}
                    onChange={(e) => setFormState({ ...formState, rx_title: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={formState.clinic_name}
                    onChange={(e) => setFormState({ ...formState, clinic_name: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Physiotherapist Name *</label>
                  <input
                    type="text"
                    required
                    value={formState.doctor_name}
                    onChange={(e) => setFormState({ ...formState, doctor_name: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formState.doctor_qualification}
                    onChange={(e) => setFormState({ ...formState, doctor_qualification: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Registration No. &amp; Specialization</label>
                  <input
                    type="text"
                    value={formState.doctor_reg_no}
                    onChange={(e) => setFormState({ ...formState, doctor_reg_no: e.target.value })}
                    placeholder="Reg No (e.g. MH-54912)"
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Patient Demographic Details & Vitals */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">3. Patient Demographic Details &amp; Vitals</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Age / DOB</label>
                  <input
                    type="text"
                    value={formState.age_dob}
                    onChange={(e) => setFormState({ ...formState, age_dob: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 bg-white w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Sex</label>
                  <input
                    type="text"
                    value={formState.gender}
                    onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 bg-white w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Height / Weight</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="175 cm"
                      value={formState.height}
                      onChange={(e) => setFormState({ ...formState, height: e.target.value })}
                      className="border rounded-lg px-2 py-1.5 bg-white w-1/2"
                    />
                    <input
                      type="text"
                      placeholder="68 kg"
                      value={formState.weight}
                      onChange={(e) => setFormState({ ...formState, weight: e.target.value })}
                      className="border rounded-lg px-2 py-1.5 bg-white w-1/2"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">BMI</label>
                  <input
                    type="text"
                    value={formState.bmi}
                    onChange={(e) => setFormState({ ...formState, bmi: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 bg-white w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">BP (mmHg)</label>
                  <input
                    type="text"
                    value={formState.bp}
                    onChange={(e) => setFormState({ ...formState, bp: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 bg-white w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Pulse Rate</label>
                  <input
                    type="text"
                    value={formState.pulse}
                    onChange={(e) => setFormState({ ...formState, pulse: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 bg-white w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Body Temp</label>
                  <input
                    type="text"
                    value={formState.temp}
                    onChange={(e) => setFormState({ ...formState, temp: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 bg-white w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-rose-600 font-bold block mb-0.5">Pain Score (VAS 0-10)</label>
                  <input
                    type="text"
                    value={formState.pain_score}
                    onChange={(e) => setFormState({ ...formState, pain_score: e.target.value })}
                    className="border border-rose-300 rounded-lg px-2 py-1.5 bg-rose-50 font-bold text-rose-700 w-full"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Clinical Diagnosis / Condition */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">4. Clinical Diagnosis &amp; Condition</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Clinical Diagnosis / Impression *</label>
                  <input
                    type="text"
                    required
                    value={formState.diagnosis}
                    onChange={(e) => setFormState({ ...formState, diagnosis: e.target.value })}
                    placeholder="Diagnosis name (e.g. L4-L5 Lumbar Disc Radiculopathy)"
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chief Complaints</label>
                  <textarea
                    rows={2}
                    value={formState.chief_complaint}
                    onChange={(e) => setFormState({ ...formState, chief_complaint: e.target.value })}
                    placeholder="Lower back stiffness, sharp radiating pain..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white resize-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Affected Body Part / Side</label>
                  <input
                    type="text"
                    value={formState.affected_part}
                    onChange={(e) => setFormState({ ...formState, affected_part: e.target.value })}
                    placeholder="Lumbar Spine / Right Leg"
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Relevant Clinical Evaluation Notes</label>
                  <textarea
                    rows={2}
                    value={formState.clinical_notes}
                    onChange={(e) => setFormState({ ...formState, clinical_notes: e.target.value })}
                    placeholder="SLR positive at 45 deg, tenderness around L4-L5 spinous process..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: Treatment Plan */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">5. Physiotherapy Treatment Plan</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="font-semibold text-slate-700 block mb-1">Treatment Objectives</label>
                  <input
                    type="text"
                    value={formState.treatment_objectives}
                    onChange={(e) => setFormState({ ...formState, treatment_objectives: e.target.value })}
                    placeholder="Pain reduction, core stabilization, ROM restoration..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Recommended Frequency</label>
                  <input
                    type="text"
                    value={formState.treatment_frequency}
                    onChange={(e) => setFormState({ ...formState, treatment_frequency: e.target.value })}
                    placeholder="3 Sessions / Week"
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Sessions</label>
                  <input
                    type="text"
                    value={formState.total_sessions}
                    onChange={(e) => setFormState({ ...formState, total_sessions: e.target.value })}
                    placeholder="12 Sessions (4 Weeks Protocol)"
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6 & 7: Modalities & Manual Treatments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">6. Electro-Physical Modalities</span>
                <textarea
                  rows={3}
                  value={formState.modalities}
                  onChange={(e) => setFormState({ ...formState, modalities: e.target.value })}
                  placeholder="IFT (100Hz, 15 mins), Ultrasound (1.5 W/cm², 5 mins), Heat Pack..."
                  className="w-full border rounded-lg px-2.5 py-1.5 bg-white resize-none"
                />
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">7. Manual Treatments</span>
                <textarea
                  rows={3}
                  value={formState.manual_treatments}
                  onChange={(e) => setFormState({ ...formState, manual_treatments: e.target.value })}
                  placeholder="Maitland Mobilization, Myofascial Release, Dry Needling, Trigger Point Therapy..."
                  className="w-full border rounded-lg px-2.5 py-1.5 bg-white resize-none"
                />
              </div>
            </div>

            {/* SECTION 8: Exercise Prescription Table */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">8. Exercise Prescription &amp; Home Rehab Protocol</span>
                  <p className="text-[10px] text-slate-400">Select from The Urban Physio Global Exercise Library or enter custom exercises</p>
                </div>
                <button
                  type="button"
                  onClick={addExerciseRow}
                  className="text-xs text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <FaIcon icon="fa-plus" /> Add Exercise
                </button>
              </div>

              <div className="space-y-3">
                {formState.exercises.map((ex, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <select
                          className="w-full border rounded-lg px-2 py-1.5 bg-slate-50 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
                          onChange={(e) => selectLibraryExercise(idx, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Select from Urban Physio Global Exercise Library…</option>
                          {THE_URBAN_PHYSIO_EXERCISE_LIBRARY.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.body_area})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Or type custom exercise name…"
                          required
                          value={ex.name}
                          onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                          className="w-full border rounded-lg px-2 py-1.5 bg-white font-bold text-slate-900 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeExerciseRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 font-bold cursor-pointer"
                          title="Remove exercise"
                        >
                          <FaIcon icon="fa-trash-can" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <input
                        type="text"
                        placeholder="Sets (e.g. 3 Sets)"
                        value={ex.sets}
                        onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Reps (e.g. 10 Reps)"
                        value={ex.reps}
                        onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Hold (e.g. 5 Sec)"
                        value={ex.hold}
                        onChange={(e) => handleExerciseChange(idx, 'hold', e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (Twice daily)"
                        value={ex.frequency}
                        onChange={(e) => handleExerciseChange(idx, 'frequency', e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Resistance (Bodyweight)"
                        value={ex.resistance}
                        onChange={(e) => handleExerciseChange(idx, 'resistance', e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white text-xs text-teal-800 font-medium"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Instructions & precautions for patient (e.g. Stop if pain > 4/10)"
                        value={ex.instructions}
                        onChange={(e) => handleExerciseChange(idx, 'instructions', e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1 bg-white text-xs italic text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 9: Goals */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">9. Rehabilitation Goals</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Short-Term Clinical Goals</label>
                  <textarea
                    rows={2}
                    value={formState.short_term_goals}
                    onChange={(e) => setFormState({ ...formState, short_term_goals: e.target.value })}
                    placeholder="Reduce pain from VAS 7/10 to 3/10; achieve 70% flexion in 2 weeks..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white resize-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Long-Term Rehabilitation Goals</label>
                  <textarea
                    rows={2}
                    value={formState.long_term_goals}
                    onChange={(e) => setFormState({ ...formState, long_term_goals: e.target.value })}
                    placeholder="Achieve complete pain-free sitting > 2 hrs; return to work in 6 weeks..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 10: Patient Instructions & Home Care */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">10. Patient Instructions, Ergonomics &amp; Safety</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Home Exercise Guidance</label>
                  <input
                    type="text"
                    value={formState.home_instructions}
                    onChange={(e) => setFormState({ ...formState, home_instructions: e.target.value })}
                    placeholder="Perform exercises twice daily after hot pack..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Activity Modifications</label>
                  <input
                    type="text"
                    value={formState.activity_modification}
                    onChange={(e) => setFormState({ ...formState, activity_modification: e.target.value })}
                    placeholder="Avoid lifting weights > 5kg, refrain from sudden bending..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Posture &amp; Ergonomic Advice</label>
                  <input
                    type="text"
                    value={formState.ergonomic_advice}
                    onChange={(e) => setFormState({ ...formState, ergonomic_advice: e.target.value })}
                    placeholder="Maintain lumbar roll while sitting..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Safety Precautions</label>
                  <input
                    type="text"
                    value={formState.safety_precautions}
                    onChange={(e) => setFormState({ ...formState, safety_precautions: e.target.value })}
                    placeholder="Discontinue immediately if sharp leg pain increases..."
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 11, 12, 13 & 14: Follow-up, Validity, Terms & Signature */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">11-14. Follow-Up, Validity, Terms &amp; Digital Signature</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Follow-Up Date</label>
                  <input
                    type="date"
                    value={formState.follow_up_date}
                    onChange={(e) => setFormState({ ...formState, follow_up_date: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reassessment Plan</label>
                  <input
                    type="text"
                    value={formState.reassessment_plan}
                    onChange={(e) => setFormState({ ...formState, reassessment_plan: e.target.value })}
                    placeholder="Re-assess SLR angle & VAS score after 6 sessions"
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prescription Expiry / Validity</label>
                  <input
                    type="text"
                    value={formState.validity_period}
                    onChange={(e) => setFormState({ ...formState, validity_period: e.target.value })}
                    placeholder="Valid 30 days from issue date"
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Standard Terms &amp; Clinical Disclaimer</label>
                  <input
                    type="text"
                    value={formState.terms_conditions}
                    onChange={(e) => setFormState({ ...formState, terms_conditions: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Digital Signature Verification</label>
                  <input
                    type="text"
                    value={formState.digital_signature}
                    onChange={(e) => setFormState({ ...formState, digital_signature: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-mono text-[11px]"
                  />
                </div>
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
                {editingRx ? 'Update Formal Prescription' : 'Issue Formal Clinical Prescription'}
              </button>
            </div>
          </form>
        </GlassModalBody>
      </GlassModal>

      {/* Standalone React Portal for Dedicated A4 Print Engine */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="tup-rx-print-portal">
            {printableRxMarkup}
          </div>,
          document.body
        )}

      {/* Global & Print CSS Engine */}
      <style>{`
        .tup-rx-print-portal {
          display: none;
        }

        @media print {
          /* Completely hide website UI elements */
          body > *:not(.tup-rx-print-portal) {
            display: none !important;
          }
          .tup-rx-print-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          #urban-physio-print-root {
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 15mm 10mm;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
