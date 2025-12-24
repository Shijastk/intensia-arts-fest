# 🔥 Deploy Firestore Rules - Instructions

## ⚠️ Important: You need to deploy the updated Firestore rules!

The verification script failed because the `programs` collection doesn't have security rules yet. I've updated the `firestore.rules` file, but you need to deploy it to Firebase.

---

## 📋 Option 1: Deploy via Firebase Console (Easiest)

### Steps:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project: `intentia-b42c0`

2. **Navigate to Firestore Rules**
   - Click on **"Firestore Database"** in the left sidebar
   - Click on the **"Rules"** tab at the top

3. **Copy the Updated Rules**
   - Open the file: `firestore.rules` in your project
   - Copy ALL the content from that file

4. **Paste and Publish**
   - Paste the rules into the Firebase Console editor
   - Click **"Publish"** button
   - Wait for confirmation (usually takes a few seconds)

---

## 📋 Option 2: Deploy via Firebase CLI

If you want to use the command line:

### Install Firebase CLI (one-time setup):
```powershell
npm install -g firebase-tools
```

### Login to Firebase:
```powershell
firebase login
```

### Initialize Firebase (one-time setup):
```powershell
firebase init firestore
```
- Select your project: `intentia-b42c0`
- Use existing `firestore.rules` file

### Deploy the Rules:
```powershell
firebase deploy --only firestore:rules
```

---

## ✅ Updated Rules Content

The `firestore.rules` file now includes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
   
    // Events collection (ACTIVE - Primary collection in use)
    match /events/{eventId} {
      allow read: if true;
      allow write: if true;
    }
   
    // Programs collection (LEGACY - Old collection, kept for backup)
    match /programs/{programId} {
      allow read: if true;   // ✅ Can read for verification
      allow write: if false; // ❌ Cannot write (read-only)
    }
   
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### What Changed:
- ✅ Added rules for `programs` collection (read-only access)
- ✅ Kept rules for `events` collection (full access)
- ✅ This allows verification scripts to read both collections

---

## 🧪 After Deploying Rules

Once you've deployed the rules, run the verification script again:

```powershell
npx tsx scripts/verifyCollections.ts
```

This should now work without permission errors!

---

## 🎯 Quick Summary

1. **Copy** the content from `firestore.rules`
2. **Paste** it in Firebase Console → Firestore Database → Rules
3. **Publish** the rules
4. **Run** the verification script

---

**Need Help?** If you encounter any issues, let me know!
