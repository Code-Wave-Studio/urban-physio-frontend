import { useCookieConsentOptional } from '../contexts/CookieConsentContext';
import FaIcon from './FaIcon';

export default function FooterCookieSettings() {
  const cookie = useCookieConsentOptional();
  if (!cookie) return null;

  return (
    <button
      type="button"
      onClick={cookie.openPreferences}
      className="text-sm text-primary-200/85 hover:text-white transition inline-flex items-center gap-1.5"
    >
      <FaIcon icon="fa-cookie-bite" className="text-orange-300 text-xs" />
      Cookie settings
    </button>
  );
}
