/**
 * Search filter tests.
 * Run: node scripts/verify-search.mjs
 */

import { filterLocations } from '../js/search.js';

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures += 1;
    return;
  }

  console.log(`ok: ${message}`);
}

const txResults = filterLocations('tx', []);
assert(txResults.length === 1, 'search "tx" finds Texas');
assert(txResults[0].code === 'TX', 'Texas result has TX code');

const midwestResults = filterLocations('midwest', []);
assert(midwestResults.length > 0, 'search "midwest" returns results');
assert(
  midwestResults.every((loc) => loc.region === 'Midwest'),
  'midwest filter matches region field',
);

const pinned = ['us-ca', 'us-ny'];
const unpinnedWest = filterLocations('west', pinned);
assert(!unpinnedWest.some((loc) => pinned.includes(loc.id)), 'pinned ids excluded');

const noResults = filterLocations('zzzz', []);
assert(noResults.length === 0, 'nonsense query returns empty');

const noteMatch = filterLocations('panhandle', []);
assert(noteMatch.some((loc) => loc.code === 'FL'), 'note keyword finds Florida');

if (failures > 0) {
  process.exitCode = 1;
  console.error(`\n${failures} check(s) failed`);
} else {
  console.log('\nAll checks passed');
}
