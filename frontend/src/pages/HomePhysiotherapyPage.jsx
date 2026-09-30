import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';
import { breadcrumbSchema, faqPageSchema, medicalWebPageSchema } from '../components/seo/PageMeta';
import Expandable, { AccordionItem } from '../components/homePhysio/Expandable';
import { CheckRow, CtaLink, QuoteCard, SectionHead } from '../components/homePhysio/HomePhysioUi';
import CommunityPreviewSection from '../components/community/CommunityPreviewSection';
import PainSelectionSection from '../components/home/PainSelectionSection';
import RecoveryRoadmapSection from '../components/roadmap/RecoveryRoadmapSection';
import CareEcosystemSection from '../components/ecosystem/CareEcosystemSection';
import PhysioTeamSection from '../components/physioTeam/PhysioTeamSection';
import OrgLogosSection from '../components/orgLogos/OrgLogosSection';
import EnrollmentSection from '../components/enrollment/EnrollmentSection';
import { homePhysio } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { HEALTHCARE_IMAGES } from '../utils/healthcareImages';
import { bookHomeVisitUrl, withPainAreaParams } from '../utils/bookUrl';
import { faqsWithLivePrices, homePhysioTierBookLink, tierButtonLabel } from '../constants/homePhysioTiers';
import { isSectionOn } from '../constants/sectionVisibility';
import {
  HOME_PHYSIO_DEFAULTS,
  HOME_PHYSIO_SEO,
  mergeHomePhysioSections,
} from '../constants/homePhysioDefaults';
import { HOME_PAIN_MAP_DEFAULTS, isPainMapEnabled, painMapSectionProps, visiblePainAreas } from '../constants/painMapDefaults';
import { isRoadmapEnabled } from '../constants/recoveryRoadmapDefaults';
import { isEcosystemEnabled } from '../constants/careEcosystemDefaults';
import { isEnrolEnabled } from '../constants/enrollmentDefaults';
import { useContact } from '../contexts/ContactContext';
import { ANALYTICS_EVENTS, trackCta, trackEvent } from '../utils/analytics';
import { serviceOfferSchema } from '../utils/seoSchema';

function toTelHref(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const body = /^tel:/i.test(raw) ? raw.slice(4) : raw;
  const compact = body.replace(/[^\d+]/g, '');
  return compact ? `tel:${compact}` : '';
}

function categoryItems(cat) {
  return Array.isArray(cat.items)
    ? cat.items
    : String(cat.items || '')
        .split(/\s*[·\n]\s*/)
        .filter(Boolean);
}

export default function HomePhysiotherapyPage() {
  const { phone } = useContact();
  const [data, setData] = useState(HOME_PHYSIO_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [fitHomeOpen, setFitHomeOpen] = useState(false);
  const [fitClinicOpen, setFitClinicOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffItemOpen, setDiffItemOpen] = useState({});
  const [tierOpen, setTierOpen] = useState({});
  const [howOpen, setHowOpen] = useState(null);
  const [condOpen, setCondOpen] = useState(false);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(null);
  const [faqOpen, setFaqOpen] = useState({ 0: true, 1: true });

  useEffect(() => {
    homePhysio
      .settings()
      .then((res) => {
        const d = res.data ?? res;
        setData({
          ...HOME_PHYSIO_DEFAULTS,
          ...d,
          sections: mergeHomePhysioSections(d?.sections || {}),
        });
      })
      .catch((err) => {
        console.warn('Home Physiotherapy CMS content failed to load; showing defaults.', err);
        setData(HOME_PHYSIO_DEFAULTS);
      })
      .finally(() => setLoading(false));
  }, []);

  // Analytics: one service_view per page visit once the CMS content is on screen.
  useEffect(() => {
    if (loading) return;
    trackEvent(ANALYTICS_EVENTS.SERVICE_VIEW, {
      item_id: 'home_physiotherapy',
      item_name: 'Home Physiotherapy',
      service_type: 'home_physiotherapy',
    });
  }, [loading]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return undefined;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
      return undefined;
    }
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    toTop();
    const t = window.setTimeout(toTop, 80);
    return () => window.clearTimeout(t);
  }, [loading]);

  const s = data.sections || HOME_PHYSIO_DEFAULTS.sections;
  const showHero = isSectionOn(s, 'hero_enabled');
  const showHeroBook = isSectionOn(s, 'hero_cta_enabled');
  const showHeroCall = isSectionOn(s, 'hero_call_enabled');
  const callHref = toTelHref(s.hero_call_link || phone);
  const showStory = isSectionOn(s, 'story_enabled');
  const showBook = isSectionOn(s, 'book_enabled');
  const showPricing = isSectionOn(s, 'pricing_enabled');
  const showVoice = isSectionOn(s, 'voice_enabled');
  const showCommunity = isSectionOn(s, 'community_enabled');
  const heroImage = resolveMediaUrl(data.hero_image) || data.hero_image || HEALTHCARE_IMAGES.homeVisit;
  const faqs = showVoice ? faqsWithLivePrices(s.faqs || [], s.tiers, s.pricing_packages) : [];
  const testimonials = s.testimonials || [];
  const featuredQuotes = testimonials.slice(0, 2);
  const carouselQuotes = testimonials.slice(2);
  const painPoints = useMemo(() => visiblePainAreas(s.pain_areas), [s.pain_areas]);

  const buildHomePainBookUrl = useMemo(
    () => (area) => {
      if (s.pain_book_link) return withPainAreaParams(s.pain_book_link, area);
      return bookHomeVisitUrl({
        pain_type: area.chipLabel,
        pain_description: area.accordionDescription || area.headline,
      });
    },
    [s.pain_book_link]
  );

  const jsonLd = useMemo(
    () =>
      [
        breadcrumbSchema([
          { label: 'Home', href: '/' },
          { label: 'Home Physiotherapy' },
        ]),
        medicalWebPageSchema({
          name: data.hero_title || HOME_PHYSIO_DEFAULTS.hero_title,
          description: data.seo_description || HOME_PHYSIO_SEO.description,
          canonicalUrl: typeof window !== 'undefined' ? `${window.location.origin}/home-physiotherapy` : undefined,
          about: { '@type': 'MedicalTherapy', name: 'Home physiotherapy' },
        }),
        faqPageSchema(faqs),
        // Service + plan/price schema built only from the live CMS tiers/packages (offers without a real price are skipped).
        serviceOfferSchema({
          name: 'Home Physiotherapy',
          serviceType: 'Physiotherapy home visit',
          description: data.seo_description || HOME_PHYSIO_SEO.description,
          url: typeof window !== 'undefined' ? `${window.location.origin}/home-physiotherapy` : undefined,
          areaServed: (s.areas || []).map((a) => a?.name),
          catalogName: 'Home physiotherapy session pricing',
          offers: [
            ...(s.tiers || []).map((t) => ({
              name: `${t.name} – single home session`,
              price: t.price,
              description: t.summary,
              url:
                typeof window !== 'undefined'
                  ? `${window.location.origin}/home-physiotherapy#tier-${t.key}`
                  : undefined,
            })),
            ...(s.pricing_packages || []).map((p) => ({
              name: `${p.name} – ${p.sessions}`,
              price: p.price,
            })),
          ],
        }),
      ].filter(Boolean),
    [data.hero_title, data.seo_description, faqs, s.areas, s.tiers, s.pricing_packages]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="hp-page page-enter overflow-x-clip">
      <ManagedPageSeo
        fallbackTitle={data.seo_title || HOME_PHYSIO_SEO.title}
        fallbackDescription={data.seo_description || HOME_PHYSIO_SEO.description}
        fallbackKeywords={HOME_PHYSIO_SEO.keywords}
        jsonLd={jsonLd}
        preferFallbackWhenUnmanaged
      />
      <Navbar />

      {showHero && (
      <>
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-primary-700 to-primary-950 text-white lg:max-h-[95vh] flex flex-col justify-center">
        <div className="absolute inset-0 hp-hero-grid pointer-events-none" aria-hidden />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 relative w-full">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-8 lg:gap-14 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white/15 border border-white/20 px-3 py-1.5 rounded-full mb-4">
                <FaIcon icon="fa-house-medical" />
                PhysioAtHome
              </p>
              <h1 className="text-[1.75rem] sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15]">
                {data.hero_title}
              </h1>
              <p className="mt-4 text-primary-100 text-[15px] md:text-lg leading-relaxed max-w-xl">
                {data.hero_subtitle}
              </p>
              {(showHeroBook || (showHeroCall && callHref)) && (
              <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                {showHeroBook && (
                <CtaLink
                  to={s.hero_cta_link}
                  ctaId="hp_hero_book"
                  className="btn-primary !bg-white !text-primary-700 hover:!bg-orange-50 shadow-lg w-full sm:w-auto"
                >
                  {s.hero_cta_label}
                </CtaLink>
                )}
                {showHeroCall && callHref && (
                <a
                  href={callHref}
                  onClick={() => trackCta({ id: 'hp_hero_call', label: s.hero_call_label || 'Call Now', href: callHref })}
                  className="btn-primary !bg-white !text-primary-700 hover:!bg-orange-50 shadow-lg booking-cta-shadow inline-flex items-center justify-center gap-2 min-h-11 px-6 w-full sm:w-auto"
                >
                  <FaIcon icon="fa-phone" />
                  {s.hero_call_label || 'Call Now'}
                </a>
                )}
              </div>
              )}
              <ul className="mt-8 grid sm:grid-cols-2 gap-2.5">
                {(s.trust_signals || []).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/90">
                    <FaIcon icon="fa-circle-check" className="text-emerald-300 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="hp-hero-photo rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/25 aspect-[4/3] max-h-[420px]">
                <img
                  src={heroImage}
                  alt="Hospital-trained physiotherapist providing a home physiotherapy session"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-orange-100" aria-label="Trust signals">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 md:gap-3">
            {(s.trust_bar || []).map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2.5 rounded-2xl bg-orange-50/80 border border-orange-100/80 px-3 py-2.5 min-w-0"
              >
                <span className="shrink-0 w-9 h-9 rounded-xl bg-white text-primary-600 flex items-center justify-center shadow-sm">
                  <FaIcon icon={item.icon || 'fa-circle-check'} className="text-sm" />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </>
      )}

      <OrgLogosSection />

      {isPainMapEnabled(s) && (
        <PainSelectionSection
          {...painMapSectionProps(s, {
            accent: 'primary',
            headingId: 'hp-pain-map-heading',
            painPoints,
            buildBookUrl: buildHomePainBookUrl,
            copyDefaults: HOME_PAIN_MAP_DEFAULTS,
            className: 'pain-map-section hp-pain-map',
          })}
        />
      )}

      {isRoadmapEnabled(s) && <RecoveryRoadmapSection theme="home" sections={s} />}

      {isEcosystemEnabled(s) && <CareEcosystemSection theme="home" sections={s} />}

      <PhysioTeamSection />

      {isEnrolEnabled(s) && <EnrollmentSection theme="home" sections={s} />}

      {showStory && (
      <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
        <SectionHead eyebrow="Choose your format" heading={s.fit_heading} intro={s.fit_intro} />
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="glass-card p-5 sm:p-7 border-l-4 border-l-primary-500">
            <h3 className="font-bold text-slate-900 mb-4">{s.fit_home_title}</h3>
            <ul className="space-y-3">
              {(s.fit_home_items || []).slice(0, 2).map((item) => (
                <CheckRow key={item}>{item}</CheckRow>
              ))}
            </ul>
            <Expandable
              id="fit-home"
              open={fitHomeOpen}
              onToggle={() => setFitHomeOpen((v) => !v)}
              label={`${s.fit_toggle} ↓`}
              className="mt-4"
            >
              <ul className="space-y-3 pt-3">
                {(s.fit_home_items || []).slice(2).map((item) => (
                  <CheckRow key={item}>{item}</CheckRow>
                ))}
              </ul>
            </Expandable>
          </div>
          <div className="glass-card p-5 sm:p-7 border-l-4 border-l-slate-300">
            <h3 className="font-bold text-slate-900 mb-4">{s.fit_clinic_title}</h3>
            <ul className="space-y-3">
              {(s.fit_clinic_items || []).slice(0, 2).map((item) => (
                <CheckRow key={item} tone="neutral">
                  {item}
                </CheckRow>
              ))}
            </ul>
            <Expandable
              id="fit-clinic"
              open={fitClinicOpen}
              onToggle={() => setFitClinicOpen((v) => !v)}
              label={`${s.fit_toggle} ↓`}
              className="mt-4"
            >
              <ul className="space-y-3 pt-3">
                {(s.fit_clinic_items || []).slice(2).map((item) => (
                  <CheckRow key={item} tone="neutral">
                    {item}
                  </CheckRow>
                ))}
              </ul>
            </Expandable>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-primary-50/70 border border-primary-100 p-5 sm:p-6 text-center">
          <p className="text-sm md:text-base text-slate-700 max-w-3xl mx-auto leading-relaxed">
            {s.fit_reassurance}
          </p>
          <div className="mt-5">
            <CtaLink to={s.hero_cta_link} ctaId="hp_fit_book">{s.fit_cta_label}</CtaLink>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
          <SectionHead eyebrow="Outcomes" heading={s.why_heading} intro={s.why_intro} />
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {(s.why_items || []).map((item, i) => (
              <article key={item.title} className="glass-card p-5 sm:p-6 h-full">
                <span className="inline-flex w-9 h-9 rounded-xl bg-primary-50 text-primary-700 text-sm font-bold items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="font-bold text-slate-900 mt-3">{item.title}</h3>
                <p className={`mt-2 text-sm text-slate-600 leading-relaxed ${whyOpen ? '' : 'line-clamp-3'}`}>
                  {item.body}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Expandable
              id="why-works"
              open={whyOpen}
              onToggle={() => setWhyOpen((v) => !v)}
              label={`${s.why_toggle} ↓`}
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
        <SectionHead eyebrow="The TUP difference" heading={s.difference_heading} intro={s.difference_intro} />
        <div className="space-y-3 max-w-4xl mx-auto">
          {(s.difference_items || []).slice(0, 2).map((item, i) => {
            const id = `diff-${i}`;
            return (
              <AccordionItem
                key={item.title}
                id={id}
                open={!!diffItemOpen[id]}
                onToggle={() => setDiffItemOpen((prev) => ({ ...prev, [id]: !prev[id] }))}
                title={item.title}
                indexLabel={i + 1}
              >
                {item.body}
              </AccordionItem>
            );
          })}
          {(s.difference_items || []).length > 2 && (
            <Expandable
              id="diff-more"
              open={diffOpen}
              onToggle={() => setDiffOpen((v) => !v)}
              label={`${s.difference_toggle} ↓`}
              className="pt-1 text-center"
            >
              {diffOpen && (
                <div className="space-y-3 pt-3 text-left">
                  {(s.difference_items || []).slice(2).map((item, i) => {
                    const id = `diff-more-${i}`;
                    return (
                      <AccordionItem
                        key={item.title}
                        id={id}
                        open={diffItemOpen[id] !== false}
                        onToggle={() =>
                          setDiffItemOpen((prev) => ({ ...prev, [id]: prev[id] === false }))
                        }
                        title={item.title}
                        indexLabel={i + 3}
                      >
                        {item.body}
                      </AccordionItem>
                    );
                  })}
                </div>
              )}
            </Expandable>
          )}
        </div>
      </section>
      </>
      )}

      {showBook && (
      <>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
          <SectionHead eyebrow="Choose your physio" heading={s.tiers_heading} intro={s.tiers_intro} />
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {(s.tiers || []).map((tier) => {
              const open = !!tierOpen[tier.key];
              const featured = Boolean(tier.badge);
              return (
                <article
                  key={tier.key}
                  className={`glass-card p-5 sm:p-6 flex flex-col relative pt-7 ${
                    featured ? 'ring-2 ring-primary-400 md:-translate-y-1 shadow-lg' : ''
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute top-0 left-5 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wide bg-primary-600 text-white px-2.5 py-1 rounded-full">
                      {tier.badge}
                    </span>
                  )}
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-600">{tier.name}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{tier.price}</p>
                  <p className="text-sm text-slate-500">
                    per session · <span className="line-through">{tier.original}</span>
                  </p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">{tier.summary}</p>
                  <Expandable
                    id={`tier-${tier.key}`}
                    open={open}
                    onToggle={() => {
                      if (!open) {
                        trackEvent(
                          ANALYTICS_EVENTS.PLAN_VIEW,
                          { plan_id: tier.key, plan_name: tier.name, service_type: 'home_physiotherapy', section: 'tiers' },
                          { oncePerSession: `hp-tier-${tier.key}` }
                        );
                      }
                      setTierOpen((prev) => ({ ...prev, [tier.key]: !prev[tier.key] }));
                    }}
                    label="See details ↓"
                    className="mt-4"
                  >
                    <dl className="mt-3 space-y-2.5 text-sm text-slate-600">
                      <div>
                        <dt className="font-semibold text-slate-800">Qualification</dt>
                        <dd>{tier.qualification}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-800">Experience</dt>
                        <dd>{tier.experience}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-800">Speciality</dt>
                        <dd>{tier.speciality}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-800">Case handling</dt>
                        <dd>{tier.case_handling}</dd>
                      </div>
                    </dl>
                  </Expandable>
                  <Link
                    to={homePhysioTierBookLink(tier.key, tier.cta_link)}
                    onClick={() =>
                      trackCta({
                        id: `hp_tier_${tier.key}_book`,
                        label: tierButtonLabel(tier),
                        href: homePhysioTierBookLink(tier.key, tier.cta_link),
                      })
                    }
                    className="btn-primary mt-5 w-full justify-center text-sm min-h-11"
                  >
                    {tierButtonLabel(tier)}
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="mt-7 text-center text-sm text-slate-600 max-w-2xl mx-auto">{s.tiers_note}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
        <SectionHead eyebrow="Simple process" heading={s.how_heading} />
        <div className="space-y-3 max-w-3xl mx-auto">
          {(s.how_steps || []).map((step, i) => (
            <AccordionItem
              key={step.title}
              id={`how-${i}`}
              open={howOpen === i}
              onToggle={() => setHowOpen((prev) => (prev === i ? null : i))}
              title={step.title}
              indexLabel={i + 1}
            >
              {step.body}
            </AccordionItem>
          ))}
        </div>
        <div className="mt-8 text-center">
          <CtaLink to={s.how_cta_link} ctaId="hp_how_book">{s.how_cta_label}</CtaLink>
        </div>
      </section>

      <section className="bg-orange-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
          <SectionHead eyebrow="Clinical coverage" heading={s.conditions_heading} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(s.conditions_featured || []).map((name) => (
              <div
                key={name}
                className="glass-card p-4 sm:p-5 text-center font-semibold text-slate-800 text-sm min-h-[4.5rem] flex items-center justify-center"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Expandable
              id="all-conditions"
              open={condOpen}
              onToggle={() => setCondOpen((v) => !v)}
              label={`${s.conditions_toggle} ↓`}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 text-left">
                {(s.conditions_categories || []).map((cat) => (
                  <div key={cat.name} className="glass-card p-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-2">{cat.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{categoryItems(cat).join(' · ')}</p>
                  </div>
                ))}
              </div>
            </Expandable>
          </div>
          <div className="mt-8 text-center">
            <CtaLink to={s.hero_cta_link} ctaId="hp_conditions_book">{s.conditions_cta_label}</CtaLink>
          </div>
        </div>
      </section>
      </>
      )}

      {showPricing && (
      <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
        <SectionHead eyebrow="Transparent rates" heading={s.pricing_heading} />
        <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {(s.pricing_sessions || []).map((row) => (
            <div key={row.name} className="glass-card p-4 text-center">
              <p className="text-sm font-semibold text-slate-800">{row.name}</p>
              <p className="mt-2 text-xs text-slate-400 line-through">{row.original}</p>
              <p className="text-2xl font-bold text-primary-700">{row.price}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Expandable
            id="packages"
            open={pkgOpen}
            onToggle={() => {
              if (!pkgOpen) {
                trackEvent(
                  ANALYTICS_EVENTS.PLAN_VIEW,
                  { plan_id: 'session_packages', plan_name: 'Session packages', service_type: 'home_physiotherapy', section: 'pricing' },
                  { oncePerSession: 'hp-packages' }
                );
              }
              setPkgOpen((v) => !v);
            }}
            label={`${s.pricing_toggle} ↓`}
          >
            <div className="grid md:grid-cols-3 gap-4 pt-5 text-left max-w-4xl mx-auto">
              {(s.pricing_packages || []).map((pkg) => (
                <div key={pkg.name} className="glass-card p-5">
                  <p className="font-bold text-slate-900">{pkg.name}</p>
                  <p className="text-sm text-slate-500">{pkg.sessions}</p>
                  <p className="mt-2 text-2xl font-bold text-primary-700">{pkg.price}</p>
                  <p className="text-xs font-semibold text-emerald-700 mt-1">{pkg.save}</p>
                </div>
              ))}
            </div>
          </Expandable>
        </div>
        <p className="mt-6 text-center text-sm font-medium text-orange-700">{s.pricing_offer}</p>
        <p className="mt-2 text-center text-xs text-slate-500">{s.pricing_payment}</p>
        <div className="mt-6 text-center">
          <CtaLink to={s.pricing_cta_link} ctaId="hp_pricing_book">{s.pricing_cta_label}</CtaLink>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
          <SectionHead eyebrow="Service area" heading={s.areas_heading} />
          <div className="flex flex-wrap justify-center gap-2">
            {(s.areas || []).map((city, i) => {
              const open = areaOpen === i;
              return (
                <button
                  key={city.name}
                  type="button"
                  aria-expanded={open}
                  onClick={() => {
                    if (!open) {
                      trackEvent(ANALYTICS_EVENTS.CHIP_SELECT, {
                        chip_id: `area_${i}`,
                        chip_label: city.name,
                        section: 'service_area',
                        service_type: 'home_physiotherapy',
                      });
                    }
                    setAreaOpen(open ? null : i);
                  }}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    open
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
          {areaOpen != null && s.areas?.[areaOpen]?.localities && (
            <p className="mt-5 mx-auto max-w-2xl text-center text-sm text-slate-600 leading-relaxed glass-card p-4">
              {s.areas[areaOpen].localities}
            </p>
          )}
          <p className="mt-6 text-center text-sm text-slate-600">{s.areas_pincode}</p>
        </div>
      </section>
      </>
      )}

      {showVoice && (
      <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
        <SectionHead eyebrow="Patient stories" heading={s.testimonials_heading} />
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          {featuredQuotes.map((t) => (
            <QuoteCard key={t.name} quote={t} featured />
          ))}
        </div>
        {carouselQuotes.length > 0 && (
          <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-4">
            {carouselQuotes.map((t) => (
              <div key={t.name} className="mobile-scroll-item min-w-[260px]">
                <QuoteCard quote={t} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-orange-50/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 section-pad">
          <SectionHead heading={s.faq_heading} />
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <AccordionItem
                key={item.q}
                id={`hp-faq-${i}`}
                open={!!faqOpen[i]}
                onToggle={() => setFaqOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
                title={item.q}
                icon="fa-circle-question"
              >
                {item.a}
              </AccordionItem>
            ))}
          </div>
        </div>
      </section>
      </>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl text-white text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-primary-600 to-primary-800" />
          <div className="relative px-6 py-10 sm:py-12">
            <h2 className="text-2xl sm:text-3xl font-bold">{s.hero_cta_label}</h2>
            <p className="mt-3 text-primary-100 max-w-xl mx-auto text-sm sm:text-base">{s.fit_reassurance}</p>
            <div className="mt-6">
              <CtaLink
                to={s.hero_cta_link}
                ctaId="hp_final_book"
                className="btn-primary !bg-white !text-primary-700 hover:!bg-orange-50"
              >
                {s.hero_cta_label}
              </CtaLink>
            </div>
          </div>
        </div>
      </section>

      {showCommunity && <CommunityPreviewSection sections={s} accent="orange" />}

      <Footer />
    </div>
  );
}
