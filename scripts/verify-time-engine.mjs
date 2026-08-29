/**
 * Sanity checks for the time engine around US DST boundaries.
 * Run: node scripts/verify-time-engine.mjs
 */

import {
  formatClock,
  formatOffsetLabel,
  formatOffsetShort,
  formatScrubBadge,
  formatZoneAbbrev,
  getDisplayTime,
  offsetVsLocal,
} from '../js/time-engine.js';

const TZ = 'America/New_York';
const cases = [
  {
    label: 'Before spring forward (EST)',
    date: new Date('2026-03-08T06:30:00.000Z'),
    abbrev: 'EST',
  },
  {
    label: 'After spring forward (EDT)',
    date: new Date('2026-03-08T07:30:00.000Z'),
    abbrev: 'EDT',
  },
  {
    label: 'Before fall back (EDT)',
    date: new Date('2026-11-01T05:30:00.000Z'),
    abbrev: 'EDT',
  },
  {
    label: 'After fall back (EST)',
    date: new Date('2026-11-01T06:30:00.000Z'),
    abbrev: 'EST',
  },
];

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures += 1;
    return;
  }

  console.log(`ok: ${message}`);
}

console.log('--- DST boundary checks (America/New_York) ---');

for (const testCase of cases) {
  const abbrev = formatZoneAbbrev(TZ, testCase.date);
  const clock = formatClock(TZ, testCase.date);
  console.log(`${testCase.label}: ${clock} ${abbrev}`);
  assert(abbrev === testCase.abbrev, `${testCase.label} abbrev is ${testCase.abbrev}`);
}

console.log('\n--- Scrub badge formatter ---');
const badgeExpectations = [
  [0, 'Now'],
  [0.5, '+30 Minutes'],
  [-0.5, '-30 Minutes'],
  [1, '+1 Hour'],
  [-2, '-2 Hours'],
  [2.5, '+2.5 Hours'],
  [-3.5, '-3.5 Hours'],
];

for (const [hours, expected] of badgeExpectations) {
  const actual = formatScrubBadge(hours);
  assert(actual === expected, `formatScrubBadge(${hours}) -> ${expected}`);
}

console.log('\n--- Compact offset formatter ---');
assert(formatOffsetShort(0) === 'same time', 'formatOffsetShort(0)');
assert(formatOffsetShort(1) === '+1h', 'formatOffsetShort(+1)');
assert(formatOffsetShort(-2) === '-2h', 'formatOffsetShort(-2)');
assert(formatOffsetShort(0.5) === '+30m', 'formatOffsetShort(+0.5)');
assert(
  formatOffsetShort(0.9999999999999996) === '+1h',
  'formatOffsetShort snaps float drift to whole hours',
);

console.log('\n--- Display time + offset ---');
const displayTime = getDisplayTime(3);
assert(displayTime.getTime() > Date.now(), 'getDisplayTime(+3) is in the future');

const chicagoOffset = offsetVsLocal('America/Chicago', displayTime, 'America/New_York');
console.log(`Chicago vs New York at +3h scrub: ${formatOffsetLabel(chicagoOffset)}`);

if (failures > 0) {
  process.exitCode = 1;
  console.error(`\n${failures} check(s) failed`);
} else {
  console.log('\nAll checks passed');
}
