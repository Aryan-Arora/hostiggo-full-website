# Hostiggo — Performance & Scalability Optimization Plan

_Prepared as a senior system-design review of the current codebase (Next.js 14 App Router + Supabase). Every recommendation below is tied to concrete evidence in the repo, prioritized by impact-vs-effort, and sequenced into a phased roadmap._

---

## 0. TL;DR — where the wins are

| # | Initiative | Layer | Impact | Effort | Priority |
|---|-----------|-------|--------|--------|----------|
| 1 | Move data-heavy pages off `'use client'` → Server Components + streaming | Rendering | 🔴 Very High | High | **P0** |
| 2 | Stop forcing `cache: 'no-store'` everywhere; add tagged caching + ISR for reference data | Data/Caching | 🔴 Very High | Medium | **P0** |
| 3 | Standardize on `next/image` (replace raw `<img>`), tune `images` config | Assets | 🟠 High | Medium | **P0** |
| 4 | Code-split Leaflet & self-host its CSS; dynamic-import heavy libs (jspdf, recharts) | Bundle/Maps | 🟠 High | Medium | **P1** |
| 5 | Push filtering + availability into the DB; parallelize search sub-queries | DB/API | 🟠 High | Medium | **P1** |
| 6 | Add caching to geocoding/autocomplete; debounce + client cache | Data/API | 🟡 Medium | Low | **P1** |
| 7 | Observability: web-vitals reporting + bundle analyzer + slow-query logging | Ops | 🟡 Medium | Low | **P2** |
| 8 | Edge/CDN, rate limiting, connection pooling for Supabase | Infra | 🟡 Medium | Medium | **P2** |

> **Golden rule before touching anything: measure first.** Establish a baseline (Section 8) so every change is validated against real numbers, not vibes.

---

## 1. Rendering architecture — the single biggest lever

### Evidence
- **35 of 43 `page.tsx` files begin with `'use client'`** — including the two most-visited, most-expensive pages:
  - `src/app/page.tsx` (home) — client component that fetches listings via `api.search()` **after** hydration.
  - `src/app/property/[id]/page.tsx` (detail) — client component, fetches on mount.
- Only **3 `next/dynamic` usages** in the entire app, so almost nothing is lazily code-split.

### Problem
The current flow for the home and detail pages is a classic client waterfall:

```
HTML shell → download JS bundle → hydrate → useEffect fires → fetch /api/* → render
```

The user stares at a skeleton while three sequential network legs complete. This hurts **LCP, TTFB-to-content, and SEO** (bots see an empty shell), and ships far more JavaScript than needed.

### Recommendation
1. **Convert data-fetching pages to Server Components.** Fetch listing/detail data on the server (directly via the Supabase service layer you already have in `src/lib/`), render meaningful HTML, and hydrate only the interactive islands (search bar, date picker, favorite button, gallery).
2. **Adopt streaming with `<Suspense>`** so the page shell + above-the-fold content paint immediately while slower sections (reviews, map, "similar stays") stream in.
3. **Keep client components small and leaf-level.** A page being interactive somewhere does not require the whole page to be `'use client'`. Push the directive down to the smallest interactive component.
4. **Generate metadata server-side** (`generateMetadata`) on the property page for shareable/SEO-friendly titles, descriptions, and OpenGraph images.

### Expected impact
- LCP improvement of **1–3s** on cold loads (server HTML vs. client waterfall).
- Smaller client JS on first load (interactive islands only).
- Real SEO for listing pages.

---

## 2. Caching strategy — you are currently opting **out** of caching

### Evidence
- **41 occurrences of `no-store` / forced dynamic** across `src/`.
- `src/lib/supabase.ts` wires a custom `fetch` that hard-codes `cache: "no-store"` on **every** Supabase request; `supabase-admin.ts` mirrors it.
- No `revalidate`, no `unstable_cache`, no tag-based revalidation anywhere.

### Problem
The `no-store` was added to fix a real bug (stale "popular locations" served from Next's Data Cache). But the cure was applied globally — so **genuinely static reference data is re-fetched from Postgres on every single request**:
- `api.locations()` (destinations autocomplete source)
- `api.amenities()`
- `safety_features` master list
- Home page "popular cities" sections

Every home-page load hammers the DB for data that changes maybe weekly.

### Recommendation
Replace the blunt global `no-store` with **intent-scoped caching**:

| Data | Strategy |
|------|----------|
| Locations, amenities, safety features (reference) | `unstable_cache` with `revalidate: 3600` + a `tags: ['reference']` tag; bust on admin edit via `revalidateTag`. |
| Search results | Short TTL (30–60s) keyed on the filter payload, **or** stay dynamic but cache the *availability* sub-queries. |
| Property detail | ISR with `revalidate: 300` + `revalidateTag('listing:<id>')` on host edit / new review. |
| User-specific (bookings, wishlist, profile) | Stay `no-store` — correct here. |

The key insight: **cache by data volatility, not by a single global switch.** Reference data → long TTL. User data → no cache. Search → short TTL or per-fragment.

### Expected impact
- Massive reduction in redundant Supabase reads (cost + latency).
- Faster home page and search (cache hits served from the edge/data cache).

---

## 3. Images — standardize on `next/image`

### Evidence
- **Dozens of raw `<img>` tags** across host onboarding, `my-memories`, chat, booking confirmation, account, and dashboard surfaces; only **6 files import `next/image`**.
- `next.config.js` declares `remotePatterns` but sets **no `formats`, `deviceSizes`, `imageSizes`, or `minimumCacheTTL`.**
- Good news: the primary `PropertyCardList` already uses `next/image` — that pattern just needs to spread.

### Problem
Raw `<img>` on user-generated content (Supabase-hosted photos, memories, chat images) means:
- No automatic WebP/AVIF conversion → 2–4× larger payloads.
- No responsive `srcset` → phones download desktop-sized images.
- No built-in lazy-loading discipline / layout-shift protection (CLS).

### Recommendation
1. **Replace raw `<img>` with `next/image`** on all app-owned surfaces, prioritizing high-traffic/high-density ones (memories grid, host listings, booking confirmation, chat).
2. **Tune `next.config.js`:**
   ```js
   images: {
     remotePatterns: [/* existing */],
     formats: ['image/avif', 'image/webp'],
     minimumCacheTTL: 60 * 60 * 24 * 7, // 7d
     deviceSizes: [360, 640, 828, 1080, 1200, 1920],
   }
   ```
3. **Set `sizes` accurately** on each responsive image so the browser picks the right candidate (a card at 1/3 width should not fetch a 1920px image).
4. **Mark the LCP image `priority`** (hero, first card, gallery cover) and lazy-load the rest.
5. Consider **Supabase image transformations** (or a CDN like Cloudflare Images) to generate thumbnails at the source instead of shipping full-res originals.

### Expected impact
- 40–70% image byte reduction on media-heavy pages.
- Lower CLS, faster LCP on the home/search/detail pages.

---

## 4. Bundle size & third-party libraries

### Evidence
Heavy dependencies in `package.json`, most not code-split:
- `jspdf` (~heavy PDF lib) — needed only for invoice/receipt export.
- `recharts` — needed only on host analytics/dashboard.
- `leaflet` — needed only on map surfaces; currently `require('leaflet')` (synchronous) in `InteractiveMap.tsx` / `MapPreview.tsx`.
- ~25 `@radix-ui/*` packages, `embla-carousel`, `razorpay`.

### Problem
With only 3 dynamic imports app-wide, libraries like `jspdf` and `recharts` risk being pulled into shared chunks and shipped to users who never export a PDF or open a chart.

### Recommendation
1. **`next/dynamic` (with `ssr: false`) for:** all Leaflet maps, `recharts` dashboards, `jspdf` export flows, the carousel where above-the-fold isn't required.
2. **Add `@next/bundle-analyzer`** and audit the largest chunks (Section 8). Treemap the home, search, and detail routes.
3. **Verify tree-shaking of `lucide-react`** — import icons individually (`import { Star } from 'lucide-react'` is fine; a barrel `import * as Icons` is not).
4. **Lazy-load Razorpay's script** only on the checkout step, not globally.

### Expected impact
- Smaller initial JS for the 90% of sessions that never touch maps/PDF/charts.
- Faster Time-to-Interactive.

---

## 5. Maps — self-host, code-split, and stop the CDN dependency

### Evidence
`InteractiveMap.tsx` and `MapPreview.tsx` both:
- `require('leaflet')` synchronously at module scope.
- Inject Leaflet CSS at runtime via a `<link href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">` appended to `<head>` on first mount.

### Problem
- **Third-party CDN in the critical path** = single point of failure + extra DNS/TLS/round-trip + FOUC (map renders unstyled until the unpkg CSS lands).
- Synchronous `require` couples Leaflet into whatever chunk imports these components.
- Logic (CSS injection, marker icon HTML, CDN URL) is **duplicated** across both components.

### Recommendation
1. **Install Leaflet's CSS locally** and `import 'leaflet/dist/leaflet.css'` once (it's already a dependency) — remove the runtime `unpkg` `<link>` injection entirely.
2. **Load all maps via `next/dynamic({ ssr: false })`** so Leaflet ships only to routes that render a map.
3. **Extract a shared `useLeafletMap` hook / `<BaseMap>`** to dedupe init, CSS, and the marker-icon builders shared by `InteractiveMap` and `MapPreview`.
4. (Already fixed) map controls no longer bleed over app overlays — the `.leaflet-container { isolation: isolate }` rule in `globals.css` keeps each map's stacking context contained.

### Expected impact
- Removes a hard runtime dependency on unpkg.com; no FOUC.
- Leaflet out of non-map bundles.

---

## 6. Database & API layer

### Evidence (from `src/app/api/search/route.ts`)
- After `HotelServiceApi.filterHotels(...)`, the route **filters `propertyTypes` and `stayTypes` in JavaScript** on the returned rows.
- Availability is computed with **two sequential `await`ed Supabase queries** (`listing_calendar` blocked rows, then `bookings` booked rows) via `.in(listingIds, ...)`.

### Problem
- **In-memory filtering after the query** means the DB returns rows that are then discarded, and **pagination counts become wrong** (you paginate pre-filter, then drop rows post-filter → short/empty pages).
- The two availability queries are **sequential** when they are independent — an easy parallelization win.
- Broader risk: `mapListingToProperty` expects deeply nested joins (media, amenities, reviews, house rules, safety, discounts, addons). If those aren't fetched in a single joined query, this is an **N+1** waiting to happen per listing.

### Recommendation
1. **Push `propertyTypes` / `stayTypes` filters into the SQL/RPC** (`filterHotels`) so pagination and counts are correct and less data crosses the wire.
2. **Parallelize independent queries:** `const [blocked, booked] = await Promise.all([...])`.
3. **Prefer a single Postgres RPC / view** that returns listings with availability already joined, rather than fetch-then-filter in Node.
4. **Verify indexes** back every filter/sort path (district, price, rating, `listing_calendar.listing_id`, `bookings.listing_id + status_id`). The docs show some indexes exist — audit against the *actual* query plans (`EXPLAIN ANALYZE`).
5. **Return a real total count** for pagination (Postgres `count: 'exact'` or a windowed count) instead of inferring "hasMore" from page length.

### Expected impact
- Correct pagination, fewer bytes transferred, lower p95 search latency.

---

## 7. Geocoding & autocomplete

### Evidence
- `DestinationDropdown.tsx` debounces at 300ms and calls `api.locations()`; the map search debounces at 400ms and calls external geocoding (`src/lib/services/geocoding.ts`).
- No caching of autocomplete results client-side.

### Recommendation
- **Cache autocomplete responses** (e.g. an in-memory `Map` keyed by normalized query, or React Query/SWR) so re-typing "Del" → "Delh" → "Del" doesn't re-hit the network.
- If geocoding hits Nominatim/OSM, **respect its usage policy** and add a **server-side cache** (`unstable_cache`, 24h) — those results are effectively immutable.
- Consider a **minimum query length** (≥2 chars) before firing.

---

## 8. Observability & measurement (do this first)

You can't optimize what you don't measure. Before Phase 1:

1. **Add `@next/bundle-analyzer`** → capture a baseline treemap for `/`, `/search`, `/property/[id]`.
2. **Report Web Vitals** — Next's `useReportWebVitals` → send LCP/INP/CLS/TTFB to your analytics (or console in dev). Track before/after each initiative.
3. **Run Lighthouse / PageSpeed** on the three key routes and record scores.
4. **Log slow Supabase queries** (wrap the service layer with timing; flag anything > 300ms).
5. **Set performance budgets** in CI (e.g. fail the build if the `/search` first-load JS exceeds a threshold).

**Baseline metrics to capture now:** LCP, INP, CLS, TTFB, first-load JS per route, Supabase read count per page.

---

## 9. Phased roadmap

### Phase 0 — Instrument (0.5 week)
- Bundle analyzer, Web Vitals reporting, Lighthouse baseline, slow-query logging.
- **Exit criteria:** a dashboard/notes doc with baseline numbers for the 3 key routes.

### Phase 1 — Quick, high-ROI wins (1–2 weeks)
- Parallelize search availability queries; push type filters into SQL (§6).
- `next.config.js` image tuning + `next/image` on the top 5 media surfaces (§3).
- Self-host Leaflet CSS + `next/dynamic` all maps (§5).
- Dynamic-import `jspdf` and `recharts` (§4).
- Autocomplete client cache (§7).

### Phase 2 — Structural: rendering + caching (2–4 weeks)
- Convert home + property detail to Server Components with streaming (§1).
- Replace global `no-store` with volatility-scoped caching + ISR/tags (§2).
- Finish `next/image` migration across remaining `<img>` (§3).
- **Exit criteria:** LCP < 2.5s on home + detail; reference data served from cache.

### Phase 3 — Scale & hardening (ongoing)
- Edge runtime / CDN for cacheable routes; Supabase connection pooling (PgBouncer/Supavisor) for serverless (§10).
- API rate limiting on auth/OTP/search.
- Performance budgets enforced in CI.

---

## 10. Infrastructure & scaling notes

- **Serverless + Postgres:** confirm Supabase access goes through a **pooler** (Supavisor/PgBouncer) — serverless functions can exhaust direct connections under load.
- **Edge caching:** cacheable GET routes (reference data, static pages: terms/privacy/cookies already server-rendered) should carry `Cache-Control` / be served from the CDN.
- **Rate limiting:** `/api/auth/otp`, `/api/search`, and upload endpoints are abuse-prone — add per-IP/per-user limits.
- **Uploads:** stream to Supabase Storage; enforce size/type limits; generate derivative thumbnails server-side.

---

## 11. What's already good (don't regress these)

- Clean service/API separation (`src/lib/api.ts` → `/api/*` route handlers).
- `server-only` guard on the admin Supabase client — secret key can't leak to the browser.
- Honest data mapping in `mapListingToProperty` (avoids fabricating ratings/host stats).
- `PropertyCardList` already uses `next/image` — the template to replicate.
- Deliberate cache-busting reasoning is documented in code (the fix now just needs to be *scoped*, not removed).

---

### Appendix — evidence index
- Client pages: 35/43 `page.tsx` with `'use client'` (incl. `app/page.tsx`, `app/property/[id]/page.tsx`).
- Caching: 41 `no-store`/dynamic markers; `src/lib/supabase.ts` + `supabase-admin.ts` force `no-store`.
- Images: dozens of raw `<img>`; 6 `next/image` importers; `next.config.js` missing `formats`/`deviceSizes`.
- Maps: runtime unpkg CSS injection + synchronous `require('leaflet')` in `InteractiveMap.tsx`, `MapPreview.tsx`.
- Search: post-query JS filtering + sequential availability queries in `src/app/api/search/route.ts`.
- Dynamic imports: only 3 app-wide.
