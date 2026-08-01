import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import { physioFeed } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import PodcastEpisodePlayer from '../components/podcast/PodcastEpisodePlayer';
import { cmsContentToHtml } from '../utils/htmlContent';
import PageMeta, { breadcrumbSchema } from '../components/seo/PageMeta';

function mediaSrc(url) {
  return resolveMediaUrl(url) || url;
}

export default function PhysioFeedDetail({ mode = 'blog', legacy = false }) {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    physioFeed
      .get(slug)
      .then((res) => {
        const p = res.data ?? res;
        setPost(p);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Hooks must run unconditionally (before any early return) — React #310
  const audioSrc = post ? mediaSrc(post.audio_url) : '';
  const videoSrc = post ? mediaSrc(post.video_url) : '';
  const isPodcast = post?.type === 'podcast';
  const featuredSrc = post?.featured_image ? mediaSrc(post.featured_image) : null;
  const canonical = post
    ? post.canonical_path || (isPodcast ? `/podcast/${slug}` : `/blog/${slug}`)
    : mode === 'podcast'
      ? `/podcast/${slug || ''}`
      : `/blog/${slug || ''}`;

  const breadcrumbItems = useMemo(() => {
    if (!post) return [{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }];
    return [
      { label: 'Home', href: '/' },
      { label: isPodcast ? 'Podcast' : 'Blog', href: isPodcast ? '/podcast' : '/blog' },
      ...(post.category_slug && !isPodcast
        ? [{ label: String(post.category_slug).replace(/-/g, ' '), href: post.category_path }]
        : []),
      { label: post.title },
    ];
  }, [isPodcast, post]);

  const jsonLd = useMemo(() => {
    if (!post) return null;
    const graph = [
      breadcrumbSchema(breadcrumbItems, `${window.location.origin}${canonical}`),
      isPodcast
        ? {
            '@context': 'https://schema.org',
            '@type': 'PodcastEpisode',
            name: post.title,
            description: post.seo_description || post.excerpt,
            url: `${window.location.origin}${canonical}`,
            image: featuredSrc || undefined,
            datePublished: post.published_at || undefined,
            associatedMedia: audioSrc
              ? { '@type': 'AudioObject', contentUrl: audioSrc }
              : videoSrc
                ? { '@type': 'VideoObject', contentUrl: videoSrc }
                : undefined,
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.seo_description || post.excerpt,
            image: featuredSrc || undefined,
            datePublished: post.published_at || undefined,
            author: post.author_name ? { '@type': 'Person', name: post.author_name } : undefined,
            url: `${window.location.origin}${canonical}`,
          },
    ].filter(Boolean);
    return { '@context': 'https://schema.org', '@graph': graph };
  }, [audioSrc, breadcrumbItems, canonical, featuredSrc, isPodcast, post, videoSrc]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-slate-600">Article not found.</p>
          <Link to="/blog" className="btn-primary mt-4 inline-block">
            Back to Blog
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  if (legacy && post?.canonical_path) {
    return <Navigate to={post.canonical_path} replace />;
  }

  return (
    <>
      <PageMeta
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt}
        canonical={canonical}
        image={featuredSrc}
        ogType={isPodcast ? 'music.song' : 'article'}
        jsonLd={jsonLd}
      />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16">
        <article className="min-w-0 w-full mx-auto">
          <Link to={isPodcast ? '/podcast' : '/blog'} className="text-sm text-indigo-600 font-semibold inline-flex items-center gap-1 mb-5">
            <FaIcon icon="fa-arrow-left" /> Back to {isPodcast ? 'Podcast' : 'Blog'}
          </Link>

          {featuredSrc && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-100 aspect-[16/9] sm:aspect-[2/1] max-h-[min(52vw,360px)] sm:max-h-[420px] mb-6">
              <img
                src={featuredSrc}
                alt={post.title || 'Article featured image'}
                className="w-full h-full object-cover object-center"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          )}

          <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{post.type}</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mt-3">{post.title}</h1>
          <p className="text-sm text-slate-500 mt-2">
            {post.author_name}
            {post.published_at ? ` · ${post.published_at.slice(0, 10)}` : ''}
            {post.reading_time_minutes ? ` · ${post.reading_time_minutes} min read` : ''}
          </p>

          {isPodcast && (videoSrc || audioSrc) && (
            <PodcastEpisodePlayer post={post} audioSrc={audioSrc} videoSrc={videoSrc} />
          )}

          <div
            className="cms-prose max-w-none mt-8"
            dangerouslySetInnerHTML={{ __html: cmsContentToHtml(post.content) }}
          />
        </article>
      </div>
      <Footer />
    </>
  );
}

