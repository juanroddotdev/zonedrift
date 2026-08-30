# Chrome Web Store listing copy

Paste these fields into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) when submitting ZoneDrift.

---

## Name (max 75 chars)

```
ZoneDrift - US Timezone Planner
```

*Current manifest name is longer; you can keep either. This fits the store limit and is clearer for search.*

---

## Short description (max 132 chars)

```
Pin US time zones, compare offsets to your local time, and scrub ahead to plan meetings — all offline in one click.
```

*(131 characters)*

---

## Detailed description

```
ZoneDrift is a lightweight timezone tool for people who work across US time zones.

Open the popup to see your pinned locations at a glance — city, zone abbreviation, local time, and offset vs you. Search any US state or city and pin it to your watchlist. Scrub time forward or back to preview when a meeting lands for everyone.

BUILT FOR QUICK CHECKS
• Pin up to 12 US locations to a personal watchlist
• City-first labels (e.g. Orlando, FL · EDT · +0h)
• Compact offset badges so you can scan a row in one glance
• Live clock updates every second when viewing "now"

SEARCH & PIN
• Type a city or state name to look up a zone instantly
• Add locations with one tap — no automatic pinning
• Your last search is restored when you reopen the popup

MEETING PLANNER
• Scrub ±12 hours from now to preview future times
• See how offsets shift for every pinned location
• Collapsed by default — open only when you need it

OFFLINE & PRIVATE
• No account required
• No network requests — works fully offline
• Pins and preferences stay on your device (Chrome local storage)
• No analytics or tracking

ZoneDrift covers US states and multi-zone states (Florida, Texas, Indiana, and more) with accurate IANA timezone data via the browser's Intl APIs.

Perfect for remote teams, freelancers, and anyone scheduling calls across the US.
```

---

## Category

**Productivity**

---

## Language

**English**

---

## Privacy policy URL

```
https://juanroddotdev.github.io/zonedrift/privacy-policy
```

*Enable GitHub Pages from `/docs` first (see `docs/README.md`).*

---

## Permission justification

**Storage**

```
Saves your pinned US time zones, display preferences, and last search query locally on your device. No data is transmitted to external servers.
```

---

## Single purpose description (if prompted)

```
Help users view US time zones, compare times to their local zone, and plan meetings by pinning locations and scrubbing time.
```

---

## Screenshot captions (optional)

1. **Your US timezone watchlist at a glance** — pinned cities with live clocks and offsets
2. **Search any US city or state** — instant lookup with one-tap pin
3. **Scrub time to plan meetings** — preview how a call time lands for everyone

---

## Promotional copy (optional / social)

```
Stop mental math across US time zones. ZoneDrift pins your go-to cities, shows offsets vs you, and lets you scrub time to plan meetings — offline, in one click.
```

---

## Checklist before submit

- [ ] Bump `manifest.json` version (e.g. `1.0.0`) for first public release
- [ ] Run `./scripts/package.sh` and upload the zip from `dist/`
- [ ] Add at least one screenshot (1280×800 or 640×400)
- [ ] Privacy policy URL live on GitHub Pages
- [ ] Icon 128×128 uploaded (already in extension package)
