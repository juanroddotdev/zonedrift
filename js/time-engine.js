/**
 * ZoneDrift time engine — Intl-based timezone math with DST support.
 */

export const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const MS_PER_HOUR = 60 * 60 * 1000;

export function getScrubOffsetMs(sliderValue) {
  return Number(sliderValue) * MS_PER_HOUR;
}

export function getDisplayTime(scrubHours, now = Date.now()) {
  return new Date(now + getScrubOffsetMs(scrubHours));
}

export function formatClock(tz, displayTime, use24Hour = false) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour,
  }).format(displayTime);
}

export function formatZoneAbbrev(tz, displayTime) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short',
  }).formatToParts(displayTime);

  return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
}

function getTimezoneOffsetMinutes(timeZone, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const values = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return (asUtc - date.getTime()) / 60000;
}

export function offsetVsLocal(tz, displayTime, localTz = userTz) {
  const tzOffset = getTimezoneOffsetMinutes(tz, displayTime);
  const localOffset = getTimezoneOffsetMinutes(localTz, displayTime);
  return (tzOffset - localOffset) / 60;
}

export function offsetBetweenZones(tzA, tzB, displayTime) {
  const offsetA = getTimezoneOffsetMinutes(tzA, displayTime);
  const offsetB = getTimezoneOffsetMinutes(tzB, displayTime);
  return (offsetA - offsetB) / 60;
}

export function formatOffsetLabel(deltaHours) {
  if (deltaHours === 0) {
    return 'Same time';
  }

  const sign = deltaHours > 0 ? '+' : '-';
  const abs = Math.abs(deltaHours);

  if (abs === 0.5) {
    return `${sign}30 min vs you`;
  }

  if (Number.isInteger(abs)) {
    const unit = abs === 1 ? 'hr' : 'hrs';
    return `${sign}${abs} ${unit} vs you`;
  }

  const whole = Math.floor(abs);
  return `${sign}${whole}.5 hrs vs you`;
}

export function formatScrubBadge(hours) {
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
