import FaIcon from '../FaIcon';
import { TONE_CLASSES } from '../../constants/portalArchitecture';

/**
 * Primary sidebar navigation — Icon Only Rail.
 * Shows sleek icon badges with floating tooltips on hover.
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
            aria-label={section.label}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className={`primary-nav__icon ${isActive ? tone.chip : ''}`}>
              <FaIcon icon={section.icon} />
            </span>
            <div className="primary-nav__tooltip" role="tooltip">
              {section.label}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
