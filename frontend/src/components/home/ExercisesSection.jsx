import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import ExerciseDetailModal from '../exercise/ExerciseDetailModal';
import ExerciseGalleryCard from '../exercise/ExerciseGalleryCard';
import { exercises } from '../../services/api';

const FALLBACK = [
  { id: 1, name: 'Cat-Cow Stretch', slug: 'cat-cow-stretch', body_area: 'back', difficulty: 'beginner', default_sets: 2, default_reps: '10', instructions: 'Arch and round your spine slowly with breath.', video_url: 'https://www.youtube.com/watch?v=inpok4MKVLM' },
  { id: 2, name: 'Knee Extension', slug: 'knee-extension', body_area: 'knee', difficulty: 'beginner', default_sets: 3, default_reps: '12', instructions: 'Straighten knee fully while seated.', video_url: 'https://www.youtube.com/watch?v=1xN5hL1S_-s' },
  { id: 3, name: 'Shoulder Pendulum', slug: 'shoulder-pendulum', body_area: 'shoulder', difficulty: 'beginner', default_sets: 2, default_reps: '10', instructions: 'Gentle circular swings with relaxed arm.', video_url: 'https://www.youtube.com/watch?v=n-WzWwB6jns' },
  { id: 4, name: 'Neck Isometrics', slug: 'neck-isometrics', body_area: 'neck', difficulty: 'beginner', default_sets: 3, default_reps: '5', instructions: 'Push head into hand without moving.', video_url: 'https://www.youtube.com/watch?v=UqQ1r623G6E' },
  { id: 5, name: 'Glute Bridge', slug: 'glute-bridge', body_area: 'back', difficulty: 'intermediate', default_sets: 3, default_reps: '15', instructions: 'Lift hips and squeeze glutes at top.', video_url: 'https://www.youtube.com/watch?v=4BOTvaRaDjI' },
  { id: 6, name: 'Heel Raises', slug: 'heel-raises', body_area: 'general', difficulty: 'beginner', default_sets: 3, default_reps: '15', instructions: 'Rise onto toes, hold, lower slowly.', video_url: 'https://www.youtube.com/watch?v=3R-zOQ2q2eM' },
];

export default function ExercisesSection() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
              Visual exercise gallery with demonstrations, clear sets &amp; reps, and step-by-step instructions.
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="exercise-gallery-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card !p-0 overflow-hidden animate-pulse">
                <div className="exercise-gallery-media bg-slate-200/80" />
                <div className="p-4 h-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="exercise-gallery-grid stagger-children">
            {display.map((ex, idx) => (
              <ExerciseGalleryCard
                key={ex.id || ex.slug}
                exercise={ex}
                index={idx}
                onOpen={setSelected}
                showSave={false}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:mt-10">
          <Link
            to="/exercises"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:scale-[1.02] transition-all min-h-11"
          >
            View More Exercises
            <FaIcon icon="fa-arrow-right" />
          </Link>
        </div>
      </div>

      <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
