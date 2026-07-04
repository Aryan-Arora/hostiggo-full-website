# iCal Integration - Code Reference

Quick reference for key code snippets and how to use the iCal integration.

## Client Usage

### Using the iCal API from React Components

```typescript
import { api } from '@/lib/api';

// Register or update a calendar feed
const response = await api.registerICalFeed({
  listingId: '123',
  icalUrl: 'https://calendar.example.com/ical/abc123.ics',
  action: 'add' // or 'update' or 'deactivate'
});
console.log(response); // { success: true, listing: {...}, icalResponse: {...} }

// Get current iCal status
const status = await api.getICalStatus('123');
console.log(status);
// {
//   listingId: 123,
//   title: "My Apartment",
//   icalUrl: "https://...",
//   isActive: true,
//   lastUpdated: "2026-07-04T12:30:00Z"
// }
```

### Using in Calendar Page Component

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function CalendarPage() {
  const [listingId, setListingId] = useState('');
  const [icalUrl, setIcalUrl] = useState('');
  const [icalStatus, setIcalStatus] = useState(null);
  const [registering, setRegistering] = useState(false);

  // Load iCal status when listing changes
  useEffect(() => {
    if (!listingId) return;
    api.getICalStatus(listingId)
      .then(setIcalStatus)
      .catch(err => console.error('Failed to load iCal status:', err));
  }, [listingId]);

  // Register a new feed
  const handleRegisterICAL = async () => {
    if (!icalUrl.trim()) {
      toast.error('Please enter an iCal URL');
      return;
    }

    setRegistering(true);
    try {
      const action = icalStatus?.isActive ? 'update' : 'add';
      await api.registerICalFeed({
        listingId,
        icalUrl: icalUrl.trim(),
        action,
      });
      toast.success('iCal feed ' + (action === 'add' ? 'registered' : 'updated') + '!');
      // Reload status
      const newStatus = await api.getICalStatus(listingId);
      setIcalStatus(newStatus);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register feed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div>
      <button onClick={handleRegisterICAL} disabled={registering}>
        {icalStatus?.isActive ? 'iCal Active' : 'Setup iCal'}
      </button>
    </div>
  );
}
```

## Server Usage

### Calling from Backend Services

```typescript
// src/lib/services/ical.ts

import {
  healthCheck,
  registerListing,
  deactivateListing,
} from '@/lib/services/ical';

// Check if service is online
const isOnline = await healthCheck();
if (!isOnline) {
  throw new Error('iCal service is offline');
}

// Register a new listing
try {
  const response = await registerListing(
    listingId,           // string | number
    icalUrl,             // string
    'add'                // "add" | "update" | "deactivate"
  );
  console.log(response); // { status: "registered", slotOffsetS: 123 }
} catch (error) {
  console.error('Registration failed:', error);
}

// Deactivate a listing
try {
  await deactivateListing(listingId);
  console.log('Deactivated successfully');
} catch (error) {
  console.error('Deactivation failed:', error);
}
```

### API Endpoint Implementation

```typescript
// src/app/api/host/calendar/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { registerListing, deactivateListing } from '@/lib/services/ical';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, icalUrl, action } = body;

    // Validate input
    if (!listingId || !['add', 'update', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Call iCal service
    const icalResponse = action === 'deactivate'
      ? await deactivateListing(listingId)
      : await registerListing(listingId, icalUrl, action);

    // Update Supabase
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .update({
        icalLink: action === 'deactivate' ? null : icalUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('listing_id', listingId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        success: true,
        listing,
        icalResponse,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
```

## Type Definitions

### iCal Service Types

```typescript
// From src/lib/services/ical.ts

interface ICalRegisterPayload {
  listingId: string | number;
  icalUrl: string;
  action: "add" | "update" | "deactivate";
}

interface ICalRegisterResponse {
  status: string;
  slotOffsetS: number;
}

interface ICalHealthResponse {
  health: string;
}

interface ICalCalendarEvent {
  date: string;           // YYYY-MM-DD
  start?: string;         // HH:MM:SS
  end?: string;           // HH:MM:SS
  uid?: string;           // Unique identifier from ICS
}

interface ICalCalendarStatus {
  listingId: number;
  icalUrl: string;
  lastSyncedAt?: string;
  lastEtag?: string;
  slotOffsetS: number;
  events?: ICalCalendarEvent[];
}
```

### API Response Types

```typescript
// POST /api/host/calendar/register response
{
  data: {
    success: true,
    listing: {
      listing_id: number,
      icalLink: string | null,
      title: string,
      updated_at: string,
    },
    icalResponse: {
      status: string,
      slotOffsetS: number,
    }
  }
}

// GET /api/host/calendar/status response
{
  data: {
    listingId: number,
    title: string,
    icalUrl: string | null,
    isActive: boolean,
    lastUpdated: string,
  }
}
```

## Supabase Schema Usage

### Listings Table

```sql
-- Columns used for iCal integration
SELECT
  listing_id,
  title,
  icalLink,           -- NEW: stores the iCal URL
  updated_at,
FROM listings
WHERE listing_id = $1;

-- Update iCal URL
UPDATE listings
SET icalLink = $1, updated_at = NOW()
WHERE listing_id = $2;

-- Deactivate iCal
UPDATE listings
SET icalLink = NULL, updated_at = NOW()
WHERE listing_id = $1;
```

### Listing Calendar Table

```sql
-- Table populated by iCal service
SELECT
  calendar_id,
  listing_id,
  date,               -- YYYY-MM-DD
  is_available,       -- false = blocked by iCal
  price,              -- 0 for blocks
FROM listing_calendar
WHERE listing_id = $1 AND date >= $2 AND date <= $3
ORDER BY date;
```

## Error Handling Examples

### Handling Service Errors

```typescript
import { registerListing } from '@/lib/services/ical';

async function registerFeed(listingId: number, url: string) {
  try {
    const result = await registerListing(listingId, url, 'add');
    console.log('Registered:', result);
    return { success: true, ...result };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('registration failed')) {
        console.error('Service error:', error.message);
        return { success: false, error: 'iCal service error' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}
```

### Toast Notifications

```typescript
import { toast } from 'sonner';

// Success cases
toast.success('iCal feed registered! Syncing will start in the next 15-minute slot.');
toast.success('iCal feed updated! Syncing will resume in the next 15-minute slot.');
toast.success('iCal feed deactivated.');

// Error cases
toast.error('Please enter a valid iCal URL');
toast.error('Failed to register with iCal service');
toast.error('Failed to update listing: [error details]');
toast.error('Listing not found');
```

## Testing

### Manual Testing with Curl

```bash
# Health check
curl https://ical-1-of1o.onrender.com/

# Register a listing (POST to local Next.js)
curl -X POST http://localhost:3000/api/host/calendar/register \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "123",
    "icalUrl": "https://calendar.google.com/calendar/ical/...",
    "action": "add"
  }'

# Get status
curl "http://localhost:3000/api/host/calendar/status?listingId=123"

# Deactivate
curl -X POST http://localhost:3000/api/host/calendar/register \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "123",
    "icalUrl": "",
    "action": "deactivate"
  }'
```

### Unit Test Example

```typescript
import { registerListing, healthCheck } from '@/lib/services/ical';

describe('iCal Service', () => {
  test('health check returns boolean', async () => {
    const result = await healthCheck();
    expect(typeof result).toBe('boolean');
  });

  test('register listing with valid URL', async () => {
    const result = await registerListing(
      '123',
      'https://example.com/ical.ics',
      'add'
    );
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('slotOffsetS');
  });

  test('deactivate listing', async () => {
    const result = await deactivateListing('123');
    expect(result).toBeDefined();
  });
});
```

## Common Patterns

### Listing Selector with iCal Status

```typescript
const [listings, setListings] = useState([]);
const [listingId, setListingId] = useState('');
const [icalStatus, setIcalStatus] = useState(null);

// When listing changes
const handleListingChange = async (newListingId: string) => {
  setListingId(newListingId);
  try {
    const status = await api.getICalStatus(newListingId);
    setIcalStatus(status);
  } catch (err) {
    setIcalStatus(null);
  }
};

return (
  <select onChange={(e) => handleListingChange(e.target.value)}>
    {listings.map(listing => (
      <option key={listing.id} value={listing.id}>
        {listing.title}
        {icalStatus?.isActive && ' (iCal Active)'}
      </option>
    ))}
  </select>
);
```

### Loading State Management

```typescript
const [icalLoading, setIcalLoading] = useState(false);
const [registering, setRegistering] = useState(false);

// Loading status
const handleRegister = async () => {
  setRegistering(true);
  try {
    await api.registerICalFeed({...});
    toast.success('Registered!');
  } finally {
    setRegistering(false);
  }
};

// Loading iCal status
useEffect(() => {
  if (!listingId) return;
  setIcalLoading(true);
  api.getICalStatus(listingId)
    .then(setIcalStatus)
    .finally(() => setIcalLoading(false));
}, [listingId]);

return (
  <button disabled={registering || icalLoading}>
    {registering ? 'Connecting...' : 'Connect Feed'}
  </button>
);
```

## Environment Variables

### Required
```env
# iCal service URL (already configured)
NEXT_PUBLIC_ICAL_SERVICE_URL="https://ical-1-of1o.onrender.com"
```

### Optional (for future enhancements)
```env
# Could add in future
ICAL_SERVICE_TIMEOUT=30000  # ms
ICAL_MAX_RETRIES=3
ICAL_RETRY_DELAY=1000       # ms
```

## Debugging

### Enable Logging

```typescript
// Add to iCal service client
console.log('[iCal] Health check:', isOnline);
console.log('[iCal] Registration for listing:', listingId);
console.log('[iCal] Response:', response);

// In API endpoint
console.log('[POST /api/host/calendar/register]', { listingId, icalUrl, action });
console.log('[iCal service response]', icalResponse);
console.log('[Supabase update]', listing);

// In React component
console.log('[host/calendar] iCal status:', icalStatus);
console.log('[host/calendar] Register success:', response);
```

### Check Service Status

```typescript
import { healthCheck } from '@/lib/services/ical';

// In browser console
const isOnline = await fetch('https://ical-1-of1o.onrender.com/')
  .then(r => r.json())
  .then(d => d.health === 'online')
  .catch(() => false);
console.log('iCal service online:', isOnline);
```

## Performance Considerations

- iCal service uses 15-minute slot scheduling to prevent DB overload
- 3-layer caching minimizes network and database hits
- Batch writes in chunks of 200 items
- No request timeout - uses service defaults

## Security Notes

- No authentication required (service is public)
- iCal URLs should be HTTPS
- Service uses Accept-Profile header for schema isolation
- Supabase RLS handles authorization

---

For more details, see:
- ICAL_INTEGRATION_NOTES.md - Full technical documentation
- ICAL_IMPLEMENTATION_GUIDE.md - Implementation and usage guide
