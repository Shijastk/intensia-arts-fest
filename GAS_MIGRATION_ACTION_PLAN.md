# Arts Fest GAS Migration Action Plan

## Scope

This plan is based on:

- Blueprint reviewed from `C:\Users\divya\Downloads\arts_fest_architecture_blueprint.md`
- Current codebase review in `C:\Users\divya\Desktop\01_Projects\intensia-arts-fest`

No source-code refactor is included in this document. This is the recommended action plan for migrating the current Firebase-centered single-fest implementation to a client-owned Google Drive, Google Sheets, and Google Apps Script backend.

## Executive Summary

The current app is a React/Vite/TypeScript frontend with Firebase Firestore as the active backend. Programs, teams, participants, judging state, scores, publishing flags, and gallery records are stored as nested Firestore documents. Authentication is hardcoded in `App.tsx`, and role access is controlled by a dashboard tab switch rather than standalone role routes.

The target architecture should introduce a strict API boundary between the frontend and a Google Apps Script web app. Google Sheets should become the system of record, Google Drive should become the file/image store, and role-based data filtering must happen in GAS before data reaches the browser. Judges should never receive student names or team identities unless explicitly allowed after judging.

## Current Codebase Findings

### Firebase Coupling

- `package.json` depends on `firebase`.
- `src/config/firebase.ts` initializes Firebase app, Firestore, and Analytics.
- `src/services/firestore.service.ts` is the main persistence layer for events and gallery.
- `src/hooks/usePrograms.ts` consumes Firestore subscriptions and exposes `programs`, `addProgram`, `updateProgram`, and `deleteProgram`.
- `src/pages/PublicPage.tsx`, `src/pages/GalleryPage.tsx`, and `src/components/GalleryUpload.tsx` import gallery methods from the Firebase service.
- Scripts under `scripts/` and utility files such as `src/utils/clearFirebase.ts` are Firebase-specific.

### Auth And Routing

- `App.tsx` contains hardcoded users and passwords.
- Roles are currently `admin`, `greenroom`, `judge`, and `teamleader`.
- The blueprint target roles are `Convenor`, `Judge`, `TeamLeader` or `Student`, and `Greenroom`.
- The current `/dashboard` route renders role views through local tab state instead of dedicated routes such as `/convenor`, `/judge`, `/greenroom`, and `/student`.
- Session data is stored in `localStorage` without a backend-issued token.

### Data Shape

- The active TypeScript model stores each program with nested `teams[]`, and each team stores nested `participants[]`.
- Participant scores, grades, points, ranks, code letters, and reveal flags are embedded inside the nested participant objects.
- This shape works reasonably in Firestore but maps poorly to Google Sheets because updates often replace a whole event record instead of appending or updating normalized rows.

### Role Data Exposure

- `JudgesPage` filters programs by `judgePanel`, but it still receives the full `programs` array from the global hook.
- The judge UI uses `codeLetter` and chest number, but the frontend still has access to student names because the source data is global.
- Greenroom has legitimate access to names, chest numbers, team names, scratch codes, and judge allocation.
- Public results pages intentionally show student names for published results.

### Workflow Hotspots

- Admin creates and edits programs, publishes to greenroom, publishes results, updates status, deletes programs, fixes team data, and may edit scores.
- Team leader registers/removes participants by mutating nested `teams`.
- Greenroom assigns random code letters, reveals identities, and allocates events to judge panels.
- Judges submit scores, grades, calculated points, ranks, and mark events completed.
- Gallery currently stores image URLs in Firestore, not client-owned Drive files.

## Target Architecture

### Frontend

The frontend should become a pure client app with:

- A `gasApi` service wrapper replacing all Firestore calls.
- A role/session provider driven by GAS login responses.
- Route-level role guards.
- Role-specific data hooks that request only the data each role is allowed to see.
- Optional polling or manual refresh, since Google Sheets/GAS does not provide Firestore-style real-time subscriptions.
- Local cache for greenroom and judge workflows to reduce disruption during short network drops.

### Backend

GAS should be deployed as a web app attached to each client's copied master spreadsheet. It should:

- Own authentication and session/token validation.
- Route all actions through a single `doGet`/`doPost` dispatcher.
- Read/write normalized sheet tabs.
- Use `LockService` around writes.
- Apply role filtering before returning data.
- Keep audit logs for critical writes.
- Store uploads or file metadata in client-owned Drive folders.

### Storage

Google Sheets should store structured rows. Google Drive should store gallery files, certificate files, generated PDFs, and optional exports. Sheet rows should store Drive file IDs or public/shareable URLs, not binary data.

## Proposed Google Sheet Schema

Use one master spreadsheet per fest/client. Avoid storing the entire nested `Program` object in one cell unless it is a temporary migration bridge.

### `Settings`

| Column | Purpose |
| --- | --- |
| Key | Example: `FestName`, `MaintenanceMode`, `DriveRootFolderId`, `PublicResultsEnabled` |
| Value | Setting value |
| UpdatedAt | Last edit timestamp |
| UpdatedBy | User ID |

### `Users`

| Column | Purpose |
| --- | --- |
| UserID | Stable user ID |
| Username | Login username |
| PasswordHash | Hashed PIN/password, never plaintext |
| Role | `Convenor`, `Judge`, `TeamLeader`, `Greenroom`, `Student` |
| DisplayName | UI name |
| TeamID | For team leaders/students where applicable |
| AssignedEventIDs | Comma-separated or JSON array for judge assignments |
| AssignedPanel | Optional judge/venue panel |
| Active | Boolean |
| LastLoginAt | Timestamp |

### `Events`

| Column | Purpose |
| --- | --- |
| EventID | Stable event/program ID |
| EventName | Program name |
| Category | Category text |
| Zone | A/B/C/General derived from category |
| StartTime | Schedule |
| Venue | Venue |
| Status | `PENDING`, `GREENROOM`, `JUDGING`, `COMPLETED`, `CANCELLED` |
| IsGroup | Boolean |
| ParticipantsCount | Capacity |
| GroupCount | Optional |
| MembersPerGroup | Optional |
| IsPublishedToGreenroom | Boolean |
| IsResultPublished | Boolean |
| JudgePanel | Assigned panel |
| CreatedAt | Timestamp |
| UpdatedAt | Timestamp |

### `Teams`

| Column | Purpose |
| --- | --- |
| TeamID | Stable team ID |
| TeamName | Example: `PRUDENTIA`, `SAPIENTIA` |
| DisplayOrder | Sort order |
| Active | Boolean |

### `Participants`

| Column | Purpose |
| --- | --- |
| ParticipantID | Stable participant ID |
| ChestNo | Public/chest number |
| StudentName | Full name |
| TeamID | Owning team/institution |
| Active | Boolean |
| CreatedAt | Timestamp |
| UpdatedAt | Timestamp |

### `Registrations`

| Column | Purpose |
| --- | --- |
| RegistrationID | Stable row ID |
| EventID | Event link |
| ParticipantID | Participant link |
| ChestNo | Denormalized lookup field |
| TeamID | Denormalized lookup field |
| GroupSlot | Optional group/sub-team label |
| CodeLetter | Judge-visible anonymous code |
| IsCodeRevealed | Greenroom reveal state |
| RegisteredBy | UserID |
| RegisteredAt | Timestamp |
| Active | Boolean |

### `Marks`

| Column | Purpose |
| --- | --- |
| MarkID | Stable mark row ID |
| EventID | Event link |
| RegistrationID | Registration link |
| ChestNo | Judge-visible participant key |
| CodeLetter | Judge-visible anonymous key |
| JudgeID | UserID |
| Score | Numeric 0-100 |
| Grade | A+, A, B, C, or blank |
| Points | Calculated value |
| Rank | Final rank |
| SubmittedAt | Timestamp |
| UpdatedAt | Timestamp |

### `Results`

Optional derived/published table for public reads.

| Column | Purpose |
| --- | --- |
| EventID | Event link |
| RegistrationID | Registration link |
| ChestNo | Chest number |
| StudentName | Name allowed for public result |
| TeamName | Team display |
| Score | Optional public score |
| Grade | Optional public grade |
| Points | Public points |
| Rank | Public rank |
| PublishedAt | Timestamp |

### `Gallery`

| Column | Purpose |
| --- | --- |
| ImageID | Stable image row ID |
| DriveFileID | File ID in client Drive |
| ImageUrl | Shareable or transformed URL |
| Caption | Optional |
| UploadedBy | UserID |
| CreatedAt | Timestamp |
| Active | Boolean |

### `AuditLog`

| Column | Purpose |
| --- | --- |
| AuditID | Stable log ID |
| Timestamp | Action time |
| UserID | Actor |
| Role | Actor role |
| Action | API action |
| EntityType | Event, Registration, Mark, Gallery, User |
| EntityID | Related ID |
| BeforeJSON | Optional |
| AfterJSON | Optional |
| RequestID | Client-generated idempotency key |

## GAS API Contract

Use POST for mutations and private reads. GET can be reserved for public read-only endpoints where JSON responses work reliably. Avoid `mode: "no-cors"` because it produces opaque responses the frontend cannot parse. Prefer standard CORS-compatible GAS response patterns or `text/plain` JSON responses from POST.

### Auth

| Action | Caller | Request | Response |
| --- | --- | --- | --- |
| `login` | Public | `username`, `passwordOrPin` | `sessionToken`, `user`, `role`, `permissions` |
| `logout` | Any authenticated role | `sessionToken` | Success |
| `validateSession` | Any authenticated role | `sessionToken` | Current user and permissions |

### Convenor/Admin

| Action | Purpose |
| --- | --- |
| `getConvenorDashboard` | Full event, team, registration, result, and stats data |
| `createEvent` | Add row in `Events` |
| `updateEvent` | Patch event metadata/status/publishing fields |
| `deleteEvent` | Soft-delete or deactivate an event |
| `publishToGreenroom` | Toggle `IsPublishedToGreenroom` |
| `publishResult` | Generate/update `Results` rows and set `IsResultPublished` |
| `manageUser` | Create/update role users |
| `exportData` | Optional Drive/Sheet export |

### Team Leader / Student Registration

| Action | Purpose |
| --- | --- |
| `getTeamPortal` | Return only this team leader's team, participants, eligible events, and registrations |
| `upsertParticipant` | Create or edit a participant owned by this team |
| `registerParticipantForEvents` | Create/update rows in `Registrations` |
| `removeRegistration` | Soft-delete registration rows |
| `getStudentResult` | Return individual result by chest number or token |

### Greenroom

| Action | Purpose |
| --- | --- |
| `getGreenroomQueue` | Return published events with names, chest numbers, teams, and reveal state |
| `assignCodes` | Create deterministic/random code letters for registrations |
| `revealCode` | Mark registration or group slot as revealed |
| `allocateToJudge` | Set event status/panel and judge assignment |
| `recallFromJudge` | Return event to greenroom/pending when allowed |

### Judge

| Action | Purpose |
| --- | --- |
| `getJudgeQueue` | Return only assigned events and anonymized registrations |
| `saveDraftMarks` | Optional draft marks per judge |
| `submitMarks` | Write `Marks`, calculate points/ranks, complete event when ready |
| `getJudgeHistory` | Return completed events without hidden student data unless allowed |

### Public

| Action | Purpose |
| --- | --- |
| `getPublicHome` | Upcoming events, latest published results, latest gallery |
| `getPublishedResults` | Published public result rows |
| `getGallery` | Active gallery image metadata |
| `getLiveStatus` | Public-safe event status |

## Data Routing Rules

### Convenor

Can receive all fields, including names, chest numbers, team names, marks, audit status, and publication status.

### Greenroom

Can receive student names, chest numbers, teams, code letters, reveal state, and judge allocation fields. Can write reveal and allocation actions. Should not edit marks except through an explicit convenor-level permission.

### Judge

Must receive only:

- Event ID, name, category, venue, start time, group/individual metadata.
- Assigned panel/event data.
- Registration IDs or chest numbers.
- Code letters.
- Existing draft marks for this judge if supported.

Must not receive:

- `StudentName`
- `TeamName`
- Full participant lists outside assigned events
- Other judges' private draft marks

### Team Leader

Can receive:

- Own team participants.
- Own team registrations.
- Event capacity and eligibility metadata.
- Own published results if desired.

Cannot receive:

- Other teams' participant names before public publication.
- Judge marks before result publication.

### Student/Public

Can receive:

- Published public results.
- Individual lookup result by chest number or student token.
- No unpublished marks or private registration data.

## Frontend Refactor Plan

### Phase 1: Introduce Backend Boundary

1. Create a new API service module such as `src/services/gasApi.service.ts`.
2. Define typed request/response DTOs that match the GAS actions.
3. Store the client's GAS web app URL in a setup/config layer, not scattered throughout pages.
4. Keep `Program` compatibility adapters temporarily so existing pages can be migrated incrementally.
5. Replace Firestore subscription assumptions with `fetch`, polling, and explicit refresh states.

### Phase 2: Session And Role Provider

1. Replace hardcoded `USERS` in `App.tsx` with `login` and `validateSession`.
2. Store only backend-issued session metadata in `localStorage`.
3. Normalize frontend roles:
   - `admin` -> `Convenor`
   - `greenroom` -> `Greenroom`
   - `judge` -> `Judge`
   - `teamleader` -> `TeamLeader`
   - Add `Student` or public lookup mode
4. Add route guards based on role and permissions returned by GAS.

### Phase 3: Route Refactor

Replace the single `/dashboard` tab router with dedicated routes:

| Route | Target component |
| --- | --- |
| `/setup` | Client GAS URL and Sheet setup wizard |
| `/login` | GAS-backed login |
| `/convenor` | Current `AdminPage` after service migration |
| `/greenroom` | Current `GreenRoomPage` after service migration |
| `/judge` | Current `JudgesPage` after anonymized API migration |
| `/team` | Current `TeamLeaderPage` after team-scoped API migration |
| `/student` | Chest number/student result lookup |
| `/results` | Published public result rows |
| `/gallery` | Drive-backed gallery |

### Phase 4: Migrate Data Hooks By Role

Replace one global `usePrograms()` hook with role-specific hooks:

- `useConvenorDashboard()`
- `useGreenroomQueue()`
- `useJudgeQueue()`
- `useTeamPortal()`
- `usePublicResults()`
- `useGallery()`

Each hook should call a role-specific GAS action so hidden data is never downloaded to the wrong role.

### Phase 5: Convert Mutations From Document Patches To Actions

Current mutations often pass `updateProgram(id, { teams: updatedTeams })`. Convert those into intent-based API actions:

- `createEvent`
- `updateEvent`
- `publishToGreenroom`
- `assignCodes`
- `revealCode`
- `allocateToJudge`
- `registerParticipantForEvents`
- `removeParticipant`
- `submitMarks`
- `publishResult`
- `addGalleryImage`
- `deleteGalleryImage`

This is important because Sheets should update specific rows, not rewrite nested event blobs.

### Phase 6: Gallery And Drive

1. Replace Firestore gallery rows with `Gallery` sheet rows.
2. Decide whether greenroom uploads actual files to GAS/Drive or only pastes Drive links.
3. Store Drive file IDs and generated public URLs.
4. Add a Drive folder setup step in the client onboarding wizard.

### Phase 7: Remove Firebase

Only after every Firebase call is replaced:

1. Remove `firebase` from `package.json`.
2. Delete or archive `src/config/firebase.ts`.
3. Delete or archive `src/services/firestore.service.ts`.
4. Replace `src/utils/clearFirebase.ts` and Firebase scripts with GAS/Sheet migration tools.
5. Update README and deployment docs.

## GAS Backend Implementation Plan

### Recommended File Structure In Apps Script

- `Code.gs`: `doGet`, `doPost`, request parsing, router.
- `Config.gs`: sheet names, role constants, field mappings.
- `Auth.gs`: login, hashing, session validation.
- `Sheets.gs`: generic table read/write helpers.
- `Events.gs`: event actions.
- `Registrations.gs`: participant and registration actions.
- `Greenroom.gs`: code assignment/reveal/allocation actions.
- `Judging.gs`: judge queue, marks submission, points/rank calculations.
- `Results.gs`: publish result and public result reads.
- `Gallery.gs`: Drive/gallery actions.
- `Audit.gs`: append audit logs.

### Security Requirements

- Do not store plaintext passwords/PINs if avoidable. Use a salted hash stored in `Users`.
- Require `sessionToken` for all private actions.
- Validate role on every action in GAS, not only in React.
- Validate ownership:
  - Judge assigned event/panel.
  - Team leader assigned team.
  - Greenroom allowed queue actions only.
- Add request IDs/idempotency keys for scoring and registration writes.
- Use `LockService` for all writes that affect registrations, marks, results, or event status.

### CORS And Fetch Notes

- Do not use `fetch(..., { mode: "no-cors" })` for JSON APIs because the browser cannot read the response body.
- If Apps Script CORS limitations become painful, use one of these patterns:
  - POST form-encoded JSON payload and return JSON text.
  - Use GET for public read-only data.
  - Use a tiny static proxy only if the "100% free/client-owned" requirement allows it. Otherwise avoid this.

## Migration Strategy

### Step 1: Export Current Firebase Data

Use existing export script ideas to produce a clean JSON snapshot:

- Events/programs
- Teams
- Participants
- Registrations
- Scores/results
- Gallery

Do not mutate production data during this step.

### Step 2: Build Sheet Import Template

Create a migration script or manual import guide that maps:

- `Program` -> `Events`
- `Program.teams[].teamName` -> `Teams`
- Unique participants -> `Participants`
- Participant appearances per event -> `Registrations`
- Existing scores/ranks -> `Marks` and `Results`
- Gallery URLs -> `Gallery`

### Step 3: Build GAS In Parallel

Deploy a copied master Sheet and GAS web app for testing. Implement the GAS API first with test data and manual calls before wiring the frontend.

### Step 4: Add Frontend GAS Adapter

Create adapter functions that temporarily return the current `Program[]` shape from normalized GAS rows. This allows pages to migrate without rewriting every component at once.

### Step 5: Migrate One Role At A Time

Recommended order:

1. Public results and gallery reads.
2. Login/session validation.
3. Convenor event list read-only view.
4. Convenor event create/update/publish.
5. Team leader registration.
6. Greenroom queue/code/allocation.
7. Judge queue/mark submission with anonymized payload.
8. Result publication and student lookup.

### Step 6: Remove Compatibility Layer

Once all pages use role-scoped DTOs, remove nested `Program` compatibility where practical. Keep UI-level view models, but do not let backend rows mimic Firestore documents forever.

## Component-Level Migration Notes

### `App.tsx`

- Move user and role types to shared auth types.
- Replace hardcoded `USERS` with `login`.
- Convert dashboard tab state to route-level navigation.
- Replace global `usePrograms()` with route-specific data hooks.
- Update loading text and footer branding from Firebase to client-owned Sheets/GAS.

### `src/hooks/usePrograms.ts`

- Deprecate this hook after introducing role-specific hooks.
- If a compatibility bridge is needed, reimplement it through GAS temporarily.

### `src/services/firestore.service.ts`

- Replace with `gasApi.service.ts` and focused service modules.
- Current gallery methods should move to Drive/Gallery GAS actions.

### `src/pages/AdminPage.tsx`

- Rename conceptually to Convenor.
- Replace whole-program updates with action calls.
- Move team-fix logic into a backend action or keep it as a convenor-only batch action that writes normalized rows.

### `src/pages/TeamLeaderPage.tsx`

- Replace global program scanning with `getTeamPortal`.
- Registration submit should call backend row actions, not update `program.teams`.
- Enforce participant/program limits in GAS as the source of truth.

### `src/pages/GreenRoomPage.tsx`

- Move code assignment and reveal logic to GAS so multiple greenroom devices cannot generate conflicting codes.
- `allocateToJudge` should validate all identities/codes are ready before status changes.

### `src/pages/JudgesPage.tsx`

- Fetch only `getJudgeQueue` data.
- Do not use the global `Program[]` object.
- Submit marks through `submitMarks`.
- Keep points calculation mirrored in frontend for preview, but GAS must recalculate before saving.

### `src/components/ProgramAccordion.tsx`

- Convert inline score editing and publish controls into explicit convenor actions.
- Treat direct score edits as privileged audit-logged corrections.

### `src/pages/PublicPage.tsx` And `src/pages/ResultsPage.tsx`

- Read from public GAS endpoints or precomputed `Results` rows.
- Do not depend on private event/team structures.

### `src/components/GalleryUpload.tsx` And `src/pages/GalleryPage.tsx`

- Move from Firestore gallery rows to Drive-backed `Gallery` sheet rows.

## Testing And Validation Plan

### Unit-Level Checks

- Points calculation parity between frontend preview and GAS final calculation.
- Grade mapping.
- Rank tie behavior.
- Zone extraction.
- Registration limits.
- Group event sub-team splitting.

### API Tests

For each GAS action, test:

- Missing session.
- Wrong role.
- Valid role with wrong ownership.
- Valid request.
- Duplicate/idempotent request.
- Concurrent write scenario where relevant.

### Role Privacy Tests

Confirm returned JSON for each role:

- Judge payload contains no `StudentName` or `TeamName`.
- Team leader payload contains no other team's student names.
- Public payload contains only published results.
- Greenroom payload contains names only for queue operations.

### End-To-End Workflow

1. Convenor creates events.
2. Team leader registers participants.
3. Convenor publishes event to greenroom.
4. Greenroom assigns and reveals codes.
5. Greenroom allocates event to judge.
6. Judge submits marks.
7. GAS calculates points and ranks.
8. Convenor publishes result.
9. Public and student portals show only permitted data.

## Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Apps Script quotas | API slows/fails during heavy use | Batch reads/writes, cache read-heavy data, avoid excessive polling |
| No Firestore real-time listeners | UI updates are less instant | Use polling, manual refresh, optimistic UI with server confirmation |
| Sheet row concurrency | Lost updates | Use `LockService`, row-level actions, idempotency keys |
| Browser CORS limitations | POST responses may fail | Avoid `no-cors`; test Apps Script response pattern early |
| Data privacy leak to judges | Fairness issue | Enforce filtering in GAS, not frontend |
| Nested-to-normalized migration complexity | Bugs in registrations/results | Build import script and compare row counts/totals before cutover |
| Client setup friction | Non-technical users may struggle | Build a setup wizard and provide a copyable Sheet/GAS template |

## Deliverables Checklist

- [ ] Master Google Sheet template with required tabs.
- [ ] GAS web app router with auth/session support.
- [ ] GAS API actions for each role.
- [ ] Frontend GAS API service wrapper.
- [ ] Role/session provider.
- [ ] Route guards and dedicated role routes.
- [ ] Role-scoped data hooks.
- [ ] Sheet import/export migration script.
- [ ] Drive-backed gallery handling.
- [ ] Student result lookup.
- [ ] Privacy and workflow test suite.
- [ ] README rewritten for Google Sheets/GAS setup.
- [ ] Firebase dependency removed after parity is confirmed.

## Recommended First Implementation Sprint

1. Create the Google Sheet template and finalize column names.
2. Build GAS `login`, `validateSession`, `getPublicHome`, and `getPublishedResults`.
3. Create `gasApi.service.ts` and a setup screen for the GAS web app URL.
4. Replace only public results/gallery reads first.
5. Implement `getJudgeQueue` with anonymized data and write privacy tests before wiring judge scoring.

This order proves the GAS connection, validates CORS, and tests the most sensitive selective-routing requirement before the larger mutation-heavy workflows are moved.
