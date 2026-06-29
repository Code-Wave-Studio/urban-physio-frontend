/** Legal & policy pages — content for The Urban Physio (India) */

export const POLICY_LAST_UPDATED = '23 May 2026';

export const ALL_POLICIES = [
  { key: 'privacy', path: '/privacy-policy', label: 'Privacy Policy', icon: 'fa-shield-halved' },
  { key: 'terms', path: '/terms-and-conditions', label: 'Terms & Conditions', icon: 'fa-file-contract' },
  { key: 'medico-legal', path: '/medico-legal-terms', label: 'Medico-Legal Terms', icon: 'fa-scale-balanced' },
  { key: 'patient-registration', path: '/patient-registration-terms', label: 'Patient Registration Terms', icon: 'fa-user' },
  { key: 'doctor-registration', path: '/doctor-registration-terms', label: 'Doctor Registration Terms', icon: 'fa-user-doctor' },
  { key: 'clinic-registration', path: '/clinic-registration-terms', label: 'Clinic Registration Terms', icon: 'fa-hospital' },
  { key: 'refund', path: '/refund-policy', label: 'Refund & Cancellation', icon: 'fa-rotate-left' },
  { key: 'medical', path: '/medical-disclaimer', label: 'Medical Disclaimer', icon: 'fa-heart-pulse' },
  { key: 'data-security', path: '/data-security', label: 'Data Security', icon: 'fa-lock' },
  { key: 'service', path: '/service-policy', label: 'Service Policy', icon: 'fa-handshake' },
  { key: 'cookie', path: '/cookie-policy', label: 'Cookie Policy', icon: 'fa-cookie-bite' },
];

export const POLICY_PAGES = {
  privacy: {
    key: 'privacy',
    path: '/privacy-policy',
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your personal information on The Urban Physio platform.',
    icon: 'fa-shield-halved',
    accent: 'from-orange-600 to-primary-600',
    sections: [
      {
        id: 'introduction',
        title: '1. Introduction',
        paragraphs: [
          'The Urban Physio ("we", "us", "our") operates a digital healthcare platform connecting patients with licensed physiotherapists across India. This Privacy Policy explains how we handle personal data when you use our website, mobile experiences, and booking services.',
          'By registering, booking, or browsing our platform, you agree to the practices described here. If you do not agree, please discontinue use of our services.',
        ],
      },
      {
        id: 'data-we-collect',
        title: '2. Information We Collect',
        bullets: [
          'Identity & contact: name, email, phone number, city/location',
          'Account credentials: encrypted password, role (patient, doctor, admin)',
          'Health-related booking data: pain type, session preferences, appointment notes you provide',
          'Payment metadata: transaction IDs, amounts, status (processed via Razorpay — we do not store full card numbers)',
          'Technical data: IP address, browser type, device information, cookies (see Cookie Policy)',
          'Doctor profiles: license details, specialization, fees, availability, practice address',
        ],
      },
      {
        id: 'how-we-use',
        title: '3. How We Use Your Data',
        bullets: [
          'Facilitate appointment booking, confirmations, and reminders',
          'Process payments and generate invoices',
          'Verify doctor credentials and manage platform safety',
          'Improve our services, analytics, and customer support',
          'Comply with applicable Indian laws and lawful requests',
          'Send service-related communications (you may opt out of marketing where applicable)',
        ],
      },
      {
        id: 'sharing',
        title: '4. Sharing & Disclosure',
        paragraphs: [
          'We share necessary information with physiotherapists you book, payment partners (Razorpay), video session links for online consultations (e.g. Jitsi Meet), and infrastructure providers hosting our platform.',
          'We do not sell your personal data. We may disclose information when required by law, court order, or to protect rights, safety, and fraud prevention.',
        ],
      },
      {
        id: 'retention',
        title: '5. Data Retention',
        paragraphs: [
          'We retain account and booking records for as long as your account is active and as needed for legal, tax, and dispute-resolution purposes. You may request deletion subject to obligations we must keep (e.g. payment records).',
        ],
      },
      {
        id: 'rights',
        title: '6. Your Rights (India)',
        paragraphs: [
          'Under applicable Indian law including the Digital Personal Data Protection Act, 2023, you may have rights to access, correct, erase, and withdraw consent for certain processing. Contact us at support@theurbanphysio.com to exercise these rights.',
        ],
      },
      {
        id: 'children',
        title: '7. Children',
        paragraphs: [
          'Our services are intended for users 18 years and older. Minors may use the platform only with parental/guardian consent and supervision where permitted by law.',
        ],
      },
      {
        id: 'contact',
        title: '8. Contact Us',
        paragraphs: [
          'Data protection queries: support@theurbanphysio.com',
          'Postal address: The Urban Physio, India (full registered address to be updated on incorporation documents).',
        ],
      },
    ],
  },

  terms: {
    key: 'terms',
    path: '/terms-and-conditions',
    title: 'Terms & Conditions',
    subtitle: 'Rules governing your use of The Urban Physio website and services.',
    icon: 'fa-file-contract',
    accent: 'from-slate-700 to-primary-800',
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance of Terms',
        paragraphs: [
          'These Terms & Conditions ("Terms") form a binding agreement between you and The Urban Physio. By accessing our platform, creating an account, or booking a session, you accept these Terms and our Privacy Policy.',
        ],
      },
      {
        id: 'services',
        title: '2. Platform Services',
        paragraphs: [
          'We provide an online marketplace connecting patients with independent, verified physiotherapists. We facilitate booking, payments, and session logistics but are not a hospital or clinical establishment unless explicitly stated for a partner clinic.',
          'Treatment is delivered by licensed professionals; outcomes depend on individual health conditions and adherence to care plans.',
        ],
      },
      {
        id: 'accounts',
        title: '3. User Accounts',
        bullets: [
          'You must provide accurate registration information and keep credentials confidential',
          'You are responsible for activity under your account',
          'Doctors must submit truthful credentials; false information may lead to termination and legal action',
          'We may suspend accounts for fraud, abuse, or policy violations',
        ],
      },
      {
        id: 'bookings',
        title: '4. Bookings & Payments',
        bullets: [
          'Appointment slots are subject to doctor availability and confirmation',
          'Fees are displayed before payment; applicable taxes may apply per Indian law',
          'Payments are processed through Razorpay; you agree to their terms as well',
          'Cancellations and refunds are governed by our Refund & Cancellation Policy',
        ],
      },
      {
        id: 'conduct',
        title: '5. Acceptable Use',
        bullets: [
          'No harassment, hate speech, or misuse of patient/doctor data',
          'No unauthorized scraping, hacking, or interference with platform operations',
          'No false reviews or manipulation of ratings',
          'Compliance with all applicable healthcare and telemedicine guidelines in your jurisdiction',
        ],
      },
      {
        id: 'ip',
        title: '6. Intellectual Property',
        paragraphs: [
          'All platform content, branding, software, and design are owned by The Urban Physio or licensors. You may not copy, modify, or distribute without written permission.',
        ],
      },
      {
        id: 'liability',
        title: '7. Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by Indian law, we are not liable for indirect, incidental, or consequential damages. Our total liability for any claim relating to the platform shall not exceed the fees paid by you for the specific booking giving rise to the claim, except where liability cannot be limited by law.',
        ],
      },
      {
        id: 'disputes',
        title: '8. Governing Law & Disputes',
        paragraphs: [
          'These Terms are governed by the laws of India. Courts at Mumbai, Maharashtra shall have exclusive jurisdiction, subject to mandatory consumer protection forums where applicable.',
        ],
      },
    ],
  },

  refund: {
    key: 'refund',
    path: '/refund-policy',
    title: 'Refund & Cancellation Policy',
    subtitle: 'Clear guidelines for cancelling sessions and requesting refunds on The Urban Physio.',
    icon: 'fa-rotate-left',
    accent: 'from-emerald-600 to-teal-600',
    sections: [
      {
        id: 'overview',
        title: '1. Overview',
        paragraphs: [
          'We aim for fair, transparent cancellation rules that respect both patients and physiotherapists. Refund eligibility depends on who cancels, when, and payment status.',
        ],
      },
      {
        id: 'patient-cancel',
        title: '2. Patient-Initiated Cancellation',
        bullets: [
          'More than 24 hours before session: full refund to original payment method (5–7 business days via Razorpay)',
          '12–24 hours before session: 50% refund; balance retained as cancellation fee',
          'Less than 12 hours or no-show: no refund unless exceptional circumstances (see below)',
          'Online sessions: same windows apply based on scheduled start time (IST)',
        ],
      },
      {
        id: 'doctor-cancel',
        title: '3. Doctor / Provider Cancellation',
        bullets: [
          'If the physiotherapist or clinic cancels: 100% refund automatically initiated',
          'If rescheduled by provider with your consent: no refund; new slot confirmed in writing/email',
        ],
      },
      {
        id: 'home-visit',
        title: '4. Home Visit Specifics',
        bullets: [
          'Cancellation after therapist dispatch may incur up to 30% fee to cover travel',
          'Incorrect address or unreachable patient may be treated as no-show',
        ],
      },
      {
        id: 'process',
        title: '5. How to Request a Refund',
        paragraphs: [
          'Email support@theurbanphysio.com with booking ID (e.g. TUP-YYYYMMDD-XXXXXX), reason, and payment reference. Admin-reviewed refunds for edge cases are processed within 7–10 business days.',
        ],
      },
      {
        id: 'non-refundable',
        title: '6. Non-Refundable Cases',
        bullets: [
          'Completed sessions',
          'Partial sessions where treatment was delivered as agreed',
          'Chargebacks filed without prior support contact may lead to account suspension',
        ],
      },
    ],
  },

  medical: {
    key: 'medical',
    path: '/medical-disclaimer',
    title: 'Medical Disclaimer',
    subtitle: 'Important health information about using our platform and physiotherapy services.',
    icon: 'fa-heart-pulse',
    accent: 'from-rose-600 to-red-600',
    sections: [
      {
        id: 'not-emergency',
        title: '1. Not for Medical Emergencies',
        paragraphs: [
          'The Urban Physio is not an emergency service. If you experience chest pain, severe injury, numbness, loss of consciousness, or any life-threatening condition, call 112 / local emergency services immediately. Do not rely on online booking for urgent care.',
        ],
      },
      {
        id: 'professional-care',
        title: '2. Professional Judgment',
        paragraphs: [
          'Information on our website (treatments, conditions, FAQs) is educational and not a substitute for in-person diagnosis. Physiotherapists on our platform exercise independent clinical judgment during sessions.',
        ],
      },
      {
        id: 'no-guarantee',
        title: '3. No Guaranteed Outcomes',
        paragraphs: [
          'Recovery timelines vary by age, severity, compliance with exercises, and underlying conditions. We do not guarantee specific results from any treatment plan or number of sessions.',
        ],
      },
      {
        id: 'telehealth',
        title: '4. Online / Tele-Physiotherapy',
        bullets: [
          'Suitable for many musculoskeletal assessments and follow-ups; not appropriate for all conditions',
          'You must disclose relevant medical history, surgeries, and medications',
          'Therapist may recommend in-person or specialist referral if video assessment is insufficient',
        ],
      },
      {
        id: 'your-responsibility',
        title: '5. Your Responsibilities',
        bullets: [
          'Follow prescribed exercises within your physical limits; stop if sharp pain occurs',
          'Inform your therapist of pregnancy, osteoporosis, cardiac conditions, or other risks',
          'Obtain physician clearance post-surgery when advised',
        ],
      },
    ],
  },

  'data-security': {
    key: 'data-security',
    path: '/data-security',
    title: 'Data Security Policy',
    subtitle: 'Technical and organisational measures we use to safeguard your data.',
    icon: 'fa-lock',
    accent: 'from-orange-700 to-primary-800',
    sections: [
      {
        id: 'commitment',
        title: '1. Our Commitment',
        paragraphs: [
          'Protecting health and personal data is central to The Urban Physio. We implement security controls aligned with industry practice for healthcare technology platforms operating in India.',
        ],
      },
      {
        id: 'technical',
        title: '2. Technical Safeguards',
        bullets: [
          'HTTPS/TLS encryption for data in transit',
          'Password hashing (bcrypt) — we do not store plain-text passwords',
          'JWT-based authenticated API access with role-based permissions',
          'Payment card data handled only by PCI-DSS compliant Razorpay; not stored on our servers',
          'Regular dependency updates and secure hosting configuration',
        ],
      },
      {
        id: 'access',
        title: '3. Access Controls',
        bullets: [
          'Admin access limited to authorised personnel with audit logging',
          'Doctors access only their patients and appointments',
          'Patients access only their own records',
        ],
      },
      {
        id: 'incidents',
        title: '4. Incident Response',
        paragraphs: [
          'We maintain procedures to detect, contain, and notify affected users of data breaches as required by applicable law. Report suspected vulnerabilities to support@theurbanphysio.com.',
        ],
      },
      {
        id: 'your-role',
        title: '5. Your Role in Security',
        bullets: [
          'Use strong, unique passwords',
          'Log out on shared devices',
          'Do not share OTPs or payment links',
          'Report suspicious account activity immediately',
        ],
      },
    ],
  },

  service: {
    key: 'service',
    path: '/service-policy',
    title: 'Service Policy',
    subtitle: 'Standards for online, clinic, and home physiotherapy services on our platform.',
    icon: 'fa-handshake',
    accent: 'from-primary-600 to-orange-600',
    sections: [
      {
        id: 'scope',
        title: '1. Scope of Services',
        paragraphs: [
          'The Urban Physio enables three consultation modes: online video (Jitsi Meet), partner clinic visits, and home visits within doctor-defined service radius. Service availability varies by city and practitioner.',
        ],
      },
      {
        id: 'verification',
        title: '2. Doctor Verification',
        paragraphs: [
          'Physiotherapists must complete registration and admin verification before accepting paid bookings. We review license information and profile details; ongoing compliance is the responsibility of each practitioner.',
        ],
      },
      {
        id: 'booking',
        title: '3. Booking & Confirmation',
        bullets: [
          'Bookings may be pending until doctor accepts (where applicable)',
          'Confirmed bookings receive email with date, time, mode, and meeting/location details',
          'Unique booking ID (TUP-*) provided for support reference',
        ],
      },
      {
        id: 'quality',
        title: '4. Service Quality Standards',
        bullets: [
          'Punctuality: sessions should start within 15 minutes of scheduled time',
          'Professional conduct and confidentiality required at all times',
          'Accurate fee display matching consultation type selected',
          'Patients may rate sessions; repeated low ratings trigger admin review',
        ],
      },
      {
        id: 'support',
        title: '5. Customer Support',
        paragraphs: [
          'Support hours: Monday–Saturday, 8:00 AM – 8:00 PM IST. Email support@theurbanphysio.com or call +91 98765 43210. We aim to respond within 24 business hours.',
        ],
      },
      {
        id: 'modifications',
        title: '6. Service Changes',
        paragraphs: [
          'We may add, modify, or discontinue features with reasonable notice. Material changes affecting paid services will be communicated via email or platform notice.',
        ],
      },
    ],
  },

  cookie: {
    key: 'cookie',
    path: '/cookie-policy',
    title: 'Cookie Policy',
    subtitle: 'How we use cookies and similar technologies on The Urban Physio.',
    icon: 'fa-cookie-bite',
    accent: 'from-amber-500 to-orange-600',
    sections: [
      {
        id: 'what',
        title: '1. What Are Cookies?',
        paragraphs: [
          'Cookies are small text files stored on your device when you visit a website. They help remember preferences, keep you logged in, and understand how the site is used.',
        ],
      },
      {
        id: 'types',
        title: '2. Cookies We Use',
        bullets: [
          'Essential: authentication tokens (localStorage/session), security, load balancing',
          'Functional: selected city/location, UI preferences',
          'Analytics: aggregated usage statistics (if enabled) to improve performance',
          'Third-party: Razorpay checkout, map providers (e.g. OpenStreetMap/Leaflet tiles) may set their own cookies',
        ],
      },
      {
        id: 'control',
        title: '3. Managing Cookies',
        paragraphs: [
          'You can block or delete cookies via browser settings. Note that disabling essential cookies may prevent login and booking. Refer to your browser help section for Chrome, Firefox, Safari, or Edge.',
        ],
      },
      {
        id: 'updates',
        title: '4. Updates',
        paragraphs: [
          'We may update this Cookie Policy periodically. The "Last updated" date at the top reflects the latest revision.',
        ],
      },
    ],
  },

  medicoLegal: {
    key: 'medico-legal',
    path: '/medico-legal-terms',
    title: 'Medico-Legal Terms',
    subtitle: 'Professional, clinical, and legal obligations for healthcare providers on The Urban Physio.',
    icon: 'fa-scale-balanced',
    accent: 'from-slate-700 to-slate-900',
    sections: [
      {
        id: 'scope',
        title: '1. Scope & Applicability',
        paragraphs: [
          'These Medico-Legal Terms apply to physiotherapists, clinic partners, and other licensed healthcare providers ("Providers") who register or practise on The Urban Physio platform in India.',
          'By registering as a doctor or clinic partner, you confirm you have authority to bind yourself and, where applicable, your clinic to these terms.',
        ],
      },
      {
        id: 'licensure',
        title: '2. Licensure & Professional Standards',
        bullets: [
          'You must hold valid registration with the relevant State Council / licensing body for physiotherapy in India',
          'You will practise within your scope of training and applicable clinical guidelines',
          'You must maintain professional indemnity cover where required by law or your council',
          'You will not misrepresent qualifications, experience, or clinic facilities',
        ],
      },
      {
        id: 'clinical-duty',
        title: '3. Clinical Duty of Care',
        paragraphs: [
          'Treatment decisions remain solely yours. The Urban Physio is a technology platform and does not direct clinical care, diagnosis, or treatment plans.',
          'You must obtain informed consent, maintain appropriate records, and refer patients when care exceeds your competence or licence.',
        ],
      },
      {
        id: 'data',
        title: '4. Patient Data & Confidentiality',
        bullets: [
          'Patient health information must be handled per applicable law, including the Digital Personal Data Protection Act, 2023 and professional ethics',
          'Access patient data only for legitimate treatment, billing, or legal purposes',
          'Report data breaches affecting patients without undue delay',
        ],
      },
      {
        id: 'liability',
        title: '5. Liability & Indemnity',
        paragraphs: [
          'You are independently responsible for clinical outcomes, negligence claims, and regulatory compliance arising from your practice.',
          'You agree to indemnify The Urban Physio against claims arising from your clinical acts, omissions, or misrepresentation of credentials, except where liability cannot be limited under applicable law.',
        ],
      },
      {
        id: 'platform',
        title: '6. Platform Rules',
        bullets: [
          'Fees, availability, and profile information must be accurate',
          'No off-platform solicitation that circumvents patient safety or payment protections where prohibited',
          'Cooperate with verification, audit, and complaint-resolution processes',
        ],
      },
    ],
  },

  patientRegistration: {
    key: 'patient-registration',
    path: '/patient-registration-terms',
    title: 'Patient Registration Terms',
    subtitle: 'Terms specific to creating a patient account on The Urban Physio.',
    icon: 'fa-user',
    accent: 'from-primary-600 to-orange-600',
    sections: [
      {
        id: 'eligibility',
        title: '1. Who May Register',
        paragraphs: [
          'Patient accounts are for individuals seeking physiotherapy services. If you are a physiotherapist or clinic representative, you must use the doctor or clinic partner registration pages instead.',
        ],
      },
      {
        id: 'accuracy',
        title: '2. Accurate Information',
        bullets: [
          'Provide truthful name, contact, and health-related booking information',
          'Keep your login credentials secure',
          'Notify us of unauthorised account use',
        ],
      },
      {
        id: 'booking',
        title: '3. Bookings & Payments',
        paragraphs: [
          'Appointments are subject to provider availability and our Refund & Cancellation Policy. Online consultations require a suitable device and internet connection.',
        ],
      },
      {
        id: 'health',
        title: '4. Not Emergency Care',
        paragraphs: [
          'The platform is not for medical emergencies. Call local emergency services or visit the nearest hospital in urgent situations.',
        ],
      },
    ],
  },

  doctorRegistration: {
    key: 'doctor-registration',
    path: '/doctor-registration-terms',
    title: 'Doctor Registration Terms',
    subtitle: 'Terms for physiotherapists registering as independent practitioners.',
    icon: 'fa-user-doctor',
    accent: 'from-violet-600 to-indigo-700',
    sections: [
      {
        id: 'eligibility',
        title: '1. Provider Eligibility',
        paragraphs: [
          'Doctor registration is only for licensed physiotherapists. You must not register as a patient if you intend to practise as a provider.',
        ],
      },
      {
        id: 'verification',
        title: '2. Verification',
        bullets: [
          'Profiles may remain hidden until Urban Physio verifies your credentials',
          'You agree to submit licence/registration proof when requested',
          'False credentials may result in immediate suspension',
        ],
      },
      {
        id: 'fees',
        title: '3. Fees & Payouts',
        paragraphs: [
          'You set consultation fees displayed on your profile. Platform commissions, taxes, and payout schedules are described in the Service Policy and your provider agreement.',
        ],
      },
      {
        id: 'medico',
        title: '4. Medico-Legal Compliance',
        paragraphs: [
          'You also accept our Medico-Legal Terms, which govern clinical practice, patient confidentiality, and professional liability on the platform.',
        ],
      },
    ],
  },

  clinicRegistration: {
    key: 'clinic-registration',
    path: '/clinic-registration-terms',
    title: 'Clinic Registration Terms',
    subtitle: 'Terms for physiotherapy clinics and rehabilitation centres joining as partners.',
    icon: 'fa-hospital',
    accent: 'from-emerald-600 to-teal-700',
    sections: [
      {
        id: 'eligibility',
        title: '1. Clinic Partner Eligibility',
        paragraphs: [
          'Clinic registration is for authorised representatives of physiotherapy clinics or rehabilitation centres. You confirm you have authority to register the clinic and bind it to these terms.',
        ],
      },
      {
        id: 'listing',
        title: '2. Clinic Listing & Accuracy',
        bullets: [
          'Clinic name, address, photos, and services must be accurate and not misleading',
          'Only list doctors who are employed or affiliated and have consented to appear',
          'Maintain valid registrations for the clinical establishment where required',
        ],
      },
      {
        id: 'operations',
        title: '3. Operations & Appointments',
        paragraphs: [
          'You are responsible for honouring confirmed bookings, hygiene standards, and patient safety at the premises. Urban Physio facilitates bookings but does not operate your clinic.',
        ],
      },
      {
        id: 'medico',
        title: '4. Medico-Legal & Staff',
        paragraphs: [
          'Clinic partners accept the Medico-Legal Terms and ensure affiliated physiotherapists comply with professional and data-protection obligations.',
        ],
      },
    ],
  },
};

export function getPolicyByPath(pathname) {
  return Object.values(POLICY_PAGES).find((p) => p.path === pathname) || null;
}
