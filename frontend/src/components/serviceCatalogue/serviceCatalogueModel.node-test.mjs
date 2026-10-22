/**
 * Run: node frontend/src/components/serviceCatalogue/serviceCatalogueModel.node-test.mjs
 */
import {
  activePrice,
  applyChipFilter,
  chipInterest,
  bookingDestinationNote,
  bookingUrlError,
  fillBookingTemplate,
  filterBookableSlots,
  isSafeBookingUrl,
  resolveServiceBookingUrl,
  orderChipsForVisit,
  phaseBarSegments,
  planSavings,
  homeQuickPickCopy,
  quickPickCopy,
  rankQuickPicks,
  slotInsideLead,
  textHasBlockedClaim,
} from './serviceCatalogueModel.js';

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

const now = new Date('2026-10-15T10:00:00+05:30');

const price = activePrice(1000, 800, null, null, now);
check('offer save is calculated', price.save === 200 && price.percent === 20 && price.display === 800);
check('expired offer uses regular price', activePrice(1000, 800, null, '2026-10-01', now).display === 1000);
check('future offer is not shown yet', activePrice(1000, 800, '2026-11-01', null, now).showOffer === false);
check('equal offer is not a discount', activePrice(1000, 1000, null, null, now).showOffer === false);

const plan = planSavings([4499, 4500, 5000], 7999);
check('plan save is phase sum minus full price', plan.save === 4499 + 4500 + 5000 - 7999);
check('plan save is never negative', planSavings([1000], 2000).save === 0);

const widths = phaseBarSegments([
  { weekFrom: 0, weekTo: 4 },
  { weekFrom: 4, weekTo: 16 },
]);
check('phase bar widths follow week ranges', Math.round(widths[0]) === 25 && Math.round(widths[1]) === 75);

check('blocks cure claims', textHasBlockedClaim('guaranteed cure') && textHasBlockedClaim('100% relief'));
check('ordinary clinical text is allowed', !textHasBlockedClaim('Reduce pain and move more freely'));

const sections = [
  {
    id: 1,
    items: [
      { id: 1, chipKeys: ['knee'], chipOrder: { knee: 1 }, adminIndex: 0 },
      { id: 2, chipKeys: ['back'], chipOrder: { back: 0 }, adminIndex: 1 },
    ],
  },
  { id: 2, items: [{ id: 3, chipKeys: ['knee'], chipOrder: { knee: 0 }, adminIndex: 2 }] },
  { id: 3, items: [{ id: 4, chipKeys: ['neck'], chipOrder: { neck: 0 }, adminIndex: 3 }] },
];
const filtered = applyChipFilter(sections, 'knee');
check('chip filter keeps section order and chip order', filtered.flatMap((section) => section.items).map((item) => item.id).join(',') === '1,3');
check('empty sections are hidden', filtered.length === 2 && !filtered.some((section) => section.id === 3));
check('no chip shows every section', applyChipFilter(sections, '').length === 3);

const chips = [
  { key: 'ai', pinned: true, sortOrder: 0 },
  { key: 'knee', pinned: false, sortOrder: 2 },
  { key: 'back', pinned: false, sortOrder: 1 },
];
const interest = chipInterest(
  [{ id: 10 }, { id: 11 }],
  { 10: [{ key: 'knee' }], 11: [{ key: 'knee' }, { key: 'back' }] },
  'back'
);
check('source chip adds 2 and views use 1/(i+1)', interest.knee === 1 + 0.5 && interest.back === 0.5 + 2);
const ordered = orderChipsForVisit(chips, interest).map((chip) => chip.key);
check('pinned chips stay first', ordered[0] === 'ai' && ordered[1] === 'back');

const items = [
  { id: 1, adminIndex: 0, rating: 4.9, badge: 'Most chosen', bookingsLast30Days: 10, primaryChipKey: 'knee' },
  { id: 2, adminIndex: 1, rating: 4.9, badge: '', bookingsLast30Days: 0, primaryChipKey: 'back' },
  { id: 3, adminIndex: 2, rating: 4.0, badge: '', bookingsLast30Days: 0, primaryChipKey: 'knee' },
];
const chipsByItemId = {
  1: [{ key: 'knee', isPrimary: true }],
  2: [{ key: 'back', isPrimary: true }],
  3: [{ key: 'knee', isPrimary: true }],
};
const ranked = rankQuickPicks({
  items,
  chipsByItemId,
  selectedChipKey: 'knee',
  sourceChipKey: '',
  recentViews: [{ id: 1, title: 'Knee' }, { id: 2, title: 'Back' }],
  pairsByItemId: { 2: [3], 1: [] },
});
check('quick picks return at most 12', ranked.length <= 12);
check('most recently viewed item is penalised', ranked.find((item) => item.id === 1).suggestionScore < ranked.find((item) => item.id === 3).suggestionScore + 5);
const kneeOnly = rankQuickPicks({
  items: items.filter((item) => (chipsByItemId[item.id] || []).some((chip) => chip.key === 'knee')),
  chipsByItemId,
  selectedChipKey: 'knee',
  recentViews: [],
  pairsByItemId: {},
});
check('filtered candidates exclude other chips', kneeOnly.every((item) => item.id !== 2));
check('co-booked item is marked', rankQuickPicks({
  items,
  chipsByItemId,
  recentViews: [{ id: 2, title: 'Back' }],
  pairsByItemId: { 2: [3] },
}).find((item) => item.id === 3).oftenBookedTogether === true);

const tie = rankQuickPicks({
  items: [
    { id: 8, adminIndex: 2, rating: 4.5 },
    { id: 9, adminIndex: 1, rating: 4.5 },
  ],
  chipsByItemId: { 8: [], 9: [] },
  recentViews: [],
  pairsByItemId: {},
});
check('equal scores keep admin order', tie.map((item) => item.id).join(',') === '9,8');

const bothChips = {
  4: [{ key: 'a', isPrimary: true }, { key: 'b', isPrimary: false }],
  5: [{ key: 'a' }, { key: 'b' }],
};
const maxNotSum = rankQuickPicks({
  items: [{ id: 4, adminIndex: 0, rating: 4.5, primaryChipKey: 'a' }],
  chipsByItemId: bothChips,
  recentViews: [{ id: 5, title: 'X' }],
  pairsByItemId: {},
  sourceChipKey: '',
});
const interestOnly = chipInterest([{ id: 5 }], bothChips, '');
check('interest uses the best chip, not the sum', maxNotSum[0].suggestionScore === 3 * Math.max(interestOnly.a, interestOnly.b));

const copy = quickPickCopy({ selectedChipLabel: '', recentTitle: '', blocks: { reasonNew: 'Most booked online this week', quickPicksHeading: 'Quick picks for you' } });
check('new visitor reason is the weekly line', copy.heading === 'Quick picks for you' && copy.reason === 'Most booked online this week');
const chipCopy = quickPickCopy({ selectedChipLabel: 'Knee pain', recentTitle: 'ACL', blocks: { reasonChip: 'Matched to {chip}' } });
check('selected chip changes the heading', chipCopy.heading === 'Quick picks for Knee pain' && chipCopy.reason === 'Matched to Knee pain');
check('view history reason names the item', quickPickCopy({ recentTitle: 'Knee Pain Treatment', blocks: {} }).reason === 'Because you viewed Knee Pain Treatment');
const homeCopy = homeQuickPickCopy({ selectedChipLabel: 'Knee pain', blocks: { reasonChip: 'Matched to {chip}' } });
check('home chip heading is lowercase', homeCopy.heading === 'Quick picks for knee pain' && homeCopy.reason === 'Matched to Knee pain');
check('home search reason is separate from a viewed item', homeQuickPickCopy({ hasSourceChip: true, recentTitle: '', blocks: {} }).reason === 'Based on what you searched for');
check('home new visitor reason stays local', homeQuickPickCopy({ blocks: {} }).reason === 'Most booked this week near you');
check('home viewed item wins over the source chip', homeQuickPickCopy({ recentTitle: 'Cupping Therapy', hasSourceChip: true, blocks: {} }).reason === 'Because you viewed Cupping Therapy');

const href = fillBookingTemplate(
  '/book?type=online&mode=telephysio&service={slug}&treatment={treatment}&pain_type={pain}&package={package}&pay={pay}',
  { slug: 'tele-knee-pain', treatment: 'knee-pain', pain: 'Knee Pain', package: '', pay: '' }
);
check('booking link keeps the online wizard and drops empty params', href.includes('type=online') && href.includes('mode=telephysio') && href.includes('service=tele-knee-pain') && !href.includes('package='));
check('template rejects nothing unsafe in values', fillBookingTemplate('/book?service={slug}', { slug: 'a b' }).includes('service=a+b') || fillBookingTemplate('/book?service={slug}', { slug: 'a b' }).includes('service=a%20b'));

const soon = new Date('2026-10-15T12:00:00+05:30');
check('slot inside two hours is hidden', slotInsideLead('2026-10-15', '13:00:00', 120, soon) === true);
check('later slot stays available', slotInsideLead('2026-10-15', '16:00:00', 120, soon) === false);
const kept = filterBookableSlots(
  [{ time: '13:00' }, { time: '16:00' }],
  '2026-10-15',
  true,
  soon
);
check('catalogue booking removes the near slot only', kept.length === 1 && kept[0].time === '16:00');
check('other bookings keep every slot', filterBookableSlots([{ time: '13:00' }], '2026-10-15', false, soon).length === 1);

check('relative booking urls are allowed', isSafeBookingUrl('/book?type=home_visit&service={slug}'));
check('https booking urls are allowed', isSafeBookingUrl('https://calendly.com/urban-physio'));
check('http booking urls are allowed', isSafeBookingUrl('http://localhost/theurbanphysio/book'));
check('javascript booking urls are rejected', !isSafeBookingUrl('javascript:alert(1)') && !isSafeBookingUrl(' JavaScript:alert(1)'));
check('data and protocol-relative urls are rejected', !isSafeBookingUrl('data:text/html,hi') && !isSafeBookingUrl('//evil.example/phish'));
check('credential urls are rejected', !isSafeBookingUrl('https://user:pass@example.com/book'));
check('blank booking url has no error', bookingUrlError('  ') === '');
check('unsafe booking url explains the rule', bookingUrlError('javascript:alert(1)').includes('http'));

const service = {
  slug: 'back-neck-pain-relief',
  title: 'Back & Neck Pain Relief',
  bookingPainType: 'Back Pain',
  deliveryMode: 'home',
  bookingUrl: '/book?service={slug}',
};
const resolved = resolveServiceBookingUrl(service, { pain: 'Back Pain' }, { origin: 'http://localhost', base: '/theurbanphysio' });
check('service booking url keeps its slug and adds the visit type', resolved.startsWith('/book?') && resolved.includes('service=back-neck-pain-relief') && resolved.includes('type=home_visit') && resolved.includes('pain_type=Back+Pain'));
check('a bare book path receives the service slug', resolveServiceBookingUrl({ ...service, bookingUrl: '/book' }, {}, { base: '/theurbanphysio' }).includes('service=back-neck-pain-relief'));
check('same-origin absolute book links stay inside the app', resolveServiceBookingUrl(
  { ...service, bookingUrl: 'http://localhost/theurbanphysio/book' },
  {},
  { origin: 'http://localhost', base: '/theurbanphysio' }
).startsWith('/book?'));
check('external booking links are left intact', resolveServiceBookingUrl({ ...service, bookingUrl: 'https://calendly.com/urban' }) === 'https://calendly.com/urban');
check('unsafe stored booking links are ignored', resolveServiceBookingUrl({ ...service, bookingUrl: 'javascript:alert(1)' }) === '');
check('missing booking links fall back to the default flow', resolveServiceBookingUrl({ ...service, bookingUrl: '' }) === '');
check('internal booking note stays on site', bookingDestinationNote('/book?service=back') === 'Continues to booking on The Urban Physio');
check('external booking note names the host', bookingDestinationNote('https://www.calendly.com/urban') === 'Opens calendly.com');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
