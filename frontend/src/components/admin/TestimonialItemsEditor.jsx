import FaIcon from '../FaIcon';
import MediaUrlOrUpload from './MediaUrlOrUpload';
import { classifyMediaUrl, MAX_TESTIMONIAL_MEDIA } from '../../utils/testimonialMedia';

function newMedia(type) {
  return {
    id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    url: '',
    poster: '',
    alt: '',
  };
}

function blankTestimonial(quoteKey, placeKey, extraFields) {
  const item = {
    name: '',
    [placeKey]: '',
    [quoteKey]: '',
    rating: 5,
    media: [],
  };
  extraFields.forEach((field) => {
    item[field.key] = '';
  });
  return item;
}

function MediaIssue({ url, type }) {
  const checked = classifyMediaUrl(url, type);
  if (checked.empty || checked.ok) return null;
  return <p className="text-xs text-rose-600 font-medium">{checked.message}</p>;
}

/**
 * Edits the testimonial list on a service page, including a media list on each item.
 * Existing name, place, quote, rating, and any extra fields are kept.
 */
export default function TestimonialItemsEditor({
  items,
  onChange,
  quoteKey = 'text',
  quoteLabel = 'Quote',
  placeKey = 'city',
  placeLabel = 'Locality',
  extraFields = [],
  uploadImage,
  uploadVideo,
  pageLabel = 'this page',
  accent = 'orange',
}) {
  const list = Array.isArray(items) ? items : [];

  const updateAt = (index, patch) => {
    onChange(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateMedia = (index, media) => updateAt(index, { media });

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 leading-relaxed">
        Photos and videos are saved with the testimonial they belong to and only appear on the {pageLabel} page.
        Upload a file or paste a public image or video URL. Private patient files are not accepted.
      </p>

      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <FaIcon icon="fa-comment-slash" className="text-2xl text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No testimonials yet</p>
          <p className="text-xs text-slate-500 mt-1">Add one to show a patient story on {pageLabel}.</p>
        </div>
      )}

      {list.map((item, index) => {
        const media = Array.isArray(item.media) ? item.media : [];
        const rating = Math.min(5, Math.max(1, Number(item.rating) || 5));
        return (
          <article key={item.id || index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Testimonial {index + 1}</p>
              <button
                type="button"
                className="text-red-500 hover:text-red-700 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                onClick={() => onChange(list.filter((_, i) => i !== index))}
                aria-label={`Remove testimonial ${index + 1}`}
              >
                <FaIcon icon="fa-trash" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <input
                className="input-field text-sm"
                placeholder="Name"
                aria-label={`Testimonial ${index + 1} name`}
                value={item.name || ''}
                onChange={(e) => updateAt(index, { name: e.target.value })}
              />
              <input
                className="input-field text-sm"
                placeholder={placeLabel}
                aria-label={`Testimonial ${index + 1} ${placeLabel}`}
                value={item[placeKey] || ''}
                onChange={(e) => updateAt(index, { [placeKey]: e.target.value })}
              />
            </div>

            {extraFields.map((field) => (
              <input
                key={field.key}
                className="input-field text-sm"
                placeholder={field.label}
                aria-label={`Testimonial ${index + 1} ${field.label}`}
                value={item[field.key] || ''}
                onChange={(e) => updateAt(index, { [field.key]: e.target.value })}
              />
            ))}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Rating</span>
              <div className="flex gap-0.5" role="group" aria-label={`Testimonial ${index + 1} rating`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updateAt(index, { rating: star })}
                    className={`text-base p-1 ${star <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                    aria-label={`${star} star${star === 1 ? '' : 's'}`}
                    aria-pressed={star === rating}
                  >
                    <FaIcon icon="fa-star" />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="input-field text-sm min-h-[88px]"
              placeholder={quoteLabel}
              aria-label={`Testimonial ${index + 1} ${quoteLabel}`}
              value={item[quoteKey] || ''}
              onChange={(e) => updateAt(index, { [quoteKey]: e.target.value })}
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-700">Photos and videos</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-outline text-xs !py-1.5"
                    disabled={media.length >= MAX_TESTIMONIAL_MEDIA}
                    onClick={() => updateMedia(index, [...media, newMedia('image')])}
                  >
                    <FaIcon icon="fa-image" /> Add photo
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-xs !py-1.5"
                    disabled={media.length >= MAX_TESTIMONIAL_MEDIA}
                    onClick={() => updateMedia(index, [...media, newMedia('video')])}
                  >
                    <FaIcon icon="fa-video" /> Add video
                  </button>
                </div>
              </div>

              {media.length === 0 && (
                <p className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3">
                  No photos or videos yet. This testimonial still appears as text.
                </p>
              )}

              {media.map((entry, mediaIndex) => {
                const type = entry.type === 'video' ? 'video' : 'image';
                const setEntry = (patch) => {
                  const next = media.map((row, i) => (i === mediaIndex ? { ...row, ...patch } : row));
                  updateMedia(index, next);
                };
                return (
                  <div key={entry.id || mediaIndex} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {type === 'video' ? 'Video' : 'Photo'} {mediaIndex + 1}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        onClick={() => updateMedia(index, media.filter((_, i) => i !== mediaIndex))}
                      >
                        Remove media
                      </button>
                    </div>
                    <MediaUrlOrUpload
                      label={type === 'video' ? 'Video file or URL' : 'Photo file or URL'}
                      hint={
                        type === 'video'
                          ? 'MP4, WebM, MOV, or AVI up to 80 MB, or a YouTube / Vimeo link. 16:9 plays best.'
                          : 'JPG, PNG, WebP, or GIF up to 4 MB. 4:3 (1200×900) looks best in the card.'
                      }
                      icon={type === 'video' ? 'fa-video' : 'fa-image'}
                      urlValue={entry.url || ''}
                      onUrlChange={(value) => setEntry({ url: value })}
                      onUpload={type === 'video' ? uploadVideo : uploadImage}
                      accept={
                        type === 'video'
                          ? 'video/mp4,video/webm,video/quicktime,.mov,.avi'
                          : 'image/jpeg,image/png,image/webp,image/gif'
                      }
                      maxMb={type === 'video' ? 80 : 4}
                      preview={type === 'video' ? 'video' : 'image'}
                      aspectRatio={type === 'video' ? '16:9' : '4:3'}
                      recommendedSize={type === 'video' ? '16:9' : '1200 × 900'}
                      accent={accent}
                    />
                    <MediaIssue url={entry.url} type={type} />
                    {type === 'video' && (
                      <div className="space-y-1">
                        <MediaUrlOrUpload
                          label="Poster image (optional)"
                          hint="Shown before the video plays. JPG, PNG, or WebP."
                          icon="fa-image"
                          urlValue={entry.poster || ''}
                          onUrlChange={(value) => setEntry({ poster: value })}
                          onUpload={uploadImage}
                          accept="image/jpeg,image/png,image/webp"
                          maxMb={4}
                          preview="image"
                          aspectRatio="16:9"
                          recommendedSize="1280 × 720"
                          accent="rose"
                        />
                        <MediaIssue url={entry.poster} type="image" />
                      </div>
                    )}
                    <input
                      className="input-field text-sm"
                      placeholder={type === 'video' ? 'Short description of the video (optional)' : 'Short description of the photo (optional)'}
                      aria-label={`Testimonial ${index + 1} media ${mediaIndex + 1} description`}
                      value={entry.alt || ''}
                      onChange={(e) => setEntry({ alt: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}

      <button
        type="button"
        className="btn-outline text-xs !py-2"
        onClick={() => onChange([...list, blankTestimonial(quoteKey, placeKey, extraFields)])}
      >
        <FaIcon icon="fa-plus" /> Add testimonial
      </button>
    </div>
  );
}
