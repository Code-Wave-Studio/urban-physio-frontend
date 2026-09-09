/** Shared “Meet Our Physiotherapists” copy fallbacks. Profiles always come from the API. */

export const PHYSIO_TEAM_MAX_ITEMS = 100;

export const PHYSIO_TEAM_COPY = {
  heading: 'Meet Our Physiotherapists',
  heading_highlight: 'Physiotherapists',
  description:
    'Hospital-trained clinicians who treat movement as medicine — the same dedicated physiotherapist across your plan, notes and follow-ups, whether you book a home visit or TelePhysio.',
  cta_label: 'Talk to Our Squad',
  cta_link: '/book',
};

export function blankPhysio(order = 0) {
  return {
    id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    qualification: '',
    designation: '',
    experience: '',
    badge: '',
    rating: 5,
    specialties: [],
    description: '',
    approach_heading: 'My approach is rooted in three principles:',
    approach: [
      { title: '', body: '' },
      { title: '', body: '' },
      { title: '', body: '' },
    ],
    image: '',
    carousel_image: '',
    image_alt: '',
    show_in_list: true,
    show_in_carousel: true,
    is_enabled: true,
    sort_order: order,
  };
}

export function isPhysioComplete(item) {
  return Boolean(item?.name?.trim()) && Boolean(
    item?.description?.trim() || item?.qualification?.trim() || item?.image?.trim()
  );
}

export function listProfiles(profiles = []) {
  return profiles.filter((p) => p.show_in_list);
}

export function carouselProfiles(profiles = []) {
  return profiles.filter((p) => p.show_in_carousel);
}

export function headingParts(heading, highlight) {
  const text = heading || PHYSIO_TEAM_COPY.heading;
  const mark = highlight || PHYSIO_TEAM_COPY.heading_highlight;
  if (mark && text.includes(mark)) {
    const [before, ...rest] = text.split(mark);
    return { before, mark, after: rest.join(mark) };
  }
  return { before: text, mark: '', after: '' };
}
