/**
 * ZoneDrift popup — Phase 0 shell.
 * Time engine, storage, and search arrive in later phases.
 */

const scrubSlider = document.getElementById('scrub-slider');
const scrubBadge = document.getElementById('scrub-badge');
const scrubReset = document.getElementById('scrub-reset');
const searchInput = document.getElementById('search-input');
const addSection = document.getElementById('add-section');

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

scrubSlider.addEventListener('input', updateScrubUi);

scrubReset.addEventListener('click', () => {
  scrubSlider.value = '0';
  updateScrubUi();
});

searchInput.addEventListener('input', updateSearchUi);

document.addEventListener('DOMContentLoaded', () => {
  updateScrubUi();
  updateSearchUi();
});
