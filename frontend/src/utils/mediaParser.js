import { resolveMediaUrl } from './mediaUrl';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
const IMAGE_EXTENSIONS = ['.gif', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.bmp', '.avif'];

/**
 * Extracts YouTube video ID from common URL formats.
 */
export function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regExp);
  return match?.[1] || null;
}

/**
 * Build a silent, looping YouTube embed URL.
 * `playlist={VIDEO_ID}` is required for loop=1 to work.
 */
export function buildYoutubeEmbedUrl(videoId) {
  if (!videoId) return null;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    enablejsapi: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/** Static YouTube thumbnail (for card grid / non-player slots). */
export function youtubeThumbnailUrl(videoId) {
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function pickRawMediaUrl(exerciseOrUrl) {
  if (!exerciseOrUrl) {
    return { rawUrl: null, fallbackImageUrl: null };
  }

  if (typeof exerciseOrUrl === 'string') {
    return { rawUrl: exerciseOrUrl.trim() || null, fallbackImageUrl: null };
  }

  if (typeof exerciseOrUrl !== 'object') {
    return { rawUrl: null, fallbackImageUrl: null };
  }

  let rawUrl =
    exerciseOrUrl.video_url ||
    exerciseOrUrl.media_url ||
    exerciseOrUrl.video ||
    exerciseOrUrl.url ||
    null;
  if (typeof rawUrl === 'string') rawUrl = rawUrl.trim() || null;

  let fallbackImageUrl =
    exerciseOrUrl.image_url ||
    exerciseOrUrl.featured_image ||
    exerciseOrUrl.thumbnail ||
    null;
  if (typeof fallbackImageUrl === 'string') fallbackImageUrl = fallbackImageUrl.trim() || null;

  return { rawUrl, fallbackImageUrl };
}

function pathLooksLike(url, extensions) {
  const lower = String(url).toLowerCase().split('?')[0].split('#')[0];
  return extensions.some((ext) => lower.endsWith(ext));
}

/**
 * Universal media source parser for exercise library media.
 * Normalizes uploaded MP4/WebM, GIFs, images, and YouTube links.
 *
 * @returns {{
 *   type: 'youtube' | 'video' | 'image' | null,
 *   url: string | null,
 *   embedUrl: string | null,
 *   thumbnailUrl: string | null,
 *   videoId: string | null,
 *   rawUrl: string | null
 * }}
 */
export function parseMediaSource(exerciseOrUrl) {
  const empty = {
    type: null,
    url: null,
    embedUrl: null,
    thumbnailUrl: null,
    videoId: null,
    rawUrl: null,
  };

  const { rawUrl, fallbackImageUrl } = pickRawMediaUrl(exerciseOrUrl);
  if (!rawUrl && !fallbackImageUrl) return empty;

  if (rawUrl) {
    const videoId = extractYoutubeId(rawUrl);
    if (videoId) {
      return {
        type: 'youtube',
        url: rawUrl,
        embedUrl: buildYoutubeEmbedUrl(videoId),
        thumbnailUrl: youtubeThumbnailUrl(videoId),
        videoId,
        rawUrl,
      };
    }
  }

  const targetUrl = rawUrl || fallbackImageUrl;
  if (!targetUrl) return empty;

  const resolved = resolveMediaUrl(targetUrl) || targetUrl;
  const lower = targetUrl.toLowerCase();
  const isGifOrImage =
    pathLooksLike(targetUrl, IMAGE_EXTENSIONS) || lower.includes('data:image/');
  const isVideoFile =
    pathLooksLike(targetUrl, VIDEO_EXTENSIONS) || lower.includes('data:video/');

  // GIFs + static images → <img> (GIFs animate natively in <img>)
  if (isGifOrImage || (!rawUrl && fallbackImageUrl)) {
    return {
      type: 'image',
      url: resolved,
      embedUrl: null,
      thumbnailUrl: resolved,
      videoId: null,
      rawUrl: targetUrl,
    };
  }

  // Native video files, or video_url without a clear image extension
  if (isVideoFile || rawUrl) {
    return {
      type: 'video',
      url: resolved,
      embedUrl: null,
      thumbnailUrl: null,
      videoId: null,
      rawUrl: targetUrl,
    };
  }

  return {
    type: 'image',
    url: resolved,
    embedUrl: null,
    thumbnailUrl: resolved,
    videoId: null,
    rawUrl: targetUrl,
  };
}

/** True when an exercise (or URL) has playable / displayable media. */
export function hasExerciseMedia(exerciseOrUrl) {
  return Boolean(parseMediaSource(exerciseOrUrl).type);
}
