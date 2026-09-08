import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  platformMeta,
  visibleScreenshots,
  visibleSocials,
} from '../../constants/communityPreview';
import PortalLightbox from './PortalLightbox';

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

function fanStyle(index, total) {
  const mid = (total - 1) / 2;
  const offset = index - mid;
  const rotate = offset * 8;
  const lift = Math.abs(offset) * 18;
  const shift = offset * 78;
  return {
    transform: `translateX(${shift}px) translateY(${lift}px) rotate(${rotate}deg)`,
    zIndex: 20 - Math.abs(Math.round(offset * 10)),
  };
}

export default function CommunityPreviewSection({ sections = {}, accent = 'orange' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const isTeal = accent === 'teal';
  const accentText = isTeal ? 'text-teal-600' : 'text-primary-600';
  const accentSoft = isTeal ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-primary-700';
  const bar = isTeal ? 'bg-teal-500' : 'bg-primary-500';

  const socials = useMemo(() => visibleSocials(sections.community_socials), [sections.community_socials]);
  const shots = useMemo(
    () => visibleScreenshots(sections.community_screenshots),
    [sections.community_screenshots]
  );

  if (!socials.length && !shots.length) return null;

  const heading = sections.community_heading || 'Join Our Community';
  const highlight = sections.community_highlight || 'Community';
  const intro = sections.community_intro || '';
  const portalHeading = sections.community_portal_heading || 'Portal Preview';
  const portalIntro = sections.community_portal_intro || '';
  const useFan = shots.length >= 2 && shots.length <= 5;
  const useCarousel = shots.length > 6;

  const openShot = (i) => setLightboxIndex(i);

  return (
    <section className="community-section" aria-labelledby="community-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-pad">
        <div className="text-center max-w-2xl mx-auto">
          <h2 id="community-heading" className="text-3xl sm:text-4xl md:text-[2.6rem] font-extrabold tracking-tight text-slate-900">
            <Heading heading={heading} highlight={highlight} accentClass={accentText} />
          </h2>
          {intro && (
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">{intro}</p>
          )}
        </div>

        {socials.length > 0 && (
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
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
                  <span className={`community-social-pill__icon ${accentSoft}`} aria-hidden>
                    <FaIcon icon={meta.icon} brand={meta.brand} />
                  </span>
                  <span className="community-social-pill__label">{label}</span>
                  <FaIcon icon="fa-arrow-up-right-from-square" className="community-social-pill__ext" />
                </a>
              );
            })}
          </div>
        )}

        {shots.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-slate-500 mb-2">
                Admin portal
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{portalHeading}</h3>
              {portalIntro && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{portalIntro}</p>
              )}
            </div>

            {useFan && (
              <div className="community-fan hidden lg:flex">
                {shots.map((shot, i) => {
                  const src = resolveMediaUrl(shot.url) || shot.url;
                  const label = shot.title || shot.alt || `Portal screenshot ${i + 1}`;
                  return (
                    <button
                      key={`${shot.url}-fan-${i}`}
                      type="button"
                      className="community-fan-card"
                      style={fanStyle(i, shots.length)}
                      onClick={() => openShot(i)}
                      aria-label={`Open preview: ${label}`}
                    >
                      <span className="community-window-dots" aria-hidden>
                        <i /><i /><i />
                      </span>
                      <img src={src} alt={shot.alt || label} loading="lazy" decoding="async" />
                    </button>
                  );
                })}
              </div>
            )}

            <div
              className={
                useCarousel
                  ? 'community-shot-carousel'
                  : `grid grid-cols-1 sm:grid-cols-2 ${useFan ? 'lg:hidden' : 'lg:grid-cols-3'} gap-4 sm:gap-5`
              }
            >
              {shots.map((shot, i) => {
                const src = resolveMediaUrl(shot.url) || shot.url;
                const label = shot.title || shot.alt || `Portal screenshot ${i + 1}`;
                return (
                  <button
                    key={`${shot.url}-grid-${i}`}
                    type="button"
                    className={`community-shot-card ${useCarousel ? 'community-shot-card--slide' : ''}`}
                    onClick={() => openShot(i)}
                    aria-label={`Open preview: ${label}`}
                  >
                    <span className="community-window-dots" aria-hidden>
                      <i /><i /><i />
                    </span>
                    <span className="community-shot-card__media">
                      <img src={src} alt={shot.alt || label} loading="lazy" decoding="async" />
                    </span>
                    {shot.title && <span className="community-shot-card__label">{shot.title}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className={`community-section__rule ${bar}`} aria-hidden />

      <PortalLightbox
        open={lightboxIndex != null}
        items={shots}
        index={lightboxIndex || 0}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        accent={accent}
      />
    </section>
  );
}
