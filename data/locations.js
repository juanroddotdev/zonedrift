/**
 * US state seed data for ZoneDrift.
 * Pins reference stable `id` values; resolve full objects at runtime.
 */

/** @typedef {{ id: string, sublabel: string, tz: string, note?: string }} ZoneVariantDef */
/** @typedef {{ name: string, code: string, region: string, variants: ZoneVariantDef[] }} MultiZoneGroupDef */

/** @type {Record<string, MultiZoneGroupDef>} */
export const MULTI_ZONE_GROUPS = {
  'us-ak': {
    name: 'Alaska',
    code: 'AK',
    region: 'West',
    variants: [
      { id: 'us-ak-anchorage', sublabel: 'Most of Alaska', tz: 'America/Anchorage' },
      { id: 'us-ak-aleutian', sublabel: 'Aleutian Islands', tz: 'America/Adak' },
    ],
  },
  'us-fl': {
    name: 'Florida',
    code: 'FL',
    region: 'South',
    variants: [
      { id: 'us-fl-eastern', sublabel: 'Most of Florida', tz: 'America/New_York' },
      { id: 'us-fl-central', sublabel: 'Panhandle', tz: 'America/Chicago' },
    ],
  },
  'us-id': {
    name: 'Idaho',
    code: 'ID',
    region: 'West',
    variants: [
      { id: 'us-id-mountain', sublabel: 'Most of Idaho', tz: 'America/Boise' },
      { id: 'us-id-pacific', sublabel: 'Northern panhandle', tz: 'America/Los_Angeles' },
    ],
  },
  'us-in': {
    name: 'Indiana',
    code: 'IN',
    region: 'Midwest',
    variants: [
      { id: 'us-in-eastern', sublabel: 'Most of Indiana', tz: 'America/Indiana/Indianapolis' },
      { id: 'us-in-central', sublabel: 'NW & SW counties', tz: 'America/Chicago' },
    ],
  },
  'us-ks': {
    name: 'Kansas',
    code: 'KS',
    region: 'Midwest',
    variants: [
      { id: 'us-ks-central', sublabel: 'Most of Kansas', tz: 'America/Chicago' },
      { id: 'us-ks-mountain', sublabel: 'Western counties', tz: 'America/Denver' },
    ],
  },
  'us-ky': {
    name: 'Kentucky',
    code: 'KY',
    region: 'South',
    variants: [
      { id: 'us-ky-eastern', sublabel: 'Most of Kentucky', tz: 'America/New_York' },
      { id: 'us-ky-central', sublabel: 'Western counties', tz: 'America/Chicago' },
    ],
  },
  'us-mi': {
    name: 'Michigan',
    code: 'MI',
    region: 'Midwest',
    variants: [
      { id: 'us-mi-eastern', sublabel: 'Most of Michigan', tz: 'America/Detroit' },
      { id: 'us-mi-central', sublabel: 'Upper Peninsula west', tz: 'America/Menominee' },
    ],
  },
  'us-nd': {
    name: 'North Dakota',
    code: 'ND',
    region: 'Midwest',
    variants: [
      { id: 'us-nd-central', sublabel: 'Most of North Dakota', tz: 'America/Chicago' },
      { id: 'us-nd-mountain', sublabel: 'Southwest', tz: 'America/Denver' },
    ],
  },
  'us-ne': {
    name: 'Nebraska',
    code: 'NE',
    region: 'Midwest',
    variants: [
      { id: 'us-ne-central', sublabel: 'Most of Nebraska', tz: 'America/Chicago' },
      { id: 'us-ne-mountain', sublabel: 'Western counties', tz: 'America/Denver' },
    ],
  },
  'us-sd': {
    name: 'South Dakota',
    code: 'SD',
    region: 'Midwest',
    variants: [
      { id: 'us-sd-central', sublabel: 'Most of South Dakota', tz: 'America/Chicago' },
      { id: 'us-sd-mountain', sublabel: 'Western counties', tz: 'America/Denver' },
    ],
  },
  'us-tn': {
    name: 'Tennessee',
    code: 'TN',
    region: 'South',
    variants: [
      { id: 'us-tn-central', sublabel: 'Most of Tennessee', tz: 'America/Chicago' },
      { id: 'us-tn-eastern', sublabel: 'Eastern counties', tz: 'America/New_York' },
    ],
  },
  'us-tx': {
    name: 'Texas',
    code: 'TX',
    region: 'South',
    variants: [
      { id: 'us-tx-central', sublabel: 'Most of Texas', tz: 'America/Chicago' },
      { id: 'us-tx-mountain', sublabel: 'El Paso area', tz: 'America/Denver' },
    ],
  },
};

const SINGLE_ZONE_STATES = [
  { id: 'us-al', name: 'Alabama', code: 'AL', region: 'South', tz: 'America/Chicago' },
  { id: 'us-az', name: 'Arizona', code: 'AZ', region: 'West', tz: 'America/Phoenix', note: 'No daylight saving time' },
  { id: 'us-ar', name: 'Arkansas', code: 'AR', region: 'South', tz: 'America/Chicago' },
  { id: 'us-ca', name: 'California', code: 'CA', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-co', name: 'Colorado', code: 'CO', region: 'West', tz: 'America/Denver' },
  { id: 'us-ct', name: 'Connecticut', code: 'CT', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-de', name: 'Delaware', code: 'DE', region: 'South', tz: 'America/New_York' },
  { id: 'us-ga', name: 'Georgia', code: 'GA', region: 'South', tz: 'America/New_York' },
  { id: 'us-hi', name: 'Hawaii', code: 'HI', region: 'West', tz: 'Pacific/Honolulu' },
  { id: 'us-il', name: 'Illinois', code: 'IL', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-ia', name: 'Iowa', code: 'IA', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-la', name: 'Louisiana', code: 'LA', region: 'South', tz: 'America/Chicago' },
  { id: 'us-me', name: 'Maine', code: 'ME', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-md', name: 'Maryland', code: 'MD', region: 'South', tz: 'America/New_York' },
  { id: 'us-ma', name: 'Massachusetts', code: 'MA', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-mn', name: 'Minnesota', code: 'MN', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-ms', name: 'Mississippi', code: 'MS', region: 'South', tz: 'America/Chicago' },
  { id: 'us-mo', name: 'Missouri', code: 'MO', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-mt', name: 'Montana', code: 'MT', region: 'West', tz: 'America/Denver' },
  { id: 'us-nv', name: 'Nevada', code: 'NV', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-nh', name: 'New Hampshire', code: 'NH', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-nj', name: 'New Jersey', code: 'NJ', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-nm', name: 'New Mexico', code: 'NM', region: 'West', tz: 'America/Denver' },
  { id: 'us-ny', name: 'New York', code: 'NY', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-nc', name: 'North Carolina', code: 'NC', region: 'South', tz: 'America/New_York' },
  { id: 'us-oh', name: 'Ohio', code: 'OH', region: 'Midwest', tz: 'America/New_York' },
  { id: 'us-ok', name: 'Oklahoma', code: 'OK', region: 'South', tz: 'America/Chicago' },
  { id: 'us-or', name: 'Oregon', code: 'OR', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-pa', name: 'Pennsylvania', code: 'PA', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-ri', name: 'Rhode Island', code: 'RI', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-sc', name: 'South Carolina', code: 'SC', region: 'South', tz: 'America/New_York' },
  { id: 'us-ut', name: 'Utah', code: 'UT', region: 'West', tz: 'America/Denver' },
  { id: 'us-vt', name: 'Vermont', code: 'VT', region: 'Northeast', tz: 'America/New_York' },
  { id: 'us-va', name: 'Virginia', code: 'VA', region: 'South', tz: 'America/New_York' },
  { id: 'us-wa', name: 'Washington', code: 'WA', region: 'West', tz: 'America/Los_Angeles' },
  { id: 'us-wv', name: 'West Virginia', code: 'WV', region: 'South', tz: 'America/New_York' },
  { id: 'us-wi', name: 'Wisconsin', code: 'WI', region: 'Midwest', tz: 'America/Chicago' },
  { id: 'us-wy', name: 'Wyoming', code: 'WY', region: 'West', tz: 'America/Denver' },
];

function buildVariantLocations() {
  const variants = [];

  for (const [groupId, group] of Object.entries(MULTI_ZONE_GROUPS)) {
    for (const variant of group.variants) {
      variants.push({
        id: variant.id,
        groupId,
        name: group.name,
        code: group.code,
        region: group.region,
        tz: variant.tz,
        sublabel: variant.sublabel,
        note: variant.note,
      });
    }
  }

  return variants;
}

export const LOCATIONS = [...SINGLE_ZONE_STATES, ...buildVariantLocations()];

export const SEARCH_CATALOG = [
  ...SINGLE_ZONE_STATES.map((location) => ({
    type: 'single',
    locationId: location.id,
  })),
  ...Object.entries(MULTI_ZONE_GROUPS).map(([groupId, group]) => ({
    type: 'group',
    groupId,
    name: group.name,
    code: group.code,
    region: group.region,
    variantIds: group.variants.map((variant) => variant.id),
  })),
];

/** Maps legacy pin ids from earlier releases to current ids. */
export const PIN_ID_MIGRATIONS = {
  'us-ak': 'us-ak-anchorage',
  'us-fl': 'us-fl-eastern',
  'us-id': 'us-id-mountain',
  'us-in': 'us-in-eastern',
  'us-ks': 'us-ks-central',
  'us-ky': 'us-ky-eastern',
  'us-mi': 'us-mi-eastern',
  'us-nd': 'us-nd-central',
  'us-ne': 'us-ne-central',
  'us-sd': 'us-sd-central',
  'us-tn': 'us-tn-central',
};

export const DEFAULT_HUB_IDS = ['us-ny', 'us-il', 'us-ca'];

export const TZ_PRIMARY_ID = {
  'America/New_York': 'us-ny',
  'America/Detroit': 'us-mi-eastern',
  'America/Menominee': 'us-mi-central',
  'America/Chicago': 'us-il',
  'America/Indiana/Indianapolis': 'us-in-eastern',
  'America/Denver': 'us-co',
  'America/Boise': 'us-id-mountain',
  'America/Phoenix': 'us-az',
  'America/Los_Angeles': 'us-ca',
  'America/Anchorage': 'us-ak-anchorage',
  'America/Adak': 'us-ak-aleutian',
  'Pacific/Honolulu': 'us-hi',
};

const locationById = new Map(LOCATIONS.map((location) => [location.id, location]));
const catalogByGroupId = new Map(
  SEARCH_CATALOG.filter((entry) => entry.type === 'group').map((entry) => [entry.groupId, entry]),
);

export function migratePinId(id) {
  return PIN_ID_MIGRATIONS[id] ?? id;
}

export function getLocationById(id) {
  return locationById.get(migratePinId(id)) ?? null;
}

export function getLocationsByTz(tz) {
  return LOCATIONS.filter((location) => location.tz === tz);
}

export function getGroupById(groupId) {
  return catalogByGroupId.get(groupId) ?? null;
}

export function getGroupVariants(groupId, pinnedIds = []) {
  const group = MULTI_ZONE_GROUPS[groupId];
  if (!group) {
    return [];
  }

  const pinnedSet = new Set(pinnedIds.map(migratePinId));
  return group.variants
    .map((variant) => getLocationById(variant.id))
    .filter((location) => location && !pinnedSet.has(location.id));
}

export function resolvePinnedLocations(pinIds) {
  const seen = new Set();

  return pinIds
    .map((id) => migratePinId(id))
    .filter((id) => {
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    })
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

export function getLocationLabel(location) {
  if (location.sublabel) {
    return `${location.name} (${location.code}) · ${location.sublabel}`;
  }

  return `${location.name} (${location.code})`;
}
