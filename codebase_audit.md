# 🔍 Intensia Arts Fest — Pre-Migration Codebase Audit

> **Status:** Read-only audit. No files modified.
> **Scope:** Full codebase under `c:\Users\divya\Desktop\01_Projects\intensia-arts-fest`

---

## 1. Project Architecture & Folder Structure

### Directory Layout

```
intensia-arts-fest/
├── App.tsx                  ← Root app: routing + auth + program state
├── index.tsx                ← Vite entry
├── constants.ts             ← ROOT-LEVEL (orphan — duplicate of src/constants.ts)
├── types.ts                 ← ROOT-LEVEL (orphan — duplicate of src/types.ts)
├── components/              ← ROOT-LEVEL (empty directory — orphan)
├── services/                ← ROOT-LEVEL (empty directory — orphan)
└── src/
    ├── config/
    │   └── gasConfig.ts     ✅ Clean — GAS URL + session token helpers
    ├── hooks/
    │   └── usePrograms.ts   ✅ Good — data-fetching abstraction layer
    ├── services/
    │   └── gas.service.ts   ✅ Clean — single API gateway, well-structured
    ├── types.ts             ✅ Good — shared TypeScript interfaces
    ├── constants.ts         ⚠️  Contains mock/seed data (see §3)
    ├── utils/
    │   ├── pointsCalculator.ts   ⚠️  Has bloated comments/confusion
    │   ├── statsCalculator.ts    🔴 726 lines; 247 of them are commented-out dead code
    │   └── dummy.ts              🔴 499 lines — a development scratch file with no exports used
    ├── components/
    │   ├── LiveLeaderboard.tsx         (29 KB)
    │   ├── ProgramAccordion.tsx        (34 KB — largest component)
    │   ├── ProgramList.tsx             (21 KB)
    │   ├── GreenRoomProgramCard.tsx    (17 KB)
    │   ├── ParticipantList.tsx         (13 KB)
    │   ├── GalleryUpload.tsx           (9 KB)
    │   ├── ParticipantRegistrationForm.tsx (6 KB)
    │   ├── ProgramFormModal.tsx        (7 KB)
    │   ├── NotificationModal.tsx       (4 KB)
    │   ├── MetricsCard.tsx             (< 1 KB)
    │   └── championCalculator.ts       ⚠️  A .ts util file INSIDE components/ — wrong folder
    └── pages/
        ├── AdminPage.tsx         (13 KB)
        ├── GreenRoomPage.tsx     (26 KB)
        ├── JudgesPage.tsx        (39 KB)
        ├── PublicPage.tsx        (22 KB)
        ├── ResultsPage.tsx       (10 KB)
        ├── TeamLeaderPage.tsx    (57 KB — largest file in project)
        ├── GalleryPage.tsx       (10 KB)
        ├── MaintenancePage.tsx   (4 KB)
        └── MasonryGridGallery.tsx ⚠️  A page-level component in /pages/ — not a route page
```

### Architecture Assessment

| Area | Rating | Notes |
|---|---|---|
| Service/API layer | ✅ Good | `gas.service.ts` is a clean, typed gateway |
| Config layer | ✅ Good | `gasConfig.ts` single source of truth, no hardcoded URLs |
| Hooks | ✅ Good | `usePrograms` abstracts data-fetching correctly |
| Components | ⚠️ Mixed | Good split, but `championCalculator.ts` is in wrong folder |
| Pages | ⚠️ Mixed | `TeamLeaderPage.tsx` is 57KB — too large; business logic is embedded directly in page components |
| Utils | 🔴 Bad | `dummy.ts` is an active development scratch file, `statsCalculator.ts` has 247 lines of commented-out dead code |
| Root-level orphans | 🔴 Bad | `App.tsx`, `constants.ts`, `types.ts` live at root instead of `src/` |

**Key Architecture Problems:**
- **`App.tsx` is at root, not `src/`** — unusual for a Vite project; all imports use `./src/...` paths
- **Two `constants.ts` and `types.ts` exist** — one at root (used by root App.tsx) and one inside `src/` (used by pages/components). Both are identical in content, causing confusion.
- **Business logic is NOT separated from UI** — `JudgesPage.tsx` handles score calculation, rank calculation, and Firebase/GAS syncing all inline. `TeamLeaderPage.tsx` (997 lines) combines local state, participant management, and program registration logic in one giant component.

---

## 2. Environment & Configuration Management

### ✅ No Hardcoded API Keys or URLs

The config is properly managed:
- **GAS URL:** Stored exclusively in `localStorage` via `gasConfig.ts` — never hardcoded in source
- **Session Token:** Also in `localStorage` via `gasConfig.ts`
- **No `.env` file** — but none is needed since the URL is user-configured at runtime (by design)

### ⚠️ Hardcoded Credentials in Source Code

The biggest security concern in the codebase:

```ts
// App.tsx — Lines 28–40
const USERS: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Administrator' },
  { username: 'greenroom', password: 'green123', role: 'greenroom', ... },
  { username: 'judge1', password: 'judge123', role: 'judge', ... },
  { username: 'ahsani', password: 'ahsani', role: 'judge', judgePanel: 'Ahsani Usthad' },
  { username: 'ajmal', password: 'ajmal', role: 'judge', judgePanel: 'Ajmal Usthad' },
  { username: 'suhail', password: 'suhail', role: 'judge', ... },
  { username: 'MainJudge', password: 'MainJudge123', role: 'judge', ... },
  { username: 'suhail', password: 'suhail', ... }, // ← DUPLICATE ENTRY
  { username: 'SAPIENTIA', password: 'team1pass', role: 'teamleader', ... },
  { username: 'PRUDENTIA', password: 'team2pass', role: 'teamleader', ... },
  { username: 'TEST', password: 'testpassword', role: 'teamleader', ... }, // ← Test account
];
```

**Problems:**
1. Real judge names + trivial passwords are visible in source code
2. `suhail` user is duplicated (line 34 and 36) — could cause login ambiguity
3. `TEST` team with `testpassword` is a test account shipped in production
4. Authentication is **entirely client-side** — anyone can inspect the JS bundle and see all passwords
5. This USERS array should be managed by the GAS backend (auth is partially migrated — `gas.service.ts` has `login()`, `validateSession()` etc. — but the frontend still falls back to this local array)

---

## 3. Hardcoded Data Audit

### 🔴 Hardcoded Mock Programs (`src/constants.ts` / root `constants.ts`)

```ts
// src/constants.ts — Lines 4–76
export const MOCK_PROGRAMS: Program[] = [
  { id: 'p1', name: 'Classical Solo Dance', category: 'A zone stage', ... },
  { id: 'p2', name: 'Mime Act Solo', teams: [
    { teamName: 'Silent Artists', participants: [{ name: 'Charlie Chaplin Jr', chestNumber: '201' }] },
    { teamName: 'Echo Arts', participants: [{ name: 'Buster Keaton', chestNumber: '202' }] },
    ...
  ]},
  ...
];
```
**Status:** This file is defined but **not imported anywhere** in the current codebase — it's an orphaned file. Safe to delete.

### 🔴 Hardcoded Team Names in Calculator Logic

`statsCalculator.ts` and `dummy.ts` have PRUDENTIA and SAPIENTIA **hardcoded** as string literals:

```ts
// statsCalculator.ts — Line 516
const allTeams = ['PRUDENTIA', 'SAPIENTIA'];

// statsCalculator.ts — Lines 347–350
const scores: { [key: string]: number } = {
  "PRUDENTIA": 0,
  "SAPIENTIA": 0,
};
```

The leaderboard calculation **only works for exactly these two team names**. If the real team names change even slightly (e.g. different casing), the whole scoring breaks silently.

### 🔴 Hardcoded Category List (`AdminPage.tsx`)

```ts
// AdminPage.tsx — Lines 20–37
const CATEGORIES = [
  "A zone stage",
  "A zone no stage",
  "A zone general stage",
  "A zone general non stage",
  "B zone stage senior",
  "B zone stage junior",
  ...16 items total
];
```

This list is **only defined inside `AdminPage`** as a local constant — not exported or shared. If another component needs categories, it would need to duplicate this. Should be moved to a shared constants file.

### ⚠️ Hardcoded Judge Panels (App.tsx USERS array)

Judge panels (`judgePanel: 'Ahsani Usthad'`, `'Ajmal Usthad'`, `'Main stage Judge'`) are hardcoded into the USERS array. These must match exactly with whatever the GreenRoom sets as `judgePanel` on programs.

---

## 4. Functionalities & Calculation Complexity

### Core Functionalities Built

| Feature | Location | Status |
|---|---|---|
| **Authentication** | `App.tsx` USERS array + `gas.service.ts login()` | ⚠️ Dual system — local array + GAS API both exist |
| **Program/Event CRUD** | `usePrograms.ts` → `gas.service.ts` | ✅ Clean |
| **Admin Dashboard** | `AdminPage.tsx` | ✅ Working |
| **Green Room Queue** | `GreenRoomPage.tsx` | ✅ Working |
| **Code Assignment (anonymization)** | `GreenRoomPage.tsx` `assignShuffledCodes()` | ✅ Local shuffle algorithm |
| **Judge Scoring** | `JudgesPage.tsx` `handleSubmitScores()` | ✅ Working |
| **Points Calculation** | `pointsCalculator.ts` `calculatePoints()` | ⚠️ Works but has confusing/bloated comments |
| **Rank Calculation** | `JudgesPage.tsx` inline | ⚠️ Business logic inside page component |
| **Leaderboard Stats** | `statsCalculator.ts` `calculateLeaderboardStats()` | ⚠️ Works but hardcoded to 2 teams |
| **Champion Detection** | `championCalculator.ts` `getChampions()` | ✅ Clean, functional |
| **Team Leader Portal** | `TeamLeaderPage.tsx` | ⚠️ 997 lines — too large |
| **Public Portal** | `PublicPage.tsx` | ✅ Working |
| **Results Page** | `ResultsPage.tsx` | ✅ Working |
| **Gallery** | `GalleryPage.tsx` + `GalleryUpload.tsx` | ✅ GAS-backed |
| **Maintenance Mode** | `App.tsx` | ✅ Working |
| **Polling / Sync** | `usePrograms.ts` | ✅ 30-second polling |

### ⚠️ Calculation Logic Issues

#### 1. `pointsCalculator.ts` — Confusing/Dead Comments

The `calculatePoints()` function works correctly, but it has **42 lines of developer inner-monologue comments** left in production code:

```ts
// Lines 27–44:
const maxPoints = isGroup ? 10 : 5; // User said "4 point different" -> maybe scaling is wrong? 
// Wait, typical Arts: Ind=5, Group=10? Or Ind=10, Group=20?
// User complaint "calculate 4 point diffrent". 
// If I had 10/20 and they want 5/10?
// ...
// BUT the main bug is likely the STATE UPDATE not happening in ProgramAccordion (saving old points).
// I will keep this file mostly as is...
```

The **actual formula** is simple and correct:
- `maxP = isGroup ? 20 : 10`
- `sPoints = (score / 100) × (maxP / 2)` → Score contribution
- `gPoints = GRADE_POINTS[grade] × (isGroup ? 2 : 1)` → Grade contribution
- `total = round(sPoints + gPoints)`, capped at `maxP`

#### 2. `statsCalculator.ts` — 247 Lines of Commented-Out Dead Code

The entire first 247 lines of this 726-line file are **one giant commented-out function** — an older version of `calculateLeaderboardStats`. This is dead code and should be removed.

The active code (lines 248–726) is the correct implementation and is reasonably well-structured.

#### 3. `dummy.ts` — Scratch File in Production Utils

`src/utils/dummy.ts` (499 lines) is a **development analysis script**, not production utility code. It:
- Defines its own local interfaces that duplicate `src/types.ts`
- Contains a `CompetitionAnalyzer` class exported as `analyzeCompetitionResults`
- Contains a `calculateActualResults()` function with hardcoded comments about specific event scores
- Is **not imported anywhere** in the app

This is dead code that should be deleted entirely.

#### 4. `AdminPage.tsx` — References Undefined State Variable

```ts
// AdminPage.tsx — Line 124 and 160
setIsFixing(true); // Reusing loading state
...
setIsFixing(false);
```

`setIsFixing` is **never declared** in `AdminPage`. This is a runtime bug — calling this inside `handleGlobalDeleteParticipant` will throw a `ReferenceError`. The state was likely from a removed feature that wasn't fully cleaned up.

#### 5. Duplicate Type Definitions

`statsCalculator.ts` re-declares `ProgramStatus`, `Participant`, `Team`, and `Program` interfaces locally (lines 255–301) that already exist in `src/types.ts`. These are separate definitions and could diverge, causing subtle bugs.

---

## Summary: Issues Ranked by Priority

### 🔴 Critical (Bugs / Security)
1. **`setIsFixing` undefined** — `AdminPage.tsx` L124/L160 — will throw ReferenceError at runtime
2. **Plaintext passwords in source code** — `App.tsx` USERS array — security risk

### 🔴 Structural (Dead Code / Confusion)
3. **`dummy.ts`** — 499-line scratch file with no real usage — delete entirely
4. **`statsCalculator.ts`** first 247 lines — all commented-out dead code — delete
5. **Duplicate `types.ts` and `constants.ts`** at root AND in `src/` — consolidate

### ⚠️ Quality (Maintainability)
6. **Hardcoded team names** (`PRUDENTIA`, `SAPIENTIA`) in calculator logic — extract to shared constants
7. **Hardcoded CATEGORIES array** inside `AdminPage.tsx` — move to shared constants
8. **`championCalculator.ts` in `components/`** — move to `utils/`
9. **`MasonryGridGallery.tsx` in `pages/`** — move to `components/`
10. **Bloated comments in `pointsCalculator.ts`** — clean up to just the formula
11. **Duplicate `suhail` user** in USERS array — remove duplicate
12. **TEST team account** (`username: 'TEST'`) — remove from production
13. **Dual auth system** — GAS service has `login()` but App still uses local USERS array

### ℹ️ Minor
14. **`constants.ts`** (the MOCK_PROGRAMS file) — not imported anywhere — safe to delete
15. **Stale Firebase comments** in `AdminPage.tsx`, `GreenRoomPage.tsx`, `JudgesPage.tsx`, `ProgramList.tsx` — update to reflect GAS architecture
16. **`(window as any).__openAdminModal`** hack in `AdminPage.tsx` — antipattern, should use proper React callbacks
