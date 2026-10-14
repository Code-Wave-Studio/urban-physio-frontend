/** Client-side checks for testimonial photos and videos. The server repeats these rules. */

export const MAX_TESTIMONIAL_MEDIA = 6;

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi'];
const PRIVATE_MARKERS = [
  '/uploads/patient-reports/',
  '/uploads/documents/',
  '/uploads/reports/',
  '/uploads/campaign_proofs/',
];

export function youtubeId(url = '') {
  const value = String(url);
  const lower = value.toLowerCase();
  if (!lower.includes('youtube.com') && !lower.includes('youtu.be')) return '';
  const short = value.match(/(?:embed\/|shorts\/|youtu\.be\/)([\w-]{11})/i);
  if (short) return short[1];
  const watch = value.match(/[?&]v=([\w-]{11})/i);
  return watch ? watch[1] : '';
}

export function vimeoId(url = '') {
  const value = String(url);
  if (!value.toLowerCase().includes('vimeo.com')) return '';
  const match = value.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/i);
  return match ? match[1] : '';
}

export function youtubeEmbedUrl(url = '') {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : '';
}

export function vimeoEmbedUrl(url = '') {
  const id = vimeoId(url);
  return id ? `https://player.vimeo.com/video/${id}` : '';
}

export function youtubePoster(url = '') {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

function extensionFromUrl(url) {
  const path = String(url).split(/[?#]/)[0];
  const base = path.split('/').pop() || '';
  const dot = base.lastIndexOf('.');
  if (dot < 0) return '';
  return base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isCmsPath(path) {
  const lower = String(path).toLowerCase();
  return lower.includes('/uploads/cms-images/') || lower.includes('/uploads/cms-video/');
}

/**
 * @returns {{ ok: boolean, empty: boolean, message: string }}
 */
export function classifyMediaUrl(url, type = 'image') {
  const kind = type === 'video' ? 'video' : 'image';
  const raw = String(url || '').trim();
  if (!raw) return { ok: false, empty: true, message: '' };
  if (raw.length > 2048 || /[\u0000-\u001f\u007f\s]/.test(raw)) {
    return { ok: false, empty: false, message: 'Enter a valid image or video URL' };
  }
  if (/^(javascript|data|file|blob|vbscript):/i.test(raw) || /%2e%2e|%00|\\|\.\./i.test(raw)) {
    return { ok: false, empty: false, message: 'That media URL is not allowed' };
  }
  const lower = raw.toLowerCase();
  if (PRIVATE_MARKERS.some((marker) => lower.includes(marker))) {
    return { ok: false, empty: false, message: 'Private patient files cannot be published on a testimonial' };
  }
  if (/\.(php\d?|phtml|phar|cgi|pl|exe|sh|bat|cmd|js|mjs|html?|svg|htaccess)(\.|$|\?|#)/i.test(raw)) {
    return { ok: false, empty: false, message: 'That file type cannot be published' };
  }

  let path = raw;
  if (/^https?:\/\//i.test(raw)) {
    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      return { ok: false, empty: false, message: 'Enter a valid image or video URL' };
    }
    if (parsed.username || parsed.password) {
      return { ok: false, empty: false, message: 'Enter a valid image or video URL' };
    }
    path = parsed.pathname || '';
    if (kind === 'video' && (youtubeId(raw) || vimeoId(raw))) {
      return { ok: true, empty: false, message: '' };
    }
  } else if (!raw.startsWith('/') || raw.startsWith('//')) {
    return { ok: false, empty: false, message: 'Enter a valid image or video URL' };
  } else {
    path = raw.split(/[?#]/)[0];
  }

  const ext = extensionFromUrl(path);
  if (isCmsPath(path)) {
    if (kind === 'image' && path.toLowerCase().includes('/uploads/cms-images/') && IMAGE_EXT.includes(ext)) {
      return { ok: true, empty: false, message: '' };
    }
    if (kind === 'video' && path.toLowerCase().includes('/uploads/cms-video/') && VIDEO_EXT.includes(ext)) {
      return { ok: true, empty: false, message: '' };
    }
    return {
      ok: false,
      empty: false,
      message: kind === 'video'
        ? 'Video uploads must be MP4, WebM, MOV, or AVI files in the video library'
        : 'Image uploads must be JPG, PNG, WebP, or GIF files in the image library',
    };
  }

  if (!/^https?:\/\//i.test(raw)) {
    return { ok: false, empty: false, message: 'Upload the file, or paste a full https media URL' };
  }
  const allowed = kind === 'video' ? VIDEO_EXT : IMAGE_EXT;
  if (!allowed.includes(ext)) {
    return {
      ok: false,
      empty: false,
      message: kind === 'video'
        ? 'Use an MP4, WebM, MOV, or AVI file, or a YouTube or Vimeo link'
        : 'Use a JPG, PNG, WebP, or GIF image URL',
    };
  }
  return { ok: true, empty: false, message: '' };
}

export function testimonialMediaError(items) {
  const list = Array.isArray(items) ? items : [];
  for (let i = 0; i < list.length; i += 1) {
    const media = Array.isArray(list[i]?.media) ? list[i].media : [];
    const filled = media.filter((entry) => String(entry?.url || '').trim() !== '');
    if (filled.length > MAX_TESTIMONIAL_MEDIA) {
      return `Testimonial ${i + 1}: a testimonial can include up to ${MAX_TESTIMONIAL_MEDIA} photos or videos`;
    }
    for (let m = 0; m < media.length; m += 1) {
      const entry = media[m] || {};
      const type = entry.type === 'video' ? 'video' : 'image';
      const checked = classifyMediaUrl(entry.url, type);
      if (!checked.empty && !checked.ok) {
        return `Testimonial ${i + 1}, media ${m + 1}: ${checked.message}`;
      }
      if (type === 'video' && String(entry.poster || '').trim()) {
        const poster = classifyMediaUrl(entry.poster, 'image');
        if (!poster.ok) {
          return `Testimonial ${i + 1}, media ${m + 1}: ${poster.message}`;
        }
      }
    }
  }
  return '';
}

export function stripBlankTestimonialMedia(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    media: (Array.isArray(item?.media) ? item.media : []).filter((entry) => String(entry?.url || '').trim() !== ''),
  }));
}

/** Media that is safe to put in the DOM. */
export function visibleTestimonialMedia(list) {
  const source = Array.isArray(list) ? list : [];
  const visible = [];
  for (const entry of source) {
    if (!entry || typeof entry !== 'object') continue;
    const type = entry.type === 'video' ? 'video' : entry.type === 'image' ? 'image' : (youtubeId(entry.url) || vimeoId(entry.url) || VIDEO_EXT.includes(extensionFromUrl(entry.url)) ? 'video' : 'image');
    const checked = classifyMediaUrl(entry.url, type);
    if (!checked.ok) continue;
    let poster = '';
    if (type === 'video' && String(entry.poster || '').trim()) {
      const posterCheck = classifyMediaUrl(entry.poster, 'image');
      poster = posterCheck.ok ? String(entry.poster).trim() : '';
    }
    visible.push({
      id: entry.id || `${type}-${visible.length}`,
      type,
      url: String(entry.url).trim(),
      poster,
      alt: String(entry.alt || '').trim(),
    });
    if (visible.length >= MAX_TESTIMONIAL_MEDIA) break;
  }
  return visible;
}
