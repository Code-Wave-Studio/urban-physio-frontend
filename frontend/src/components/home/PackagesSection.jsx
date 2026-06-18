import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import { treatmentPackages } from '../../services/api';

const FALLBACK = [
  { id: 1, name: '10-Day Recovery', slug: '10-day-recovery', duration_days: 10, total_sessions: 10, short_description: 'Intensive 10-day recovery program', price: 4999 },
  { id: 2, name: '15-Day Rehab', slug: '15-day-rehab', duration_days: 15, total_sessions: 15, short_description: 'Complete 15-day rehabilitation', price: 7499 },
  { id: 3, name: '30-Day Complete Care', slug: '30-day-complete-care', duration_days: 30, total_sessions: 30, short_description: 'Full 30-day comprehensive care', price: 12999 },
];

function formatPrice(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function PackagesSection() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    treatmentPackages
      .list()
      .then((res) => setList((res.data || FALLBACK).slice(0, 3)))
      .catch(() => setList(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const display = list.length ? list : FALLBACK;

  return (
    <section className="max-w-7xl mx-auto px-4 section-pad pt-0" aria-labelledby="home-packages-heading">
      <div className="glass-strong rounded-2xl md:rounded-3xl p-4 md:p-10 lg:p-12 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-10">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-3 py-1 rounded-full mb-3">
              <FaIcon icon="fa-box-open" />
              Structured Programs
            </span>
            <h2 id="home-packages-heading" className="section-title flex items-center gap-2">
              <FaIcon icon="fa-calendar-days" className="text-orange-600 text-xl md:text-2xl" />
              Treatment Packages
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-xl">
              10, 15 & 30-day physiotherapy programs with guided sessions and progress tracking.
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-44 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : (
          <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-5 stagger-children">
            {display.map((pkg, idx) => (
              <motion.article
                key={pkg.id || pkg.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className={`mobile-scroll-item glass-card p-5 border transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  pkg.duration_days === 15 ? 'border-orange-300 ring-1 ring-orange-200' : 'border-white/60'
                }`}
              >
                {pkg.duration_days === 15 && (
                  <span className="text-[10px] font-bold uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Popular</span>
                )}
                <p className="text-xs font-bold text-orange-600 uppercase mt-2">{pkg.duration_days}-Day Program</p>
                <h3 className="font-bold text-lg text-slate-800 mt-1">{pkg.name}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{pkg.short_description}</p>
                <ul className="text-xs text-slate-500 mt-3 space-y-1">
                  <li><FaIcon icon="fa-check" className="text-emerald-500 mr-1" />{pkg.total_sessions} sessions</li>
                  <li><FaIcon icon="fa-chart-line" className="text-sky-500 mr-1" />Progress tracking</li>
                </ul>
                <p className="text-xl font-bold text-slate-800 mt-3">{formatPrice(pkg.price)}</p>
              </motion.article>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:mt-10">
          <Link
            to="/packages"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold px-6 py-3 md:px-8 rounded-xl text-sm md:text-base shadow-lg shadow-orange-600/25 hover:scale-[1.02] transition-all"
          >
            View All Packages
            <FaIcon icon="fa-arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}
