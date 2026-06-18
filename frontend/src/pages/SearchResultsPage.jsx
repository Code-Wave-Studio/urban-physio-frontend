import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import { search } from '../services/api';
import { useLocation } from '../contexts/LocationContext';

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { city } = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const apiParams = { q, search: q, limit: 20 };
    if (city?.id) apiParams.city_id = city.id;
    search.universal(apiParams)
      .then((res) => setResults(res?.data ?? res))
      .catch(() => setResults({ doctors: [], clinics: [], conditions: [], symptoms: [] }))
      .finally(() => setLoading(false));
  }, [q, city?.id]);

  const Section = ({ title, icon, items, renderItem }) => {
    if (!items?.length) return null;
    return (
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <FaIcon icon={icon} className="text-primary-600" />
          {title}
          <span className="text-sm font-normal text-slate-500">({items.length})</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(renderItem)}</div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {q ? <>Results for &ldquo;{q}&rdquo;</> : 'Search'}
        </h1>
        {loading ? (
          <p className="text-slate-500"><FaIcon icon="fa-spinner" className="fa-spin mr-2" />Searching…</p>
        ) : !q || q.length < 2 ? (
          <p className="text-slate-600">Enter at least 2 characters to search.</p>
        ) : (
          <>
            <Section
              title="Doctors"
              icon="fa-user-doctor"
              items={results?.doctors}
              renderItem={(d) => (
                <Link key={d.id} to={`/doctors/${d.id}`} className="glass-card p-4 hover:shadow-md transition block">
                  <p className="font-semibold text-slate-900">Dr. {d.first_name} {d.last_name}</p>
                  <p className="text-sm text-primary-600">{d.specialization}</p>
                  <p className="text-xs text-slate-500 mt-1">{d.city_name}</p>
                </Link>
              )}
            />
            <Section
              title="Clinics"
              icon="fa-hospital"
              items={results?.clinics}
              renderItem={(c) => (
                <Link key={c.id} to={`/book?clinic_id=${c.id}`} className="glass-card p-4 hover:shadow-md transition block">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{c.address}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.city_name}</p>
                </Link>
              )}
            />
            <Section
              title="Conditions"
              icon="fa-notes-medical"
              items={results?.conditions}
              renderItem={(c) => (
                <Link key={c.id} to={`/conditions/${c.slug}`} className="glass-card p-4 hover:shadow-md transition block">
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{c.short_description}</p>
                </Link>
              )}
            />
            <Section
              title="Symptoms"
              icon="fa-heart-pulse"
              items={results?.symptoms}
              renderItem={(s, i) => (
                <Link
                  key={`${s.id}-${i}`}
                  to={`/conditions?search=${encodeURIComponent(s.title || s.chip_label || '')}`}
                  className="glass-card p-4 hover:shadow-md transition block"
                >
                  <p className="font-semibold text-slate-900">{s.title || s.chip_label}</p>
                  <p className="text-xs text-slate-500 capitalize mt-1">{s.source?.replace('_', ' ') || 'Symptom'}</p>
                </Link>
              )}
            />
            {!results?.doctors?.length &&
              !results?.clinics?.length &&
              !results?.conditions?.length &&
              !results?.symptoms?.length && (
                <p className="text-slate-600">No results found. Try different keywords.</p>
              )}
          </>
        )}
      </div>
    </div>
  );
}
