import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon';
import {
  galleryScreenshots,
  platformMeta,
  visibleScreenshots,
  visibleSocials,
} from '../../constants/communityPreview';
import PortalLightbox from './PortalLightbox';
import PortalScreenshotGallery from './PortalScreenshotGallery';

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

export default function CommunityPreviewSection({ sections = {}, accent = 'orange' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const isTeal = accent === 'teal';
  const accentText = isTeal ? 'text-teal-600' : 'text-primary-600';
  const bar = isTeal ? 'bg-teal-500' : 'bg-primary-500';

  const socials = useMemo(() => visibleSocials(sections.community_socials), [sections.community_socials]);
  const allShots = useMemo(
    () => visibleScreenshots(sections.community_screenshots),
    [sections.community_screenshots]
  );
  const galleryShots = useMemo(
    () => galleryScreenshots(sections.community_screenshots),
    [sections.community_screenshots]
  );

  if (!socials.length && !allShots.length) return null;

  const heading = sections.community_heading || 'Join Our Community';
  const highlight = sections.community_highlight || 'Community';
  const intro = sections.community_intro || '';

  const openShot = (galleryIndex) => setLightboxIndex(galleryIndex);

  return (
    <section className="community-section" aria-labelledby="community-heading">
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

        {galleryShots.length > 0 && (
          <div className={`portal-gallery-wrap ${socials.length ? 'portal-gallery-wrap--after-socials' : ''}`}>
            <PortalScreenshotGallery shots={galleryShots} onOpen={openShot} />
          </div>
        )}
      </div>
      <div className={`community-section__rule ${bar}`} aria-hidden />

      <PortalLightbox
        open={lightboxIndex != null}
        items={allShots}
        index={lightboxIndex || 0}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        accent={accent}
      />
    </section>
  );
}
