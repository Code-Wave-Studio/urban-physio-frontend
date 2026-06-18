import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import { exercises } from '../services/api';

const BODY_AREAS = [
  { id: '', label: 'All areas' },
  { id: 'back', label: 'Back' },
  { id: 'neck', label: 'Neck' },
  { id: 'knee', label: 'Knee' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'general', label: 'General' },
];

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-amber-50 text-amber-700',
  advanced: 'bg-red-50 text-red-700',
};

export default function ExerciseLibrary() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bodyArea, setBodyArea] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (bodyArea) params.body_area = bodyArea;
    if (search.trim()) params.search = search.trim();
    exercises
      .list(params)
      .then((res) => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [bodyArea, search]);

  const grouped = useMemo(() => {
    const map = {};
    list.forEach((ex) => {
      const key = ex.body_area || 'general';
      if (!map[key]) map[key] = [];
      map[key].push(ex);
    });
    return map;
  }, [list]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Exercise Library</h1>
            <p className="text-slate-600 mt-2">
              Evidence-based rehab exercises with sets, reps, and step-by-step instructions.
            </p>
          </div>

          <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                className="input-field pl-9"
                placeholder="Search exercises…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="input-field sm:max-w-[180px]" value={bodyArea} onChange={(e) => setBodyArea(e.target.value)}>
              {BODY_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-center text-slate-500">Loading exercises…</p>
          ) : list.length === 0 ? (
            <p className="text-center text-slate-500">No exercises found.</p>
          ) : (
            Object.entries(grouped).map(([area, items]) => (
              <section key={area} className="mb-8">
                <h2 className="text-lg font-bold text-slate-800 capitalize mb-4 flex items-center gap-2">
                  <FaIcon icon="fa-dumbbell" className="text-primary-600" />
                  {area.replace(/_/g, ' ')}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((ex) => (
                    <article key={ex.id} className="glass-card p-4">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-800">{ex.name}</h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            DIFFICULTY_STYLES[ex.difficulty] || DIFFICULTY_STYLES.beginner
                          }`}
                        >
                          {ex.difficulty}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded">
                          {ex.default_sets} sets × {ex.default_reps} reps
                        </span>
                        {ex.default_hold_seconds && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded">Hold {ex.default_hold_seconds}s</span>
                        )}
                        {ex.equipment && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded">{ex.equipment}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                        className="text-sm text-primary-600 font-semibold mt-3 inline-flex items-center gap-1"
                      >
                        {expanded === ex.id ? 'Hide instructions' : 'View instructions'}
                        <FaIcon icon={expanded === ex.id ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-xs" />
                      </button>
                      {expanded === ex.id && (
                        <p className="text-sm text-slate-600 mt-2 whitespace-pre-line border-t border-slate-100 pt-2">
                          {ex.instructions}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
