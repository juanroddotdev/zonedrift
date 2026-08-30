/**
 * Rough US state centroids for offline nearest-state lookup from geolocation.
 * Used only for first-run default pin selection.
 */

/** @type {{ code: string, lat: number, lon: number }[]} */
const STATE_CENTROIDS = [
  { code: 'AL', lat: 32.806671, lon: -86.79113 },
  { code: 'AK', lat: 61.370716, lon: -152.404419 },
  { code: 'AZ', lat: 33.729759, lon: -111.431221 },
  { code: 'AR', lat: 34.969704, lon: -92.373123 },
  { code: 'CA', lat: 36.116203, lon: -119.681564 },
  { code: 'CO', lat: 39.059811, lon: -105.311104 },
  { code: 'CT', lat: 41.597782, lon: -72.755371 },
  { code: 'DE', lat: 39.318523, lon: -75.507141 },
  { code: 'FL', lat: 27.766279, lon: -81.686783 },
  { code: 'GA', lat: 33.040619, lon: -83.643074 },
  { code: 'HI', lat: 21.094318, lon: -157.498337 },
  { code: 'ID', lat: 44.240459, lon: -114.478828 },
  { code: 'IL', lat: 40.349457, lon: -88.986137 },
  { code: 'IN', lat: 39.849426, lon: -86.258278 },
  { code: 'IA', lat: 42.011539, lon: -93.210526 },
  { code: 'KS', lat: 38.5266, lon: -96.726486 },
  { code: 'KY', lat: 37.66814, lon: -84.670067 },
  { code: 'LA', lat: 31.169546, lon: -91.867805 },
  { code: 'ME', lat: 44.693947, lon: -69.381927 },
  { code: 'MD', lat: 39.063946, lon: -76.802101 },
  { code: 'MA', lat: 42.230171, lon: -71.530106 },
  { code: 'MI', lat: 43.326618, lon: -84.536095 },
  { code: 'MN', lat: 45.694454, lon: -93.900192 },
  { code: 'MS', lat: 32.741646, lon: -89.678696 },
  { code: 'MO', lat: 38.456085, lon: -92.288368 },
  { code: 'MT', lat: 46.921925, lon: -110.454353 },
  { code: 'NE', lat: 41.12537, lon: -98.268082 },
  { code: 'NV', lat: 38.313515, lon: -117.055374 },
  { code: 'NH', lat: 43.452492, lon: -71.563896 },
  { code: 'NJ', lat: 40.298904, lon: -74.521011 },
  { code: 'NM', lat: 34.840515, lon: -106.248482 },
  { code: 'NY', lat: 42.165726, lon: -74.948051 },
  { code: 'NC', lat: 35.630066, lon: -79.806419 },
  { code: 'ND', lat: 47.528912, lon: -99.784012 },
  { code: 'OH', lat: 40.388783, lon: -82.764915 },
  { code: 'OK', lat: 35.565342, lon: -96.928917 },
  { code: 'OR', lat: 44.572021, lon: -122.070938 },
  { code: 'PA', lat: 40.590752, lon: -77.209755 },
  { code: 'RI', lat: 41.680893, lon: -71.51178 },
  { code: 'SC', lat: 33.856892, lon: -80.945007 },
  { code: 'SD', lat: 44.299782, lon: -99.438828 },
  { code: 'TN', lat: 35.747845, lon: -86.692345 },
  { code: 'TX', lat: 31.054487, lon: -97.563461 },
  { code: 'UT', lat: 40.150032, lon: -111.862434 },
  { code: 'VT', lat: 44.045876, lon: -72.710686 },
  { code: 'VA', lat: 37.769337, lon: -78.169968 },
  { code: 'WA', lat: 47.400902, lon: -121.490494 },
  { code: 'WV', lat: 38.491226, lon: -80.954453 },
  { code: 'WI', lat: 44.268543, lon: -89.616508 },
  { code: 'WY', lat: 42.755966, lon: -107.30249 },
];

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const earthRadiusMiles = 3959;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {string | null}
 */
export function resolveNearestStateCode(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  let nearestCode = null;
  let nearestDistance = Infinity;

  for (const state of STATE_CENTROIDS) {
    const distance = haversineMiles(lat, lon, state.lat, state.lon);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCode = state.code;
    }
  }

  return nearestCode;
}
