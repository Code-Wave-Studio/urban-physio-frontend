import { isFlagOn } from './communityPreview';

export const ENROL_VISUALS = [
  { id: 'consult', label: 'Consultation (calendar + phone)' },
  { id: 'allotment', label: 'Specialist allotment' },
  { id: 'analysis', label: 'Assessment call' },
  { id: 'plan', label: 'Plan / clipboard' },
  { id: 'workout', label: 'Workout on phone' },
  { id: 'checkin', label: 'Weekly check-in' },
  { id: 'review', label: 'Progress review' },
];

function step(id, label, title, description, visual, sortOrder, extra = {}) {
  return {
    id,
    label,
    title,
    description,
    visual,
    image: '',
    image_alt: `${title} illustration`,
    in_loop: extra.in_loop || '0',
    enabled: '1',
    sort_order: sortOrder,
  };
}

export const HOME_ENROL_DEFAULTS = {
  enrol_enabled: '1',
  enrol_label: 'HOW TO ENROL',
  enrol_heading: 'Enrollment Made Simple: Your Path to Expert Care',
  enrol_highlight: 'Enrollment Made Simple:',
  enrol_intro: 'We made the steps to pain-free living simple and easy',
  enrol_default_step: 'enrol-home-1',
  enrol_steps: [
    step(
      'enrol-home-1',
      'On Call Consultation',
      'On Call Consultation',
      'Define your pain points, set goals, and build a custom recovery timeline and payment plan with our expert consultant.',
      'consult',
      1
    ),
    step(
      'enrol-home-2',
      'Specialist Allotment',
      'Specialist Allotment',
      'Upon payment, a dedicated physiotherapist is assigned to you and will reach out within 24-48 hours.',
      'allotment',
      2
    ),
    step(
      'enrol-home-3',
      'Root Cause Analysis',
      'Root Cause Analysis : Assessment call',
      'Your physiotherapist will conduct a live assessment to evaluate your condition, medical history, and goals.',
      'analysis',
      3
    ),
    step(
      'enrol-home-4',
      'Plan Delivery',
      'Plan Delivery : Laying the Foundation for Your Recovery',
      'We create a personalised Progress Sheet with clear monthly milestones, and set up your The Urban Physio account for weekly workout delivery.',
      'plan',
      4
    ),
    step(
      'enrol-home-5',
      'Workout Delivery',
      'Workout Delivery : Tailored Plans That Fit Your Life',
      'Receive custom weekly workouts tailored to your phase, habits, and goals, complete with easy-to-follow reference videos.',
      'workout',
      5,
      { in_loop: '1' }
    ),
    step(
      'enrol-home-6',
      'Weekly Check-In',
      'Weekly Check-In : Strategy Meets Support',
      'Connect weekly with your Rehab Specialist to review progress, address hurdles, correct form, and plan the next phase.',
      'checkin',
      6,
      { in_loop: '1' }
    ),
    step(
      'enrol-home-7',
      'Monthly Progress Review',
      'Monthly Progress Review : Measuring What Matters',
      'Every 4 weeks, we assess pain reduction, mobility, and strength to optimize your plan and track progress towards your End Goal.',
      'review',
      7,
      { in_loop: '1' }
    ),
  ],
};

export const TELE_ENROL_DEFAULTS = {
  enrol_enabled: '1',
  enrol_label: 'HOW TO ENROL',
  enrol_heading: 'Enrollment Made Simple: Your Path to Expert Care',
  enrol_highlight: 'Enrollment Made Simple:',
  enrol_intro: 'We made the steps to pain-free living simple and easy',
  enrol_default_step: 'enrol-tele-1',
  enrol_steps: [
    step(
      'enrol-tele-1',
      'Live Rehab Consultation',
      'Live Rehab Consultation',
      'Define your pain points, set goals, and build a custom recovery timeline and payment plan with our expert consultant.',
      'consult',
      1
    ),
    step(
      'enrol-tele-2',
      'Specialist Allotment',
      'Specialist Allotment',
      'Upon payment, a dedicated physiotherapist is assigned to you and will reach out within 24-48 hours.',
      'allotment',
      2
    ),
    step(
      'enrol-tele-3',
      'Root Cause Analysis',
      'Root Cause Analysis : Assessment call',
      'Your physiotherapist will conduct a live virtual assessment to evaluate your condition, medical history, and goals.',
      'analysis',
      3
    ),
    step(
      'enrol-tele-4',
      'Plan Delivery',
      'Plan Delivery : Laying the Foundation for Your Recovery',
      'We create a personalised Progress Sheet with clear monthly milestones, and set up your TelePhysio account for weekly workout delivery.',
      'plan',
      4
    ),
    step(
      'enrol-tele-5',
      'Workout Delivery',
      'Workout Delivery : Tailored Plans That Fit Your Life',
      'Receive custom weekly workouts tailored to your phase, habits, and goals, complete with easy-to-follow reference videos.',
      'workout',
      5,
      { in_loop: '1' }
    ),
    step(
      'enrol-tele-6',
      'Weekly Check-In',
      'Weekly Check-In : Strategy Meets Support',
      'Connect weekly with your Rehab Specialist to review progress, address hurdles, correct form, and plan the next phase.',
      'checkin',
      6,
      { in_loop: '1' }
    ),
    step(
      'enrol-tele-7',
      'Monthly Progress Review',
      'Monthly Progress Review : Measuring What Matters',
      'Every 4 weeks, we assess pain reduction, mobility, and strength to optimize your plan and track progress towards your End Goal.',
      'review',
      7,
      { in_loop: '1' }
    ),
  ],
};

export function blankEnrolStep(index = 0) {
  const n = index + 1;
  return {
    id: `enrol-${Date.now()}-${n}`,
    label: '',
    title: '',
    description: '',
    visual: ENROL_VISUALS[index % ENROL_VISUALS.length].id,
    image: '',
    image_alt: '',
    in_loop: '0',
    enabled: '1',
    sort_order: n,
  };
}

export function visibleEnrolSteps(list = []) {
  const rows = Array.isArray(list) ? [...list] : [];
  rows.sort((a, b) => {
    const ao = Number(a?.sort_order);
    const bo = Number(b?.sort_order);
    if (Number.isFinite(ao) && Number.isFinite(bo) && ao !== bo) return ao - bo;
    return 0;
  });
  return rows.filter(
    (item) =>
      item &&
      isFlagOn(item.enabled ?? '1') &&
      (String(item.label || '').trim() || String(item.title || '').trim())
  );
}

export function isEnrolEnabled(sections = {}) {
  return isFlagOn(sections.enrol_enabled ?? '1');
}

export function enrolImageAlt(item) {
  const custom = String(item?.image_alt || '').trim();
  if (custom) return custom;
  const title = String(item?.title || item?.label || '').trim();
  return title ? `${title} — enrollment step visual` : 'Enrollment step visual';
}

export function defaultEnrolIndex(steps = [], defaultId = '') {
  if (!steps.length) return 0;
  const id = String(defaultId || '').trim();
  if (id) {
    const found = steps.findIndex((s) => String(s.id || '') === id);
    if (found >= 0) return found;
  }
  return 0;
}
