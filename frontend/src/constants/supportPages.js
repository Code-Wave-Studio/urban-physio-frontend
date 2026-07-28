/** Shared content for FAQ, Contact, Cancellation Help */

export const CONTACT_INFO = {
  email: 'support@theurbanphysio.com',
  phone: '+91 98765 43210',
  whatsapp: '+919876543210',
  hours: 'Monday - Saturday, 8:00 AM - 8:00 PM IST',
  address: 'The Urban Physio | India (pan-India online and clinic network)',
};

export const SITE_FAQS = [
  {
    q: 'How do I book a physiotherapy session?',
    a: 'Sign in, choose your city, pick a verified doctor, select online (Zoom video call), clinic, or home visit, then complete the booking wizard and pay via Razorpay. You receive email confirmation with your booking ID and session details.',
    icon: 'fa-calendar-check',
  },
  {
    q: 'Do I need an account to book?',
    a: 'Yes. Creating a free patient account lets us secure your health data, send confirmations, and manage payments. You will be prompted to login or register before opening the booking form.',
    icon: 'fa-user',
  },
  {
    q: 'What is the difference between online, clinic & home visits?',
    a: 'Online sessions are live video consultations from home. Clinic visits are in-person at partner clinics. Home visits send a licensed physiotherapist to your address — ideal when mobility is limited.',
    icon: 'fa-house-medical',
  },
  {
    q: 'Are your physiotherapists verified?',
    a: 'Yes. Every doctor is license-verified by our admin team before accepting paid bookings. View qualifications, specialization, ratings, and fees on each profile.',
    icon: 'fa-circle-check',
  },
  {
    q: 'Which cities do you serve?',
    a: 'We operate across major Indian cities including Mumbai, Delhi, Bangalore, Pune, and more. Set your location on the home page to see doctors near you.',
    icon: 'fa-map-location-dot',
  },
  {
    q: 'Is payment secure? Can I get a refund?',
    a: 'Payments use Razorpay with industry-standard encryption. Refunds follow our Refund & Cancellation Policy based on who cancels and how far in advance. See Cancellation Help for quick timelines.',
    icon: 'fa-lock',
  },
  {
    q: 'How do I cancel or reschedule?',
    a: 'For pending bookings, your doctor may accept or reject from their dashboard. To cancel a confirmed session, email support with your booking ID (TUP-…). Refund eligibility depends on notice period — see Cancellation Help.',
    icon: 'fa-calendar-xmark',
  },
  {
    q: 'What should I bring to a clinic visit?',
    a: 'Bring any MRI/X-ray reports, doctor referral or discharge summary if you have one, comfortable clothing, and a list of medications. Arrive 10 minutes early for check-in.',
    icon: 'fa-briefcase-medical',
  },
  {
    q: 'How do online sessions work?',
    a: 'After booking, you receive a secure video call link by email. Use a stable internet connection, good lighting, and space to move. Your physio may guide exercises on camera.',
    icon: 'fa-video',
  },
  {
    q: 'Do I need a doctor’s referral?',
    a: 'Not required for most musculoskeletal issues. For post-surgery or neurological rehab, prior reports help your therapist plan safer care.',
    icon: 'fa-file-medical',
  },
];

export const CANCELLATION_TIMELINE = [
  {
    id: 'patient-early',
    title: 'Patient cancels 24+ hours before',
    refund: '100% refund',
    detail: 'Processed to your original payment method within 5–7 business days via Razorpay.',
    icon: 'fa-check-circle',
    color: 'emerald',
  },
  {
    id: 'patient-late',
    title: 'Patient cancels 12–24 hours before',
    refund: '50% refund',
    detail: 'Remaining 50% is retained as a cancellation fee.',
    icon: 'fa-clock',
    color: 'amber',
  },
  {
    id: 'patient-noshow',
    title: 'Under 12 hours or no-show',
    refund: 'No refund',
    detail: 'Except exceptional cases reviewed by support (medical emergency with proof).',
    icon: 'fa-ban',
    color: 'red',
  },
  {
    id: 'doctor-cancel',
    title: 'Doctor or clinic cancels',
    refund: '100% refund',
    detail: 'Automatic full refund. We will help you rebook with another verified physio if you wish.',
    icon: 'fa-user-doctor',
    color: 'primary',
  },
  {
    id: 'home-visit',
    title: 'Home visit — therapist dispatched',
    refund: 'Up to 30% fee',
    detail: 'If you cancel after the therapist has left for your address, a travel fee may apply.',
    icon: 'fa-house-medical',
    color: 'violet',
  },
];

export const CANCELLATION_STEPS = [
  {
    step: '01',
    title: 'Find your booking ID',
    desc: 'Check your confirmation email — format TUP-YYYYMMDD-XXXXXX. Also visible in Patient Dashboard → Appointments.',
    icon: 'fa-hashtag',
  },
  {
    step: '02',
    title: 'Email support',
    desc: `Write to ${CONTACT_INFO.email} with your booking ID, reason, and registered mobile number.`,
    icon: 'fa-envelope',
  },
  {
    step: '03',
    title: 'Wait for confirmation',
    desc: 'Our team reviews within 24 business hours and confirms refund amount and timeline.',
    icon: 'fa-hourglass-half',
  },
  {
    step: '04',
    title: 'Receive refund',
    desc: 'Approved refunds return to your original payment method in 5–10 business days.',
    icon: 'fa-indian-rupee-sign',
  },
];

export const CONTACT_SUBJECTS = [
  'General enquiry',
  'Booking help',
  'Cancellation / refund',
  'Payment issue',
  'Doctor verification',
  'Technical problem',
  'Partnership / clinic',
  'Other',
];
