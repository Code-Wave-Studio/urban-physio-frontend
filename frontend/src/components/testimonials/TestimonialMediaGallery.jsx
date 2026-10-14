import { useState } from 'react';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  visibleTestimonialMedia,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
  youtubePoster,
} from '../../utils/testimonialMedia';

function resolved(url) {
  return resolveMediaUrl(url) || url;
}

function PhotoFrame({ src, alt }) {
  const [state, setState] = useState('loading');
  return (
    <>
      {state === 'loading' && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden />}
      {state === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center text-slate-500">
          <FaIcon icon="fa-image" className="text-lg text-slate-400" />
          <span className="text-xs font-medium">This photo could not be loaded</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            state === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </>
  );
}

function FileVideo({ src, poster }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center text-slate-200 bg-slate-900">
        <FaIcon icon="fa-circle-exclamation" className="text-lg" />
        <span className="text-xs font-medium">This video could not be loaded</span>
      </div>
    );
  }
  return (
    <video
      controls
      playsInline
      preload="metadata"
      poster={poster || undefined}
      src={src}
      onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full object-contain bg-black"
    >
      Your browser cannot play this video.
    </video>
  );
}

function EmbedVideo({ embedUrl, poster, title }) {
  const [play, setPlay] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  if (play) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlay(true)}
      className="absolute inset-0 w-full h-full group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      aria-label={`Play video: ${title}`}
    >
      {!posterFailed && poster ? (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setPosterFailed(true)}
        />
      ) : (
        <span className="absolute inset-0 bg-slate-900" />
      )}
      <span className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
      <span className="relative inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/95 text-slate-900 shadow-lg">
        <FaIcon icon="fa-play" className="text-sm ml-0.5" />
      </span>
    </button>
  );
}

function MediaTile({ item, label }) {
  const youtube = item.type === 'video' ? youtubeEmbedUrl(item.url) : '';
  const vimeo = item.type === 'video' && !youtube ? vimeoEmbedUrl(item.url) : '';
  const poster = item.poster
    ? resolved(item.poster)
    : youtube
      ? youtubePoster(item.url)
      : '';
  const alt = item.alt || `${label} photo`;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-100 ${
        item.type === 'video' ? 'aspect-video' : 'aspect-[4/3]'
      }`}
    >
      {item.type === 'image' && <PhotoFrame src={resolved(item.url)} alt={alt} />}
      {item.type === 'video' && youtube && (
        <EmbedVideo embedUrl={youtube} poster={poster} title={item.alt || `${label} video`} />
      )}
      {item.type === 'video' && vimeo && (
        <EmbedVideo embedUrl={vimeo} poster={poster} title={item.alt || `${label} video`} />
      )}
      {item.type === 'video' && !youtube && !vimeo && (
        <FileVideo src={resolved(item.url)} poster={poster} />
      )}
    </div>
  );
}

/** Photos and videos that belong to one testimonial. Renders nothing when there is no media. */
export default function TestimonialMediaGallery({ media, name = '' }) {
  const items = visibleTestimonialMedia(media);
  if (items.length === 0) return null;
  const label = name.trim() || 'Patient testimonial';
  const multi = items.length > 1;

  return (
    <ul
      className={`grid gap-2 mb-4 ${multi ? 'grid-cols-1 min-[480px]:grid-cols-2' : 'grid-cols-1'}`}
      aria-label={`Photos and videos for ${label}`}
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <MediaTile item={item} label={label} />
        </li>
      ))}
    </ul>
  );
}
