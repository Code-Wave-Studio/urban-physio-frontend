import { resolveMediaUrl } from './mediaUrl';

/**
 * Extracts YouTube video ID from various YouTube URL formats.
 * Matches:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

/**
 * Universal media source parser.
 * Reads an exercise object or raw media URL string and normalizes it.
 *
 * Returns structured object:
 * {
 *   type: 'youtube' | 'video' | 'image' | null,
 *   url: string | null,
 *   embedUrl: string | null,
 *   videoId: string | null,
 *   rawUrl: string | null
 * }
 */
export function parseMediaSource(exerciseOrUrl) {
  if (!exerciseOrUrl) {
    return { type: null, url: null, embedUrl: null, videoId: null, rawUrl: null };
  }

  let rawUrl = null;
  let fallbackImageUrl = null;

  if (typeof exerciseOrUrl === 'string') {
    rawUrl = exerciseOrUrl.trim();
  } else if (typeof exerciseOrUrl === 'object') {
    rawUrl = (
      exerciseOrUrl.video_url ||
      exerciseOrUrl.media_url ||
      exerciseOrUrl.video ||
      exerciseOrUrl.url ||
      null
    );
    if (typeof rawUrl === 'string') rawUrl = rawUrl.trim();

    fallbackImageUrl = (
      exerciseOrUrl.image_url ||
      exerciseOrUrl.featured_image ||
      exerciseOrUrl.thumbnail ||
      null
    );
    if (typeof fallbackImageUrl === 'string') fallbackImageUrl = fallbackImageUrl.trim();
  }

  // 1. Check for YouTube Link
  if (rawUrl) {
    const videoId = extractYoutubeId(rawUrl);
    if (videoId) {
      // Must append ?autoplay=1&mute=1&loop=1&playlist={VIDEO_ID} for silent continuous looping
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
      return {
        type: 'youtube',
        url: rawUrl,
        embedUrl,
        videoId,
        rawUrl,
      };
    }
  }

  // Determine media string to evaluate (prefer rawUrl if present, else fallbackImageUrl)
  const targetUrl = rawUrl || fallbackImageUrl;
  if (!targetUrl) {
    return { type: null, url: null, embedUrl: null, videoId: null, rawUrl: null };
  }

  const resolved = resolveMediaUrl(targetUrl);
  const lower = targetUrl.toLowerCase();

  // 2. Check for Native Video Files (.mp4, .webm, .ogg, .mov, .m4v)
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  const isVideoFile = videoExtensions.some((ext) => lower.includes(ext));

  if (isVideoFile || lower.includes('data:video/')) {
    return {
      type: 'video',
      url: resolved,
      embedUrl: null,
      videoId: null,
      rawUrl: targetUrl,
    };
  }

  // 3. Native Images / GIFs (.gif, .jpg, .jpeg, .png, .webp, .svg, etc.)
  return {
    type: 'image',
    url: resolved,
    embedUrl: null,
    videoId: null,
    rawUrl: targetUrl,
  };
}
