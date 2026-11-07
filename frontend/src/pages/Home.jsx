import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
import HomePromoBanner from '../components/home/HomePromoBanner';
import HeroShortcuts from '../components/home/HeroShortcuts';
import GlobalSearch from '../components/GlobalSearch';
import { useLocation } from '../contexts/LocationContext';
import { treatments, conditions, home } from '../services/api';
import { SITE_FAQS } from '../constants/supportPages';
import { SERVICE_CARD_IMAGES } from '../utils/healthcareImages';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { emptySectionImages } from '../constants/homeSectionImages';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

const SERVICE_DEFS = [
  { title: 'Online Consultation', imageKey: 'online_consult', fallback: SERVICE_CARD_IMAGES['Online Consultation'], desc: 'HD video sessions via Zoom from your home', icon: 'fa-video', color: 'from-orange-400/20 to-amber-400/20', iconColor: 'text-orange-600', link: '/book?type=online', linkLabel: 'Book' },
  { title: 'Clinic Visit', imageKey: 'clinic_visit', fallback: SERVICE_CARD_IMAGES['Clinic Visit'], desc: 'Premium partner clinics with modern equipment', icon: 'fa-hospital', color: 'from-emerald-400/20 to-teal-400/20', iconColor: 'text-emerald-600', link: '/clinics', linkLabel: 'Find Clinic' },
  { title: 'Home Visit', imageKey: 'home_visit', fallback: SERVICE_CARD_IMAGES['Home Visit'], desc: 'Licensed physiotherapist at your doorstep', icon: 'fa-house-medical', color: 'from-amber-400/20 to-orange-400/20', iconColor: 'text-orange-600', link: '/book?type=home_visit', linkLabel: 'Book' },
];

const STEPS = [
  { step: '01', title: 'Set Location', desc: 'Auto-detect or pick your city across India', icon: 'fa-location-dot' },
  { step: '02', title: 'Choose Doctor', desc: 'Browse verified physios near you with ratings', icon: 'fa-user-doctor' },
  { step: '03', title: 'Book & Pay', desc: 'Pick slot, pay securely via Razorpay', icon: 'fa-credit-card' },
  { step: '04', title: 'Get Treatment', desc: 'Online, clinic, or home — your choice', icon: 'fa-hand-holding-medical' },
];

const HERO_FEATURES_DEFAULT = [
  { label: 'BPT/MPT qualified', icon: 'fa-circle-check' },
  { label: 'From ₹999 a session', icon: 'fa-circle-check' },
  { label: 'Same-gender physio on request', icon: 'fa-circle-check' },
];

const HERO_DEFAULTS = {
  badge_text: 'Same-day appointments in Noida',
  title_prefix: 'Physiotherapy,',
  title_highlight: 'close to home.',
  subtitle: 'At home, in clinic or online. Verified physiotherapists with same-day slots.',
  popular_tags: ['Back pain', 'Knee pain', 'Neck pain'],
  feature_pills: HERO_FEATURES_DEFAULT,
};

const WHY_US = [
  { title: 'Verified Experts', desc: 'Every doctor is license-verified by our admin team', icon: 'fa-circle-check', iconColor: 'text-emerald-600' },
  { title: 'Pan-India Network', desc: 'Mumbai, Delhi, Bangalore, Pune & expanding', icon: 'fa-map-location-dot', iconColor: 'text-orange-500' },
  { title: 'Flexible Care', desc: 'Online, clinic & home visits in one platform', icon: 'fa-arrows-rotate', iconColor: 'text-orange-600' },
  { title: 'Secure Payments', desc: 'Razorpay-powered with instant invoices', icon: 'fa-lock', iconColor: 'text-orange-700' },
];

const TESTIMONIALS = [
  { id: 'd1', type: 'text', name: 'Rahul M.', city: 'Mumbai', text: 'Recovered from back pain in 4 weeks. Online sessions were super convenient!', rating: 5 },
  { id: 'd2', type: 'text', name: 'Priya S.', city: 'Pune', text: 'Best physiotherapy app in India. Home visit feature is a game changer.', rating: 5 },
  { id: 'd3', type: 'text', name: 'Amit K.', city: 'Delhi', text: 'Professional doctors, transparent pricing. Highly recommend Urban Physio.', rating: 5 },
];

/** Convert a YouTube watch/share URL to an embeddable URL, else return null. */
function toYoutubeEmbed(url = '') {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

const HOME_FAQS = SITE_FAQS.slice(0, 6);

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
  const [heroImgSrc, setHeroImgSrc] = useState('');
  const [sectionImages, setSectionImages] = useState(emptySectionImages);
  const [hero, setHero] = useState(HERO_DEFAULTS);
  const [promoBanner, setPromoBanner] = useState({ enabled: false, slides: [] });
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);
  const [showTestimonials, setShowTestimonials] = useState(true);
  const areaName = locationLabel || city?.name;

  useEffect(() => {
    home
      .heroSettings()
      .then((res) => {
        const d = res?.data ?? res;
        if (!d) return;
        setHero({
          // Empty admin fields hide that line; only missing (null) fields fall back to defaults.
          badge_text: d.badge_text ?? HERO_DEFAULTS.badge_text,
          title_prefix: d.title_prefix || HERO_DEFAULTS.title_prefix,
          title_highlight: d.title_highlight ?? HERO_DEFAULTS.title_highlight,
          subtitle: d.subtitle ?? HERO_DEFAULTS.subtitle,
          popular_tags: Array.isArray(d.popular_tags) && d.popular_tags.length ? d.popular_tags : HERO_DEFAULTS.popular_tags,
          feature_pills: Array.isArray(d.feature_pills) ? d.feature_pills : HERO_DEFAULTS.feature_pills,
        });
        if (d.section_images && typeof d.section_images === 'object') {
          const merged = { ...emptySectionImages(), ...d.section_images };
          setSectionImages(merged);
          const heroFromApi = resolveMediaUrl(merged.hero) || merged.hero;
          setHeroImgSrc(heroFromApi || '');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    home
      .bannerSettings()
      .then((res) => {
        const d = res?.data ?? res;
        if (!d) return;
        setPromoBanner({
          enabled: !!d.enabled,
          slides: Array.isArray(d.slides) ? d.slides : [],
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    home
      .testimonials()
      .then((res) => {
        const d = res?.data ?? res;
        if (!d) return;
        setShowTestimonials(!!d.enabled);
        if (Array.isArray(d.items) && d.items.length) setTestimonials(d.items);
        else setTestimonials([]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    treatments.list().then((res) => setTreatmentList((res.data || []).slice(0, 6))).catch(() => {});
    conditions.list().then((res) => setConditionList((res.data || []).slice(0, 6))).catch(() => {});
  }, []);

  const treatmentIcons = ['fa-bone', 'fa-head-side-virus', 'fa-person-walking', 'fa-hand', 'fa-person-running', 'fa-wheelchair'];
  const defaultTreatments = [
    { id: 1, title: 'Back Pain', slug: 'back-pain', short_description: 'Lower & upper back rehabilitation', icon: 'fa-bone' },
    { id: 2, title: 'Neck Pain', slug: 'neck-pain', short_description: 'Cervical pain & tech neck relief', icon: 'fa-head-side-virus' },
    { id: 3, title: 'Knee Pain', slug: 'knee-pain', short_description: 'ACL, meniscus & arthritis rehab', icon: 'fa-person-walking' },
    { id: 4, title: 'Shoulder Pain', slug: 'shoulder-pain', short_description: 'Frozen shoulder & rotator cuff care', icon: 'fa-hand' },
    { id: 5, title: 'Sports Injury', slug: 'sports-injury', short_description: 'Return-to-sport rehab programs', icon: 'fa-person-running' },
    { id: 6, title: 'Post-Surgery Rehab', slug: 'post-surgery-rehab', short_description: 'Guided recovery after surgery', icon: 'fa-wheelchair' },
  ];

  const displayTreatments = treatmentList.length
    ? treatmentList.map((t, i) => ({ ...t, icon: treatmentIcons[i % treatmentIcons.length] }))
    : defaultTreatments;

  const defaultConditions = [
    { id: 1, title: 'ACL Injury Rehabilitation', slug: 'acl-injury', description: 'Post-surgical ACL rehab program', category: 'injury', icon: 'fa-person-running' },
    { id: 2, title: 'Rotator Cuff Injury', slug: 'rotator-cuff', description: 'Shoulder rehab for tears & impingement', category: 'injury', icon: 'fa-hand' },
    { id: 3, title: 'Post-Stroke Rehabilitation', slug: 'post-stroke', description: 'Neurological physiotherapy for recovery', category: 'rehab', icon: 'fa-brain' },
    { id: 4, title: 'Sciatica', slug: 'sciatica', description: 'Nerve pain relief & core strengthening', category: 'pain', icon: 'fa-bolt' },
    { id: 5, title: 'Frozen Shoulder', slug: 'frozen-shoulder', description: 'Mobility restoration program', category: 'rehab', icon: 'fa-arrows-rotate' },
    { id: 6, title: 'Arthritis', slug: 'arthritis', description: 'Joint pain & stiffness management', category: 'chronic', icon: 'fa-bone' },
  ];

  const conditionIcons = ['fa-person-running', 'fa-hand', 'fa-brain', 'fa-bolt', 'fa-arrows-rotate', 'fa-bone'];
  const displayConditions = conditionList.length
    ? conditionList.map((c, i) => ({ ...c, icon: conditionIcons[i % conditionIcons.length] }))
    : defaultConditions;

  const services = useMemo(
    () =>
      SERVICE_DEFS.map((s) => {
        const fromApi = resolveMediaUrl(sectionImages[s.imageKey]) || sectionImages[s.imageKey];
        return { ...s, image: fromApi || s.fallback };
      }),
    [sectionImages],
  );

  const showPromoBanner = promoBanner.enabled && promoBanner.slides.length >= 1;

  return (
    <div className="relative overflow-x-hidden page-enter">
      <ManagedPageSeo
        fallbackTitle="The Urban Physio | Book Verified Physiotherapists"
        fallbackDescription="Book verified physiotherapists for online, clinic & home visits across India."
      />
      <Navbar />

      <div className="mesh-blob w-96 h-96 bg-orange-400 -top-48 -right-48 animate-pulse-soft hidden md:block opacity-20" />
      <div className="mesh-blob w-80 h-80 bg-primary-500 bottom-1/3 -left-40 animate-float hidden md:block opacity-15" />

      
      {/* Hero — mobile-first, minimal, light. Text + actions + image, staggered entrance.
          Brand: Trust Blue #376299, Coral #FF6F61. Motion respects prefers-reduced-motion. */}
      <section className="tup-hero relative overflow-hidden bg-white">
        <div className="tup-hero-glow tup-hero-glow--blue" aria-hidden="true" />
        <div className="tup-hero-glow tup-hero-glow--coral" aria-hidden="true" />

        <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-5 sm:pt-8 lg:pt-16 lg:pb-16">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-12 items-center">
            <div className="min-w-0">
              {hero.badge_text && (
                <p className="tup-rise inline-flex items-center gap-2 rounded-full bg-[#EEF3FA] px-3 py-1.5 text-[12.5px] sm:text-[13px] font-semibold text-[#2B4F80]" style={{ '--d': '0ms' }}>
                  <span className="relative flex w-2 h-2" aria-hidden="true">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                  </span>
                  {hero.badge_text}
                </p>
              )}

              <h1 className="tup-rise mt-3 lg:mt-5 text-[34px] sm:text-[46px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.03em] text-[#0F1E36]" style={{ '--d': '80ms' }}>
                {hero.title_prefix}
                {hero.title_highlight && (
                  <>
                    <br />
                    <span className="inline-block bg-gradient-to-r from-[#376299] via-[#6A63B8] to-[#FF6F61] bg-clip-text text-transparent pb-1">
                      {hero.title_highlight}
                    </span>
                  </>
                )}
              </h1>

              {hero.subtitle && (
                <p className="tup-rise mt-2 lg:mt-4 text-[15px] lg:text-lg leading-relaxed text-slate-600 max-w-[520px]" style={{ '--d': '160ms' }}>
                  {hero.subtitle}
                </p>
              )}

              <div className="tup-rise mt-4 lg:mt-7 max-w-[560px]" style={{ '--d': '240ms' }}>
                <GlobalSearch variant="hero" popularTags={hero.popular_tags} showPopular={false} />
              </div>

              <div className="tup-rise mt-3 grid grid-cols-2 gap-2.5 max-w-[560px]" style={{ '--d': '320ms' }}>
                <Link
                  to="/book"
                  className="tup-btn min-w-0 inline-flex items-center justify-center gap-2 h-12 rounded-full text-sm sm:text-[15px] font-semibold whitespace-nowrap text-white bg-[#376299] hover:bg-[#2D5384] shadow-[0_8px_20px_-8px_rgba(55,98,153,0.65)]"
                >
                  <FaIcon icon="fa-calendar-check" className="text-[13px] shrink-0" />
                  Book appointment
                </Link>
                <Link
                  to="/doctors"
                  className="tup-btn min-w-0 inline-flex items-center justify-center gap-2 h-12 rounded-full text-sm sm:text-[15px] font-semibold whitespace-nowrap text-[#2B4F80] bg-[#E8EFF8] hover:bg-[#DCE6F4]"
                >
                  <FaIcon icon="fa-user-doctor" className="text-[13px] shrink-0" />
                  Find a physio
                </Link>
              </div>

              {hero.feature_pills?.length > 0 && (
                <ul className="tup-rise mt-3.5 lg:mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] sm:text-[13px] font-medium text-slate-600" style={{ '--d': '400ms' }}>
                  {hero.feature_pills.map((t) => (
                    <li key={t.label} className="inline-flex items-center gap-1.5">
                      <FaIcon icon={t.icon || 'fa-circle-check'} className="text-[12px] text-emerald-500" />
                      {t.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {heroImgSrc && (
              <div className="tup-zoom min-w-0" style={{ '--d': '220ms' }}>
                <div className="tup-hero-media relative overflow-hidden rounded-[22px] lg:rounded-[28px] bg-slate-100 shadow-[0_24px_48px_-20px_rgba(15,30,54,0.35)] ring-1 ring-slate-900/5">
                  <img
                    src={heroImgSrc}
                    alt="Physiotherapist with a patient at home"
                    className="w-full aspect-[2/1] object-cover"
                    fetchpriority="high"
                    onError={() => setHeroImgSrc('')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-[1] pb-4 sm:pb-6">
          <HeroShortcuts />
        </div>
      </section>

      {showPromoBanner ? (
        <HomePromoBanner slides={promoBanner.slides} className="pt-4 pb-2 sm:pt-6 sm:pb-4 bg-slate-50" />
      ) : (
        <EmergencyCareSection />
      )}

      <PainSelectionSection />

      <StatsCounter />

      
      <section id="book-care" className="max-w-7xl mx-auto px-4 section-pad">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="section-title">Choose How You Want to Receive Care</h2>
          <p className="section-subtitle mx-auto mt-2">Online · Clinic · Home visit</p>
        </div>
        <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-8 stagger-children">
          {services.map((f) => (
            <div key={f.title} className={`mobile-scroll-item glass-card overflow-hidden bg-gradient-to-br ${f.color} p-0`}>
              <div className="h-32 sm:h-36 overflow-hidden">
                <img src={f.image} alt={f.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-4 md:p-6 text-center">
              <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 rounded-xl bg-white/60 flex items-center justify-center ${f.iconColor}`}>
                <FaIcon icon={f.icon} className="text-2xl md:text-3xl" />
              </div>
              <h3 className="font-bold text-base md:text-xl text-slate-800">{f.title}</h3>
              <p className="text-slate-600 mt-2 text-xs md:text-base line-clamp-2">{f.desc}</p>
              <Link to={f.link || '/book'} className="inline-flex items-center gap-1 mt-3 text-primary-600 font-semibold text-sm">
                {f.linkLabel || 'Book'} <FaIcon icon="fa-arrow-right" className="text-xs" />
              </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      
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
          <div className="mobile-scroll-x md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5 stagger-children">
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
          <div className="mobile-scroll-x md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5 stagger-children">
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

      
      {showTestimonials && testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 section-pad">
          <div className="text-center mb-5 md:mb-12">
            <h2 className="section-title">What Patients Say</h2>
          </div>
          <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-6 stagger-children">
            {testimonials.map((t, idx) => {
              if (t.type === 'video') {
                const embed = toYoutubeEmbed(t.video_url || '');
                const videoSrc = resolveMediaUrl(t.video_url) || t.video_url;
                const poster = resolveMediaUrl(t.poster) || t.poster || '';
                return (
                  <div key={t.id || idx} className="mobile-scroll-item glass-card p-4">
                    <div className="rounded-xl overflow-hidden bg-black aspect-video mb-3">
                      {embed ? (
                        <iframe
                          src={embed}
                          title={`Review by ${t.name || 'patient'}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video controls className="w-full h-full object-cover" src={videoSrc} poster={poster || undefined}>
                          <track kind="captions" />
                        </video>
                      )}
                    </div>
                    {t.rating > 0 && (
                      <div className="flex gap-0.5 text-amber-500 mb-1.5 text-sm">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <FaIcon key={i} icon="fa-star" />
                        ))}
                      </div>
                    )}
                    {t.text && <p className="text-slate-700 text-sm italic line-clamp-2">&ldquo;{t.text}&rdquo;</p>}
                    {(t.name || t.city) && (
                      <p className="font-semibold text-slate-800 text-sm mt-2">
                        {t.name}
                        {t.name && t.city ? ' · ' : ''}
                        {t.city}
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <div key={t.id || idx} className="mobile-scroll-item glass-card p-4">
                  <div className="flex gap-0.5 text-amber-500 mb-2 text-sm">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <FaIcon key={i} icon="fa-star" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm italic line-clamp-3">&ldquo;{t.text}&rdquo;</p>
                  <p className="font-semibold text-slate-800 text-sm mt-3">
                    {t.name}
                    {t.name && t.city ? ' · ' : ''}
                    {t.city}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <FaqSection items={HOME_FAQS} />

      
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
