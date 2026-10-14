import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { accessiblePrivacyDetail, safeBadgeHref, visiblePrivacyBadges } from '../../utils/privacyBadges';

const PILL = {
  hero:
    'inline-flex items-center gap-1.5 max-w-full min-h-9 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-xs sm:text-sm font-semibold leading-snug text-white text-left whitespace-normal hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
  card:
    'inline-flex items-center gap-1.5 max-w-full min-h-8 rounded-full border border-logo-200 bg-logo-50 px-2.5 py-1 text-[11px] sm:text-xs font-semibold leading-snug text-logo-800 text-left whitespace-normal hover:bg-logo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-600',
};

/**
 * Privacy and security notes. Renders nothing when no approved badge is configured.
 * Copy is a platform practice, not a certification of an individual exercise.
 */
export default function PrivacyClaimBadges({ badges = [], variant = 'card', className = '', linked = true }) {
  const items = visiblePrivacyBadges(badges);
  if (!items.length) return null;

  const pill = PILL[variant] || PILL.card;

  return (
    <ul
      className={`flex flex-wrap items-center gap-2 list-none m-0 p-0 ${className}`}
      aria-label="Privacy and security notes"
      onClick={(event) => event.stopPropagation()}
    >
      {items.map((badge) => {
        const label = badge.label.trim();
        const detail = accessiblePrivacyDetail(badge.description);
        const href = linked ? safeBadgeHref(badge.href) : '';
        const body = (
          <>
            <FaIcon icon={badge.icon || 'fa-lock'} className="shrink-0 text-[11px]" />
            <span className="min-w-0 break-words">{label}</span>
            <span className="sr-only">. {detail}</span>
          </>
        );
        return (
          <li key={badge.id || label} className="max-w-full min-w-0">
            {href ? (
              <Link to={href} className={pill} title={detail}>
                {body}
              </Link>
            ) : (
              <span className={pill} title={detail}>
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
