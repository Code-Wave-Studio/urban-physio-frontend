import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';
import { offers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { HEALTHCARE_IMAGES } from '../utils/healthcareImages';
import {
  OFFERS_DEFAULTS,
  OFFERS_SEO,
  mergeOffersSections,
} from '../constants/offersDefaults';
import toast from 'react-hot-toast';

export default function OffersPage() {
  const { user } = useAuth();
  const [data, setData] = useState(OFFERS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Form State
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    run_date: new Date().toISOString().split('T')[0],
    distance_km: '10.0',
    notes: '',
    consent_given: false,
  });
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  // Status Lookup State
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState({ 0: true, 1: true });

  const formRef = useRef(null);
  const stepsRef = useRef(null);
  const statusRef = useRef(null);
  const fileInputRef = useRef(null);

  // Pre-fill user profile if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        full_name: prev.full_name || user.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        city: prev.city || user.city || '',
      }));
    }
  }, [user]);

  // Fetch campaign settings from API
  useEffect(() => {
    offers
      .settings()
      .then((res) => {
        const d = res.data ?? res;
        setData({
          ...OFFERS_DEFAULTS,
          ...d,
          sections: mergeOffersSections(d?.sections || {}),
        });
      })
      .catch(() => setData(OFFERS_DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const s = data.sections || OFFERS_DEFAULTS.sections;
  const vis = s.sections_visibility || OFFERS_DEFAULTS.sections.sections_visibility;
  const heroImage = resolveMediaUrl(data.hero_image) || data.hero_image || HEALTHCARE_IMAGES.sportsPhysio;
  const faqs = s.faqs || [];

  const handleScrollTo = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      toast.error('Unsupported file format. Please upload JPG, PNG, WebP or PDF.');
      return;
    }

    setProofFile(file);
    setFormErrors((prev) => ({ ...prev, proof_file: undefined }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    validateAndProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndProcessFile(file);
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!form.full_name.trim()) errors.full_name = 'Full name is required';
    if (!form.email.trim()) errors.email = 'Valid email address is required';
    if (!form.phone.trim()) errors.phone = 'Contact phone number is required';
    if (!form.run_date) errors.run_date = 'Date of run is required';
    if (!form.distance_km || parseFloat(form.distance_km) <= 0) {
      errors.distance_km = 'Valid completed distance is required';
    }
    if (!proofFile) errors.proof_file = 'Run proof screenshot or document is required';
    if (!form.consent_given) {
      errors.consent_given = 'Please confirm that the submitted run details are genuine';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please complete all required fields correctly');
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('full_name', form.full_name.trim());
    fd.append('email', form.email.trim());
    fd.append('phone', form.phone.trim());
    fd.append('city', form.city.trim());
    fd.append('run_date', form.run_date);
    fd.append('distance_km', form.distance_km);
    fd.append('notes', form.notes.trim());
    fd.append('consent_given', form.consent_given ? '1' : '0');
    fd.append('proof_file', proofFile);

    try {
      const res = await offers.submit(fd);
      const payload = res.data ?? res;
      setSubmissionSuccess(payload);
      toast.success('Campaign submission received successfully!');
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      toast.error(err.message || 'Submission failed. Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (!statusQuery.trim()) {
      toast.error('Please enter a Submission ID, Email, or Phone number');
      return;
    }
    setStatusLoading(true);
    setStatusResult(null);
    try {
      const res = await offers.status({ query: statusQuery.trim() });
      setStatusResult(res.data ?? res);
    } catch (err) {
      toast.error(err.message || 'No submission found matching your query');
    } finally {
      setStatusLoading(false);
    }
  };

  const copyReferenceCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success('Reference code copied to clipboard!');
  };

  const statusBadgeStyle = (st) => {
    switch (st) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500/20';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-700 border-rose-300 ring-1 ring-rose-500/20';
      case 'under_review':
        return 'bg-amber-500/10 text-amber-800 border-amber-300 ring-1 ring-amber-500/20';
      default:
        return 'bg-primary-500/10 text-primary-700 border-primary-300 ring-1 ring-primary-500/20';
    }
  };

  const rewardBadgeStyle = (rw) => {
    switch (rw) {
      case 'claimed':
        return 'bg-purple-500/10 text-purple-700 border-purple-300';
      case 'approved':
      case 'eligible':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 selection:bg-[#376299]/15 selection:text-[#376299]">
      <ManagedPageSeo
        pageKey="offers"
        fallback={{
          title: data.seo_title || OFFERS_SEO.title,
          description: data.seo_description || OFFERS_SEO.description,
          canonicalPath: '/offers',
        }}
      />
      <Navbar />

      <main className="flex-1">
        {/* ─── SECTION 1: MODERN HERO ───────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-6 sm:pt-10 pb-10 sm:pb-16 lg:max-h-[95vh] flex flex-col justify-center">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-24 right-1/4 -z-10 w-[32rem] h-[32rem] bg-gradient-to-br from-[#376299]/15 to-[#FF6F61]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-20 -z-10 w-96 h-96 bg-[#FF6F61]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Headline & Action Buttons */}
              <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
                {/* Status Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6F61] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6F61]" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-800">
                    {s.hero_badge || 'Exclusive Fitness & Recovery Campaign'}
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                  Run 10 KM.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#376299] via-primary-700 to-[#FF6F61]">
                    Get Free Physiotherapy Sessions.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  {data.hero_subtitle ||
                    'Complete your 10 KM run and take a step toward better recovery with free physiotherapy sessions from The Urban Physio.'}
                </p>

                {/* Quick Metric Pills */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
                  {(s.hero_highlights || OFFERS_DEFAULTS.sections.hero_highlights).map((item, idx) => (
                    <div
                      key={idx}
                      className="group p-3.5 sm:p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-xs hover:border-[#376299]/40 hover:shadow-md transition-all duration-300 text-center lg:text-left"
                    >
                      <div className="flex items-center justify-center lg:justify-start gap-1.5 text-[#376299] mb-1">
                        <FaIcon icon={item.icon || 'fa-check'} className="text-xs sm:text-sm group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 truncate">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleScrollTo(formRef)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#376299] to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white font-bold text-base shadow-lg shadow-[#376299]/25 hover:shadow-xl hover:shadow-[#376299]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                  >
                    <FaIcon icon="fa-paper-plane" className="text-sm" />
                    {s.hero_primary_cta_label || 'Join the Campaign'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollTo(stepsRef)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/90 border border-slate-200 text-slate-700 hover:text-[#376299] hover:border-[#376299]/40 font-bold text-base shadow-xs hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                  >
                    <FaIcon icon="fa-circle-info" className="text-[#376299]" />
                    {s.hero_secondary_cta_label || 'Learn How It Works'}
                  </button>
                </div>

                {/* Supported Apps Ribbon */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-400">Compatible Trackers:</span>
                  {['Strava', 'Nike Run Club', 'Garmin', 'Apple Health', 'Samsung Health', 'GPS Watches'].map((app, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-600 font-medium text-[11px] border border-slate-200/60">
                      <FaIcon icon="fa-circle-check" className="text-emerald-500 text-[9px]" />
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Hero Visual Card */}
              <div className="lg:col-span-5 relative mt-4 lg:mt-0">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Subtle Glow Frame */}
                  <div className="absolute -inset-2.5 bg-gradient-to-tr from-[#376299]/30 to-[#FF6F61]/30 rounded-3xl opacity-50 blur-xl -z-10" />

                  <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-2xl">
                    <img
                      src={heroImage}
                      alt="Run 10 KM and get free physiotherapy recovery sessions"
                      className="w-full h-80 sm:h-96 lg:h-[26rem] object-cover object-center"
                      loading="lazy"
                    />

                    {/* Gradient Overlay for Copy */}
                    <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent absolute inset-0 flex flex-col justify-end text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-3 py-1 rounded-md bg-[#FF6F61] text-white text-[11px] font-extrabold uppercase tracking-widest shadow-xs">
                          Verified Campaign
                        </span>
                        <span className="inline-block px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-[11px] font-bold">
                          10.0 KM Target
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight">
                        Fitness Meets Clinical Recovery
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                        Submit your verified 10 KM run proof and consult licensed physiotherapists at clinic or online.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: CAMPAIGN HIGHLIGHTS (4 Cards) ───────────────────────── */}
        {vis.highlights && (
          <section className="py-16 bg-white border-y border-slate-200/70">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] bg-[#FF6F61]/10 px-3.5 py-1 rounded-full border border-[#FF6F61]/20">
                  {s.highlights_heading || 'Campaign Overview'}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                  Four Steps to Your Free Session
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  {s.highlights_subheading ||
                    'A simple, transparent 4-step campaign designed to reward your active lifestyle with expert clinical recovery.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(s.highlights_cards || OFFERS_DEFAULTS.sections.highlights_cards).map((card, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-3xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-white hover:border-[#376299]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#376299]/10 text-[#376299] group-hover:bg-[#376299] group-hover:text-white transition-colors duration-300 shadow-xs">
                          <FaIcon icon={card.icon || 'fa-check'} className="text-xl" />
                        </div>
                        <span className="text-3xl font-black text-slate-200 group-hover:text-[#376299]/20 transition-colors">
                          {card.step || `0${idx + 1}`}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#376299] transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-[#376299]">
                      <span>Step {idx + 1} of 4</span>
                      <FaIcon icon="fa-arrow-right" className="text-[10px] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 3: HOW IT WORKS (5 Steps Detailed) ────────────────────── */}
        {vis.how_it_works && (
          <section ref={stepsRef} id="how-it-works" className="py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#376299] bg-[#376299]/10 px-3.5 py-1 rounded-full border border-[#376299]/20">
                  Step-By-Step Journey
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                  {s.how_heading || 'How It Works'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  {s.how_subheading ||
                    'Follow these five steps to participate and redeem your physiotherapy recovery session.'}
                </p>
              </div>

              {/* Steps Progression Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {(s.how_steps || OFFERS_DEFAULTS.sections.how_steps).map((step, idx) => (
                  <div
                    key={idx}
                    className="relative flex flex-col h-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-lg hover:border-[#376299]/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Step Number & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#376299] to-primary-800 text-white font-black text-sm shadow-sm">
                        {step.step || `0${idx + 1}`}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <FaIcon icon={step.icon || 'fa-circle-check'} className="text-sm" />
                      </div>
                    </div>

                    {/* Step Title & Summary */}
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">{step.title}</h4>
                    <p className="text-xs font-bold text-[#376299] mb-3 leading-snug">{step.summary}</p>

                    {/* Step Details */}
                    <p className="text-xs text-slate-500 leading-relaxed mt-auto pt-3 border-t border-slate-100">
                      {step.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 4: BENEFITS ─────────────────────────────────────────── */}
        {vis.benefits && (
          <section className="py-20 bg-white border-y border-slate-200/70">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Column: Heading & Value Prop */}
                <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
                  <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] bg-[#FF6F61]/10 px-3.5 py-1 rounded-full border border-[#FF6F61]/20">
                    Clinical Motivation
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {s.benefits_heading || 'Why Join the Campaign?'}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    {s.benefits_subheading ||
                      'Combining fitness motivation with evidence-based physiotherapy recovery. Our licensed physiotherapists help runners avoid overuse injuries, optimize movement, and recover faster.'}
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleScrollTo(formRef)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#376299]/10 text-[#376299] hover:bg-[#376299] hover:text-white font-bold text-sm transition-all duration-200 cursor-pointer"
                    >
                      <span>Submit Your Run Proof</span>
                      <FaIcon icon="fa-arrow-right" className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Right Column: Benefits Grid */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {(s.benefits || OFFERS_DEFAULTS.sections.benefits).map((b, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-6 hover:bg-white hover:border-[#376299]/30 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#376299]/10 text-[#376299] mb-3.5">
                        <FaIcon icon={b.icon || 'fa-heart-pulse'} className="text-base" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-1.5">{b.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 5: ELIGIBILITY & RULES (High-Contrast Tech Card) ──────── */}
        {vis.eligibility && (
          <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-950 via-[#1e293b] to-slate-950 text-white relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#376299]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF6F61]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] bg-white/10 px-3.5 py-1 rounded-full border border-white/10">
                  Verification Guidelines
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
                  {s.eligibility_heading || 'Eligibility & Campaign Rules'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2">
                  {s.eligibility_subheading ||
                    'Please review the participation requirements and verification guidelines.'}
                </p>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 hover:bg-white/15 transition">
                  <div className="flex items-center gap-3 mb-2.5">
                    <FaIcon icon="fa-person-running" className="text-[#FF6F61] text-xl" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Required Distance
                    </h4>
                  </div>
                  <p className="text-3xl font-black text-white">{s.required_distance_km || '10.0'} KM</p>
                  <p className="text-xs text-slate-300 mt-1">Single continuous recorded activity</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 hover:bg-white/15 transition">
                  <div className="flex items-center gap-3 mb-2.5">
                    <FaIcon icon="fa-gift" className="text-emerald-400 text-xl" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Reward Allocation
                    </h4>
                  </div>
                  <p className="text-lg font-bold text-white leading-snug">
                    {s.reward_details || '1 Complimentary Clinical Physiotherapy Session'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Validity: {s.reward_validity_days || '60'} days from verification
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 hover:bg-white/15 transition">
                  <div className="flex items-center gap-3 mb-2.5">
                    <FaIcon icon="fa-file-shield" className="text-sky-400 text-xl" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Accepted Proof
                    </h4>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {s.accepted_proof_types ||
                      'Strava, Nike Run Club, Garmin, Apple Health, Samsung Health, or GPS running watch exports.'}
                  </p>
                </div>
              </div>

              {/* Rules Checklist */}
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur-md">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-5 flex items-center gap-2.5">
                  <FaIcon icon="fa-list-check" className="text-[#FF6F61]" />
                  Campaign Conditions &amp; Rules
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(s.rules || OFFERS_DEFAULTS.sections.rules).map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                      <FaIcon icon="fa-circle-check" className="text-emerald-400 mt-1 shrink-0 text-xs" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
                {s.terms_text && (
                  <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-white/10 italic">
                    {s.terms_text}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 6: PARTICIPATION FORM & STATUS TRACKER ───────────────── */}
        <section ref={formRef} id="submit-run" className="py-20 bg-[#F1F5F9]/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#376299] bg-[#376299]/10 px-3.5 py-1 rounded-full border border-[#376299]/20">
                {s.form_badge || 'Participation Desk'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
                {s.form_heading || 'Submit Your 10 KM Run Proof'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-lg mx-auto">
                {s.form_subheading ||
                  'Fill in your activity details and upload your run proof for verification by our clinical administration.'}
              </p>
            </div>

            {/* Success State View */}
            {submissionSuccess ? (
              <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-10 shadow-2xl text-center animate-fade-in mb-8">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl mb-5 shadow-inner">
                  <FaIcon icon="fa-circle-check" />
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
                  <span>Reference ID:</span>
                  <span className="font-mono">{submissionSuccess.reference_code || submissionSuccess.submission_id}</span>
                  <button
                    type="button"
                    onClick={() => copyReferenceCode(submissionSuccess.reference_code || submissionSuccess.submission_id)}
                    className="hover:text-emerald-950 ml-1"
                    title="Copy code"
                  >
                    <FaIcon icon="fa-copy" />
                  </button>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Submission Successfully Received!
                </h3>
                <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2.5 leading-relaxed">
                  {submissionSuccess.message ||
                    'Your 10 KM campaign submission has been received and is currently under review by our clinical team.'}
                </p>

                {/* Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl mx-auto my-7 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Participant</p>
                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{submissionSuccess.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Current Status</p>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      {submissionSuccess.status_label || 'Pending Review'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Submitted Time</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">Just now</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setProofFile(null);
                      setProofPreview(null);
                    }}
                    className="btn-outline text-sm w-full sm:w-auto !py-3 !px-6"
                  >
                    Submit Another Entry
                  </button>
                  <Link to="/book" className="btn-primary text-sm w-full sm:w-auto !py-3 !px-6">
                    Explore Clinics &amp; Booking
                  </Link>
                </div>
              </div>
            ) : (
              /* Main Submission Form Card */
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xl mb-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          placeholder="e.g. Rahul Sharma"
                          className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                            formErrors.full_name
                              ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                              : 'border-slate-300 focus:border-[#376299] focus:ring-[#376299]/15'
                          }`}
                        />
                      </div>
                      {formErrors.full_name && (
                        <p className="text-xs text-rose-500 mt-1 font-semibold">{formErrors.full_name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. rahul@example.com"
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                          formErrors.email
                            ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                            : 'border-slate-300 focus:border-[#376299] focus:ring-[#376299]/15'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-rose-500 mt-1 font-semibold">{formErrors.email}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                          formErrors.phone
                            ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                            : 'border-slate-300 focus:border-[#376299] focus:ring-[#376299]/15'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-rose-500 mt-1 font-semibold">{formErrors.phone}</p>
                      )}
                    </div>

                    {/* City (Optional) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        City / Locality <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="e.g. Mumbai, Bandra"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition focus:outline-none focus:border-[#376299] focus:ring-2 focus:ring-[#376299]/15"
                      />
                    </div>

                    {/* Run Date */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Date of Run <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={form.run_date}
                        onChange={(e) => setForm({ ...form, run_date: e.target.value })}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                          formErrors.run_date
                            ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                            : 'border-slate-300 focus:border-[#376299] focus:ring-[#376299]/15'
                        }`}
                      />
                      {formErrors.run_date && (
                        <p className="text-xs text-rose-500 mt-1 font-semibold">{formErrors.run_date}</p>
                      )}
                    </div>

                    {/* Distance Completed */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Distance Completed (KM) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required
                          value={form.distance_km}
                          onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                          placeholder="10.0"
                          className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                            formErrors.distance_km
                              ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                              : 'border-slate-300 focus:border-[#376299] focus:ring-[#376299]/15'
                          }`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          KM
                        </span>
                      </div>
                      {formErrors.distance_km && (
                        <p className="text-xs text-rose-500 mt-1 font-semibold">{formErrors.distance_km}</p>
                      )}
                    </div>
                  </div>

                  {/* Drag & Drop File Upload Box */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Proof of Run <span className="text-rose-500">*</span>{' '}
                      <span className="text-slate-400 font-normal">
                        (Screenshot from Strava, Nike Run, Garmin, etc. - Max 10MB)
                      </span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="proof-upload-input"
                    />

                    {proofFile ? (
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-[#376299]/30 bg-[#376299]/5">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {proofPreview ? (
                            <img
                              src={proofPreview}
                              alt="Proof preview"
                              className="h-16 w-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#376299]/15 text-[#376299] text-2xl shrink-0">
                              <FaIcon icon="fa-file-pdf" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{proofFile.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {(proofFile.size / (1024 * 1024)).toFixed(2)} MB • {proofFile.type || 'Document'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          Change File
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="proof-upload-input"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                          isDragging
                            ? 'border-[#376299] bg-[#376299]/10 scale-[0.99]'
                            : formErrors.proof_file
                            ? 'border-rose-400 bg-rose-50/30 hover:bg-rose-50/50'
                            : 'border-slate-300 bg-slate-50/60 hover:bg-[#376299]/5 hover:border-[#376299]/60'
                        }`}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#376299]/10 text-[#376299] text-2xl mb-3 shadow-xs">
                          <FaIcon icon="fa-cloud-arrow-up" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 text-center">
                          Click to upload or drag &amp; drop your run proof
                        </p>
                        <p className="text-xs text-slate-400 mt-1 text-center">
                          Supported formats: JPG, PNG, WebP, PDF (Up to 10MB)
                        </p>
                      </label>
                    )}

                    {formErrors.proof_file && (
                      <p className="text-xs text-rose-500 mt-1.5 font-semibold">{formErrors.proof_file}</p>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Additional Notes / Running App Used{' '}
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="e.g. Completed via Strava on Marine Drive..."
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition focus:outline-none focus:border-[#376299] focus:ring-2 focus:ring-[#376299]/15"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-3.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.consent_given}
                        onChange={(e) =>
                          setForm({ ...form, consent_given: e.target.checked })
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#376299] focus:ring-[#376299]"
                      />
                      <span className="text-xs text-slate-600 leading-relaxed font-normal">
                        {s.form_consent_text ||
                          'I confirm that I have completed the 10 KM run, the uploaded activity details are authentic, and I agree to the campaign terms & conditions of The Urban Physio.'}
                      </span>
                    </label>
                    {formErrors.consent_given && (
                      <p className="text-xs text-rose-500 mt-1 font-semibold">{formErrors.consent_given}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#376299] to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white font-bold text-base shadow-lg shadow-[#376299]/25 hover:shadow-xl hover:shadow-[#376299]/35 disabled:opacity-60 active:scale-[0.99] transition cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <FaIcon icon="fa-spinner" className="fa-spin text-lg" />
                          Uploading &amp; Verifying Details...
                        </>
                      ) : (
                        <>
                          <FaIcon icon="fa-paper-plane" />
                          Submit Campaign Entry
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── LIVE STATUS TRACKER ─────────────────────────────────────── */}
            {vis.status_tracker && (
              <div ref={statusRef} className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                      <FaIcon icon="fa-magnifying-glass" className="text-[#376299]" />
                      {s.status_heading || 'Check Live Submission Status'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.status_subheading ||
                        'Already submitted? Check your verification and reward status in real time.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={statusQuery}
                    onChange={(e) => setStatusQuery(e.target.value)}
                    placeholder={s.status_search_placeholder || 'Enter Submission ID, Email, or Phone number'}
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:border-[#376299] focus:ring-2 focus:ring-[#376299]/15"
                  />
                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="btn-primary text-sm shrink-0 !py-3 !px-6 rounded-2xl"
                  >
                    {statusLoading ? <FaIcon icon="fa-spinner" className="fa-spin" /> : 'Check Status'}
                  </button>
                </form>

                {statusResult && (
                  <div className="mt-5 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 animate-fade-in space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Reference Code
                        </span>
                        <p className="text-sm font-bold text-slate-900 font-mono">
                          {statusResult.reference_code || `UP-10K-${statusResult.id}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeStyle(
                            statusResult.status
                          )}`}
                        >
                          {statusResult.status_label || statusResult.status}
                        </span>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${rewardBadgeStyle(
                            statusResult.reward_status
                          )}`}
                        >
                          Reward: {statusResult.reward_label || statusResult.reward_status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold">Participant</span>
                        <span className="font-bold text-slate-800">{statusResult.full_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Distance</span>
                        <span className="font-bold text-slate-800">{statusResult.distance_km} KM</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Run Date</span>
                        <span className="font-bold text-slate-800">{statusResult.run_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Submitted</span>
                        <span className="font-bold text-slate-800">
                          {new Date(statusResult.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {statusResult.status === 'rejected' && statusResult.rejection_reason && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                        <span className="font-bold">Rejection Note: </span>
                        {statusResult.rejection_reason}
                      </div>
                    )}

                    {(statusResult.reward_status === 'approved' || statusResult.reward_status === 'eligible') && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                        <span className="text-xs font-semibold text-emerald-800">
                          Congratulations! Your run is verified. You are eligible to book your complimentary physiotherapy session.
                        </span>
                        <Link to="/book" className="btn-primary text-xs !py-2 !px-4 shrink-0 rounded-xl">
                          Book Free Session
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─── SECTION 7: FAQS ACCORDION ─────────────────────────────────────── */}
        {vis.faqs && faqs.length > 0 && (
          <section className="py-20 bg-white border-t border-slate-200/70">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] bg-[#FF6F61]/10 px-3.5 py-1 rounded-full border border-[#FF6F61]/20">
                  {s.faqs_badge || 'Got Questions?'}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
                  {s.faqs_heading || 'Frequently Asked Questions'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {s.faqs_subheading ||
                    'Everything you need to know about participation, verification, and claiming your reward.'}
                </p>
              </div>

              <div className="space-y-3.5">
                {faqs.map((faq, idx) => {
                  const open = activeFaq[idx] ?? false;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/90 bg-slate-50/40 overflow-hidden transition-all duration-200 hover:border-[#376299]/30"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq((f) => ({ ...f, [idx]: !open }))}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left font-bold text-slate-900 hover:text-[#376299] transition cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-bold">{faq.q}</span>
                        <FaIcon
                          icon="fa-chevron-down"
                          className={`text-xs text-slate-400 shrink-0 transition-transform duration-200 ${
                            open ? 'rotate-180 text-[#376299]' : ''
                          }`}
                        />
                      </button>
                      {open && (
                        <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5 font-normal">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 8: FINAL HIGH-IMPACT CTA ──────────────────────────────── */}
        {vis.final_cta && (
          <section className="py-20 bg-gradient-to-br from-[#376299] via-primary-800 to-slate-950 text-white text-center relative overflow-hidden">
            {/* Ambient Background Accents */}
            <div className="absolute -top-10 -right-10 w-80 h-80 bg-[#FF6F61]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5">
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest border border-white/20">
                Start Running Today
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                {s.final_heading || 'Ready to Run 10 KM?'}
              </h2>
              <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed font-normal">
                {s.final_subheading ||
                  'Complete your run, submit your proof, and take the next step toward better recovery with The Urban Physio.'}
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => handleScrollTo(formRef)}
                  className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white text-[#376299] hover:bg-slate-50 font-black text-base shadow-2xl hover:scale-105 active:scale-100 transition-all duration-200 cursor-pointer"
                >
                  <FaIcon icon="fa-paper-plane" className="text-[#FF6F61]" />
                  {s.final_primary_cta_label || 'Join the Campaign'}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
