import { LOCATIONS } from '../data/locations.js';

/**
 * Filter seed locations by query. Excludes already-pinned ids.
 * Matches name, code, region, and optional note (case-insensitive).
 */
export function filterLocations(query, pinnedIds = []) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const pinnedSet = new Set(pinnedIds);

  return LOCATIONS.filter((location) => {
    if (pinnedSet.has(location.id)) {
      return false;
    }

    const haystack = [
      location.name,
      location.code,
      location.region,
      location.note ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
