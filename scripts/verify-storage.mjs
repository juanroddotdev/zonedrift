/**
 * Pin storage normalization tests.
 * Run: node scripts/verify-storage.mjs
 */

import { getLocationById } from '../data/locations.js';
import { getPinDisplayLabel } from '../js/display.js';
import { normalizePinEntries } from '../js/storage.js';

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures += 1;
    return;
  }

  console.log(`ok: ${message}`);
}

const migrated = normalizePinEntries(['us-il', 'us-ca']);
assert(migrated.length === 2, 'legacy string pins migrate to entries');
assert(migrated[0].id === 'us-il', 'legacy pin keeps migrated id');
assert(migrated[0].cityLabel === 'Chicago', 'legacy illinois pin gets default city label');
assert(typeof migrated[0].pinnedAt === 'number', 'legacy pin gets pinnedAt');

const deduped = normalizePinEntries([
  { id: 'us-ny', cityLabel: 'New York', pinnedAt: 100 },
  'us-ny',
]);
assert(deduped.length === 1, 'duplicate pin ids dedupe');

const orlandoPin = normalizePinEntries([
  { id: 'us-fl-eastern', cityLabel: 'Orlando', pinnedAt: 200 },
])[0];
const florida = getLocationById('us-fl-eastern');
assert(
  getPinDisplayLabel(orlandoPin, florida) === 'Orlando, FL',
  'stored city label overrides default for display',
);

if (failures > 0) {
  process.exit(1);
}

console.log('\nAll checks passed');
