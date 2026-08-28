import {
  MULTI_ZONE_GROUPS,
  SEARCH_CATALOG,
  getLocationById,
  migratePinId,
} from '../data/locations.js';

function buildHaystack(entry) {
  if (entry.type === 'single') {
    const location = getLocationById(entry.locationId);
    if (!location) {
      return '';
    }

    return [location.name, location.code, location.region, location.note ?? '']
      .join(' ')
      .toLowerCase();
  }

  return [entry.name, entry.code, entry.region].join(' ').toLowerCase();
}

function getGroupVariantsForLookup(groupId) {
  const group = MULTI_ZONE_GROUPS[groupId];
  if (!group) {
    return [];
  }

  return group.variants
    .map((variant) => getLocationById(variant.id))
    .filter(Boolean);
}

/**
 * Filter the search catalog by query.
 * Lookup mode includes already-saved locations so search always returns an answer.
 *
 * @returns {Array<
 *   | { type: 'single', location: import('../data/locations.js').LOCATIONS[number] }
 *   | { type: 'group', groupId: string, name: string, code: string, region: string, variants: import('../data/locations.js').LOCATIONS[number][] }
 * >}
 */
export function filterSearchResults(query, pinnedIds = []) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const pinnedSet = new Set(pinnedIds.map(migratePinId));
  const results = [];

  for (const entry of SEARCH_CATALOG) {
    if (!buildHaystack(entry).includes(normalized)) {
      continue;
    }

    if (entry.type === 'single') {
      const location = getLocationById(entry.locationId);
      if (location) {
        results.push({ type: 'single', location });
      }
      continue;
    }

    const variants = getGroupVariantsForLookup(entry.groupId);
    if (variants.length === 0) {
      continue;
    }

    results.push({
      type: 'group',
      groupId: entry.groupId,
      name: entry.name,
      code: entry.code,
      region: entry.region,
      variants,
    });
  }

  return results;
}

/**
 * Filter to unpinned locations only (for add-list style flows).
 */
export function filterUnpinnedResults(query, pinnedIds = []) {
  const pinnedSet = new Set(pinnedIds.map(migratePinId));

  return filterSearchResults(query, pinnedIds).flatMap((result) => {
    if (result.type === 'single') {
      return pinnedSet.has(result.location.id) ? [] : [result.location];
    }

    return result.variants.filter((location) => !pinnedSet.has(location.id));
  });
}

// Backward-compatible alias for verification scripts.
export function filterLocations(query, pinnedIds = []) {
  return filterUnpinnedResults(query, pinnedIds);
}
