import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { setFloatingActionsHidden } from '../../utils/floatingActionsBus';

export default function PortalLightbox({
  open,
  items = [],
  index = 0,
  onClose,
  onIndexChange,
  accent = 'orange',
}) {
  const startX = useRef(null);
  const closeBtnRef = useRef(null);
  const total = items.length;
  const current = items[index] || null;
  const src = current ? resolveMediaUrl(current.url) || current.url : '';
  const title = current?.title || current?.alt || 'Portal screenshot';
  const accentBtn = accent === 'teal' ? 'hover:bg-teal-50 hover:text-teal-800' : 'hover:bg-orange-50 hover:text-primary-800';

  const go = useCallback(
    (dir) => {
      if (total < 2) return;
      const next = (index + dir + total) % total;
      onIndexChange(next);
    },
    [index, onIndexChange, total]
  );

  useEffect(() => {
    setFloatingActionsHidden(open, 'portal-lightbox');
    return () => setFloatingActionsHidden(false, 'portal-lightbox');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose, go]);

  if (!open || !current) return null;

  const onPointerDown = (e) => {
    startX.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 48) return;
    go(dx > 0 ? -1 : 1);
  };

  return createPortal(
    <div className="community-lightbox" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="community-lightbox__backdrop" aria-label="Close preview" onClick={onClose} />

      <div className="community-lightbox__stage">
        <button
          ref={closeBtnRef}
          type="button"
          className="community-lightbox__close"
          onClick={onClose}
          aria-label="Close preview"
        >
          <FaIcon icon="fa-xmark" />
        </button>

        {total > 1 && (
          <button
            type="button"
            className="community-lightbox__nav community-lightbox__nav--prev"
            onClick={() => go(-1)}
            aria-label="Previous screenshot"
          >
            <FaIcon icon="fa-chevron-left" />
          </button>
        )}

        <figure
          className="community-lightbox__figure"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            startX.current = null;
          }}
        >
          <img src={src} alt={current.alt || title} className="community-lightbox__img" draggable="false" />
          <figcaption className="community-lightbox__caption">
            <span className="community-lightbox__title">{title}</span>
            {total > 1 && (
              <span className="community-lightbox__count" aria-live="polite">
                {index + 1} / {total}
              </span>
            )}
          </figcaption>
        </figure>

        {total > 1 && (
          <button
            type="button"
            className="community-lightbox__nav community-lightbox__nav--next"
            onClick={() => go(1)}
            aria-label="Next screenshot"
          >
            <FaIcon icon="fa-chevron-right" />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="community-lightbox__thumbs" role="tablist" aria-label="Screenshot thumbnails">
          {items.map((item, i) => (
            <button
              key={`${item.url}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`community-lightbox__thumb ${i === index ? 'is-active' : ''} ${accentBtn}`}
              onClick={() => onIndexChange(i)}
              aria-label={`Show ${item.title || item.alt || `screenshot ${i + 1}`}`}
            >
              <img src={resolveMediaUrl(item.url) || item.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
