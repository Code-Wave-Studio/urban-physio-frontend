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

/** First 5 enabled screenshots fill the live stacked gallery. */
export const GALLERY_VISIBLE_COUNT = 5;

export const SCREENSHOT_SLOTS = [
  { key: 'far-left', label: 'Far Left', short: '1 · Far Left', hint: 'Far-left screenshot on desktop.' },
  { key: 'left', label: 'Left', short: '2 · Left', hint: 'Left of the focal screenshot.' },
  { key: 'center', label: 'Center', short: '3 · Center', hint: 'Main focal screenshot.' },
  { key: 'right', label: 'Right', short: '4 · Right', hint: 'Right of the focal screenshot.' },
  { key: 'far-right', label: 'Far Right', short: '5 · Far Right', hint: 'Far-right screenshot on desktop.' },
];

export function galleryScreenshots(list = []) {
  return visibleScreenshots(list).slice(0, GALLERY_VISIBLE_COUNT);
}

export const MOBILE_GALLERY_VISIBLE_COUNT = 3;

export function galleryCenterIndex(count) {
  const n = Number(count) || 0;
  if (n <= 1) return 0;
  if (n >= GALLERY_VISIBLE_COUNT) return 2;
  return Math.floor((n - 1) / 2);
}

export function stackRoles(count) {
  const n = Math.min(Math.max(0, Number(count) || 0), GALLERY_VISIBLE_COUNT);
  if (n <= 1) return ['center'];
  if (n === 2) return ['left', 'right'];
  if (n === 3) return ['left', 'center', 'right'];
  if (n === 4) return ['far-left', 'left', 'center', 'right'];
  return ['far-left', 'left', 'center', 'right', 'far-right'];
}

/** Inner 3 screenshots for the mobile fan (skips outermost desktop phones). */
export function mobileGalleryIndices(count) {
  const n = Math.min(Math.max(0, Number(count) || 0), GALLERY_VISIBLE_COUNT);
  if (n <= MOBILE_GALLERY_VISIBLE_COUNT) {
    return Array.from({ length: n }, (_, i) => i);
  }
  const roles = stackRoles(n);
  const centerIdx = roles.indexOf('center');
  if (centerIdx < 0) {
    return Array.from({ length: MOBILE_GALLERY_VISIBLE_COUNT }, (_, i) => i);
  }
  const start = Math.max(0, centerIdx - 1);
  const end = Math.min(n, start + MOBILE_GALLERY_VISIBLE_COUNT);
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export function shortestOffset(index, active, total) {
  if (total <= 1) return 0;
  let delta = index - active;
  const half = Math.floor(total / 2);
  if (delta > half) delta -= total;
  if (delta < -half) delta += total;
  return delta;
}

export function coverflowRole(offset) {
  if (offset === 0) return 'center';
  if (offset === -1) return 'left';
  if (offset === 1) return 'right';
  if (offset === -2) return 'far-left';
  if (offset === 2) return 'far-right';
  return 'hidden';
}

export function screenshotSlotMeta(shots = [], index) {
  const list = Array.isArray(shots) ? shots : [];
  const row = list[index];
  const isLive = isFlagOn(row?.enabled) && String(row?.url || '').trim();
  if (!isLive) {
    return {
      key: 'hidden',
      label: 'Hidden',
      short: 'Not shown',
      hint: 'Enable this screenshot and add an image to include it in the live gallery.',
      visibleIndex: -1,
    };
  }
  let visibleIndex = 0;
  for (let i = 0; i < index; i += 1) {
    if (isFlagOn(list[i]?.enabled) && String(list[i]?.url || '').trim()) {
      visibleIndex += 1;
    }
  }
  if (visibleIndex < SCREENSHOT_SLOTS.length) {
    return { ...SCREENSHOT_SLOTS[visibleIndex], visibleIndex };
  }
  return {
    key: 'extra',
    label: `Lightbox extra ${visibleIndex - 4}`,
    short: `Extra ${visibleIndex - 4}`,
    hint: 'Available in the lightbox after the main 5 gallery screenshots.',
    visibleIndex,
  };
}

export function blankSocial() {
  return { platform: 'instagram', label: 'Join us on Instagram', url: '', enabled: '1' };
}

export function blankScreenshot() {
  return { url: '', title: '', alt: '', enabled: '1' };
}
