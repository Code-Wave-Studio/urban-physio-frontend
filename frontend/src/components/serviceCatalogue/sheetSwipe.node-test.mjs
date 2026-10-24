/**
 * Run: node src/components/serviceCatalogue/sheetSwipe.node-test.mjs
 */
import { sheetGestureMode, sheetPullShouldClose } from './sheetSwipe.js';

let passed = 0;
let failed = 0;

function check(label, ok) {
  if (ok) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label}`);
  }
}

check('tiny movement stays undecided', sheetGestureMode({ dy: 4, dx: 2, scrollTop: 0, fromChrome: false }) === 'undecided');
check('upward movement scrolls', sheetGestureMode({ dy: -30, dx: 2, scrollTop: 0, fromChrome: false }) === 'ignore');
check('horizontal movement scrolls', sheetGestureMode({ dy: 12, dx: 40, scrollTop: 0, fromChrome: false }) === 'ignore');
check('downward at the top pulls', sheetGestureMode({ dy: 24, dx: 4, scrollTop: 0, fromChrome: false }) === 'pull');
check('downward while content is scrolled does not pull', sheetGestureMode({ dy: 24, dx: 4, scrollTop: 80, fromChrome: false }) === 'ignore');
check('downward on the chrome pulls even when content is scrolled', sheetGestureMode({ dy: 24, dx: 4, scrollTop: 80, fromChrome: true }) === 'pull');
check('a long pull closes', sheetPullShouldClose({ dy: 120, velocity: 0.2 }) === true);
check('a flick closes', sheetPullShouldClose({ dy: 50, velocity: 0.8 }) === true);
check('a short slow pull stays open', sheetPullShouldClose({ dy: 30, velocity: 0.2 }) === false);

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
