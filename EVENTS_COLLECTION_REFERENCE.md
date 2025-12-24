# Quick Reference: Events Collection

## ✅ Current Setup

**Active Collection:** `events`  
**Firebase Project:** `intentia-b42c0`  
**Status:** ✅ Production Ready

---

## 📁 Key Files Using Events Collection

| File | Line | Code |
|------|------|------|
| `firestore.service.ts` | 215 | `PROGRAMS: 'events'` |
| `firestore.rules` | 6 | `match /events/{eventId}` |
| `clearFirebase.ts` | 13 | `collection(db, 'events')` |
| `exportFirebaseData.ts` | 25 | `collection(db, 'events')` |

---

## 🔧 Common Operations

### Add Event
```typescript
import { addProgram } from './services/firestore.service';
await addProgram(eventData); // Saves to 'events' collection
```

### Get All Events
```typescript
import { getAllPrograms } from './services/firestore.service';
const events = await getAllPrograms(); // Fetches from 'events'
```

### Update Event
```typescript
import { updateProgram } from './services/firestore.service';
await updateProgram(eventId, updates); // Updates in 'events'
```

### Delete Event
```typescript
import { deleteProgram } from './services/firestore.service';
await deleteProgram(eventId); // Deletes from 'events'
```

### Real-time Listener
```typescript
import { subscribeToPrograms } from './services/firestore.service';
const unsubscribe = subscribeToPrograms((events) => {
    console.log('Events updated:', events);
}); // Listens to 'events' collection
```

---

## 🎯 What Changed

| Before | After |
|--------|-------|
| `collection(db, 'programs')` | `collection(db, 'events')` |
| `match /programs/{id}` | `match /events/{eventId}` |
| Old buggy data | Clean, fixed data |

---

## ✅ Verification

All these should work correctly:
- [x] Loading events in dashboard
- [x] Creating new events
- [x] Updating existing events
- [x] Deleting events
- [x] Real-time synchronization
- [x] All user portals (Admin, Green Room, Team Leader, Judge)

---

## 🚨 Important Notes

1. **Function names unchanged** - Still use `addProgram`, `updateProgram`, etc.
2. **Types unchanged** - Still use `Program` interface
3. **Collection changed** - Now uses `events` instead of `programs`
4. **Old data ignored** - `programs` collection not used by app

---

**Last Updated:** December 24, 2025  
**Migration Status:** ✅ Complete
