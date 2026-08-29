import { getDefaultCityForLocation } from '../data/cities.js';
import { formatOffsetShort } from './time-engine.js';

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
 * Muted subline under the row label: zone abbrev + compact offset.
 */
export function formatLocationRowMeta(abbrev, deltaHours) {
  return `${abbrev} · ${formatOffsetShort(deltaHours)}`;
}

/**
 * @param {{ cityLabel?: string } | undefined} pin
 * @param {import('../data/locations.js').Location} location
 */
export function getPinDisplayLabel(pin, location) {
  return getLocationRowLabel(location, pin?.cityLabel);
}
