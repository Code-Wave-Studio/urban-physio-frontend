import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfoPageLayout from '../components/InfoPageLayout';
import FaIcon from '../components/FaIcon';
import { about } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { cmsContentToHtml } from '../utils/htmlContent';
import { HEALTHCARE_IMAGES } from '../utils/healthcareImages';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

export default function AboutPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    about
      .settings()
      .then((res) => {
        const d = res.data ?? res;
        setData(d);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sections = data?.sections || {};
  const heroImage = resolveMediaUrl(data?.hero_image) || data?.hero_image || HEALTHCARE_IMAGES.about;

  return (
    <>
    <ManagedPageSeo
      fallbackTitle={data?.seo_title || data?.hero_title || 'About The Urban Physio'}
      fallbackDescription={data?.seo_description || data?.hero_subtitle || 'Trusted physiotherapy — online, clinic & home care across India.'}
    />
    <InfoPageLayout
      title={data?.hero_title || 'About The Urban Physio'}
      subtitle={data?.hero_subtitle || 'Trusted physiotherapy — online, clinic & home care across India.'}
      icon="fa-building"
      breadcrumb="Company"
      heroExtra={
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to="/book" className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-5 py-3 rounded-xl shadow-lg text-sm">
            <FaIcon icon="fa-calendar-check" />
            Book now
          </Link>
          <Link to="/doctors" className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-5 py-3 rounded-xl text-sm hover:bg-white/25 transition">
            Find doctors
          </Link>
        </div>
      }
    >
      {heroImage && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg mb-10 -mt-4 aspect-[21/7] max-h-56 sm:max-h-72">
          <img src={heroImage} alt="The Urban Physio team" className="w-full h-full object-cover" />
        </div>
      )}

      {sections.story_html && (
        <section className="glass-card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaIcon icon="fa-book-open" className="text-primary-600" />
            Our story
          </h2>
          <div className="cms-prose" dangerouslySetInnerHTML={{ __html: cmsContentToHtml(sections.story_html) }} />
        </section>
      )}

      {(sections.stats || []).length > 0 && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {sections.stats.map((s) => (
            <div
              key={s.label + s.value}
              className="rounded-2xl border border-primary-100 bg-gradient-to-br from-white to-primary-50/50 p-4 sm:p-5 text-center shadow-sm"
            >
              <p className="text-2xl sm:text-3xl font-bold text-primary-700">{s.value}</p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {sections.mission_html && (
          <section className="glass-card p-6 sm:p-8 border-l-4 border-l-primary-500">
            <h2 className="text-lg font-bold text-slate-900 mb-3">{sections.mission_title || 'Our Mission'}</h2>
            <div className="cms-prose text-sm" dangerouslySetInnerHTML={{ __html: cmsContentToHtml(sections.mission_html) }} />
          </section>
        )}
        {sections.vision_html && (
          <section className="glass-card p-6 sm:p-8 border-l-4 border-l-orange-500">
            <h2 className="text-lg font-bold text-slate-900 mb-3">{sections.vision_title || 'Our Vision'}</h2>
            <div className="cms-prose text-sm" dangerouslySetInnerHTML={{ __html: cmsContentToHtml(sections.vision_html) }} />
          </section>
        )}
      </div>

      {(sections.values || []).length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {sections.values.map((v) => (
              <div key={v.title} className="glass-card p-5 sm:p-6 flex gap-4 items-start hover:shadow-md transition">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 text-lg">
                  <FaIcon icon={v.icon || 'fa-circle-check'} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900">{v.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl sm:rounded-3xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-primary-600 to-primary-800" />
        <div className="relative p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold">{sections.cta_title || 'Start your recovery today'}</h2>
          <p className="mt-3 text-primary-100 max-w-xl mx-auto text-sm sm:text-base">{sections.cta_text}</p>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link to="/book" className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl text-sm shadow-lg">
              Book appointment
            </Link>
            <Link to="/clinics" className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition">
              Find clinic
            </Link>
            <Link to="/blog" className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition">
              Read PhysioFeed
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
    </>
  );
}
