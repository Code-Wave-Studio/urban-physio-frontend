/** Home page section images — admin can upload/remove; sizes shown in admin panel. */
export const HOME_SECTION_IMAGE_FIELDS = [
  {
    key: 'hero',
    label: 'Hero banner image',
    hint: 'Main image beside the search bar on the home page.',
    recommendedSize: '1200 × 800 px',
    aspect: '3:2 landscape',
    icon: 'fa-image',
    accent: 'orange',
  },
  {
    key: 'online_consult',
    label: 'Online consultation card',
    hint: '“Choose How You Want to Receive Care” — first card.',
    recommendedSize: '800 × 400 px',
    aspect: '2:1 landscape',
    icon: 'fa-video',
    accent: 'violet',
  },
  {
    key: 'clinic_visit',
    label: 'Clinic visit card',
    hint: 'Second service card on the home page.',
    recommendedSize: '800 × 400 px',
    aspect: '2:1 landscape',
    icon: 'fa-hospital',
    accent: 'violet',
  },
  {
    key: 'home_visit',
    label: 'Home visit card',
    hint: 'Third service card on the home page.',
    recommendedSize: '800 × 400 px',
    aspect: '2:1 landscape',
    icon: 'fa-house-medical',
    accent: 'violet',
  },
  {
    key: 'pain_selection',
    label: 'Pain map body figure',
    hint: 'Anatomy illustration in the “Where does it hurt?” section.',
    recommendedSize: '500 × 500 px',
    aspect: '1:1 square',
    icon: 'fa-person-running',
    accent: 'rose',
  },
];

export const emptySectionImages = () =>
  Object.fromEntries(HOME_SECTION_IMAGE_FIELDS.map((f) => [f.key, '']));
