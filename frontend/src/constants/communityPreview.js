/** Shared Social Media & Portal Preview CMS shape for PhysioAtHome and TeleRehab. */

export const COMMUNITY_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'fa-instagram', brand: true },
  { id: 'facebook', label: 'Facebook', icon: 'fa-facebook', brand: true },
  { id: 'linkedin', label: 'LinkedIn', icon: 'fa-linkedin', brand: true },
  { id: 'youtube', label: 'YouTube', icon: 'fa-youtube', brand: true },
  { id: 'x', label: 'X', icon: 'fa-x-twitter', brand: true },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'fa-whatsapp', brand: true },
  { id: 'telegram', label: 'Telegram', icon: 'fa-telegram', brand: true },
  { id: 'website', label: 'Website', icon: 'fa-globe', brand: false },
  { id: 'other', label: 'Other', icon: 'fa-share-nodes', brand: false },
];

export function defaultCommunitySocials() {
  return [
    { platform: 'instagram', label: 'Join us on Instagram', url: '', enabled: '1' },
    { platform: 'facebook', label: 'Join us on Facebook', url: '', enabled: '1' },
    { platform: 'linkedin', label: 'Join us on LinkedIn', url: '', enabled: '1' },
    { platform: 'youtube', label: 'Join us on YouTube', url: '', enabled: '1' },
  ];
}

export const HOME_COMMUNITY_DEFAULTS = {
  community_heading: 'Join Our Community',
  community_highlight: 'Community',
  community_intro:
    'Follow PhysioAtHome for recovery tips, patient stories, and updates from our home-visit care team.',
  community_socials: defaultCommunitySocials(),
  community_portal_heading: 'PhysioAtHome Portal',
  community_portal_intro:
    'A look inside the tools your physiotherapist uses to plan, track, and personalise every home session.',
  community_screenshots: [],
};

export const TELE_COMMUNITY_DEFAULTS = {
  community_heading: 'Join Our Community',
  community_highlight: 'Community',
  community_intro:
    'Follow TeleRehab for guided exercise clips, recovery insights, and updates from our online care team.',
  community_socials: defaultCommunitySocials(),
  community_portal_heading: 'TeleRehab Portal',
  community_portal_intro:
    'See how online consultations, exercise plans, and progress tracking come together in one place.',
  community_screenshots: [],
};

export function isFlagOn(value) {
  return !(
    value === false ||
    value === 0 ||
    value === '0' ||
    value === '' ||
    value === 'false' ||
    value === 'off' ||
    value == null
  );
}

export function platformMeta(id) {
  return COMMUNITY_PLATFORMS.find((p) => p.id === id) || COMMUNITY_PLATFORMS.find((p) => p.id === 'other');
}

export function visibleSocials(list = []) {
  return (Array.isArray(list) ? list : []).filter(
    (item) => isFlagOn(item?.enabled) && String(item?.url || '').trim()
  );
}

export function visibleScreenshots(list = []) {
  return (Array.isArray(list) ? list : []).filter(
    (item) => isFlagOn(item?.enabled) && String(item?.url || '').trim()
  );
}

export function blankSocial() {
  return { platform: 'instagram', label: 'Join us on Instagram', url: '', enabled: '1' };
}

export function blankScreenshot() {
  return { url: '', title: '', alt: '', enabled: '1' };
}
