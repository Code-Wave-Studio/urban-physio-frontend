import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import { ALL_POLICIES } from '../constants/policyPages';

const SECTIONS = [
  {
    title: 'Discover care',
    icon: 'fa-stethoscope',
    links: [
      { to: '/', label: 'Home' },
      { to: '/doctors', label: 'Find physiotherapists' },
      { to: '/clinics', label: 'Find clinics' },
      { to: '/book', label: 'Book an appointment' },
      { to: '/search', label: 'Search' },
    ],
  },
  {
    title: 'Treatments & conditions',
    icon: 'fa-kit-medical',
    links: [
      { to: '/treatments', label: 'All treatments' },
      { to: '/conditions', label: 'All conditions' },
      { to: '/packages', label: 'Treatment packages' },
      { to: '/exercises', label: 'Exercise library' },
    ],
  },
  {
    title: 'Learn',
    icon: 'fa-book-open',
    links: [
      { to: '/blog', label: 'Blog' },
      { to: '/podcast', label: 'Podcast' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Company',
    icon: 'fa-building',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/careers', label: 'Careers' },
      { to: '/contact', label: 'Contact' },
      { to: '/cancellation-help', label: 'Cancellation help' },
    ],
  },
  {
    title: 'Policies',
    icon: 'fa-scale-balanced',
    links: ALL_POLICIES.map((p) => ({ to: p.path, label: p.label })),
  },
];

export default function HtmlSitemapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-orange-50/20">
      <ManagedPageSeo
        fallbackTitle="Sitemap"
        fallbackDescription="Browse all public pages on The Urban Physio — doctors, clinics, treatments, conditions, blog, and policies."
      />
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 md:py-14">
        <SeoBreadcrumbs
          tone="onLight"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Sitemap' },
          ]}
        />
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Sitemap</h1>
        <p className="mt-2 text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">
          A complete map of our public website. Prefer the machine-readable feed?{' '}
          <a
            href="/backend/api/sitemap"
            className="text-orange-700 font-medium hover:underline"
            rel="noopener noreferrer"
          >
            XML sitemap
          </a>
          .
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-8">
          {SECTIONS.map((section) => (
            <section key={section.title} aria-labelledby={`sitemap-${section.title}`}>
              <h2
                id={`sitemap-${section.title}`}
                className="text-sm font-bold uppercase tracking-wider text-orange-700/90 flex items-center gap-2 mb-3"
              >
                <FaIcon icon={section.icon} className="text-xs" />
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-slate-700 hover:text-orange-700 text-sm transition inline-flex items-center gap-2"
                    >
                      <FaIcon icon="fa-chevron-right" className="text-[10px] text-slate-400" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
