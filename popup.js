/**
 * ZoneDrift popup — saved-first layout with lookup answer card.
 */

import {
  getLocationById,
  getLocationLabel,
  migratePinId,
  resolvePinnedLocations,
} from './data/locations.js';
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
const answerSection = document.getElementById('answer-section');
const answerCard = document.getElementById('answer-card');
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
  const abbrevEl = root.querySelector('[data-role="abbrev"]');
  const timeEl = root.querySelector('[data-role="time"]');
  const offsetEl = root.querySelector('[data-role="offset"]');

  if (abbrevEl) {
    abbrevEl.textContent = abbrev;
  }

  if (timeEl) {
    timeEl.textContent = formatClock(location.tz, displayTime, use24Hour);
  }

  if (offsetEl) {
    offsetEl.textContent = formatOffsetLabel(offsetVsLocal(location.tz, displayTime));
  }
}

function updateAllTimes() {
  const displayTime = getDisplayTime(Number(scrubSlider.value));
  const locations = resolvePinnedLocations(cachedPinIds);

  for (const location of locations) {
    const card = pinnedList.querySelector(`[data-location-id="${location.id}"]`);
    if (card) {
      updateLocationTimeElements(card, location, displayTime);
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

function renderSingleAnswer(location) {
  const label = getLocationLabel(location);
  const shell = document.createElement('article');
  shell.className = 'answer-card answer-card--single';
  shell.dataset.locationId = location.id;
  shell.innerHTML = `
    <div class="answer-card__body">
      <h3 class="answer-card__title">${label} · <span data-role="abbrev">—</span></h3>
      <p class="answer-card__time" data-role="time">—:—:— —</p>
      <p class="answer-card__offset" data-role="offset">—</p>
    </div>
  `;

  shell.appendChild(createPinButton(location, isPinned(location.id) ? 'Saved' : 'Pin'));
  answerCard.replaceChildren(shell);
  updateLocationTimeElements(shell, location, getDisplayTime(Number(scrubSlider.value)));
}

function renderGroupAnswer(groupResult) {
  const shell = document.createElement('article');
  shell.className = 'answer-card answer-card--group';
  shell.innerHTML = `
    <p class="answer-card__heading">Where in ${groupResult.name}?</p>
    <div class="answer-card__variants"></div>
  `;

  const variantsRoot = shell.querySelector('.answer-card__variants');

  for (const location of groupResult.variants) {
    const row = document.createElement('div');
    row.className = 'answer-card__variant';
    row.dataset.locationId = location.id;
    row.innerHTML = `
      <div class="answer-card__variant-body">
        <span class="answer-card__variant-label">${location.sublabel}</span>
        <span class="answer-card__variant-time">
          <span data-role="time">—:—:— —</span>
          <span data-role="abbrev">—</span>
        </span>
        <span class="answer-card__offset" data-role="offset">—</span>
      </div>
    `;
    row.appendChild(createPinButton(location, 'Pin'));
    variantsRoot.appendChild(row);
    updateLocationTimeElements(row, location, getDisplayTime(Number(scrubSlider.value)));
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
  const results = filterSearchResults(query, cachedPinIds);

  if (results.length === 0) {
    answerCard.innerHTML = '<p class="answer-card__empty">No locations match your search.</p>';
    return;
  }

  const topResult = results[0];

  if (topResult.type === 'single') {
    renderSingleAnswer(topResult.location);
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

  const card = pinnedList.querySelector(`[data-location-id="${migratePinId(locationId)}"]`);
  card?.scrollIntoView({ block: 'nearest' });
}

function renderPinnedList(pinIds) {
  cachedPinIds = pinIds;
  const locations = resolvePinnedLocations(pinIds);
  pinnedList.querySelectorAll('.card').forEach((node) => node.remove());

  if (locations.length === 0) {
    pinnedEmpty.classList.remove('hidden');
    stopTick();
    renderAnswerCard();
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
          ${label} · <span data-role="abbrev">—</span>
        </h3>
        <p class="card__time" data-role="time">—:—:— —</p>
        <p class="card__offset" data-role="offset">—</p>
      </div>
      <button type="button" class="card__remove" aria-label="Remove ${location.name}">×</button>
    `;

    card.querySelector('.card__remove').addEventListener('click', async () => {
      await removePin(location.id);
      const pins = await getPins();
      renderPinnedList(pins);
      renderAnswerCard();
      updateAllTimes();
      startTick();
      updatePinLimitStatus(pins);
    });

    pinnedList.appendChild(card);
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
