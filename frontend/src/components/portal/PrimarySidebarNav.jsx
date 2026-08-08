import FaIcon from '../FaIcon';
import { TONE_CLASSES } from '../../constants/portalArchitecture';

/**
 * Primary sidebar navigation — displays major portal modules.
 * In expanded mode: shows flex-row icon + full label with multi-line wrapping (no awkward truncation).
 * In collapsed mode: shows centered icons with sleek tooltips on hover.
 */
export default function PrimarySidebarNav({
  sections = [],
  activeSectionId,
  onSectionClick,
  accent = 'primary',
  collapsed = false,
}) {
  return (
    <nav className="primary-nav__sections" aria-label="Module navigation">
      {sections.map((section) => {
        const isActive = activeSectionId === section.id;
        const tone = TONE_CLASSES[section.tone] || TONE_CLASSES.slate;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionClick(section.id)}
            className={`primary-nav__item ${isActive ? 'primary-nav__item--active' : ''} ${
              collapsed ? 'primary-nav__item--collapsed' : ''
            }`}
            title={collapsed ? section.label : undefined}
            aria-label={section.label}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className={`primary-nav__icon ${isActive ? tone.chip : ''}`}>
              <FaIcon icon={section.icon} />
            </span>

            {!collapsed ? (
              <span className="primary-nav__label">{section.label}</span>
            ) : (
              <div className="primary-nav__tooltip" role="tooltip">
                {section.label}
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}
