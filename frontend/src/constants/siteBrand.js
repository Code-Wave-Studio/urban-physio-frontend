/** Single site logo — frontend/public/logo.png */
export const SITE_LOGO_FILE = 'logo.png';

export function siteLogoUrl(baseUrl = import.meta.env.BASE_URL ?? '/') {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}${SITE_LOGO_FILE}`;
}

export const SITE_LOGO_SRC = siteLogoUrl();
