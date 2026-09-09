import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { orgLogos } from '../../services/api';
import { sanitizeCmsImageUrl } from '../../utils/mediaUrl';
import { ORG_LOGOS_COPY, orgHeadingParts } from '../../constants/orgLogosDefaults';

function HeadingText({ heading, highlight }) {
  const parts = orgHeadingParts(heading, highlight);
  if (!parts.mark) return parts.before;
  return (
    <>
      {parts.before}
      <span className="org-heading-accent">{parts.mark}</span>
      {parts.after}
    </>
  );
}

function LogoMark({ logo }) {
  const src = sanitizeCmsImageUrl(logo.image);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className="org-logo-img"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="org-logo-wordmark" aria-hidden={!logo.name}>
      {logo.name || 'Organisation'}
    </span>
  );
}

export default function OrgLogosSection() {
  const reduceMotion = useReducedMotion();
  const [payload, setPayload] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    orgLogos
      .settings()
      .then((res) => {
        const d = res?.data ?? res;
        if (!cancelled && d) setPayload(d);
      })
      .catch(() => {
        if (!cancelled) setPayload({ enabled: false, logos: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logos = payload?.logos || [];
  const loop = useMemo(() => {
    if (!logos.length) return [];
    let base = logos;
    while (base.length < 8) base = [...base, ...logos];
    return [...base, ...base];
  }, [logos]);

  if (!payload?.enabled || !logos.length) return null;

  const heading = payload.heading || ORG_LOGOS_COPY.heading;
  const highlight = payload.heading_highlight || '';
  const duration = Math.max(28, loop.length * 2.4);

  return (
    <section className="org-section" aria-labelledby="org-heading">
      <div className="org-shell">
        <h2 id="org-heading" className="org-heading">
          <HeadingText heading={heading} highlight={highlight} />
        </h2>
        <p className="sr-only">
          Organisations include {logos.map((l) => l.name).filter(Boolean).join(', ')}.
        </p>
      </div>
      <div
        className={`org-marquee${reduceMotion ? ' is-static' : ''}${paused ? ' is-paused' : ''}`}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        style={{ '--org-marquee-ms': `${duration}s` }}
        aria-hidden="true"
      >
        <div className="org-marquee-track">
          {loop.map((logo, i) => (
            <div
              key={`${logo.id || logo.name}-${i}`}
              className="org-logo"
              aria-hidden={i >= logos.length ? true : undefined}
            >
              <LogoMark logo={logo} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
