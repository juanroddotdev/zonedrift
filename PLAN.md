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

**Mental model:** Open to see saved go-tos. Search is a small lookup at the top; typing shows a single answer card — not a dropdown list. Pinning is always explicit.

```
┌─────────────────────────────────────┐
│ ZoneDrift          [ search…     ]  │  ← compact search, top-right
├─────────────────────────────────────┤
│ ┌ ANSWER (only when typing) ────┐   │
│ │ California (CA) · PDT           │   │
│ │ 2:34:05 PM                      │   │
│ │ +3 hrs vs you          [ Pin ]  │   │  ← preview only; Pin is explicit
│ └─────────────────────────────────┘   │
│   — or for multi-zone —               │
│ ┌ ANSWER ─────────────────────────┐   │
│ │ Where in Texas?                   │   │
│ │ [ Most of Texas · 1:34 PM ] Pin  │   │
│ │ [ El Paso area · 12:34 PM ] Pin  │   │
│ └─────────────────────────────────┘   │
├─────────────────────────────────────┤
│ [Now] ═══●═══ [Reset]               │  ← compact scrubber
├─────────────────────────────────────┤
│ SAVED                               │
│ ┌ California (CA) · PDT ────── [×]  │
│ │ 2:34:05 PM · +3 hrs vs you       │
│ ┌ New York (NY) · EDT ──────── [×]  │
│ │ …                                 │
└─────────────────────────────────────┘
```

### 6.1 Sections (top to bottom)

1. **Header + compact search** — title left, small search input right
2. **Answer card** — appears only when query is non-empty; top search match; never auto-pins
3. **Scrubber** — compact; shifts answer card + saved clocks together
4. **Saved** — pinned watchlist; always visible; primary view on open

### 6.2 Default open behavior

- User sees **Saved** list immediately (their go-tos)
- Search field is empty → no answer card
- Empty saved state: *"No saved locations yet — search to preview a place"*

### 6.3 Answer card rules

- Show **top match** from search catalog (not a scrollable result list)
- Display live clock, zone abbrev, and offset vs user at `displayTime`
- **Pin** button adds to Saved; row/body tap does **not** pin
- Multi-zone state: one answer card with **Where in {State}?** and per-variant rows (time + Pin)
- If already pinned: show answer but hide/disable Pin
- No match: compact "No locations match" message in answer area

### 6.4 Scrubber

- `input type="range"`: `min=-12`, `max=12`, `step=0.5`
- Badge text:
  - `0` → **"Now"**
  - `±0.5` → **"±30 Minutes"**
  - integer → **"+3 Hours"** / **"-2 Hours"**
  - half beyond ±1 → **"+2.5 Hours"**
- **Reset to Now:** sets slider to `0`, restarts tick interval

### 6.5 Saved card fields

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

### 8.2 Lookup & pin flow

1. User opens popup → **Saved** list is visible immediately
2. User types in compact search → **answer card** appears under header (top match only)
3. Answer card shows time/zone/offset — **lookup only**, no auto-pin
4. User taps **Pin** → append to Saved if under cap and not duplicate
5. Multi-zone → **Where in {State}?** inside the single answer card; each variant shows time + Pin
6. Clear search → answer card hides; Saved list remains

### 8.4 Multi-zone disambiguation

- Search catalog has 50 entries (one per state); 12 states expose 2 timezone variants each
- Pinnable ids are variant ids (e.g. `us-tx-central`, `us-tx-mountain`)
- Legacy pin ids migrate automatically via `PIN_ID_MIGRATIONS` in storage
- **Variant labels use anchor cities**, not county/region jargon (see §15)
- **City search** resolves directly to a variant when query matches a known city (see §15)

### 8.5 Keyboard (v1.1)

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

### Phase 5 — City Disambiguation (1 day)

> **Goal:** Users know cities, not county splits. Searching `Nashville` should skip the picker; searching `Tennessee` should show city-labeled options, not “eastern counties.”

#### Phase 5A — City-labeled variants (½ day)

- [x] Extend variant data with `cities[]` (3–5 anchor cities per zone) and `regionHint` (short plain-language subtitle)
- [x] Replace abstract `sublabel` copy in answer card (e.g. “Nashville, Memphis” not “Most of Tennessee”)
- [x] Show zone abbrev + live time per variant row (already present; keep)
- [x] When variants share the same clock at `displayTime`, show helper: *“Same time right now”*
- [x] When variants differ, show helper: *“1 hr difference — pick the city your contact is in”*

#### Phase 5B — City search resolution (½ day)

- [x] Add `data/cities.js` (or extend `locations.js`) with offline city → variant `id` index
- [x] Search matches: state name, code, region, **city name**, and city aliases
- [x] City match resolves directly to single answer card (skip “Where in {State}?” picker)
- [x] State-only match (e.g. `tennessee`) still shows the multi-variant picker with city labels
- [ ] Ambiguous city names (e.g. `Portland` OR vs ME) — defer to v2 or pick by population; document in data

#### Phase 5C — Browse cities UI (optional, ½ day)

- [x] “Browse cities” link/button inside multi-variant answer card
- [x] Expands inline filterable city list for that state only (no second search bar)
- [x] Tapping a city previews that variant’s time; **Pin** adds variant `id`
- [x] Collapse back to two-zone summary view

#### Phase 5D — Map preview (optional polish, post-v5)

- [ ] Collapsed **“Show map”** toggle inside answer card (hidden by default)
- [ ] Static SVG per split state: colored regions + labeled city dots (no tiles/API)
- [ ] Map is supplementary; city names remain primary
- [ ] Skip if SVG asset weight or design time is too high for v1

### Phase 6 — Polish (½ day, optional)

- [ ] **Copy all times** button → clipboard (name, zone abbrev, formatted time at `displayTime`)
- [ ] **12/24h toggle** in footer, persisted
- [ ] Keyboard shortcuts (`/` focus, `Esc` clear)
- [ ] Subtle transition on scrub (no heavy animation)

### Phase 7 — QA & Ship Prep (½ day)

- [ ] Manual test matrix (§11)
- [ ] Icons 16/48/128 for `manifest.json`
- [ ] README: install, privacy (no network), multi-zone + city data notes
- [ ] Zip for Web Store or keep unpacked

**Total estimate:** ~4–5 days including city disambiguation; Phase 5D map is optional.

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
| Search "TX" | Texas answer card with city-labeled zones |
| Search "Nashville" | Direct preview for `us-tn-central` (no picker) |
| Search "Tennessee" | Picker shows Nashville/Memphis vs Knoxville/Chattanooga labels |
| Search pinned location | Answer card still shows; Pin says Saved |
| Same-time variants | Helper text: "Same time right now" |
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

## 15. City Disambiguation Spec (Phase 5)

### 15.1 Problem

Multi-zone states use geographic labels (“Eastern counties”, “Most of Tennessee”) that are meaningless to users who only know **city names** (e.g. a Texan scheduling with someone in Nashville). A state outline map alone does not help if the user does not know where cities fall relative to the timezone border.

### 15.2 Principles

1. **Cities over geography** — lead with 2–4 recognizable city names per variant
2. **City search bypasses picker** — `nashville` → instant answer; `tennessee` → picker
3. **Offline only** — bundled city index; no geocoding APIs
4. **Map is optional** — supplement, never the primary decision UI
5. **Same pin model** — still pin variant `id`; city data is for search/display only

### 15.3 Data model

#### Variant extension (in `MULTI_ZONE_GROUPS` or `data/cities.js`)

```js
{
  id: 'us-tn-central',
  sublabel: 'Nashville, Memphis',           // primary label (city-led)
  regionHint: 'Middle & western Tennessee',   // secondary subtitle
  tz: 'America/Chicago',
  cities: ['Nashville', 'Memphis', 'Clarksville', 'Murfreesboro'],
}
```

#### City index entry

```js
{
  id: 'city-nashville-tn',
  name: 'Nashville',
  stateCode: 'TN',
  variantId: 'us-tn-central',
  aliases: ['nashville tn'],                // optional
}
```

#### Search priority (top match wins)

1. Exact city match → single variant answer
2. State name / code match → multi-variant picker (city-labeled rows)
3. Region or partial state match → same as state
4. No match → empty answer card

### 15.4 Answer card UI (multi-variant)

```
Where in Tennessee?

┌──────────────────────────────────────────┐
│ Nashville, Memphis              12:34 PM │
│ Middle & western Tennessee · CST         │
│                               [ Pin ]    │
├──────────────────────────────────────────┤
│ Knoxville, Chattanooga           1:34 PM │
│ East Tennessee · EST                     │
│                               [ Pin ]    │
└──────────────────────────────────────────┘
  1 hr difference — pick the city they're in.
  [ Search a city ]    [ Show map ]  (map: Phase 5D)
```

- **Pin** unchanged — explicit only
- **Search a city** expands inline list filtered to that state’s cities (Phase 5C)
- **Show map** collapsed by default; static SVG with city dots (Phase 5D)

### 15.5 Seed city lists (12 split states)

Anchor cities only — 3–5 per variant. Verify against IANA zones before shipping.

| State | Variant | Anchor cities | Zone |
|-------|---------|---------------|------|
| TN | central | Nashville, Memphis, Clarksville | Central |
| TN | eastern | Knoxville, Chattanooga, Tri-Cities | Eastern |
| TX | central | Houston, Dallas, San Antonio, Austin | Central |
| TX | mountain | El Paso | Mountain |
| FL | eastern | Miami, Orlando, Tampa, Jacksonville | Eastern |
| FL | central | Pensacola, Panama City | Central |
| IN | eastern | Indianapolis, Fort Wayne | Eastern |
| IN | central | Evansville, Gary | Central |
| KY | eastern | Louisville, Lexington | Eastern |
| KY | central | Bowling Green, Owensboro | Central |
| MI | eastern | Detroit, Grand Rapids, Ann Arbor | Eastern |
| MI | central | Iron Mountain, Menominee area | Central |
| AK | anchorage | Anchorage, Fairbanks, Juneau | Alaska |
| AK | aleutian | Unalaska, Adak | Hawaii-Aleutian |
| ID | mountain | Boise, Idaho Falls | Mountain |
| ID | pacific | Coeur d'Alene | Pacific |
| KS | central | Wichita, Kansas City, Topeka | Central |
| KS | mountain | Goodland (west) | Mountain |
| NE | central | Omaha, Lincoln | Central |
| NE | mountain | Scottsbluff, Chadron | Mountain |
| ND | central | Fargo, Bismarck | Central |
| ND | mountain | Dickinson, Williston | Mountain |
| SD | central | Sioux Falls, Pierre | Central |
| SD | mountain | Rapid City | Mountain |

> **Note:** City lists are UX hints, not legal timezone boundaries. Prefer widely known cities; tune copy after user feedback.

### 15.6 Files to add/change

| File | Change |
|------|--------|
| `data/cities.js` | City index + `resolveCityQuery(query)` |
| `data/locations.js` | Add `cities`, `regionHint` to variants; city-led `sublabel` |
| `js/search.js` | City-first match before catalog scan |
| `popup.js` | Render city labels, same-time/diff helper, browse-cities expand |
| `styles/popup.css` | Variant subtitles, browse list, optional map container |
| `scripts/verify-search.mjs` | Tests: `nashville`, `tennessee`, `memphis` |
| `assets/maps/` (optional) | Static SVGs per split state (Phase 5D) |

### 15.7 Out of scope (v1)

- Full city database (every US city)
- ZIP code lookup
- Interactive slippy maps / tile servers
- Auto-detect user city within state
- Disambiguating duplicate city names across states (v2: show state in picker)

### 15.8 Success criteria

- [ ] User in Texas can find Tennessee meeting time by typing `nashville` without knowing regions
- [ ] User typing `tennessee` sees city names, not “eastern counties”
- [ ] No network requests; all city data bundled
- [ ] Existing pins and variant ids unchanged (display copy only + new search paths)

---

## 13. Implementation Prompt (Handoff)

Use this block when generating or reviewing code:

> **Semantics:** The slider sets a simulated instant (`now + offset`). Per-card "+N hrs vs you" is DST-aware at `displayTime`.
> **UI:** Saved-first; compact header search; single answer card for lookup; explicit Pin only.
> **Multi-zone:** City-labeled variant rows; city search resolves directly; state search shows picker.
> **Data:** Variant `id` pins; offline city index for 12 split states; no APIs.
> **Tech:** `Intl.DateTimeFormat`; tick at scrub 0 only; local CSS.

---

## 14. Decision Log (Locked)

| Topic | Decision |
|-------|----------|
| Primary view | Saved list on open; search is secondary lookup |
| Search UI | Compact input in header (top-right) |
| Search results | Single answer card under search (top match), not a dropdown list |
| Pinning | Explicit **Pin** button only; search never auto-pins |
| Multi-zone | **Where in {State}?** with **city-led labels** + optional browse/map |
| City search | `nashville` → variant directly; `tennessee` → picker |
| Variant copy | Anchor cities primary; region hint secondary |
| Map | Optional collapsed SVG (Phase 5D); never required to pick |
| Slider meaning | Simulated instant, not per-zone offset |
| Card offset badge | vs local at `displayTime` |
| State → timezone | Multi-zone variants for 12 states; legacy ids migrate |
| Pins | By stable variant `id`, max 12, dedupe |
| Scrub persistence | No — always open at Now |
| Tailwind | Local CSS in production |
| Zone label | abbrev from `Intl`, not fixed "EST" |
| First run | Auto-pin local match or 3 US hubs |
| Remove pin | Single click, no confirm |

**To change any locked decision:** update this table and the affected sections above before implementing.
