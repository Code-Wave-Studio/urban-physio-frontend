import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import ExerciseDetailModal from '../components/exercise/ExerciseDetailModal';
import ExerciseGalleryCard from '../components/exercise/ExerciseGalleryCard';
import { exercises } from '../services/api';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';

const BODY_AREAS = [
  { id: '', label: 'All', icon: 'fa-table-cells' },
  { id: 'back', label: 'Back', icon: 'fa-bone' },
  { id: 'neck', label: 'Neck', icon: 'fa-head-side-virus' },
  { id: 'knee', label: 'Knee', icon: 'fa-person-walking' },
  { id: 'shoulder', label: 'Shoulder', icon: 'fa-hand' },
  { id: 'general', label: 'General', icon: 'fa-dumbbell' },
];

const FALLBACK = [
  { id: 1, name: 'Ankle Pumps', slug: 'ankle-pumps', body_area: 'general', difficulty: 'beginner', video_url: 'https://www.youtube.com/watch?v=1u-iXG6u_qA', instructions: 'Lie or sit with legs extended. Point your toes away from you, then flex them back toward your body in a rhythmic pumping motion to boost circulation.', default_sets: 3, default_reps: '15', default_hold_seconds: 2, equipment: 'Mat' },
  { id: 2, name: 'Cat-Cow Stretch', slug: 'cat-cow-stretch', body_area: 'back', difficulty: 'beginner', video_url: 'https://www.youtube.com/watch?v=inpok4MKVLM', instructions: 'Start on hands and knees. Arch your back up (cat), then drop belly down (cow). Move slowly with your breath.', default_sets: 2, default_reps: '10', equipment: 'Mat' },
  { id: 3, name: 'Knee Extension', slug: 'knee-extension', body_area: 'knee', difficulty: 'beginner', video_url: 'https://www.youtube.com/watch?v=1xN5hL1S_-s', instructions: 'Sit on a chair. Straighten one knee fully, hold briefly, lower slowly.', default_sets: 3, default_reps: '12', default_hold_seconds: 3, equipment: 'Chair' },
  { id: 4, name: 'Shoulder Pendulum', slug: 'shoulder-pendulum', body_area: 'shoulder', difficulty: 'beginner', video_url: 'https://www.youtube.com/watch?v=n-WzWwB6jns', instructions: 'Lean forward supporting yourself. Let arm hang and swing gently in small circles.', default_sets: 2, default_reps: '10 each direction', equipment: 'None' },
  { id: 5, name: 'Neck Isometrics', slug: 'neck-isometrics', body_area: 'neck', difficulty: 'beginner', video_url: 'https://www.youtube.com/watch?v=UqQ1r623G6E', instructions: 'Place hand on forehead. Push head into hand without moving. Hold 5 seconds.', default_sets: 3, default_reps: '5', default_hold_seconds: 5, equipment: 'None' },
  { id: 6, name: 'Glute Bridge', slug: 'glute-bridge', body_area: 'back', difficulty: 'intermediate', video_url: 'https://www.youtube.com/watch?v=4BOTvaRaDjI', instructions: 'Lie on back, knees bent. Lift hips until body forms straight line.', default_sets: 3, default_reps: '15', default_hold_seconds: 2, equipment: 'Mat' },
  { id: 7, name: 'Heel Raises', slug: 'heel-raises', body_area: 'general', difficulty: 'beginner', video_url: 'https://www.youtube.com/watch?v=3R-zOQ2q2eM', instructions: 'Stand holding support. Rise onto toes, hold, lower slowly.', default_sets: 3, default_reps: '15', default_hold_seconds: 2, equipment: 'Wall support' },
];

export default function ExerciseLibrary() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bodyArea, setBodyArea] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (bodyArea) params.body_area = bodyArea;
    if (search.trim()) params.search = search.trim();
    exercises
      .list(params)
      .then((res) => setList(res.data?.length ? res.data : FALLBACK))
      .catch(() => setList(FALLBACK))
      .finally(() => setLoading(false));
  }, [bodyArea, search]);

  const filtered = useMemo(() => {
    if (!bodyArea && !search.trim()) return list;
    return list;
  }, [list, bodyArea, search]);

  return (
    <div className="page-enter min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-teal-50/30">
      <ManagedPageSeo
        fallbackTitle="Physiotherapy Exercise Library"
        fallbackDescription="Browse guided physiotherapy exercises for back, neck, knee, shoulder and general rehab — free public library."
        fallbackKeywords="physio exercises, home exercises, rehab exercises, physiotherapy library"
      />
      <Navbar />

      <section className="relative pt-8 pb-10 md:pt-12 md:pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-emerald-700 to-slate-900" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-[1] text-center text-white">
          <div className="flex justify-center mb-2">
            <SeoBreadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Exercises' },
              ]}
            />
          </div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <FaIcon icon="fa-dumbbell" />
            Rehab & Recovery
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 tracking-tight"
          >
            Exercise Library
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm sm:text-lg text-teal-100/95 max-w-2xl mx-auto leading-relaxed"
          >
            Visual exercise gallery with demonstrations, clear instructions, and sets &amp; reps — designed for home recovery.
          </motion.p>
          {!loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-teal-200 text-sm font-medium"
            >
              {filtered.length} exercises available
            </motion.p>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-[2] pb-16">
        <div className="glass-strong rounded-2xl p-4 md:p-5 shadow-lg border border-white/80 mb-8">
          <div className="relative mb-4">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" />
            <input
              className="input-field pl-11 py-3 text-base"
              placeholder="Search by name, body area, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search exercises"
            />
          </div>
          <div className="scroll-x-hide flex flex-nowrap gap-2 pb-1 -mx-1 px-1" role="tablist" aria-label="Filter by body area">
            {BODY_AREAS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={bodyArea === a.id}
                onClick={() => setBodyArea(a.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-10 ${
                  bodyArea === a.id
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'bg-white/80 text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                <FaIcon icon={a.icon} className="text-xs" />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="exercise-gallery-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass-card !p-0 overflow-hidden animate-pulse">
                <div className="exercise-gallery-media bg-slate-200/80" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card text-center py-16 px-6">
            <FaIcon icon="fa-dumbbell" className="text-4xl text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">No exercises match your search.</p>
            <button type="button" onClick={() => { setSearch(''); setBodyArea(''); }} className="btn-outline mt-4 text-sm">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="exercise-gallery-grid">
            {filtered.map((ex, idx) => (
              <ExerciseGalleryCard
                key={ex.id || ex.slug}
                exercise={ex}
                index={idx}
                onOpen={setSelected}
              />
            ))}
          </div>
        )}

        <section className="mt-12 md:mt-16 rounded-2xl md:rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600" />
          <div className="relative p-8 md:p-12 text-center text-white">
            <h2 className="text-xl md:text-3xl font-bold">Need a personalised rehab plan?</h2>
            <p className="mt-2 text-teal-100 max-w-lg mx-auto text-sm md:text-base">
              Our physiotherapists create custom exercise prescriptions tailored to your condition.
            </p>
            <Link to="/book" className="inline-flex items-center gap-2 mt-6 bg-white text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition min-h-11">
              Book consultation
              <FaIcon icon="fa-calendar-check" />
            </Link>
          </div>
        </section>
      </main>

      <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />

      <Footer />
    </div>
  );
}
