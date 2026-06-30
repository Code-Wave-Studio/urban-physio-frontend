import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassModal, { GlassModalBody } from '../GlassModal';
import FaIcon from '../FaIcon';
import PodcastEpisodePlayer from './PodcastEpisodePlayer';
import FavoritePodcastButton from './FavoritePodcastButton';
import { physioFeed } from '../../services/api';
import { resolveMediaUrl } from '../../utils/mediaUrl';

function mediaSrc(url) {
  return resolveMediaUrl(url) || url;
}

export default function SavedPodcastModal({ podcast, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!podcast?.slug) {
      setPost(null);
      return;
    }
    let active = true;
    setLoading(true);
    physioFeed
      .get(podcast.slug)
      .then((res) => {
        if (active) setPost(res?.data ?? res ?? podcast);
      })
      .catch(() => {
        if (active) setPost(podcast);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [podcast]);

  const item = post || podcast;
  const audioSrc = mediaSrc(item?.audio_url);
  const videoSrc = mediaSrc(item?.video_url);
  const cover = mediaSrc(item?.featured_image);

  return (
    <GlassModal open={!!podcast} onClose={onClose} size="md" titleId="saved-podcast-title">
      {podcast && (
        <>
          <div className="shrink-0 p-5 md:p-6 bg-gradient-to-br from-rose-500/15 to-pink-500/10 border-b border-rose-100">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">PhysioFeed · Podcast</span>
                <h2 id="saved-podcast-title" className="text-lg md:text-xl font-bold text-slate-900 mt-1 line-clamp-2">
                  {item?.title || podcast.title}
                </h2>
                {item?.author_name && (
                  <p className="text-xs text-slate-500 mt-1">{item.author_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <FavoritePodcastButton post={item || podcast} />
                <button type="button" onClick={onClose} className="glass-modal-close" aria-label="Close">
                  <FaIcon icon="fa-xmark" />
                </button>
              </div>
            </div>
            {cover && (
              <img src={cover} alt="" className="mt-4 w-full max-h-40 object-cover rounded-xl border border-white/80 shadow-sm" />
            )}
          </div>
          <GlassModalBody className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <FaIcon icon="fa-spinner" className="fa-spin text-rose-500" />
                Loading episode…
              </p>
            ) : (
              <>
                {item?.excerpt && (
                  <p className="text-sm text-slate-600 leading-relaxed">{item.excerpt}</p>
                )}
                {(audioSrc || videoSrc) && (
                  <PodcastEpisodePlayer post={item} audioSrc={audioSrc} videoSrc={videoSrc} />
                )}
                <Link
                  to={`/physiofeed/${podcast.slug}`}
                  onClick={onClose}
                  className="btn-outline w-full text-center text-sm inline-flex items-center justify-center gap-2"
                >
                  <FaIcon icon="fa-arrow-up-right-from-square" />
                  Open full article
                </Link>
              </>
            )}
          </GlassModalBody>
        </>
      )}
    </GlassModal>
  );
}
