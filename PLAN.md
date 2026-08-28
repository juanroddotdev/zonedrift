# ZoneDrift — Implementation Plan

> **Purpose:** Single source of truth for building the ZoneDrift Chrome extension.
> Follow this document during implementation. Do not drift from locked decisions in §14 without updating this file first.

---

## 1. Product Definition

### 1.1 One-Line Pitch

Offline Chrome popup for pinning US (and later global) locations, with a shared time scrubber to preview "what time is it there when it's X hours from now?"

### 1.2 Core Concepts (Define Up Front)

| Concept | Definition | UI Representation |
|--------|------------|-------------------|
| **Live time** | Slider at `0` | Badge: **"Now"**; clocks tick every second |
| **Scrub offset** | Hours added to `Date.now()` | Badge: **"+3 Hours"**, **"-2.5 Hours"** |
| **Simulated instant** | `displayTime = now + scrubOffsetMs` | All clocks format this moment |
| **Zone vs local** | Difference between pinned zone and user's local IANA zone **at `displayTime`** | Per-card: **"+2 hrs"** / **"Same time"** |
| **Zone abbrev** | Short name from `Intl` at `displayTime` | Per-card: **EDT**, **CST**, etc. (not fixed "EST") |

**Rule:** Scrub offset and zone-vs-local offset are never shown on the same control or conflated in copy.

### 1.3 Non-Goals (v1)

- No external APIs, AI, accounts, or sync
- No calendar integration
- No meeting invite generation (optional v1.1: copy times)

---

## 2. Architecture

### 2.1 File Structure (v1)

```
zonedrift/
├── manifest.json
├── popup.html
├── popup.js
├── data/
│   └── locations.js      # US seed data (array export)
├── styles/
│   └── popup.css         # Prebuilt dark theme (production-safe)
├── icons/                # 16, 48, 128 for manifest
├── PLAN.md               # This file
└── README.md             # Install, privacy, multi-zone notes
```

### 2.2 `manifest.json` (MV3)

- `manifest_version`: 3
- `name`: ZoneDrift - Timezone & Meeting Planner
- `action.default_popup`: `popup.html`
- `permissions`: `["storage"]` only
- `content_security_policy.extension_pages`:
  `script-src 'self'; object-src 'self'`
  (no remote scripts in production build)

### 2.3 Runtime Modules (in `popup.js` or split later)

1. **TimeEngine** — scrub math, `Intl` formatting, offset vs local
2. **Storage** — pins, preferences
3. **Search** — filter add-list
4. **UI** — render cards, slider, search, interval lifecycle

---

## 3. Data Model

### 3.1 Location Object (Seed + Pins)

```js
{
  id: "us-tx-central",           // stable dedupe key
  name: "Texas",                 // display name
  code: "TX",                    // 2-letter (state) or city code later
  region: "South",               // for search: "major region"
  tz: "America/Chicago",         // IANA string
  note: "Most of state"          // optional; multi-zone honesty
}
```

### 3.2 Multi-Zone States (v1 Honesty)

Use **one canonical zone per state** where most of the population lives, plus `note` when misleading. Plan v1.1 sub-entries for split states.

| State | Default `tz` | `note` (if needed) |
|-------|----------------|---------------------|
| FL | `America/New_York` | Panhandle is Central |
| IN | `America/Indiana/Indianapolis` | NW/SW counties vary |
| KY | `America/New_York` | Western counties Central |
| TN | `America/Chicago` | Eastern counties Eastern |
| TX | `America/Chicago` | El Paso area Mountain |
| MI | `America/Detroit` | Upper Peninsula varies |
| AK | `America/Anchorage` | Aleutian Islands differ |

Document the full 50-state map in `data/locations.js`.

**Future:** `id` like `us-in-indianapolis` vs `us-in-chicago` without breaking stored pins (migrate by `id`).

### 3.3 Pinned Item (Stored)

```js
{
  id: "us-ny",                   // references seed id
  pinnedAt: 1730000000000        // sort order (newest last)
}
```

Store **ids only** in `chrome.storage.local`; resolve full objects from `locations.js` at runtime so seed data updates don't stale names.

### 3.4 User Preferences (Stored)

```js
{
  pins: ["us-ca", "us-ny", "us-tx-central"],
  use24Hour: false,              // v1.1 optional
  defaultPinsApplied: true       // first-run flag
}
```

**Do not persist scrub position** — always open at **Now** (slider `0`).

---

## 4. Storage Schema

### 4.1 Keys (`chrome.storage.local`)

| Key | Type | Default |
|-----|------|---------|
| `pins` | `string[]` | See §5 onboarding |
| `use24Hour` | `boolean` | `false` |
| `defaultPinsApplied` | `boolean` | `false` |

### 4.2 Limits

- **Max pins:** 12 (soft cap; show message if user tries to exceed)
- **Dedupe:** reject pin if `id` already in `pins`
- **Unpin:** remove id from array, re-render

### 4.3 v2 Consideration (Out of Scope)

`chrome.storage.sync` for cross-device pins — same schema, different API.

---

## 5. Onboarding & First-Run

1. On first open (`defaultPinsApplied === false`):
   - Detect user local zone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - If it matches a seed location `id`, pin that location
   - Else pin **3 defaults**: `America/New_York`, `America/Chicago`, `America/Los_Angeles` (by id)
   - Set `defaultPinsApplied: true`
2. Empty watchlist copy: **"Search below to add locations"**
3. No tutorial modal in v1 — empty state + defaults are enough

---

## 6. UI Layout (360×500, Dark)

```
┌─────────────────────────────────────┐
│ ZoneDrift                           │
├─────────────────────────────────────┤
│ 🔍 [ Search states, code, region… ] │  ← primary, large input
│ ┌ search results (under bar) ─────┐ │
│ │ California (CA)            [+]  │ │
│ │ Texas (TX) · 2 time zones    [›] │ │
│ └─────────────────────────────────┘ │
│ ┌ Where in Texas? ───────────── [×] │  ← inline zone picker
│ │ [ Most of Texas · CST ]         │ │
│ │ [ El Paso area · MST ]          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Now] ═══●═══ [Reset]               │  ← compact scrubber
├─────────────────────────────────────┤
│ PINNED (scroll)                     │
│ ┌─────────────────────────────┐ [×] │
│ │ Texas (TX) · Most · CDT     │     │
│ │ 2:34:05 PM                  │     │
│ │ +1 hr vs you                │     │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

### 6.1 Sections

- **Search:** primary entry point; large input at top
- **Results:** directly under search bar when query is non-empty
- **Zone picker:** inline expanded card for multi-zone states (not a second search)
- **Scrubber:** compact row below search/results; affects pinned clocks only
- **Pinned:** scrollable watchlist at bottom

### 6.2 Scrubber

- `input type="range"`: `min=-12`, `max=12`, `step=0.5`
- Badge text:
  - `0` → **"Now"**
  - `±0.5` → **"±30 Minutes"**
  - integer → **"+3 Hours"** / **"-2 Hours"**
  - half beyond ±1 → **"+2.5 Hours"**
- **Reset to Now:** sets slider to `0`, restarts tick interval

### 6.3 Card Fields

- **Title:** `name` + `(code)`
- **Zone:** from `Intl` `timeZoneName: 'short'` at `displayTime` — label **"Zone"**, not "Standard"
- **Clock:** 12h + seconds (respect `use24Hour` if implemented)
- **Offset:** `formatOffsetVsLocal(tz, displayTime)` → `"+2 hrs"`, `"-30 min"`, `"Same time"`
- **Remove:** single-click `×`, no confirm (v1)

---

## 7. Time Engine Spec

### 7.1 Core Functions

```js
getScrubOffsetMs(sliderValue)     // hours → ms
getDisplayTime(scrubHours)        // Date.now() + offset
formatClock(tz, displayTime, use24Hour)
formatZoneAbbrev(tz, displayTime)
offsetVsLocal(tz, displayTime)    // DST-aware at displayTime
formatOffsetLabel(deltaHours)     // human string
```

### 7.2 Local Timezone

```js
const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
```

### 7.3 Offset vs Local (at `displayTime`)

Compare wall-clock offset from UTC for `userTz` and `tz` at the same instant — e.g. via `formatToParts` with `timeZoneName: 'longOffset'` or equivalent reliable method. **Must use `displayTime`, not `Date.now()`**, when scrub ≠ 0.

### 7.4 Tick Interval

| Scrub | Behavior |
|-------|----------|
| `0` | `setInterval(updateAll, 1000)` |
| `≠ 0` | `clearInterval`; update only on slider `input` |

### 7.5 Popup Lifecycle

- `DOMContentLoaded`: load storage → render → start interval if scrub is 0
- `visibilitychange` / `pagehide`: `clearInterval` (popup close)
- Reopen: scrub resets to 0 (not persisted)

---

## 8. Search & Pin Flow

### 8.1 Filter Rules

Match (case-insensitive) on:

- `name` (e.g. "Texas")
- `code` (e.g. "TX")
- `region` (e.g. "South", "West")
- Optional: `note` keywords

### 8.2 Add Flow

1. User types → show filtered results directly under the search bar
2. **Single-zone state:** click row → pin immediately
3. **Multi-zone state:** click row → inline **"Where in {State}?"** picker with labeled options
4. Select option → pin variant `id`; keep search query; hide pinned variants from results
5. Scroll pinned list to new card (nice-to-have)

### 8.3 Multi-Zone Disambiguation

- Search catalog has 50 entries (one per state); 12 states expose 2 timezone variants each
- Pinnable ids are variant ids (e.g. `us-tx-central`, `us-tx-mountain`)
- Legacy pin ids migrate automatically via `PIN_ID_MIGRATIONS` in storage

- `/` → focus search
- `Esc` → clear search, blur

---

## 9. Styling Strategy

### 9.1 Production (Recommended)

- `styles/popup.css`: dark palette, cards, slider, typography (~150–250 lines)
- No CDN; passes MV3 CSP and Web Store policy

### 9.2 Dev-Only Alternative (Document, Don't Ship)

- Tailwind CDN + CSP exception — note in README for local unpacked testing only

### 9.3 Design Tokens

- Background: `#0f1117`
- Surface: `#1a1d27`
- Border: `#2a2f3a`
- Text primary: `#e8eaed`
- Text muted: `#9aa0a6`
- Accent: `#6c9eff` (slider, focus rings)

---

## 10. Implementation Phases

### Phase 0 — Scaffold (½ day)

- [x] Create repo layout, `manifest.json`, empty popup shell
- [x] `styles/popup.css` dark theme, fixed 360×500 layout
- [x] Verify unpacked extension loads in Chrome

### Phase 1 — Data & Storage (½ day)

- [x] `data/locations.js`: 50 states with IANA `tz`, `id`, `region`, `note` where needed
- [x] Storage helpers: `getPins`, `setPins`, `getPrefs`, first-run defaults
- [x] Dedupe + max 12 enforcement

### Phase 2 — Time Engine (½ day)

- [x] `getDisplayTime`, formatters, `offsetVsLocal`
- [x] Verify against DST boundaries (March/November) for `America/New_York`
- [x] Scrub badge formatter (0, ±0.5, integers, half-hours)

### Phase 3 — Core UI (1 day)

- [x] Scrubber + reset + badge
- [x] Pinned cards render + remove
- [x] Interval start/stop tied to scrub === 0
- [x] Popup teardown clears interval

### Phase 4 — Search & Add (½ day)

- [x] Search input, filter, add list UI
- [x] Pin on select; hide/disable pinned in results
- [x] Empty states (no pins, no results)

### Phase 5 — Polish (½ day, optional for v1)

- [ ] **Copy all times** button → clipboard (name, zone abbrev, formatted time at `displayTime`)
- [ ] **12/24h toggle** in footer, persisted
- [ ] Keyboard shortcuts
- [ ] Subtle transition on scrub (no heavy animation)

### Phase 6 — QA & Ship Prep (½ day)

- [ ] Manual test matrix (§11)
- [ ] Icons 16/48/128 for `manifest.json`
- [ ] README: install, privacy (no network), data note for multi-zone states
- [ ] Zip for Web Store or keep unpacked

**Total estimate:** ~3–4 days for one developer including polish; ~2 days for MVP (Phases 0–4 only).

---

## 11. Test Matrix

| Case | Expected |
|------|----------|
| Fresh install | 3–4 default pins, slider at Now |
| Slider +3 | All clocks +3h; no second tick; badge "+3 Hours" |
| Reset | Slider 0, live seconds resume |
| Pin duplicate | Ignored or button disabled |
| 13th pin | Friendly cap message |
| Unpin last | Empty state shown |
| Search "TX" | Texas in add list |
| Search pinned only | Add list empty or filtered; pinned still visible |
| DST spring forward | `Intl` abbrev/time correct; no manual DST code |
| Popup close/reopen | Scrub 0; pins persisted |
| Offline | Full function (no network used) |

---

## 12. International Expansion (Post-v1)

1. Add `locations-intl.js` or extend array with `country`, `type: 'city'`
2. Search adds `country` field
3. Same pin/storage/time engine — no schema break
4. Consider grouping in UI: US / International

---

## 13. Implementation Prompt (Handoff)

Use this block when generating or reviewing code:

> **Semantics:** The slider sets a simulated instant (`now + offset`). Per-card "+N hrs vs you" is the DST-aware difference between that location's zone and the user's local zone **at that instant**, not the slider value.
> **Data:** 50 US locations with stable `id`, IANA `tz`, and `note` for multi-zone states. Pins store ids only. Max 12 pins, no duplicates.
> **UI:** Pinned list always visible; search filters an add-list only. First run seeds default pins. Scrub not persisted.
> **Tech:** `Intl.DateTimeFormat` only; interval ticks at 1s only when scrub is 0; clear interval on popup close.
> **CSS:** Local `popup.css` (no CDN) for MV3 CSP compliance.

---

## 14. Decision Log (Locked)

| Topic | Decision |
|-------|----------|
| Slider meaning | Simulated instant, not per-zone offset |
| Card offset badge | vs local at `displayTime` |
| State → timezone | One canonical IANA per state + `note` |
| Search | Filters add-list only |
| Pins | By stable `id`, max 12, dedupe |
| Scrub persistence | No — always open at Now |
| Tailwind | Local CSS in production |
| Zone label | "Zone" / abbrev from `Intl`, not "EST" |
| First run | Auto-pin local match or 3 US hubs |
| Remove pin | Single click, no confirm |

**To change any locked decision:** update this table and the affected sections above before implementing.
