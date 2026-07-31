import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import ClinicCard from '../components/ClinicCard';
import DoctorCard from '../components/DoctorCard';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import PageMeta, { breadcrumbSchema, cityListingSchema } from '../components/seo/PageMeta';
import { clinics, doctors, location } from '../services/api';
import { cityClinicsSeoUrl, cityDoctorsSeoUrl } from '../utils/citySeoUrls';

const PAGE_CONFIG = {
  clinics: {
    accent: 'from-emerald-600 to-teal-700',
    icon: 'fa-hospital',
    breadcrumb: 'Physiotherapy Clinics',
    emptyIcon: 'fa-hospital',
    emptyTitle: 'No clinics in this city yet',
    emptyText: 'We are expanding partner clinics. Browse all clinics or try a nearby city.',
    sisterLabel: (cityName) => `Best physiotherapists in ${cityName}`,
    sisterUrl: cityDoctorsSeoUrl,
    fetchList: (cityId) => clinics.list({ city_id: cityId }),
    renderCard: (item) => <ClinicCard key={item.id} clinic={item} variant="listing" />,
    sortItems: (items) =>
      [...items].sort((a, b) => {
        const featA = Number(a.is_featured) || 0;
        const featB = Number(b.is_featured) || 0;
        if (featB !== featA) return featB - featA;
        return (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0);
      }),
  },
  doctors: {
    accent: 'from-primary-600 to-orange-600',
    icon: 'fa-user-doctor',
    breadcrumb: 'Physiotherapists',
    emptyIcon: 'fa-user-doctor',
    emptyTitle: 'No physiotherapists in this city yet',
    emptyText: 'New doctors join regularly. Browse all doctors or check clinics in this city.',
    sisterLabel: (cityName) => `Best physiotherapy clinics in ${cityName}`,
    sisterUrl: cityClinicsSeoUrl,
    fetchList: (cityId) => doctors.list({ city_id: cityId }),
    renderCard: (item) => <DoctorCard key={item.id} doctor={item} variant="listing" />,
    sortItems: (items) =>
      [...items].sort((a, b) => {
        const ra = Number(a.rating_avg) || 0;
        const rb = Number(b.rating_avg) || 0;
        if (rb !== ra) return rb - ra;
        return (Number(b.experience_years) || 0) - (Number(a.experience_years) || 0);
      }),
  },
};

export default function CitySeoListingPage({ type, legacy = false }) {
  const { citySlug } = useParams();
  const config = PAGE_CONFIG[type];
  const [city, setCity] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    const fetchList = type === 'clinics'
      ? (cityId) => clinics.list({ city_id: cityId })
      : (cityId) => doctors.list({ city_id: cityId });

    location
      .cityBySlug(citySlug)
      .then(async (res) => {
        if (cancelled) return;
        const cityData = res?.data ?? res;
        if (!cityData?.id) {
          setNotFound(true);
          setCity(null);
          setList([]);
          return;
        }
        setCity(cityData);
        const listRes = await fetchList(cityData.id);
        if (cancelled) return;
        setList(listRes?.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setCity(null);
          setList([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [citySlug, type]);

  const sorted = useMemo(() => config.sortItems(list), [list, config]);
  const seo = city?.seo?.[type] || {};
  const canonical = city?.canonical?.[type] || '';
  const canonicalUrl = typeof window !== 'undefined' && canonical ? `${window.location.origin}${canonical}` : canonical;
  const introText = (seo.intro_content || seo.description || '').trim();

  // All hooks must run before any early return (React #310)
  const faqItems = useMemo(() => {
    try {
      const raw = seo.faq_json;
      if (typeof raw === 'string' && raw.trim()) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
      if (Array.isArray(raw)) return raw;
    } catch {
      /* ignore */
    }
    return [];
  }, [seo.faq_json]);

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: config.breadcrumb, href: type === 'clinics' ? '/clinics' : '/doctors' },
      { label: city?.name || citySlug || 'City' },
    ],
    [city?.name, citySlug, config.breadcrumb, type]
  );

  const jsonLd = useMemo(() => {
    if (!city) return null;
    const listing = cityListingSchema({ city, type, items: sorted, canonicalUrl });
    const crumbs = breadcrumbSchema(breadcrumbItems, canonicalUrl);
    const graph = [...(listing['@graph'] || []), crumbs].filter(Boolean);
    if (faqItems.length) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q || item.question || '',
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a || item.answer || '',
          },
        })),
      });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
  }, [city, type, sorted, canonicalUrl, breadcrumbItems, faqItems]);

  if (!loading && city && legacy && canonical) {
    return <Navigate to={canonical} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50/40 to-primary-50/30">
        <div className="animate-spin w-11 h-11 border-4 border-primary-600 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500 mt-4 font-medium">Loading city listings…</p>
      </div>
    );
  }

  if (notFound || !city) {
    return (
      <>
        <PageMeta title="City not found" noindex />
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-24">
          <div className="glass-card max-w-md w-full text-center p-8 md:p-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
              <FaIcon icon="fa-map-location-dot" className="text-2xl" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">City page not found</h1>
            <p className="text-slate-500 text-sm mt-2">This city may not be listed yet or the link is incorrect.</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <Link to="/clinics" className="btn-outline text-sm">Browse clinics</Link>
              <Link to="/doctors" className="btn-primary text-sm">Browse physiotherapists</Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const count = sorted.length;
  const sisterHref = config.sisterUrl(city);

  return (
    <>
      <PageMeta
        title={seo.title}
        description={seo.description}
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-primary-50/20">
        <Navbar />

        <section className={`relative overflow-hidden bg-gradient-to-br ${config.accent} text-white`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M0 0h60v60H0z\'/%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative">
            <SeoBreadcrumbs items={breadcrumbItems} />
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-4">
                <FaIcon icon={config.icon} />
                <span>{city.location_label}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {seo.h1 || seo.title}
              </h1>
              <p className="text-white/90 mt-4 text-base md:text-lg leading-relaxed max-w-2xl">
                {seo.description}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[7rem]">
                <p className="text-[11px] font-bold uppercase text-white/70">Listed</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
              {city.doctor_count > 0 && (
                <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[7rem]">
                  <p className="text-[11px] font-bold uppercase text-white/70">Physiotherapists in city</p>
                  <p className="text-2xl font-bold">{city.doctor_count}</p>
                </div>
              )}
              {city.clinic_count > 0 && (
                <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[7rem]">
                  <p className="text-[11px] font-bold uppercase text-white/70">Clinics in city</p>
                  <p className="text-2xl font-bold">{city.clinic_count}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
          {seo.intro_content && (
            <div className="prose prose-slate max-w-3xl mb-8 text-slate-700 whitespace-pre-line">
              {seo.intro_content}
            </div>
          )}

          {count > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
              {sorted.map((item) => config.renderCard(item))}
            </div>
          ) : (
            <div className="glass-card text-center py-16 px-6 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <FaIcon icon={config.emptyIcon} className="text-2xl" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{config.emptyTitle}</h2>
              <p className="text-slate-500 text-sm mt-2">{config.emptyText}</p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <Link to={type === 'clinics' ? '/clinics' : '/doctors'} className="btn-outline text-sm">
                  Browse all
                </Link>
                <Link to={sisterHref} className="btn-primary text-sm">
                  {config.sisterLabel(city.name)}
                </Link>
              </div>
            </div>
          )}

          {faqItems.length > 0 && (
            <section className="mt-12 max-w-3xl">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
              <div className="space-y-3">
                {faqItems.map((item, idx) => (
                  <details key={idx} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <summary className="font-semibold text-slate-900 cursor-pointer">
                      {item.q || item.question}
                    </summary>
                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{item.a || item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {count > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-900">Also explore in {city.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {type === 'clinics'
                    ? 'Find verified physiotherapists serving this city.'
                    : 'Discover partner physiotherapy clinics near you.'}
                </p>
              </div>
              <Link to={sisterHref} className="btn-primary text-sm inline-flex items-center gap-2 shrink-0">
                {config.sisterLabel(city.name)}
                <FaIcon icon="fa-arrow-right" className="text-xs" />
              </Link>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
