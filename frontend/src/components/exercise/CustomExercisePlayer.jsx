import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon';
import { parseMediaSource } from '../../utils/mediaParser';

export default function CustomExercisePlayer({
  exercise,
  mediaUrl,
  title = '',
  className = '',
}) {
  const media = useMemo(() => parseMediaSource(exercise || mediaUrl), [exercise, mediaUrl]);
  const label = title || (exercise && (exercise.name || exercise.exercise_name)) || 'Exercise Video';
  const [iframeError, setIframeError] = useState(false);

  // Standard YouTube Embed URL with standard controls (controls=1)
  const youtubeEmbedUrl = useMemo(() => {
    if (media.type !== 'youtube' || !media.videoId) return null;
    return `https://www.youtube.com/embed/${media.videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`;
  }, [media]);

  if (!media.type) return null;

  // Static Image / GIF Display
  if (media.type === 'image') {
    return (
      <div className={`w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-md relative ${className}`}>
        <img src={media.url} alt={label} className="w-full h-full object-contain bg-slate-900" />
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-teal-300 flex items-center gap-1.5 border border-slate-700/50">
          <FaIcon icon="fa-image" />
          <span>Exercise Guide Image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl relative ${className}`}>
      {/* YouTube Standard Player */}
      {media.type === 'youtube' && youtubeEmbedUrl && !iframeError && (
        <iframe
          src={youtubeEmbedUrl}
          title={label}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; accelerometer; clipboard-write; gyroscope"
          allowFullScreen
          onError={() => setIframeError(true)}
        />
      )}

      {/* HTML5 Video Standard Player */}
      {media.type === 'video' && (
        <video
          src={media.url}
          autoPlay
          controls
          playsInline
          className="w-full h-full object-contain bg-black"
        />
      )}

      {/* Fallback Image overlay if embed fails */}
      {iframeError && media.thumbnailUrl && (
        <img src={media.thumbnailUrl} alt={label} className="w-full h-full object-cover" />
      )}
    </div>
  );
}
