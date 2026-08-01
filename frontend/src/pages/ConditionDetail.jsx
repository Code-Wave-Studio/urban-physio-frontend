import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import { conditions } from '../services/api';
import { bookConditionUrl } from '../utils/bookUrl';
import {
  conditionIcon,
  categoryStyle,
  parseRehabPhases,
} from '../utils/conditionHelpers';
import PageMeta, { breadcrumbSchema, medicalWebPageSchema } from '../components/seo/PageMeta';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

function SectionCard({ icon, title, children, accent = 'primary' }) {
  const accentMap = {
    primary: 'text-primary-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    violet: 'text-violet-600',
  };
  return (
    <div className="glass-card">
      <h2 className={`font-semibold text-lg mb-3 flex items-center gap-2 ${accentMap[accent] || accentMap.primary}`}>
        <FaIcon icon={icon} />
        {title}
      </h2>
      <div className="text-slate-600 text-sm md:text-base leading-relaxed">{children}</div>
    </div>
  );
}

export default function ConditionDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    conditions
      .get(slug)
      .then((res) => setItem(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center py-24">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageMeta title="Condition not found" noindex />
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center flex-1">
          <h1 className="text-2xl font-bold">Condition not found</h1>
          <Link to="/conditions" className="btn-primary inline-block mt-6">
            View all conditions
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const phases = parseRehabPhases(item.rehab_program);
  const related = item.related || [];
  const canonical = `/conditions/${item.slug}`;
  const title = item.seo_title || item.title;
  const description =
    item.seo_description ||
    item.short_description ||
    (item.description ? String(item.description).slice(0, 155) : '') ||
    `${item.title} physiotherapy and rehab at The Urban Physio.`;
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Conditions', href: '/conditions' },
    { label: item.title },
  ];
  const jsonLd = [
    medicalWebPageSchema({
      name: title,
      description,
      canonicalUrl: typeof window !== 'undefined' ? `${window.location.origin}${canonical}` : canonical,
      about: item.title,
    }),
    breadcrumbSchema(crumbs),
  ].filter(Boolean);

  const sections = [
    { key: 'description', icon: 'fa-circle-info', title: 'Overview', content: item.description, accent: 'primary' },
    { key: 'causes', icon: 'fa-triangle-exclamation', title: 'Common Causes', content: item.causes, accent: 'amber' },
    { key: 'symptoms', icon: 'fa-stethoscope', title: 'Signs & Symptoms', content: item.symptoms, accent: 'rose' },
    { key: 'goals', icon: 'fa-bullseye', title: 'Treatment Goals', content: item.goals, accent: 'violet' },
    { key: 'when_to_see', icon: 'fa-calendar-check', title: 'When to See a Physio', content: item.when_to_see, accent: 'primary' },
  ].filter((s) => s.content);

  return (
    <div className="min-h-screen flex flex-col">
      <ManagedPageSeo
        pathOverride={canonical}
        fallbackTitle={title}
        fallbackDescription={description}
        jsonLd={jsonLd}
        canonical={canonical}
        image={item.image || item.featured_image}
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-50 via-white to-primary-50 border-b border-white/60 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <SeoBreadcrumbs tone="onLight" items={crumbs} />
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${categoryStyle(item.category)}`}
            >
              <FaIcon icon={conditionIcon(item.slug, item.category)} className="text-2xl" />
            </div>
            <span className={`badge border capitalize ${categoryStyle(item.category)}`}>
              {item.category}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-800">{item.title}</h1>
          {item.short_description && (
            <p className="mt-3 text-slate-600 text-base md:text-lg">{item.short_description}</p>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 w-full space-y-6">
        {sections.map((s) => (
          <SectionCard key={s.key} icon={s.icon} title={s.title} accent={s.accent}>
            <p className="whitespace-pre-line">{s.content}</p>
          </SectionCard>
        ))}

        {/* Rehab phases timeline */}
        {(phases.length > 0 || item.rehab_program) && (
          <div className="glass-card">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-violet-700">
              <FaIcon icon="fa-route" />
              Rehabilitation Program
            </h2>
            {phases.length > 1 ? (
              <ol className="space-y-4">
                {phases.map((phase, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-slate-600 text-sm md:text-base pt-1">{phase}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-slate-600 whitespace-pre-line text-sm md:text-base">
                {item.rehab_program}
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="glass-strong rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Ready to start your recovery?</h3>
            <p className="text-slate-600 text-sm mt-1">
              Book online, clinic, or home visit with a verified physiotherapist.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link to={bookConditionUrl(item)} className="btn-primary text-center inline-flex items-center justify-center gap-2">
              <FaIcon icon="fa-calendar-check" />
              Book Appointment
            </Link>
            <Link to="/doctors" className="btn-outline text-center inline-flex items-center justify-center gap-2">
              <FaIcon icon="fa-user-doctor" />
              Find Doctors
            </Link>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Related in {item.category}</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/conditions/${r.slug}`}
                  className="glass-card p-4 block hover:border-violet-300/50"
                >
                  <span className={`badge text-[10px] capitalize ${categoryStyle(r.category)}`}>
                    {r.category}
                  </span>
                  <p className="font-semibold text-slate-800 mt-2 text-sm">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
