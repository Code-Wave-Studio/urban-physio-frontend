/**
 * Homepage pain selection — static fallback when API unavailable.
 * Live data: GET /pain-selection (admin: /admin/pain-selection)
 */
export const PAIN_SELECTION_DEFAULT_ID = 'neck';

export const PAIN_POINTS = [
  {
    id: 'neck',
    chipLabel: 'Neck',
    label: 'Neck Pain',
    headline: 'Cervical stiffness, posture & tech-neck relief',
    accordionDescription:
      'Overcome chronic neck pain, strains, radiculopathy, tech-neck and posture-related stiffness with expert-guided rehab.',
    icon: 'fa-head-side-virus',
    highlight: { left: '52%', top: '27%' },
  },
  {
    id: 'shoulder',
    chipLabel: 'Shoulder',
    label: 'Shoulder Pain',
    headline: 'Rotator cuff, impingement & overhead strain',
    accordionDescription:
      'Relief for rotator cuff issues, shoulder impingement, frozen shoulder and overhead sports strain.',
    icon: 'fa-user',
    highlight: { left: '48%', top: '28%' },
  },
  {
    id: 'upper-back',
    chipLabel: 'Upper Back',
    label: 'Upper Back Pain',
    headline: 'Thoracic stiffness, posture fatigue & upper back tightness',
    accordionDescription:
      'Address thoracic stiffness, desk-posture fatigue, upper back tightness and scapular imbalance.',
    icon: 'fa-bone',
    highlight: { left: '42%', top: '36%' },
  },
  {
    id: 'elbow',
    chipLabel: 'Elbow',
    label: 'Elbow Pain',
    headline: 'Tennis elbow, golfer’s elbow & forearm load',
    accordionDescription:
      'Recover from tennis elbow, golfer’s elbow, forearm overload and repetitive grip strain.',
    icon: 'fa-bone',
    highlight: { left: '34%', top: '28%' },
  },
  {
    id: 'lower-back',
    chipLabel: 'Lower Back',
    label: 'Lower Back Pain',
    headline: 'Lumbar stiffness, disc-friendly rehab & core control',
    accordionDescription:
      'Lumbar stiffness, disc-friendly rehabilitation, sciatica flare-ups and core stability programmes.',
    icon: 'fa-bone',
    highlight: { left: '41%', top: '42%' },
  },
  {
    id: 'hip',
    chipLabel: 'Hip',
    label: 'Hip Pain',
    headline: 'Hip flexor tightness, glute weakness & running load',
    accordionDescription:
      'Hip flexor tightness, glute weakness, groin strain and running-related hip overload.',
    icon: 'fa-person-walking',
    highlight: { left: '36%', top: '50%' },
  },
  {
    id: 'hand',
    chipLabel: 'Hand',
    label: 'Hand & Wrist Pain',
    headline: 'Wrist strain, grip pain & repetitive-use recovery',
    accordionDescription:
      'Wrist strain, carpal tunnel symptoms, grip pain and repetitive-use recovery plans.',
    icon: 'fa-hand',
    highlight: { left: '25%', top: '40%' },
  },
  {
    id: 'knee',
    chipLabel: 'Knee',
    label: 'Knee Pain',
    headline: 'Patellofemoral pain, meniscus & return-to-run',
    accordionDescription:
      'Patellofemoral pain, ACL & meniscus rehab, arthritis management and return-to-run protocols.',
    icon: 'fa-person-walking',
    highlight: { left: '62%', top: '58%' },
  },
  {
    id: 'ankle',
    chipLabel: 'Ankle',
    label: 'Ankle Pain',
    headline: 'Sprains, instability & return-to-sport ankle rehab',
    accordionDescription:
      'Ankle sprains, chronic instability, Achilles load and graded return-to-sport rehabilitation.',
    icon: 'fa-shoe-prints',
    highlight: { left: '19%', top: '77%' },
  },
];

/** Map API/DB pain-selection row → UI shape. */
export function mapApiPainPoint(row) {
  if (!row) return null;
  const id = row.id ?? row.slug;
  return {
    id,
    chipLabel: row.chipLabel ?? row.chip_label ?? id,
    label: row.label ?? row.chipLabel ?? id,
    headline: row.headline ?? '',
    accordionDescription: row.accordionDescription ?? row.accordion_description ?? row.headline ?? '',
    icon: row.icon || 'fa-bone',
    highlight: row.highlight ?? {
      left: row.highlight_left || '50%',
      top: row.highlight_top || '50%',
    },
    treatment_id: row.treatment_id ?? null,
    treatment_slug: row.treatment_slug ?? null,
    treatment_title: row.treatment_title ?? null,
  };
}

export function getPainPointById(id, points = PAIN_POINTS) {
  return points.find((p) => p.id === id) || points[0] || PAIN_POINTS[0];
}

export function getBodyHighlightSpots(pain) {
  if (!pain?.highlight) return [];
  return Array.isArray(pain.highlight) ? pain.highlight : [pain.highlight];
}

export function resolveTreatmentLink(pain) {
  if (pain?.treatment_slug) {
    return `/treatments/${pain.treatment_slug}`;
  }
  return '/treatments';
}
