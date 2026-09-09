/** Shared “Trusted by / patients from leading organisations” copy fallbacks. Logos come from the API. */

export const ORG_LOGOS_MAX_ITEMS = 40;

export const ORG_LOGOS_COPY = {
  heading: '12K+ patients from renowned organisations worldwide, made pain-free',
  heading_highlight: '12K+',
};

export function blankOrgLogo(order = 0) {
  return {
    id: `org_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    image: '',
    image_alt: '',
    is_enabled: true,
    sort_order: order,
  };
}

export function isOrgLogoComplete(item) {
  return Boolean(item?.name?.trim() || item?.image?.trim());
}

export function orgHeadingParts(heading, highlight) {
  const text = heading || ORG_LOGOS_COPY.heading;
  const mark = highlight || '';
  if (mark && text.includes(mark)) {
    const [before, ...rest] = text.split(mark);
    return { before, mark, after: rest.join(mark) };
  }
  return { before: text, mark: '', after: '' };
}
