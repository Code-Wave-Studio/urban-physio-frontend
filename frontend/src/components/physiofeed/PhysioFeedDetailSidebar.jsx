import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const TYPE_META = {
  blog: { label: 'Blog', icon: 'fa-blog', tone: 'text-sky-700 bg-sky-50 border-sky-100' },
  condition: { label: 'Condition', icon: 'fa-notes-medical', tone: 'text-violet-700 bg-violet-50 border-violet-100' },
  podcast: { label: 'Podcast', icon: 'fa-podcast', tone: 'text-rose-700 bg-rose-50 border-rose-100' },
};

export default function PhysioFeedDetailSidebar({ posts = [], currentSlug, loading = false }) {
  const items = posts.filter((p) => p.slug !== currentSlug).slice(0, 12);

  return (
    <aside className="hidden lg:block sticky top-24 self-start">
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">More from PhysioFeed</h2>
      {loading ? (
        <ul className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No other articles yet.</p>
      ) : (
        <ul className="space-y-1.5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
          {items.map((post) => {
            const meta = TYPE_META[post.type] || TYPE_META.blog;
            const thumb = resolveMediaUrl(post.featured_image);
            return (
              <li key={post.id || post.slug}>
                <Link
                  to={post?.canonical_path || (post?.type === 'podcast' ? `/podcast/${post.slug}` : `/blog/${post.slug}`)}
                  className="group flex items-start gap-2.5 rounded-xl border border-transparent px-2 py-2 hover:bg-indigo-50/80 hover:border-indigo-100 transition"
                >
                  {thumb ? (
                    <span className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </span>
                  ) : (
                    <span className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border ${meta.tone}`}>
                      <FaIcon icon={meta.icon} className="text-sm" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${meta.tone}`}>
                      {meta.label}
                    </span>
                    <span className="block text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-700 mt-1">
                      {post.title}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        to="/blog"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        View all content
        <FaIcon icon="fa-arrow-right" className="text-xs" />
      </Link>
    </aside>
  );
}
