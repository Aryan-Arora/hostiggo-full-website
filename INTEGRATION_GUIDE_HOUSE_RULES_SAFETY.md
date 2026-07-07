# Integration Guide: House Rules and Safety Details

This guide explains how the house rules and safety details features are integrated into the listing creation flow.

## Feature Overview

### House Rules
- Custom rules that hosts can add to guide guest behavior
- Examples: "No smoking", "No pets", "Check-in after 2 PM"
- Hosts can add, edit, and delete rules
- Quick-add buttons for common rules
- Works the same way as addons and discounts

### Safety Details
- Predefined safety features managed by admins
- Examples: "Security cameras", "Fire extinguisher", "Smoke alarm"
- Hosts toggle features on/off based on what their property has
- Built to display trust-building safety information to guests
- Similar UI pattern to amenities

## Integration Points

### 1. Listing Creation Flow (Wizard)

**Route**: `/host/list/house-rules`
- Step 8 in the 9-step wizard
- Shows basic rule toggles and time inputs during draft
- When editing existing listing, shows full HouseRulesForm and SafetyDetailsForm

**Flow**:
```
Property Type → Location → Details → Capacity → Amenities → Photos → Pricing → House Rules & Safety → Verification
```

### 2. Listing Management

**Route**: `/host/listings/manage?id=[listingId]`
- Can edit house rules and safety details from listing management dashboard
- Same components (HouseRulesForm, SafetyDetailsForm) are used
- Changes save immediately

### 3. API Endpoints

#### House Rules APIs
```
GET    /api/host/listings/[listingId]/house-rules
POST   /api/host/listings/[listingId]/house-rules
PATCH  /api/host/listings/[listingId]/house-rules/[id]
DELETE /api/host/listings/[listingId]/house-rules/[id]
```

#### Safety Details APIs
```
GET    /api/host/listings/[listingId]/safety-details
POST   /api/host/listings/[listingId]/safety-details
PATCH  /api/host/listings/[listingId]/safety-details/[id]
DELETE /api/host/listings/[listingId]/safety-details/[id]
```

## File Structure

### Services
- `src/lib/services/house-rules.ts` - House rules business logic
- `src/lib/services/safety-details.ts` - Safety details business logic

### API Routes
- `src/app/api/host/listings/[listingId]/house-rules/route.ts`
- `src/app/api/host/listings/[listingId]/house-rules/[id]/route.ts`
- `src/app/api/host/listings/[listingId]/safety-details/route.ts`
- `src/app/api/host/listings/[listingId]/safety-details/[id]/route.ts`

### Frontend Components
- `src/components/features/HouseRulesForm.tsx` - Full-featured house rules form
- `src/components/features/SafetyDetailsForm.tsx` - Full-featured safety details form
- `src/app/host/list/house-rules/page.tsx` - Wizard page (updated)

## Component API

### HouseRulesForm Props
```typescript
interface HouseRulesFormProps {
  listingId: number;        // Required: ID of the listing
  onSave?: () => void;      // Optional: callback after save
}
```

**Features**:
- Load existing rules on mount
- Quick-add common rules
- Add new custom rules
- Edit existing rules
- Delete rules
- Shows loading and saving states

### SafetyDetailsForm Props
```typescript
interface SafetyDetailsFormProps {
  listingId: number;        // Required: ID of the listing
  onSave?: () => void;      // Optional: callback after save
}
```

**Features**:
- Load all available safety features
- Load selected features for listing
- Toggle features on/off
- Shows selected features summary
- Shows loading and saving states

## Usage Examples

### In a Listing Management Page

```typescript
import HouseRulesForm from '@/components/features/HouseRulesForm';
import SafetyDetailsForm from '@/components/features/SafetyDetailsForm';

export default function ManageListingPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <HouseRulesForm listingId={123} />
      <SafetyDetailsForm listingId={123} />
    </div>
  );
}
```

### In a Sidebar Panel

```typescript
<HouseRulesForm 
  listingId={listingId} 
  onSave={() => {
    // Refresh listing data or notify parent
    toast.success('Rules updated!');
  }}
/>
```

## Data Flow

### Adding a House Rule

```
User clicks "Add" 
  → HouseRulesForm.addRule() 
  → POST /api/host/listings/[listingId]/house-rules 
  → houseRulesService.addHouseRule()
  → supabase INSERT
  → Response with new rule
  → Form reloads rules
  → Toast notification
```

### Toggling a Safety Feature

```
User checks checkbox 
  → SafetyDetailsForm.addSafetyFeature()
  → POST /api/host/listings/[listingId]/safety-details
  → safetyDetailsService.addSafetyDetailToListing()
  → supabase INSERT
  → Response with detail
  → Form reloads safety details
  → Toast notification
```

## Common Patterns (Same as Addons/Discounts)

1. **Service Layer**: All DB operations go through service functions
2. **API Routes**: Standard REST endpoints with proper error handling
3. **Client-Side State**: React hooks for loading/saving state
4. **Toast Notifications**: User feedback via sonner toast
5. **Optimistic Updates**: Form reloads data after every operation

## Integration with Existing Features

### Listing Creation Wizard
- House rules form is shown after pricing step
- During draft, shows basic toggles
- After listing is created, shows full forms

### Listing Management Dashboard
- Users can edit rules and safety details from manage page
- Same components work in both wizard and management contexts

### API Pattern Consistency
- Follows same REST conventions as discounts/addons
- Uses same error handling patterns
- Same authentication/authorization as other host endpoints

## Database Initialization

When a new listing is created, you may want to automatically initialize safety details:

```typescript
// After listing creation, optionally call:
export async function initializeListingSafetyDetails(listingId: number): Promise<void> {
  const features = await getAllSafetyFeatures();
  // Create disabled entries for all features
  for (const feature of features) {
    await addSafetyDetailToListing(listingId, feature.feature_id);
    await toggleSafetyDetail(/* detailId */, false);
  }
}
```

Or hosts can selectively add only the features they have.

## Security Considerations

1. **Authentication**: All endpoints require valid auth token (via auth.uid())
2. **Authorization**: Hosts can only modify rules/safety for their own listings
3. **RLS Policies**: Database policies enforce host-to-listing relationship
4. **Input Validation**: Server-side validation on all inputs
5. **Rate Limiting**: Implement rate limits on POST/PATCH/DELETE operations

## Testing Checklist

- [ ] Create house rule via form
- [ ] Edit house rule
- [ ] Delete house rule
- [ ] Toggle safety feature on/off
- [ ] Remove safety feature from listing
- [ ] All toast notifications appear
- [ ] Error handling works (network errors, validation)
- [ ] Loading states show properly
- [ ] Page reloads show persisted data
- [ ] Works in wizard flow
- [ ] Works in management page
- [ ] Mobile responsive

## Future Enhancements

1. **Bulk Actions**: Add/remove multiple rules at once
2. **Templates**: Save rule templates for quick reuse across listings
3. **Translations**: Translate safety features to multiple languages
4. **Analytics**: Track which rules are most common
5. **Guest View**: Show rules on guest-facing listing details page
6. **Notifications**: Alert guests about important rules on booking
