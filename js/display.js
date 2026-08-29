import { getDefaultCityForLocation } from '../data/cities.js';

/**
 * Primary label for a location list row (city-first when a default city exists).
 * @param {import('../data/locations.js').Location} location
 * @param {string | undefined} cityLabel
 */
export function getLocationRowLabel(location, cityLabel) {
  const city = cityLabel ?? getDefaultCityForLocation(location.id);

  if (city) {
    return `${city}, ${location.code}`;
  }

  return `${location.name} (${location.code})`;
}

/**
 * Muted subline under the row label: zone abbrev + offset vs local.
 */
export function formatLocationRowMeta(abbrev, offsetLabel) {
  return `${abbrev} · ${offsetLabel}`;
}
