import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import { exercises } from '../../services/api';

const FALLBACK = [
  { id: 1, name: 'Cat-Cow Stretch', slug: 'cat-cow-stretch', body_area: 'back', difficulty: 'beginner', default_sets: 2, default_reps: '10', instructions: 'Arch and round your spine slowly with breath.' },
  { id: 2, name: 'Knee Extension', slug: 'knee-extension', body_area: 'knee', difficulty: 'beginner', default_sets: 3, default_reps: '12', instructions: 'Straighten knee fully while seated.' },
  { id: 3, name: 'Shoulder Pendulum', slug: 'shoulder-pendulum', body_area: 'shoulder', difficulty: 'beginner', default_sets: 2, default_reps: '10', instructions: 'Gentle circular swings with relaxed arm.' },
  { id: 4, name: 'Neck Isometrics', slug: 'neck-isometrics', body_area: 'neck', difficulty: 'beginner', default_sets: 3, default_reps: '5', instructions: 'Push head into hand without moving.' },
  { id: 5, name: 'Glute Bridge', slug: 'glute-bridge', body_area: 'back', difficulty: 'intermediate', default_sets: 3, default_reps: '15', instructions: 'Lift hips and squeeze glutes at top.' },
  { id: 6, name: 'Heel Raises', slug: 'heel-raises', body_area: 'general', difficulty: 'beginner', default_sets: 3, default_reps: '15', instructions: 'Rise onto toes, hold, lower slowly.' },
];

const DIFFICULTY = {
  beginner: 'bg-emerald-100 text-emerald-800',
  intermediate: 'bg-amber-100 text-amber-800',
  advanced: 'bg-red-100 text-red-800',
};

const AREA_ICON = {
  back: 'fa-bone',
  knee: 'fa-person-walking',
  shoulder: 'fa-hand',
  neck: 'fa-head-side-virus',
  general: 'fa-dumbbell',
};

export default function ExercisesSection() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exercises
      .list()
      .then((res) => setList((res.data || []).slice(0, 6)))
      .catch(() => setList(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const display = list.length ? list : FALLBACK;

  return (
    <section className="max-w-7xl mx-auto px-4 section-pad" aria-labelledby="home-exercises-heading">
      <div className="glass-strong rounded-2xl md:rounded-3xl p-4 md:p-10 lg:p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-3">
              <FaIcon icon="fa-dumbbell" />
              Rehab & Recovery
            </span>
            <h2 id="home-exercises-heading" className="section-title flex items-center gap-2">
              <FaIcon icon="fa-person-walking" className="text-teal-600 text-xl md:text-2xl" />
              Exercise Library
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-xl">
              Doctor-prescribed exercises with clear sets, reps, and step-by-step instructions for faster recovery.
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-36 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : (
          <div className="mobile-scroll-x md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5 stagger-children">
            {display.map((ex, idx) => (
              <motion.article
                key={ex.id || ex.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="mobile-scroll-item group glass-card p-4 md:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-white/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/15 to-emerald-500/15 flex items-center justify-center text-teal-700 shrink-0">
                    <FaIcon icon={AREA_ICON[ex.body_area] || 'fa-dumbbell'} className="text-lg" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full capitalize ${DIFFICULTY[ex.difficulty] || DIFFICULTY.beginner}`}>
                    {ex.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 mt-3 text-base md:text-lg group-hover:text-teal-700 transition-colors">
                  {ex.name}
                </h3>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{ex.body_area || 'general'} · rehab</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    {ex.default_sets} sets × {ex.default_reps} reps
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">{ex.instructions}</p>
              </motion.article>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:mt-10">
          <Link
            to="/exercises"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:scale-[1.02] transition-all"
          >
            View More Exercises
            <FaIcon icon="fa-arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}
