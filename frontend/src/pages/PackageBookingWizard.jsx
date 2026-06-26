import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import BookingStepProgress from '../components/booking/BookingStepProgress';
import LocationDoctorsBanner from '../components/booking/LocationDoctorsBanner';
import DoctorSelectCards from '../components/booking/DoctorSelectCards';
import { treatmentPackages } from '../services/api';
import { useLocationDoctors } from '../hooks/useLocationDoctors';
import toast from 'react-hot-toast';
import { formatPackagePrice, perSessionPrice } from '../utils/packageHelpers';

const STEPS = ['Package', 'Physiotherapist'];

const FALLBACK_PACKAGES = {
  '10-day-recovery': { id: 1, slug: '10-day-recovery', name: '10-Day Recovery Package', duration_days: 10, total_sessions: 10, price: 4999 },
  '15-day-rehab': { id: 2, slug: '15-day-rehab', name: '15-Day Rehab Package', duration_days: 15, total_sessions: 15, price: 7499 },
  '30-day-complete-care': { id: 3, slug: '30-day-complete-care', name: '30-Day Complete Care', duration_days: 30, total_sessions: 30, price: 12999 },
};

export default function PackageBookingWizard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const { doctorList, loading: doctorsLoading, city, hasLocation, setShowSelector } = useLocationDoctors();
  const [form, setForm] = useState({ doctor_id: '' });

  const patch = (updates) => setForm((f) => ({ ...f, ...updates }));

  useEffect(() => {
    setLoading(true);
    treatmentPackages
      .get(slug)
      .then((res) => res.data ?? res)
      .then((p) => {
        if (!p) throw new Error('not found');
        setPkg(p);
      })
      .catch(() => {
        const fallback = FALLBACK_PACKAGES[slug];
        if (fallback) setPkg(fallback);
        else {
          toast.error('Package not found');
          navigate('/packages', { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  useEffect(() => {
    if (form.doctor_id && !doctorList.some((d) => String(d.id) === String(form.doctor_id))) {
      patch({ doctor_id: '' });
    }
  }, [doctorList, form.doctor_id]);

  const selectedDoctor = useMemo(
    () => doctorList.find((d) => String(d.id) === String(form.doctor_id)),
    [doctorList, form.doctor_id]
  );

  const next = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (!hasLocation) {
      toast.error('Please select your location first');
      setShowSelector(true);
      return;
    }
    if (!form.doctor_id) {
      toast.error('Please select a physiotherapist');
      return;
    }
    const type =
      pkg.consultation_type && pkg.consultation_type !== 'any'
        ? pkg.consultation_type
        : 'clinic';
    navigate(
      `/doctors/${form.doctor_id}/book?type=${encodeURIComponent(type)}&treatment_package_id=${pkg.id}`
    );
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 text-sm mt-4">Loading package…</p>
        </div>
      </div>
    );
  }

  if (!pkg) return null;

  const perSession = perSessionPrice(pkg.price, pkg.total_sessions);

  return (
    <div className="page-enter min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-slate-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <Link to="/packages" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-orange-700 mb-6">
          <FaIcon icon="fa-arrow-left" /> Back to packages
        </Link>

        <BookingStepProgress steps={STEPS} currentStep={step} accent="orange" />

        <div className="glass-strong rounded-2xl md:rounded-3xl p-5 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">{pkg.duration_days}-Day Program</span>
                <h1 className="text-2xl font-bold text-slate-800 mt-1">{pkg.name}</h1>
                <p className="text-sm text-slate-600 mt-2">{pkg.short_description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{pkg.total_sessions}</p>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold">Sessions</p>
                </div>
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{pkg.duration_days}</p>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold">Days</p>
                </div>
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                  <p className="text-lg font-bold text-orange-700">{formatPackagePrice(perSession)}</p>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold">Per session</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 rounded-xl bg-slate-50 border border-slate-200 p-3">
                After choosing your physiotherapist, you will complete the full booking flow — package schedule, complaint details, and payment — with your doctor&apos;s own price for this package.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">Choose your physiotherapist</h2>
              <LocationDoctorsBanner
                city={city}
                hasLocation={hasLocation}
                onSelectLocation={() => setShowSelector(true)}
                accent="orange"
              />

              {doctorsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-sm">
                  <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  Loading doctors near you…
                </div>
              ) : (
                <DoctorSelectCards
                  doctors={doctorList}
                  selectedId={form.doctor_id}
                  onSelect={(id) => patch({ doctor_id: id })}
                  disabled={!hasLocation}
                  accent="orange"
                  emptyMessage={
                    hasLocation
                      ? `No physiotherapists found in ${city?.name || 'your area'}. Try another city.`
                      : 'Select your city to see available doctors.'
                  }
                />
              )}

              {selectedDoctor && (
                <p className="text-sm text-slate-600">
                  Selected: <strong>Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</strong>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-100">
            {step > 0 ? (
              <button type="button" onClick={back} className="btn-outline w-full sm:w-auto sm:min-w-[120px]">
                Back
              </button>
            ) : (
              <div className="hidden sm:block sm:flex-1" />
            )}
            <button
              type="button"
              onClick={next}
              disabled={step === 1 && (!hasLocation || doctorsLoading)}
              className="btn-primary w-full sm:w-auto sm:min-w-[180px] sm:ml-auto disabled:opacity-50"
            >
              {step === 0 ? 'Continue' : 'Continue to full booking'}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
