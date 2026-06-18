import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    price: 4999,
  },
  {
    id: 2,
    name: '15-Day Rehab Package',
    slug: '15-day-rehab',
    duration_days: 15,
    total_sessions: 15,
    short_description: 'Complete 15-day rehabilitation program',
    price: 7499,
  },
  {
    id: 3,
    name: '30-Day Complete Care',
    slug: '30-day-complete-care',
    duration_days: 30,
    total_sessions: 30,
    short_description: 'Full 30-day comprehensive physiotherapy care',
    price: 12999,
  },
];

function formatPrice(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function TreatmentPackages() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    treatmentPackages
      .list()
      .then((res) => setList(res.data?.length ? res.data : FALLBACK))
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
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Treatment Packages</h1>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
              Structured 10, 15, and 30-day physiotherapy programs with guided sessions and progress tracking.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-slate-500">Loading packages…</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {list.map((pkg) => (
                <article
                  key={pkg.id || pkg.slug}
                  className="glass-card p-6 flex flex-col hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                      <FaIcon icon="fa-calendar-days" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-primary-600">
                      {pkg.duration_days}-Day Program
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{pkg.name}</h2>
                  <p className="text-sm text-slate-600 mt-2 flex-1">{pkg.short_description}</p>
                  <ul className="text-xs text-slate-500 mt-4 space-y-1">
                    <li>
                      <FaIcon icon="fa-check" className="text-emerald-500 mr-1" />
                      {pkg.total_sessions} guided sessions
                    </li>
                    <li>
                      <FaIcon icon="fa-chart-line" className="text-sky-500 mr-1" />
                      Session-by-session tracking
                    </li>
                  </ul>
                  <p className="text-2xl font-bold text-slate-800 mt-4">{formatPrice(pkg.price)}</p>
                  <button
                    type="button"
                    onClick={() => openDetail(pkg.slug)}
                    className="btn-primary w-full mt-4"
                  >
                    View details
                  </button>
                  <Link to="/book" className="btn-outline w-full mt-2 text-center">
                    Book consultation
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-primary-600 uppercase">{selected.duration_days}-Day</p>
                <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <FaIcon icon="fa-xmark" />
              </button>
            </div>
            {selected.description && (
              <p className="text-sm text-slate-600 whitespace-pre-line mb-4">{selected.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-slate-100">{selected.total_sessions} sessions</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 capitalize">
                {selected.consultation_type?.replace(/_/g, ' ') || 'Any mode'}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold">
                {formatPrice(selected.price)}
              </span>
            </div>
            <Link to="/book" className="btn-primary w-full mt-6 block text-center">
              Start with a consultation
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
