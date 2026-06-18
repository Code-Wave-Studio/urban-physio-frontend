import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import { treatmentPackages } from '../services/api';

const FALLBACK = [
  {
    id: 1,
    name: '10-Day Recovery Package',
    slug: '10-day-recovery',
    duration_days: 10,
    total_sessions: 10,
    short_description: 'Intensive 10-day physiotherapy recovery program',
    description: 'Structured daily physiotherapy over 10 days — ideal for acute pain relief and early rehabilitation.',
    price: 4999,
    featured: false,
  },
  {
    id: 2,
    name: '15-Day Rehab Package',
    slug: '15-day-rehab',
    duration_days: 15,
    total_sessions: 15,
    short_description: 'Complete 15-day rehabilitation program',
    description: 'Mid-term rehab package with progressive exercises and guided sessions over 15 days.',
    price: 7499,
    featured: true,
  },
  {
    id: 3,
    name: '30-Day Complete Care',
    slug: '30-day-complete-care',
    duration_days: 30,
    total_sessions: 30,
    short_description: 'Full 30-day comprehensive physiotherapy care',
    description: 'Long-term recovery and strength-building program with 30 guided sessions over 30 days.',
    price: 12999,
    featured: false,
  },
];

const BENEFITS = [
  { icon: 'fa-user-doctor', title: 'Expert guidance', desc: 'Licensed physiotherapists track every session' },
  { icon: 'fa-chart-line', title: 'Progress tracking', desc: 'Session-by-session completion & notes' },
  { icon: 'fa-dumbbell', title: 'Exercise plans', desc: 'Custom rehab exercises with sets & reps' },
  { icon: 'fa-arrows-rotate', title: 'Flexible care', desc: 'Online, clinic, or home visit options' },
];

function formatPrice(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function PackageDetailModal({ pkg, onClose }) {
  if (!pkg) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-gradient-to-br from-orange-500/15 to-amber-500/10 rounded-t-3xl">
          <div className="flex justify-between items-start gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">{pkg.duration_days}-Day Program</span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{pkg.name}</h2>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-slate-500">
              <FaIcon icon="fa-xmark" />
            </button>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-4">{formatPrice(pkg.price)}</p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{pkg.description || pkg.short_description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 text-center">
              <p className="text-xl font-bold text-slate-800">{pkg.total_sessions}</p>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Sessions</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-center">
              <p className="text-xl font-bold text-slate-800">{pkg.duration_days}</p>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Days</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2"><FaIcon icon="fa-check-circle" className="text-emerald-500" /> Daily guided physiotherapy</li>
            <li className="flex items-center gap-2"><FaIcon icon="fa-check-circle" className="text-emerald-500" /> Progress dashboard</li>
            <li className="flex items-center gap-2"><FaIcon icon="fa-check-circle" className="text-emerald-500" /> Exercise prescription included</li>
          </ul>
          <Link to="/book" className="btn-primary w-full block text-center">Start with consultation</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TreatmentPackages() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    treatmentPackages
      .list()
      .then((res) => {
        const data = res.data?.length ? res.data : FALLBACK;
        setList(data.map((p, i) => ({ ...p, featured: p.duration_days === 15 || i === 1 })));
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
    <div className="page-enter min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-12 md:pt-28 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-700 to-slate-900" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.35),transparent_45%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-[1] text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <FaIcon icon="fa-box-open" />
            Structured Programs
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 tracking-tight"
          >
            Treatment Packages
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm sm:text-lg text-orange-100/95 max-w-2xl mx-auto leading-relaxed"
          >
            Choose a 10, 15, or 30-day physiotherapy program with guided sessions, progress tracking, and personalised rehab exercises.
          </motion.p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-[2] pb-16">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-96 animate-pulse bg-white/50" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
            {list.map((pkg, idx) => {
              const isFeatured = pkg.featured || pkg.duration_days === 15;
              return (
                <motion.article
                  key={pkg.id || pkg.slug}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`relative flex flex-col rounded-2xl md:rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    isFeatured
                      ? 'bg-gradient-to-b from-orange-600 to-orange-700 text-white border-orange-500 shadow-xl shadow-orange-600/30 md:scale-[1.03] z-[1]'
                      : 'glass-card border-white/80'
                  }`}
                >
                  {isFeatured && (
                    <span className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className={`p-6 md:p-8 flex flex-col flex-1 ${isFeatured ? '' : 'pt-8'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isFeatured ? 'bg-white/20' : 'bg-orange-100 text-orange-600'}`}>
                      <FaIcon icon="fa-calendar-days" className="text-xl" />
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isFeatured ? 'text-orange-100' : 'text-orange-600'}`}>
                      {pkg.duration_days}-Day Program
                    </p>
                    <h2 className={`text-xl md:text-2xl font-bold mt-2 ${isFeatured ? 'text-white' : 'text-slate-800'}`}>
                      {pkg.name}
                    </h2>
                    <p className={`text-sm mt-3 flex-1 leading-relaxed ${isFeatured ? 'text-orange-50/90' : 'text-slate-600'}`}>
                      {pkg.short_description}
                    </p>

                    <ul className={`mt-5 space-y-2 text-sm ${isFeatured ? 'text-orange-50' : 'text-slate-600'}`}>
                      <li className="flex items-center gap-2">
                        <FaIcon icon="fa-check" className={isFeatured ? 'text-orange-200' : 'text-emerald-500'} />
                        {pkg.total_sessions} guided sessions
                      </li>
                      <li className="flex items-center gap-2">
                        <FaIcon icon="fa-check" className={isFeatured ? 'text-orange-200' : 'text-emerald-500'} />
                        Session progress tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <FaIcon icon="fa-check" className={isFeatured ? 'text-orange-200' : 'text-emerald-500'} />
                        Rehab exercise plan
                      </li>
                    </ul>

                    <p className={`text-3xl font-bold mt-6 ${isFeatured ? 'text-white' : 'text-slate-800'}`}>
                      {formatPrice(pkg.price)}
                    </p>

                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => openDetail(pkg.slug)}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                          isFeatured
                            ? 'bg-white text-orange-700 hover:bg-orange-50'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        View details
                      </button>
                      <Link
                        to="/book"
                        className={`w-full py-3 rounded-xl font-semibold text-sm text-center block border transition ${
                          isFeatured
                            ? 'border-white/40 text-white hover:bg-white/10'
                            : 'border-slate-200 text-slate-700 hover:border-orange-300'
                        }`}
                      >
                        Book consultation
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Benefits */}
        <section className="mt-14 md:mt-20">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="section-title">What&apos;s included</h2>
            <p className="section-subtitle mx-auto mt-2">Everything you need for a complete recovery journey</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {BENEFITS.map((b, i) => (
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

        {/* CTA */}
        <section className="mt-12 md:mt-16 rounded-2xl md:rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600" />
          <div className="relative p-8 md:p-12 text-center text-white">
            <h2 className="text-xl md:text-3xl font-bold">Not sure which package fits you?</h2>
            <p className="mt-2 text-orange-100 max-w-lg mx-auto text-sm md:text-base">
              Book a consultation — our physiotherapist will recommend the best program for your condition.
            </p>
            <Link to="/book" className="inline-flex items-center gap-2 mt-6 bg-white text-orange-700 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition">
              Book free assessment
              <FaIcon icon="fa-arrow-right" />
            </Link>
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
