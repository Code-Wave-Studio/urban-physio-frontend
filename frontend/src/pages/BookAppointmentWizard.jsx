import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import toast from 'react-hot-toast';
import { openRazorpayCheckout, handlePaymentError } from '../utils/razorpayCheckout';
import BookingPolicyAcceptance, {
  allPoliciesAccepted,
  emptyPolicyAcceptance,
} from '../components/booking/BookingPolicyAcceptance';
import BookingStepProgress from '../components/booking/BookingStepProgress';
import BookingProviderSelectStep from '../components/booking/BookingProviderSelectStep';
import BookingScheduleStep, {
  CUSTOM_PACKAGE_ID,
  SINGLE_PACKAGE_ID,
  adminPackageKey,
  parsePackageKey,
} from '../components/booking/BookingScheduleStep';
import BookingChiefComplaintStep from '../components/booking/BookingChiefComplaintStep';
import BookingPersonalDetailsStep from '../components/booking/BookingPersonalDetailsStep';
import { POLICY_LAST_UPDATED } from '../constants/policyPages';
import { matchPainTypeLabel, matchHomeConditionLabel } from '../utils/bookUrl';
import { applyPatientProfileToBooking } from '../utils/patientBookingPrefill';
import CouponInput from '../components/platform/CouponInput';

const STEPS = [
  'Service Type',
  'Doctor & Clinic',
  'Package & Schedule',
  'Chief Complaint',
  'Your Details',
  'Payment',
];

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
  pain_area: '',
  pain_description: '',
  pain_duration: '',
  pain_level: '',
  medical_history: '',
  additional_notes: '',
  package_label: 'Single Visit',
  doctor_id: '',
  clinic_id: '',
  full_name: '',
  mobile: '',
  email: '',
  age: '',
  gender: '',
  patient_address: '',
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
  const { city, coords, loading: locLoading, setShowSelector } = useLocation();
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
  const [sortFilters, setSortFilters] = useState([]);
  const [specializationFilters, setSpecializationFilters] = useState([]);
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
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [specialization, setSpecialization] = useState('all');
  const [packageId, setPackageId] = useState(SINGLE_PACKAGE_ID);
  const [adminPackages, setAdminPackages] = useState([]);
  const [doctorPackages, setDoctorPackages] = useState([]);
  const [selectedDoctorPackage, setSelectedDoctorPackage] = useState(null);
  const [scheduleSessions, setScheduleSessions] = useState([{ date: '', time: '' }]);
  const [slotsCache, setSlotsCache] = useState({});
  const [slotsLoadingDate, setSlotsLoadingDate] = useState('');
  const [onlineStateId, setOnlineStateId] = useState('');
  const [indianStates, setIndianStates] = useState([]);

  const prefillSlotTime = searchParams.get('start_time') || searchParams.get('slot') || searchParams.get('time') || '';
  const prefillDate = searchParams.get('date') || '';
  const prefillPackageId = searchParams.get('package_id') || '';
  const prefillTreatmentPackageId = searchParams.get('treatment_package_id') || '';
  const isEmergency = searchParams.get('emergency') === '1';
  const [emergencyCtx, setEmergencyCtx] = useState(null);
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
    if (isEmergency && emergencyCtx?.fees?.total != null) {
      return Number(emergencyCtx.fees.total);
    }
    if (selectedDoctorPackage) {
      const p = selectedDoctorPackage.discount_price ?? selectedDoctorPackage.price;
      if (p != null) return Number(p);
    }
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
    if (!isEmergency) return;
    try {
      const raw = sessionStorage.getItem('emergency_booking_context');
      if (!raw) return;
      const ctx = JSON.parse(raw);
      setEmergencyCtx(ctx);
      patch({
        consultation_type: ctx.emergency_type || form.consultation_type,
        full_name: ctx.full_name || '',
        mobile: ctx.mobile || '',
        email: ctx.email || '',
        pain_type: ctx.pain_area || '',
        pain_description: ctx.pain_description || '',
        full_address: ctx.full_address || '',
        patient_address: ctx.full_address || '',
        map_latitude: ctx.latitude ?? null,
        map_longitude: ctx.longitude ?? null,
        ...(ctx.clinic_id ? { clinic_id: String(ctx.clinic_id) } : {}),
      });
      if (doctorIdParam) {
        setStep(2);
        setPackageId(SINGLE_PACKAGE_ID);
      }
    } catch {
      /* ignore invalid session payload */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmergency, doctorIdParam]);

  useEffect(() => {
    if (form.consultation_type === 'online') {
      booking
        .onlineStates({ consultation_type: 'online' })
        .then((res) => setIndianStates(res.data || []))
        .catch(() => location.states().then((r) => setIndianStates(r.data || [])).catch(() => {}));
    } else {
      location.states().then((res) => setIndianStates(res.data || [])).catch(() => {});
    }
  }, [form.consultation_type]);

  useEffect(() => {
    if (!form.doctor_id) {
      setAdminPackages([]);
      setDoctorPackages([]);
      return;
    }
    booking
      .doctorPackages(form.doctor_id, { consultation_type: form.consultation_type || undefined })
      .then((res) => {
        const data = res?.data ?? res;
        setAdminPackages(data?.admin_packages || []);
        setDoctorPackages(data?.doctor_packages || []);
      })
      .catch(() => {
        setAdminPackages([]);
        setDoctorPackages([]);
      });
  }, [form.doctor_id, form.consultation_type]);

  useEffect(() => {
    if (prefillTreatmentPackageId && adminPackages.length) {
      const pkg = adminPackages.find((p) => String(p.id) === String(prefillTreatmentPackageId));
      if (pkg) {
        const key = adminPackageKey(pkg.id);
        setPackageId(key);
        setSelectedDoctorPackage({ ...pkg, package_source: 'admin' });
        const n = pkg.total_sessions || 1;
        setScheduleSessions(
          Array.from({ length: n }, (_, i) =>
            i === 0 && prefillDate ? { date: prefillDate, time: prefillSlotTime || '' } : { date: '', time: '' }
          )
        );
        patch({
          number_of_sessions: n,
          package_label: pkg.name,
          treatment_package_id: pkg.id,
          doctor_package_id: '',
        });
      }
    } else if (prefillPackageId && doctorPackages.length) {
      const pkg = doctorPackages.find((p) => String(p.id) === String(prefillPackageId));
      if (pkg) {
        const key = `doctor-${pkg.id}`;
        setPackageId(key);
        setSelectedDoctorPackage(pkg);
        const n = pkg.total_sessions || 1;
        setScheduleSessions(
          Array.from({ length: n }, (_, i) =>
            i === 0 && prefillDate ? { date: prefillDate, time: prefillSlotTime || '' } : { date: '', time: '' }
          )
        );
        patch({ number_of_sessions: n, package_label: pkg.name, doctor_package_id: pkg.id, treatment_package_id: '' });
      }
    } else if (prefillDate) {
      setScheduleSessions([{ date: prefillDate, time: prefillSlotTime || '' }]);
    }
  }, [prefillPackageId, prefillTreatmentPackageId, prefillDate, prefillSlotTime, adminPackages, doctorPackages]);

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
    const t = searchParams.get('type');
    if (!doctorIdParam || isEmergency) return;
    if (t && ['online', 'clinic', 'home_visit'].includes(t)) {
      setStep((s) => (s === 0 ? 2 : s));
    }
  }, [doctorIdParam, searchParams, isEmergency]);

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
        setSortFilters(d?.sort_filters || []);
        setSpecializationFilters(d?.specialization_filters || []);
      })
      .catch(() => {
        setPainTypes(['Back Pain', 'Neck Pain', 'Knee Pain', 'Shoulder Pain', 'Other']);
        setHomeConditions(['Bedridden', 'Can Walk', 'Post Surgery', 'Injury']);
      });
  }, []);

  const loadProvidersForLocation = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const params = {
        consultation_type: form.consultation_type || undefined,
        search: providerSearch || undefined,
        sort: sortBy,
        specialization,
        limit: 40,
      };
      if (form.consultation_type === 'online') {
        if (onlineStateId) params.state_id = onlineStateId;
      } else {
        if (coords?.lat != null) {
          params.lat = coords.lat;
          params.lng = coords.lng;
        }
        if (city?.id) params.city_id = city.id;
      }
      const res = await booking.searchProviders(params);
      let docs = res.data?.doctors || [];
      let clins = res.data?.clinics || [];

      if (docs.length === 0 && city?.id) {
        const fallback = await doctors.list({ verified: 1, city_id: city.id });
        docs = fallback.data || [];
      }
      if (clins.length === 0 && city?.id && form.consultation_type === 'clinic') {
        const clinRes = await clinics.list({ city_id: city.id });
        clins = clinRes.data || [];
      }

      if (selectedDoctor) docs = mergeDoctorIntoList(docs, selectedDoctor);
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
  }, [coords, city, form.consultation_type, form.doctor_id, lockedDoctor, selectedDoctor, providerSearch, sortBy, specialization, onlineStateId]);

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
        patch((f) => applyPatientProfileToBooking(f, p));
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

  const loadSlotsForDate = useCallback(
    (date) => {
      if (!date) return;
      if (form.consultation_type === 'clinic') {
        if (!form.clinic_id) return;
      } else if (!form.doctor_id) {
        return;
      }
      if (slotsCache[date]) return;
      setSlotsLoadingDate(date);
      const req =
        form.consultation_type === 'clinic'
          ? form.doctor_id
            ? booking.slotsForClinic(form.doctor_id, form.clinic_id, date)
            : booking.slots(null, date, form.clinic_id)
          : booking.slots(form.doctor_id, date);
      req
        .then((res) => {
          setSlotsCache((prev) => ({ ...prev, [date]: res.data || [] }));
        })
        .catch(() => {
          setSlotsCache((prev) => ({ ...prev, [date]: [] }));
        })
        .finally(() => setSlotsLoadingDate(''));
    },
    [form.doctor_id, form.clinic_id, form.consultation_type, slotsCache]
  );

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
    if (step !== 2) return;
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
    if (step === 2) loadSlots();
  }, [step, loadSlots]);

  useEffect(() => {
    loadAvailableDates();
  }, [loadAvailableDates]);

  const fee = totalFee;

  useEffect(() => {
    if (prefillSlotTime && timeSlots.some((s) => s.time === prefillSlotTime)) {
      patch({ start_time: prefillSlotTime });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillSlotTime, timeSlots]);

  const handlePackageChange = (id, pkg = null) => {
    setPackageId(id);
    if (id === SINGLE_PACKAGE_ID) {
      setSelectedDoctorPackage(null);
      setScheduleSessions([{ date: '', time: '' }]);
      patch({ number_of_sessions: 1, package_label: 'Single Visit', doctor_package_id: '', treatment_package_id: '' });
      return;
    }
    if (id === CUSTOM_PACKAGE_ID) {
      setSelectedDoctorPackage(null);
      setScheduleSessions([{ date: '', time: '' }]);
      patch({ number_of_sessions: 1, package_label: 'Flexible consultation', doctor_package_id: '', treatment_package_id: '' });
      return;
    }
    const sessions = pkg?.total_sessions || pkg?.duration_days || 1;
    setSelectedDoctorPackage(pkg);
    setScheduleSessions(Array.from({ length: sessions }, () => ({ date: '', time: '' })));
    const parsed = parsePackageKey(id);
    if (parsed.source === 'admin') {
      patch({
        number_of_sessions: sessions,
        package_label: pkg?.name || 'Admin package',
        treatment_package_id: parsed.id,
        doctor_package_id: '',
      });
    } else {
      patch({
        number_of_sessions: sessions,
        package_label: pkg?.name || 'Doctor package',
        doctor_package_id: parsed.id || pkg?.id,
        treatment_package_id: '',
      });
    }
  };

  const validateStep = (s) => {
    if (s === 0 && !form.consultation_type) {
      toast.error('Select a service type');
      return false;
    }
    if (s === 1) {
      if (form.consultation_type !== 'online' && !doctorIdParam && !city && !coords) {
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
    if (s === 2) {
      const incomplete = scheduleSessions.find((sess) => !sess.date || !sess.time);
      if (incomplete) {
        toast.error('Complete date and time for every session');
        return false;
      }
      if (packageId !== CUSTOM_PACKAGE_ID && scheduleSessions.length < (form.number_of_sessions || 1)) {
        toast.error('Select all required session dates');
        return false;
      }
      const first = scheduleSessions[0];
      patch({ appointment_date: first.date, start_time: first.time });
    }
    if (s === 3) {
      if (!form.pain_type) {
        toast.error('Select pain area');
        return false;
      }
      if (!form.pain_description?.trim()) {
        toast.error('Describe your symptoms');
        return false;
      }
    }
    if (s === 4) {
      const req = ['full_name', 'mobile', 'email', 'age', 'gender'];
      for (const k of req) {
        if (!String(form[k] ?? '').trim()) {
          toast.error('Fill all personal details');
          return false;
        }
      }
      if (form.consultation_type === 'online') {
        if (!form.device_type || !form.internet_quality || !form.preferred_language) {
          toast.error('Complete online consultation details');
          return false;
        }
      }
      if (form.consultation_type === 'home_visit') {
        const hasEmergencyAddress = isEmergency && emergencyCtx?.full_address?.trim();
        if (!hasEmergencyAddress && (!form.full_address || !form.pincode || !form.city || !form.patient_condition)) {
          toast.error('Complete home visit address details');
          return false;
        }
        if (!hasEmergencyAddress && (form.map_latitude == null || form.map_longitude == null)) {
          toast.error('Capture GPS location for home visit');
          return false;
        }
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step === 1 && form.doctor_id) {
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
      .catch(() =>
        toast.error('Map pin saved, but we could not detect your city. Please select it manually.')
      );
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
      setStep(2);
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
        schedule_sessions: scheduleSessions.map((s) => ({ date: s.date, start_time: s.time, time: s.time })),
        ...(selectedDoctorPackage?.package_source === 'admin' && form.treatment_package_id
          ? { treatment_package_id: Number(form.treatment_package_id) }
          : {}),
        ...(selectedDoctorPackage?.package_source === 'doctor' && form.doctor_package_id
          ? { doctor_package_id: Number(form.doctor_package_id) }
          : {}),
        ...(isEmergency && emergencyCtx
          ? {
              is_emergency: true,
              emergency_type: emergencyCtx.emergency_type,
              emergency_level: emergencyCtx.emergency_level,
              eta_minutes: emergencyCtx.eta_minutes ?? 15,
              latitude: emergencyCtx.latitude,
              longitude: emergencyCtx.longitude,
            }
          : {}),
      };
      if (appliedCoupon?.code) payload.coupon_code = appliedCoupon.code;
      const res = await appointments.book(payload);
      const appt = res.data;
      setCreatedAppt(appt);
      if (isEmergency) {
        sessionStorage.removeItem('emergency_booking_context');
      }
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
        setStep(2);
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {isEmergency ? 'Emergency Booking' : 'Book Appointment'}
          </h1>
          <p className="text-slate-600 text-sm mt-1">{STEPS[step]}</p>
        </div>

        {isEmergency && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-900">
            <FaIcon icon="fa-truck-medical" className="text-red-600 mt-0.5 shrink-0" />
            <p>
              Emergency request — complete schedule, details, and payment below.
              {emergencyCtx?.fees?.total != null && (
                <span className="block mt-1 font-semibold">Emergency total: ₹{Number(emergencyCtx.fees.total).toLocaleString('en-IN')}</span>
              )}
            </p>
          </div>
        )}

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
            <BookingProviderSelectStep
              form={form}
              patch={patch}
              consultationType={form.consultation_type}
              city={city}
              coords={coords}
              onSelectLocation={() => setShowSelector(true)}
              onlineStateId={onlineStateId}
              onOnlineStateChange={setOnlineStateId}
              indianStates={indianStates}
              doctors={doctorsForType}
              clinics={clinicList}
              clinicDoctors={clinicDoctors}
              selectedDoctor={selectedDoctor}
              setSelectedDoctor={setSelectedDoctor}
              loading={doctorsLoading || locLoading}
              lockedDoctor={lockedDoctor}
              lockedClinic={lockedClinic}
              selectedClinic={selectedClinic}
              clinicMapUrl={clinicMapUrl}
              searchQuery={providerSearch}
              onSearchChange={setProviderSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              specialization={specialization}
              onSpecializationChange={setSpecialization}
              onRefresh={loadProvidersForLocation}
              sortFilters={sortFilters}
              specializationFilters={specializationFilters}
            />
          )}

          {step === 2 && (
            <BookingScheduleStep
              form={form}
              patch={patch}
              adminPackages={adminPackages}
              doctorPackages={doctorPackages}
              selectedPackageId={packageId}
              onPackageChange={handlePackageChange}
              scheduleSessions={scheduleSessions}
              onScheduleChange={setScheduleSessions}
              availableDates={availableDates}
              availableDatesLoading={availableDatesLoading}
              loadSlotsForDate={loadSlotsForDate}
              slotsCache={slotsCache}
              slotsLoadingDate={slotsLoadingDate}
            />
          )}

          {step === 3 && (
            <BookingChiefComplaintStep form={form} patch={patch} painTypes={painTypes} />
          )}

          {step === 4 && (
            <BookingPersonalDetailsStep
              form={form}
              patch={patch}
              consultationType={form.consultation_type}
              sessions={sessions}
              homeConditions={homeConditions}
              onOpenMap={openLocationMap}
              uploading={uploading}
              onReportUpload={handleReportUpload}
            />
          )}

          {step === 5 && (
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
                  <span className="text-slate-500">Package:</span> {form.package_label || 'Single Visit'} ({form.number_of_sessions} visit{form.number_of_sessions > 1 ? 's' : ''})
                </p>
                <p>
                  <span className="text-slate-500">Pain:</span> {form.pain_type}
                  {form.pain_duration ? ` · ${form.pain_duration}` : ''}
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

              <p className="text-xs text-slate-500 text-center">
                Looking for multi-day rehab programs?{' '}
                <a href="/packages" className="text-primary-600 font-semibold hover:underline">
                  Browse treatment packages
                </a>
              </p>

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
