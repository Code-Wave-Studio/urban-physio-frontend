import { useMemo } from 'react';
import { parseMediaSource } from '../../utils/mediaParser';

/**
 * Universal Exercise Media Rendering Component
 * Renders native videos, static GIFs, Images, or YouTube embeds.
 * Strictly enforces silent autoplay, continuous looping, and clean presentation.
 */
export default function ExerciseMediaDisplay({
  exercise,
  mediaUrl,
  className = 'w-full h-full object-cover',
  title = '',
}) {
  const media = useMemo(() => {
    return parseMediaSource(exercise || mediaUrl);
  }, [exercise, mediaUrl]);

  if (!media.type) {
    return null;
  }

  if (media.type === 'youtube') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-950 pointer-events-none select-none">
        <iframe
          src={media.embedUrl}
          title={title || (exercise && exercise.name) || 'Exercise Media'}
          className="absolute inset-0 w-full h-full scale-[1.35] object-cover pointer-events-none"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          frameBorder="0"
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
        className={className}
      />
    );
  }

  if (media.type === 'image') {
    return (
      <img
        src={media.url}
        alt={title || (exercise && exercise.name) || 'Exercise Media'}
        className={className}
        loading="lazy"
      />
    );
  }

  return null;
}
