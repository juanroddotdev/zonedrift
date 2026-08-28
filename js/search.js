import {
  SEARCH_CATALOG,
  getGroupVariants,
  getLocationById,
  migratePinId,
} from '../data/locations.js';

function buildHaystack(entry) {
  return [entry.name, entry.code, entry.region].join(' ').toLowerCase();
}

function getUnpinnedVariantIds(variantIds, pinnedSet) {
  return variantIds
    .map((id) => migratePinId(id))
    .filter((id) => !pinnedSet.has(id));
}

/**
 * Filter the search catalog by query.
 * Returns single-location entries and multi-zone groups with unpinned variants.
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
      const locationId = migratePinId(entry.locationId);
      if (pinnedSet.has(locationId)) {
        continue;
      }

      const location = getLocationById(locationId);
      if (location) {
        results.push({ type: 'single', location });
      }
      continue;
    }

    const variants = getGroupVariants(entry.groupId, [...pinnedSet]);
    if (variants.length === 0) {
      continue;
    }

    const unpinnedIds = getUnpinnedVariantIds(entry.variantIds, pinnedSet);
    if (unpinnedIds.length === 0) {
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

// Backward-compatible alias for verification scripts.
export function filterLocations(query, pinnedIds = []) {
  return filterSearchResults(query, pinnedIds)
    .flatMap((result) => {
      if (result.type === 'single') {
        return [result.location];
      }
      return result.variants;
    });
}
