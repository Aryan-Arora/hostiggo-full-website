# Debugging Guide: About Section Not Fetching

## Problem
The about section is not being displayed on the host account page at `/host/account`.

## Root Cause Analysis

The issue could be at any point in this flow:

```
1. Database → about column has data
2. API fetches → SELECT about from host table
3. API returns → JSON response includes about
4. Frontend receives → Data is in response
5. Frontend displays → about content shows
```

## Debug Steps

### Step 1: Check Browser Console Logs
Open your browser's Developer Tools (F12) and look for:

```
[host/account] Received profile data: {
  name: "...",
  email: "...",
  about: "..." ← Should see the about text here
}
```

**If you see the about content in the console**, the problem is in the UI rendering.  
**If you don't see about**, the problem is in the API or database.

---

### Step 2: Check Server Logs
Look for logs on the server side:

```
[profile-info] Host data: {
  host_uuid: "...",
  about: "..." ← Should show the about content
  is_verified: true/false
}
```

**If about is `null` or missing**, the column might not exist or data isn't saved.  
**If about has content**, data is reaching the frontend but not displaying.

---

### Step 3: Verify Database Column

Run this SQL query:

```sql
-- Check if about column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'hostiggo_testing_schema' 
AND table_name = 'host' 
AND column_name = 'about';

-- Should return:
-- column_name | data_type
-- about       | text
```

If nothing is returned, the migration wasn't applied.

---

### Step 4: Check Host Record Has Data

```sql
-- Check if a host record has about content
SELECT host_uuid, user_id, about 
FROM hostiggo_testing_schema.host 
LIMIT 5;

-- Look for your test user's about field
-- If it's NULL for all rows, no one has set it yet
```

---

### Step 5: Check API Response

Open browser DevTools → Network tab → find the `/api/host/profile-info?userId=...` request

Click on it and check the Response tab. It should look like:

```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "about": "My bio here",
    "stats": {...}
  }
}
```

**If about is empty `""`, it's because the database has NULL and we're returning `host.about || ""`**

---

## Common Issues & Fixes

### Issue 1: Migration Not Applied
**Symptom**: Database column doesn't exist
**Fix**: Run the migration SQL:
```sql
ALTER TABLE hostiggo_testing_schema.host
ADD COLUMN about text DEFAULT NULL;
```

### Issue 2: Host Record Doesn't Exist
**Symptom**: Getting 404 "Host profile not found"
**Fix**: Ensure user has clicked "Host & Earn" to create host profile

### Issue 3: About Field Returns Empty
**Symptom**: Console shows `about: ""`
**Fix**: This is normal if no one has edited their about section yet. Try editing it:
1. Go to `/host/account`
2. Click the pencil icon next to "About"
3. Type something
4. Click Save
5. Verify it appears

### Issue 4: Frontend Not Displaying About
**Symptom**: Console shows about has content but UI is blank
**Fix**: Check the rendering in the component (lines 160-185 in host/account/page.tsx)

---

## Testing Checklist

- [ ] **Database**: Run the migration if not done
- [ ] **Console**: Check browser console for received data
- [ ] **Server Logs**: Check server logs for about data
- [ ] **SQL Query**: Verify column exists and has data
- [ ] **API Response**: Check `/api/host/profile-info` in Network tab
- [ ] **UI Rendering**: Verify about section displays in component
- [ ] **Edit & Save**: Try editing about section and verify it persists

---

## Console Commands for Quick Testing

In browser console:
```javascript
// Fetch profile data directly
fetch('/api/host/profile-info?userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(d => console.log('Profile data:', d.data))

// Example:
fetch('/api/host/profile-info?userId=a1e587bc-0fc9-454e-90c8-bc0d22ee5330')
  .then(r => r.json())
  .then(d => console.log('Profile data:', d.data))
```

---

## Log Locations

**Frontend logs**: Browser DevTools → Console tab  
**Server logs**: Terminal/console where `npm run dev` is running

Look for lines starting with:
- `[host/account]` - Frontend
- `[profile-info]` - Backend API

---

## Next Steps if Issue Persists

1. Check exact error messages in logs
2. Verify userId is correct (from URL or console)
3. Confirm host record exists for that user
4. Try adding sample data manually via SQL
5. Check Supabase dashboard for any RLS (Row Level Security) restrictions
