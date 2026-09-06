import { useEffect, useMemo, useState, useRef } from 'react';
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

  // Status Lookup State
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState({ 0: true, 1: true });

  const formRef = useRef(null);
  const stepsRef = useRef(null);
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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
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
    if (!form.email.trim()) errors.email = 'Email address is required';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    if (!form.run_date) errors.run_date = 'Run date is required';
    if (!form.distance_km || parseFloat(form.distance_km) <= 0) errors.distance_km = 'Valid distance completed is required';
    if (!proofFile) errors.proof_file = 'Run proof screenshot or document is required';
    if (!form.consent_given) errors.consent_given = 'Please confirm the validity of your run submission';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please complete all required fields');
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
      // Scroll to success banner
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

  const statusBadge = (st) => {
    switch (st) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'under_review':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-300';
    }
  };

  const rewardBadge = (rw) => {
    switch (rw) {
      case 'claimed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'approved':
      case 'eligible':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800">
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
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <SeoBreadcrumbs items={[{ label: 'Offers', path: '/offers' }]} />
        </div>

        {/* ─── SECTION 1: HERO ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-6 pb-14 sm:pb-20 lg:pt-10">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-10 -z-10 w-80 h-80 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Copy & CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Campaign Tag Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs sm:text-sm font-bold tracking-wide shadow-xs">
                  <span className="flex h-2 w-2 rounded-full bg-[#FF6F61] animate-pulse" />
                  <span>{s.hero_badge || 'Exclusive Fitness & Recovery Campaign'}</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  {data.hero_title || 'Run 10 KM. Get Free Physiotherapy Sessions.'}
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  {data.hero_subtitle ||
                    'Complete your 10 KM run and take a step toward better recovery with free physiotherapy sessions from The Urban Physio.'}
                </p>

                {/* Stat / Process Badges */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-2">
                  {(s.hero_highlights || OFFERS_DEFAULTS.sections.hero_highlights).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-primary-200 transition-all text-center lg:text-left"
                    >
                      <div className="flex items-center justify-center lg:justify-start gap-1.5 text-primary-600 mb-1">
                        <FaIcon icon={item.icon || 'fa-check'} className="text-sm" />
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-slate-900 truncate">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleScrollTo(formRef)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-base shadow-md hover:shadow-lg active:scale-[0.98] transition"
                  >
                    <FaIcon icon="fa-paper-plane" />
                    {s.hero_primary_cta_label || 'Join the Campaign'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollTo(stepsRef)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-primary-700 hover:border-primary-300 font-semibold text-base shadow-xs hover:bg-slate-50 active:scale-[0.98] transition"
                  >
                    <FaIcon icon="fa-circle-info" className="text-primary-500" />
                    {s.hero_secondary_cta_label || 'Learn How It Works'}
                  </button>
                </div>
              </div>

              {/* Right Column: Hero Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Decorative Frame */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-primary-400 to-[#FF6F61] rounded-3xl opacity-20 blur-lg" />
                  <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-xl">
                    <img
                      src={heroImage}
                      alt="Run 10 KM and get free physiotherapy recovery session"
                      className="w-full h-72 sm:h-80 lg:h-96 object-cover object-center"
                      loading="lazy"
                    />
                    <div className="p-5 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent absolute inset-0 flex flex-col justify-end text-white">
                      <span className="inline-block self-start px-2.5 py-1 rounded-md bg-[#FF6F61] text-white text-[11px] font-extrabold uppercase tracking-wider mb-2">
                        Official Campaign
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                        Fitness Meets Recovery
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 mt-1">
                        Run 10 KM • Upload Verified Proof • Consult a Qualified Physiotherapist
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
          <section className="py-12 bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] mb-2">
                  {s.highlights_heading || 'Campaign Overview'}
                </h2>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Four Steps to Your Free Session
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {s.highlights_subheading ||
                    'A simple, transparent 4-step campaign designed to reward your active lifestyle with expert clinical recovery.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {(s.highlights_cards || OFFERS_DEFAULTS.sections.highlights_cards).map((card, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 hover:bg-white hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        <FaIcon icon={card.icon || 'fa-check'} className="text-lg" />
                      </div>
                      <span className="text-2xl font-black text-slate-200 group-hover:text-primary-200 transition-colors">
                        {card.step || `0${idx + 1}`}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 3: HOW IT WORKS (5-Step Detailed Progression) ─────────── */}
        {vis.how_it_works && (
          <section ref={stepsRef} id="how-it-works" className="py-16 sm:py-20 bg-slate-50/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                  Structured Process
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-3">
                  {s.how_heading || 'How It Works'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  {s.how_subheading ||
                    'Follow these five steps to participate and redeem your physiotherapy recovery session.'}
                </p>
              </div>

              <div className="relative">
                {/* Connecting Line on Desktop */}
                <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-primary-200 via-primary-400 to-emerald-400 -translate-y-1/2 z-0" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                  {(s.how_steps || OFFERS_DEFAULTS.sections.how_steps).map((step, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-sm shadow-xs">
                          {step.step || `0${idx + 1}`}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                          <FaIcon icon={step.icon || 'fa-circle-check'} className="text-xs" />
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">{step.title}</h4>
                      <p className="text-xs font-semibold text-primary-700 mb-2">{step.summary}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-auto pt-2 border-t border-slate-100">
                        {step.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 4: BENEFITS ─────────────────────────────────────────── */}
        {vis.benefits && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    Clinical Excellence
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
                    {s.benefits_heading || 'Why Join the Campaign?'}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {s.benefits_subheading ||
                      'Combining fitness motivation with evidence-based physiotherapy recovery. Our licensed physiotherapists help runners avoid overuse injuries, optimize movement, and recover faster.'}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleScrollTo(formRef)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-800"
                    >
                      Submit your run now <FaIcon icon="fa-arrow-right" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(s.benefits || OFFERS_DEFAULTS.sections.benefits).map((b, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 hover:bg-white hover:border-primary-200 hover:shadow-md transition"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 mb-3">
                        <FaIcon icon={b.icon || 'fa-heart-pulse'} className="text-base" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">{b.title}</h4>
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

        {/* ─── SECTION 5: ELIGIBILITY & RULES ───────────────────────────────── */}
        {vis.eligibility && (
          <section className="py-14 bg-gradient-to-br from-primary-900 via-slate-900 to-slate-900 text-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  Verification Guidelines
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3">
                  {s.eligibility_heading || 'Eligibility & Campaign Rules'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2">
                  {s.eligibility_subheading ||
                    'Please review the participation requirements and verification guidelines.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <FaIcon icon="fa-person-running" className="text-[#FF6F61] text-lg" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      Required Distance
                    </h4>
                  </div>
                  <p className="text-2xl font-black text-white">{s.required_distance_km || '10.0'} KM</p>
                  <p className="text-xs text-slate-300 mt-1">Single recorded activity session</p>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <FaIcon icon="fa-gift" className="text-emerald-400 text-lg" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      Reward Allocation
                    </h4>
                  </div>
                  <p className="text-base font-bold text-white leading-tight">
                    {s.reward_details || '1 Complimentary Clinical Physiotherapy Session'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Validity: {s.reward_validity_days || '60'} days from approval
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <FaIcon icon="fa-file-shield" className="text-sky-400 text-lg" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      Accepted Proof
                    </h4>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {s.accepted_proof_types ||
                      'Strava, Nike Run Club, Garmin, Apple Health, Samsung Health, or GPS running watch exports.'}
                  </p>
                </div>
              </div>

              {/* Rules Bullet List */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <FaIcon icon="fa-list-check" className="text-primary-400" />
                  Campaign Conditions &amp; Rules
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(s.rules || OFFERS_DEFAULTS.sections.rules).map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <FaIcon icon="fa-circle-check" className="text-emerald-400 mt-0.5 shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
                {s.terms_text && (
                  <p className="text-xs text-slate-400 mt-5 pt-4 border-t border-white/10 italic">
                    {s.terms_text}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 6: SUBMISSION FORM & LIVE STATUS TRACKER ─────────────── */}
        <section ref={formRef} id="submit-run" className="py-16 bg-slate-100/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Form Section Header */}
            <div className="text-center mb-8">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                Participation Desk
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Submit Your 10 KM Run Proof
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Fill in your activity details and upload your run proof for verification.
              </p>
            </div>

            {/* Success State Banner */}
            {submissionSuccess ? (
              <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xl text-center animate-fade-in mb-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl mb-4">
                  <FaIcon icon="fa-circle-check" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
                  Submission ID: {submissionSuccess.reference_code || submissionSuccess.submission_id}
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  Submission Successfully Received!
                </h3>
                <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
                  {submissionSuccess.message ||
                    'Your 10 KM campaign submission has been received and is currently under review by our clinical team.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Participant</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{submissionSuccess.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
                      {submissionSuccess.status_label || 'Pending Review'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Submitted</p>
                    <p className="text-xs font-semibold text-slate-700">Just now</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setProofFile(null);
                      setProofPreview(null);
                    }}
                    className="btn-outline text-sm w-full sm:w-auto"
                  >
                    Submit Another Entry
                  </button>
                  <Link to="/book" className="btn-primary text-sm w-full sm:w-auto">
                    Explore Clinics &amp; Booking
                  </Link>
                </div>
              </div>
            ) : (
              /* Main Submission Form Card */
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 md:p-10 shadow-xl mb-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                          formErrors.full_name
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                      />
                      {formErrors.full_name && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.full_name}</p>
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
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                          formErrors.email
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>
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
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                          formErrors.phone
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.phone}</p>
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
                        placeholder="e.g. Mumbai, Bandra West"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                          formErrors.run_date
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                      />
                      {formErrors.run_date && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.run_date}</p>
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
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                            formErrors.distance_km
                              ? 'border-rose-400 focus:ring-rose-200'
                              : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                          }`}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          KM
                        </span>
                      </div>
                      {formErrors.distance_km && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.distance_km}</p>
                      )}
                    </div>
                  </div>

                  {/* Proof File Upload Box */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Proof of Run <span className="text-rose-500">*</span>{' '}
                      <span className="text-slate-400 font-normal">
                        (Screenshot from Strava, Nike Run, Garmin, Apple Health, etc. - Max 10MB)
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
                      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-primary-200 bg-primary-50/50">
                        <div className="flex items-center gap-3 min-w-0">
                          {proofPreview ? (
                            <img
                              src={proofPreview}
                              alt="Proof preview"
                              className="h-14 w-14 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-xl shrink-0">
                              <FaIcon icon="fa-file-pdf" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{proofFile.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {(proofFile.size / (1024 * 1024)).toFixed(2)} MB • {proofFile.type || 'File'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="proof-upload-input"
                        className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed cursor-pointer transition ${
                          formErrors.proof_file
                            ? 'border-rose-400 bg-rose-50/40 hover:bg-rose-50/60'
                            : 'border-slate-300 bg-slate-50/60 hover:bg-primary-50/30 hover:border-primary-400'
                        }`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xl mb-2">
                          <FaIcon icon="fa-cloud-arrow-up" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-700">
                          Click to select activity screenshot or document
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Supported formats: JPG, PNG, WebP, PDF (Up to 10MB)
                        </p>
                      </label>
                    )}

                    {formErrors.proof_file && (
                      <p className="text-xs text-rose-500 mt-1">{formErrors.proof_file}</p>
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
                      placeholder="e.g. Recorded via Strava on Mumbai Marine Drive..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.consent_given}
                        onChange={(e) =>
                          setForm({ ...form, consent_given: e.target.checked })
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs text-slate-600 leading-relaxed">
                        I confirm that I have completed the 10 KM run, the uploaded activity details are
                        authentic, and I agree to the campaign terms &amp; conditions of The Urban Physio.
                      </span>
                    </label>
                    {formErrors.consent_given && (
                      <p className="text-xs text-rose-500 mt-1">{formErrors.consent_given}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-base shadow-md hover:shadow-lg disabled:opacity-60 active:scale-[0.99] transition"
                    >
                      {submitting ? (
                        <>
                          <FaIcon icon="fa-spinner" className="fa-spin" />
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
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FaIcon icon="fa-magnifying-glass" className="text-primary-600" />
                      Check Live Submission Status
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Already submitted? Check your verification and reward status in real time.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={statusQuery}
                    onChange={(e) => setStatusQuery(e.target.value)}
                    placeholder="Enter Submission ID, Email, or Phone number"
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="btn-primary text-sm shrink-0 !py-2.5 !px-5"
                  >
                    {statusLoading ? <FaIcon icon="fa-spinner" className="fa-spin" /> : 'Check Status'}
                  </button>
                </form>

                {statusResult && (
                  <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 animate-fade-in space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Reference
                        </span>
                        <p className="text-sm font-bold text-slate-900">
                          {statusResult.reference_code || `UP-10K-${statusResult.id}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge(
                            statusResult.status
                          )}`}
                        >
                          {statusResult.status_label || statusResult.status}
                        </span>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${rewardBadge(
                            statusResult.reward_status
                          )}`}
                        >
                          Reward: {statusResult.reward_label || statusResult.reward_status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                        <span className="font-bold">Rejection Note: </span>
                        {statusResult.rejection_reason}
                      </div>
                    )}

                    {(statusResult.reward_status === 'approved' || statusResult.reward_status === 'eligible') && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-emerald-800">
                          Congratulations! Your run is verified. You are eligible to book your complimentary physiotherapy session.
                        </span>
                        <Link to="/book" className="btn-primary text-xs !py-1.5 !px-3 shrink-0">
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

        {/* ─── SECTION 7: FAQS ─────────────────────────────────────────────── */}
        {vis.faqs && faqs.length > 0 && (
          <section className="py-16 bg-white border-t border-slate-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6F61] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  Got Questions?
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Everything you need to know about participating, verification, and claiming your reward.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const open = activeFaq[idx] ?? false;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/40 overflow-hidden transition"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq((f) => ({ ...f, [idx]: !open }))}
                        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left font-bold text-slate-800 hover:text-primary-700 transition"
                      >
                        <span className="text-sm sm:text-base">{faq.q}</span>
                        <FaIcon
                          icon="fa-chevron-down"
                          className={`text-xs text-slate-400 shrink-0 transition-transform duration-200 ${
                            open ? 'rotate-180 text-primary-600' : ''
                          }`}
                        />
                      </button>
                      {open && (
                        <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
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

        {/* ─── SECTION 8: FINAL CTA ────────────────────────────────────────── */}
        {vis.final_cta && (
          <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white text-center relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                Start Running Today
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                {s.final_heading || 'Ready to Run 10 KM?'}
              </h2>
              <p className="text-sm sm:text-base text-primary-100 max-w-xl mx-auto leading-relaxed">
                {s.final_subheading ||
                  'Complete your run, submit your proof, and take the next step toward better recovery with The Urban Physio.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleScrollTo(formRef)}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-white text-primary-800 font-extrabold text-base shadow-xl hover:bg-primary-50 active:scale-[0.98] transition"
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
