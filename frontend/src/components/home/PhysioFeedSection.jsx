import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import { physioFeed } from '../../services/api';

const TYPE_META = {
  blog: { label: 'Blog', icon: 'fa-blog', color: 'text-sky-600 bg-sky-50' },
  condition: { label: 'Condition', icon: 'fa-notes-medical', color: 'text-violet-600 bg-violet-50' },
  podcast: { label: 'Podcast', icon: 'fa-podcast', color: 'text-rose-600 bg-rose-50' },
};

export default function PhysioFeedSection() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    physioFeed
      .list()
      .then((res) => setList((res.data || []).slice(0, 3)))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && list.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 section-pad pt-0" aria-labelledby="home-feed-heading">
      <div className="glass-strong rounded-2xl md:rounded-3xl p-4 md:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">PhysioFeed</span>
            <h2 id="home-feed-heading" className="section-title flex items-center gap-2 mt-3">
              <FaIcon icon="fa-rss" className="text-indigo-600" />
              Learn & Recover
            </h2>
            <p className="text-slate-600 text-sm mt-1">Blogs, conditions & podcasts from our experts</p>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mobile-scroll-x md:grid md:grid-cols-3 md:gap-5">
            {list.map((post) => {
              const meta = TYPE_META[post.type] || TYPE_META.blog;
              return (
                <Link key={post.id} to={`/physiofeed/${post.slug}`} className="mobile-scroll-item glass-card p-4 block hover:shadow-lg transition group">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.color}`}>
                    <FaIcon icon={meta.icon} /> {meta.label}
                  </span>
                  <h3 className="font-bold text-slate-800 mt-2 group-hover:text-indigo-700 transition">{post.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{post.excerpt}</p>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/physiofeed" className="btn-outline inline-flex items-center gap-2 text-sm">
            Explore PhysioFeed <FaIcon icon="fa-arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}
