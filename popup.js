/**
 * ZoneDrift popup — Phase 4: search and add flow.
 */

import { resolvePinnedLocations } from './data/locations.js';
import { filterLocations } from './js/search.js';
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
const addSection = document.getElementById('add-section');
const addList = document.getElementById('add-list');
const addEmpty = document.getElementById('add-empty');
const pinnedList = document.getElementById('pinned-list');
const pinnedEmpty = document.getElementById('pinned-empty');
const statusMessage = document.getElementById('status-message');

let cachedPinIds = [];
let use24Hour = false;
let tickInterval = null;

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
  showStatus(pinIds.length >= MAX_PINS ? `Pin limit reached (${MAX_PINS}).` : '');
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

function renderAddList() {
  const query = searchInput.value;
  const hasQuery = query.trim().length > 0;
  const results = filterLocations(query, cachedPinIds);
  const displayTime = getDisplayTime(Number(scrubSlider.value));

  addSection.classList.toggle('hidden', !hasQuery);
  addList.innerHTML = '';

  if (!hasQuery) {
    addEmpty.classList.add('hidden');
    return;
  }

  addEmpty.classList.toggle('hidden', results.length > 0);

  for (const location of results) {
    const item = document.createElement('li');
    item.className = 'add-list__item';

    const zoneLabel = formatZoneAbbrev(location.tz, displayTime);
    item.innerHTML = `
      <div class="add-list__info">
        <span class="add-list__name">${location.name} (${location.code})</span>
        <span class="add-list__meta">${zoneLabel}</span>
      </div>
      <button type="button" class="btn btn--add" aria-label="Add ${location.name}">+</button>
    `;

    const handleAdd = () => {
      handleAddPin(location.id);
    };

    item.addEventListener('click', (event) => {
      if (event.target.closest('.btn--add')) {
        return;
      }
      handleAdd();
    });

    item.querySelector('.btn--add').addEventListener('click', (event) => {
      event.stopPropagation();
      handleAdd();
    });

    addList.appendChild(item);
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
  renderPinnedList(cachedPinIds);
  renderAddList();
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
    renderAddList();
    return;
  }

  pinnedEmpty.classList.add('hidden');

  for (const location of locations) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.locationId = location.id;

    card.innerHTML = `
      <div class="card__body">
        <h3 class="card__title">
          ${location.name} (${location.code}) · <span class="card__abbrev">—</span>
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
  renderAddList();

  if (Number(scrubSlider.value) === 0) {
    startTick();
  } else {
    stopTick();
  }
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

searchInput.addEventListener('input', renderAddList);

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
