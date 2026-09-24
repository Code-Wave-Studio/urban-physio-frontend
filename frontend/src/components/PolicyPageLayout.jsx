import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FaIcon from './FaIcon';
import { ALL_POLICIES, POLICY_LAST_UPDATED } from '../constants/policyPages';

function PolicySection({ section }) {
  return (
    <section id={section.id} className="scroll-mt-28 glass-card">
      <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4 flex items-start gap-2">
        <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 text-sm">
          <FaIcon icon="fa-chevron-right" className="text-xs" />
        </span>
        {section.title}
      </h2>
      {section.paragraphs?.map((p, i) => (
        <p key={i} className="text-slate-600 text-sm md:text-base leading-relaxed mb-4 last:mb-0">
          {p}
        </p>
      ))}
      {section.bullets?.length > 0 && (
        <ul className="space-y-2.5 mt-2">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-slate-600 text-sm md:text-base leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PolicyPageLayout({ policy }) {
  const location = useLocation();
  const [activeId, setActiveId] = useState(policy.sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    policy.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [policy.sections]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-primary-50/30">
      <Navbar />

      
      <section className={`relative overflow-hidden bg-gradient-to-br ${policy.accent} text-white`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M0 0h60v60H0z\'/%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 relative">
          <nav className="flex items-center gap-2 text-sm text-white/80 mb-6 flex-wrap">
            <Link to="/" className="hover:text-white transition">
              Home
            </Link>
            <FaIcon icon="fa-chevron-right" className="text-xs opacity-60" />
            <span className="text-white/90">Legal</span>
            <FaIcon icon="fa-chevron-right" className="text-xs opacity-60" />
            <span className="text-white font-medium">{policy.title}</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-4">
                <FaIcon icon={policy.icon} />
                <span>Legal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{policy.title}</h1>
              <p className="text-white/90 mt-3 text-base md:text-lg leading-relaxed">{policy.subtitle}</p>
            </div>
            <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/20 text-sm">
              <p className="text-white/70 text-xs uppercase tracking-wide">Last updated</p>
              <p className="font-semibold mt-1">{POLICY_LAST_UPDATED}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex-1 w-full">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          {/* Sidebar TOC — desktop */}
          <aside className="hidden lg:block">
            <div className="glass-strong rounded-2xl p-5 sticky top-24">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">On this page</p>
              <nav className="space-y-1">
                {policy.sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition ${
                      activeId === s.id
                        ? 'bg-primary-100 text-primary-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s.title.replace(/^\d+\.\s*/, '')}
                  </button>
                ))}
              </nav>
              <hr className="my-4 border-slate-200/80" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Other policies</p>
              <ul className="space-y-1">
                {ALL_POLICIES.filter((p) => p.path !== policy.path).map((p) => (
                  <li key={p.key}>
                    <Link
                      to={p.path}
                      className={`text-xs py-1.5 px-2 rounded-lg flex items-center gap-2 transition ${
                        location.pathname === p.path
                          ? 'text-primary-700 font-medium'
                          : 'text-slate-600 hover:text-primary-600'
                      }`}
                    >
                      <FaIcon icon={p.icon} className="text-primary-500 w-3" />
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          
          <div className="lg:hidden mb-6 -mx-1 overflow-x-auto pb-2">
            <div className="flex gap-2 px-1 min-w-max">
              {policy.sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`shrink-0 text-xs px-3 py-2 rounded-full border transition ${
                    activeId === s.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {s.title.replace(/^\d+\.\s*/, '')}
                </button>
              ))}
            </div>
          </div>

          
          <main className="space-y-6 min-w-0">
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 flex gap-3 text-sm text-amber-950">
              <FaIcon icon="fa-circle-info" className="text-amber-600 mt-0.5 shrink-0" />
              <p>
                This document is provided for transparency and does not constitute legal advice. For specific concerns,
                contact <a href="mailto:support@theurbanphysio.com" className="font-medium underline">support@theurbanphysio.com</a>.
              </p>
            </div>

            {policy.sections.map((section) => (
              <PolicySection key={section.id} section={section} />
            ))}

            
            <div className="glass-card !p-6 md:!p-8">
              <h3 className="font-bold text-slate-900 mb-4">Explore other policies</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_POLICIES.map((p) => (
                  <Link
                    key={p.key}
                    to={p.path}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition group ${
                      location.pathname === p.path
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-slate-200 bg-white hover:border-primary-200 hover:shadow-md'
                    }`}
                  >
                    <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition">
                      <FaIcon icon={p.icon} />
                    </span>
                    <span className="font-medium text-slate-800 text-sm group-hover:text-primary-700">{p.label}</span>
                    <FaIcon icon="fa-arrow-right" className="ml-auto text-slate-400 text-xs group-hover:text-primary-600" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/" className="btn-outline text-sm">
                <FaIcon icon="fa-house" className="mr-2" />
                Back to home
              </Link>
              <Link to="/book" className="btn-primary text-sm">
                Book a session
              </Link>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
