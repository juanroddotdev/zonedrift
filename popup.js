/**
 * ZoneDrift popup — unified list UI (Phase 8).
 */

import { getLocationById, migratePinId } from './data/locations.js';
import { filterSearchResults } from './js/search.js';
import { formatLocationRowMeta, getLocationRowLabel } from './js/display.js';
import {
  MAX_PINS,
  addPin,
  applyFirstRunDefaults,
  getLastSearchQuery,
  getPins,
  getPrefs,
  removePin,
  setLastSearchQuery,
} from './js/storage.js';
import {
  formatClock,
  formatOffsetLabel,
  formatScrubBadge,
  formatZoneAbbrev,
  getDisplayTime,
  offsetVsLocal,
} from './js/time-engine.js';

const MAX_SUGGESTIONS = 5;

const scrubSlider = document.getElementById('scrub-slider');
const scrubBadge = document.getElementById('scrub-badge');
const scrubReset = document.getElementById('scrub-reset');
const plannerToggle = document.getElementById('planner-toggle');
const plannerPanel = document.getElementById('planner-panel');
const searchInput = document.getElementById('search-input');
const searchSuggestions = document.getElementById('search-suggestions');
const pinnedList = document.getElementById('pinned-list');
const pinnedEmpty = document.getElementById('pinned-empty');
const statusMessage = document.getElementById('status-message');

let cachedPins = [];
let use24Hour = false;
let tickInterval = null;

function updateScrubUi() {
  const hours = Number(scrubSlider.value);
  const label = formatScrubBadge(hours);

  scrubBadge.textContent = label;
  scrubSlider.setAttribute('aria-valuetext', label);
  plannerToggle.classList.toggle('planner-toggle--active', hours !== 0);
}

function isPlannerOpen() {
  return plannerToggle.getAttribute('aria-expanded') === 'true';
}

function openPlanner() {
  plannerPanel.classList.remove('hidden');
  plannerToggle.setAttribute('aria-expanded', 'true');
}

function closePlanner() {
  plannerPanel.classList.add('hidden');
  plannerToggle.setAttribute('aria-expanded', 'false');

  if (Number(scrubSlider.value) !== 0) {
    scrubSlider.value = '0';
    updateScrubUi();
    updateAllTimes();
    startTick();
  }
}

function togglePlanner() {
  if (isPlannerOpen()) {
    closePlanner();
    return;
  }

  openPlanner();
}

function showStatus(message) {
  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.classList.toggle('hidden', !message);
}

function updatePinLimitStatus(pins = cachedPins) {
  showStatus(pins.length >= MAX_PINS ? `Pin limit reached (${MAX_PINS}).` : '');
}

function isPinned(locationId) {
  const id = migratePinId(locationId);
  return cachedPins.some((pin) => pin.id === id);
}

function stopTick() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function startTick() {
  stopTick();

  if (Number(scrubSlider.value) !== 0) {
    return;
  }

  tickInterval = setInterval(() => {
    updateAllTimes();
  }, 1000);
}

function updateLocationTimeElements(root, location, displayTime) {
  const abbrev = formatZoneAbbrev(location.tz, displayTime);
  const offsetLabel = formatOffsetLabel(offsetVsLocal(location.tz, displayTime));
  const abbrevEl = root.querySelector('[data-role="abbrev"]');
  const timeEl = root.querySelector('[data-role="time"]');
  const offsetEl = root.querySelector('[data-role="offset"]');
  const metaEl = root.querySelector('[data-role="meta"]');

  if (abbrevEl) {
    abbrevEl.textContent = abbrev;
  }

  if (timeEl) {
    const compact = timeEl.classList.contains('loc-row__time');
    timeEl.textContent = formatClock(location.tz, displayTime, use24Hour, !compact);
  }

  if (offsetEl) {
    offsetEl.textContent = offsetLabel;
  }

  if (metaEl) {
    metaEl.textContent = formatLocationRowMeta(abbrev, offsetVsLocal(location.tz, displayTime));
  }
}

function updateAllTimes() {
  const displayTime = getDisplayTime(Number(scrubSlider.value));

  for (const row of document.querySelectorAll('.loc-row[data-location-id]')) {
    const location = getLocationById(row.dataset.locationId);
    if (location) {
      updateLocationTimeElements(row, location, displayTime);
    }
  }
}

function expandSearchResults(results) {
  const items = [];

  for (const result of results) {
    if (result.type === 'single') {
      items.push({
        location: result.location,
        cityLabel: result.cityLabel,
      });
    } else {
      for (const location of result.variants) {
        items.push({ location });
      }
    }

    if (items.length >= MAX_SUGGESTIONS) {
      break;
    }
  }

  return items.slice(0, MAX_SUGGESTIONS);
}

async function clearSearchQuery() {
  searchInput.value = '';
  await setLastSearchQuery('');
  renderSearchSuggestions();
}

function renderSearchSuggestions() {
  const query = searchInput.value.trim();
  searchSuggestions.replaceChildren('');

  if (!query) {
    searchSuggestions.classList.add('hidden');
    searchInput.setAttribute('aria-expanded', 'false');
    return;
  }

  const results = filterSearchResults(query);
  searchSuggestions.classList.remove('hidden');
  searchInput.setAttribute('aria-expanded', 'true');

  if (results.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'search-results__empty';
    empty.textContent = 'No matches';
    searchSuggestions.appendChild(empty);
    return;
  }

  for (const item of expandSearchResults(results)) {
    searchSuggestions.appendChild(
      createLocationRow(item.location, { mode: 'suggestion', cityLabel: item.cityLabel }),
    );
  }

  updateAllTimes();
}

async function handleAddPin(locationId, options = {}) {
  const result = await addPin(locationId, options);

  if (!result.ok) {
    if (result.reason === 'max') {
      showStatus(`Pin limit reached (${MAX_PINS}).`);
    }
    return;
  }

  cachedPins = await getPins();
  await clearSearchQuery();
  renderPinnedList(cachedPins);
  updatePinLimitStatus(cachedPins);

  const row = pinnedList.querySelector(`[data-location-id="${migratePinId(locationId)}"]`);
  row?.scrollIntoView({ block: 'nearest' });
}

function createLocationRow(location, options = {}) {
  const { mode = 'saved', cityLabel } = options;
  const label = getLocationRowLabel(location, cityLabel);
  const row = document.createElement('article');
  row.className = `loc-row loc-row--${mode}`;
  row.dataset.locationId = location.id;
  row.setAttribute('role', mode === 'suggestion' ? 'option' : undefined);

  row.innerHTML = `
    <div class="loc-row__main">
      <div class="loc-row__label-block">
        <span class="loc-row__label">${label}</span>
        <span class="loc-row__meta" data-role="meta">—</span>
      </div>
      <time class="loc-row__time" data-role="time">—:—</time>
    </div>
  `;

  if (mode === 'saved') {
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'loc-row__remove';
    removeButton.setAttribute('aria-label', `Remove ${label}`);
    removeButton.textContent = '×';
    removeButton.addEventListener('click', async () => {
      await removePin(location.id);
      const pins = await getPins();
      renderPinnedList(pins);
      renderSearchSuggestions();
      updateAllTimes();
      startTick();
      updatePinLimitStatus(pins);
    });
    row.appendChild(removeButton);
  }

  if (mode === 'suggestion') {
    const pinned = isPinned(location.id);
    const pinButton = document.createElement('button');
    pinButton.type = 'button';
    pinButton.className = 'loc-row__pin';
    pinButton.textContent = pinned ? '✓' : '+';
    pinButton.disabled = pinned;
    pinButton.setAttribute('aria-label', pinned ? `${label} saved` : `Add ${label}`);
    pinButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      await handleAddPin(location.id, { cityLabel });
    });
    row.appendChild(pinButton);
  }

  updateLocationTimeElements(row, location, getDisplayTime(Number(scrubSlider.value)));
  return row;
}

function renderPinnedList(pins) {
  cachedPins = pins;
  pinnedList.querySelectorAll('.loc-row').forEach((node) => node.remove());

  if (pins.length === 0) {
    pinnedEmpty.classList.remove('hidden');
    stopTick();
    renderSearchSuggestions();
    return;
  }

  pinnedEmpty.classList.add('hidden');

  for (const pin of pins) {
    const location = getLocationById(pin.id);
    if (!location) {
      continue;
    }

    pinnedList.appendChild(createLocationRow(location, {
      mode: 'saved',
      cityLabel: pin.cityLabel,
    }));
  }

  updateAllTimes();
  startTick();
}

function handleScrubChange() {
  updateScrubUi();
  updateAllTimes();

  if (Number(scrubSlider.value) === 0) {
    startTick();
  } else {
    stopTick();
  }
}

async function handleSearchInput() {
  await setLastSearchQuery(searchInput.value);
  renderSearchSuggestions();
  updatePinLimitStatus();
}

async function initApp() {
  const prefs = await getPrefs();
  use24Hour = prefs.use24Hour;

  await applyFirstRunDefaults();
  const pins = await getPins();
  renderPinnedList(pins);
  updatePinLimitStatus(pins);

  const lastQuery = await getLastSearchQuery();
  if (lastQuery) {
    searchInput.value = lastQuery;
    renderSearchSuggestions();
  }

  searchInput.focus();
}

scrubSlider.addEventListener('input', handleScrubChange);

scrubReset.addEventListener('click', () => {
  scrubSlider.value = '0';
  handleScrubChange();
});

plannerToggle.addEventListener('click', togglePlanner);

searchInput.addEventListener('input', handleSearchInput);

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    clearSearchQuery();
    searchInput.blur();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return;
  }

  event.preventDefault();
  searchInput.focus();
  searchInput.select();
});

window.addEventListener('pagehide', () => {
  stopTick();
  void setLastSearchQuery(searchInput.value);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    stopTick();
    return;
  }

  if (Number(scrubSlider.value) === 0) {
    updateAllTimes();
    startTick();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateScrubUi();
  initApp();
});
