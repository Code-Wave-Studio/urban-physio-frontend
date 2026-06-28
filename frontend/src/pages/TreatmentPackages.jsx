import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import PackageDetailModal from '../components/packages/PackageDetailModal';
import TreatmentPackagesBrowser from '../components/packages/TreatmentPackagesBrowser';
import { treatmentPackages } from '../services/api';
import { bookPackageUrl } from '../utils/bookUrl';
import { formatPackagePrice, PACKAGE_HIGHLIGHTS } from '../utils/packageHelpers';

const FALLBACK = [
  {
    id: 1,
    name: '10-Day Recovery Package',
    slug: '10-day-recovery',
    duration_days: 10,
    total_sessions: 10,
    short_description: 'Intensive 10-day physiotherapy recovery program',
    description: 'Structured daily physiotherapy over 10 days — ideal for acute pain relief and early rehabilitation.',
    price: 5999,
    discount_price: 4999,
    mrp_price: 5999,
    consultation_type: 'clinic',
  },
  {
    id: 2,
    name: '15-Day Rehab Package',
    slug: '15-day-rehab',
    duration_days: 15,
    total_sessions: 15,
    short_description: 'Complete 15-day rehabilitation program',
    description: 'Mid-term rehab package with progressive exercises and guided sessions over 15 days.',
    price: 8999,
    discount_price: 7499,
    mrp_price: 8999,
    consultation_type: 'home_visit',
  },
  {
    id: 3,
    name: '30-Day Complete Care',
    slug: '30-day-complete-care',
    duration_days: 30,
    total_sessions: 30,
    short_description: 'Full 30-day comprehensive physiotherapy care',
    description: 'Long-term recovery and strength-building program with 30 guided sessions over 30 days.',
    price: 14999,
    discount_price: 12999,
    mrp_price: 14999,
    consultation_type: 'online',
  },
];

export default function TreatmentPackages() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    treatmentPackages
      .list()
      .then((res) => {
        const data = res.data?.length ? res.data : FALLBACK;
        setList(
          data.map((p) => ({
            ...p,
            discount_price: p.discount_price ?? p.price,
            mrp_price: p.mrp_price ?? p.price,
            consultation_type: p.consultation_type || 'any',
          }))
        );
      })
      .catch(() => setList(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const openDetail = async (slug) => {
    try {
      const res = await treatmentPackages.get(slug);
      setSelected(res.data ?? res);
    } catch {
      setSelected(list.find((p) => p.slug === slug) || null);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-slate-50">
      <Navbar />

      <section className="relative pt-24 pb-14 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-700 to-slate-900" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-[1]">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
            >
              <FaIcon icon="fa-box-open" />
              Structured Recovery Programs
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 tracking-tight text-white"
            >
              Treatment Packages
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-4 text-sm sm:text-lg text-orange-100/95 leading-relaxed max-w-2xl"
            >
              Browse clinic, home visit, and online programs — pick your package, choose your physiotherapist, and track every session.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="flex flex-wrap gap-4 mt-6"
            >
              {['Secure checkout', 'Session tracking', 'Expert physiotherapists'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/10 px-3 py-1.5 rounded-full">
                  <FaIcon icon="fa-check-circle" className="text-amber-200" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-[2] pb-20">
        <section className="glass-strong rounded-2xl p-5 sm:p-6 mb-8 md:mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-4">How booking works</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Choose category', desc: 'Clinic, home or online', icon: 'fa-layer-group' },
              { step: '2', title: 'Select package', desc: 'Sessions & duration that fit you', icon: 'fa-box-open' },
              { step: '3', title: 'Pick doctor', desc: 'Your dedicated physiotherapist', icon: 'fa-user-doctor' },
              { step: '4', title: 'Pay & track', desc: 'Secure checkout + progress dashboard', icon: 'fa-chart-line' },
            ].map((s) => (
              <div key={s.step} className="flex gap-3 sm:flex-col sm:text-center sm:items-center">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold shrink-0 sm:mx-auto">
                  <FaIcon icon={s.icon} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-strong rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 mb-8 md:mb-10">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Browse packages</h2>
            <p className="text-sm text-slate-600 mt-1">
              Filter by how you want to receive care — no more scrolling through one long list.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <TreatmentPackagesBrowser
              packages={list}
              getBookUrl={(pkg) => bookPackageUrl(pkg.slug)}
            />
          )}

          {!loading && list.length > 0 && (
            <p className="text-center mt-6 text-sm text-slate-500">
              Need more detail?{' '}
              <button
                type="button"
                onClick={() => openDetail(list[0].slug)}
                className="text-orange-600 font-semibold hover:underline"
              >
                View full package info
              </button>
            </p>
          )}
        </section>

        {!loading && list.length > 1 && (
          <section className="mt-14 md:mt-20 overflow-x-auto">
            <h2 className="section-title text-center mb-6">Compare programs</h2>
            <table className="w-full min-w-[540px] text-sm glass-card overflow-hidden">
              <thead>
                <tr className="bg-orange-50/80 text-left">
                  <th className="p-4 font-semibold text-slate-700">Feature</th>
                  {list.map((p) => (
                    <th key={p.slug} className="p-4 font-semibold text-slate-800">{p.duration_days}-Day</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Total sessions', key: 'total_sessions' },
                  { label: 'Duration', key: 'duration_days', suffix: ' days' },
                  { label: 'Price', key: 'discount_price', alt: 'price', format: formatPackagePrice },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">{row.label}</td>
                    {list.map((p) => (
                      <td key={p.slug} className="p-4 font-medium text-slate-800">
                        {row.format
                          ? row.format(p[row.key] ?? p[row.alt])
                          : `${p[row.key]}${row.suffix || ''}`}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-100 bg-slate-50/50">
                  <td className="p-4 text-slate-600">Book</td>
                  {list.map((p) => (
                    <td key={p.slug} className="p-4">
                      <Link to={bookPackageUrl(p.slug)} className="text-orange-600 font-semibold hover:underline text-sm">
                        Book now →
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-14 md:mt-20">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="section-title">What&apos;s included</h2>
            <p className="section-subtitle mx-auto mt-2">Everything for a complete recovery journey</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {PACKAGE_HIGHLIGHTS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-card p-4 md:p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FaIcon icon={b.icon} className="text-xl" />
                </div>
                <h3 className="font-bold text-slate-800 mt-3 text-sm md:text-base">{b.title}</h3>
                <p className="text-xs md:text-sm text-slate-600 mt-1">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-12 md:mt-16 rounded-2xl md:rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600" />
          <div className="relative p-8 md:p-12 text-center text-white">
            <h2 className="text-xl md:text-3xl font-bold">Ready to start your recovery?</h2>
            <p className="mt-2 text-orange-100 max-w-lg mx-auto text-sm md:text-base">
              Book a structured package today — sessions appear in My Packages with full progress tracking.
            </p>
            {list[0] && (
              <Link
                to={bookPackageUrl(list[0].slug)}
                className="inline-flex items-center gap-2 mt-6 bg-white text-orange-700 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition"
              >
                Book {list[0].duration_days}-Day Package
                <FaIcon icon="fa-arrow-right" />
              </Link>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selected && <PackageDetailModal pkg={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
