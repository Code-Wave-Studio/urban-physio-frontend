import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import LocationMapModal from '../components/LocationMapModal';
import { googleMapsUrl } from '../utils/locationHelpers';
import {
  doctors,
  clinics,
  appointments,
  payments,
  booking,
  location,
  sessionTypes,
  patients,
  uploadReport,
  treatments,
  conditions,
  treatmentPackages,
} from '../services/api';
import CouponInput from '../components/platform/CouponInput';
import { bookPackageUrl } from '../utils/bookUrl';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import toast from 'react-hot-toast';
import { openRazorpayCheckout, handlePaymentError } from '../utils/razorpayCheckout';
import BookingPolicyAcceptance, {
  allPoliciesAccepted,
  emptyPolicyAcceptance,
} from '../components/booking/BookingPolicyAcceptance';
import BookingStepProgress from '../components/booking/BookingStepProgress';
import LocationDoctorsBanner from '../components/booking/LocationDoctorsBanner';
import DoctorSelectCards from '../components/booking/DoctorSelectCards';
import { POLICY_LAST_UPDATED } from '../constants/policyPages';
import { matchPainTypeLabel, matchHomeConditionLabel } from '../utils/bookUrl';

const STEPS = [
  'Service Type',
  'Problem & Pain',
  'Doctor & Clinic',
  'Your Details',
  'Date & Time',
  'Rehab Packages',
  'Payment',
];

const POPULAR_PACKAGE_DAYS = [10, 15, 20];

const SERVICE_TYPES = [
  { id: 'online', label: 'Online Consultation', icon: 'fa-video', desc: 'Video call via Jitsi Meet' },
  { id: 'home_visit', label: 'Home Visit', icon: 'fa-house-medical', desc: 'Physio at your doorstep' },
  { id: 'clinic', label: 'Clinic Visit', icon: 'fa-hospital', desc: 'In-clinic session' },
];

function mergeDoctorIntoList(list, doctor) {
  if (!doctor?.id) return list;
  if (list.some((d) => String(d.id) === String(doctor.id))) return list;
  return [doctor, ...list];
}

function mergeClinicIntoList(list, clinic) {
  if (!clinic?.id) return list;
  if (list.some((c) => String(c.id) === String(clinic.id))) return list;
  return [clinic, ...list];
}

const initialForm = () => ({
  consultation_type: '',
  pain_type: '',
  pain_description: '',
  doctor_id: '',
  clinic_id: '',
  full_name: '',
  mobile: '',
  email: '',
  age: '',
  gender: '',
  number_of_sessions: 1,
  session_type_id: 1,
  appointment_date: '',
  start_time: '',
  first_time_visit: false,
  device_type: '',
  internet_quality: '',
  preferred_language: '',
  report_file: '',
  full_address: '',
  landmark: '',
  pincode: '',
  city: '',
  map_latitude: null,
  map_longitude: null,
  patient_condition: '',
  special_instructions: '',
  payment_option: '',
});

export default function BookAppointmentWizard() {
  const { id: doctorIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city, coords, nearbyClinics, loading: locLoading, setShowSelector } = useLocation();
  const [step, setStep] = useState(0);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [doctorList, setDoctorList] = useState([]);
  const [clinicList, setClinicList] = useState([]);
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [painTypes, setPainTypes] = useState([]);
  const [homeConditions, setHomeConditions] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableDatesLoading, setAvailableDatesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdAppt, setCreatedAppt] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [policyAcceptance, setPolicyAcceptance] = useState(emptyPolicyAcceptance);
  const [prefillLabel, setPrefillLabel] = useState('');
  const [packageList, setPackageList] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const preselectedClinicId = searchParams.get('clinic_id');
  const preselectedDoctorFromQuery = searchParams.get('doctor_id');
  const lockedClinic = Boolean(preselectedClinicId && form.consultation_type === 'clinic');
  const lockedDoctor = Boolean(doctorIdParam || preselectedDoctorFromQuery);

  const patch = (fields) =>
    setForm((f) => (typeof fields === 'function' ? fields(f) : { ...f, ...fields }));

  const serviceTypesForBooking = useMemo(() => {
    if (selectedDoctor?.enabled_services?.length) {
      return SERVICE_TYPES.filter((s) => selectedDoctor.enabled_services.includes(s.id));
    }
    return SERVICE_TYPES;
  }, [selectedDoctor]);

  const doctorsForType = useMemo(() => {
    if (!form.consultation_type) return doctorList;
    return doctorList.filter((d) => {
      const enabled = d.enabled_services;
      if (!enabled?.length) return true;
      return enabled.includes(form.consultation_type);
    });
  }, [doctorList, form.consultation_type]);
  const totalFee = () => {
    if (!selectedDoctor) return 0;
    const base =
      form.consultation_type === 'online'
        ? selectedDoctor.online_fee
        : form.consultation_type === 'home_visit'
          ? selectedDoctor.home_visit_fee
          : selectedDoctor.consultation_fee;
    return Number(base) * (form.number_of_sessions || 1);
  };

  const resolvedPaymentOption = () => {
    if (form.consultation_type === 'online') return 'full_online';
    if (form.consultation_type === 'clinic') return form.payment_option || 'pay_at_clinic';
    if (form.consultation_type === 'home_visit') return form.payment_option || 'partial_50';
    return form.payment_option || 'full_online';
  };

  const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

  const payNowAmount = () => {
    const total = totalFee();
    const opt = resolvedPaymentOption();
    let base = total;
    if (opt === 'pay_at_clinic') base = 0;
    else if (opt === 'partial_50') base = round2(total * 0.5);
    else base = round2(total);
    if (appliedCoupon?.final_amount != null && base > 0) {
      return round2(appliedCoupon.final_amount);
    }
    return base;
  };

  const payLaterAmount = () => {
    const total = totalFee();
    const now = payNowAmount();
    return Math.max(0, round2(total - now));
  };

  useEffect(() => {
    // Auto-default payment option when service changes
    if (form.consultation_type === 'clinic' && !form.payment_option) {
      patch({ payment_option: 'pay_at_clinic' });
    }
    if (form.consultation_type === 'home_visit' && !form.payment_option) {
      patch({ payment_option: 'partial_50' });
    }
    if (form.consultation_type === 'online' && form.payment_option) {
      patch({ payment_option: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.consultation_type]);

  const selectedClinic = clinicList.find((c) => String(c.id) === String(form.clinic_id));
  const clinicMapUrl = selectedClinic
    ? googleMapsUrl(selectedClinic.latitude, selectedClinic.longitude)
    : null;

  useEffect(() => {
    const t = searchParams.get('type');
    if (t && ['online', 'clinic', 'home_visit'].includes(t)) {
      patch({ consultation_type: t });
    }
    const cid = searchParams.get('clinic_id');
    if (cid) {
      patch({ clinic_id: cid, consultation_type: 'clinic' });
    }
    const did = searchParams.get('doctor_id');
    if (did && !doctorIdParam) {
      patch({ doctor_id: did });
    }
  }, [searchParams, doctorIdParam]);

  useEffect(() => {
    sessionTypes().then((res) => setSessions(res.data || []));
  }, []);

  useEffect(() => {
    booking
      .options()
      .then((res) => {
        const d = res?.data ?? res;
        setPainTypes((d?.pain_types || []).map((p) => p.label).filter(Boolean));
        setHomeConditions((d?.home_conditions || []).map((c) => c.label).filter(Boolean));
      })
      .catch(() => {
        setPainTypes(['Back Pain', 'Neck Pain', 'Knee Pain', 'Shoulder Pain', 'Other']);
        setHomeConditions(['Bedridden', 'Can Walk', 'Post Surgery', 'Injury']);
      });
  }, []);

  const loadProvidersForLocation = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      let docs = [];
      let clins = [];

      if (coords?.lat != null && coords?.lng != null) {
        const docRes = await location.nearbyDoctors(coords.lat, coords.lng, 50, city?.id);
        docs = docRes.data || [];
        if (docs.length === 0 && city?.id) {
          const fallback = await doctors.list({ verified: 1, city_id: city.id });
          docs = fallback.data || [];
        }
        if (nearbyClinics?.length) {
          clins = nearbyClinics;
        } else if (city?.id) {
          const clinRes = await clinics.list({ city_id: city.id });
          clins = clinRes.data || [];
        }
      } else if (city?.id) {
        const [docRes, clinRes] = await Promise.all([
          doctors.list({ verified: 1, city_id: city.id }),
          clinics.list({ city_id: city.id }),
        ]);
        docs = docRes.data || [];
        clins = clinRes.data || [];
      }

      if (selectedDoctor) {
        docs = mergeDoctorIntoList(docs, selectedDoctor);
      }

      setDoctorList(docs);
      setClinicList(clins);

      if (form.doctor_id && !lockedDoctor && form.consultation_type !== 'clinic') {
        const inList = docs.some((d) => String(d.id) === String(form.doctor_id));
        if (!inList) {
          patch({ doctor_id: '' });
          setSelectedDoctor(null);
        }
      }
    } catch {
      setDoctorList([]);
      setClinicList([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, [coords, city, nearbyClinics, form.doctor_id, form.consultation_type, lockedDoctor, selectedDoctor]);

  useEffect(() => {
    loadProvidersForLocation();
  }, [loadProvidersForLocation]);

  useEffect(() => {
    if (city?.name) {
      patch({ city: city.name });
    }
  }, [city]);

  useEffect(() => {
    if (!doctorIdParam && preselectedDoctorFromQuery) {
      doctors
        .get(preselectedDoctorFromQuery)
        .then((res) => {
          const d = res.data;
          setSelectedDoctor(d);
          setDoctorList((prev) => mergeDoctorIntoList(prev, d));
          patch({ doctor_id: d.id });
          setPrefillLabel(`Dr. ${d.first_name} ${d.last_name}`);
        })
        .catch(() => toast.error('Could not load doctor profile'));
      return;
    }
    if (!doctorIdParam) return;
    doctors
      .get(doctorIdParam)
      .then((res) => {
        const d = res.data;
        setSelectedDoctor(d);
        setDoctorList((prev) => mergeDoctorIntoList(prev, d));
        patch({ doctor_id: d.id });
        setPrefillLabel(`Dr. ${d.first_name} ${d.last_name}`);
      })
      .catch(() => toast.error('Could not load doctor profile'));
  }, [doctorIdParam, preselectedDoctorFromQuery]);

  useEffect(() => {
    if (!preselectedClinicId) return;
    clinics
      .get(preselectedClinicId)
      .then((res) => {
        const c = res.data;
        setClinicList((prev) => mergeClinicIntoList(prev, c));
        patch({ clinic_id: String(c.id), consultation_type: 'clinic' });
        setPrefillLabel((prev) => prev || c.name);
      })
      .catch(() => {});
  }, [preselectedClinicId]);

  useEffect(() => {
    const painTypeParam = searchParams.get('pain_type');
    const painDescParam = searchParams.get('pain_description');
    if (painTypeParam) {
      patch({
        pain_type: painTypeParam,
        ...(painDescParam ? { pain_description: painDescParam } : {}),
      });
      setPrefillLabel((prev) => prev || painTypeParam);
    }
    const conditionTitleParam = searchParams.get('condition_title');
    if (conditionTitleParam) {
      const painLabel = matchPainTypeLabel(conditionTitleParam, painTypes);
      const homeCond = matchHomeConditionLabel(conditionTitleParam, homeConditions);
      patch({
        pain_type: painLabel || 'Other',
        pain_description: conditionTitleParam,
        ...(homeCond ? { patient_condition: homeCond } : {}),
      });
      setPrefillLabel(conditionTitleParam);
    }
  }, [searchParams, painTypes, homeConditions]);

  useEffect(() => {
    const treatmentSlug = searchParams.get('treatment');
    if (!treatmentSlug) return;
    treatments
      .get(treatmentSlug)
      .then((res) => {
        const t = res.data;
        if (!t) return;
        const painLabel = matchPainTypeLabel(t.title, painTypes);
        patch({
          pain_type: painLabel,
          pain_description: t.short_description || t.title,
        });
        setPrefillLabel(t.title);
      })
      .catch(() => {});
  }, [searchParams, painTypes]);

  useEffect(() => {
    const conditionSlug = searchParams.get('condition');
    if (!conditionSlug) return;
    conditions
      .get(conditionSlug)
      .then((res) => {
        const c = res.data;
        if (!c) return;
        const painLabel = matchPainTypeLabel(c.title, painTypes);
        const homeCond = matchHomeConditionLabel(c.title, homeConditions);
        patch({
          pain_type: painLabel || 'Other',
          pain_description: c.short_description || c.title,
          ...(homeCond ? { patient_condition: homeCond } : {}),
        });
        setPrefillLabel(c.title);
      })
      .catch(() => {});
  }, [searchParams, painTypes, homeConditions]);

  useEffect(() => {
    if (user) {
      patch((f) => ({
        full_name: f.full_name || [user.first_name, user.last_name].filter(Boolean).join(' '),
        email: f.email || user.email || '',
        mobile: f.mobile || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role_slug !== 'patient') return;
    patients
      .getProfile()
      .then((res) => {
        const p = res?.data ?? res;
        patch((f) => ({
          ...f,
          gender: f.gender || p?.gender || '',
          age: f.age || (p?.age != null ? String(p.age) : ''),
          full_name:
            f.full_name ||
            [p?.first_name, p?.last_name].filter(Boolean).join(' ') ||
            f.full_name,
          email: f.email || p?.email || '',
          mobile: f.mobile || p?.phone || '',
        }));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (form.consultation_type === 'clinic' && form.clinic_id) {
      booking.clinicDoctors(form.clinic_id).then((res) => setClinicDoctors(res.data || []));
    }
  }, [form.clinic_id, form.consultation_type]);

  useEffect(() => {
    if (form.doctor_id && form.consultation_type === 'clinic') {
      booking.doctorClinics(form.doctor_id).then((res) => {
        if (res.data?.length) setClinicList(res.data);
      });
    }
  }, [form.doctor_id, form.consultation_type]);

  const loadSlots = useCallback(() => {
    if (!form.appointment_date) return;
    if (form.consultation_type === 'clinic') {
      if (!form.clinic_id) return;
    } else if (!form.doctor_id) {
      return;
    }
    setSlotsLoading(true);
    const req =
      form.consultation_type === 'clinic'
        ? (form.doctor_id
            ? booking.slotsForClinic(form.doctor_id, form.clinic_id, form.appointment_date)
            : booking.slots(null, form.appointment_date, form.clinic_id))
        : booking.slots(form.doctor_id, form.appointment_date);
    req
      .then((res) => setTimeSlots(res.data || []))
      .catch(() => setTimeSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.doctor_id, form.clinic_id, form.consultation_type, form.appointment_date]);

  const loadAvailableDates = useCallback(() => {
    if (step !== 4) return;
    if (!form.consultation_type) return;
    if (form.consultation_type === 'clinic') {
      if (!form.clinic_id) return;
    } else if (!form.doctor_id) {
      return;
    }
    setAvailableDatesLoading(true);
    const params =
      form.consultation_type === 'clinic'
        ? {
            ...(form.doctor_id ? { doctor_id: form.doctor_id } : {}),
            clinic_id: form.clinic_id,
            from: new Date().toISOString().slice(0, 10),
            days: 60,
          }
        : {
            doctor_id: form.doctor_id,
            from: new Date().toISOString().slice(0, 10),
            days: 60,
          };
    booking
      .availableDates(params)
      .then((res) => setAvailableDates(res.data || []))
      .catch(() => setAvailableDates([]))
      .finally(() => setAvailableDatesLoading(false));
  }, [step, form.consultation_type, form.doctor_id, form.clinic_id, form.appointment_date]);

  useEffect(() => {
    if (step === 4) loadSlots();
  }, [step, loadSlots]);

  useEffect(() => {
    loadAvailableDates();
  }, [loadAvailableDates]);

  const fee = totalFee;

  const popularPackages = useMemo(() => {
    const fromPreferred = POPULAR_PACKAGE_DAYS.map((d) => packageList.find((p) => Number(p.duration_days) === d)).filter(Boolean);
    if (fromPreferred.length) return fromPreferred;
    return packageList.slice(0, 3);
  }, [packageList]);

  useEffect(() => {
    if (step !== 5) return;
    setPackagesLoading(true);
    treatmentPackages
      .list()
      .then((res) => setPackageList(res.data || []))
      .catch(() => setPackageList([]))
      .finally(() => setPackagesLoading(false));
  }, [step]);

  const validateStep = (s) => {
    if (s === 0 && !form.consultation_type) {
      toast.error('Select a service type');
      return false;
    }
    if (s === 1) {
      if (!form.pain_type) {
        toast.error('Select pain / problem type');
        return false;
      }
      if (!form.pain_description?.trim()) {
        toast.error('Describe your pain or problem');
        return false;
      }
    }
    if (s === 2) {
      if (!doctorIdParam && !city && !coords) {
        toast.error('Please select your location first');
        setShowSelector(true);
        return false;
      }
      if (form.consultation_type === 'clinic' && !form.clinic_id) {
        toast.error('Select a clinic');
        return false;
      }
      if (form.consultation_type !== 'clinic') {
        if (!form.doctor_id && !selectedDoctor) {
          toast.error('Select a doctor');
          return false;
        }
        if (!form.doctor_id && selectedDoctor) {
          patch({ doctor_id: selectedDoctor.id });
        }
      }
    }
    if (s === 3) {
      const req = ['full_name', 'mobile', 'email', 'age', 'gender'];
      for (const k of req) {
        if (!String(form[k] ?? '').trim()) {
          toast.error('Fill all personal details');
          return false;
        }
      }
      if (form.number_of_sessions < 1) {
        toast.error('Sessions must be at least 1');
        return false;
      }
    }
    if (s === 4) {
      if (!form.appointment_date || !form.start_time) {
        toast.error('Select date and time slot');
        return false;
      }
      if (form.consultation_type === 'online') {
        if (!form.device_type || !form.internet_quality || !form.preferred_language) {
          toast.error('Complete online consultation details');
          return false;
        }
      }
      if (form.consultation_type === 'home_visit') {
        if (!form.full_address || !form.pincode || !form.city || !form.patient_condition) {
          toast.error('Complete home visit address details');
          return false;
        }
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step === 2 && form.doctor_id) {
      const doc =
        doctorList.find((d) => d.id === Number(form.doctor_id)) ||
        clinicDoctors.find((d) => d.id === Number(form.doctor_id)) ||
        selectedDoctor;
      if (doc) setSelectedDoctor(doc);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const openLocationMap = () => setMapOpen(true);

  const handleMapConfirm = ({ lat, lng }) => {
    patch({ map_latitude: lat, map_longitude: lng });
    location
      .detect(lat, lng)
      .then((res) => {
        const city = res.data?.city?.name || res.data?.city_name || '';
        if (city) patch({ city });
        toast.success('Location saved on map');
      })
      .catch(() => toast.success('Map pin saved'));
  };

  const slotStillAvailable = async () => {
    const res =
      form.consultation_type === 'clinic'
        ? (form.doctor_id
            ? await booking.slotsForClinic(form.doctor_id, form.clinic_id, form.appointment_date)
            : await booking.slots(null, form.appointment_date, form.clinic_id))
        : await booking.slots(form.doctor_id, form.appointment_date);
    const slots = res.data || [];
    return slots.some((s) => s.time === form.start_time);
  };

  const handleReportUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadReport(file);
      patch({ report_file: res.data?.file_path || res.data?.file_url });
      toast.success('Report uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };


  const policiesOk = allPoliciesAccepted(policyAcceptance);

  const handleBookAndPay = async () => {
    if (!policiesOk) {
      toast.error('Please accept all policies before payment');
      return;
    }
    if (!(await slotStillAvailable())) {
      toast.error('This slot was just booked. Please pick another time.');
      setStep(4);
      loadSlots();
      return;
    }

    setSubmitting(true);
    try {
      const resolvedDoctorId =
        form.consultation_type === 'clinic' && !form.doctor_id ? null : Number(form.doctor_id);
      const payload = {
        ...form,
        ...(resolvedDoctorId ? { doctor_id: resolvedDoctorId } : {}),
        clinic_id: form.clinic_id ? Number(form.clinic_id) : null,
        age: Number(form.age),
        number_of_sessions: Number(form.number_of_sessions),
        session_type_id: Number(form.session_type_id),
        first_time_visit: !!form.first_time_visit,
        payment_option: resolvedPaymentOption(),
        policies_accepted: true,
        accepted_policies: Object.keys(policyAcceptance).filter((k) => policyAcceptance[k]),
        policies_version: POLICY_LAST_UPDATED,
      };
      if (appliedCoupon?.code) payload.coupon_code = appliedCoupon.code;
      const res = await appointments.book(payload);
      const appt = res.data;
      setCreatedAppt(appt);
      const dest = user?.role_slug === 'patient' ? '/patient/appointments' : '/admin';

      if (payNowAmount() > 0) {
        const orderRes = await payments.createOrder(appt.id);
        try {
          await openRazorpayCheckout(orderRes);
          toast.success(
            appt.booking_id
              ? `Payment received — booking ${appt.booking_id} confirmed!`
              : 'Payment received — booking confirmed!'
          );
          navigate(dest);
        } catch (payErr) {
          handlePaymentError(payErr, { onPendingNavigate: () => navigate(dest) });
        }
      } else {
        toast.success(
          appt.booking_id
            ? `Booking submitted! ID: ${appt.booking_id} — pay at clinic; doctor will confirm payment.`
            : 'Booking submitted — pay at clinic; doctor will confirm payment.'
        );
        navigate(dest);
      }
    } catch (err) {
      const msg = err.message || 'Booking failed';
      toast.error(msg);
      if (msg.includes('already booked') || err.message?.includes('slot')) {
        setStep(4);
        loadSlots();
        patch({ start_time: '' });
      }
      if (err.errors) {
        Object.values(err.errors).forEach((m) => toast.error(m));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-slate-50 pb-16">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
        <button
          type="button"
          onClick={() => (step > 0 ? back() : navigate(-1))}
          className="mb-4 inline-flex items-center gap-2 text-sm text-primary-700 font-medium hover:underline"
        >
          <FaIcon icon="fa-arrow-left" />
          Back
        </button>

        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Book Appointment</h1>
          <p className="text-slate-600 text-sm mt-1">{STEPS[step]}</p>
        </div>

        <BookingStepProgress steps={STEPS} currentStep={step} accent="primary" />

        {prefillLabel && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200/70 px-3 py-2.5 text-sm text-emerald-900">
            <FaIcon icon="fa-circle-check" className="text-emerald-600 mt-0.5 shrink-0" />
            <p>
              Pre-selected: <strong>{prefillLabel}</strong>
              {' — '}
              <span className="text-emerald-800/90">Complete the remaining steps to confirm.</span>
            </p>
          </div>
        )}

        <div className="glass-strong rounded-2xl md:rounded-3xl p-5 sm:p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">How would you like to consult?</h2>
              <div className="grid gap-3">
                {serviceTypesForBooking.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => patch({ consultation_type: s.id })}
                    className={`flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 text-left transition ${
                      form.consultation_type === s.id
                        ? 'border-primary-500 bg-primary-50/90 ring-1 ring-primary-200'
                        : 'border-slate-200 bg-white/80 hover:border-primary-200 hover:bg-white'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      form.consultation_type === s.id ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
                    }`}>
                      <FaIcon icon={s.icon} className="text-lg" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{s.label}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Tell us about your problem</h2>
              <label className="block text-sm font-medium text-slate-700">Pain type</label>
              <select
                className="input-field"
                value={form.pain_type}
                onChange={(e) => patch({ pain_type: e.target.value })}
              >
                <option value="">Select...</option>
                {(painTypes.length ? painTypes : ['Back Pain', 'Neck Pain', 'Knee Pain', 'Shoulder Pain', 'Other']).map(
                  (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                  )
                )}
              </select>
              <label className="block text-sm font-medium text-slate-700">Pain description</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="When did it start? Severity, movement limits..."
                value={form.pain_description}
                onChange={(e) => patch({ pain_description: e.target.value })}
              />
              <label className="block text-sm font-medium text-slate-700">Number of sessions</label>
              <input
                type="number"
                min={1}
                max={20}
                className="input-field"
                value={form.number_of_sessions}
                onChange={(e) => patch({ number_of_sessions: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">
                {form.consultation_type === 'clinic' ? 'Clinic & doctor' : 'Choose your doctor'}
              </h2>

              <LocationDoctorsBanner
                city={city}
                hasLocation={!!city || !!coords}
                onSelectLocation={() => setShowSelector(true)}
              />

              {form.consultation_type === 'clinic' && (
                <>
                  {lockedClinic && selectedClinic ? (
                    <div className="glass-card border-emerald-200/60 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Your clinic</p>
                      <p className="font-bold text-slate-800 text-lg inline-flex items-center gap-2">
                        <FaIcon icon="fa-hospital" className="text-emerald-600" />
                        {selectedClinic.name}
                      </p>
                      {selectedClinic.address && (
                        <p className="text-sm text-slate-600">{selectedClinic.address}</p>
                      )}
                      {selectedClinic.city_name && (
                        <p className="text-sm text-slate-500 inline-flex items-center gap-1">
                          <FaIcon icon="fa-location-dot" className="text-primary-600" />
                          {selectedClinic.city_name}
                        </p>
                      )}
                      {clinicMapUrl && (
                        <a
                          href={clinicMapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary-600 font-medium inline-flex items-center gap-1 hover:underline"
                        >
                          <FaIcon icon="fa-map-location-dot" />
                          View on map
                        </a>
                      )}
                    </div>
                  ) : (
                    <>
                      <label className="block text-sm font-medium">Select clinic</label>
                      <select
                        className="input-field"
                        value={form.clinic_id}
                        onChange={(e) => patch({ clinic_id: e.target.value, doctor_id: '' })}
                      >
                        <option value="">Choose clinic...</option>
                        {clinicList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.city_name ? `— ${c.city_name}` : ''}
                          </option>
                        ))}
                      </select>
                      {selectedClinic && (
                        <div className="bg-primary-50/80 border border-primary-200/50 rounded-xl p-3 text-sm space-y-1">
                          <p className="font-semibold text-slate-800">
                            <FaIcon icon="fa-hospital" className="mr-1 text-primary-600" />
                            {selectedClinic.name}
                          </p>
                          {selectedClinic.address && (
                            <p className="text-slate-600">{selectedClinic.address}</p>
                          )}
                          {selectedClinic.city_name && (
                            <p className="text-slate-500">{selectedClinic.city_name}</p>
                          )}
                          {clinicMapUrl && (
                            <a
                              href={clinicMapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-600 font-medium inline-flex items-center gap-1"
                            >
                              <FaIcon icon="fa-map-location-dot" />
                              View on map
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {lockedDoctor && selectedDoctor ? (
                <div className="glass-card border-primary-200/60 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Your doctor</p>
                  <p className="font-bold text-slate-800 text-lg">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </p>
                  <p className="text-sm text-slate-600">{selectedDoctor.specialization}</p>
                  {selectedDoctor.city_name && (
                    <p className="text-sm text-slate-500 inline-flex items-center gap-1">
                      <FaIcon icon="fa-location-dot" className="text-primary-600" />
                      {selectedDoctor.city_name}
                    </p>
                  )}
                  {selectedDoctor.latitude != null && selectedDoctor.longitude != null && (
                    <a
                      href={googleMapsUrl(selectedDoctor.latitude, selectedDoctor.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary-600 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <FaIcon icon="fa-map-location-dot" />
                      View doctor on map
                    </a>
                  )}
                </div>
              ) : form.consultation_type === 'clinic' ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">Select doctor (optional)</label>
                  {doctorsLoading || locLoading ? (
                    <div className="input-field flex items-center gap-2 text-slate-500 text-sm">
                      <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      Loading doctors…
                    </div>
                  ) : (
                    <select
                      className="input-field"
                      value={form.doctor_id}
                      disabled={!city && !coords}
                      onChange={(e) => {
                        const id = e.target.value;
                        patch({ doctor_id: id });
                        const doc = clinicDoctors.find((d) => String(d.id) === id);
                        if (doc) setSelectedDoctor(doc);
                      }}
                    >
                      <option value="">
                        {!form.clinic_id
                          ? 'Select a clinic first…'
                          : 'Auto assign from clinic availability'}
                      </option>
                      {clinicDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.first_name} {d.last_name} — {d.specialization}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              ) : (
                <>
                  {doctorsLoading || locLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-sm">
                      <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      Loading doctors in {city?.name || 'your area'}…
                    </div>
                  ) : (
                    <DoctorSelectCards
                      doctors={doctorsForType}
                      selectedId={form.doctor_id}
                      onSelect={(id, doc) => {
                        patch({ doctor_id: id });
                        setSelectedDoctor(doc);
                      }}
                      disabled={!city && !coords}
                      emptyMessage={
                        city
                          ? `No doctors found in ${city.name}. Try another city.`
                          : 'Select your city to see available doctors.'
                      }
                    />
                  )}
                </>
              )}

              {!lockedDoctor &&
                !doctorsLoading &&
                !locLoading &&
                city &&
                (form.consultation_type === 'clinic' && form.clinic_id
                  ? clinicDoctors.length === 0
                  : doctorsForType.length === 0) && (
                  <p className="text-sm text-slate-600 bg-white/50 border border-white/70 rounded-xl px-3 py-2">
                    No doctors found near {city.name}. Try another city or{' '}
                    <button
                      type="button"
                      className="text-primary-600 font-semibold hover:underline"
                      onClick={() => setShowSelector(true)}
                    >
                      change location
                    </button>
                    .
                  </p>
                )}

              {form.consultation_type === 'clinic' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.first_time_visit}
                    onChange={(e) => patch({ first_time_visit: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm">First-time visit?</span>
                </label>
              )}

              {selectedDoctor && (
                <p className="text-sm text-slate-600 bg-white/40 p-3 rounded-xl">
                  Fee (per session): ₹
                  {form.consultation_type === 'online'
                    ? selectedDoctor.online_fee
                    : form.consultation_type === 'home_visit'
                      ? selectedDoctor.home_visit_fee
                      : selectedDoctor.consultation_fee}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Personal Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input
                    className="input-field"
                    placeholder="Full name *"
                    value={form.full_name}
                    onChange={(e) => patch({ full_name: e.target.value })}
                  />
                </div>
                <input
                  className="input-field"
                  placeholder="Mobile number *"
                  value={form.mobile}
                  onChange={(e) => patch({ mobile: e.target.value })}
                />
                <input
                  type="email"
                  className="input-field"
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                />
                <input
                  type="number"
                  min={1}
                  max={120}
                  className="input-field"
                  placeholder="Age *"
                  value={form.age}
                  onChange={(e) => patch({ age: e.target.value })}
                />
                <select
                  className="input-field"
                  value={form.gender}
                  onChange={(e) => patch({ gender: e.target.value })}
                >
                  <option value="">Gender *</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {sessions.length > 0 && (
                <select
                  className="input-field"
                  value={form.session_type_id}
                  onChange={(e) => patch({ session_type_id: parseInt(e.target.value, 10) })}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Date & Time</h2>
              <input
                type="date"
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                value={form.appointment_date}
                onChange={(e) => {
                  const v = e.target.value;
                  if (availableDates.length && v && !availableDates.includes(v)) {
                    toast.error('All slots are booked for this date. Please choose another date.');
                    return;
                  }
                  patch({ appointment_date: v, start_time: '' });
                }}
              />

              {(availableDatesLoading || availableDates.length > 0) && (
                <div className="rounded-xl bg-white/40 border border-white/70 p-3">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Next available dates
                  </p>
                  {availableDatesLoading ? (
                    <p className="text-sm text-slate-500 mt-2">Loading...</p>
                  ) : availableDates.length === 0 ? (
                    <p className="text-sm text-amber-700 mt-2">No availability found in the next 60 days.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableDates.slice(0, 12).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => patch({ appointment_date: d, start_time: '' })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            form.appointment_date === d
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white/60 text-slate-700 border-white/70 hover:bg-white/80'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.appointment_date && (
                <div>
                  <p className="text-sm font-medium mb-2">Available slots</p>
                  {slotsLoading ? (
                    <p className="text-slate-500 text-sm">Loading slots...</p>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-amber-700 text-sm">
                      All slots booked for this date — choose another date
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => patch({ start_time: slot.time })}
                          className={`py-2 rounded-lg text-sm ${
                            form.start_time === slot.time
                              ? 'bg-primary-600 text-white'
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.consultation_type === 'online' && (
                <div className="space-y-3 pt-2 border-t border-white/50">
                  <p className="font-medium text-sm">Online consultation details</p>
                  <select
                    className="input-field"
                    value={form.device_type}
                    onChange={(e) => patch({ device_type: e.target.value })}
                  >
                    <option value="">Device type</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Laptop">Laptop</option>
                  </select>
                  <select
                    className="input-field"
                    value={form.internet_quality}
                    onChange={(e) => patch({ internet_quality: e.target.value })}
                  >
                    <option value="">Internet quality</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                  <select
                    className="input-field"
                    value={form.preferred_language}
                    onChange={(e) => patch({ preferred_language: e.target.value })}
                  >
                    <option value="">Preferred language</option>
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                  </select>
                  <div>
                    <label className="text-sm font-medium">Upload reports (PDF / image)</label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="input-field mt-1"
                      onChange={handleReportUpload}
                      disabled={uploading}
                    />
                    {form.report_file && (
                      <p className="text-xs text-green-700 mt-1">Uploaded ✓</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    A secure video call link will be emailed after booking.
                  </p>
                </div>
              )}

              {form.consultation_type === 'home_visit' && (
                <div className="space-y-3 pt-2 border-t border-white/50">
                  <p className="font-medium text-sm">Home visit address</p>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Full address *"
                    value={form.full_address}
                    onChange={(e) => patch({ full_address: e.target.value })}
                  />
                  <input
                    className="input-field"
                    placeholder="Landmark"
                    value={form.landmark}
                    onChange={(e) => patch({ landmark: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="input-field"
                      placeholder="Pincode *"
                      value={form.pincode}
                      onChange={(e) => patch({ pincode: e.target.value })}
                    />
                    <input
                      className="input-field"
                      placeholder="City *"
                      value={form.city}
                      onChange={(e) => patch({ city: e.target.value })}
                    />
                  </div>
                  <button type="button" onClick={openLocationMap} className="btn-outline text-sm w-full">
                    <FaIcon icon="fa-map" className="mr-2" />
                    Pick location on map
                  </button>
                  {form.map_latitude != null && (
                    <div className="text-xs text-slate-600 bg-white/40 rounded-lg p-2">
                      <p>
                        Pin: {form.map_latitude?.toFixed(4)}, {form.map_longitude?.toFixed(4)}
                      </p>
                      <a
                        href={googleMapsUrl(form.map_latitude, form.map_longitude)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 font-medium"
                      >
                        Preview on map
                      </a>
                    </div>
                  )}
                  <select
                    className="input-field"
                    value={form.patient_condition}
                    onChange={(e) => patch({ patient_condition: e.target.value })}
                  >
                    <option value="">Patient condition *</option>
                    {(homeConditions.length ? homeConditions : ['Bedridden', 'Can Walk', 'Post Surgery', 'Injury']).map(
                      (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                      )
                    )}
                  </select>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Special instructions (stairs, no lift...)"
                    value={form.special_instructions}
                    onChange={(e) => patch({ special_instructions: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                  <FaIcon icon="fa-gift" /> Optional upgrade
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-3">Popular rehab packages</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Multi-day programs can save you money vs. booking single sessions. You can skip and pay for this appointment only.
                </p>
              </div>

              {packagesLoading ? (
                <div className="grid gap-3 sm:grid-cols-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-36 rounded-2xl bg-slate-200" />
                  ))}
                </div>
              ) : popularPackages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No featured packages right now — continue to payment for this appointment.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {popularPackages.map((p) => (
                    <Link
                      key={p.id}
                      to={bookPackageUrl(p.slug, {
                        doctor_id: form.doctor_id || undefined,
                        pain_type: form.pain_type || undefined,
                      })}
                      className="group rounded-2xl border-2 border-slate-200 bg-white/90 p-4 hover:border-primary-400 hover:shadow-md transition text-left"
                    >
                      <p className="text-xs font-bold text-primary-600">{p.duration_days}-day program</p>
                      <p className="font-bold text-slate-900 mt-1 group-hover:text-primary-800">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.short_description}</p>
                      <p className="text-lg font-bold text-primary-700 mt-3">₹{Number(p.price).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-primary-600 font-semibold mt-2 inline-flex items-center gap-1">
                        Book package <FaIcon icon="fa-arrow-right" className="text-[10px]" />
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Link to="/packages" className="text-sm font-semibold text-primary-600 hover:underline">
                  View all treatment packages
                </Link>
                <p className="text-xs text-slate-500">Tap Continue below to skip and pay for this appointment only</p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review & Pay</h2>
              {createdAppt?.booking_id && (
                <div className="rounded-xl bg-primary-50 border border-primary-200/60 px-4 py-3">
                  <p className="text-xs text-slate-600">Your booking ID (save this)</p>
                  <p className="font-mono font-bold text-lg text-primary-800 mt-1">{createdAppt.booking_id}</p>
                </div>
              )}
              <div className="bg-white/40 rounded-xl p-4 space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">Service:</span>{' '}
                  <strong className="capitalize">{form.consultation_type?.replace('_', ' ')}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Pain:</span> {form.pain_type}
                </p>
                {form.consultation_type === 'clinic' && selectedClinic && (
                  <p>
                    <span className="text-slate-500">Clinic:</span> {selectedClinic.name}
                    {selectedClinic.address ? ` — ${selectedClinic.address}` : ''}
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Patient:</span> {form.full_name} · {form.mobile}
                </p>
                <p>
                  <span className="text-slate-500">When:</span> {form.appointment_date} at{' '}
                  {form.start_time}
                </p>
                <p>
                  <span className="text-slate-500">Sessions:</span> {form.number_of_sessions}
                </p>
                <p className="text-lg font-bold text-primary-700 pt-2">
                  Total: ₹{fee().toLocaleString('en-IN')}
                  {appliedCoupon && payNowAmount() > 0 && (
                    <span className="block text-sm font-normal text-emerald-700 mt-1">
                      After promo: pay ₹{payNowAmount().toLocaleString('en-IN')}
                    </span>
                  )}
                </p>

                {payNowAmount() > 0 && (
                  <CouponInput
                    amount={(() => {
                      const total = totalFee();
                      const opt = resolvedPaymentOption();
                      if (opt === 'partial_50') return round2(total * 0.5);
                      return round2(total);
                    })()}
                    consultationType={form.consultation_type || 'all'}
                    onApplied={setAppliedCoupon}
                    onClear={() => setAppliedCoupon(null)}
                    className="mt-4"
                  />
                )}

                {(form.consultation_type === 'clinic' || form.consultation_type === 'home_visit') && (
                  <div className="pt-3 mt-3 border-t border-white/60">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Payment method</p>

                    {form.consultation_type === 'clinic' && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => patch({ payment_option: 'pay_at_clinic' })}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            resolvedPaymentOption() === 'pay_at_clinic'
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-slate-200 bg-white/60 hover:bg-white'
                          }`}
                        >
                          <p className="font-semibold text-slate-800 text-sm">Pay at clinic</p>
                          <p className="text-xs text-slate-600 mt-0.5">No online payment now</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => patch({ payment_option: 'full_online' })}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            resolvedPaymentOption() === 'full_online'
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-slate-200 bg-white/60 hover:bg-white'
                          }`}
                        >
                          <p className="font-semibold text-slate-800 text-sm">Pay online</p>
                          <p className="text-xs text-slate-600 mt-0.5">Pay full amount via Razorpay</p>
                        </button>
                      </div>
                    )}

                    {form.consultation_type === 'home_visit' && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => patch({ payment_option: 'partial_50' })}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            resolvedPaymentOption() === 'partial_50'
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-slate-200 bg-white/60 hover:bg-white'
                          }`}
                        >
                          <p className="font-semibold text-slate-800 text-sm">Partial payment (50%)</p>
                          <p className="text-xs text-slate-600 mt-0.5">Pay 50% online, 50% at home</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => patch({ payment_option: 'full_online' })}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            resolvedPaymentOption() === 'full_online'
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-slate-200 bg-white/60 hover:bg-white'
                          }`}
                        >
                          <p className="font-semibold text-slate-800 text-sm">Pay full online</p>
                          <p className="text-xs text-slate-600 mt-0.5">Pay 100% via Razorpay</p>
                        </button>
                      </div>
                    )}

                    <div className="mt-3 rounded-xl border border-slate-200 bg-white/60 px-3 py-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Pay now</span>
                        <span className="font-semibold text-slate-800">₹{payNowAmount()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-600">
                          Pay later {resolvedPaymentOption() === 'pay_at_clinic' ? '(at clinic)' : resolvedPaymentOption() === 'partial_50' ? '(at home)' : ''}
                        </span>
                        <span className="font-semibold text-slate-800">₹{payLaterAmount()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <BookingPolicyAcceptance acceptance={policyAcceptance} onChange={setPolicyAcceptance} />

              {createdAppt?.google_meet_link && (
                <p className="text-sm text-green-800">
                  Meet link:{' '}
                  <a href={createdAppt.google_meet_link} className="underline" target="_blank" rel="noreferrer">
                    {createdAppt.google_meet_link}
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-100">
            {step > 0 && (
              <button type="button" onClick={back} className="btn-outline w-full sm:w-auto sm:min-w-[120px]">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary w-full sm:w-auto sm:min-w-[140px] sm:ml-auto">
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBookAndPay}
                disabled={submitting || !policiesOk}
                className="btn-primary w-full sm:w-auto sm:min-w-[180px] sm:ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                title={!policiesOk ? 'Accept all policies first' : undefined}
              >
                {submitting
                  ? 'Processing...'
                  : payNowAmount() > 0
                    ? `Pay ₹${payNowAmount()} with Razorpay`
                    : 'Confirm booking'}
              </button>
            )}
          </div>
        </div>
      </div>

      <LocationMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={form.map_latitude}
        initialLng={form.map_longitude}
        onConfirm={handleMapConfirm}
      />
    </div>
  );
}
