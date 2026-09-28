/**
 * Home Physiotherapy tier consistency (CRF-2026-0006 step 5).
 * Run: node frontend/src/constants/homePhysioTiers.node-test.mjs
 */
import {
  alignHomePhysioTierSections,
  applyPricingSessionsToTiers,
  homePhysioTierBookLink,
} from './homePhysioTiers.js';

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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
