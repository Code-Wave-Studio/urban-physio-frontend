import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import { physioFeed } from '../services/api';
import PageMeta, { breadcrumbSchema } from '../components/seo/PageMeta';

const TABS = [
  { id: '', label: 'All', icon: 'fa-table-cells' },
  { id: 'blog', label: 'Blogs', icon: 'fa-blog' },
  { id: 'condition', label: 'Conditions', icon: 'fa-notes-medical' },
  { id: 'podcast', label: 'Podcasts', icon: 'fa-podcast' },
];

const TYPE_STYLE = {
  blog: 'from-sky-500 to-blue-600',
  condition: 'from-violet-500 to-purple-600',
  podcast: 'from-rose-500 to-pink-600',
};

function postHref(post) {
  return post?.canonical_path || (post?.type === 'podcast' ? `/podcast/${post.slug}` : `/blog/${post.slug}`);
}

export default function PhysioFeed({ mode = 'all', legacy = false }) {
  const { categorySlug } = useParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(() => {
    if (mode === 'podcast') return 'podcast';
    if (mode === 'blog') return 'blog';
    return '';
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (mode === 'podcast') {
      params.type = 'podcast';
    } else if (mode === 'blog') {
      params.type = type || 'blog';
    } else if (type) {
      params.type = type;
    }
    if (mode === 'blog-category' && categorySlug) {
      params.category = categorySlug;
    }
    if (search.trim()) params.search = search.trim();
    physioFeed
      .list(params)
      .then((res) => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [type, search, mode, categorySlug]);

  const canonical = useMemo(() => {
    if (legacy) return '/blog';
    if (mode === 'podcast') return '/podcast';
    if (mode === 'blog-category' && categorySlug) return `/blog/category/${encodeURIComponent(categorySlug)}`;
    return '/blog';
  }, [legacy, mode, categorySlug]);

  const pageTitle = mode === 'podcast'
    ? 'Physiotherapy Podcasts'
    : mode === 'blog-category' && categorySlug
      ? `${String(categorySlug).replace(/-/g, ' ')} Articles`
      : 'Physiotherapy Blog';

  const pageDescription = mode === 'podcast'
    ? 'Listen to physiotherapy podcasts, expert audio episodes, and recovery insights from The Urban Physio.'
    : 'Read physiotherapy blogs, condition guides, and recovery insights from The Urban Physio.';

  const breadcrumbItems = useMemo(() => {
    if (mode === 'podcast') return [{ label: 'Home', href: '/' }, { label: 'Podcast', href: '/podcast' }];
    if (mode === 'blog-category' && categorySlug) {
      return [{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: categorySlug.replace(/-/g, ' ') }];
    }
    return [{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }];
  }, [mode, categorySlug]);

  if (legacy) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="page-enter min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
      <PageMeta
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        jsonLd={breadcrumbSchema(breadcrumbItems, `${window.location.origin}${canonical}`)}
      />
      <Navbar />
      <section className="pt-8 sm:pt-10 pb-10 bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase">
            <FaIcon icon={mode === 'podcast' ? 'fa-podcast' : 'fa-blog'} /> {mode === 'podcast' ? 'Podcast' : 'Blog'}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4">{pageTitle}</h1>
          <p className="mt-3 text-indigo-100 max-w-2xl mx-auto text-sm sm:text-base">
            {pageDescription}
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 pb-16 relative z-[1]">
        <div className="glass-strong rounded-2xl p-4 md:p-5 shadow-lg mb-8">
          <input className="input-field mb-4" placeholder={mode === 'podcast' ? 'Search podcast episodes…' : 'Search articles…'} value={search} onChange={(e) => setSearch(e.target.value)} />
          {mode === 'all' && (
            <div className="scroll-x-hide flex flex-nowrap gap-2 pb-1 -mx-1 px-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${
                    type === t.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <FaIcon icon={t.icon} className="text-xs" /> {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card h-48 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="glass-card text-center py-16 text-slate-600">No content found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((post) => (
              <Link key={post.id} to={postHref(post)} className="group glass-card overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div className={`h-1.5 bg-gradient-to-r ${TYPE_STYLE[post.type] || TYPE_STYLE.blog}`} />
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase text-indigo-600">{post.type}</span>
                  <h2 className="font-bold text-lg text-slate-800 mt-2 group-hover:text-indigo-700">{post.title}</h2>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3">{post.excerpt}</p>
                  <p className="text-xs text-slate-400 mt-4">{post.author_name || 'Urban Physio'} · {post.view_count || 0} views</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
