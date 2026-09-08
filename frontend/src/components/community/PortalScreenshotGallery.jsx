import { useCallback, useEffect, useRef, useState } from 'react';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  coverflowRole,
  galleryCenterIndex,
  shortestOffset,
  stackRoles,
} from '../../constants/communityPreview';

function shotLabel(shot, index) {
  return shot?.title || shot?.alt || `Portal screenshot ${index + 1}`;
}

function ShotFrame({ shot, index }) {
  const src = resolveMediaUrl(shot.url) || shot.url;
  const label = shotLabel(shot, index);
  return (
    <span className="portal-shot-frame">
      <img src={src} alt={shot.alt || label} loading="lazy" decoding="async" />
    </span>
  );
}

export default function PortalScreenshotGallery({ shots = [], onOpen }) {
  const n = shots.length;
  const [active, setActive] = useState(() => galleryCenterIndex(n));
  const pointer = useRef(null);
  const swiped = useRef(false);
  const roles = stackRoles(n);

  useEffect(() => {
    setActive(galleryCenterIndex(n));
  }, [n]);

  const go = useCallback(
    (dir) => {
      if (n < 2) return;
      setActive((current) => (current + dir + n) % n);
    },
    [n]
  );

  const openIfNotSwiped = (index, event) => {
    if (swiped.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onOpen(index);
  };

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      axis: null,
    };
    swiped.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (start.axis === 'x') swiped.current = true;
  };

  const onPointerUp = (event) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.axis === 'x' && Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
      go(dx > 0 ? -1 : 1);
    }
    window.setTimeout(() => {
      swiped.current = false;
    }, 40);
  };

  if (!n) return null;

  return (
    <div className="portal-gallery">
      <div className={`portal-stack portal-stack--n${n} hidden md:flex`} aria-label="Portal screenshots">
        {shots.map((shot, i) => {
          const role = roles[i] || 'center';
          const label = shotLabel(shot, i);
          return (
            <button
              key={`${shot.url}-stack-${i}`}
              type="button"
              className={`portal-stack__card portal-stack__card--${role}`}
              onClick={() => onOpen(i)}
              aria-label={`Open preview: ${label}`}
            >
              <ShotFrame shot={shot} index={i} />
            </button>
          );
        })}
      </div>

      <div className="md:hidden">
        <div
          className="portal-coverflow"
          role="region"
          aria-roledescription="carousel"
          aria-label="Portal screenshots"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointer.current = null;
          }}
        >
          {shots.map((shot, i) => {
            const offset = shortestOffset(i, active, n);
            const role = coverflowRole(offset);
            const label = shotLabel(shot, i);
            const peeking = role === 'center' || role === 'left' || role === 'right';
            return (
              <button
                key={`${shot.url}-cover-${i}`}
                type="button"
                className={`portal-coverflow__card portal-coverflow__card--${role}`}
                onClick={(event) => openIfNotSwiped(i, event)}
                tabIndex={peeking ? 0 : -1}
                aria-hidden={!peeking}
                aria-label={`Open preview: ${label}`}
                aria-current={role === 'center' ? 'true' : undefined}
              >
                <ShotFrame shot={shot} index={i} />
              </button>
            );
          })}
        </div>

        {n > 1 && (
          <div className="portal-coverflow__nav">
            <button
              type="button"
              className="portal-coverflow__arrow"
              onClick={() => go(-1)}
              aria-label="Previous screenshot"
            >
              <FaIcon icon="fa-chevron-left" />
            </button>
            <div className="portal-coverflow__dots" role="tablist" aria-label="Screenshot position">
              {shots.map((shot, i) => (
                <button
                  key={`${shot.url}-dot-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  className={`portal-coverflow__dot ${i === active ? 'is-active' : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`Show screenshot ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              className="portal-coverflow__arrow"
              onClick={() => go(1)}
              aria-label="Next screenshot"
            >
              <FaIcon icon="fa-chevron-right" />
            </button>
          </div>
        )}
        <p className="sr-only">Swipe left or right to move the gallery. The center screenshot is the focal image.</p>
      </div>
    </div>
  );
}
