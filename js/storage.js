import { getDefaultCityForLocation } from '../data/cities.js';
import { getLocationById, getOnboardingPinIds, migratePinId } from '../data/locations.js';

export const MAX_PINS = 12;

/** @typedef {{ id: string, cityLabel?: string, pinnedAt: number }} PinEntry */

const STORAGE_KEYS = ['pins', 'use24Hour', 'defaultPinsApplied', 'lastSearchQuery'];

/**
 * @param {unknown} raw
 * @param {number} [pinnedAtFallback]
 * @returns {PinEntry | null}
 */
function normalizePinEntry(raw, pinnedAtFallback = Date.now()) {
  if (typeof raw === 'string') {
    const id = migratePinId(raw);
    if (!getLocationById(id)) {
      return null;
    }

    const cityLabel = getDefaultCityForLocation(id);
    return {
      id,
      ...(cityLabel ? { cityLabel } : {}),
      pinnedAt: pinnedAtFallback,
    };
  }

  if (raw && typeof raw === 'object' && typeof raw.id === 'string') {
    const id = migratePinId(raw.id);
    if (!getLocationById(id)) {
      return null;
    }

    const cityLabel = raw.cityLabel ?? getDefaultCityForLocation(id) ?? undefined;
    return {
      id,
      ...(cityLabel ? { cityLabel } : {}),
      pinnedAt: typeof raw.pinnedAt === 'number' ? raw.pinnedAt : pinnedAtFallback,
    };
  }

  return null;
}

/**
 * @param {unknown[]} pins
 * @returns {PinEntry[]}
 */
export function normalizePinEntries(pins) {
  const seen = new Set();

  return pins
    .map((raw, index) => normalizePinEntry(raw, Date.now() + index))
    .filter((pin) => {
      if (!pin || seen.has(pin.id)) {
        return false;
      }

      seen.add(pin.id);
      return true;
    });
}

/**
 * @param {PinEntry[]} pins
 */
export function getPinIds(pins) {
  return pins.map((pin) => pin.id);
}

/**
 * @param {PinEntry | string} pin
 */
export function getPinId(pin) {
  return typeof pin === 'string' ? migratePinId(pin) : pin.id;
}

function pinsEqual(a, b) {
  return (
    a.id === b.id
    && a.cityLabel === b.cityLabel
    && a.pinnedAt === b.pinnedAt
  );
}

function readStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEYS, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve({
        pins: Array.isArray(result.pins) ? result.pins : [],
        use24Hour: Boolean(result.use24Hour),
        defaultPinsApplied: Boolean(result.defaultPinsApplied),
        lastSearchQuery: typeof result.lastSearchQuery === 'string' ? result.lastSearchQuery : '',
      });
    });
  });
}

function writeStorage(partial) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(partial, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

export async function getPrefs() {
  return readStorage();
}

export async function getPins() {
  const { pins } = await readStorage();
  const normalized = normalizePinEntries(pins);
  const needsPersist = normalized.length !== pins.length
    || normalized.some((pin, index) => {
      const raw = pins[index];
      if (typeof raw === 'string') {
        return true;
      }

      if (!raw || typeof raw !== 'object') {
        return true;
      }

      return !pinsEqual(pin, {
        id: migratePinId(raw.id),
        cityLabel: raw.cityLabel,
        pinnedAt: raw.pinnedAt,
      });
    });

  if (needsPersist) {
    await writeStorage({ pins: normalized });
  }

  return normalized;
}

/** @param {PinEntry[]} pins */
export async function setPins(pins) {
  await writeStorage({ pins: normalizePinEntries(pins) });
}

export async function setPrefs(partial) {
  await writeStorage(partial);
}

export async function getLastSearchQuery() {
  const { lastSearchQuery } = await readStorage();
  return lastSearchQuery.trim();
}

export async function setLastSearchQuery(query) {
  await writeStorage({ lastSearchQuery: query.trim() });
}

/**
 * @param {string} id
 * @param {{ cityLabel?: string }} [options]
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'duplicate' | 'max' | 'invalid' }>}
 */
export async function addPin(id, options = {}) {
  const locationId = migratePinId(id);

  if (!locationId || !getLocationById(locationId)) {
    return { ok: false, reason: 'invalid' };
  }

  const pins = await getPins();

  if (pins.some((pin) => pin.id === locationId)) {
    return { ok: false, reason: 'duplicate' };
  }

  if (pins.length >= MAX_PINS) {
    return { ok: false, reason: 'max' };
  }

  const cityLabel = options.cityLabel ?? getDefaultCityForLocation(locationId) ?? undefined;
  const entry = {
    id: locationId,
    ...(cityLabel ? { cityLabel } : {}),
    pinnedAt: Date.now(),
  };

  await writeStorage({ pins: [...pins, entry] });
  return { ok: true };
}

export async function removePin(id) {
  const locationId = migratePinId(id);
  const pins = await getPins();
  await writeStorage({ pins: pins.filter((pin) => pin.id !== locationId) });
}

function pinEntryFromId(id, pinnedAt = Date.now()) {
  const locationId = migratePinId(id);
  const cityLabel = getDefaultCityForLocation(locationId) ?? undefined;

  return {
    id: locationId,
    ...(cityLabel ? { cityLabel } : {}),
    pinnedAt,
  };
}

export async function applyFirstRunDefaults() {
  const prefs = await readStorage();

  if (prefs.defaultPinsApplied) {
    return normalizePinEntries(prefs.pins);
  }

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hubIds = getOnboardingPinIds(userTz);
  const pins = hubIds.map((id, index) => pinEntryFromId(id, Date.now() + index));

  await writeStorage({
    pins,
    defaultPinsApplied: true,
  });

  return pins;
}
