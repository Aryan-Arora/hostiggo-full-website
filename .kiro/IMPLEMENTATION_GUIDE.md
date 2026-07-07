# Discounts & Addons Implementation Guide

## ✅ Build Status
**All 41 routes compile successfully with 0 TypeScript errors**

## 📁 Files Created

### Service Layer
- `src/lib/services/discounts.ts` - Discount management operations
- `src/lib/services/addons.ts` - Addon management operations

### API Routes
- `src/app/api/host/listings/[listingId]/discounts/route.ts` - GET/POST discounts
- `src/app/api/host/listings/[listingId]/discounts/[id]/route.ts` - PATCH/DELETE discount
- `src/app/api/host/listings/[listingId]/addons/route.ts` - GET/POST addons
- `src/app/api/host/listings/[listingId]/addons/[id]/route.ts` - PATCH/DELETE addon

### UI Components
- `src/components/features/DiscountsForm.tsx` - Discount management form (optional)
- `src/components/features/AddonsForm.tsx` - Addon management form (optional)

### Pages
- `src/app/host/listings/manage/[listingId]/discounts-addons/page.tsx` - Standalone management page

## 🎯 Feature Overview

### Discounts
- **Three preset types**: New listing, Weekly, Monthly
- **Percentage-based**: 0-100%
- **Toggle enabled/disabled**: Per discount type
- **Optional**: Users can skip entirely

### Addons
- **Six categories**: Food & Dining, Events & Decorations, Adventure & Experiences, Drive/Transport, Photography, Wellness
- **Per-addon configuration**:
  - Price (numeric)
  - Includes (description)
  - Timing (from/to)
  - Additional notes
- **Optional**: Users can skip or select individual addons

## 📚 API Endpoints

### Discounts

**GET** `/api/host/listings/{listingId}/discounts`
- Returns all discounts for a listing
- Response: `{ data: ListingDiscount[] }`

**POST** `/api/host/listings/{listingId}/discounts`
- Create new discount
- Body: `{ discount_type, percent }`

**PATCH** `/api/host/listings/{listingId}/discounts/{id}`
- Update discount
- Body: `{ percent?, enabled? }`

**DELETE** `/api/host/listings/{listingId}/discounts/{id}`
- Remove discount

### Addons

**GET** `/api/host/listings/{listingId}/addons`
- Returns available addons + selected addons
- Response: `{ data: { available: Addon[], selected: ListingAddon[] } }`

**POST** `/api/host/listings/{listingId}/addons`
- Add addon to listing
- Body: `{ addon_id, price, includes, timing_from?, timing_to?, another_details?, additional_notes? }`

**PATCH** `/api/host/listings/{listingId}/addons/{id}`
- Update addon
- Body: `{ price?, includes?, timing_from?, timing_to?, another_details?, additional_notes? }`

**DELETE** `/api/host/listings/{listingId}/addons/{id}`
- Remove addon

## 🔌 Integration Points

### To integrate into listing creation wizard:

1. **Import components**:
```tsx
import DiscountsForm from '@/components/features/DiscountsForm';
import AddonsForm from '@/components/features/AddonsForm';
```

2. **Add as optional steps** (can be skipped):
```tsx
// In your wizard flow
<Step title="Discounts">
  <DiscountsForm listingId={listingId} />
  <button onClick={nextStep}>Skip or Continue</button>
</Step>

<Step title="Addons">
  <AddonsForm listingId={listingId} />
  <button onClick={publishListing}>Skip or Publish</button>
</Step>
```

3. **Add "Edit" link** in manage listings page:
```tsx
<Link href={`/host/listings/manage/${listingId}/discounts-addons`}>
  Edit Discounts & Addons
</Link>
```

## 🎨 Component Props

### DiscountsForm
```tsx
interface DiscountsFormProps {
  listingId: number;
  onSave?: () => void;  // Optional callback after save
}
```

### AddonsForm
```tsx
interface AddonsFormProps {
  listingId: number;
  onSave?: () => void;  // Optional callback after save
}
```

## 💾 Data Flow

### Creating a Discount
```
User toggles discount → Sets percentage → Clicks Save
  ↓
API POST /discounts
  ↓
Supabase inserts into listing_discounts
  ↓
Component reloads data
  ↓
Toast success notification
```

### Adding an Addon
```
User selects addon → Fills form (price, includes, timing)
  ↓
Clicks "Add Addon"
  ↓
API POST /addons
  ↓
Supabase inserts into listing_addons
  ↓
Component reloads and removes form
  ↓
Toast success notification
```

## ✨ Key Features

1. **Real-time validation**:
   - Discount percent: 0-100
   - Price: non-negative
   - Required fields: includes (for addons)

2. **Optimistic UI**:
   - Changes reflected immediately
   - Toast notifications for feedback

3. **Error handling**:
   - Validation errors shown to user
   - Network errors handled gracefully

4. **Flexible timing**:
   - Addons can be added during creation
   - Can be edited anytime post-publication
   - Can be completely skipped

5. **User-friendly**:
   - "Optional" labels on forms
   - "Skip" options in wizard
   - Clear descriptions of each feature

## 🔄 State Management

- Components use React hooks for local state
- API calls handle server state
- Supabase real-time subscriptions available for multi-user sync (not yet integrated)

## 📝 Example Usage

### In a wizard component:
```tsx
import DiscountsForm from '@/components/features/DiscountsForm';

export default function CreateListingWizard() {
  const [step, setStep] = useState('discounts');
  const listingId = useListingId();

  if (step === 'discounts') {
    return (
      <div>
        <DiscountsForm listingId={listingId} />
        <button onClick={() => setStep('addons')}>
          Next (Skip discounts is OK)
        </button>
      </div>
    );
  }

  if (step === 'addons') {
    return (
      <div>
        <AddonsForm listingId={listingId} />
        <button onClick={publishListing}>
          Publish Listing (Skip addons is OK)
        </button>
      </div>
    );
  }
}
```

### Manage existing addons:
```tsx
// Navigate to this page from manage listings
<Link href={`/host/listings/manage/${listingId}/discounts-addons`}>
  Manage Discounts & Addons
</Link>
```

## 🐛 Testing Checklist

- [ ] Create discount and verify it appears in API
- [ ] Update discount percentage
- [ ] Toggle discount on/off
- [ ] Delete discount
- [ ] Add addon to listing
- [ ] Update addon details
- [ ] Remove addon from listing
- [ ] Navigate to manage page
- [ ] Switch between Discounts/Addons tabs
- [ ] Test error states (invalid price, missing fields)
- [ ] Test with multiple listings

## 📊 Database Tables Used

- `listing_discounts` - Stores discount rules
- `listing_addons` - Stores addon assignments
- `addons` - Master list of available addons

## 🚀 Next Steps

1. Integrate into listing creation wizard
2. Add Discounts & Addons edit link to manage listings page
3. Test all CRUD operations
4. Verify data persistence in Supabase
5. Deploy and monitor

## 📞 Support

All components have:
- Comprehensive error handling
- Console logging for debugging
- Toast notifications for user feedback
- TypeScript type safety

For issues, check:
1. Console logs in browser DevTools
2. Network tab for API responses
3. Supabase dashboard for data persistence
