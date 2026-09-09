import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import FaIcon from '../FaIcon';
import { physioTeam } from '../../services/api';
import { sanitizeCmsImageUrl } from '../../utils/mediaUrl';
import {
  carouselProfiles,
  headingParts,
  listProfiles,
} from '../../constants/physioTeamDefaults';

function initialsFrom(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'PT';
}

function Stars({ value = 5, className = '' }) {
  const n = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <span className={`pt-stars ${className}`} aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FaIcon key={i} icon="fa-star" className={i < n ? 'is-on' : 'is-off'} />
      ))}
    </span>
  );
}

function Portrait({ src, alt, className, grayscale = false, fallback = null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) return fallback;
  return (
    <img
      src={src}
      alt={alt}
      className={`${className}${grayscale ? ' pt-photo--bw' : ''}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function HeadingText({ heading, highlight }) {
  const parts = headingParts(heading, highlight);
  if (!parts.mark) return parts.before;
  return (
    <>
      {parts.before}
      <span className="pt-heading-accent">{parts.mark}</span>
      {parts.after}
    </>
  );
}

export default function PhysioTeamSection() {
  const reduceMotion = useReducedMotion();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [marqueePaused, setMarqueePaused] = useState(false);
  const selectorRef = useRef(null);
  const detailRef = useRef(null);
  const itemRefs = useRef({});
  const skipScrollSelect = useRef(false);
  const scrollSelectTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    physioTeam
      .settings()
      .then((res) => {
        const d = res?.data ?? res;
        if (cancelled || !d) return;
        setPayload(d);
        const list = listProfiles(d.profiles || []);
        const first = list[0] || (d.profiles || [])[0];
        if (first?.id) setSelectedId(first.id);
      })
      .catch(() => {
        if (!cancelled) setPayload({ enabled: false, profiles: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const profiles = payload?.profiles || [];
  const list = useMemo(() => listProfiles(profiles), [profiles]);
  const carousel = useMemo(() => carouselProfiles(profiles), [profiles]);
  const selected = useMemo(
    () => profiles.find((p) => p.id === selectedId) || list[0] || profiles[0] || null,
    [profiles, list, selectedId]
  );

  const alignActivePicker = useCallback((id) => {
    if (!id || typeof window === 'undefined') return;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const el = mobile ? itemRefs.current[`m-${id}`] : itemRefs.current[id];
    const container = mobile ? selectorRef.current : el?.closest?.('.pt-list');
    if (!el || !container) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (mobile) {
      const isLast = Boolean(list.length) && list[list.length - 1]?.id === id;
      const delta = isLast ? r.right - c.right : r.left - c.left;
      if (Math.abs(delta) > 1) container.scrollBy({ left: delta, behavior });
      return;
    }
    let dy = 0;
    if (r.top < c.top) dy = r.top - c.top;
    else if (r.bottom > c.bottom) dy = r.bottom - c.bottom;
    if (dy) container.scrollBy({ top: dy, behavior });
  }, [list, reduceMotion]);

  const selectProfile = useCallback((id, opts = {}) => {
    if (!id) return;
    skipScrollSelect.current = true;
    setSelectedId(id);
    requestAnimationFrame(() => {
      alignActivePicker(id);
      window.setTimeout(() => {
        skipScrollSelect.current = false;
      }, 480);
    });
    if (opts.scrollDetail && detailRef.current && typeof detailRef.current.scrollIntoView === 'function') {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [alignActivePicker]);

  const loopCards = useMemo(() => {
    if (!carousel.length) return [];
    let base = carousel;
    while (base.length < 6) base = [...base, ...carousel];
    return [...base, ...base];
  }, [carousel]);

  const activeDot = Math.max(0, list.findIndex((p) => p.id === selected?.id));

  const pickFromSelectorScroll = useCallback(() => {
    if (skipScrollSelect.current) return;
    const scroller = selectorRef.current;
    if (!scroller || !list.length) return;
    const cards = [...scroller.querySelectorAll('[data-pt-id]')];
    if (!cards.length) return;
    const origin = scroller.getBoundingClientRect().left + 6;
    let best = cards[0];
    let bestDist = Infinity;
    cards.forEach((card) => {
      const dist = Math.abs(card.getBoundingClientRect().left - origin);
      if (dist < bestDist) {
        bestDist = dist;
        best = card;
      }
    });
    const id = best.getAttribute('data-pt-id');
    if (id) setSelectedId((cur) => (id !== cur ? id : cur));
  }, [list.length]);

  const onSelectorScroll = useCallback(() => {
    window.clearTimeout(scrollSelectTimer.current);
    scrollSelectTimer.current = window.setTimeout(pickFromSelectorScroll, 90);
  }, [pickFromSelectorScroll]);

  useEffect(() => () => window.clearTimeout(scrollSelectTimer.current), []);

  useEffect(() => {
    const scroller = selectorRef.current;
    if (!scroller || typeof scroller.addEventListener !== 'function') return undefined;
    const onEnd = () => pickFromSelectorScroll();
    scroller.addEventListener('scrollend', onEnd);
    return () => scroller.removeEventListener('scrollend', onEnd);
  }, [pickFromSelectorScroll, list.length]);

  if (loading) {
    return (
      <section className="pt-section" aria-busy="true" aria-label="Loading physiotherapists">
        <div className="pt-shell">
          <div className="pt-skeleton pt-skeleton-title" />
          <div className="pt-skeleton pt-skeleton-lede" />
          <div className="pt-skeleton pt-skeleton-stage" />
        </div>
      </section>
    );
  }

  if (!payload?.enabled || !profiles.length || !selected) return null;

  const photo = sanitizeCmsImageUrl(selected.image);
  const photoAlt = selected.image_alt || `${selected.name}, physiotherapist`;
  const marqueeMs = Math.max(28, loopCards.length * 3.4);

  return (
    <section className="pt-section" aria-labelledby="pt-heading">
      <div className="pt-shell">
        <header className="pt-header">
          <h2 id="pt-heading" className="pt-heading">
            <HeadingText heading={payload.heading} highlight={payload.heading_highlight} />
          </h2>
          {payload.description ? <p className="pt-lede">{payload.description}</p> : null}
        </header>

        <div className={`pt-stage${list.length ? '' : ' pt-stage--solo'}`}>
          {list.length > 0 ? (
          <div className="pt-list" role="listbox" aria-label="Physiotherapists" aria-activedescendant={selected.id}>
            {list.map((p) => {
              const active = p.id === selected.id;
              const thumb = sanitizeCmsImageUrl(p.image);
              return (
                <button
                  key={p.id}
                  type="button"
                  id={`pt-list-${p.id}`}
                  role="option"
                  aria-selected={active}
                  data-pt-id={p.id}
                  ref={(el) => {
                    itemRefs.current[p.id] = el;
                  }}
                  className={`pt-list-card${active ? ' is-active' : ''}`}
                  onClick={() => selectProfile(p.id)}
                >
                  <span className="pt-list-avatar">
                    <Portrait
                      src={thumb}
                      alt=""
                      className="pt-list-avatar-img"
                      fallback={<span className="pt-avatar-fallback">{initialsFrom(p.name)}</span>}
                    />
                  </span>
                  <span className="pt-list-copy">
                    <span className="pt-list-name">{p.name}</span>
                    <span className="pt-list-qual">{p.qualification || p.designation}</span>
                  </span>
                  <Stars value={p.rating} className="pt-list-stars" />
                  <span className="pt-list-rating-pill" aria-hidden="true">
                    <FaIcon icon="fa-star" />
                    {p.rating || 5}
                  </span>
                </button>
              );
            })}
          </div>
          ) : null}

          {list.length > 1 ? (
          <div
            ref={selectorRef}
            className="pt-selector"
            onScroll={onSelectorScroll}
            role="listbox"
            aria-label="Choose a physiotherapist"
            aria-activedescendant={selected.id ? `pt-select-${selected.id}` : undefined}
          >
            {list.map((p) => {
              const active = p.id === selected.id;
              const thumb = sanitizeCmsImageUrl(p.image);
              return (
                <button
                  key={p.id}
                  type="button"
                  id={`pt-select-${p.id}`}
                  role="option"
                  aria-selected={active}
                  data-pt-id={p.id}
                  ref={(el) => {
                    itemRefs.current[`m-${p.id}`] = el;
                  }}
                  className={`pt-selector-card${active ? ' is-active' : ''}`}
                  onClick={() => selectProfile(p.id)}
                >
                  <span className="pt-list-avatar">
                    <Portrait
                      src={thumb}
                      alt=""
                      className="pt-list-avatar-img"
                      fallback={<span className="pt-avatar-fallback">{initialsFrom(p.name)}</span>}
                    />
                  </span>
                  <span className="pt-list-copy">
                    <span className="pt-list-name">{p.name}</span>
                    <span className="pt-list-qual">{p.qualification || p.designation}</span>
                  </span>
                  <span className="pt-list-rating-pill">
                    <FaIcon icon="fa-star" />
                    {p.rating || 5}
                  </span>
                </button>
              );
            })}
          </div>
          ) : null}

          <article ref={detailRef} className="pt-detail" aria-live="polite">
            <div
              key={selected.id}
              className={`pt-profile${reduceMotion ? '' : ' is-animating'}`}
            >
              <div className="pt-profile-media">
                <Portrait
                  src={photo}
                  alt={photoAlt}
                  className="pt-profile-photo"
                  fallback={<span className="pt-profile-fallback">{initialsFrom(selected.name)}</span>}
                />
              </div>

              <header className="pt-profile-head">
                <div className="pt-profile-identity">
                  <p className="pt-profile-kicker">Physiotherapist</p>
                  <h3 className="pt-profile-name">{selected.name}</h3>
                  {selected.qualification ? (
                    <p className="pt-profile-quals">{selected.qualification}</p>
                  ) : null}
                  {selected.designation ? (
                    <p className="pt-profile-role">{selected.designation}</p>
                  ) : null}
                  <Stars value={selected.rating} className="pt-profile-stars" />
                </div>

                <div className="pt-profile-meta">
                {(selected.experience || selected.badge) ? (
                  <ul className="pt-profile-stats">
                    {selected.experience ? (
                      <li>
                        <span className="pt-stat-icon" aria-hidden="true">
                          <FaIcon icon="fa-briefcase" />
                        </span>
                        <span>
                          <span className="pt-stat-label">Experience</span>
                          <span className="pt-stat-value">{selected.experience}</span>
                        </span>
                      </li>
                    ) : null}
                    {selected.badge ? (
                      <li>
                        <span className="pt-stat-icon is-blue" aria-hidden="true">
                          <FaIcon icon="fa-stethoscope" />
                        </span>
                        <span>
                          <span className="pt-stat-label">Patients treated</span>
                          <span className="pt-stat-value">{selected.badge}</span>
                        </span>
                      </li>
                    ) : null}
                  </ul>
                ) : null}

                {(selected.specialties || []).length > 0 ? (
                  <section className="pt-profile-block pt-profile-block--flush" aria-label="Specialties">
                    <p className="pt-block-label">Specialties</p>
                    <ul className="pt-chips">
                      {selected.specialties.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                </div>
              </header>

              <div className="pt-profile-body">
                {selected.description ? (
                  <section className="pt-profile-block" aria-label="Professional summary">
                    <p className="pt-block-label">Professional summary</p>
                    {selected.description.split(/\n{2,}/).map((para, i) => (
                      <p key={i} className="pt-bio">
                        {para}
                      </p>
                    ))}
                  </section>
                ) : null}

                {selected.approach_heading || (selected.approach || []).length ? (
                  <section className="pt-profile-block" aria-label="Treatment approach">
                    <p className="pt-block-label">
                      {selected.approach_heading || 'Treatment approach'}
                    </p>
                    <ol className="pt-principles">
                      {(selected.approach || []).map((row, i) => (
                        <li key={`${row.title}-${i}`}>
                          <span className="pt-principles-num">{String(i + 1).padStart(2, '0')}</span>
                          <span>
                            {row.title ? <strong>{row.title}</strong> : null}
                            {row.body ? <span className="pt-principles-body">{row.body}</span> : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </div>
            </div>
          </article>
        </div>

        {list.length > 1 ? (
          <div
            className={`pt-dots${list.length > 12 ? ' is-dense' : ''}`}
            role="tablist"
            aria-label="Physiotherapist pages"
          >
            {list.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === activeDot}
                className={`pt-dot${i === activeDot ? ' is-active' : ''}`}
                onClick={() => selectProfile(p.id)}
                aria-label={`Show ${p.name}`}
              />
            ))}
          </div>
        ) : null}

      </div>

      {carousel.length > 0 ? (
        <div
          className={`pt-marquee${reduceMotion ? ' is-static' : ''}${marqueePaused ? ' is-paused' : ''}`}
          onPointerEnter={() => setMarqueePaused(true)}
          onPointerLeave={() => setMarqueePaused(false)}
          onPointerDown={() => setMarqueePaused(true)}
          style={{ '--pt-marquee-ms': `${marqueeMs}s` }}
        >
          <div className="pt-marquee-track">
            {loopCards.map((p, i) => {
              const src = sanitizeCmsImageUrl(p.carousel_image || p.image);
              return (
                <button
                  key={`${p.id}-${i}`}
                  type="button"
                  className={`pt-card${p.id === selected.id ? ' is-active' : ''}`}
                  onClick={() => selectProfile(p.id, { scrollDetail: true })}
                  aria-label={`View ${p.name}`}
                >
                  <span className="pt-card-photo">
                    <Portrait
                      src={src}
                      alt=""
                      className="pt-card-img"
                      grayscale
                      fallback={<span className="pt-avatar-fallback pt-card-fallback">{initialsFrom(p.name)}</span>}
                    />
                  </span>
                  <span className="pt-card-meta">
                    <span className="pt-card-name">{p.name}</span>
                    <span className="pt-card-qual">{p.qualification || p.designation}</span>
                    {p.experience ? <span className="pt-card-exp">{p.experience}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
