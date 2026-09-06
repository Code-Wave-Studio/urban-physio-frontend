/**
 * Default Offers & Campaign page content (CRF-2026-0006).
 * Campaign: "Run 10 KM & Get Free Physiotherapy Sessions"
 */

export const OFFERS_SEO = {
  title: 'Run 10 KM & Get Free Physiotherapy Sessions | The Urban Physio',
  description:
    'Run 10 KM, submit your run proof and get a chance to receive free physiotherapy sessions through The Urban Physio campaign.',
  keywords:
    'run 10k free physiotherapy, running recovery, physiotherapy offers, sports physio campaign, The Urban Physio offers, marathon recovery physio, runner injury prevention',
};

export const OFFERS_DEFAULTS = {
  hero_title: 'Run 10 KM. Get Free Physiotherapy Sessions.',
  hero_subtitle:
    'Complete your 10 KM run and take a step toward better recovery with free physiotherapy sessions from The Urban Physio.',
  hero_image: '',
  seo_title: OFFERS_SEO.title,
  seo_description: OFFERS_SEO.description,
  sections: {
    hero_badge: 'Exclusive Fitness & Recovery Campaign',
    hero_primary_cta_label: 'Join the Campaign',
    hero_primary_cta_action: 'scroll_form',
    hero_secondary_cta_label: 'Learn How It Works',
    hero_secondary_cta_action: 'scroll_steps',
    hero_highlights: [
      { label: 'Target Distance', value: '10 KM', icon: 'fa-person-running' },
      { label: 'Reward', value: 'Free Physiotherapy', icon: 'fa-gift' },
      { label: 'Process', value: 'Run • Submit • Verify • Redeem', icon: 'fa-check-double' },
    ],

    // Campaign Highlights (4 visual cards)
    highlights_heading: 'Campaign Overview',
    highlights_subheading:
      'A simple, transparent 4-step campaign designed to reward your active lifestyle with expert clinical recovery.',
    highlights_cards: [
      {
        step: '01',
        icon: 'fa-person-running',
        title: 'Run 10 KM',
        description: 'Complete your 10 KM run outdoor, on track, or on a verified treadmill.',
      },
      {
        step: '02',
        icon: 'fa-cloud-arrow-up',
        title: 'Submit Proof',
        description: 'Upload screenshot or exported activity record from your fitness app.',
      },
      {
        step: '03',
        icon: 'fa-user-doctor',
        title: 'Get Verified',
        description: 'The Urban Physio clinical team verifies your distance and run details.',
      },
      {
        step: '04',
        icon: 'fa-award',
        title: 'Claim Reward',
        description: 'Receive your eligible free physiotherapy session voucher code.',
      },
    ],

    // How It Works (5 detailed steps)
    how_heading: 'How It Works',
    how_subheading:
      'Follow these five steps to participate and redeem your physiotherapy recovery session.',
    how_steps: [
      {
        step: '01',
        title: 'Run 10 KM',
        summary: 'Complete the required 10 KM run anytime during the campaign period.',
        details:
          'Track your run with any standard fitness tracker or running app (Strava, Nike Run Club, Garmin, Apple Fitness, Samsung Health, etc.).',
        icon: 'fa-person-running',
      },
      {
        step: '02',
        title: 'Submit Your Run',
        summary: 'Submit the required information and proof through the campaign submission form.',
        details:
          'Fill out your contact details, run date, exact distance completed, and attach an activity screenshot or summary file.',
        icon: 'fa-file-arrow-up',
      },
      {
        step: '03',
        title: 'Verification',
        summary: 'The The Urban Physio team reviews the submission.',
        details:
          'Our clinical administration team reviews the submitted activity timestamp, metrics, and participant information for validity.',
        icon: 'fa-magnifying-glass-chart',
      },
      {
        step: '04',
        title: 'Approval',
        summary: 'If the submission satisfies the campaign requirements, it is approved.',
        details:
          'You will receive an approval confirmation and live status update in your tracking portal.',
        icon: 'fa-circle-check',
      },
      {
        step: '05',
        title: 'Claim Your Reward',
        summary: 'Approved participants can claim/redeem their eligible physiotherapy reward.',
        details:
          'Book your free physiotherapy assessment or recovery consultation with our qualified physiotherapists at clinic or online.',
        icon: 'fa-gift',
      },
    ],

    // Campaign Benefits
    benefits_heading: 'Why Join the Campaign?',
    benefits_subheading: 'Combining fitness motivation with evidence-based physiotherapy recovery.',
    benefits: [
      {
        title: 'Promote an Active Lifestyle',
        description: 'Challenge yourself to reach your 10 KM fitness milestone with positive reinforcement.',
        icon: 'fa-heart-pulse',
      },
      {
        title: 'Professional Physiotherapy Support',
        description: 'Consult with licensed, qualified physiotherapists for thorough musculoskeletal evaluation.',
        icon: 'fa-user-doctor',
      },
      {
        title: 'Understand Recovery & Injury Prevention',
        description: 'Gain expert insights into gait mechanics, post-run muscle soreness, mobility, and joint health.',
        icon: 'fa-shield-halved',
      },
      {
        title: 'Track Your Participation',
        description: 'Check your submission status live with our real-time verification tracker.',
        icon: 'fa-list-check',
      },
      {
        title: 'Access Campaign Rewards',
        description: 'Redeem your complimentary physiotherapy session seamlessly via our booking platform.',
        icon: 'fa-tags',
      },
    ],

    // Eligibility & Campaign Rules (Configurable from admin)
    eligibility_heading: 'Eligibility & Campaign Rules',
    eligibility_subheading: 'Please review the participation requirements and verification guidelines.',
    campaign_status: 'active',
    start_date: '2026-09-01',
    end_date: '2026-12-31',
    required_distance_km: '10.0',
    accepted_proof_types:
      'Strava, Nike Run Club, Garmin, Apple Health, Samsung Health, Google Fit, or GPS running watch export (JPG, PNG, WebP, PDF)',
    reward_details: '1 Complimentary Clinical Physiotherapy Assessment & Recovery Session',
    reward_validity_days: '60',
    rules: [
      'Participants must complete a single recorded run of at least 10 KM.',
      'The run proof must clearly display the total distance, date of run, and elapsed time.',
      'Only one submission per participant is eligible for reward redemption during this campaign cycle.',
      'Submissions are typically reviewed and verified by our clinical desk within 24 to 48 business hours.',
      'Reward sessions can be redeemed for in-clinic or TelePhysio consultation as per appointment availability.',
      'Campaign eligibility and verification requirements may apply as determined by The Urban Physio administration.',
    ],
    terms_text:
      'The Urban Physio reserves the right to verify activity logs and disqualify tampered or duplicate entries. Free sessions are non-transferable and cannot be exchanged for cash or credit.',

    // Participation Form Copy
    form_badge: 'Participation Desk',
    form_heading: 'Submit Your 10 KM Run Proof',
    form_subheading:
      'Fill in your activity details and upload your run proof for verification by our clinical administration.',
    form_consent_text:
      'I confirm that I have completed the 10 KM run, the uploaded activity details are authentic, and I agree to the campaign terms & conditions of The Urban Physio.',
    form_success_message:
      'Your 10 KM campaign submission has been received and is currently under review by our clinical team.',

    // Live Status Tracker Copy
    status_heading: 'Check Live Submission Status',
    status_subheading: 'Already submitted? Check your verification and reward status in real time.',
    status_search_placeholder: 'Enter Submission ID, Email, or Phone number',

    // FAQs
    faqs_badge: 'Got Questions?',
    faqs_heading: 'Frequently Asked Questions',
    faqs_subheading:
      'Everything you need to know about participation, verification, and claiming your reward.',
    faqs: [
      {
        q: 'What is the Run 10 KM & Get Free Physiotherapy campaign?',
        a: 'It is a special health initiative by The Urban Physio encouraging runners and active individuals to maintain peak performance. By completing a 10 KM run and submitting verified proof, you become eligible for complimentary professional physiotherapy consultation and recovery support.',
      },
      {
        q: 'How do I participate?',
        a: 'Simply complete your 10 KM run, take a clear screenshot or export of your run summary from your fitness app (showing distance, date, and time), and submit the form on this page.',
      },
      {
        q: 'How do I submit my run proof?',
        a: 'Use the submission form on this page. Enter your full name, email, contact number, run date, completed distance, and upload your activity screenshot (JPG, PNG, WebP, or PDF format).',
      },
      {
        q: 'How is my submission verified?',
        a: 'Our administration team reviews your uploaded proof to confirm that the required distance was completed on the stated date with a valid activity record.',
      },
      {
        q: 'How will I know if my submission is approved?',
        a: 'You can check your live submission status directly on this page using your Submission ID or registered phone number. We also notify verified participants directly.',
      },
      {
        q: 'What happens after my submission is approved?',
        a: 'Once approved, your reward status changes to "Eligible" or "Approved", and you will receive instructions on how to book your complimentary physiotherapy session.',
      },
      {
        q: 'How do I claim my reward?',
        a: 'You can use the booking link provided with your verified submission to schedule your session with a qualified physiotherapist at our partner clinics or online via TelePhysio.',
      },
      {
        q: 'Is there a campaign validity period?',
        a: 'Yes, runs must be completed within the active campaign dates set by the administration, and approved reward sessions must be redeemed within the validity window.',
      },
      {
        q: 'Can I participate more than once?',
        a: 'Each participant may claim one promotional reward session per active campaign cycle unless otherwise specified by campaign administrators.',
      },
      {
        q: 'Who can participate?',
        a: 'The campaign is open to all fitness enthusiasts, runners, and individuals interested in structured physical wellness and injury-free recovery.',
      },
    ],

    // Final CTA
    final_heading: 'Ready to Run 10 KM?',
    final_subheading:
      'Complete your run, submit your proof, and take the next step toward better recovery with The Urban Physio.',
    final_primary_cta_label: 'Join the Campaign',
    final_primary_cta_action: 'scroll_form',

    // Section Visibility
    sections_visibility: {
      highlights: true,
      how_it_works: true,
      benefits: true,
      eligibility: true,
      submission_form: true,
      status_tracker: true,
      faqs: true,
      final_cta: true,
    },
  },
};

export function mergeOffersSections(raw = {}) {
  const defaults = OFFERS_DEFAULTS.sections;
  const merged = { ...defaults, ...(raw || {}) };
  const listKeys = [
    'hero_highlights',
    'highlights_cards',
    'how_steps',
    'benefits',
    'rules',
    'faqs',
  ];
  listKeys.forEach((key) => {
    if (!Array.isArray(merged[key]) || merged[key].length === 0) {
      merged[key] = defaults[key];
    }
  });
  merged.sections_visibility = {
    ...defaults.sections_visibility,
    ...(raw?.sections_visibility || {}),
  };
  return merged;
}
