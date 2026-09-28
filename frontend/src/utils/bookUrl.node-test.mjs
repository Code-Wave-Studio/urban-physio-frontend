/**
 * Booking handoff checks for Home Physiotherapy → BookAppointmentWizard.
 * Run: node frontend/src/utils/bookUrl.node-test.mjs
 */
import {
  preferredClinicMayOverride,
  readHomePhysioTier,
  resolveBookingConsultationType,
} from './bookUrl.js';

let passed = 0;
let failed = 0;

function check(label, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

check(
  'case 1/2 home visit stays home_visit',
  resolveBookingConsultationType('home_visit', 'home-visit') === 'home_visit'
);
check(
  'explicit home visit blocks preferred clinic',
  preferredClinicMayOverride('home_visit', 'home-visit') === false
);
check(
  'mode=home-visit alone maps to home_visit',
  resolveBookingConsultationType('', 'home-visit') === 'home_visit'
    && preferredClinicMayOverride('', 'home-visit') === false
);
check(
  'type=home_visit alone stays home_visit',
  resolveBookingConsultationType('home_visit', '') === 'home_visit'
    && preferredClinicMayOverride('home_visit', '') === false
);

check(
  'case 3 telephysio maps to online',
  resolveBookingConsultationType('online', 'telephysio') === 'online'
);
check(
  'telephysio blocks preferred clinic',
  preferredClinicMayOverride('online', 'telephysio') === false
);
check(
  'mode=telephysio alone maps to online',
  resolveBookingConsultationType('', 'telephysio') === 'online'
);

check(
  'case 4 plain clinic booking still allows preferred clinic',
  preferredClinicMayOverride('', '') === true
    && preferredClinicMayOverride('clinic', '') === true
    && preferredClinicMayOverride('clinic', 'clinic') === true
);
check(
  'type wins when both are present',
  resolveBookingConsultationType('clinic', 'home-visit') === 'clinic'
    && preferredClinicMayOverride('clinic', 'home-visit') === true
);

check('case 5 tier key is preserved', readHomePhysioTier('senior') === 'senior');
check('tier key is normalised', readHomePhysioTier('Certified') === 'certified');
check('case 6 missing tier stays empty', readHomePhysioTier('') === '' && readHomePhysioTier(null) === '');
check('unsafe tier value is ignored', readHomePhysioTier('senior<script>') === '');
check('tier is not treated as a price object', readHomePhysioTier('₹1,200') === '');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
