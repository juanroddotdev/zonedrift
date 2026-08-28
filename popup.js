/**
 * ZoneDrift popup — Phase 1: storage + location data wired in.
 * Clock rendering arrives in Phase 3.
 */

import { resolvePinnedLocations } from './data/locations.js';
import {
  MAX_PINS,
  addPin,
  applyFirstRunDefaults,
  getPins,
  removePin,
} from './js/storage.js';

const scrubSlider = document.getElementById('scrub-slider');
const scrubBadge = document.getElementById('scrub-badge');
const scrubReset = document.getElementById('scrub-reset');
const searchInput = document.getElementById('search-input');
const addSection = document.getElementById('add-section');
const pinnedList = document.getElementById('pinned-list');
const pinnedEmpty = document.getElementById('pinned-empty');
const statusMessage = document.getElementById('status-message');

function formatScrubBadge(hours) {
  const value = Number(hours);

  if (value === 0) {
    return 'Now';
  }

  const sign = value > 0 ? '+' : '-';
  const abs = Math.abs(value);

  if (abs === 0.5) {
    return `${sign}30 Minutes`;
  }

  if (Number.isInteger(abs)) {
    const unit = abs === 1 ? 'Hour' : 'Hours';
    return `${sign}${abs} ${unit}`;
  }

  const whole = Math.floor(abs);
  return `${sign}${whole}.5 Hours`;
}

function updateScrubUi() {
  const hours = Number(scrubSlider.value);
  const label = formatScrubBadge(hours);

  scrubBadge.textContent = label;
  scrubSlider.setAttribute('aria-valuetext', label);
}

function updateSearchUi() {
  const hasQuery = searchInput.value.trim().length > 0;
  addSection.classList.toggle('hidden', !hasQuery);
}

function showStatus(message) {
  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.classList.toggle('hidden', !message);
}

function renderPinnedList(pinIds) {
  const locations = resolvePinnedLocations(pinIds);
  pinnedList.querySelectorAll('.card').forEach((node) => node.remove());

  if (locations.length === 0) {
    pinnedEmpty.classList.remove('hidden');
    return;
  }

  pinnedEmpty.classList.add('hidden');

  for (const location of locations) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.locationId = location.id;

    const note = location.note
      ? `<p class="card__zone">${location.note}</p>`
      : `<p class="card__zone">${location.tz}</p>`;

    card.innerHTML = `
      <div class="card__body">
        <h3 class="card__title">${location.name} (${location.code})</h3>
        ${note}
        <p class="card__time">—:—:— —</p>
        <p class="card__offset">Clocks arrive in Phase 3</p>
      </div>
      <button type="button" class="card__remove" aria-label="Remove ${location.name}">×</button>
    `;

    card.querySelector('.card__remove').addEventListener('click', async () => {
      await removePin(location.id);
      const pins = await getPins();
      renderPinnedList(pins);
    });

    pinnedList.appendChild(card);
  }
}

async function initApp() {
  await applyFirstRunDefaults();
  const pins = await getPins();
  renderPinnedList(pins);
  showStatus(pins.length >= MAX_PINS ? `Pin limit reached (${MAX_PINS}).` : '');
}

scrubSlider.addEventListener('input', updateScrubUi);

scrubReset.addEventListener('click', () => {
  scrubSlider.value = '0';
  updateScrubUi();
});

searchInput.addEventListener('input', updateSearchUi);

document.addEventListener('DOMContentLoaded', () => {
  updateScrubUi();
  updateSearchUi();
  initApp();
});

// Exported for upcoming search/add flow (Phase 4) and manual verification.
export { addPin, getPins, renderPinnedList, showStatus };
