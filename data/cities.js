import { LOCATIONS, getLocationById } from './locations.js';

/** Major cities mapped to single-zone state location ids. */
const SINGLE_STATE_CITIES = [
  { name: 'Los Angeles', locationId: 'us-ca' },
  { name: 'San Francisco', locationId: 'us-ca' },
  { name: 'San Diego', locationId: 'us-ca' },
  { name: 'Phoenix', locationId: 'us-az' },
  { name: 'Denver', locationId: 'us-co' },
  { name: 'Seattle', locationId: 'us-wa' },
  { name: 'Portland', locationId: 'us-or' },
  { name: 'Las Vegas', locationId: 'us-nv' },
  { name: 'Chicago', locationId: 'us-il' },
  { name: 'Atlanta', locationId: 'us-ga' },
  { name: 'Boston', locationId: 'us-ma' },
  { name: 'Philadelphia', locationId: 'us-pa' },
];

function buildCityIndex() {
  const index = [];

  for (const location of LOCATIONS) {
    if (!location.cities) {
      continue;
    }

    for (const city of location.cities) {
      index.push({
        name: city,
        locationId: location.id,
        stateCode: location.code,
      });
    }
  }

  for (const entry of SINGLE_STATE_CITIES) {
    index.push({
      name: entry.name,
      locationId: entry.locationId,
      stateCode: getLocationById(entry.locationId)?.code ?? '',
    });
  }

  return index;
}

const CITY_INDEX = buildCityIndex();

function normalize(value) {
  return value.trim().toLowerCase();
}

function scoreCityMatch(query, cityName) {
  const normalizedCity = normalize(cityName);

  if (normalizedCity === query) {
    return 3;
  }

  if (normalizedCity.startsWith(query)) {
    return 2;
  }

  if (normalizedCity.includes(query)) {
    return 1;
  }

  return 0;
}

/**
 * Resolve a search query to a location via city name (offline index).
 * Returns null if no confident city match.
 */
export function resolveCitySearchMatch(query) {
  const normalized = normalize(query);
  if (!normalized) {
    return null;
  }

  const scored = CITY_INDEX.map((entry) => ({
    entry,
    score: scoreCityMatch(normalized, entry.name),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.length - b.entry.name.length);

  if (scored.length === 0) {
    return null;
  }

  const bestScore = scored[0].score;
  const topMatches = scored.filter((item) => item.score === bestScore);

  if (topMatches.length > 1) {
    return null;
  }

  const match = topMatches[0].entry;
  const location = getLocationById(match.locationId);

  if (!location) {
    return null;
  }

  return { location, cityName: match.name };
}

export function resolveCityMatch(query) {
  return resolveCitySearchMatch(query)?.location ?? null;
}

/**
 * Representative city for display when no pin-specific city label is stored.
 */
export function getDefaultCityForLocation(locationId) {
  const location = getLocationById(locationId);
  if (!location) {
    return null;
  }

  if (location.sublabel) {
    return location.sublabel.split(',')[0].trim();
  }

  if (location.cities?.[0]) {
    return location.cities[0];
  }

  const singleState = SINGLE_STATE_CITIES.find((entry) => entry.locationId === locationId);
  return singleState?.name ?? null;
}

export function filterCitiesInGroup(groupId, query) {
  const normalized = normalize(query);
  const cities = [];

  for (const location of LOCATIONS) {
    if (location.groupId !== groupId || !location.cities) {
      continue;
    }

    for (const city of location.cities) {
      if (!normalized || normalize(city).includes(normalized)) {
        cities.push({ name: city, locationId: location.id });
      }
    }
  }

  return cities.sort((a, b) => a.name.localeCompare(b.name));
}

export { CITY_INDEX };
