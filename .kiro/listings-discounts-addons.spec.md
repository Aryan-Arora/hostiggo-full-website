# Spec: Listing Discounts & Addons Management

## Overview
Complete feature implementation for adding, editing, and managing discounts and addons (service add-ons) during listing creation and post-publication. Hosts can configure optional services with pricing and timing details.

**Important**: Both Discounts and Addons are **completely optional** during listing creation. Users can:
- Skip discounts entirely → no discount rules applied
- Skip addons entirely → no service add-ons available
- Add them later from the manage listings page
- Continue without adding either → listing publishes normally

## Requirements

### Discounts
- **Discount Types** (from schema):
  - New listing discount (0-3 bookings)
  - Weekly discount (7+ nights)
  - Monthly discount (28+ nights)
  - Custom discounts (future extension)
  
- **Discount Configuration**:
  - Percentage-based (0-100%)
  - Enable/disable toggle per discount type
  - Edit anytime (before/after publication)

### Addons (Service Add-ons)
- **Available Addons** (predefined categories):
  - Food & Dining (Breakfast, Lunch, Dinner, Snacks, Packed meals, Private chef)
  - Events & Decorations (Birthday, Honeymoon, Proposal, Small events, Music/speaker)
  - Adventure & Experiences (Trekking, Camping, Cycling, River Rafting, etc.)
  - Drive, Car & Transport (Local driver, Sightseeing, Car rental, Tempo, Bike rental)
  - Photography & Media (Local photographer, Videographer, Drone shoot)
  - Wellness & Lifestyle (Yoga, Meditation, Massage, Ayurveda)

- **Addon Configuration per Listing**:
  - Price (numeric)
  - Includes (description text)
  - Timing (from/to time, e.g., 8:00 AM - 10:00 AM)
  - Additional details (JSON flexible field)
  - Additional notes (text)
  - Enable/disable toggle

## Schema Tables (Already Exist)

```
listing_discounts:
  - id (auto)
  - listing_id (FK)
  - discount_type (text)
  - percent (numeric, 0-100)
  - enabled (boolean)

listing_addons:
  - id (auto)
  - listing_id (FK)
  - addon_id (FK)
  - price (numeric)
  - includes (text)
  - timing_from (time)
  - timing_to (time)
  - another_details (jsonb)
  - additional_notes (text)
  - created_at (timestamp)

addons:
  - addon_id (auto)
  - name (text, unique)
  - icon (text)
  - category (text)
  - created_at (timestamp)
```

## Tasks

### Task 1: Create Discount Management Services
- [ ] Create `src/lib/services/discounts.ts`
  - `getListingDiscounts(listingId)` - fetch all discounts
  - `createDiscount(listingId, discountType, percent)` - create new discount
  - `updateDiscount(id, percent, enabled)` - update discount
  - `deleteDiscount(id)` - remove discount
  - `toggleDiscount(id, enabled)` - enable/disable
  
- [ ] Error handling for validation (percent 0-100, etc.)

### Task 2: Create Addon Management Services
- [ ] Create `src/lib/services/addons.ts`
  - `getAllAddons()` - fetch all available addons from DB
  - `getListingAddons(listingId)` - fetch addon assignments for listing
  - `addAddonToListing(listingId, addonId, price, includes, timingFrom, timingTo, details, notes)` - add addon
  - `updateListingAddon(addonListingId, price, includes, timingFrom, timingTo, details, notes)` - edit addon
  - `removeAddonFromListing(addonListingId)` - remove addon
  - `toggleAddonOnListing(addonListingId, enabled)` - enable/disable

### Task 3: Create API Routes
- [ ] `src/app/api/host/listings/[listingId]/discounts/route.ts` (GET, POST)
  - GET: return all discounts for listing
  - POST: create new discount
  
- [ ] `src/app/api/host/listings/[listingId]/discounts/[id]/route.ts` (PATCH, DELETE)
  - PATCH: update discount
  - DELETE: remove discount
  
- [ ] `src/app/api/host/listings/[listingId]/addons/route.ts` (GET, POST)
  - GET: return all addons available + current listing addons
  - POST: add addon to listing
  
- [ ] `src/app/api/host/listings/[listingId]/addons/[id]/route.ts` (PATCH, DELETE)
  - PATCH: update addon details
  - DELETE: remove addon from listing

### Task 4: Create UI Components
- [ ] Create `src/components/features/DiscountsForm.tsx`
  - Show 3 discount types (New listing, Weekly, Monthly)
  - Toggle switches per type
  - Percentage input fields
  - Display current values from API
  - Real-time save on changes
  
- [ ] Create `src/components/features/AddonsForm.tsx`
  - Display addons grouped by category
  - Checkbox to add/remove addon
  - When checked, show collapsible details:
    - Price input
    - Includes text field
    - Timing from/to inputs
    - Additional notes textarea
    - "Edit Details" link for expanded modal (optional)

### Task 5: Create Addon Editor Modal
- [ ] Create `src/components/modals/AddonEditorModal.tsx`
  - Modal for detailed addon editing
  - Fields: Name, Price, Includes, Timing, Notes
  - Save/Cancel buttons
  - Delete addon option

### Task 6: Integrate into Listing Flow
- [ ] Update `src/app/host/list/page.tsx` or create new multi-step wizard
  - Add "Discounts" step (OPTIONAL - can skip)
  - Add "Addons" step as penultimate before publish (OPTIONAL - can skip)
  - **IMPORTANT**: Both steps must have a "Skip" or "Continue without adding" option
  - "Next" button should work whether user adds discounts/addons or skips
  
- [ ] Create `src/app/host/listings/manage/[listingId]/discounts-addons/page.tsx`
  - Standalone page to edit discounts/addons post-publish
  - Show both forms side-by-side or tabbed
  - Save button to persist changes
  - "Back to listing" link

### Task 7: Update Listing Edit Page
- [ ] Update `src/app/host/listings/manage/page.tsx`
  - Add "Edit Discounts & Addons" button/link for each listing
  - Navigate to discounts-addons page

### Task 8: Build & Test
- [ ] Verify all API routes work
- [ ] Test discount creation, update, delete
- [ ] Test addon selection, configuration, removal
- [ ] Test data persistence in DB
- [ ] Verify no TypeScript errors (npm run build)

---

## File Structure

```
src/
├── lib/services/
│   ├── discounts.ts (NEW)
│   └── addons.ts (NEW)
├── components/features/
│   ├── DiscountsForm.tsx (NEW)
│   └── AddonsForm.tsx (NEW)
├── components/modals/
│   └── AddonEditorModal.tsx (NEW)
├── app/api/host/listings/
│   └── [listingId]/
│       ├── discounts/
│       │   ├── route.ts (NEW)
│       │   └── [id]/route.ts (NEW)
│       └── addons/
│           ├── route.ts (NEW)
│           └── [id]/route.ts (NEW)
└── app/host/listings/
    ├── manage/
    │   └── [listingId]/
    │       └── discounts-addons/
    │           └── page.tsx (NEW)
```

## Design Patterns

- **Service layer** handles all DB operations
- **API routes** validate input and call services
- **Components** fetch from API and manage local state
- **Real-time UI updates** on successful API calls
- **Toast notifications** for success/error feedback
- **Optimistic updates** where appropriate

## UI/UX Notes

1. **Discounts section**: Simple toggles + percentage inputs (no modal needed)
   - Show text: "Add discounts (optional)" 
   - Users can leave all disabled and move forward
   
2. **Addons section**: Checkboxes + collapsible details for each addon
   - Show text: "Add service add-ons (optional)"
   - Users can skip entirely without selecting any addon
   
3. **Skip/Continue buttons**:
   - Discounts step: "Previous" | "Skip" or "Continue" (both proceed to next step)
   - Addons step: "Previous" | "Skip Addons" or "Continue" (both proceed to publish)
   
4. **Edit modal** (optional): For detailed editing of selected addons
5. **Save & Exit** button: Submit all changes at once (on manage page)
6. **Post-publish**: Dedicated "Discounts & Addons" management page where user can always add them later

## Flow Diagram

```
Create Listing
    ↓
[Other steps...]
    ↓
Discounts Step (OPTIONAL)
├─ User can configure discounts → Next
├─ User can skip discounts → Next
└─ User can go back → Previous
    ↓
Addons Step (OPTIONAL)
├─ User can configure addons → Publish
├─ User can skip addons → Publish
└─ User can go back → Previous
    ↓
Listing Published (with or without discounts/addons)
    ↓
[Manage Page] - User can edit discounts/addons anytime
```

