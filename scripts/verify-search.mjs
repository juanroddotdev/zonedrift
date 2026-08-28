/**
 * Search filter tests.
 * Run: node scripts/verify-search.mjs
 */

import { LOCATIONS } from '../data/locations.js';
import { filterLocations, filterSearchResults } from '../js/search.js';

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures += 1;
    return;
  }

  console.log(`ok: ${message}`);
}

const california = filterSearchResults('california', []);
assert(california.length === 1, 'search "california" finds California');
assert(california[0].type === 'single', 'California is a single-zone result');
assert(california[0].location.code === 'CA', 'California result has CA code');

const californiaPinned = filterSearchResults('california', ['us-ca']);
assert(californiaPinned.length === 1, 'lookup still finds California when already saved');

const texasGroup = filterSearchResults('tx', []);
assert(texasGroup.length === 1, 'search "tx" finds one catalog entry');
assert(texasGroup[0].type === 'group', 'Texas is a multi-zone group');
assert(texasGroup[0].variants.length === 2, 'Texas has two timezone variants');

const texasVariants = filterLocations('tx', []);
assert(texasVariants.length === 2, 'filterLocations returns both Texas variants');

const midwestResults = filterLocations('midwest', []);
assert(midwestResults.length > 0, 'search "midwest" returns results');
assert(
  midwestResults.every((loc) => loc.region === 'Midwest'),
  'midwest filter matches region field',
);

const pinned = ['us-ca', 'us-ny'];
const unpinnedWest = filterLocations('west', pinned);
assert(!unpinnedWest.some((loc) => pinned.includes(loc.id)), 'pinned ids excluded from unpinned filter');

const noResults = filterSearchResults('zzzz', []);
assert(noResults.length === 0, 'nonsense query returns empty');

const floridaGroup = filterSearchResults('florida', []);
assert(floridaGroup[0]?.type === 'group', 'Florida resolves as a multi-zone group');

assert(LOCATIONS.length === 62, 'location catalog has 62 pinnable entries');

if (failures > 0) {
  process.exitCode = 1;
  console.error(`\n${failures} check(s) failed`);
} else {
  console.log('\nAll checks passed');
}
