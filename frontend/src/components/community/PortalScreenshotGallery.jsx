import { resolveMediaUrl } from '../../utils/mediaUrl';
import { stackRoles } from '../../constants/communityPreview';

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
  if (!n) return null;
  const roles = stackRoles(n);

  return (
    <div className="portal-gallery">
      <div className={`portal-stack portal-stack--n${n}`} aria-label="Community screenshots">
        {shots.map((shot, index) => {
          const role = roles[index] || 'center';
          const label = shotLabel(shot, index);
          return (
            <button
              key={`${shot.url}-${index}`}
              type="button"
              className={`portal-stack__card portal-stack__card--${role}`}
              onClick={() => onOpen(index)}
              aria-label={`Open preview: ${label}`}
            >
              <ShotFrame shot={shot} index={index} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
