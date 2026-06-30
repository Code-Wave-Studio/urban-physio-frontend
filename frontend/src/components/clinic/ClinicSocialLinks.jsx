import FaIcon from '../FaIcon';
import { SOCIAL_FIELDS, isValidHttpUrl, resolveClinicSocialLinks } from '../../utils/clinicProfileUtils';
import { whatsappChatUrl, whatsappDigits } from '../../utils/whatsapp';

function socialHref(key, value) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (isValidHttpUrl(v)) return v;
  if (key === 'whatsapp' && whatsappDigits(v)) return whatsappChatUrl(v);
  return null;
}

/**
 * Social profile icons for a clinic — Facebook, Instagram, X, LinkedIn, YouTube, WhatsApp.
 */
export default function ClinicSocialLinks({ clinic, className = '' }) {
  const social = resolveClinicSocialLinks(clinic);
  const active = SOCIAL_FIELDS.map((field) => {
    const href = socialHref(field.key, social[field.key]);
    return href ? { ...field, href } : null;
  }).filter(Boolean);

  if (!active.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="list" aria-label="Social media">
      {active.map(({ key, icon, brand, label, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          role="listitem"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors"
          aria-label={label}
          title={label}
        >
          <FaIcon icon={icon} brand={brand} className="text-sm" />
        </a>
      ))}
    </div>
  );
}
