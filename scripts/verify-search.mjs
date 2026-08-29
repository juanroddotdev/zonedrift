/**
 * Search and city resolution tests.
 * Run: node scripts/verify-search.mjs
 */

import { getDefaultCityForLocation, resolveCityMatch } from '../data/cities.js';
import { getLocationById, LOCATIONS } from '../data/locations.js';
import { getLocationRowLabel } from '../js/display.js';
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

const nashville = resolveCityMatch('nashville');
assert(nashville?.id === 'us-tn-central', 'nashville resolves to central Tennessee');

const nashvilleSearch = filterSearchResults('nashville');
assert(nashvilleSearch[0]?.type === 'single', 'search nashville returns single answer');
assert(nashvilleSearch[0]?.source === 'city', 'nashville match is city-sourced');
assert(nashvilleSearch[0]?.location.id === 'us-tn-central', 'nashville search uses central variant');
assert(nashvilleSearch[0]?.cityLabel === 'Nashville', 'nashville search includes city label');

const tennessee = filterSearchResults('tennessee');
assert(tennessee[0]?.type === 'group', 'search tennessee returns group picker');
assert(
  tennessee[0]?.variants[0]?.sublabel.includes('Nashville'),
  'tennessee picker uses city-led labels',
);

const california = filterSearchResults('california', []);
assert(california.length === 1, 'search "california" finds California');
assert(california[0].type === 'single', 'California is a single-zone result');

const texasGroup = filterSearchResults('tx', []);
assert(texasGroup[0].type === 'group', 'search "tx" finds Texas group');

const houston = filterSearchResults('houston');
assert(houston[0]?.location.id === 'us-tx-central', 'houston resolves to central Texas');

const midwestResults = filterLocations('midwest', []);
assert(midwestResults.length > 0, 'search "midwest" returns results');

const pinned = ['us-ca', 'us-ny'];
const unpinnedWest = filterLocations('west', pinned);
assert(!unpinnedWest.some((loc) => pinned.includes(loc.id)), 'pinned ids excluded from unpinned filter');

const noResults = filterSearchResults('zzzz', []);
assert(noResults.length === 0, 'nonsense query returns empty');

assert(LOCATIONS.length === 62, 'location catalog has 62 pinnable entries');

const illinois = getLocationById('us-il');
assert(getLocationRowLabel(illinois) === 'Chicago, IL', 'illinois row label uses default city');
assert(getDefaultCityForLocation('us-fl-eastern') === 'Miami', 'florida eastern default city is Miami');

if (failures > 0) {
  process.exitCode = 1;
  console.error(`\n${failures} check(s) failed`);
} else {
  console.log('\nAll checks passed');
}
