# Hostiggo Website — Session Documentation

> Working notes for this session. Part 1 documents how the codebase is built and
> how things work today (so we don't break anything). Part 2 is the running plan
> of what we'll do this session.

---

## Part 1 — How the codebase works today

### 1.1 Stack & tooling

| Concern | Choice |
|---|---|
| Framework | **Next.js 14** (App Router), `src/app/*` |
| Language | TypeScript (strict-ish), path alias `@/* → src/*` |
| Styling | Tailwind CSS + custom tokens in `globals.css` / `index.css` |
| UI kit | shadcn/ui (Radix primitives) under `src/components/ui/*` |
| Icons | lucide-react |
| State | React Context (`ListingFilterContext`) — no Redux/Zustand in use despite being installed |
| Data source | **Supabase** (Postgres), schema `hostiggo_testing_schema` |
| Maps | Google Maps JS API (needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) |
| Notifications | sonner toasts (mounted in `layout.tsx`) |

> Note: `package.json` carries many deps that aren't wired into the website yet
> (three.js/react-three, stripe, redux, react-router-dom, recharts, xlsx, jspdf,
> framer-motion). These are mostly carryover; the live website uses the subset above.

### 1.2 How it runs

- Dev server: `npm run dev` (configured in `.claude/launch.json` as **`hostiggo-web`** on **port 3001**).
- `node_modules` had to be installed with `npm install` (npm lockfile present).
- **Env vars** (none committed; create `.env.local` for real keys):
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **fall back to hardcoded values in `src/lib/supabase.ts`**, so the app works without an env file.
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — **not set**, so maps will be degraded until provided.

### 1.3 Data flow (the important part)

The app uses a clean 4-layer flow. **The browser never talks to Supabase directly** for
listings — it goes through Next.js API routes.

```
Page / Component (client)
   │  calls
   ▼
src/lib/api.ts            ← typed fetch wrappers, returns plain JS
   │  HTTP fetch to
   ▼
src/app/api/*/route.ts    ← Next.js route handlers (server, force-dynamic)
   │  calls
   ▼
src/lib/services/*.ts     ← Supabase queries + RPC calls (HotelServiceApi etc.)
   │
   ▼
Supabase (hostiggo_testing_schema)
```

Key translation step: **`mapListingToProperty(row)`** in `src/lib/api.ts` normalizes
the messy DB shape (snake_case, nested joins, RPC variants) into the clean
`Property` type used everywhere in the UI. It is defensive — tolerates many field
name variants and falls back to a default Unsplash image. Related mappers:
`mapWishlistListing`, `mapBooking`.

### 1.4 API routes (`src/app/api`)

| Route | Methods | Backed by |
|---|---|---|
| `/api/search` | POST | `HotelServiceApi.filterHotels` → Supabase RPC `search_listings` |
| `/api/hotels` | GET | `getHotels` / `getHotelsByLocationId` |
| `/api/hotels/[id]` | GET | `getHotelDetail` (full listing + media + reviews + amenities) |
| `/api/locations` | GET | `getLocationSample` or RPC `search_locations_partial` |
| `/api/amenities` | GET | `getAmenities` |
| `/api/room-types` | GET | RPC `get_unique_room_types` |
| `/api/auth/otp` | POST | Supabase Auth OTP (send / verify) |
| `/api/bookings` | GET/POST/PATCH | guest bookings, update dates/guests/status |
| `/api/wishlist` | GET/POST/PATCH/DELETE | categories + saved listings |
| `/api/calendar` | GET/POST | availability calendar |
| `/api/chat` | GET/POST/DELETE | messaging |
| `/api/users` | GET/POST/PATCH | user profile |

All route handlers are `export const dynamic = "force-dynamic"` (no caching).

### 1.5 Pages (`src/app`)

| Route | File | Notes |
|---|---|---|
| `/` | `page.tsx` | Home — client component. Loads 4 random locations, shows "Popular stays in X" sections + CTA banner. |
| `/search` | `search/page.tsx` | Thin Suspense wrapper → `SearchPageContent`; skeleton fallback. |
| `/property/[id]` | `property/[id]/page.tsx` | Property detail (gallery, amenities, reviews, host, booking). |
| `/signin`, `/otp` | auth flow | Phone + OTP via Supabase. |
| `/wishlist`, `/my-memories` | user pages | Saved listings, bookings dashboard. |
| `/terms`, `/privacy`, `/cookies`, `/cancellation` | static policy pages | |
| `not-found.tsx` | 404 | |

### 1.6 State management — `ListingFilterContext`

`src/context/ListingFilterContext.tsx` is the heart of search/filtering. It is split
into **two contexts** (state vs. actions) to limit re-renders:

- `useListingState()` → `properties, loading, error, filters, location, dates, guests, sort, pagination, counts`
- `useListingActions()` → setters: `setLocation, setSort, setPriceRange, setRating, toggleAmenity, togglePropertyType, toggleBedType, setBooleanFilter, fetchMore, clearFilters, setDates, setGuests, refresh`

Behavior worth knowing before editing it:
- Page size = **20**. `fetchResults(page, isRefresh)` calls `api.search(...)`.
- A `useEffect` keyed on `[location.query, filters]` re-fetches from page 0 when
  either changes. It uses `prevLocationRef` / `prevFiltersRef` + `JSON.stringify(filters)`
  to detect *real* changes and avoid loops (the "circular dependency fix" in the README).
- `hasMore` is inferred from whether the last page returned a full 20 rows.
- **Known gaps / sharp edges:**
  - `setSort` updates state but **does not trigger a refetch** (comment says "in a real
    implementation, sort would trigger a refresh"). Sorting is currently inert.
  - `dates` and `guests` are stored but **not sent** to `api.search` (payload sends
    `startDate: null, endDate: null, totalGuests: undefined`).
  - `filters.amenities` are collected in the UI but sent to the API as an empty
    array (`amenities: []`) — amenity filtering is not plumbed through to the RPC.

### 1.7 Components (`src/components`)

- `features/` — app-specific: `HeroSection`, `SearchForm`, `PopularStays`,
  `PropertyCard`/`PropertyCardList`, `FiltersSidebar`, `SortDropdown`,
  `ActiveFilterTags`, `DateRangePicker`, `GuestDropdown`, `DestinationDropdown`,
  `LocationDropdownWithPlaces`, `InteractiveMap`/`MapPreview`, skeletons & `LoadingStates`,
  `SearchPageContent` (the real search UI behind the Suspense boundary).
- `layout/` — `Navbar`, `Footer`.
- `ui/` — shadcn primitives (don't hand-edit unless intentionally customizing the kit).

### 1.8 Supabase schema reference

`src/lib/schema.constants.ts` is a big typed map of tables → columns (e.g. `listings`,
`listing_discounts`, `listing_house_rules`, `listing_bedrooms`, ...). Use this as the
source of truth for column names instead of guessing. The DB uses snake_case and has a
typo in one column (`lisiting_status`).

---

## Part 2 — What we'll do this session

> _To be filled in once we lock scope. Each item gets: goal → files touched → how to verify._

### Done this session — Polish property reviews UI to match Figma
The "Ratings & reviews" section + `ReviewsModal` already existed and were fully wired.
The reason reviews don't appear in the live app is **data**: the Supabase `review`
table returns `[]` for every listing (the join works, there are simply no rows), so
`property.reviewCount` is 0 and `property.rating` falls back to 4.5. Decision: leave
data as-is, only polish styling to match the Figma for when real reviews exist.

Changes (all in `src/app/property/[id]/page.tsx` + `src/app/globals.css`):
- [x] Modal filter pill: removed the `Filter` icon → clean **"All ▾"** rounded pill.
- [x] Modal review row: name **·** date now **inline**, gold stars moved **directly
      under the name** (were right-aligned) — matches Figma layout.
- [x] Modal body: slim **blue rounded scrollbar** via new `.reviews-scroll` utility.
- [x] Added the missing `modalSlideUp` keyframe the modal already referenced.
- Verified by temporarily injecting 3 sample reviews, screenshotting the open modal,
  then **reverting** the injection (no demo data ships; `reviews = property.reviews ?? []`).

> If reviews should actually show in production, that's a separate data task
> (seed the `review` table, or add a frontend demo fallback) — not done here.

### Verification checklist (per change)
- [ ] Dev server compiles clean (`hostiggo-web`, port 3001) — check `preview_logs`.
- [ ] No new console errors (`preview_console_logs`).
- [ ] Affected page renders correctly (screenshot / snapshot).
- [ ] No regression in search → results → property flow.

### Guardrails
- Don't edit `src/components/ui/*` unless we're deliberately changing the design system.
- Keep the API-route boundary: client → `lib/api.ts` → `app/api/*` → `lib/services/*`.
- Use `schema.constants.ts` for DB column names.
- Real keys go in `.env.local` (never commit). Maps need `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

---

## Part 3 — Upcoming: importing pages from Stitch

**The plan (agreed):**
1. User provides a **Stitch link** containing one or more designed pages (may be rough/messy).
2. **Bring every page in, in one pass** — place each where it belongs in the app
   (new route under `src/app/<route>/page.tsx`, or a component under
   `src/components/features/`).
3. **Reskin to the current theme** — Stitch's colors/spacing/fonts will differ; we
   re-map them to the Hostiggo theme tokens below so the new pages look native.
4. **Polish** the design pass-by-pass to match the rest of the site.
5. **Then wire up functionality** (data, API routes, context) — styling first, behavior after.

**Import checklist (per Stitch page):**
- [ ] Identify the page's role → pick the route/component location.
- [ ] Scaffold the file(s); wrap with `Navbar` + `Footer` if it's a full page.
- [ ] Replace Stitch's raw colors/hex with theme tokens (table below).
- [ ] Swap fonts to **Inter**; normalize radius to `rounded-2xl`/`rounded-xl`.
- [ ] Reuse existing `ui/*` and `features/*` components instead of re-building.
- [ ] Use `'use client'` only when the page needs hooks/state.
- [ ] Verify: compiles clean, no console errors, screenshot vs. site theme.
- [ ] Leave data/functionality as TODO stubs until the styling pass is done.

### Theme reference (apply this to imported pages)

**Fonts:** `Inter` (set globally on `body`). Headings bold/extrabold, gray-800.

**Colors** (Tailwind tokens in `tailwind.config.ts`):
| Token | Value | Use |
|---|---|---|
| `primary` / `primary-600` | `#2563eb` (blue-600) | primary actions, links |
| `primary-500` | `#3b82f6` | accents, scrollbars |
| `primary-50/100` | `#eff6ff`/`#dbeafe` | hover/active tints |
| `brand-blue` | `#1a6ff4` | brand highlight |
| `brand-dark` | `#0f172a` | dark text/headers |
| page background | `#f0f2f5` | app shell (`bg-[#f0f2f5]`) |
| primary gradient | `#1B3FA0 → #0086D8` | hero/CTA (`.bg-primary-gradient`) |

**Radius:** base `--radius: 0.75rem`. Cards `rounded-2xl`, controls `rounded-xl`, pills `rounded-full`.

**Shadows:** `shadow-card` (`0 1px 8px rgba(0,0,0,.07)`), `shadow-card-hover`,
`shadow-dropdown`, `shadow-nav`.

**Reusable class helpers (in `globals.css` `@layer components`):**
`.container-main` (max-w-6xl centered), `.btn-primary`, `.btn-outline`,
`.card-base` (white card + hover lift), `.dropdown-panel`, `.bg-primary-gradient`,
`.scrollbar-hide`, `.reviews-scroll`.

**Animations:** `shimmer` (skeletons), `animate-slide-up`, `animate-fade-in`,
`accordion-down/up`, `modalSlideUp`.

> Rule of thumb for re-skinning a Stitch page: white cards on `#f0f2f5`, Inter font,
> blue-600 primary, `rounded-2xl` cards with `shadow-card`, generous padding (`p-5`),
> gray-800 headings / gray-500–600 body text.
