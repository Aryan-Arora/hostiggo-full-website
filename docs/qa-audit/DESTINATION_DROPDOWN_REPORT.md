# Homepage "Search destination or homestay" dropdown — QA investigation

**Component:** homepage hero → destination search dropdown
**Files involved:** `src/components/features/SearchForm.tsx`, `src/components/features/DestinationDropdown.tsx`, `src/app/globals.css`
**Commit tested:** `7e10fa2` (production build, `next start`) · **Date:** 2026-09-29
**Related report:** [`QA_AUDIT_REPORT.md`](../../QA_AUDIT_REPORT.md)

---

## Verdict in one paragraph

**The issue is real and reproduced — but its cause is not what it looks like.** The dropdown is *not* transparent, *not* under another element, and *not* clipped by a parent. It is a fully opaque, correctly stacked foreground panel (`z-index: 1100`). What you see "through" it is content **beside** it: the panel is a fixed **560 px** wide and **right-aligned**, while the search field it belongs to is **626 px** wide, so a **66 px strip of the Check-In / Guests / Map controls is left uncovered** on the left. That strip looks like bleed-through, is cut off mid-text ("Che…", "1 A…"), and is a click "dead zone". The same fixed-width/right-aligned design also makes the panel **spill 160 px outside its field at 1024 px** and **run 9–11 px off-screen on phones**. Separately, **Escape does not close it**, **"Use current location" fails silently**, and **the panel ignores the viewport height**.

**Root cause (one line):** fixed `width: min(560px, 92vw)` on the panel (`DestinationDropdown.tsx:212`) inside a `flex justify-end` wrapper that is as wide as the field (`SearchForm.tsx:329`).
**Fix (one class, verified at runtime):** make the panel fill its wrapper — see Section E.
**Severity:** **Medium.**

---

## Method and limits

- Production build served locally; Chromium (Playwright) at 1300×630 (your screenshot's size), 1366×768, 1440×900, 1920×1080, 1024×768, 768×1024, 390×844, 360×640; each at scroll 0 and after scrolling.
- Measured, not eyeballed: bounding boxes of field / wrapper / panel; computed `background-color`, `opacity`, `z-index`, `position`; a full **ancestor walk** for `overflow`, `transform`, `filter`, `backdrop-filter`, `opacity`, `isolation`, `contain`, `will-change`, `clip-path`; **~110–530 `elementFromPoint` samples per run** to detect anything painted over the panel; a **pixel test** on a screenshot.
- Data: `/api/locations`, `/api/hotels` etc. are mocked (the sandbox blocks the real backend), so "(0 stays)" counts and the location suggestions are fixture values. That does not affect layout, but the panel's **height** depends on how many rows render, so absolute heights can differ slightly on production data (I tested with and without "Recent searches" saved).
- "Use current location": the browser geolocation was simulated; Google's geocoder was **stubbed** for the happy path because Maps is blocked here.
- Chromium only. No Safari/Firefox, no real devices. The fix was **verified by injecting CSS at runtime**; the source was **not modified**.

---

## The 16 checks you asked for

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Appears as a proper foreground overlay | ✅ **PASS** | Wrapper `position:absolute; z-index:1100`; panel above hero image (`z-10`) and sticky header (`z-50`). |
| 2 | Background fully opaque | ✅ **PASS** | `background-color: rgb(255,255,255)`, `opacity: 1` once the 180 ms fade-in ends. Pixel test: with the panel's content hidden, **0 of 220,492 pixels** were non-white outside the four rounded corners (the 28 non-white pixels are the corner radius). |
| 3 | Content underneath must NOT be visible | ⚠️ **FAIL (visually) — but not because of transparency** | Nothing shows *through* the panel. The controls are visible *beside* it: a strip of **66 px** at ≥1300 px (Check-In 21 % visible), **96 px** at 768 px. See Root cause. |
| 4 | Correct z-index / stacking order | ✅ **PASS** | 0 of ~110–530 samples per run were covered by another element, at every viewport and scroll position. Only stacking context in the chain is the panel's own (`transform` left by the `fadeInDown … forwards` animation) — harmless. |
| 5 | Not clipped by a parent | ✅ **PASS** (desktop/tablet) · ⚠️ **FAIL on phones** | No ancestor has `overflow` ≠ visible, `clip-path`, `contain` or `filter`; `clippedBy = []` in all 16 runs. **But** on 390 px / 360 px screens the panel's left edge is at **−9 px / −11 px**, i.e. cut off by the *viewport* (rounded corner and left padding trimmed). |
| 6 | Correctly positioned relative to the field | ❌ **FAIL** | Only the **right** edges line up. Left offset vs field: **+66 px** (≥1300), **+96 px** (768), **−160 px** (1024), **−49/−51 px** (phones). |
| 7 | Complete content accessible, not cut off by viewport | ⚠️ **PARTIAL** | Panel is in normal document flow (not `fixed`), so it is reachable by scrolling the page — but it opens largely **below the fold**: bottom is **+143 px** past the viewport at 1300×630, **+226** at 768×1024, **+371** at 390×844, **+200** at 360×640. |
| 8 | If taller than viewport, it scrolls rather than clips | ⚠️ **PARTIAL / FAIL** | The inner list scrolls, but its cap is a **fixed** `max-h-[480px]`, not viewport-relative. On short screens you get *nested* scrolling: scroll the list to its end and the last row is still **126 px below the fold** at 1300×630; you must also scroll the page. |
| 9 | Click outside closes | ✅ **PASS** — with one exception | Closes on click on hero image and header; clicking the trigger again toggles it. **Exception:** the exposed 66 px strip is a dead zone (see below). |
| 10 | Escape closes | ❌ **FAIL** | Panel stays open after Escape. No `Escape`/`keydown` handler exists in `SearchForm`, `DestinationDropdown`, `DateRangePicker` or `GuestDropdown` (the Date and Guests panels have the same gap). |
| 11 | Typing filters/updates results | ✅ **PASS** [mocked API] | ≥2 chars calls `/api/locations`; "Delhi" shows the city guide with areas; zero matches shows "No exact match found in database"; Enter selects free text and advances to dates; ✕ restores the default list; a `<script>` string renders as text; trigger field mirrors what you type. |
| 12 | Recent searches clickable | ✅ **PASS** | Clicking "Shimla" fills the field and opens the date picker. |
| 13 | Suggested destinations clickable | ✅ **PASS** | Clicking "New Delhi" fills the field and opens the date picker. |
| 14 | "Use current location" behaves correctly | ⚠️ **PARTIAL** | Happy path works [Google geocoder stubbed]: field = "Bhopal", date picker opens. **Every failure is silent:** permission denied → nothing; `navigator.geolocation` missing → nothing (`return` at `DestinationDropdown.tsx:166`); reverse-geocode returns nothing → nothing. No toast, no message. |
| 15 | Same after scrolling the page | ✅ **PASS** (+ note) | Panel stays attached to the field (8 px gap before and after a 250 px scroll). Note: because the wrapper is `z-1100` and the sticky header `z-50`, the panel paints **over** the header when the two overlap (screenshot 07). Defensible, but worth a conscious decision. |
| 16 | Desktop / tablet / mobile | ❌ **FAIL** at all but the widest | See table below. |

### Measurements by viewport (panel vs its field; "Recent searches" present, scroll 0)

| Viewport | Field (x-range, width) | Panel (x-range) | Left offset | Exposed strip of Check-In | Off-screen | Panel bottom vs viewport |
|---|---|---|---|---|---|---|
| 1300×630 *(your screenshot)* | 592–1218 (626) | 658–1218 | **+66** | **66 px** | 0 | **+143 px below** |
| 1366×768 | 625–1251 (626) | 691–1251 | +66 | 66 px | 0 | +5 px below |
| 1440×900 | 662–1288 (626) | 728–1288 | +66 | 66 px | 0 | fits (−127) |
| 1920×1080 | 902–1528 (626) | 968–1528 | +66 | 66 px | 0 | fits (−307) |
| 1024×768 | 552–952 (**400**) | **392**–952 | **−160** (spills over hero image) | 0 | 0 | +5 px below |
| 768×1024 | 56–712 (656) | 152–712 | +96 | **96 px** | 0 | +226 px below |
| 390×844 | 40–350 (310) | **−9**–350 | −49 | 0 | **9 px left** | +371 px below |
| 360×640 | 40–320 (280) | **−11**–320 | −51 | 0 | **11 px left** | +200 px below |

---

## A. ISSUE FOUND

In the homepage hero, opening the destination dropdown leaves parts of the **Check-In, Check-Out, Guests and "Search on Map" controls visible to the left of the panel** (cut off mid-word: "Che…", "Add da…", "1 A…", a lone map pin). It looks as though the dropdown is see-through or the layout is broken. The panel is also misaligned with its field (offset by +66, +96, −160 or −50 px depending on screen width), runs slightly off-screen on phones, and its left-hand strip is a click dead zone.

## B. ROOT CAUSE

Two lines cooperate:

1. **`src/components/features/DestinationDropdown.tsx:211-212`** — the panel has a hard-coded width and opts out of the shared `.dropdown-panel { position:absolute }` rule:
   ```tsx
   className="dropdown-panel !relative shrink-0 animate-fade-in-down"
   style={{ width: 'min(560px, 92vw)' }}
   ```
2. **`src/components/features/SearchForm.tsx:329`** — the hero renders it in a wrapper exactly as wide as the field and pushes it to the right:
   ```tsx
   <div className="absolute top-[calc(100%+8px)] left-0 w-full flex justify-end z-[1100]">
   ```

The field is 626 px (container-driven), the panel is 560 px (fixed) and right-aligned → a **66 px gap on the left** at desktop widths. Where the field is *narrower* than 560 px (1024 px layout: 400 px; phones: 280–310 px) the same right-alignment makes the panel **overhang to the left** (−160 px; off the phone screen by 9–11 px, since `92vw` = 359 px > 310 px). The transparent 626 px wrapper (`z-1100`) also sits on top of the exposed strip, so a click on the visible "Check In" text hits the wrapper, not the button.

**Ruled out with measurements:** z-index/stacking (nothing covers the panel; wrapper z 1100), transparency (opaque white; pixel test clean), parent `overflow`/clip/filter/backdrop-filter (none in the ancestor chain), `position` (absolute wrapper is correct). The `backdrop-blur-[2px]` in the hero belongs to the left image card's "Popular Choices" glass panel, not the dropdown. The 180 ms fade-in briefly makes the panel translucent (opacity 0 → 1) — a transition, not the persistent defect.

**Height/viewport issues:** `DestinationDropdown.tsx:240` caps the list at a fixed `max-h-[480px]` and nothing measures the space available below the field.

**Escape:** the outside-click listener at `SearchForm.tsx:281` (and `:40` for the compact bar) is `mousedown` only.

## C. EXPECTED BEHAVIOUR

- The panel is an opaque foreground layer whose **left and right edges match the search field** at every width, fully covers the controls beneath it, and never leaves any part of the viewport or its field.
- **No** part of the underlying form is visible or clickable through/next to it.
- It fits the visible viewport (or scrolls internally), opening into view on small screens.
- **Escape** and outside-click close it; focus returns to the trigger.
- "Use current location" tells the user when it cannot help (denied, unsupported, no result).

## D. ACTUAL BEHAVIOUR

As in the tables above: opaque and correctly stacked, but **66/96 px misaligned strip** (or 160 px overhang / 9–11 px off-screen on phones), **click dead zone** over the strip, panel opens **below the fold** on ≤768 px-tall or phone viewports with a **fixed 480 px** inner scroll cap, **Escape ignored**, and **geolocation failures are silent**.

Screenshots: `destination-dropdown/01-repro-1300x630-before.png` (matches your image), `03-1024x768-before.png`, `05-390x844-before.png`, `07-scrolled-panel-over-sticky-header.png`.

## E. RECOMMENDED FIX (smallest appropriate)

### E1 — Required: make the hero panel fill its wrapper (fixes checks 3, 5, 6, 9, 16)

`src/components/features/SearchForm.tsx:329`

```diff
- <div className="absolute top-[calc(100%+8px)] left-0 w-full flex justify-end z-[1100]">
+ <div className="absolute top-[calc(100%+8px)] left-0 w-full z-[1100] [&>.dropdown-panel]:!w-full">
```

- `!w-full` is needed because the panel sets its width inline; a `!important` rule beats a non-important inline style. I compiled this exact class with Tailwind and it produces `.\[\&\>\.dropdown-panel\]\:\!w-full>.dropdown-panel { width: 100% !important }`.
- **Scope it to the hero wrapper only.** The compact bar on `/search` uses the same `DestinationDropdown` but is a 560 px panel anchored to the left of a narrower pill (323 px at 1300 px wide); it showed no exposed strip and no off-screen edge (screenshot 08) — do **not** change the component's default width.
- Cleaner alternative if you prefer no arbitrary variant: add a `fullWidth?: boolean` prop to `DestinationDropdown` and use `style={{ width: fullWidth ? '100%' : 'min(560px, 92vw)' }}`.

**Verified** (CSS equivalent injected at runtime, all six widths): left/right offset **0 / 0**, exposed strip **0 px**, off-screen **0 px**, no spill past the field (screenshots 02, 04, 06). Because the panel then covers the whole wrapper, the click dead zone disappears too.

### E2 — Escape to close (check 10)

In the existing effect in `SearchForm.tsx` (≈ line 274-283) and the compact-bar effect (≈ line 35-42), add:

```tsx
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActivePanel(null); };
document.addEventListener('keydown', onKey);
// …and in the cleanup: document.removeEventListener('keydown', onKey);
```
This fixes the Date and Guests panels as well.

### E3 — Fit the viewport (checks 7, 8) — recommended, slightly larger

```diff
- <div className="max-h-[480px] overflow-y-auto scrollbar-hide">
+ <div className="max-h-[min(480px,calc(100dvh-20rem))] overflow-y-auto scrollbar-hide">
```
plus, when the panel opens, `panelRef.current?.scrollIntoView({ block: 'nearest' })`.
**Verified by injection** (fresh user, no recents): 1300×630 bottom 714 → **603** (fits); 768×1024, 390×844 and 360×640 fit **only with** `scrollIntoView`. `20rem` is a heuristic tuned to the hero's position; measuring `innerHeight - panel.top` in a layout effect is more robust if the hero layout changes.

### E4 — "Use current location" feedback (check 14)

Show a toast in the three silent branches: `navigator.geolocation` missing (`DestinationDropdown.tsx:166`), the error callback of `getCurrentPosition`, and when `reverseGeocode` returns nothing; wrap the async success callback in `try/catch` (currently `try/finally`, so a thrown error becomes an unhandled rejection).

### E5 — Accessibility (optional)

Trigger: `aria-expanded`, `aria-haspopup="dialog"`; panel: `role="dialog"` + `aria-label="Choose destination"`. None exist today.

## F. REGRESSION TESTS (run after the fix)

**Layout, at 1920, 1440, 1366, 1300×630, 1024×768, 768×1024, 390×844, 360×640; scroll 0 and scrolled:**
1. Panel left and right edges equal the field's edges (±1 px); no part of Check-In/Check-Out/Guests/Map is visible beside or through it.
2. `panel.left ≥ 0` and `panel.right ≤ innerWidth` (no off-screen edge).
3. `elementFromPoint` on a grid across the panel always returns a panel descendant.
4. Pixel test: with panel content hidden, panel area is pure white (except rounded corners).
5. Panel fits the viewport, or its list scrolls and the last suggestion is reachable (also with 0 and 3 saved "Recent searches", and with long suggestion lists from real data).
6. Scrolling the page with the panel open keeps it attached (8 px gap); check the panel-over-sticky-header behaviour is intentional.

**Behaviour:**
7. Click outside (hero image, header, blank page area) closes; clicking the trigger again toggles; clicking Check-In/Guests while open switches panels (and no dead zone remains).
8. **Escape** closes and returns focus to the trigger; also on the Date and Guests panels.
9. Typing: 1 char (no request), ≥2 chars (request), city-guide match ("Delhi"), no match, very long text, `<script>` text, ✕ clear, Enter on free text.
10. Recent search and suggested destination each fill the field and open the date picker; a city-guide row navigates to `/search`.
11. Use current location: allowed (with real Google geocoder), denied, unsupported, geocoder failure/offline, and **double-click** (single request).
12. Reduced-motion and slow-network: fade-in does not leave the panel translucent.
13. Search page compact bar (`/search`): dropdown unchanged (560 px, left-aligned, no overflow).
14. Keyboard only: Tab into panel, Enter on an item, Escape out; screen-reader announces expanded/collapsed.
15. Cross-browser: Safari (iOS) and Firefox — especially `100dvh`/`scrollIntoView` and `!important`-over-inline behaviour.

## G. SEVERITY

**Medium.** The defect sits on the site's primary entry point and is visible to every desktop and tablet visitor, and the click dead zone plus phone-edge clipping are genuine usability faults. But it does not block searching (recents, suggestions, typing, and dates all work), there is no data loss or security impact, and the main fix is a one-class change.
Sub-findings: **Escape not closing — Low/Medium** (keyboard-accessibility gap; standard dialog/popup patterns expect Escape to dismiss); **silent geolocation failure — Low**; **panel over sticky header — Info**.

---

## Evidence index (`docs/qa-audit/destination-dropdown/`)

| File | What it shows |
|---|---|
| `01-repro-1300x630-before.png` | Your scenario reproduced: Check-In / Guests / Map controls exposed left of the panel |
| `02-1300x630-with-fix.png` | Same viewport with the fix applied at runtime: panel exactly covers the field width |
| `03-1024x768-before.png` | Panel 160 px wider than its field, spilling over the hero image |
| `04-1024x768-with-fix.png` | Fixed |
| `05-390x844-before.png` | Phone: panel shifted 49 px left of the field, left edge at −9 px *(captured with page scrolled 400 px)* |
| `06-390x844-with-fix.png` | Phone with fix: aligned with the field, inside the screen *(captured at scroll 0)* |
| `07-scrolled-panel-over-sticky-header.png` | Panel painting over the sticky header when scrolled |
| `08-search-page-compact-bar-not-affected.png` | `/search` compact bar: same component, left-anchored 560 px panel, no exposed strip or off-screen edge — why the fix must be scoped |
