import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LocationSelector from '../components/LocationSelector';
import DoctorCard from '../components/DoctorCard';
import ClinicCard from '../components/ClinicCard';
import FaIcon from '../components/FaIcon';
import StatsCounter from '../components/StatsCounter';
import PainSelectionSection from '../components/home/PainSelectionSection';
import EmergencyCareSection from '../components/home/EmergencyCareSection';
import FaqSection from '../components/FaqSection';
import ExercisesSection from '../components/home/ExercisesSection';
import PackagesSection from '../components/home/PackagesSection';
import PhysioFeedSection from '../components/home/PhysioFeedSection';
import GlobalSearch from '../components/GlobalSearch';
import { useLocation } from '../contexts/LocationContext';
import { treatments, conditions } from '../services/api';
import { SITE_FAQS } from '../constants/supportPages';

const SERVICES = [
  { title: 'Online Consultation', desc: 'HD video sessions via Jitsi Meet from your home', icon: 'fa-video', color: 'from-orange-400/20 to-amber-400/20', iconColor: 'text-orange-600', link: '/book?type=online', linkLabel: 'Book' },
  { title: 'Clinic Visit', desc: 'Premium partner clinics with modern equipment', icon: 'fa-hospital', color: 'from-emerald-400/20 to-teal-400/20', iconColor: 'text-emerald-600', link: '/clinics', linkLabel: 'Find Clinic' },
  { title: 'Home Visit', desc: 'Licensed physiotherapist at your doorstep', icon: 'fa-house-medical', color: 'from-amber-400/20 to-orange-400/20', iconColor: 'text-orange-600', link: '/book?type=home_visit', linkLabel: 'Book' },
];

const STEPS = [
  { step: '01', title: 'Set Location', desc: 'Auto-detect or pick your city across India', icon: 'fa-location-dot' },
  { step: '02', title: 'Choose Doctor', desc: 'Browse verified physios near you with ratings', icon: 'fa-user-doctor' },
  { step: '03', title: 'Book & Pay', desc: 'Pick slot, pay securely via Razorpay', icon: 'fa-credit-card' },
  { step: '04', title: 'Get Treatment', desc: 'Online, clinic, or home — your choice', icon: 'fa-hand-holding-medical' },
];

const HERO_FEATURES = [
  { label: 'Online Meet', icon: 'fa-video' },
  { label: 'Clinic Visit', icon: 'fa-hospital' },
  { label: 'Home Care', icon: 'fa-house-medical' },
  { label: 'Rehab Plans', icon: 'fa-notes-medical' },
];

const WHY_US = [
  { title: 'Verified Experts', desc: 'Every doctor is license-verified by our admin team', icon: 'fa-circle-check', iconColor: 'text-emerald-600' },
  { title: 'Pan-India Network', desc: 'Mumbai, Delhi, Bangalore, Pune & expanding', icon: 'fa-map-location-dot', iconColor: 'text-orange-500' },
  { title: 'Flexible Care', desc: 'Online, clinic & home visits in one platform', icon: 'fa-arrows-rotate', iconColor: 'text-orange-600' },
  { title: 'Secure Payments', desc: 'Razorpay-powered with instant invoices', icon: 'fa-lock', iconColor: 'text-orange-700' },
];

const TESTIMONIALS = [
  { name: 'Rahul M.', city: 'Mumbai', text: 'Recovered from back pain in 4 weeks. Online sessions were super convenient!', rating: 5 },
  { name: 'Priya S.', city: 'Pune', text: 'Best physiotherapy app in India. Home visit feature is a game changer.', rating: 5 },
  { name: 'Amit K.', city: 'Delhi', text: 'Professional doctors, transparent pricing. Highly recommend Urban Physio.', rating: 5 },
];

const HOME_FAQS = SITE_FAQS.slice(0, 6);

const HERO_IMG = `${import.meta.env.BASE_URL}hero-illustration.svg`;

export default function Home() {
  const {
    nearbyDoctors,
    nearbyClinics,
    loading,
    detectingGps,
    requestGeolocation,
    refreshLocation,
    city,
    locationLabel,
    setShowSelector,
  } = useLocation();
  const [treatmentList, setTreatmentList] = useState([]);
  const [conditionList, setConditionList] = useState([]);
  const [heroImgOk, setHeroImgOk] = useState(true);
  const areaName = locationLabel || city?.name;

  useEffect(() => {
    treatments.list().then((res) => setTreatmentList((res.data || []).slice(0, 3))).catch(() => {});
    conditions.list().then((res) => setConditionList((res.data || []).slice(0, 3))).catch(() => {});
  }, []);

  const defaultTreatments = [
    { id: 1, title: 'Back Pain', slug: 'back-pain', short_description: 'Lower & upper back rehabilitation', icon: 'fa-bone' },
    { id: 2, title: 'Neck Pain', slug: 'neck-pain', short_description: 'Cervical pain & tech neck relief', icon: 'fa-head-side-virus' },
    { id: 3, title: 'Knee Pain', slug: 'knee-pain', short_description: 'ACL, meniscus & arthritis rehab', icon: 'fa-person-walking' },
  ];

  const displayTreatments = treatmentList.length
    ? treatmentList.map((t, i) => ({ ...t, icon: defaultTreatments[i % 3].icon }))
    : defaultTreatments;

  const defaultConditions = [
    { id: 1, title: 'ACL Injury Rehabilitation', slug: 'acl-injury', description: 'Post-surgical ACL rehab program', category: 'injury', icon: 'fa-person-running' },
    { id: 2, title: 'Rotator Cuff Injury', slug: 'rotator-cuff', description: 'Shoulder rehab for tears & impingement', category: 'injury', icon: 'fa-hand' },
    { id: 3, title: 'Post-Stroke Rehabilitation', slug: 'post-stroke', description: 'Neurological physiotherapy for recovery', category: 'rehab', icon: 'fa-brain' },
  ];

  const conditionIcons = ['fa-person-running', 'fa-hand', 'fa-brain'];
  const displayConditions = conditionList.length
    ? conditionList.map((c, i) => ({ ...c, icon: conditionIcons[i % 3] }))
    : defaultConditions;

  return (
    <div className="relative overflow-x-hidden page-enter">
      <Navbar />
      <LocationSelector />

      <div className="mesh-blob w-96 h-96 bg-blue-500 -top-48 -right-48 animate-pulse-soft hidden md:block" />
      <div className="mesh-blob w-80 h-80 bg-orange-400 bottom-1/3 -left-40 animate-float hidden md:block" />

      {/* HERO — modern blue + orange */}
      <section className="relative flex items-center overflow-hidden py-10 pb-16 md:py-20 md:pb-24">
        <div className="hero-section-bg" aria-hidden>
          <span className="hero-orb hero-orb--blue" />
          <span className="hero-orb hero-orb--orange" />
          <span className="hero-orb hero-orb--sky" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-[1] w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center w-full">
            <div className="animate-slide-up text-white text-center md:text-left">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-blue-300/25 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6 text-blue-50 shadow-lg shadow-blue-950/20">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-orange-500 text-white text-[10px]">
                  <FaIcon icon="fa-heart-pulse" />
                </span>
                #1 Physio Platform in India
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[3.35rem] font-bold leading-[1.1] tracking-tight text-white drop-shadow-sm">
                Heal Faster with{' '}
                <span className="bg-gradient-to-r from-sky-200 via-blue-100 to-orange-300 bg-clip-text text-transparent">
                  Premium Care
                </span>
              </h1>
              <p className="mt-4 md:mt-6 text-sm md:text-lg text-blue-100/90 max-w-xl leading-relaxed mx-auto md:mx-0">
                Access trusted physiotherapists nationwide — online sessions, partner clinics, and home treatments in one place.
              </p>

              <div className="mt-6 md:mt-8 hero-search-shell">
                <div className="rounded-xl sm:rounded-2xl bg-slate-950/20 backdrop-blur-sm p-0.5">
                  <GlobalSearch variant="hero" />
                </div>
              </div>

              {city && (
                <p className="mt-4 flex justify-center md:justify-start">
                  <span className="bg-blue-500/15 backdrop-blur-md border border-blue-400/30 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-sky-100 shadow-lg shadow-blue-950/15">
                    <FaIcon icon="fa-location-dot" className="text-orange-300 text-xs" />
                    Near {areaName}
                  </span>
                </p>
              )}

              <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                {HERO_FEATURES.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-blue-100/90 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm"
                  >
                    <FaIcon icon={t.icon} className="text-orange-300 text-[10px]" />
                    {t.label}
                  </span>
                ))}
              </div>

              {heroImgOk && (
                <div className="md:hidden mt-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/30 to-orange-500/25 rounded-full blur-2xl" />
                    <img
                      src={HERO_IMG}
                      alt=""
                      className="relative max-h-40 w-auto object-contain drop-shadow-2xl"
                      onError={() => setHeroImgOk(false)}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 md:mt-9 flex flex-col sm:flex-row flex-wrap gap-2.5 md:gap-3 justify-center md:justify-start">
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-5 py-3 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base shadow-xl shadow-orange-900/30 transition"
                >
                  Book Appointment
                  <FaIcon icon="fa-calendar-check" className="text-sm" />
                </Link>
                <Link
                  to="/doctors"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 md:px-8 md:py-3.5 text-sm md:text-base rounded-xl font-semibold text-white bg-blue-500/20 border border-blue-400/35 backdrop-blur-md hover:bg-blue-500/30 transition"
                >
                  Find Doctor
                  <FaIcon icon="fa-user-doctor" className="text-sm text-sky-200" />
                </Link>
                <Link
                  to="/clinics"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 md:px-8 md:py-3.5 text-sm md:text-base rounded-xl font-semibold text-white bg-white/10 border border-orange-300/35 backdrop-blur-md hover:bg-orange-500/20 transition"
                >
                  Find Clinic
                  <FaIcon icon="fa-hospital" className="text-sm text-orange-200" />
                </Link>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center animate-fade-in h-full" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full max-h-[540px] flex items-center justify-center">
                <div className="absolute -inset-8 bg-gradient-to-br from-blue-500/35 via-sky-400/20 to-orange-500/30 rounded-full blur-3xl" />
                <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-[2px]" aria-hidden />
                {heroImgOk ? (
                  <img
                    src={HERO_IMG}
                    alt="Physiotherapy care illustration"
                    className="relative w-full max-w-md lg:max-w-lg max-h-[500px] object-contain drop-shadow-2xl animate-float"
                    onError={() => setHeroImgOk(false)}
                  />
                ) : (
                <div className="glass-hero-panel p-8 relative w-full max-w-md">
                  <div className="absolute -top-4 -right-4 w-28 h-28 bg-orange-500/25 rounded-full blur-2xl" />
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/25 rounded-full blur-2xl" />
                  <div className="space-y-4 relative">
                    <div className="glass-dark rounded-2xl p-5 flex items-center gap-4 border border-blue-400/20">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/40 to-orange-500/40 flex items-center justify-center">
                        <FaIcon icon="fa-stethoscope" className="text-2xl text-sky-100" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Expert Physiotherapists</p>
                        <p className="text-blue-200/90 text-sm">Sports · Ortho · Neuro · Spine</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {HERO_FEATURES.map((t) => (
                        <div key={t.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/15 text-center hover:border-orange-400/30 transition-colors">
                          <FaIcon icon={t.icon} className="text-xl text-orange-300 mb-2" />
                          <p className="text-white font-medium text-sm">{t.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 hidden sm:block pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-8 md:h-auto">
            <path d="M0 40L60 35C120 30 240 20 360 18.7C480 17 600 23 720 28C840 33 960 37 1080 35C1200 33 1320 25 1380 21.7L1440 18.7V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V40Z" fill="url(#heroWave)" fillOpacity="0.95" />
            <defs>
              <linearGradient id="heroWave" x1="0" y1="0" x2="1440" y2="80">
                <stop stopColor="#eff6ff" />
                <stop offset="0.5" stopColor="#fff7ed" />
                <stop offset="1" stopColor="#f8fafc" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      <EmergencyCareSection />

      <PainSelectionSection />

      <StatsCounter />

      {/* SERVICES — anchor for Pain Selection “Book appointment” */}
      <section id="book-care" className="max-w-7xl mx-auto px-4 section-pad">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="section-title">Choose How You Want to Receive Care</h2>
          <p className="section-subtitle mx-auto mt-2">Online · Clinic · Home visit</p>
        </div>
        <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-8 stagger-children">
          {SERVICES.map((f) => (
            <div key={f.title} className={`mobile-scroll-item glass-card text-center bg-gradient-to-br ${f.color} p-4 md:p-6`}>
              <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 rounded-xl bg-white/60 flex items-center justify-center ${f.iconColor}`}>
                <FaIcon icon={f.icon} className="text-2xl md:text-3xl" />
              </div>
              <h3 className="font-bold text-base md:text-xl text-slate-800">{f.title}</h3>
              <p className="text-slate-600 mt-2 text-xs md:text-base line-clamp-2">{f.desc}</p>
              <Link to={f.link || '/book'} className="inline-flex items-center gap-1 mt-3 text-primary-600 font-semibold text-sm">
                {f.linkLabel || 'Book'} <FaIcon icon="fa-arrow-right" className="text-xs" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-pad relative px-4">
        <div className="absolute inset-0 glass opacity-50 rounded-2xl md:rounded-3xl max-w-6xl mx-auto left-3 right-3 md:left-auto md:right-auto" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-6 md:mb-14">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle mx-auto mt-2">Get started with expert care in under 2 minutes</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 stagger-children">
            {STEPS.map((s) => (
              <div key={s.step} className="glass-card relative overflow-hidden p-3 md:p-6">
                <span className="absolute -top-1 -right-1 text-4xl md:text-6xl font-black text-primary-100/80">{s.step}</span>
                <div className="relative">
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary-600/90 text-white flex items-center justify-center mb-2 md:mb-4">
                    <FaIcon icon={s.icon} className="text-sm md:text-lg" />
                  </div>
                  <h3 className="font-bold text-sm md:text-lg text-slate-800">{s.title}</h3>
                  <p className="text-slate-600 text-xs mt-1 line-clamp-2 hidden sm:block">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS */}
      <section id="doctors" className="max-w-7xl mx-auto px-4 section-pad">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 md:mb-10">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <FaIcon icon="fa-user-doctor" className="text-primary-600 text-xl md:text-2xl" />
              Doctors Near You
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              {areaName ? `Nearest in ${areaName}` : 'Verified physiotherapists near you'}
            </p>
          </div>
          <button type="button" onClick={refreshLocation} className="btn-outline text-xs md:text-sm py-2 px-3 inline-flex items-center gap-1.5">
            <FaIcon icon="fa-location-crosshairs" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/60 bg-white/40 h-64 sm:h-72 animate-pulse" />
            ))}
          </div>
        ) : nearbyDoctors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {nearbyDoctors.slice(0, 6).map((d) => (
                <DoctorCard key={d.id} doctor={d} variant="listing" />
              ))}
            </div>
            <div className="text-center mt-5 md:mt-10">
              <Link to="/doctors" className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5">
                View All Doctors
                <FaIcon icon="fa-arrow-right" />
              </Link>
            </div>
          </>
        ) : (
          <div className="glass-card text-center py-8 md:py-16">
            <FaIcon icon="fa-location-dot" className="text-3xl md:text-4xl text-primary-600 mb-3" />
            <p className="text-slate-600 text-sm md:text-lg px-4">
              {city
                ? `No doctors or clinics listed in ${areaName} yet. Try another city nearby.`
                : 'Allow location or pick a city to see nearest doctors.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {!city && (
                <button
                  type="button"
                  onClick={requestGeolocation}
                  disabled={detectingGps}
                  className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <FaIcon icon={detectingGps ? 'fa-spinner fa-spin' : 'fa-crosshairs'} />
                  {detectingGps ? 'Detecting…' : 'Detect location'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSelector(true)}
                className={city ? 'btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2' : 'btn-outline text-sm py-2.5 px-5 inline-flex items-center gap-2'}
              >
                <FaIcon icon="fa-location-dot" />
                {city ? 'Change city' : 'Select city'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CLINICS */}
      <section id="clinics" className="max-w-7xl mx-auto px-4 section-pad pt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 md:mb-10">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <FaIcon icon="fa-hospital" className="text-emerald-600 text-xl md:text-2xl" />
              Clinics Near You
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              {areaName ? `Partner clinics in ${areaName}` : 'Approved partner clinics near you'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              to="/clinics"
              className="btn-primary text-xs md:text-sm py-2.5 px-4 inline-flex items-center justify-center gap-1.5 !bg-emerald-600 hover:!bg-emerald-700 w-full sm:w-auto"
            >
              <FaIcon icon="fa-hospital" />
              Find Clinic
            </Link>
            <button
              type="button"
              onClick={refreshLocation}
              className="btn-outline text-xs md:text-sm py-2.5 px-3 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <FaIcon icon="fa-location-crosshairs" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/60 bg-white/40 h-64 sm:h-72 animate-pulse" />
            ))}
          </div>
        ) : nearbyClinics.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {nearbyClinics.slice(0, 6).map((c) => (
                <ClinicCard key={c.id} clinic={c} variant="listing" />
              ))}
            </div>
            <div className="text-center mt-5 md:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
              <Link
                to="/clinics"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm py-2.5 px-5 !bg-emerald-600 hover:!bg-emerald-700 w-full sm:w-auto"
              >
                <FaIcon icon="fa-hospital" />
                Find Clinic
                <FaIcon icon="fa-arrow-right" />
              </Link>
              <Link
                to="/book?type=clinic"
                className="btn-outline inline-flex items-center justify-center gap-2 text-sm py-2.5 px-5 w-full sm:w-auto"
              >
                Book clinic visit
              </Link>
            </div>
          </>
        ) : (
          <div className="glass-card text-center py-8 md:py-16">
            <FaIcon icon="fa-hospital" className="text-3xl md:text-4xl text-emerald-600 mb-3" />
            <p className="text-slate-600 text-sm md:text-lg px-4">
              No partner clinics in your area yet. Try another city or book an online session.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 mt-4 px-2">
              <Link
                to="/clinics"
                className="btn-primary text-sm py-2.5 px-5 inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700 w-full sm:w-auto"
              >
                <FaIcon icon="fa-hospital" />
                Find Clinic
              </Link>
              <button
                type="button"
                onClick={() => setShowSelector(true)}
                className="btn-outline text-sm py-2.5 px-5 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <FaIcon icon="fa-location-dot" />
                Select city
              </button>
              <Link
                to="/book?type=online"
                className="btn-outline text-sm py-2.5 px-5 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                Online consultation
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* TREATMENTS */}
      <section className="max-w-7xl mx-auto px-4 section-pad">
        <div className="glass-strong rounded-2xl md:rounded-3xl p-4 md:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-5 md:mb-10">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <FaIcon icon="fa-kit-medical" className="text-primary-600 text-xl" />
                Treatments
              </h2>
              <p className="text-slate-600 text-sm mt-1">Pain relief & recovery plans</p>
            </div>
            <Link to="/treatments" className="btn-outline text-xs md:text-sm py-2 px-3 inline-flex items-center gap-1">
              View all <FaIcon icon="fa-arrow-right" className="text-xs" />
            </Link>
          </div>
          <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-6 stagger-children">
            {displayTreatments.map((t) => (
              <Link key={t.id} to={`/treatments/${t.slug}`} className="mobile-scroll-item glass-card group block p-4">
                <FaIcon icon={t.icon} className="text-xl text-primary-600 mb-2" />
                <h3 className="font-bold text-base text-slate-800">{t.title}</h3>
                <p className="text-slate-600 text-xs mt-1 line-clamp-2">{t.short_description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CONDITIONS */}
      <section className="max-w-7xl mx-auto px-4 section-pad">
        <div className="glass-strong rounded-2xl md:rounded-3xl p-4 md:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-5 md:mb-10">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <FaIcon icon="fa-notes-medical" className="text-primary-600 text-xl" />
                Conditions
              </h2>
              <p className="text-slate-600 text-sm mt-1">Injury & rehab programs</p>
            </div>
            <Link to="/conditions" className="btn-outline text-xs md:text-sm py-2 px-3 inline-flex items-center gap-1">
              View all <FaIcon icon="fa-arrow-right" className="text-xs" />
            </Link>
          </div>
          <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-6 stagger-children">
            {displayConditions.map((c) => (
              <Link key={c.id} to={`/conditions/${c.slug}`} className="mobile-scroll-item glass-card group block p-4">
                <FaIcon icon={c.icon} className="text-xl text-violet-600 mb-2" />
                <span className="badge bg-violet-100/80 text-violet-800 capitalize text-[10px]">{c.category}</span>
                <h3 className="font-bold text-base text-slate-800 mt-2">{c.title}</h3>
                <p className="text-slate-600 text-xs mt-1 line-clamp-2">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PackagesSection />

      <ExercisesSection />

      <PhysioFeedSection />

      {/* WHY US */}
      <section className="max-w-7xl mx-auto px-4 section-pad">
        <div className="text-center mb-5 md:mb-12">
          <h2 className="section-title">Why Urban Physio?</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {WHY_US.map((w) => (
            <div key={w.title} className="glass-card text-center p-3 md:p-6">
              <div className={`w-10 h-10 md:w-14 md:h-14 mx-auto rounded-xl bg-white/50 flex items-center justify-center ${w.iconColor}`}>
                <FaIcon icon={w.icon} className="text-lg md:text-2xl" />
              </div>
              <h3 className="font-bold text-slate-800 mt-2 md:mt-4 text-xs md:text-base">{w.title}</h3>
              <p className="text-slate-600 text-[11px] md:text-sm mt-1 line-clamp-2 hidden sm:block">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS — horizontal scroll on mobile */}
      <section className="max-w-7xl mx-auto px-4 section-pad">
        <div className="text-center mb-5 md:mb-12">
          <h2 className="section-title">What Patients Say</h2>
        </div>
        <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-6 stagger-children">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="mobile-scroll-item glass-card p-4">
              <div className="flex gap-0.5 text-amber-500 mb-2 text-sm">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <FaIcon key={i} icon="fa-star" />
                ))}
              </div>
              <p className="text-slate-700 text-sm italic line-clamp-3">&ldquo;{t.text}&rdquo;</p>
              <p className="font-semibold text-slate-800 text-sm mt-3">{t.name} · {t.city}</p>
            </div>
          ))}
        </div>
      </section>

      <FaqSection items={HOME_FAQS} />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-6 md:pb-8 pt-2">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800" />
          <div className="relative glass-dark rounded-2xl md:rounded-3xl p-6 md:p-16 text-center text-white">
            <h2 className="text-xl md:text-4xl font-bold">Start Your Recovery Today</h2>
            <p className="mt-2 md:mt-4 text-primary-100 text-sm md:text-lg max-w-xl mx-auto">
              Join thousands who trust The Urban Physio.
            </p>
            <div className="mt-4 md:mt-8 flex flex-col sm:flex-row justify-center gap-2.5 md:gap-4">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold px-5 py-3 rounded-xl text-sm md:text-base">
                <FaIcon icon="fa-user-plus" />
                Create Account
              </Link>
              <Link to="/doctors" className="btn-glass inline-flex items-center justify-center gap-2 px-5 py-3 text-sm md:text-base">
                Browse Doctors
              </Link>
              <Link to="/clinics" className="btn-glass inline-flex items-center justify-center gap-2 px-5 py-3 text-sm md:text-base !border-emerald-300/40 hover:!bg-emerald-500/20">
                <FaIcon icon="fa-hospital" />
                Find Clinic
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
