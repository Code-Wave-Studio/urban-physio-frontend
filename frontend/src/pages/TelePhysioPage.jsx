import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';
import { breadcrumbSchema, faqPageSchema, medicalWebPageSchema } from '../components/seo/PageMeta';
import { telephysio } from '../services/api';
import CommunityPreviewSection from '../components/community/CommunityPreviewSection';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { HEALTHCARE_IMAGES } from '../utils/healthcareImages';
import { bookTelePhysioUrl } from '../utils/bookUrl';
import { useContact } from '../contexts/ContactContext';
import { whatsappChatUrl } from '../utils/whatsapp';
import {
  TELEPHYSIO_DEFAULTS,
  TELEPHYSIO_SEO,
  mergeTelePhysioSections,
} from '../constants/telephysioDefaults';

export default function TelePhysioPage() {
  const { whatsapp } = useContact();
  const [data, setData] = useState(TELEPHYSIO_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(null);
  const [faqOpen, setFaqOpen] = useState({ 0: true, 1: true });

  useEffect(() => {
    telephysio
      .settings()
      .then((res) => {
        const d = res.data ?? res;
        setData({
          ...TELEPHYSIO_DEFAULTS,
          ...d,
          sections: mergeTelePhysioSections(d?.sections || {}),
        });
      })
      .catch(() => setData(TELEPHYSIO_DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const s = data.sections || TELEPHYSIO_DEFAULTS.sections;
  const heroImage = resolveMediaUrl(data.hero_image) || data.hero_image || HEALTHCARE_IMAGES.onlineConsult;
  const faqs = s.faqs || [];
  const testimonials = s.testimonials || [];

  const jsonLd = useMemo(
    () =>
      [
        breadcrumbSchema([
          { label: 'Home', href: '/' },
          { label: 'TelePhysio by Myoreset' },
        ]),
        medicalWebPageSchema({
          name: data.hero_title || TELEPHYSIO_DEFAULTS.hero_title,
          description: data.seo_description || TELEPHYSIO_SEO.description,
          canonicalUrl: typeof window !== 'undefined' ? `${window.location.origin}/telephysio` : undefined,
          about: { '@type': 'MedicalTherapy', name: 'Online Physiotherapy Consultation' },
        }),
        faqPageSchema(faqs),
      ].filter(Boolean),
    [data.hero_title, data.seo_description, faqs]
  );

  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const whatsappHref = useMemo(() => {
    return (
      whatsappChatUrl(whatsapp, 'Hello! I would like to inquire about TelePhysio online physiotherapy consultation.') ||
      'https://wa.me/918448945434?text=' +
        encodeURIComponent('Hello! I would like to inquire about TelePhysio online physiotherapy consultation.')
    );
  }, [whatsapp]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="telephysio-page page-enter overflow-x-hidden bg-slate-50 text-slate-800">
      <ManagedPageSeo
        fallbackTitle={data.seo_title || TELEPHYSIO_SEO.title}
        fallbackDescription={data.seo_description || TELEPHYSIO_SEO.description}
        fallbackKeywords={TELEPHYSIO_SEO.keywords}
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* =========================================================================
          SECTION 1: HERO
          ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-primary-800 to-slate-950 text-white lg:max-h-[95vh] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent pointer-events-none" aria-hidden />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 relative w-full">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-8 lg:gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white/15 border border-white/20 px-3.5 py-1.5 rounded-full mb-4 backdrop-blur-xs">
                <FaIcon icon="fa-video" className="text-teal-300" />
                <span>{s.hero_badge || 'TelePhysio by Myoreset'}</span>
              </div>
              <h1 className="text-[1.85rem] sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
                {data.hero_title || TELEPHYSIO_DEFAULTS.hero_title}
              </h1>
              <p className="mt-4 text-teal-100 text-[15px] sm:text-base md:text-lg leading-relaxed max-w-xl">
                {data.hero_subtitle || TELEPHYSIO_DEFAULTS.hero_subtitle}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link
                  to={s.hero_cta_link || bookTelePhysioUrl()}
                  className="btn-primary !bg-white !text-teal-900 hover:!bg-teal-50 shadow-xl font-bold py-3 px-6 text-center rounded-xl transition-all active:scale-[0.98]"
                >
                  <FaIcon icon="fa-video" className="mr-2 text-teal-700" />
                  {s.hero_cta_label || 'Book a TelePhysio Session'}
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 text-white font-semibold py-3 px-5 rounded-xl transition-all text-center"
                >
                  <FaIcon icon="fa-whatsapp" className="text-emerald-400 text-lg" />
                  <span>{s.secondary_cta_label || 'Talk to a Physiotherapist'}</span>
                </a>
              </div>

              {/* Trust indicators */}
              <ul className="mt-8 grid sm:grid-cols-2 gap-3 pt-6 border-t border-white/15">
                {(s.trust_signals || []).map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/95">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/30 text-teal-300 text-xs">
                      <FaIcon icon="fa-check" />
                    </span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/25 aspect-[4/3] max-h-[440px] bg-slate-900">
                <img
                  src={heroImage}
                  alt="TelePhysio by Myoreset online video consultation with a qualified physiotherapist"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3.5 bg-white/90 backdrop-blur-md rounded-xl text-slate-900 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                      <FaIcon icon="fa-stethoscope" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Live 1-on-1 Video Session</p>
                      <p className="text-[11px] text-slate-600">Secure & Encrypted Telehealth</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Clinician Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: TRUST BAR
          ========================================================================= */}
      <section className="bg-white border-b border-slate-200 shadow-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {(s.trust_bar || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-100/80"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-sm">
                  <FaIcon icon={item.icon || 'fa-check'} />
                </div>
                <span className="text-xs font-semibold text-slate-700 leading-snug">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: WHAT IS TELEPHYSIO?
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 mb-3">
                <FaIcon icon="fa-circle-info" /> Clinical Overview
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {s.what_heading || 'What Is TelePhysio?'}
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                {s.what_body}
              </p>

              <div className="mt-6 p-5 rounded-2xl bg-teal-50/60 border border-teal-100">
                <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wider mb-3">
                  {s.what_use_cases_title || 'TelePhysio is especially effective for:'}
                </h3>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {(s.what_use_cases || []).map((uc, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <FaIcon icon="fa-circle-check" className="text-teal-600 text-xs mt-1 shrink-0" />
                      <span>{uc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to={s.what_cta_link || bookTelePhysioUrl()}
                  className="btn-primary inline-flex items-center gap-2 !bg-teal-700 hover:!bg-teal-800 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  <FaIcon icon="fa-video" />
                  {s.what_cta_label || 'Book Your Online Consultation'}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50/40 p-6 shadow-sm">
                <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FaIcon icon="fa-laptop-medical" className="text-teal-600" />
                  Remote Care Architecture
                </h4>
                <div className="space-y-3.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <p className="text-xs font-bold text-teal-800">1. Real-Time Active Movement Analysis</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Visual screening of range of motion, postural compensations, and functional movement deficits.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <p className="text-xs font-bold text-teal-800">2. Guided Therapeutic Exercise</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Live technique correction ensuring safe biomechanics and proper muscular activation.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <p className="text-xs font-bold text-teal-800">3. Digital Prescription (HEP)</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Personalised daily exercises with video guides, frequency protocols, and progress checkpoints.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: WHO IS TELEPHYSIO FOR?
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Patient Profiles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.who_heading || 'Is Online Physiotherapy Right for You?'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.who_subheading}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {(s.who_cards || []).map((card, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl mb-4 border border-teal-100">
                    <FaIcon icon={card.icon || 'fa-user-check'} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Clinical advisory note */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-3.5 text-amber-900">
            <FaIcon icon="fa-triangle-exclamation" className="text-amber-600 text-lg mt-0.5 shrink-0" />
            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              {s.who_clinical_note}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: HOW TELEPHYSIO WORKS
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              4-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.how_heading || 'How TelePhysio Works'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.how_subheading}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {(s.how_steps || []).map((st, i) => {
              const isExpanded = activeStep === i;
              return (
                <div
                  key={i}
                  onClick={() => setActiveStep(isExpanded ? null : i)}
                  className={`rounded-2xl border p-6 transition-all cursor-pointer select-none ${
                    isExpanded
                      ? 'border-teal-500 bg-teal-50/50 shadow-md ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-teal-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-teal-700 tracking-wider">
                      {st.step || `0${i + 1}`}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center text-base">
                      <FaIcon icon={st.icon || 'fa-check'} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {st.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: WHAT HAPPENS DURING A SESSION
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Session Breakdown
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.session_heading || 'What Happens During Your TelePhysio Session?'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.session_subheading}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-3.5">
            {(s.session_timeline || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs"
              >
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white font-black text-sm sm:text-base shadow-sm">
                  {item.number || idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {s.session_disclaimer && (
            <p className="text-center text-xs text-slate-500 max-w-2xl mx-auto mt-6 italic">
              {s.session_disclaimer}
            </p>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: TELEPHYSIO BENEFITS
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Key Advantages
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.benefits_heading || 'Why Choose TelePhysio?'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.benefits_subheading}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {(s.benefits || []).map((ben, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 hover:bg-white hover:border-teal-200 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg mb-3.5">
                  <FaIcon icon={ben.icon || 'fa-star'} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{ben.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {ben.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: CONDITIONS / USE CASES
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Clinical Conditions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.conditions_heading || 'Conditions We Can Support Online'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.conditions_subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {(s.conditions || []).map((cond, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-sm">
                    <FaIcon icon={cond.icon || 'fa-notes-medical'} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {cond.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cond.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-7">
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl mx-auto">
              {s.conditions_clinical_note || 'Your physiotherapist will determine whether online consultation is appropriate for your condition.'}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: TELEPHYSIO EXPERIENCE
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Continuity of Care
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.experience_heading || 'Your Recovery, Guided From Anywhere'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.experience_subheading}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(s.experience_stages || []).map((stg, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2.5 py-1 rounded-md mb-3">
                    {stg.stage}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{stg.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {stg.summary}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                    {(stg.points || []).map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <FaIcon icon="fa-check" className="text-teal-600 text-xs mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: PRICING
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Affordable Care
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.pricing_heading || 'Transparent, Value-Focused Pricing'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.pricing_subheading}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {(s.pricing_cards || []).map((pkg, i) => (
              <div
                key={i}
                className="relative rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {pkg.badge && (
                  <span className="absolute -top-3 right-6 bg-teal-700 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                    {pkg.badge}
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{pkg.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{pkg.duration}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-teal-800 tracking-tight">
                      {pkg.price}
                    </span>
                    {pkg.original_price && (
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        {pkg.original_price}
                      </span>
                    )}
                  </div>

                  <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                    {(pkg.features || []).map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <FaIcon icon="fa-check-circle" className="text-teal-600 text-sm mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    to={pkg.cta_link || bookTelePhysioUrl()}
                    className="btn-primary w-full block text-center !bg-teal-700 hover:!bg-teal-800 text-white font-bold py-3 rounded-xl shadow-sm transition-all"
                  >
                    {pkg.cta_label || 'Book TelePhysio'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {s.pricing_note && (
            <p className="text-center text-xs text-slate-500 max-w-xl mx-auto mt-6">
              {s.pricing_note}
            </p>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 11: TESTIMONIALS
          ========================================================================= */}
      {testimonials.length > 0 && (
        <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
                Patient Feedback
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                {s.testimonials_heading || 'What Our Patients Say'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                {s.testimonials_subheading}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 text-xs mb-3">
                      {[...Array(t.rating || 5)].map((_, r) => (
                        <FaIcon key={r} icon="fa-star" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200/60">
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-teal-700 font-semibold">{t.condition}</p>
                    {t.location && (
                      <p className="text-[11px] text-slate-400">{t.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 12: FAQ
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {s.faq_heading || 'Frequently Asked Questions'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {s.faq_subheading}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = Boolean(faqOpen[idx]);
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left select-none font-bold text-slate-900 hover:text-teal-700 transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <FaIcon
                      icon="fa-chevron-down"
                      className={`text-xs text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-teal-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
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

      {/* =========================================================================
          SECTION 13: FINAL CTA
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-gradient-to-br from-teal-800 via-primary-900 to-slate-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {s.final_heading || 'Ready to Start Your Recovery?'}
          </h2>
          <p className="mt-3 text-sm sm:text-lg text-teal-100 max-w-xl mx-auto leading-relaxed">
            {s.final_subheading || 'Get expert physiotherapy guidance from the comfort of your home.'}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to={s.final_primary_cta_link || bookTelePhysioUrl()}
              className="btn-primary w-full sm:w-auto !bg-white !text-teal-900 hover:!bg-teal-50 shadow-xl font-bold py-3.5 px-8 rounded-xl transition-all active:scale-[0.98]"
            >
              <FaIcon icon="fa-video" className="mr-2 text-teal-700" />
              {s.final_primary_cta_label || 'Book a TelePhysio Session'}
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 text-white font-semibold py-3.5 px-6 rounded-xl transition-all w-full sm:w-auto"
            >
              <FaIcon icon="fa-whatsapp" className="text-emerald-400 text-lg" />
              <span>{s.final_secondary_cta_label || 'Talk to Us'}</span>
            </a>
          </div>
        </div>
      </section>

      <CommunityPreviewSection sections={s} accent="teal" />

      <Footer />
    </div>
  );
}
