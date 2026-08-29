/**
 * ZoneDrift popup — saved-first layout with location rows (Phase 8A).
 */

import { filterCitiesInGroup } from './data/cities.js';
import {
  getLocationById,
  getLocationLabel,
  migratePinId,
  resolvePinnedLocations,
} from './data/locations.js';
import { filterSearchResults } from './js/search.js';
import { formatLocationRowMeta, getLocationRowLabel } from './js/display.js';
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
  offsetBetweenZones,
  offsetVsLocal,
} from './js/time-engine.js';

const scrubSlider = document.getElementById('scrub-slider');
const scrubBadge = document.getElementById('scrub-badge');
const scrubReset = document.getElementById('scrub-reset');
const searchInput = document.getElementById('search-input');
const answerSection = document.getElementById('answer-section');
const answerCard = document.getElementById('answer-card');
const pinnedList = document.getElementById('pinned-list');
const pinnedEmpty = document.getElementById('pinned-empty');
const statusMessage = document.getElementById('status-message');

let cachedPinIds = [];
let use24Hour = false;
let tickInterval = null;
let browseCitiesOpen = false;
let activeBrowseGroupId = null;

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

function isPinned(locationId) {
  return cachedPinIds.includes(migratePinId(locationId));
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
    metaEl.textContent = formatLocationRowMeta(abbrev, offsetLabel);
  }
}

function updateAllTimes() {
  const displayTime = getDisplayTime(Number(scrubSlider.value));
  const locations = resolvePinnedLocations(cachedPinIds);

  for (const location of locations) {
    const row = pinnedList.querySelector(`[data-location-id="${location.id}"]`);
    if (row) {
      updateLocationTimeElements(row, location, displayTime);
    }
  }

  if (!answerSection.classList.contains('hidden')) {
    for (const target of answerCard.querySelectorAll('[data-location-id]')) {
      const location = getLocationById(target.dataset.locationId);
      if (location) {
        updateLocationTimeElements(target, location, displayTime);
      }
    }
  }
}

function createPinButton(location, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn--pin';
  button.textContent = isPinned(location.id) ? 'Saved' : 'Pin';
  button.disabled = isPinned(location.id);

  if (!button.disabled) {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      handleAddPin(location.id);
    });
  }

  button.setAttribute('aria-label', `${label} ${location.name}`);
  return button;
}

function getVariantDiffMessage(variants, displayTime) {
  if (variants.length < 2) {
    return '';
  }

  const diffHours = Math.abs(offsetBetweenZones(variants[0].tz, variants[1].tz, displayTime));

  if (diffHours === 0) {
    return 'Same time right now — either works.';
  }

  if (diffHours === 0.5) {
    return '30 minute difference — pick the city your contact is in.';
  }

  const hours = Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1);
  const unit = diffHours === 1 ? 'hour' : 'hours';
  return `${hours} ${unit} difference — pick the city your contact is in.`;
}

function renderCityBrowseList(container, groupId, filterText = '') {
  const cities = filterCitiesInGroup(groupId, filterText);
  container.innerHTML = '';

  for (const city of cities) {
    const location = getLocationById(city.locationId);
    if (!location) {
      continue;
    }

    const row = document.createElement('li');
    row.className = 'answer-card__city-item';
    row.dataset.locationId = location.id;
    row.innerHTML = `
      <div class="answer-card__city-item-body">
        <span class="answer-card__city-name">${city.name}</span>
        <span class="answer-card__city-time">
          <span data-role="time">—:—:— —</span>
          <span data-role="abbrev">—</span>
        </span>
      </div>
    `;
    row.appendChild(createPinButton(location, 'Pin'));
    container.appendChild(row);
    updateLocationTimeElements(row, location, getDisplayTime(Number(scrubSlider.value)));
  }
}

function renderSingleAnswer(location, options = {}) {
  const label = getLocationLabel(location);
  const shell = document.createElement('article');
  shell.className = 'answer-card answer-card--single';
  shell.dataset.locationId = location.id;

  const cityHint = options.source === 'city'
    ? `<p class="answer-card__hint">Matched city in ${location.name}</p>`
    : '';

  shell.innerHTML = `
    <div class="answer-card__body">
      ${cityHint}
      <h3 class="answer-card__title">${label} · <span data-role="abbrev">—</span></h3>
      ${location.regionHint ? `<p class="answer-card__region-hint">${location.regionHint}</p>` : ''}
      <p class="answer-card__time" data-role="time">—:—:— —</p>
      <p class="answer-card__offset" data-role="offset">—</p>
    </div>
  `;

  shell.appendChild(createPinButton(location, isPinned(location.id) ? 'Saved' : 'Pin'));
  answerCard.replaceChildren(shell);
  updateLocationTimeElements(shell, location, getDisplayTime(Number(scrubSlider.value)));
}

function renderGroupAnswer(groupResult) {
  const displayTime = getDisplayTime(Number(scrubSlider.value));
  const shell = document.createElement('article');
  shell.className = 'answer-card answer-card--group';
  shell.innerHTML = `
    <p class="answer-card__heading">Where in ${groupResult.name}?</p>
    <p class="answer-card__helper">${getVariantDiffMessage(groupResult.variants, displayTime)}</p>
    <div class="answer-card__variants"></div>
    <div class="answer-card__browse">
      <button type="button" class="btn btn--ghost btn--compact answer-card__browse-toggle">
        ${browseCitiesOpen && activeBrowseGroupId === groupResult.groupId ? 'Hide cities' : 'Browse cities'}
      </button>
      <div class="answer-card__city-browse ${browseCitiesOpen && activeBrowseGroupId === groupResult.groupId ? '' : 'hidden'}">
        <input
          type="search"
          class="answer-card__city-filter"
          placeholder="Filter cities in ${groupResult.name}…"
          autocomplete="off"
          spellcheck="false"
        />
        <ul class="answer-card__city-list"></ul>
      </div>
    </div>
  `;

  const variantsRoot = shell.querySelector('.answer-card__variants');

  for (const location of groupResult.variants) {
    const row = document.createElement('div');
    row.className = 'answer-card__variant';
    row.dataset.locationId = location.id;
    row.innerHTML = `
      <div class="answer-card__variant-body">
        <span class="answer-card__variant-label">${location.sublabel}</span>
        <span class="answer-card__variant-hint">${location.regionHint ?? ''}</span>
        <span class="answer-card__variant-time">
          <span data-role="time">—:—:— —</span>
          <span data-role="abbrev">—</span>
        </span>
        <span class="answer-card__offset" data-role="offset">—</span>
      </div>
    `;
    row.appendChild(createPinButton(location, 'Pin'));
    variantsRoot.appendChild(row);
    updateLocationTimeElements(row, location, displayTime);
  }

  const browseToggle = shell.querySelector('.answer-card__browse-toggle');
  const cityBrowse = shell.querySelector('.answer-card__city-browse');
  const cityFilter = shell.querySelector('.answer-card__city-filter');
  const cityList = shell.querySelector('.answer-card__city-list');

  browseToggle.addEventListener('click', () => {
    if (browseCitiesOpen && activeBrowseGroupId === groupResult.groupId) {
      browseCitiesOpen = false;
      activeBrowseGroupId = null;
    } else {
      browseCitiesOpen = true;
      activeBrowseGroupId = groupResult.groupId;
    }
    renderAnswerCard();
  });

  if (browseCitiesOpen && activeBrowseGroupId === groupResult.groupId) {
    renderCityBrowseList(cityList, groupResult.groupId, cityFilter.value);
    cityFilter.addEventListener('input', () => {
      renderCityBrowseList(cityList, groupResult.groupId, cityFilter.value);
    });
    cityBrowse.classList.remove('hidden');
  }

  answerCard.replaceChildren(shell);
}

function renderAnswerCard() {
  const query = searchInput.value.trim();

  if (!query) {
    answerSection.classList.add('hidden');
    answerCard.innerHTML = '';
    return;
  }

  answerSection.classList.remove('hidden');
  const results = filterSearchResults(query);

  if (results.length === 0) {
    answerCard.innerHTML = '<p class="answer-card__empty">No locations match your search.</p>';
    return;
  }

  const topResult = results[0];

  if (topResult.type === 'single') {
    renderSingleAnswer(topResult.location, { source: topResult.source });
    return;
  }

  renderGroupAnswer(topResult);
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
  renderAnswerCard();
  updatePinLimitStatus(cachedPinIds);

  const row = pinnedList.querySelector(`[data-location-id="${migratePinId(locationId)}"]`);
  row?.scrollIntoView({ block: 'nearest' });
}

function createLocationRow(location, options = {}) {
  const { mode = 'saved', cityLabel } = options;
  const label = getLocationRowLabel(location, cityLabel);
  const row = document.createElement('article');
  row.className = `loc-row loc-row--${mode}`;
  row.dataset.locationId = location.id;

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
      renderAnswerCard();
      updateAllTimes();
      startTick();
      updatePinLimitStatus(pins);
    });
    row.appendChild(removeButton);
  }

  updateLocationTimeElements(row, location, getDisplayTime(Number(scrubSlider.value)));
  return row;
}

function renderPinnedList(pinIds) {
  cachedPinIds = pinIds;
  const locations = resolvePinnedLocations(pinIds);
  pinnedList.querySelectorAll('.loc-row').forEach((node) => node.remove());

  if (locations.length === 0) {
    pinnedEmpty.classList.remove('hidden');
    stopTick();
    renderAnswerCard();
    return;
  }

  pinnedEmpty.classList.add('hidden');

  for (const location of locations) {
    pinnedList.appendChild(createLocationRow(location, { mode: 'saved' }));
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

function handleSearchInput() {
  browseCitiesOpen = false;
  activeBrowseGroupId = null;
  renderAnswerCard();
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
    updateAllTimes();
    startTick();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateScrubUi();
  initApp();
});
