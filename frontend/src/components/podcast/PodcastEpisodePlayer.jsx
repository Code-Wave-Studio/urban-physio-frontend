import { useRef } from 'react';
import FaIcon from '../FaIcon';
import { usePodcastPlayer } from '../../contexts/PodcastPlayerContext';
import FavoritePodcastButton from './FavoritePodcastButton';

function buildEpisode(post, audioSrc) {
  return {
    slug: post.slug,
    title: post.title,
    author_name: post.author_name,
    featured_image: post.featured_image,
    audio_url: post.audio_url,
    audioSrc,
    detailPath: post?.canonical_path || `/podcast/${post.slug}`,
  };
}

/**
 * Podcast media on detail page — hands off audio to the persistent mini player on play.
 */
export default function PodcastEpisodePlayer({ post, audioSrc, videoSrc }) {
  const { episode, playing, playEpisode, togglePlay } = usePodcastPlayer();
  const inlineRef = useRef(null);
  const isActive = episode?.slug === post.slug;

  const startPlayback = (seek = 0) => {
    playEpisode(buildEpisode(post, audioSrc), seek);
  };

  const handleInlinePlay = (e) => {
    const t = e.currentTarget.currentTime || 0;
    e.currentTarget.pause();
    startPlayback(t);
  };

  if (!videoSrc && !audioSrc) return null;

  return (
    <div className="glass-card p-4 sm:p-5 mt-6 space-y-4 border border-rose-100">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
          <FaIcon icon="fa-podcast" className="text-rose-600" />
          Listen or watch
        </p>
        <FavoritePodcastButton post={post} />
      </div>

      {videoSrc && (
        <video controls className="w-full max-h-[420px] rounded-xl bg-black shadow-lg" src={videoSrc}>
          <track kind="captions" />
        </video>
      )}

      {audioSrc && (
        isActive ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-slate-700 flex-1">
              <span className="font-semibold text-rose-800">Now playing</span>
              {' '}in the player bar above — audio continues as you browse until you close it.
            </p>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 active:scale-[0.98] transition shrink-0 min-h-[44px]"
            >
              <FaIcon icon={playing ? 'fa-pause' : 'fa-play'} />
              {playing ? 'Pause' : 'Resume'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => startPlayback(0)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 active:scale-[0.98] transition min-h-[44px]"
            >
              <FaIcon icon="fa-play" />
              Play episode
            </button>
            <audio
              ref={inlineRef}
              controls
              className="w-full"
              src={audioSrc}
              onPlay={handleInlinePlay}
            >
              <track kind="captions" />
            </audio>
            <p className="text-[11px] text-slate-500 text-center">
              Press play to start — playback moves to the top bar so you can keep listening on other pages.
            </p>
          </div>
        )
      )}
    </div>
  );
}
