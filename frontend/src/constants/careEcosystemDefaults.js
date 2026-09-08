import { isFlagOn } from './communityPreview';

function item(id, number, title, description, icon, imageAlt, sortOrder) {
  return {
    id,
    number,
    title,
    description,
    icon,
    image: '',
    image_alt: imageAlt,
    enabled: '1',
    sort_order: sortOrder,
  };
}

export const HOME_ECOSYSTEM_DEFAULTS = {
  ecosystem_enabled: '1',
  ecosystem_label: 'The program',
  ecosystem_heading: 'A Care Ecosystem designed for you',
  ecosystem_highlight: 'Care Ecosystem',
  ecosystem_intro:
    'Your home visits, personal physiotherapist, daily support and progress tracking stay connected — so recovery never depends on a single session.',
  ecosystem_items: [
    item(
      'eco-home-1',
      '01',
      'Tailored Programs',
      'Clinical plans built around your home, your condition, and the way you actually move through the day — not a generic clinic template.',
      'fa-clipboard-list',
      'Personalised home physiotherapy programme shown in the patient app',
      1
    ),
    item(
      'eco-home-2',
      '02',
      'Personal Physiotherapist',
      'The same hospital-trained clinician across visits, notes and follow-ups — so you are never handed to a rotating roster.',
      'fa-user-doctor',
      'Hospital-trained physiotherapist providing a dedicated home visit',
      2
    ),
    item(
      'eco-home-3',
      '03',
      'WhatsApp Support',
      'Quick guidance between sessions when something flares or a home exercise needs clarifying — without waiting for the next visit.',
      'fa-whatsapp',
      'Patient messaging a physiotherapist for support between home sessions',
      3
    ),
    item(
      'eco-home-4',
      '04',
      'Smart Goal Tracking',
      'Milestones, prescribed exercises and session notes live on the TUP app so you can see progress, not just feel it.',
      'fa-chart-line',
      'Recovery goals and exercise progress tracked in the physiotherapy app',
      4
    ),
  ],
};

export const TELE_ECOSYSTEM_DEFAULTS = {
  ecosystem_enabled: '1',
  ecosystem_label: 'The program',
  ecosystem_heading: 'A Care Ecosystem designed for remote recovery',
  ecosystem_highlight: 'Care Ecosystem',
  ecosystem_intro:
    'Live video care, a dedicated clinician, WhatsApp support and digital goal tracking stay in one place — so online rehab stays structured between sessions.',
  ecosystem_items: [
    item(
      'eco-tele-1',
      '01',
      'Tailored Remote Programs',
      'A personalised online plan based on your movement, history and goals — with live form coaching and a digital exercise prescription after every call.',
      'fa-laptop-medical',
      'Personalised TeleRehab exercise programme in the patient portal',
      1
    ),
    item(
      'eco-tele-2',
      '02',
      'Dedicated Online Physiotherapist',
      'You keep the same qualified clinician for video sessions, notes and plan updates — continuity that remote care often loses.',
      'fa-video',
      'Physiotherapist in a live TeleRehab video consultation',
      2
    ),
    item(
      'eco-tele-3',
      '03',
      'WhatsApp Support',
      'Ask about an exercise, a flare-up or scheduling between video visits — so remote rehab does not go quiet for a week.',
      'fa-whatsapp',
      'WhatsApp support between TeleRehab physiotherapy sessions',
      3
    ),
    item(
      'eco-tele-4',
      '04',
      'Smart Goal Tracking',
      'Session notes, exercise completion and recovery milestones stay visible to you and your physiotherapist between online visits.',
      'fa-chart-pie',
      'TeleRehab goal tracking and recovery metrics in the patient app',
      4
    ),
  ],
};

export function blankEcosystemItem(index = 0) {
  const n = index + 1;
  return {
    id: `eco-${n}`,
    number: String(n).padStart(2, '0'),
    title: '',
    description: '',
    icon: 'fa-circle-check',
    image: '',
    image_alt: '',
    enabled: '1',
    sort_order: n,
  };
}

export function visibleEcosystemItems(list = []) {
  const rows = Array.isArray(list) ? [...list] : [];
  rows.sort((a, b) => {
    const ao = Number(a?.sort_order);
    const bo = Number(b?.sort_order);
    if (Number.isFinite(ao) && Number.isFinite(bo) && ao !== bo) return ao - bo;
    return 0;
  });
  return rows.filter(
    (item) => item && isFlagOn(item.enabled ?? '1') && String(item.title || '').trim()
  );
}

export function isEcosystemEnabled(sections = {}) {
  return isFlagOn(sections.ecosystem_enabled ?? '1');
}

export function ecosystemImageAlt(item) {
  const custom = String(item?.image_alt || '').trim();
  if (custom) return custom;
  const title = String(item?.title || '').trim();
  return title ? `${title} — care ecosystem visual` : 'Care ecosystem visual';
}
