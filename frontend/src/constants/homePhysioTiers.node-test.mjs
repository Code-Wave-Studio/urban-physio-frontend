/**
 * Home Physiotherapy tier consistency (CRF-2026-0006 step 5).
 * Run: node frontend/src/constants/homePhysioTiers.node-test.mjs
 */
import {
  alignHomePhysioTierSections,
  applyPricingSessionsToTiers,
  faqsWithLivePrices,
  homePhysioTierBookLink,
  textWithLivePrices,
  tierButtonLabel,
} from './homePhysioTiers.js';
import { isSectionOn } from './sectionVisibility.js';

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

const stale = alignHomePhysioTierSections({
  tiers: [
    {
      key: 'certified',
      name: 'Certified Physio',
      price: '₹1,200',
      original: '₹1,500',
      cta_link: '/book?type=home_visit&mode=home-visit&tier=certified',
    },
    {
      key: 'senior',
      name: 'Senior Physio',
      price: '₹1,500',
      original: '₹1,800',
      cta_link: '/book?type=home_visit&mode=home-visit&tier=senior',
    },
    {
      key: 'specialist',
      name: 'Specialist Consultant',
      price: '₹2,000',
      original: '₹2,500',
      cta_link: '/book?type=home_visit&mode=home-visit&tier=specialist',
    },
  ],
  pricing_sessions: [
    { name: 'Certified Physio', original: '₹1,200', price: '₹1000' },
    { name: 'Senior Physio', original: '₹1,500', price: '₹1,200' },
    { name: 'Specialist Consultant', original: '₹1,800', price: '₹1,500' },
  ],
});

check('certified key stays certified', stale.tiers[0].key === 'certified');
check('senior key stays senior', stale.tiers[1].key === 'senior');
check('specialist key stays specialist', stale.tiers[2].key === 'specialist');
check('certified display price is ₹1,200', stale.tiers[0].price === '₹1,200');
check('senior display price is ₹1,500', stale.tiers[1].price === '₹1,500');
check('specialist display price is ₹2,000', stale.tiers[2].price === '₹2,000');
check(
  'pricing cards follow tier prices, not the stale session list',
  stale.pricing_sessions.map((row) => row.price).join(',') === '₹1,200,₹1,500,₹2,000'
);
check(
  'existing tier booking URLs are unchanged',
  stale.tiers[0].cta_link === '/book?type=home_visit&mode=home-visit&tier=certified'
    && stale.tiers[1].cta_link === '/book?type=home_visit&mode=home-visit&tier=senior'
    && stale.tiers[2].cta_link === '/book?type=home_visit&mode=home-visit&tier=specialist'
);

const custom = alignHomePhysioTierSections({
  tiers: [{ key: 'certified', name: 'Certified Physio', price: '₹1,350', original: '₹1,500' }],
});
check('CMS tier price is kept when the backend already has one', custom.tiers[0].price === '₹1,350');
check('missing senior tier falls back to ₹1,500', custom.tiers[1].price === '₹1,500' && custom.tiers[1].key === 'senior');
check('missing specialist tier falls back to ₹2,000', custom.tiers[2].price === '₹2,000');
check(
  'repaired booking link keeps the tier id',
  homePhysioTierBookLink('certified', '/book?type=home_visit&mode=home-visit')
    === '/book?type=home_visit&mode=home-visit&tier=certified'
);

const edited = applyPricingSessionsToTiers(stale.tiers, [
  { name: 'Certified Physio', original: '₹1,500', price: '₹1,250' },
  { name: 'Senior Physio', original: '₹1,800', price: '₹1,500' },
  { name: 'Specialist Consultant', original: '₹2,500', price: '₹2,000' },
]);
check('pricing-tab edit writes back to the certified tier', edited[0].price === '₹1,250');
check(
  'pricing-tab edit updates the matching button label',
  edited[0].cta_label === 'Book a Certified Physio — ₹1,250'
);

const liveTiers = [
  { key: 'certified', price: '₹1,100' },
  { key: 'senior', price: '₹1,450' },
  { key: 'specialist', price: '₹2,100' },
];
const livePackages = [
  { name: 'Certified', price: '₹15,999' },
  { name: 'Senior', price: '₹19,999' },
  { name: 'Specialist', price: '₹26,999' },
];
const rewritten = textWithLivePrices(
  'Certified Physio (₹1,200). Senior Physio (₹1,500). Specialist Consultant (₹2,000). Packages ₹16,499, ₹19,999, and ₹26,999.',
  liveTiers,
  livePackages
);
check(
  'stored FAQ copy uses the current CMS prices',
  rewritten === 'Certified Physio (₹1,100). Senior Physio (₹1,450). Specialist Consultant (₹2,100). Packages ₹15,999, ₹19,999, and ₹26,999.'
);
check(
  'unchanged package amount is left alone',
  rewritten.includes('₹19,999') && rewritten.includes('₹26,999')
);
const swapped = textWithLivePrices('A ₹1,200 then B ₹1,500', [
  { key: 'certified', price: '₹1,500' },
  { key: 'senior', price: '₹1,200' },
  { key: 'specialist', price: '₹2,000' },
], []);
check('price swap does not collide', swapped === 'A ₹1,500 then B ₹1,200');
check(
  'button label follows the CMS price',
  tierButtonLabel({ name: 'Certified Physio', price: '₹1,100', cta_label: 'Book a Certified Physio — ₹1,200' })
    === 'Book a Certified Physio — ₹1,100'
);
check(
  'button label keeps a custom label that already includes the CMS price',
  tierButtonLabel({ name: 'Certified Physio', price: '₹1,100', cta_label: 'Book certified — ₹1,100 today' })
    === 'Book certified — ₹1,100 today'
);
const faqRows = faqsWithLivePrices(
  [{ q: 'Rates?', a: 'Certified Physio (₹1,200) per visit.' }],
  liveTiers,
  livePackages
);
check('FAQ helper rewrites only the answer', faqRows[0].q === 'Rates?' && faqRows[0].a === 'Certified Physio (₹1,100) per visit.');
check('missing section flag stays visible', isSectionOn({}, 'hero_enabled') === true);
check('section flag off hides the section', isSectionOn({ hero_enabled: '0' }, 'hero_enabled') === false);
check('section flag on shows the section', isSectionOn({ story_enabled: '1' }, 'story_enabled') === true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
