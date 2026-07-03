import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import { physioFeed } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import PodcastEpisodePlayer from '../components/podcast/PodcastEpisodePlayer';
import PhysioFeedDetailSidebar from '../components/physiofeed/PhysioFeedDetailSidebar';
import { cmsContentToHtml } from '../utils/htmlContent';

function mediaSrc(url) {
  return resolveMediaUrl(url) || url;
}

export default function PhysioFeedDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);

  useEffect(() => {
    document.title = 'PhysioFeed | The Urban Physio';
    setLoading(true);
    physioFeed
      .get(slug)
      .then((res) => {
        const p = res.data ?? res;
        setPost(p);
        if (p.seo_title) document.title = p.seo_title;
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setRelatedLoading(true);
    physioFeed
      .list()
      .then((res) => setRelated(res.data || []))
      .catch(() => setRelated([]))
      .finally(() => setRelatedLoading(false));
  }, [slug]);

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
          <Link to="/physiofeed" className="btn-primary mt-4 inline-block">
            Back to PhysioFeed
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const audioSrc = mediaSrc(post.audio_url);
  const videoSrc = mediaSrc(post.video_url);
  const isPodcast = post.type === 'podcast';
  const featuredSrc = post.featured_image ? mediaSrc(post.featured_image) : null;

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,17rem)_minmax(0,48rem)] lg:gap-8 xl:gap-10 lg:justify-center">
          <PhysioFeedDetailSidebar posts={related} currentSlug={slug} loading={relatedLoading} />

          <article className="min-w-0 w-full max-w-3xl lg:max-w-none mx-auto lg:mx-0">
            <Link to="/physiofeed" className="text-sm text-indigo-600 font-semibold inline-flex items-center gap-1 mb-5">
              <FaIcon icon="fa-arrow-left" /> Back to PhysioFeed
            </Link>

            {featuredSrc && (
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-100 aspect-[16/9] sm:aspect-[2/1] max-h-[min(52vw,320px)] sm:max-h-[360px] mb-6">
                <img
                  src={featuredSrc}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                  decoding="async"
                />
              </div>
            )}

            <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{post.type}</span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mt-3">{post.title}</h1>
            <p className="text-sm text-slate-500 mt-2">
              {post.author_name}
              {post.published_at ? ` · ${post.published_at.slice(0, 10)}` : ''}
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
      </div>
      <Footer />
    </>
  );
}
