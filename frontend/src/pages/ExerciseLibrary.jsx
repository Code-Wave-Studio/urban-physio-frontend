import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import SaveExerciseButton from '../components/exercise/SaveExerciseButton';
import ExerciseDetailModal from '../components/exercise/ExerciseDetailModal';
import { exercises } from '../services/api';

const BODY_AREAS = [
  { id: '', label: 'All', icon: 'fa-table-cells' },
  { id: 'back', label: 'Back', icon: 'fa-bone' },
  { id: 'neck', label: 'Neck', icon: 'fa-head-side-virus' },
  { id: 'knee', label: 'Knee', icon: 'fa-person-walking' },
  { id: 'shoulder', label: 'Shoulder', icon: 'fa-hand' },
  { id: 'general', label: 'General', icon: 'fa-dumbbell' },
];

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
};

const AREA_GRADIENT = {
  back: 'from-violet-500/20 to-purple-500/10',
  neck: 'from-sky-500/20 to-blue-500/10',
  knee: 'from-orange-500/20 to-amber-500/10',
  shoulder: 'from-rose-500/20 to-pink-500/10',
  general: 'from-teal-500/20 to-emerald-500/10',
};

const BAR_GRADIENT = {
  back: 'from-violet-500 to-purple-500',
  neck: 'from-sky-500 to-blue-500',
  knee: 'from-orange-500 to-amber-500',
  shoulder: 'from-rose-500 to-pink-500',
  general: 'from-teal-500 to-emerald-500',
};

const FALLBACK = [
  { id: 1, name: 'Cat-Cow Stretch', slug: 'cat-cow-stretch', body_area: 'back', difficulty: 'beginner', instructions: 'Start on hands and knees. Arch your back up (cat), then drop belly down (cow). Move slowly with your breath.', default_sets: 2, default_reps: '10', equipment: 'Mat' },
  { id: 2, name: 'Knee Extension', slug: 'knee-extension', body_area: 'knee', difficulty: 'beginner', instructions: 'Sit on a chair. Straighten one knee fully, hold briefly, lower slowly.', default_sets: 3, default_reps: '12', default_hold_seconds: 3, equipment: 'Chair' },
  { id: 3, name: 'Shoulder Pendulum', slug: 'shoulder-pendulum', body_area: 'shoulder', difficulty: 'beginner', instructions: 'Lean forward supporting yourself. Let arm hang and swing gently in small circles.', default_sets: 2, default_reps: '10 each direction', equipment: 'None' },
  { id: 4, name: 'Neck Isometrics', slug: 'neck-isometrics', body_area: 'neck', difficulty: 'beginner', instructions: 'Place hand on forehead. Push head into hand without moving. Hold 5 seconds.', default_sets: 3, default_reps: '5', default_hold_seconds: 5, equipment: 'None' },
  { id: 5, name: 'Glute Bridge', slug: 'glute-bridge', body_area: 'back', difficulty: 'intermediate', instructions: 'Lie on back, knees bent. Lift hips until body forms straight line.', default_sets: 3, default_reps: '15', default_hold_seconds: 2, equipment: 'Mat' },
  { id: 6, name: 'Heel Raises', slug: 'heel-raises', body_area: 'general', difficulty: 'beginner', instructions: 'Stand holding support. Rise onto toes, hold, lower slowly.', default_sets: 3, default_reps: '15', default_hold_seconds: 2, equipment: 'Wall support' },
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
      <Navbar />

      {/* Hero */}
      <section className="relative pt-8 pb-10 md:pt-12 md:pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-emerald-700 to-slate-900" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-[1] text-center text-white">
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
            Evidence-based physiotherapy exercises with sets, reps, and clear instructions — prescribed by experts, designed for home recovery.
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
        {/* Filters */}
        <div className="glass-strong rounded-2xl p-4 md:p-5 shadow-lg border border-white/80 mb-8">
          <div className="relative mb-4">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" />
            <input
              className="input-field pl-11 py-3 text-base"
              placeholder="Search by name, body area, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="scroll-x-hide flex flex-nowrap gap-2 pb-1 -mx-1 px-1">
            {BODY_AREAS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setBodyArea(a.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card h-52 animate-pulse bg-white/50" />
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((ex, idx) => (
              <motion.article
                key={ex.id || ex.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group glass-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/70"
                onClick={() => setSelected(ex)}
              >
                <div className={`h-2 bg-gradient-to-r ${BAR_GRADIENT[ex.body_area] || BAR_GRADIENT.general}`} />
                <div className="p-5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 capitalize">{ex.body_area}</span>
                    <div className="flex items-center gap-2">
                      <SaveExerciseButton exercise={ex} stopPropagation />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_STYLES[ex.difficulty]}`}>
                        {ex.difficulty}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mt-2 group-hover:text-teal-700 transition-colors">{ex.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800">
                      {ex.default_sets} × {ex.default_reps}
                    </span>
                    {ex.equipment && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{ex.equipment}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">{ex.instructions}</p>
                  <p className="text-sm font-semibold text-teal-600 mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    View instructions
                    <FaIcon icon="fa-arrow-right" className="text-xs" />
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* CTA */}
        <section className="mt-12 md:mt-16 rounded-2xl md:rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600" />
          <div className="relative p-8 md:p-12 text-center text-white">
            <h2 className="text-xl md:text-3xl font-bold">Need a personalised rehab plan?</h2>
            <p className="mt-2 text-teal-100 max-w-lg mx-auto text-sm md:text-base">
              Our physiotherapists create custom exercise prescriptions tailored to your condition.
            </p>
            <Link to="/book" className="inline-flex items-center gap-2 mt-6 bg-white text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition">
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
