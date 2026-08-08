import FaIcon from '../FaIcon';
import { TONE_CLASSES } from '../../constants/portalArchitecture';

/**
 * Primary sidebar icon rail — shows one icon per nav section.
 * Desktop only; hidden on mobile via CSS.
 */
export default function PrimarySidebarNav({
  sections = [],
  activeSectionId,
  onSectionClick,
  accent = 'primary',
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
            className={`primary-nav__item ${isActive ? 'primary-nav__item--active' : ''}`}
            title={section.label}
            aria-label={section.label}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className={`primary-nav__icon ${isActive ? tone.chip : ''}`}>
              <FaIcon icon={section.icon} />
            </span>
            <span className="primary-nav__label">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
