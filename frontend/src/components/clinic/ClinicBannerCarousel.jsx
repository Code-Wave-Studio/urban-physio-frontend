import { useEffect, useMemo, useState } from 'react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { hapticTap } from '../../utils/haptics';

/**
 * Auto-scrolling clinic banner — up to 10 images, fade transition.
 * @param {{ images: string[], className?: string, intervalMs?: number, alt?: string }} props
 */
export default function ClinicBannerCarousel({
  images = [],
  className = '',
  intervalMs = 4500,
  alt = 'Clinic banner',
  showOverlay = false,
}) {
  const slides = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const raw of images) {
      const url = resolveMediaUrl(raw) || raw;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
      if (out.length >= 10) break;
    }
    return out;
  }, [images]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  if (!slides.length) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-100 via-white to-orange-50/80 ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`} aria-label={alt}>
      {slides.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === idx ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
          }`}
        >
          <img src={src} alt="" className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
        </div>
      ))}
      {showOverlay && (
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-[3] flex justify-center gap-1.5 px-4">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Banner slide ${i + 1}`}
              onClick={() => {
                hapticTap();
                setIdx(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? 'w-7 bg-emerald-600 shadow-sm' : 'w-1.5 bg-white/90 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
