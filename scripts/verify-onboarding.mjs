/**
 * Onboarding / geolocation default pin tests.
 * Run: node scripts/verify-onboarding.mjs
 */

import {
  DEFAULT_HUB_IDS,
  getLocationIdForStateCode,
  getOnboardingPinIds,
} from '../data/locations.js';
import { resolveNearestStateCode } from '../js/geo.js';

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures += 1;
    return;
  }

  console.log(`ok: ${message}`);
}

assert(
  getOnboardingPinIds('America/New_York', { lat: 28.54, lon: -81.38 })[0] === 'us-fl-eastern',
  'orlando coords pin florida eastern on first run',
);

assert(
  getOnboardingPinIds('America/Chicago', { lat: 41.88, lon: -87.63 })[0] === 'us-il',
  'chicago coords pin illinois on first run',
);

assert(
  getOnboardingPinIds('America/Indiana/Indianapolis')[0] === 'us-in-eastern',
  'specific iana zone still maps without geolocation',
);

assert(
  getOnboardingPinIds('Europe/London').join(',') === DEFAULT_HUB_IDS.join(','),
  'non-us timezone falls back to default hubs',
);

assert(
  getLocationIdForStateCode('FL', 'America/New_York') === 'us-fl-eastern',
  'florida eastern variant chosen for eastern tz',
);

assert(
  getLocationIdForStateCode('FL', 'America/Chicago') === 'us-fl-central',
  'florida central variant chosen for central tz',
);

assert(resolveNearestStateCode(28.54, -81.38) === 'FL', 'orlando resolves to florida');

if (failures > 0) {
  process.exit(1);
}

console.log('\nAll checks passed');
