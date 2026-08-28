import { getLocationById, getOnboardingPinIds, migratePinId } from '../data/locations.js';

export const MAX_PINS = 12;

const STORAGE_KEYS = ['pins', 'use24Hour', 'defaultPinsApplied'];

function normalizePins(pins) {
  const seen = new Set();

  return pins
    .map((id) => migratePinId(id))
    .filter((id) => {
      if (!getLocationById(id) || seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });
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
  const normalized = normalizePins(pins);

  if (normalized.length !== pins.length || normalized.some((id, index) => id !== pins[index])) {
    await writeStorage({ pins: normalized });
  }

  return normalized;
}

export async function setPins(pins) {
  await writeStorage({ pins });
}

export async function setPrefs(partial) {
  await writeStorage(partial);
}

/**
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'duplicate' | 'max' | 'invalid' }>}
 */
export async function addPin(id) {
  const locationId = migratePinId(id);

  if (!locationId || !getLocationById(locationId)) {
    return { ok: false, reason: 'invalid' };
  }

  const pins = await getPins();

  if (pins.includes(locationId)) {
    return { ok: false, reason: 'duplicate' };
  }

  if (pins.length >= MAX_PINS) {
    return { ok: false, reason: 'max' };
  }

  await writeStorage({ pins: [...pins, locationId] });
  return { ok: true };
}

export async function removePin(id) {
  const { pins } = await readStorage();
  await writeStorage({ pins: pins.filter((pinId) => pinId !== id) });
}

export async function applyFirstRunDefaults() {
  const prefs = await readStorage();

  if (prefs.defaultPinsApplied) {
    return prefs.pins;
  }

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const pins = getOnboardingPinIds(userTz);

  await writeStorage({
    pins,
    defaultPinsApplied: true,
  });

  return pins;
}
