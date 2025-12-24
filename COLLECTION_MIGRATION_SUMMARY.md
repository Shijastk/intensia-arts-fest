# Firebase Collection Migration: 'programs' → 'events'

## Summary
Successfully updated the entire codebase to use the **'events'** collection instead of 'programs'. The old 'programs' collection data remains intact in Firebase and is not deleted.

## Files Updated

### ✅ 1. Firestore Service (`src/services/firestore.service.ts`)
**Status:** Already Updated
- Line 215: `PROGRAMS: 'events'` - Collection constant now points to 'events'
- All CRUD operations now interact with the 'events' collection
- Function names remain the same for backward compatibility (e.g., `subscribeToPrograms`, `addProgram`, etc.)

### ✅ 2. Firestore Security Rules (`firestore.rules`)
**Status:** Already Updated
- Line 6: `match /events/{eventId}` - Security rules now protect the 'events' collection
- Read/Write permissions configured for the events collection

### ✅ 3. Clear Firebase Utility (`src/utils/clearFirebase.ts`)
**Status:** Just Updated
- Line 13: Changed from `collection(db, 'programs')` to `collection(db, 'events')`
- Now targets the 'events' collection for deletion operations
- Updated console messages to reflect 'events' terminology

### ✅ 4. Export Firebase Data Script (`scripts/exportFirebaseData.ts`)
**Status:** Just Updated
- Line 25: Changed from `collection(db, 'programs')` to `collection(db, 'events')`
- Export script now reads from the 'events' collection
- Updated console messages to reflect 'events' terminology

## Files That Don't Need Changes

### ✓ Hooks (`src/hooks/usePrograms.ts`)
- Uses the firestore service functions, which already point to 'events'
- No direct collection references

### ✓ Components
- All components use the hooks/services
- No direct Firestore collection references
- Examples:
  - `GreenRoomProgramCard.tsx`
  - `TeamLeaderPage.tsx`
  - `ResultsPage.tsx`
  - `PublicPage.tsx`

### ✓ Utilities
- `teamDataFixer.ts` - Works with Program objects, no collection references
- `statsCalculator.ts` - Works with Program objects, no collection references
- `pointsCalculator.ts` - Works with Program objects, no collection references

## Data Status

### Old Collection: 'programs'
- ✅ **Data Preserved** - All existing data remains intact
- ⚠️ No longer actively used by the application
- Can be manually deleted from Firebase Console if needed

### New Collection: 'events'
- ✅ **Now Active** - All application operations use this collection
- Ready to receive data
- Protected by updated Firestore security rules

## Next Steps

### Option 1: Copy Data from 'programs' to 'events'
If you want to migrate existing data:
1. Go to Firebase Console
2. Export 'programs' collection
3. Import into 'events' collection
OR use the Firebase Admin SDK to copy programmatically

### Option 2: Start Fresh
If you want to start with clean data:
1. The 'events' collection is ready to use
2. Add new data through the application
3. Old 'programs' data can be deleted later

### Option 3: Keep Both (Current State)
- Application uses 'events' collection
- Old 'programs' data preserved as backup
- Can manually switch back if needed

## Verification Checklist

- [x] Firestore service points to 'events' collection
- [x] Security rules protect 'events' collection
- [x] Clear utility targets 'events' collection
- [x] Export script reads from 'events' collection
- [x] All components use service layer (no direct references)
- [x] Old 'programs' data preserved

## Important Notes

1. **No Data Loss**: The old 'programs' collection data is completely safe and untouched
2. **Backward Compatibility**: Function names remain the same (e.g., `addProgram`, `updateProgram`)
3. **Type Safety**: All TypeScript types remain unchanged (Program interface)
4. **Real-time Updates**: Firestore listeners work with the new 'events' collection

## Testing Recommendations

1. ✅ Verify the application connects to 'events' collection
2. ✅ Test CRUD operations (Create, Read, Update, Delete)
3. ✅ Check real-time updates are working
4. ✅ Verify security rules are properly applied
5. ✅ Test all user roles (Admin, Green Room, Team Leader, Judges)

---

**Migration Completed:** December 24, 2025
**Status:** ✅ All files updated successfully
