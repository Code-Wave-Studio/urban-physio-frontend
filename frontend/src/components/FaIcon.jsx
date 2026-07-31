/**
 * Font Awesome icon wrapper
 * @param {string} icon - FA class e.g. "fa-user-doctor" or "fa-solid fa-user"
 * @param {string} className - extra Tailwind classes
 * @param {boolean} brand - use fa-brands instead of fa-solid
 */
export default function FaIcon({ icon, className = '', brand = false }) {
  if (!icon || typeof icon !== 'string') {
    return <i className={`fa-solid fa-circle ${className}`} aria-hidden="true" />;
  }

  const tokens = icon.trim().split(/\s+/).filter(Boolean);
  const hasBrand = brand || tokens.includes('fa-brands');
  const hasSolid = tokens.includes('fa-solid') || tokens.includes('fa-regular') || tokens.includes('fa-light');
  const glyph = tokens.find((t) => t.startsWith('fa-') && !['fa-solid', 'fa-regular', 'fa-light', 'fa-brands'].includes(t));

  const prefix = hasBrand ? 'fa-brands' : hasSolid && tokens.includes('fa-regular') ? 'fa-regular' : 'fa-solid';
  const name = glyph || (icon.startsWith('fa-') ? icon : `fa-${icon}`);

  return <i className={`${prefix} ${name} ${className}`} aria-hidden="true" />;
}
