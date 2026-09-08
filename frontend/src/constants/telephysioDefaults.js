import { TELE_COMMUNITY_DEFAULTS } from './communityPreview';
import { TELE_PAIN_MAP_DEFAULTS } from './painMapDefaults';

/**
 * Default TelePhysio by Myoreset page content (CRF-2026-0006).
 */

export const TELEPHYSIO_BOOK_PATH = '/book?type=online&mode=telephysio';

export const TELEPHYSIO_SEO = {
  title: 'TelePhysio by Myoreset | Online Physiotherapy Consultation | The Urban Physio',
  description:
    'Book online physiotherapy consultations and rehabilitation with qualified physiotherapists through TelePhysio by Myoreset. Get personalised guidance, exercise support and rehabilitation from home.',
  keywords:
    'online physiotherapy consultation, telephysio, virtual physiotherapy India, remote rehabilitation, Myoreset, video physio consult, online back pain relief',
};

export const TELEPHYSIO_DEFAULTS = {
  hero_title: 'Expert Physiotherapy. From Anywhere.',
  hero_subtitle:
    'Get personalised physiotherapy consultation and rehabilitation from clinically trained professionals through secure online sessions, structured treatment plans and guided exercises.',
  hero_image: '',
  seo_title: TELEPHYSIO_SEO.title,
  seo_description: TELEPHYSIO_SEO.description,
  sections: {
    hero_badge: 'TelePhysio by Myoreset',
    hero_cta_label: 'Book a TelePhysio Session',
    hero_cta_link: TELEPHYSIO_BOOK_PATH,
    secondary_cta_label: 'Talk to a Physiotherapist',
    secondary_cta_type: 'whatsapp',
    trust_signals: [
      'Qualified Physiotherapists',
      'Personalised Rehabilitation',
      'Secure Online Consultation',
      'Treatment Progress Tracking',
    ],

    trust_bar: [
      { icon: 'fa-user-doctor', label: 'Qualified Physiotherapists' },
      { icon: 'fa-video', label: 'Secure Video Consultation' },
      { icon: 'fa-clipboard-list', label: 'Personalised Treatment Plan' },
      { icon: 'fa-mobile-screen', label: 'Exercise Prescription' },
      { icon: 'fa-chart-line', label: 'Progress Tracking' },
      { icon: 'fa-arrows-rotate', label: 'Follow-up Support' },
    ],

    what_heading: 'What Is TelePhysio?',
    what_body:
      'TelePhysio allows you to consult a qualified physiotherapist online without travelling to a clinic. Your physiotherapist can assess your symptoms, understand your movement limitations, guide you through exercises and create a personalised rehabilitation plan based on your condition.',
    what_use_cases_title: 'TelePhysio is especially effective for:',
    what_use_cases: [
      'Follow-up consultations',
      'Exercise guidance',
      'Rehabilitation monitoring',
      'Chronic pain management',
      'Post-treatment support',
      'General physiotherapy guidance where appropriate',
    ],
    what_cta_label: 'Book Your Online Consultation',
    what_cta_link: TELEPHYSIO_BOOK_PATH,

    who_heading: 'Is Online Physiotherapy Right for You?',
    who_subheading:
      'TelePhysio provides structured, accessible physiotherapy care tailored to your daily routine and recovery needs.',
    who_cards: [
      {
        title: 'Busy Professionals',
        description: 'Get physiotherapy guidance without travelling to a clinic.',
        icon: 'fa-briefcase',
      },
      {
        title: 'Follow-Up Patients',
        description: 'Continue rehabilitation after an initial assessment or treatment.',
        icon: 'fa-clock-rotate-left',
      },
      {
        title: 'Chronic Pain Management',
        description: 'Receive structured guidance and exercise support.',
        icon: 'fa-heart-pulse',
      },
      {
        title: 'Post-Surgery Rehabilitation',
        description: 'Stay connected with your physiotherapist during recovery when remote care is clinically appropriate.',
        icon: 'fa-hospital-user',
      },
      {
        title: 'Sports & Fitness Recovery',
        description: 'Get exercise guidance and rehabilitation support remotely.',
        icon: 'fa-person-running',
      },
      {
        title: 'Patients Living Away From Clinics',
        description: 'Access qualified physiotherapy guidance from wherever you are.',
        icon: 'fa-globe',
      },
    ],
    who_clinical_note:
      'TelePhysio may not be suitable for every condition. Your physiotherapist will advise if an in-person assessment or treatment is more appropriate.',

    how_heading: 'How TelePhysio Works',
    how_subheading: 'Four seamless steps from booking to sustained rehabilitation.',
    how_steps: [
      {
        step: '01',
        title: 'Book Your Consultation',
        description: 'Select TelePhysio and choose your preferred appointment time.',
        icon: 'fa-calendar-check',
      },
      {
        step: '02',
        title: 'Meet Your Physiotherapist',
        description: 'Join your secure online consultation at the scheduled time.',
        icon: 'fa-video',
      },
      {
        step: '03',
        title: 'Get Your Personalised Plan',
        description: 'Your physiotherapist assesses your condition and provides appropriate guidance and exercises.',
        icon: 'fa-file-lines',
      },
      {
        step: '04',
        title: 'Track Your Rehabilitation',
        description: 'Continue your exercises and follow-up with your physiotherapist as your recovery progresses.',
        icon: 'fa-chart-pie',
      },
    ],

    session_heading: 'What Happens During Your TelePhysio Session?',
    session_subheading:
      'A comprehensive, structured clinical appointment designed for precision and actionable recovery.',
    session_timeline: [
      {
        number: '1',
        title: 'Discuss your symptoms and concerns',
        description: 'Detail your pain levels, functional restrictions, and specific triggers with your clinician.',
      },
      {
        number: '2',
        title: 'Review your medical/treatment history',
        description: 'Review prior medical reports, scans, surgical history, and current medications.',
      },
      {
        number: '3',
        title: 'Guided movement and functional assessment where appropriate',
        description: 'Your physiotherapist visually guides you through active movement checks and posture evaluations.',
      },
      {
        number: '4',
        title: 'Understand your current limitations',
        description: 'Clarify the root causes contributing to pain, stiffness, or neuromuscular weakness.',
      },
      {
        number: '5',
        title: 'Receive personalised exercise guidance',
        description: 'Perform guided exercises under live supervision with real-time posture and form correction.',
      },
      {
        number: '6',
        title: 'Discuss your rehabilitation plan',
        description: 'Receive a structured Home Exercise Programme (HEP) with clear sets, repetitions, and precautions.',
      },
      {
        number: '7',
        title: 'Plan follow-up sessions if required',
        description: 'Set recovery milestones and schedule follow-up reviews to track your progression.',
      },
    ],
    session_disclaimer:
      'Note: While remote assessment is highly effective for many musculoskeletal and recovery conditions, your clinician will recommend an in-clinic evaluation if hands-on testing or specialized equipment is necessary.',

    benefits_heading: 'Why Choose TelePhysio?',
    benefits_subheading:
      'High-quality clinical care engineered for convenience, consistency, and clinical excellence.',
    benefits: [
      {
        title: 'Convenient Care',
        description: 'Consult from home without unnecessary travel.',
        icon: 'fa-house-circle-check',
      },
      {
        title: 'Personalised Guidance',
        description: 'Treatment and exercise recommendations based on your condition.',
        icon: 'fa-user-check',
      },
      {
        title: 'Continuous Support',
        description: 'Stay connected with your physiotherapist during rehabilitation.',
        icon: 'fa-comments',
      },
      {
        title: 'Progress Monitoring',
        description: 'Track your rehabilitation journey through the existing TUP system where supported.',
        icon: 'fa-chart-line',
      },
      {
        title: 'Flexible Scheduling',
        description: 'Book sessions around your availability.',
        icon: 'fa-clock',
      },
      {
        title: 'Expert Physiotherapy',
        description: 'Connect with qualified physiotherapists through the TUP platform.',
        icon: 'fa-certificate',
      },
    ],

    conditions_heading: 'Conditions We Can Support Online',
    conditions_subheading:
      'Specialised online rehabilitation across a broad range of musculoskeletal, postural, and recovery needs.',
    conditions: [
      { name: 'Back & Neck Pain', icon: 'fa-person-cane', desc: 'Ergonomic strains, postural tension, disc stiffness, and muscular imbalances.' },
      { name: 'Joint Pain', icon: 'fa-bone', desc: 'Knee, shoulder, hip, and ankle discomfort managed with targeted mobility protocols.' },
      { name: 'Sports Injuries', icon: 'fa-person-running', desc: 'Sprains, tendinopathy, and guided return-to-sport strengthening programmes.' },
      { name: 'Post-Surgery Follow-Up', icon: 'fa-hospital', desc: 'Progressive recovery protocols following orthopaedic or spinal procedures.' },
      { name: 'Posture & Ergonomic Problems', icon: 'fa-chair', desc: 'Desk worker corrections, upper cross syndrome, and spine alignment drills.' },
      { name: 'General Rehabilitation', icon: 'fa-dumbbell', desc: 'Strength restoration, flexibility enhancement, and movement conditioning.' },
      { name: 'Chronic Pain Management', icon: 'fa-heart-pulse', desc: 'Graded activity pacing, pain education, and long-term functional improvement.' },
      { name: 'Exercise & Mobility Guidance', icon: 'fa-arrows-to-dot', desc: 'Personalised corrective drills with real-time technique supervision.' },
    ],
    conditions_clinical_note:
      'Your physiotherapist will determine whether online consultation is appropriate for your condition.',

    experience_heading: 'Your Recovery, Guided From Anywhere',
    experience_subheading:
      'Seamless digital care from initial booking through your final rehabilitation milestone.',
    experience_stages: [
      {
        stage: 'Before Session',
        title: 'Preparation & Booking',
        summary:
          'Book your appointment online, upload any prior medical records, and receive your private meeting link via email and SMS.',
        points: [
          'Choose an appointment slot that fits your schedule',
          'Share basic symptom information & medical history',
          'Instant confirmation with secure consultation link',
        ],
      },
      {
        stage: 'During Session',
        title: 'Live Clinical Consultation',
        summary:
          'Connect 1-on-1 with your physiotherapist via encrypted video for assessment, guidance, and supervised exercises.',
        points: [
          'Structured video consultation and symptom discussion',
          'Guided functional range-of-motion assessments',
          'Real-time form and technique feedback',
        ],
      },
      {
        stage: 'After Session',
        title: 'Structured Rehabilitation Plan',
        summary:
          'Access your digital prescription, exercise routines, and keep in touch for follow-up guidance.',
        points: [
          'Personalised exercise prescription in your patient portal',
          'Track recovery milestones and session notes',
          'Schedule follow-up sessions for sustained progress',
        ],
      },
    ],

    pricing_heading: 'Transparent, Value-Focused Pricing',
    pricing_subheading:
      'Accessible online consultation rates with full digital prescription and follow-up support.',
    pricing_cards: [
      {
        title: 'TelePhysio Consultation',
        price: '₹499',
        original_price: '₹799',
        duration: '30–45 mins',
        badge: 'Introductory Session',
        features: [
          '1-on-1 live video consultation with qualified physiotherapist',
          'Comprehensive movement & symptom assessment',
          'Supervised corrective exercise guidance',
          'Personalised Home Exercise Plan (HEP)',
          'App-based progress tracking & documentation',
          'Option to seamlessly switch to in-clinic or home visits',
        ],
        cta_label: 'Book TelePhysio',
        cta_link: TELEPHYSIO_BOOK_PATH,
      },
      {
        title: 'Rehabilitation Package',
        price: '₹2,199',
        original_price: '₹3,499',
        duration: '5 Online Sessions',
        badge: 'Most Popular',
        features: [
          '5 comprehensive 1-on-1 video consultations',
          'Progressive exercise updates as recovery advances',
          'Ongoing clinician guidance and milestone reviews',
          'Direct messaging for recovery queries between sessions',
          'Complete clinical notes & prescription record',
          'Priority booking and flexible scheduling',
        ],
        cta_label: 'Book Rehab Package',
        cta_link: `${TELEPHYSIO_BOOK_PATH}&package=telephysio_5`,
      },
    ],
    pricing_note:
      'Prices are transparent with zero hidden fees. Payments are securely processed via UPI, cards, net banking, or wallet.',

    testimonials_heading: 'What Our Patients Say',
    testimonials_subheading: 'Real experiences from patients recovering with TelePhysio by Myoreset.',
    testimonials: [
      {
        name: 'Rahul Verma',
        location: 'Bengaluru',
        condition: 'Postural Neck & Upper Back Pain',
        quote:
          'As a software engineer, traveling for physiotherapy was impossible with my work hours. TelePhysio gave me exact desk ergonomics and targeted exercises that relieved my chronic neck pain in 3 weeks.',
        rating: 5,
      },
      {
        name: 'Dr. Ananya Sharma',
        location: 'Delhi NCR',
        condition: 'Post-Arthroscopy Knee Rehabilitation',
        quote:
          'The structured video check-ins and app-based exercise tracking kept my knee recovery on schedule after surgery. Highly professional clinicians who observe form carefully.',
        rating: 5,
      },
      {
        name: 'Vikram Malhotra',
        location: 'Mumbai',
        condition: 'Lower Back Sprain',
        quote:
          'I was skeptical about physiotherapy over video, but the clinician guided every movement step-by-step. The exercise plan on my phone was clear, easy to follow, and very effective.',
        rating: 5,
      },
    ],

    faq_heading: 'Frequently Asked Questions',
    faq_subheading: 'Everything you need to know about online physiotherapy consultations.',
    faqs: [
      {
        q: 'What is TelePhysio?',
        a: 'TelePhysio is an online physiotherapy consultation service by The Urban Physio and Myoreset. It connects you with qualified, certified physiotherapists via secure 1-on-1 video calls for assessment, guided rehabilitation, and personalized exercise prescription from the comfort of your home.',
      },
      {
        q: 'How does an online physiotherapy consultation work?',
        a: 'After booking a slot, you will receive a secure video meeting link. During your session, your physiotherapist will discuss your symptoms and medical history, conduct guided movement tests, identify functional limitations, supervise corrective exercises in real time, and assign a structured rehabilitation plan.',
      },
      {
        q: 'Do I need any equipment for my session?',
        a: 'No specialized equipment is needed. All you need is a smartphone, tablet, or laptop with a working camera and internet connection, comfortable clothing for movement, and a clear space where your physiotherapist can see you perform exercises.',
      },
      {
        q: 'Can TelePhysio help with rehabilitation?',
        a: 'Yes. Scientific evidence demonstrates that structured active rehabilitation, posture retraining, neuromuscular re-education, and guided therapeutic exercises are highly effective when delivered through telehealth for many musculoskeletal conditions.',
      },
      {
        q: 'Can I book follow-up sessions?',
        a: 'Yes. You can easily schedule follow-up sessions with your physiotherapist through the platform to review your progress, advance your exercises, and ensure steady functional recovery.',
      },
      {
        q: 'Is TelePhysio suitable for every condition?',
        a: 'While TelePhysio is suitable for a wide range of common conditions (back pain, neck stiffness, sports recovery, ergonomic issues, follow-ups), some conditions require hands-on manual therapy, diagnostic imaging, or in-person evaluation. Your physiotherapist will advise you honestly if in-clinic care is required.',
      },
      {
        q: 'How do I join my consultation?',
        a: 'Once booked, your appointment details and private consultation link are sent to your email and SMS. You can also join directly from your The Urban Physio patient dashboard with a single click at your scheduled appointment time.',
      },
      {
        q: 'Can I switch to an in-person session if required?',
        a: 'Yes. The Urban Physio offers seamless multi-mode continuity. You can start online and switch to in-clinic or home visits anytime while preserving your medical history and clinical records on the platform.',
      },
      {
        q: 'Can my exercises be updated during rehabilitation?',
        a: 'Yes. As your strength, mobility, and symptom thresholds improve, your physiotherapist updates your digital exercise prescription in your patient portal with progressive sets, repetitions, and advanced drills.',
      },
      {
        q: 'How can I contact my physiotherapist between sessions?',
        a: 'You can reach out through the patient portal support features or contact our dedicated patient support team via WhatsApp for any appointment questions, exercise clarifications, or scheduling adjustments.',
      },
    ],

    final_heading: 'Ready to Start Your Recovery?',
    final_subheading: 'Get expert physiotherapy guidance from the comfort of your home.',
    final_primary_cta_label: 'Book a TelePhysio Session',
    final_primary_cta_link: TELEPHYSIO_BOOK_PATH,
    final_secondary_cta_label: 'Talk to Us',
    final_secondary_cta_type: 'whatsapp',
    ...TELE_PAIN_MAP_DEFAULTS,
    ...TELE_COMMUNITY_DEFAULTS,
  },
};

export function mergeTelePhysioSections(raw = {}) {
  const d = TELEPHYSIO_DEFAULTS.sections;
  const out = { ...d, ...(raw || {}) };
  const listKeys = [
    'trust_signals',
    'trust_bar',
    'what_use_cases',
    'who_cards',
    'how_steps',
    'session_timeline',
    'benefits',
    'conditions',
    'experience_stages',
    'pricing_cards',
    'testimonials',
    'faqs',
    'pain_areas',
  ];
  for (const k of listKeys) {
    if (!Array.isArray(out[k]) || out[k].length === 0) {
      out[k] = d[k];
    }
  }
  return out;
}
