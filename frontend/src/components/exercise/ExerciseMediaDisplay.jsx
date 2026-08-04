import { useMemo } from 'react';
import { parseMediaSource } from '../../utils/mediaParser';
import CustomExercisePlayer from './CustomExercisePlayer';

/**
 * Universal Exercise Media Rendering Component
 *
 * variant="player"     — custom distraction-free player with controls below video
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

  if (variant === 'player') {
    return (
      <CustomExercisePlayer
        exercise={exercise}
        mediaUrl={mediaUrl}
        title={label}
        className={className}
      />
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
