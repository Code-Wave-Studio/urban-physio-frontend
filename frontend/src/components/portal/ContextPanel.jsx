import { Link, useLocation } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { isNavLinkActive, TONE_CLASSES } from '../../constants/portalArchitecture';

const ACTIVE_CLS = {
  primary: 'portal-nav-link--active-primary',
  teal: 'portal-nav-link--active-teal',
  emerald: 'portal-nav-link--active-emerald',
};

/**
 * Context panel navigation — shows items for a single section.
 * Reuses existing portal-nav-link styles for consistency.
 */
export default function ContextPanel({ section, accent = 'primary', onNavigate }) {
  const { pathname } = useLocation();
  const activeCls = ACTIVE_CLS[accent] || ACTIVE_CLS.primary;

  if (!section || !section.items?.length) return null;

  const tone = TONE_CLASSES[section.tone] || TONE_CLASSES.slate;

  return (
    <div>
      <div className="context-panel__header">
        <span className={`context-panel__icon ${tone.chip}`}>
          <FaIcon icon={section.icon} className="text-xs" />
        </span>
        <div className="context-panel__title">
          <span className="context-panel__label">{section.label}</span>
          <span className="context-panel__count">{section.items.length} items</span>
        </div>
      </div>
      <nav className="context-panel__nav" aria-label={`${section.label} navigation`}>
        {section.items.map((link) => {
          if (!link.to) return null;
          const active = isNavLinkActive(pathname, link);
          return (
            <Link
              key={`${link.to}-${link.label}`}
              to={link.to}
              onClick={onNavigate}
              className={`portal-nav-link ${active ? activeCls : ''}`}
            >
              <span className="portal-nav-link-icon">
                <FaIcon icon={link.icon} className="text-sm" />
              </span>
              <span className="truncate flex-1">{link.label}</span>
              {link.notifyKey && (
                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  !
                </span>
              )}
              {active && !link.notifyKey && (
                <FaIcon icon="fa-chevron-right" className="ml-auto text-xs opacity-80 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
