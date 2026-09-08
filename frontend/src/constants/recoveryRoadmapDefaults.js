import { isFlagOn } from './communityPreview';

const HOME_VISIT_BOOK_PATH = '/book?type=home_visit&mode=home-visit';
const TELEPHYSIO_BOOK_PATH = '/book?type=online&mode=telephysio';

/** Fallback photography when a phase has no CMS image. */
export const ROADMAP_FALLBACK_IMAGES = {
  home: [
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80',
  ],
  tele: [
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
  ],
};

function spec(icon, title, description) {
  return { icon, title, description, enabled: '1' };
}

function phase(id, number, title, subtitle, description, imageAlt, specs) {
  return {
    id,
    number,
    title,
    subtitle,
    description,
    image: '',
    image_alt: imageAlt,
    enabled: '1',
    specs,
  };
}

export const HOME_ROADMAP_DEFAULTS = {
  roadmap_enabled: '1',
  roadmap_label: 'Our approach',
  roadmap_heading: 'The PhysioAtHome Recovery Roadmap',
  roadmap_intro:
    'Four structured phases take you from the first home assessment to confident, independent movement — delivered in your living space, tracked on the app, and adjusted as you progress.',
  roadmap_cta_label: 'Book a Home Session',
  roadmap_cta_link: HOME_VISIT_BOOK_PATH,
  roadmap_phases: [
    phase(
      'phase-1',
      'Phase 1',
      'Initial Assessment & Pain Relief',
      'First visit',
      'Your physiotherapist arrives with a hospital-grade assessment, identifies what is driving your pain, and starts relief in the rooms you actually live in.',
      'Hospital-trained physiotherapist assessing a patient during a home visit',
      [
        spec(
          'fa-stethoscope',
          'In-home clinical assessment',
          'A structured evaluation of pain, range, strength and function using your furniture, floors and daily routines as the clinic.',
        ),
        spec(
          'fa-shield-halved',
          'Pain and inflammation control',
          'Hands-on techniques and pacing advice settle swelling, protect the affected area, and make the next steps possible.',
        ),
        spec(
          'fa-house-medical',
          'Safety and environment check',
          'We note stairs, bed height, bathroom access and fall risks so treatment fits your home from day one.',
        ),
      ],
    ),
    phase(
      'phase-2',
      'Phase 2',
      'Mobility & Movement Restoration',
      'Getting moving',
      'Once pain is settling, we restore range and re-activate the muscles around the injury so stiffness does not set in between visits.',
      'Physiotherapist guiding gentle mobility exercises in a patient’s home',
      [
        spec(
          'fa-arrows-left-right',
          'Range of motion restoration',
          'Gentle, graded mobility work in your living space so dressing, sitting and walking start to feel easier.',
        ),
        spec(
          'fa-bolt',
          'Muscle activation',
          'Targeted activation stops neighbouring muscles from switching off while the injured area is still protected.',
        ),
        spec(
          'fa-person-walking',
          'Daily-task coaching',
          'Your physio rehearses sit-to-stand, reaching and short walks in the rooms you use — with form you can repeat alone.',
        ),
      ],
    ),
    phase(
      'phase-3',
      'Phase 3',
      'Strength & Functional Recovery',
      'Building capacity',
      'Load increases in a controlled way. Strength, balance and confidence are rebuilt around the tasks that matter in your home and work life.',
      'Patient performing supervised strengthening exercises during a home physiotherapy session',
      [
        spec(
          'fa-dumbbell',
          'Progressive home strengthening',
          'Resistance and bodyweight work prescribed after each session and progressed on the TUP app.',
        ),
        spec(
          'fa-stairs',
          'Functional task training',
          'Stairs, carrying, kneeling and work-specific patterns practised where you actually perform them.',
        ),
        spec(
          'fa-person-rays',
          'Balance and confidence',
          'Fall-risk and stability drills on your own flooring so independence feels safe, not rushed.',
        ),
      ],
    ),
    phase(
      'phase-4',
      'Phase 4',
      'Independent Recovery & Long-Term Wellness',
      'Staying well',
      'You leave with a clear self-management plan, optional maintenance visits, and the option to switch to clinic or video without changing your physiotherapist.',
      'Person moving independently at home after completing a physiotherapy recovery plan',
      [
        spec(
          'fa-clipboard-check',
          'Personalised self-management',
          'A home programme you can follow independently, with clear signs of when to progress or ease off.',
        ),
        spec(
          'fa-heart-pulse',
          'Relapse prevention',
          'Education on triggers, pacing and early warning signs so flare-ups are managed before they become setbacks.',
        ),
        spec(
          'fa-arrows-rotate',
          'Continuity of care',
          'Keep the same clinician for maintenance visits, clinic sessions or video check-ins as your life changes.',
        ),
      ],
    ),
  ],
};

export const TELE_ROADMAP_DEFAULTS = {
  roadmap_enabled: '1',
  roadmap_label: 'Our approach',
  roadmap_heading: 'The TeleRehab Recovery Roadmap',
  roadmap_intro:
    'A four-phase virtual journey from remote assessment to independent exercise management — live video guidance, a digital prescription, and recovery tracking you can see between sessions.',
  roadmap_cta_label: 'Book a TelePhysio Session',
  roadmap_cta_link: TELEPHYSIO_BOOK_PATH,
  roadmap_phases: [
    phase(
      'phase-1',
      'Phase 1',
      'Remote Assessment & Care Planning',
      'Online screening',
      'Your first secure video session maps symptoms, movement limits and history, then sets a clinically appropriate online plan — or an honest recommendation for in-person care.',
      'Physiotherapist conducting a live video assessment with a patient at home',
      [
        spec(
          'fa-video',
          'Live video clinical screening',
          'Guided movement tests and posture review over encrypted video so your physiotherapist can see how you actually move.',
        ),
        spec(
          'fa-file-medical',
          'Digital history and reports',
          'Share prior notes, scans and medications before or during the consult for a more precise plan.',
        ),
        spec(
          'fa-list-check',
          'Personalised remote care plan',
          'Goals, precautions and a first-week exercise outline stored in your patient portal.',
        ),
      ],
    ),
    phase(
      'phase-2',
      'Phase 2',
      'Guided Rehabilitation',
      'Supervised sessions',
      'Live 1-on-1 sessions coach form, dose and pacing. You leave each call with a Home Exercise Programme you can follow between visits.',
      'Patient following a physiotherapist’s live exercise cues during an online session',
      [
        spec(
          'fa-user-doctor',
          'Supervised therapeutic exercise',
          'Real-time cues for technique, breathing and load so remote rehab stays safe and effective.',
        ),
        spec(
          'fa-mobile-screen',
          'Home exercise prescription',
          'Sets, repetitions and rest clearly logged in the app after every session.',
        ),
        spec(
          'fa-gauge-high',
          'Pacing and flare-up education',
          'Learn how to progress without overdoing it when your physiotherapist is not on the call.',
        ),
      ],
    ),
    phase(
      'phase-3',
      'Phase 3',
      'Exercise Progression & Virtual Monitoring',
      'Building on camera',
      'As capacity improves, your programme is loaded and updated. Check-ins review milestones and adjust the plan without clinic travel.',
      'Clinician reviewing recovery progress and exercise data during a virtual follow-up',
      [
        spec(
          'fa-chart-line',
          'Progressive loading',
          'Strength and control drills advance as your thresholds improve, with form still reviewed on video.',
        ),
        spec(
          'fa-chart-pie',
          'Recovery tracking',
          'Session notes, exercise completion and symptom trends stay visible to you and your clinician.',
        ),
        spec(
          'fa-flag-checkered',
          'Milestone reviews',
          'Scheduled follow-ups confirm you are ready for the next stage — or pause if symptoms change.',
        ),
      ],
    ),
    phase(
      'phase-4',
      'Phase 4',
      'Independent Exercise Management',
      'Long-term maintenance',
      'You continue a structured programme independently, with optional virtual reviews and a clear path back to home or clinic care if you need hands-on treatment.',
      'Person completing a self-led home exercise programme after online physiotherapy',
      [
        spec(
          'fa-person-running',
          'Self-led exercise management',
          'A maintenance programme you can run from home, with written progressions and precautions.',
        ),
        spec(
          'fa-calendar-check',
          'Periodic virtual reviews',
          'Short online check-ins keep form honest and the plan current as work, travel or sport demands change.',
        ),
        spec(
          'fa-arrows-rotate',
          'Multi-mode continuity',
          'Switch to a home visit or clinic session anytime while keeping the same physiotherapist and records.',
        ),
      ],
    ),
  ],
};

export function blankRoadmapSpec() {
  return { icon: 'fa-circle-check', title: '', description: '', enabled: '1' };
}

export function blankRoadmapPhase(index = 0) {
  const n = index + 1;
  return {
    id: `phase-${n}`,
    number: `Phase ${n}`,
    title: '',
    subtitle: '',
    description: '',
    image: '',
    image_alt: '',
    enabled: '1',
    specs: [blankRoadmapSpec(), blankRoadmapSpec()],
  };
}

export function visibleRoadmapSpecs(list = []) {
  return (Array.isArray(list) ? list : []).filter(
    (item) => item && isFlagOn(item.enabled ?? '1') && String(item.title || '').trim()
  );
}

export function visibleRoadmapPhases(list = []) {
  return (Array.isArray(list) ? list : []).filter((item) => item && isFlagOn(item.enabled ?? '1'));
}

export function isRoadmapEnabled(sections = {}) {
  return isFlagOn(sections.roadmap_enabled ?? '1');
}

export function roadmapFallbackImage(theme, index) {
  const pack = ROADMAP_FALLBACK_IMAGES[theme] || ROADMAP_FALLBACK_IMAGES.home;
  return pack[index % pack.length];
}
