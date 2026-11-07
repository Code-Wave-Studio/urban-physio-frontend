/*
 * Homepage hero settings that the Home Hero admin page edits:
 * slider slides, the two buttons, the Google rating and the patient count.
 *
 * Stored as a JSON string under section_images.hero_config in the existing
 * /admin/hero-settings record, so no backend change is needed. Every field
 * falls back to these defaults when missing.
 */
const CMS = 'https://api.theurbanphysio.com/backend/uploads/cms-images/';

export const HERO_CONFIG_KEY = 'hero_config';

export const DEFAULT_HERO_CONFIG = {
  slides: [
    { image: `${CMS}cms-images_1794036101_1177f24d.jpg`, title: 'Physiotherapy near you, at home', link: '/home-physiotherapy' },
    { image: `${CMS}cms-images_1794036101_4e2547d6.jpg`, title: 'Rehab on video, from anywhere', link: '/telephysio' },
    { image: `${CMS}cms-images_1794036102_178db06d.jpg`, title: 'Choose your physiotherapist', link: '/doctors' },
    { image: `${CMS}cms-images_1794036102_f1bd0086.jpg`, title: 'Clinics close to you', link: '/clinics' },
  ],
  primary_button: { label: 'Book now', link: '/book' },
  secondary_button: { label: 'Find a physio', link: '/doctors' },
  rating: { value: '4.8', label: 'Google rating', reviews: '', url: '' },
  patients: { value: '2.5K+', label: 'Happy patients', avatars: ['', '', ''] },
};

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/** Read the stored value (JSON string or object) and fill gaps with defaults. */
export function parseHeroConfig(raw) {
  let c = raw;
  if (typeof raw === 'string') {
    try {
      c = JSON.parse(raw);
    } catch {
      c = {};
    }
  }
  c = obj(c);
  const d = DEFAULT_HERO_CONFIG;
  const slides = Array.isArray(c.slides)
    ? c.slides
        .map((s) => ({ image: s?.image || '', title: s?.title || '', link: s?.link || '' }))
        .filter((s) => s.image)
    : [];
  const avatars = Array.isArray(obj(c.patients).avatars) ? obj(c.patients).avatars : d.patients.avatars;
  return {
    slides: slides.length ? slides : d.slides,
    primary_button: { ...d.primary_button, ...obj(c.primary_button) },
    secondary_button: { ...d.secondary_button, ...obj(c.secondary_button) },
    rating: { ...d.rating, ...obj(c.rating) },
    patients: { ...d.patients, ...obj(c.patients), avatars: [0, 1, 2].map((i) => avatars[i] || '') },
  };
}

export const serializeHeroConfig = (config) => JSON.stringify(config);
