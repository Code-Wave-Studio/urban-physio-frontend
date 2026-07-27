import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { usePodcastPlayerOptional } from '../../contexts/PodcastPlayerContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import FavoritePodcastButton from './FavoritePodcastButton';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PersistentPodcastPlayer() {
  const ctx = usePodcastPlayerOptional();
  const { episode, playing, togglePlay, closePlayer, progress, seekTo } = ctx || {};

  if (!episode) return null;

  const thumb = resolveMediaUrl(episode.featured_image);
  const current = progress?.current ?? 0;
  const duration = progress?.duration ?? 0;

  const onSeek = (e) => {
    seekTo?.(Number(e.target.value) / 100);
  };

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className="podcast-mini-player fixed left-0 right-0 z-[109] top-14 sm:top-16 border-b border-rose-100/80 bg-white/95 backdrop-blur-md shadow-md shadow-slate-900/5"
      role="region"
      aria-label="Podcast player"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-3 py-2 min-h-[3.75rem]">
        {thumb ? (
          <img src={thumb} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 hidden sm:block" />
        ) : (
          <span className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 hidden sm:flex">
            <FaIcon icon="fa-podcast" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <Link
            to={episode.detailPath || episode.canonical_path || `/podcast/${episode.slug}`}
            className="text-xs sm:text-sm font-semibold text-slate-900 truncate block hover:text-rose-700"
          >
            {episode.title}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
              {formatTime(current)}
              {duration > 0 ? ` / ${formatTime(duration)}` : ''}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPct}
              onChange={onSeek}
              className="podcast-mini-player__seek flex-1 min-w-0 h-1 accent-rose-500"
              aria-label="Seek"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <FavoritePodcastButton
            post={{
              slug: episode.slug,
              title: episode.title,
              author_name: episode.author_name,
              featured_image: episode.featured_image,
              audio_url: episode.audio_url,
            }}
            compact
          />
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 active:scale-95 transition shrink-0"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <FaIcon icon={playing ? 'fa-pause' : 'fa-play'} className="text-sm" />
          </button>
          <button
            type="button"
            onClick={closePlayer}
            className="w-9 h-9 rounded-full border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 shrink-0"
            aria-label="Close player"
          >
            <FaIcon icon="fa-xmark" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
