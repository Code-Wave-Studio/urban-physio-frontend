/**
 * Font Awesome icon wrapper
 * @param {string} icon - FA class e.g. "fa-user-doctor" (fa-solid prefix added automatically)
 * @param {string} className - extra Tailwind classes
 * @param {boolean} brand - use fa-brands instead of fa-solid
 */
export default function FaIcon({ icon, className = '', brand = false }) {
  if (!icon || typeof icon !== 'string') {
    return <i className={`fa-solid fa-circle ${className}`} aria-hidden="true" />;
  }
  const prefix = brand ? 'fa-brands' : 'fa-solid';
  const name = icon.startsWith('fa-') ? icon : `fa-${icon}`;
  return <i className={`${prefix} ${name} ${className}`} aria-hidden="true" />;
}
