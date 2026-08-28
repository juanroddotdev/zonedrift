/**
 * US state seed data for ZoneDrift.
 * Pins reference stable `id` values; resolve full objects at runtime.
 */

export const LOCATIONS = [
  { id: 'us-al', name: 'Alabama', code: 'AL', region: 'South', tz: 'America/Chicago' },
  { id: 'us-ak', name: 'Alaska', code: 'AK', region: 'West', tz: 'America/Anchorage', note: 'Aleutian Islands differ' },
  { id: 'us-az', name: 'Arizona', code: 'AZ', region: 'West', tz: 'America/Phoenix', note: 'No daylight saving time' },
  { id: 'us-ar', name: 'Arkansas', code: 'AR', region: 'South', tz: 'America/Chicago' },
  { id: 'us-ca', name: 'California', code: 'CA', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-co', name: 'Colorado', code: 'CO', region: 'West', tz: 'America/Denver' },
  { id: 'us-ct', name: 'Connecticut', code: 'CT', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-de', name: 'Delaware', code: 'DE', region: 'South', tz: 'America/New_York' },
  { id: 'us-fl', name: 'Florida', code: 'FL', region: 'South', tz: 'America/New_York', note: 'Panhandle is Central' },
  { id: 'us-ga', name: 'Georgia', code: 'GA', region: 'South', tz: 'America/New_York' },
  { id: 'us-hi', name: 'Hawaii', code: 'HI', region: 'West', tz: 'Pacific/Honolulu' },
  { id: 'us-id', name: 'Idaho', code: 'ID', region: 'West', tz: 'America/Boise', note: 'Northern panhandle is Pacific' },
  { id: 'us-il', name: 'Illinois', code: 'IL', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-in', name: 'Indiana', code: 'IN', region: 'Midwest', tz: 'America/Indiana/Indianapolis', note: 'NW/SW counties vary' },
  { id: 'us-ia', name: 'Iowa', code: 'IA', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-ks', name: 'Kansas', code: 'KS', region: 'Midwest', tz: 'America/Chicago', note: 'Western counties are Mountain' },
  { id: 'us-ky', name: 'Kentucky', code: 'KY', region: 'South', tz: 'America/New_York', note: 'Western counties are Central' },
  { id: 'us-la', name: 'Louisiana', code: 'LA', region: 'South', tz: 'America/Chicago' },
  { id: 'us-me', name: 'Maine', code: 'ME', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-md', name: 'Maryland', code: 'MD', region: 'South', tz: 'America/New_York' },
  { id: 'us-ma', name: 'Massachusetts', code: 'MA', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-mi', name: 'Michigan', code: 'MI', region: 'Midwest', tz: 'America/Detroit', note: 'Upper Peninsula varies' },
  { id: 'us-mn', name: 'Minnesota', code: 'MN', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-ms', name: 'Mississippi', code: 'MS', region: 'South', tz: 'America/Chicago' },
  { id: 'us-mo', name: 'Missouri', code: 'MO', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-mt', name: 'Montana', code: 'MT', region: 'West', tz: 'America/Denver' },
  { id: 'us-ne', name: 'Nebraska', code: 'NE', region: 'Midwest', tz: 'America/Chicago', note: 'Western counties are Mountain' },
  { id: 'us-nv', name: 'Nevada', code: 'NV', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-nh', name: 'New Hampshire', code: 'NH', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-nj', name: 'New Jersey', code: 'NJ', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-nm', name: 'New Mexico', code: 'NM', region: 'West', tz: 'America/Denver' },
  { id: 'us-ny', name: 'New York', code: 'NY', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-nc', name: 'North Carolina', code: 'NC', region: 'South', tz: 'America/New_York' },
  { id: 'us-nd', name: 'North Dakota', code: 'ND', region: 'Midwest', tz: 'America/Chicago', note: 'Southwest is Mountain' },
  { id: 'us-oh', name: 'Ohio', code: 'OH', region: 'Midwest', tz: 'America/New_York' },
  { id: 'us-ok', name: 'Oklahoma', code: 'OK', region: 'South', tz: 'America/Chicago' },
  { id: 'us-or', name: 'Oregon', code: 'OR', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-pa', name: 'Pennsylvania', code: 'PA', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-ri', name: 'Rhode Island', code: 'RI', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-sc', name: 'South Carolina', code: 'SC', region: 'South', tz: 'America/New_York' },
  { id: 'us-sd', name: 'South Dakota', code: 'SD', region: 'Midwest', tz: 'America/Chicago', note: 'Western counties are Mountain' },
  { id: 'us-tn', name: 'Tennessee', code: 'TN', region: 'South', tz: 'America/Chicago', note: 'Eastern counties are Eastern' },
  { id: 'us-tx-central', name: 'Texas', code: 'TX', region: 'South', tz: 'America/Chicago', note: 'El Paso area is Mountain' },
  { id: 'us-ut', name: 'Utah', code: 'UT', region: 'West', tz: 'America/Denver' },
  { id: 'us-vt', name: 'Vermont', code: 'VT', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-va', name: 'Virginia', code: 'VA', region: 'South', tz: 'America/New_York' },
  { id: 'us-wa', name: 'Washington', code: 'WA', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-wv', name: 'West Virginia', code: 'WV', region: 'South', tz: 'America/New_York' },
  { id: 'us-wi', name: 'Wisconsin', code: 'WI', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-wy', name: 'Wyoming', code: 'WY', region: 'West', tz: 'America/Denver' },
];

/** Default hub pins when the user's timezone is not in the seed data. */
export const DEFAULT_HUB_IDS = ['us-ny', 'us-il', 'us-ca'];

/**
 * Preferred location id per IANA zone for first-run onboarding
 * when multiple states share the same timezone.
 */
export const TZ_PRIMARY_ID = {
  'America/New_York': 'us-ny',
  'America/Detroit': 'us-mi',
  'America/Chicago': 'us-il',
  'America/Indiana/Indianapolis': 'us-in',
  'America/Denver': 'us-co',
  'America/Boise': 'us-id',
  'America/Phoenix': 'us-az',
  'America/Los_Angeles': 'us-ca',
  'America/Anchorage': 'us-ak',
  'Pacific/Honolulu': 'us-hi',
};

const locationById = new Map(LOCATIONS.map((location) => [location.id, location]));

export function getLocationById(id) {
  return locationById.get(id) ?? null;
}

export function getLocationsByTz(tz) {
  return LOCATIONS.filter((location) => location.tz === tz);
}

export function resolvePinnedLocations(pinIds) {
  return pinIds
    .map((id) => getLocationById(id))
    .filter(Boolean);
}

export function getOnboardingPinIds(userTz) {
  if (TZ_PRIMARY_ID[userTz]) {
    return [TZ_PRIMARY_ID[userTz]];
  }

  const matches = getLocationsByTz(userTz);
  if (matches.length > 0) {
    return [matches[0].id];
  }

  return [...DEFAULT_HUB_IDS];
}
