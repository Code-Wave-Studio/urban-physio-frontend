import { HOME_COMMUNITY_DEFAULTS } from './communityPreview';
import { HOME_PAIN_MAP_DEFAULTS } from './painMapDefaults';
import { HOME_ROADMAP_DEFAULTS } from './recoveryRoadmapDefaults';

/** Default PhysioAtHome / Home Physiotherapy page content (CRF-2026-0006). */

export const HOME_VISIT_BOOK_PATH = '/book?type=home_visit&mode=home-visit';

export const HOME_PHYSIO_SEO = {
  title: 'Home Physiotherapy in Noida, Delhi & Gurugram | The Urban Physio',
  description:
    'Book clinically trained, hospital-experienced physiotherapists for home visits in Noida, Greater Noida, Ghaziabad, Delhi & Gurugram. App-based treatment tracking, all specialisations, transparent pricing.',
  keywords:
    'home physiotherapy, physio at home, home visit physiotherapist Noida, Delhi Gurugram physiotherapy',
};

export const HOME_PHYSIO_DEFAULTS = {
  hero_title: 'Hospital-Trained Physiotherapists. In Your Home. Every Session Tracked.',
  hero_subtitle:
    "We don't send general wellness providers. Every physiotherapist on The Urban Physio has clinical hospital experience, verified credentials, and a structured treatment plan — built around your condition, your home, and your recovery timeline.",
  hero_image: '',
  seo_title: HOME_PHYSIO_SEO.title,
  seo_description: HOME_PHYSIO_SEO.description,
  sections: {
    hero_cta_label: 'Book Your Home Session',
    hero_cta_link: HOME_VISIT_BOOK_PATH,
    trust_signals: [
      'BPT / MPT Certified',
      'Hospital-Experienced Only',
      'App-Based Progress Tracking',
      'Noida · Greater Noida · Ghaziabad · Delhi · Gurugram',
    ],
    trust_bar: [
      { icon: 'fa-user-doctor', label: 'Clinically Trained Physios' },
      { icon: 'fa-mobile-screen', label: 'App-Based Exercise Prescription' },
      { icon: 'fa-arrows-rotate', label: 'Switch Session Mode Anytime' },
      { icon: 'fa-shield-halved', label: 'Verified & Background-Checked' },
      { icon: 'fa-credit-card', label: 'Flexible Payment Options' },
      { icon: 'fa-layer-group', label: 'All Specialisations, One Platform' },
    ],
    fit_heading: 'Not Sure If Home Physiotherapy Is the Right Choice?',
    fit_intro:
      "Most people who land here already know they're in pain — but aren't sure if home is the right format. Here's a simple way to decide.",
    fit_home_title: 'Home physiotherapy is ideal if you:',
    fit_home_items: [
      'Are recovering from surgery and find travel painful or risky',
      'Are elderly or have mobility limitations that make clinic visits difficult',
      'Have a busy schedule and need treatment that fits around your life',
      'Want consistent recovery without commuting after a session',
      'Are managing a neurological condition where environment matters',
      'Have tried clinic physio inconsistently and want a more sustainable format',
    ],
    fit_clinic_title: 'You might prefer a clinic visit if you:',
    fit_clinic_items: [
      'Need advanced in-clinic equipment like hydrotherapy or traction beds',
      'Prefer the structure of a dedicated clinical environment',
      'Live in an area not yet covered by our home service',
    ],
    fit_toggle: 'See full checklist',
    fit_reassurance:
      'Either way, The Urban Physio has you covered. You can start with a home session and switch to clinic or video at any time — without changing your physiotherapist.',
    fit_cta_label: 'Book a Home Session',
    why_heading: 'Why Home Physiotherapy Produces Better Outcomes',
    why_intro:
      'Patients who receive physiotherapy at home show higher session compliance, lower dropout rates, and faster return to daily function.',
    why_toggle: 'See why it works',
    why_items: [
      {
        title: 'Comfort Accelerates Recovery',
        body: 'Your home is your safest environment. Treatment in a familiar setting reduces anxiety, improves compliance, and leads to measurably better outcomes — especially for post-surgical, elderly, and neurological patients.',
      },
      {
        title: 'No Travel, No Setback',
        body: 'Commuting after a physiotherapy session can undo the work done during it. Home sessions eliminate that risk entirely and make it easier to maintain the consistency that recovery demands.',
      },
      {
        title: 'Treatment Built Around Your Reality',
        body: 'Your physio assesses your actual living environment — your furniture, floors, and daily movement patterns — and designs exercises that fit your real life, not a generic clinic template.',
      },
    ],
    difference_heading: 'This Is Not Your Average Home Physio Service',
    difference_intro:
      'A lower price usually means less experience, no clinical structure, and no accountability. We made a deliberate choice not to compete on price — because your recovery is worth more than that.',
    difference_toggle: 'See what makes us different',
    difference_items: [
      {
        title: 'Clinically Experienced Professionals Only',
        body: 'Every physiotherapist on The Urban Physio holds a BPT or MPT degree with hands-on hospital and clinic experience. We do not onboard freshers. We do not list general wellness providers. You get the same level of expertise you would expect at a reputed hospital — delivered to your home.',
      },
      {
        title: 'Verified Before They Come to You',
        body: 'Every physio undergoes a structured verification process covering degree certificates, registration with the relevant physiotherapy council, clinical experience, and professional conduct.',
      },
      {
        title: 'App-Based Monitoring & Exercise Prescription',
        body: "Your treatment doesn't pause between sessions. Through the TUP app, your physio prescribes a personalised home exercise programme after every session, tracks your recovery, and adjusts your plan as you progress.",
      },
      {
        title: 'Switch Session Mode Without Losing Continuity',
        body: 'If you want to shift from home visits to clinic sessions or video consultations — or mix all three — you keep the same physiotherapist and treatment history.',
      },
      {
        title: 'Every Specialisation, One Platform',
        body: "Orthopaedic, neurological, women's health, sports, cardiorespiratory, paediatric, vestibular and other major physiotherapy specialisations.",
      },
      {
        title: 'Transparent Pricing, Flexible Payment',
        body: 'Three tiers based on experience and specialisation. Pay per session or save with a package. UPI, cards, net banking and EMI on packages. No hidden charges.',
      },
    ],
    tiers_heading: 'Choose the Right Physiotherapist for Your Needs',
    tiers_intro:
      'Unlike standard listings, home sessions on The Urban Physio give you full control over the level of expertise coming to you.',
    tiers_note: "Not sure which tier suits your condition? WhatsApp us or call before booking — we'll guide you.",
    tiers: [
      {
        key: 'certified',
        name: 'Certified Physio',
        badge: '',
        price: '₹1,200',
        original: '₹1,500',
        summary: 'Best for common musculoskeletal conditions, pain management, and general rehabilitation.',
        qualification: 'BPT from a recognised institution',
        experience: '1–3 years',
        speciality:
          'Orthopaedic conditions, back and neck pain, post-operative rehabilitation, sports injuries, general physiotherapy',
        case_handling: 'Clinical assessment, SOAP-based documentation, structured home exercise prescription via TUP app',
        cta_label: 'Book a Certified Physio — ₹1,200',
        cta_link: `${HOME_VISIT_BOOK_PATH}&tier=certified`,
      },
      {
        key: 'senior',
        name: 'Senior Physio',
        badge: 'Most Booked',
        price: '₹1,500',
        original: '₹1,800',
        summary: 'Ideal when you want deeper clinical judgement and multi-session rehabilitation planning.',
        qualification: 'BPT with advanced certification or MPT',
        experience: '3–6 years',
        speciality:
          "Chronic pain, sports rehabilitation, neurological physiotherapy, women's health, cardiorespiratory, post-surgical recovery",
        case_handling:
          'Multi-session treatment planning, condition-specific manual therapy, outcome measurement and progressive rehabilitation protocols',
        cta_label: 'Book a Senior Physio — ₹1,500',
        cta_link: `${HOME_VISIT_BOOK_PATH}&tier=senior`,
      },
      {
        key: 'specialist',
        name: 'Specialist Consultant',
        badge: 'Expert Care',
        price: '₹2,000',
        original: '₹2,500',
        summary: 'For complex, high-dependency, or specialist-led recovery that needs senior clinical judgement.',
        qualification: 'MPT in a specialised domain',
        experience: '6+ years',
        speciality:
          'Neurological rehabilitation, advanced sports physiotherapy, complex post-operative cases, vestibular/balance rehabilitation, chronic complex pain, high-dependency elderly care',
        case_handling:
          'Advanced manual therapy, instrument-assisted techniques, complex case management and specialist-level clinical judgement',
        cta_label: 'Book a Specialist Consultant — ₹2,000',
        cta_link: `${HOME_VISIT_BOOK_PATH}&tier=specialist`,
      },
    ],
    how_heading: 'How a Home Session Works',
    how_cta_label: 'Book Your First Session Now',
    how_cta_link: HOME_VISIT_BOOK_PATH,
    how_steps: [
      {
        title: 'Book in Under 2 Minutes',
        body: 'Select Home Visit, choose your condition and preferred physiotherapist tier, enter your location and pick a time.',
      },
      {
        title: 'We Send Your Physiotherapist',
        body: 'Based on your condition and chosen tier, we match and confirm a physiotherapist.',
      },
      {
        title: 'Your First Session',
        body: 'Your physio begins with a structured clinical assessment followed by treatment.',
      },
      {
        title: 'Track Your Recovery on the App',
        body: 'After every session, your physio logs clinical notes and updates your personalised exercise programme.',
      },
    ],
    conditions_heading: 'Conditions We Treat at Home',
    conditions_toggle: 'See all conditions',
    conditions_cta_label: 'Book a Home Session',
    conditions_featured: [
      'Back Pain',
      'Knee Pain & Rehabilitation',
      'Post-Surgery Recovery',
      'Stroke & Neurological Rehabilitation',
      'Sciatica',
      'Sports Injuries',
    ],
    conditions_categories: [
      {
        name: 'Musculoskeletal & Orthopaedic',
        items: [
          'Neck Pain',
          'Back Pain',
          'Shoulder Pain',
          'Knee Pain',
          'Arthritis',
          'Frozen Shoulder',
          'Tennis Elbow',
          'Plantar Fasciitis',
          'Sciatica',
        ],
      },
      {
        name: 'Sports Physiotherapy',
        items: [
          'Sports Injuries',
          'Ligament Sprains',
          'Muscle Strains',
          'ACL Rehabilitation',
          'Return-to-Sport Rehabilitation',
        ],
      },
      {
        name: "Women's Health",
        items: [
          'Pregnancy-Related Back Pain',
          'Postnatal Rehabilitation',
          'Pelvic Floor Dysfunction',
          'Diastasis Recti',
          'Urinary Incontinence',
        ],
      },
      {
        name: 'Cardiorespiratory',
        items: [
          'COPD',
          'Asthma',
          'Pneumonia Recovery',
          'Post-COVID Rehabilitation',
          'Airway Clearance Therapy',
        ],
      },
      {
        name: 'Chronic Pain & Pain Management',
        items: ['Chronic Low Back Pain', 'Fibromyalgia', 'Myofascial Pain Syndrome', 'Persistent Neck Pain'],
      },
      {
        name: 'Vestibular & Balance',
        items: ['Vertigo (BPPV)', 'Dizziness', 'Balance Disorders', 'Fall Prevention'],
      },
      {
        name: 'Ergonomic & Workplace',
        items: [
          'Computer-Related Neck & Back Pain',
          'Poor Posture',
          'Repetitive Strain Injuries',
          'Workplace Ergonomic Assessment',
        ],
      },
      {
        name: 'Home & Community Rehabilitation',
        items: [
          'Elderly Care',
          'Neurological Rehabilitation',
          'Post-Operative Rehabilitation',
          'Community-Based Rehabilitation',
        ],
      },
    ],
    pricing_heading: 'Honest Pricing. No Hidden Charges.',
    pricing_toggle: 'View package pricing',
    pricing_offer: 'Limited-time introductory pricing. Lock in your rate before it changes.',
    pricing_payment: 'UPI · Credit & Debit Cards · Net Banking · EMI available on all packages',
    pricing_cta_label: 'Book Now & Lock in Your Price',
    pricing_cta_link: HOME_VISIT_BOOK_PATH,
    pricing_sessions: [
      { name: 'Certified Physio', original: '₹1,500', price: '₹1,200' },
      { name: 'Senior Physio', original: '₹1,800', price: '₹1,500' },
      { name: 'Specialist Consultant', original: '₹2,500', price: '₹2,000' },
    ],
    pricing_packages: [
      { name: 'Certified', sessions: '15 Sessions', price: '₹16,499', save: 'Save ₹1,501' },
      { name: 'Senior', sessions: '15 Sessions', price: '₹19,999', save: 'Save ₹2,501' },
      { name: 'Specialist', sessions: '15 Sessions', price: '₹26,999', save: 'Save ₹3,001' },
    ],
    areas_heading: 'Where We Currently Serve',
    areas_pincode: "Enter your pincode at checkout — we'll confirm serviceability in seconds.",
    areas: [
      {
        name: 'Noida',
        localities: 'Sectors 15–18, 50, 62, 76, 137, Noida Extension, and surrounding residential sectors.',
      },
      {
        name: 'Greater Noida',
        localities: 'Knowledge Park, Alpha–Gamma, Pari Chowk, Jagat Farm, and nearby townships.',
      },
      {
        name: 'Ghaziabad',
        localities: 'Indirapuram, Vaishali, Vasundhara, Raj Nagar, Crossings Republik, and adjoining localities.',
      },
      {
        name: 'Delhi',
        localities: 'South, East, West and Central Delhi neighbourhoods currently covered by our home-visit network.',
      },
      {
        name: 'Gurugram',
        localities: 'DLF, Sohna Road, Golf Course Road, Sector 56, New Gurgaon, and nearby residential pockets.',
      },
    ],
    testimonials_heading: 'What Our Patients Say',
    testimonials: [
      {
        name: 'Rajesh M.',
        city: 'Noida Sector 50',
        rating: 5,
        text: 'After knee surgery, travelling to a clinic felt impossible. The Urban Physio sent a hospital-trained physio to my home and tracked every exercise on the app. I was walking confidently again in weeks.',
      },
      {
        name: 'Priya S.',
        city: 'Gurugram',
        rating: 5,
        text: 'I needed postnatal rehab that fitted around my baby. Sessions at home were professional, discreet, and far more consistent than anything I managed at a clinic.',
      },
      {
        name: 'Ankit V.',
        city: 'Indirapuram, Ghaziabad',
        rating: 5,
        text: 'Sports injury recovery without losing time in traffic. My senior physio planned every session and I could switch to video when I travelled for work.',
      },
      {
        name: 'Meera K.',
        city: 'South Delhi',
        rating: 5,
        text: 'My father has limited mobility. Having a verified, experienced physiotherapist come home — with notes we can all see — gave our family real peace of mind.',
      },
      {
        name: 'Siddharth R.',
        city: 'Greater Noida',
        rating: 5,
        text: 'Clear pricing, no surprises, and a specialist who actually understood my chronic back pain. The app reminders kept me honest between visits.',
      },
    ],
    faq_heading: 'Frequently Asked Questions',
    faqs: [
      {
        q: 'Is home physiotherapy as effective as going to a clinic?',
        a: 'For most musculoskeletal, post-surgical, neurological, and elderly-care cases, yes — and often more so. Home sessions remove travel fatigue, improve compliance, and let your physiotherapist treat you in the environment where you actually move every day. Clinic visits remain useful when you need specialised equipment such as hydrotherapy or traction.',
      },
      {
        q: 'How is The Urban Physio different from other home physiotherapy services?',
        a: 'We only onboard BPT/MPT physiotherapists with hospital or clinic experience — not freshers or general wellness providers. Every visit is verified, documented, and followed by an app-based exercise plan. You can also switch between home, clinic, and video without changing your physiotherapist.',
      },
      {
        q: 'Who are the physiotherapists?',
        a: 'Every physiotherapist holds a BPT or MPT degree, is registered with the relevant physiotherapy council, and has hands-on hospital or clinic experience. We verify credentials, clinical background, and professional conduct before anyone is sent to your home.',
      },
      {
        q: 'What is the difference between the three physiotherapist tiers?',
        a: 'Certified Physio (₹1,200) suits common musculoskeletal and general rehab needs (1–3 years). Senior Physio (₹1,500) is our most booked tier for chronic, sports, neurological, and multi-session plans (3–6 years). Specialist Consultant (₹2,000) is for complex, high-dependency, or specialist-domain cases (6+ years, MPT).',
      },
      {
        q: 'How does booking a home session work?',
        a: 'Choose Home Visit, pick your condition and preferred tier, enter your location, and select a time — usually under two minutes. We match a physiotherapist, confirm the visit, and they begin with a structured clinical assessment at your home.',
      },
      {
        q: 'Which areas do you currently serve?',
        a: 'We currently serve Noida, Greater Noida, Ghaziabad, Delhi, and Gurugram. Enter your pincode at checkout and we confirm serviceability in seconds. Coverage continues to expand locality by locality.',
      },
      {
        q: 'How does pricing and package billing work?',
        a: 'Introductory single-session rates are ₹1,200 (Certified), ₹1,500 (Senior), and ₹2,000 (Specialist). 15-session packages start at ₹16,499, ₹19,999, and ₹26,999. Pay by UPI, cards, or net banking; EMI is available on packages. No hidden charges.',
      },
      {
        q: 'Can I switch between home, clinic, and video sessions?',
        a: 'Yes. You can start at home and move to clinic or video — or mix all three — while keeping the same physiotherapist and treatment history. Continuity of care is built into the platform.',
      },
    ],
    ...HOME_PAIN_MAP_DEFAULTS,
    ...HOME_ROADMAP_DEFAULTS,
    ...HOME_COMMUNITY_DEFAULTS,
  },
};

export function mergeHomePhysioSections(raw = {}) {
  const defaults = HOME_PHYSIO_DEFAULTS.sections;
  const out = { ...defaults, ...raw };
  const listKeys = [
    'trust_signals',
    'trust_bar',
    'fit_home_items',
    'fit_clinic_items',
    'why_items',
    'difference_items',
    'tiers',
    'how_steps',
    'conditions_featured',
    'conditions_categories',
    'pricing_sessions',
    'pricing_packages',
    'areas',
    'testimonials',
    'faqs',
    'pain_areas',
    'roadmap_phases',
  ];
  listKeys.forEach((key) => {
    if (!Array.isArray(out[key]) || out[key].length === 0) {
      out[key] = defaults[key];
    }
  });
  return out;
}
