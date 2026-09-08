/**
 * Interactive body-area map CMS shape for PhysioAtHome and TeleRehab.
 * Homepage continues to use GET /pain-selection + painSelectionData.js.
 */

import { isFlagOn } from './communityPreview';
import { PAIN_POINTS } from './painSelectionData';

const HOTSPOTS = Object.fromEntries(
  PAIN_POINTS.map((p) => [p.id, { left: p.highlight.left, top: p.highlight.top, icon: p.icon }])
);

function area(slug, chip, label, headline, description) {
  const spot = HOTSPOTS[slug] || { left: '50%', top: '50%', icon: 'fa-bone' };
  return {
    slug,
    chip_label: chip,
    label,
    headline,
    accordion_description: description,
    highlight_left: spot.left,
    highlight_top: spot.top,
    icon: spot.icon,
    know_more_link: '',
    is_active: '1',
  };
}

export const HOME_PAIN_MAP_DEFAULTS = {
  pain_section_enabled: '1',
  pain_eyebrow: 'PhysioAtHome',
  pain_line1: 'Healing',
  pain_accent1: 'Comes Home.',
  pain_line2: 'Mobility',
  pain_accent2: 'Without the Commute.',
  pain_description:
    'Hospital-trained physiotherapists treat every body region in your living space — select an area to see how a home visit restores movement around the rooms, stairs and routines you use every day.',
  pain_mobile_description: 'Tap a body area to see how a home visit helps that region.',
  pain_image: '',
  pain_know_more_label: 'See home care',
  pain_know_more_link: '/treatments',
  pain_book_label: 'Book Home Visit',
  pain_book_link: '',
  pain_close_link: '/treatments',
  pain_other_label: 'Other regions we visit',
  pain_areas: [
    area(
      'neck',
      'Neck',
      'Neck Pain at Home',
      'Cervical mobility treated in your own chair and bed',
      'A hospital-trained physio visits your home to ease tech-neck, pillow-related stiffness and cervical strain — using the chair and bed you actually sleep and work in.',
    ),
    area(
      'shoulder',
      'Shoulder',
      'Shoulder Pain at Home',
      'Rotator cuff and frozen shoulder care without travel',
      'Hands-on rotator-cuff, impingement and frozen-shoulder care at home, with reach and dressing drills built around your wardrobe, kitchen and daily routine.',
    ),
    area(
      'upper-back',
      'Upper Back',
      'Upper Back Pain at Home',
      'Thoracic stiffness treated where you sit and sleep',
      'Desk-posture fatigue and thoracic tightness are treated in your living space, so relief carries into the sofa, workstation and sleep setup you use every day.',
    ),
    area(
      'elbow',
      'Elbow',
      'Elbow Pain at Home',
      'Tennis and golfer’s elbow rehab around real tasks',
      'Recover from tennis elbow, golfer’s elbow and grip overload with home-based loading that matches how you lift, cook and work at your own counters.',
    ),
    area(
      'lower-back',
      'Lower Back',
      'Lower Back Pain at Home',
      'Lumbar and sciatica care without the commute',
      'Lumbar stiffness, disc-friendly rehab and sciatica flare-ups treated at home — your physio assesses how you sit, stand and move on your own floors.',
    ),
    area(
      'hip',
      'Hip',
      'Hip Pain at Home',
      'Hip and glute rehab on your stairs and floors',
      'Hip flexor tightness, glute weakness and groin strain rehab around your actual stairs, bed height and walking paths for safer daily mobility.',
    ),
    area(
      'hand',
      'Hand',
      'Hand & Wrist Pain at Home',
      'Wrist, grip and carpal-tunnel recovery at home',
      'Wrist strain, carpal-tunnel symptoms and grip pain treated with activity modification and progressive loading using the tools and devices you already have.',
    ),
    area(
      'knee',
      'Knee',
      'Knee Pain at Home',
      'Knee rehab including your own sit-to-stand and stairs',
      'Post-surgical, arthritis and sports knee rehab delivered at home, including sit-to-stand and stair practice on the steps you use every day.',
    ),
    area(
      'ankle',
      'Ankle',
      'Ankle Pain at Home',
      'Sprain and Achilles rehab on your own flooring',
      'Ankle sprains, instability and Achilles load managed with balance work on your own flooring, so you walk confidently around the house again.',
    ),
  ],
};

export const TELE_PAIN_MAP_DEFAULTS = {
  pain_section_enabled: '1',
  pain_eyebrow: 'TeleRehab',
  pain_line1: 'Recover',
  pain_accent1: 'From Anywhere.',
  pain_line2: 'Train',
  pain_accent2: 'With Live Guidance.',
  pain_description:
    'Remote physiotherapy for every body region — live video assessment, supervised exercises and a plan you can follow between online sessions. Select an area to explore virtual rehab.',
  pain_mobile_description: 'Tap a body area to see how online rehab supports it.',
  pain_image: '',
  pain_know_more_label: 'See online care',
  pain_know_more_link: '/treatments',
  pain_book_label: 'Book TelePhysio',
  pain_book_link: '',
  pain_close_link: '/treatments',
  pain_other_label: 'Other regions we guide',
  pain_areas: [
    area(
      'neck',
      'Neck',
      'Neck Pain Online',
      'Live video screening for tech-neck and posture strain',
      'Virtual assessment for tech-neck, posture strain and cervical stiffness, plus guided mobility drills you can follow from your desk or living room.',
    ),
    area(
      'shoulder',
      'Shoulder',
      'Shoulder Pain Online',
      'Remote rotator-cuff coaching with live form cues',
      'Online rotator-cuff and overhead-mobility coaching with real-time form correction during secure video sessions and a home exercise plan between visits.',
    ),
    area(
      'upper-back',
      'Upper Back',
      'Upper Back Pain Online',
      'Virtual thoracic mobility for desk-bound stiffness',
      'Remote thoracic mobility and scapular-control work for desk-bound tightness — ideal for follow-up rehab you can do between meetings.',
    ),
    area(
      'elbow',
      'Elbow',
      'Elbow Pain Online',
      'Supervised tennis and golfer’s elbow loading',
      'Guided tennis and golfer’s elbow loading programmes supervised over video, with grip and forearm progressions you can repeat between sessions.',
    ),
    area(
      'lower-back',
      'Lower Back',
      'Lower Back Pain Online',
      'Online lumbar rehab and paced movement coaching',
      'Virtual lumbar rehab: movement screening, pacing advice and core-control drills you can follow from home, with clinician check-ins as you progress.',
    ),
    area(
      'hip',
      'Hip',
      'Hip Pain Online',
      'Remote hip mobility and glute activation plans',
      'Live-cued hip mobility and glute activation plans that keep form safe on camera, then continue as a structured programme between online visits.',
    ),
    area(
      'hand',
      'Hand',
      'Hand & Wrist Pain Online',
      'Video-guided wrist, grip and ergonomic rehab',
      'Video-guided wrist and grip rehab with keyboard and phone ergonomics — practical for remote workers who need recovery without clinic travel.',
    ),
    area(
      'knee',
      'Knee',
      'Knee Pain Online',
      'Structured online knee strength and return-to-walk',
      'Online knee rehab covering range, strength and return-to-walk progressions, with weekly video check-ins to advance your programme safely.',
    ),
    area(
      'ankle',
      'Ankle',
      'Ankle Pain Online',
      'Virtual sprain and Achilles loading with balance drills',
      'Remote sprain and Achilles loading plans with balance drills you can follow live or repeat from your exercise prescription between sessions.',
    ),
  ],
};

export function blankPainArea() {
  return {
    slug: '',
    chip_label: '',
    label: '',
    headline: '',
    accordion_description: '',
    highlight_left: '50%',
    highlight_top: '50%',
    icon: 'fa-bone',
    know_more_link: '',
    is_active: '1',
  };
}

export function mapCmsPainArea(row) {
  if (!row || typeof row !== 'object') return null;
  const id = String(row.slug || row.id || row.chip_label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!id) return null;
  return {
    id,
    chipLabel: row.chip_label || row.chipLabel || id,
    label: row.label || row.chip_label || id,
    headline: row.headline || '',
    accordionDescription: row.accordion_description || row.accordionDescription || row.headline || '',
    icon: row.icon || 'fa-bone',
    highlight: {
      left: row.highlight_left || row.highlight?.left || '50%',
      top: row.highlight_top || row.highlight?.top || '50%',
    },
    knowMoreLink: row.know_more_link || row.knowMoreLink || '',
    treatment_slug: row.treatment_slug || null,
    isActive: isFlagOn(row.is_active ?? row.enabled ?? '1'),
  };
}

export function visiblePainAreas(list = []) {
  return (Array.isArray(list) ? list : []).map(mapCmsPainArea).filter((item) => item && item.isActive);
}

export function isPainMapEnabled(sections = {}) {
  return isFlagOn(sections.pain_section_enabled ?? '1');
}

/**
 * Props for PainSelectionSection from PhysioAtHome / TeleRehab CMS sections.
 * copyDefaults prevent homepage “What we treat” copy from leaking when a field is missing.
 */
export function painMapSectionProps(sections = {}, extras = {}) {
  const s = { ...(extras.copyDefaults || {}), ...sections };
  const knowMoreFallback = s.pain_know_more_link || '/treatments';
  return {
    accent: extras.accent || 'orange',
    className: extras.className || '',
    eyebrow: s.pain_eyebrow,
    line1: s.pain_line1,
    accent1: s.pain_accent1,
    line2: s.pain_line2,
    accent2: s.pain_accent2,
    description: s.pain_description,
    mobileDescription: s.pain_mobile_description,
    otherAreasLabel: s.pain_other_label,
    knowMoreLabel: s.pain_know_more_label,
    bookLabel: s.pain_book_label,
    closeHref: s.pain_close_link || '/treatments',
    figureImage: s.pain_image || '',
    painPoints: extras.painPoints ?? visiblePainAreas(s.pain_areas),
    headingId: extras.headingId || 'pain-selection-heading',
    buildBookUrl: extras.buildBookUrl,
    resolveKnowMore: extras.resolveKnowMore || ((area) => area?.knowMoreLink || knowMoreFallback),
  };
}
