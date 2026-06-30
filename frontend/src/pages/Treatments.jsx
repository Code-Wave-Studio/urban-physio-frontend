import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import { treatments } from '../services/api';
import {
  TREATMENT_BODY_AREAS,
  treatmentIcon,
  bodyAreaStyle,
} from '../utils/treatmentHelpers';

const FALLBACK = [
  {
    id: 1,
    title: 'Back Pain Treatment',
    slug: 'back-pain',
    body_area: 'back',
    short_description: 'Expert physiotherapy for lower and upper back pain',
    description: 'Comprehensive back pain rehabilitation using evidence-based techniques.',
  },
  {
    id: 2,
    title: 'Neck Pain Treatment',
    slug: 'neck-pain',
    body_area: 'neck',
    short_description: 'Relief from cervical pain and stiffness',
    description: 'Targeted neck pain treatment including cervical mobilization.',
  },
  {
    id: 3,
    title: 'Knee Pain Treatment',
    slug: 'knee-pain',
    body_area: 'knee',
    short_description: 'ACL, meniscus, and arthritis knee rehab',
    description: 'Specialized knee rehabilitation for sports and age-related issues.',
  },
];

export default function Treatments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [allList, setAllList] = useState([]);
  const [filter, setFilter] = useState(() => searchParams.get('area') || '');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const area = searchParams.get('area') || '';
    setFilter(area);
  }, [searchParams]);

  const setBodyAreaFilter = (areaId) => {
    setFilter(areaId);
    if (areaId) {
      setSearchParams({ area: areaId }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  useEffect(() => {
    treatments
      .list()
      .then((res) => setAllList(res.data?.length ? res.data : FALLBACK))
      .catch(() => setAllList(FALLBACK));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter) params.body_area = filter;
    if (search.trim()) params.search = search.trim();
    treatments
      .list(params)
      .then((res) => setList(res.data?.length ? res.data : FALLBACK))
      .catch(() => setList(FALLBACK))
      .finally(() => setLoading(false));
  }, [filter, search]);

  const counts = useMemo(() => {
    const byCat = {};
    TREATMENT_BODY_AREAS.forEach((c) => {
      if (c.id) byCat[c.id] = allList.filter((i) => i.body_area === c.id).length;
    });
    return { all: allList.length, byCat };
  }, [allList]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-orange-500 via-primary-600 to-primary-800 text-white py-12 md:py-16">
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-100 hover:text-white text-sm mb-4"
          >
            <FaIcon icon="fa-arrow-left" />
            Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 glass-dark px-3 py-1 rounded-full text-xs font-medium mb-4">
                <FaIcon icon="fa-kit-medical" className="text-orange-300" />
                Expert physiotherapy programs
              </span>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Our Treatments</h1>
              <p className="mt-3 text-primary-100/90 max-w-2xl text-sm md:text-lg">
                Back, neck, knee, shoulder & sports injuries — evidence-based treatment plans
                tailored to your pain and recovery goals.
              </p>
            </div>
            <Link
              to="/book"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl shadow-lg shrink-0"
            >
              <FaIcon icon="fa-calendar-check" />
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex-1 w-full">
        {/* Search */}
        <div className="glass-card mb-6 p-4">
          <div className="relative">
            <FaIcon
              icon="fa-magnifying-glass"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              className="input-field pl-11"
              placeholder="Search treatments (e.g. back pain, knee, neck)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="scroll-x-hide flex flex-nowrap gap-2 mb-8 -mx-1 px-1 pb-1">
          {TREATMENT_BODY_AREAS.map((c) => (
            <button
              key={c.id || 'all'}
              type="button"
              onClick={() => setBodyAreaFilter(c.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === c.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'glass-card hover:bg-white/70 text-slate-700'
              }`}
            >
              <FaIcon icon={c.icon} className="text-xs" />
              {c.label}
              {c.id && counts.byCat[c.id] != null && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === c.id ? 'bg-white/20' : 'bg-slate-200/80'
                  }`}
                >
                  {counts.byCat[c.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card h-48 animate-pulse bg-white/30" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="glass-card text-center py-16">
            <FaIcon icon="fa-notes-medical" className="text-4xl text-slate-400 mb-4" />
            <p className="text-slate-600">No treatments match your search.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setBodyAreaFilter('');
              }}
              className="btn-outline mt-4 text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((c) => (
              <Link
                key={c.id}
                to={`/treatments/${c.slug}`}
                className="glass-card group block p-5 md:p-6 hover:border-violet-300/60 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bodyAreaStyle(c.body_area).split(' ')[0]} bg-opacity-100`}
                  >
                    <FaIcon
                      icon={treatmentIcon(c.slug, c.body_area)}
                      className="text-xl text-primary-600"
                    />
                  </div>
                  <span
                    className={`badge border capitalize text-[10px] ${bodyAreaStyle(c.body_area)}`}
                  >
                    {c.body_area}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mt-4 group-hover:text-primary-700 transition">
                  {c.title}
                </h3>
                <p className="text-slate-600 text-sm mt-2 line-clamp-2">
                  {c.short_description || c.description}
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-primary-600 font-semibold text-sm">
                  Learn more
                  <FaIcon
                    icon="fa-arrow-right"
                    className="text-xs group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <section className="mt-12 md:mt-16 glass-strong rounded-2xl md:rounded-3xl p-6 md:p-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Not sure which program fits you?</h2>
          <p className="text-slate-600 mt-2 max-w-lg mx-auto text-sm md:text-base">
            Our verified physiotherapists will assess your pain and build a personalized treatment plan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Link to="/doctors" className="btn-primary inline-flex items-center justify-center gap-2">
              <FaIcon icon="fa-user-doctor" />
              Find a Specialist
            </Link>
            <Link to="/book" className="btn-outline inline-flex items-center justify-center gap-2">
              <FaIcon icon="fa-calendar-check" />
              Book Now
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
