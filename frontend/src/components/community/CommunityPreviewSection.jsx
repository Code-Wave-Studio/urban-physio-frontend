import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon';
import { communityImageValue, platformMeta, visibleSocials } from '../../constants/communityPreview';
import { sanitizeCmsImageUrl } from '../../utils/mediaUrl';

function Heading({ heading, highlight, accentClass }) {
  if (!heading) return null;
  if (highlight && heading.includes(highlight)) {
    const [before, ...rest] = heading.split(highlight);
    return (
      <>
        {before}
        <span className={accentClass}>{highlight}</span>
        {rest.join(highlight)}
      </>
    );
  }
  return heading;
}

function CommunityVisual({ desktopUrl, tabletUrl, alt }) {
  const [desktopFailed, setDesktopFailed] = useState(false);
  const [tabletFailed, setTabletFailed] = useState(false);

  const desktopSrc = !desktopFailed ? desktopUrl : '';
  const tabletSrc = !tabletFailed ? tabletUrl : '';
  const compactSrc = tabletSrc || desktopSrc;
  const largeSrc = desktopSrc || tabletSrc;

  if (!compactSrc && !largeSrc) return null;

  const onError = (which) => () => {
    if (which === 'desktop') setDesktopFailed(true);
    else setTabletFailed(true);
  };

  if (compactSrc === largeSrc) {
    return (
      <div className="community-visual">
        <img
          className="community-visual__img"
          src={compactSrc}
          alt={alt}
          onError={() => {
            setDesktopFailed(true);
            setTabletFailed(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="community-visual">
      {largeSrc && (
        <img
          className="community-visual__img community-visual__img--desktop"
          src={largeSrc}
          alt={alt}
          onError={onError('desktop')}
        />
      )}
      {compactSrc && (
        <img
          className="community-visual__img community-visual__img--compact"
          src={compactSrc}
          alt={alt}
          onError={onError('tablet')}
        />
      )}
    </div>
  );
}

export default function CommunityPreviewSection({ sections = {}, accent = 'orange' }) {
  const isTeal = accent === 'teal';
  const accentText = isTeal ? 'text-teal-600' : 'text-primary-600';
  const bar = isTeal ? 'bg-teal-500' : 'bg-primary-500';

  const socials = useMemo(() => visibleSocials(sections.community_socials), [sections.community_socials]);
  const desktopUrl = sanitizeCmsImageUrl(communityImageValue(sections.community_image_desktop));
  const tabletUrl = sanitizeCmsImageUrl(communityImageValue(sections.community_image_tablet));
  const hasVisual = Boolean(desktopUrl || tabletUrl);

  if (!socials.length && !hasVisual) return null;

  const heading = sections.community_heading || 'Join Our Community';
  const highlight = sections.community_highlight || 'Community';
  const intro = sections.community_intro || '';

  return (
    <section
      className={`community-section${hasVisual ? ' community-section--has-visual' : ''}`}
      aria-labelledby="community-heading"
    >
      <div className="community-section__inner">
        <div className="community-section__header">
          <h2 id="community-heading" className="community-section__title">
            <Heading heading={heading} highlight={highlight} accentClass={accentText} />
          </h2>
          {intro && <p className="community-section__intro">{intro}</p>}
        </div>

        {socials.length > 0 && (
          <div className="community-socials">
            {socials.map((item, i) => {
              const meta = platformMeta(item.platform);
              const label = item.label || `Join us on ${meta.label}`;
              return (
                <a
                  key={`${item.platform}-${i}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="community-social-pill"
                  aria-label={`${label} (opens in a new tab)`}
                >
                  <span className="community-social-pill__icon" aria-hidden>
                    <FaIcon icon={meta.icon} brand={meta.brand} />
                  </span>
                  <span className="community-social-pill__label">{label}</span>
                  <FaIcon icon="fa-arrow-up-right-from-square" className="community-social-pill__ext" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {hasVisual && (
        <CommunityVisual
          key={`${desktopUrl}|${tabletUrl}`}
          desktopUrl={desktopUrl}
          tabletUrl={tabletUrl}
          alt={heading}
        />
      )}

      <div className={`community-section__rule ${bar}`} aria-hidden />
    </section>
  );
}
