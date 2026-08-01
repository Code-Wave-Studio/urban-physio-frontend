import { useMemo } from 'react';
import { parseMediaSource } from '../../utils/mediaParser';

/**
 * Universal Exercise Media Rendering Component
 *
 * variant="player"     — modal / detail: silent autoplay + loop, no controls
 * variant="thumbnail"  — card grid: static YouTube thumb / covered image / muted loop video
 */
export default function ExerciseMediaDisplay({
  exercise,
  mediaUrl,
  className = 'w-full h-full object-cover',
  title = '',
  variant = 'player',
}) {
  const media = useMemo(() => parseMediaSource(exercise || mediaUrl), [exercise, mediaUrl]);
  const label = title || (exercise && exercise.name) || 'Exercise Media';

  if (!media.type) return null;

  // Card grid: prefer lightweight static thumbnail for YouTube
  if (variant === 'thumbnail' && media.type === 'youtube' && media.thumbnailUrl) {
    return (
      <img
        src={media.thumbnailUrl}
        alt={label}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  if (media.type === 'youtube' && media.embedUrl) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-950 pointer-events-none select-none">
        <iframe
          src={media.embedUrl}
          title={label}
          className="absolute inset-0 w-full h-full scale-[1.35] object-cover pointer-events-none border-0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen={false}
          loading="lazy"
          tabIndex={-1}
        />
      </div>
    );
  }

  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        className={className}
      />
    );
  }

  if (media.type === 'image') {
    return (
      <img
        src={media.url}
        alt={label}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return null;
}
