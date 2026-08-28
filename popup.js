/**
 * ZoneDrift popup — search-first layout with multi-zone picker.
 */

import { getLocationLabel, resolvePinnedLocations } from './data/locations.js';
import { filterSearchResults } from './js/search.js';
import {
  MAX_PINS,
  addPin,
  applyFirstRunDefaults,
  getPins,
  getPrefs,
  removePin,
} from './js/storage.js';
import {
  formatClock,
  formatOffsetLabel,
  formatScrubBadge,
  formatZoneAbbrev,
  getDisplayTime,
  offsetVsLocal,
} from './js/time-engine.js';

const scrubSlider = document.getElementById('scrub-slider');
const scrubBadge = document.getElementById('scrub-badge');
const scrubReset = document.getElementById('scrub-reset');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchList = document.getElementById('search-list');
const searchEmpty = document.getElementById('search-empty');
const zonePicker = document.getElementById('zone-picker');
const pinnedList = document.getElementById('pinned-list');
const pinnedEmpty = document.getElementById('pinned-empty');
const statusMessage = document.getElementById('status-message');

let cachedPinIds = [];
let use24Hour = false;
let tickInterval = null;
let expandedGroupId = null;

function updateScrubUi() {
  const hours = Number(scrubSlider.value);
  const label = formatScrubBadge(hours);

  scrubBadge.textContent = label;
  scrubSlider.setAttribute('aria-valuetext', label);
}

function showStatus(message) {
  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.classList.toggle('hidden', !message);
}

function updatePinLimitStatus(pinIds = cachedPinIds) {
  if (pinIds.length >= MAX_PINS) {
    showStatus(`Pin limit reached (${MAX_PINS}).`);
    return;
  }

  if (!expandedGroupId) {
    showStatus('');
  }
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
    updatePinnedTimes();
  }, 1000);
}

function updatePinnedTimes() {
  const scrubHours = Number(scrubSlider.value);
  const displayTime = getDisplayTime(scrubHours);
  const locations = resolvePinnedLocations(cachedPinIds);

  for (const location of locations) {
    const card = pinnedList.querySelector(`[data-location-id="${location.id}"]`);
    if (!card) {
      continue;
    }

    const abbrev = formatZoneAbbrev(location.tz, displayTime);
    card.querySelector('.card__abbrev').textContent = abbrev;
    card.querySelector('.card__time').textContent = formatClock(
      location.tz,
      displayTime,
      use24Hour,
    );
    card.querySelector('.card__offset').textContent = formatOffsetLabel(
      offsetVsLocal(location.tz, displayTime),
    );
  }
}

function clearZonePicker() {
  expandedGroupId = null;
  zonePicker.classList.add('hidden');
  zonePicker.innerHTML = '';
}

function renderZonePicker(groupResult) {
  const displayTime = getDisplayTime(Number(scrubSlider.value));

  zonePicker.classList.remove('hidden');
  zonePicker.innerHTML = `
    <div class="zone-picker__card">
      <div class="zone-picker__header">
        <p class="zone-picker__title">Where in ${groupResult.name}?</p>
        <button type="button" class="zone-picker__close" aria-label="Close region picker">×</button>
      </div>
      <div class="zone-picker__options"></div>
    </div>
  `;

  const options = zonePicker.querySelector('.zone-picker__options');

  for (const location of groupResult.variants) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'zone-picker__option';
    option.innerHTML = `
      <span class="zone-picker__option-label">${location.sublabel}</span>
      <span class="zone-picker__option-meta">${formatZoneAbbrev(location.tz, displayTime)}</span>
    `;
    option.addEventListener('click', () => {
      handleAddPin(location.id);
    });
    options.appendChild(option);
  }

  zonePicker.querySelector('.zone-picker__close').addEventListener('click', () => {
    clearZonePicker();
    renderSearchResults();
  });
}

function renderSearchResults() {
  const query = searchInput.value;
  const hasQuery = query.trim().length > 0;
  const results = filterSearchResults(query, cachedPinIds);
  const displayTime = getDisplayTime(Number(scrubSlider.value));

  searchResults.classList.toggle('hidden', !hasQuery);
  searchList.innerHTML = '';

  if (!hasQuery) {
    searchEmpty.classList.add('hidden');
    clearZonePicker();
    return;
  }

  if (expandedGroupId && !results.some((result) => result.type === 'group' && result.groupId === expandedGroupId)) {
    clearZonePicker();
  }

  searchEmpty.classList.toggle('hidden', results.length > 0);

  for (const result of results) {
    const item = document.createElement('li');

    if (result.type === 'single') {
      const { location } = result;
      const zoneLabel = formatZoneAbbrev(location.tz, displayTime);

      item.className = 'search-results__item';
      item.innerHTML = `
        <div class="search-results__info">
          <span class="search-results__name">${location.name} (${location.code})</span>
          <span class="search-results__meta">${zoneLabel}</span>
        </div>
        <span class="search-results__action">+</span>
      `;

      item.addEventListener('click', () => {
        handleAddPin(location.id);
      });
    } else {
      const isExpanded = expandedGroupId === result.groupId;
      const variantCount = result.variants.length;

      item.className = `search-results__item search-results__item--group${isExpanded ? ' is-expanded' : ''}`;
      item.innerHTML = `
        <div class="search-results__info">
          <span class="search-results__name">${result.name} (${result.code})</span>
          <span class="search-results__meta">${variantCount} time zones</span>
        </div>
        <span class="search-results__action">›</span>
      `;

      item.addEventListener('click', () => {
        if (expandedGroupId === result.groupId) {
          clearZonePicker();
        } else {
          expandedGroupId = result.groupId;
        }
        renderSearchResults();
      });
    }

    searchList.appendChild(item);
  }

  if (expandedGroupId) {
    const activeGroup = results.find(
      (result) => result.type === 'group' && result.groupId === expandedGroupId,
    );

    if (activeGroup) {
      renderZonePicker(activeGroup);
    } else {
      clearZonePicker();
    }
  } else {
    zonePicker.classList.add('hidden');
    zonePicker.innerHTML = '';
  }
}

async function handleAddPin(locationId) {
  const result = await addPin(locationId);

  if (!result.ok) {
    if (result.reason === 'max') {
      showStatus(`Pin limit reached (${MAX_PINS}).`);
    }
    return;
  }

  cachedPinIds = await getPins();
  clearZonePicker();
  renderPinnedList(cachedPinIds);
  renderSearchResults();
  updatePinLimitStatus(cachedPinIds);

  const card = pinnedList.querySelector(`[data-location-id="${locationId}"]`);
  card?.scrollIntoView({ block: 'nearest' });
}

function renderPinnedList(pinIds) {
  cachedPinIds = pinIds;
  const locations = resolvePinnedLocations(pinIds);
  pinnedList.querySelectorAll('.card').forEach((node) => node.remove());

  if (locations.length === 0) {
    pinnedEmpty.classList.remove('hidden');
    stopTick();
    renderSearchResults();
    return;
  }

  pinnedEmpty.classList.add('hidden');

  for (const location of locations) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.locationId = location.id;
    const label = getLocationLabel(location);

    card.innerHTML = `
      <div class="card__body">
        <h3 class="card__title">
          ${label} · <span class="card__abbrev">—</span>
        </h3>
        <p class="card__time">—:—:— —</p>
        <p class="card__offset">—</p>
      </div>
      <button type="button" class="card__remove" aria-label="Remove ${location.name}">×</button>
    `;

    card.querySelector('.card__remove').addEventListener('click', async () => {
      await removePin(location.id);
      const pins = await getPins();
      renderPinnedList(pins);
      updatePinnedTimes();
      startTick();
      renderSearchResults();
      updatePinLimitStatus(pins);
    });

    pinnedList.appendChild(card);
  }

  updatePinnedTimes();
  startTick();
}

function handleScrubChange() {
  updateScrubUi();
  updatePinnedTimes();
  renderSearchResults();

  if (Number(scrubSlider.value) === 0) {
    startTick();
  } else {
    stopTick();
  }
}

function handleSearchInput() {
  clearZonePicker();
  renderSearchResults();
  updatePinLimitStatus();
}

async function initApp() {
  const prefs = await getPrefs();
  use24Hour = prefs.use24Hour;

  await applyFirstRunDefaults();
  const pins = await getPins();
  renderPinnedList(pins);
  updatePinLimitStatus(pins);
}

scrubSlider.addEventListener('input', handleScrubChange);

scrubReset.addEventListener('click', () => {
  scrubSlider.value = '0';
  handleScrubChange();
});

searchInput.addEventListener('input', handleSearchInput);

window.addEventListener('pagehide', stopTick);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    stopTick();
    return;
  }

  if (Number(scrubSlider.value) === 0) {
    updatePinnedTimes();
    startTick();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateScrubUi();
  initApp();
});
