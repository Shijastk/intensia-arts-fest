# Intensia Arts Fest — Security Remediation (31 Oct 2026)

Follows the findings in `AUDIT_2026-10.md`. **Nothing has been deployed and no production data was read or changed.** All verification ran on local Firebase emulators under the `demo-intensia` project id.

> **Update 3 Nov 2026: free Spark plan.** The project cannot deploy Cloud Functions, so the app no longer uses them.
> - The fest admin creates staff usernames and passwords directly. Passwords are stored on the staff record as salted PBKDF2-SHA-256 hashes (`src/utils/staffPassword.ts`) and checked in the browser.
> - Staff have no Firebase login, so the database cannot tell staff from visitors. Programs, students, settings and staff are therefore **readable and writable by anyone, inside an existing fest** (an accepted trade-off). Google accounts, fest ownership, the fest list and fest deletion stay protected (`tests/database.rules.test.mjs`).
> - Images are stored as data URLs (no ImgBB key). Super Admins can be added in the Firebase Console under `/superAdmins/<uid>: true`.
> - The sections below describe the earlier Cloud Functions design.

---

## 1. Vulnerabilities fixed

| # | Vulnerability | Fix | Verified by |
|---|---|---|---|
| 1 | The live database served `/fests` (including every staff password) and `/users` to unauthenticated readers. | New least-privilege `database.rules.json`. The root denies everything; every path grants by role. | rules tests 1, 2, 9 |
| 2 | Staff passwords were stored in plaintext and compared in the browser. | The `staffLogin` Cloud Function verifies bcrypt hashes (cost 10) stored in `/staffSecrets`, which no client can read. It issues a Firebase custom token, and plaintext is removed on migration. | functions e2e 1–2, rules test 2 |
| 3 | There was no brute-force protection. | Accounts lock for 15 minutes after 10 failed attempts. The error message is the same for an unknown user and a wrong password. | functions e2e 3 |
| 4 | `admin` / `admin` login bypass in `App.tsx`. | Removed. | grep: 0 occurrences |
| 5 | The session was read from localStorage, so editing `role` or `festId` granted admin access. | The session is now built only from the verified Firebase token plus database records (`authService.resolveSession`). localStorage is never read for authorization. | rules tests 6–7; grep |
| 6 | Super Admin used a hardcoded passkey plus a sessionStorage flag (`supreme_admin_auth`). | Google sign-in plus a `superAdmin` **custom claim**. The claim is set only from the command line with Admin SDK credentials, and the rules check it on every request. The passkey, the email allow-list and the flag are gone. | rules tests 2, 10; grep: 0 occurrences |
| 7 | Fest admins could open other fests by changing the URL. | The rules confine every role to its own fest. The `/fests/:festId/dashboard` route also redirects to the user's own fest. | rules test 3 |
| 8 | Judges and green room had full write access, and roles came from client data. | Role, panel, team and disabled status are re-read from the database by the rules (token claims only identify the account). Judges can score only their own panel and cannot change names or codes. Green room can manage codes and allocation but cannot change scores, publish, or reorder results. | rules tests 4, 5 |
| 9 | Unpublished scores were publicly readable. | A `mirrorPublicProgram` trigger keeps a copy without unpublished scores or code letters at `/publicFests`. Public pages and team leaders read only that copy. | rules test 8, functions e2e 5 |
| 10 | Team leaders overwrote whole `teams` arrays (lost updates, score tampering). | The `teamLeaderUpdateTeam` function changes only the caller's own team, inside a transaction. It can add participants or flag removal requests; it never deletes anyone and keeps existing codes and scores. | functions e2e 5 |
| 11 | Clients could create, edit or escalate staff, including making themselves `ADMIN`. | The `manageStaff` function is admin-only. Only the fest owner or the Super Admin can create or modify `ADMIN` staff, nobody can change their own account, and usernames must be unique within a fest. | functions e2e 4, rules test 2 |
| 12 | The ImgBB API key was shipped in the JS bundle and committed in `.env`. | Uploads go through the admin-only `uploadImage` function, which reads the key from Secret Manager. | bundle grep: 0 occurrences |
| 13 | `.env`, `accounts.json` and `db_users.json` (personal data) were tracked by git. | Untracked with `git rm --cached` and added to `.gitignore`, along with other export and service-account patterns. History still needs cleaning (§8). | `git status` |
| 14 | "Seed Defaults" created accounts with guessable passwords, including an ADMIN. | Seeded accounts now get random 10-character passwords, shown once. The staff list no longer shows passwords. | code review |
| 15 | Anonymous Auth was used for staff and Super Admin sessions. | No longer used. Legacy anonymous sessions are signed out. | grep: 0 occurrences |
| 16 | Deactivated convenors (`users/{uid}/isActive=false`) kept database access. | The rules deny deactivated owners, and only the Super Admin can change `isActive`. | rules test 6–7 |
| 17 | A new fest could overwrite an existing one (4-digit id collision). | The rules allow creating a fest only if it doesn't already exist, and only with the caller as `adminUid`. | rules test 6–7 |
| 18 | Green room could use the "Fix Missing Orders" admin tool. | The button is shown only to admins, and the rules reject it for green room. | rules test 5 |

## 2. Files

**New**
- `database.rules.json` — the deployable rules, generated.
- `firebase/build-rules.mjs` — the readable source for the rules, with role helpers.
- `firebase.json`, `.firebaserc` — project `gen-lang-client-0732239431`.
- `functions/` — `package.json`, `tsconfig.json`, `src/index.ts`, `src/common.ts`, `src/staff.ts`, `src/programs.ts`, `scripts/set-super-admin.mjs`.
- `tests/database.rules.test.mjs`, `tests/functions.e2e.test.mjs`.
- `src/services/sessionFlags.ts`, `.env.example`, `SECURITY.md`.

**Modified**
- `App.tsx`
- `src/config/firebase.ts`, `src/types.ts`
- Services: `src/services/authService.ts`, `programService.ts`, `staffService.ts`, `imageUploadService.ts`
- Hooks: `src/hooks/usePrograms.ts`, `useStaffs.ts`
- Pages: `src/pages/SuperAdminPage.tsx`, `AdminPage.tsx`, `GreenRoomPage.tsx`, `PublishingPage.tsx`, `LoginPage.tsx`
- `src/layouts/DashboardLayout.tsx`
- Components: `src/components/ProgramAccordion.tsx`, `StaffCredentialModal.tsx`
- `.gitignore`, `package.json`, `package-lock.json`

**Untracked (still on disk)**
- `.env`, `accounts.json`, `db_users.json`

## 3. Database rules

The complete rules are in `database.rules.json` (generated, about 38 KB, because RTDB rules have no functions). Read and edit `firebase/build-rules.mjs` instead, then run `npm run build:rules`.

| Path | Read | Write |
|---|---|---|
| `/` | nobody | nobody |
| `users` (list) | Super Admin | — |
| `users/$uid` | the user themself | The user (Google sign-in) and the Super Admin. `role` must be `admin`; `festId` must be a fest the user owns; `isActive` can be changed only by the Super Admin. |
| `fests` (list) | Super Admin | — |
| `fests/$f` | — | Super Admin; any Google user may *create* a new fest they own. |
| `fests/$f/settings` | public | fest admin |
| `fests/$f/name`, `adminUid`, `createdAt` | fest members | admin (`adminUid` cannot be changed) |
| `fests/$f/students` | fest members | fest admin |
| `fests/$f/staff` | fest admin, green room | nobody (functions only); profiles cannot contain `password` |
| `fests/$f/staff/$s` | that staff member | — |
| `fests/$f/programs` | fest admin, green room | fest admin |
| `fests/$f/programs/$p` | the judge of that panel | Per field: judges may write `teams` / scores, `status`, and `isPublished=false`. Green room may write `teams` / codes, `status`, `isAllocatedToJudge`, `judgePanel`. Names, chest numbers and team names can be changed only by the admin. |
| `publicFests/$f` | public | nobody (function only) |
| `staffSecrets` | nobody | nobody (Admin SDK only) |

"Fest admin" means one of:
- the Super Admin claim,
- the active Google owner (`adminUid`),
- an active staff account with role `ADMIN`.

## 4. Cloud Functions (`functions/src`)

All functions run in region `asia-southeast1` on Node 22 (`firebase-functions` v6, `firebase-admin` v13, `bcryptjs`).

| Function | Who may call it | Purpose |
|---|---|---|
| `staffLogin` | anyone | Verifies credentials against bcrypt hashes and migrates legacy plaintext. Applies the lockout and returns a custom token with claims `{festId, staffId, username, displayName}`. |
| `manageStaff` | fest admin | Create, update or delete staff. Hashes passwords; a blank password on edit keeps the current one. |
| `teamLeaderUpdateTeam` | team leader | Updates the caller's own team only, in a transaction. |
| `uploadImage` | fest admin | Uploads to ImgBB with the secret `IMGBB_API_KEY`. |
| `mirrorPublicProgram` | database trigger | Keeps `/publicFests/{f}/programs/{p}` in sync without unpublished scores or codes. |
| `migrateSecurity` | Super Admin | Hashes every remaining plaintext password, deletes the plaintext and rebuilds the public copy. Safe to re-run; supports `{dryRun:true}`. |

`functions/scripts/set-super-admin.mjs` grants or revokes the `superAdmin` claim. It runs locally with your own Google Cloud credentials.

## 5. Password migration (no account breaks)

1. Deploy the functions first, while the old rules are still live. From then on, every staff login through the new client verifies the old plaintext once, stores a bcrypt hash and deletes the plaintext. Staff keep their current passwords.
2. The Super Admin clicks **Run Security Migration** on `/supreme-admin`. This hashes all remaining plaintext passwords at once and builds `/publicFests`.
3. Deploy the new client, then deploy the rules.
4. Re-running the migration is harmless. `manageStaff` updates also hash any legacy password before removing it.

Staff who are logged in with the old app will be signed out once and must log in again with the same credentials. Admins cannot see existing passwords any more; they can set a new one by editing the account.

## 6. Firebase Console steps (manual)

Do these in this order. Back up the current rules first: Realtime Database → Rules → copy them somewhere safe.

1. **Billing:** switch the project to the Blaze plan. Cloud Functions and Secret Manager require it.
2. **Rotate the ImgBB key** at imgbb.com (§8), then store the new key as a secret:
   ```bash
   npx firebase functions:secrets:set IMGBB_API_KEY
   ```
3. **Deploy the functions:**
   ```bash
   npx firebase deploy --only functions
   ```
4. **IAM:** in Google Cloud Console → IAM, give the functions' runtime service account the role **Service Account Token Creator** on itself. This is usually `<project-number>-compute@developer.gserviceaccount.com`, and `createCustomToken` needs the role to sign tokens. If staff login returns an `internal` error after deploying, this step is the likely cause.
5. **Super Admins:** each person signs in once with Google on the site. Then run this for each, from `functions/`, after `gcloud auth application-default login`:
   ```bash
   node scripts/set-super-admin.mjs --project gen-lang-client-0732239431 --email <their email>
   ```
6. **Run the migration:** sign in at `/supreme-admin` → **Run Security Migration**.
7. **Deploy the new website build**, using your existing hosting for festloom.com.
8. **Deploy the rules:**
   ```bash
   npx firebase deploy --only database
   ```
   Then confirm from any terminal: `curl "<databaseURL>/fests.json"` must return `Permission denied`.
9. **Authentication → Sign-in method:** keep Google enabled and **disable Anonymous**, which is no longer used. Optionally delete the leftover anonymous users under Authentication → Users.
10. **Recommended:**
    - Google Cloud Console → APIs & Services → Credentials: restrict the browser API key with HTTP referrers (your domains plus `*.firebaseapp.com`).
    - Enable **App Check** (reCAPTCHA Enterprise) for the Realtime Database and Functions.

## 7. Environment variables and secrets (names only)

| Name | Where | Notes |
|---|---|---|
| `IMGBB_API_KEY` | Firebase Secret Manager (functions) | Required. For the emulator, use `functions/.secret.local` (git-ignored) with a placeholder value. |
| `VITE_USE_FIREBASE_EMULATORS` | client, optional | Set to `true` (e.g. in a git-ignored `.env.emulator`, used with `--mode emulator`) to point the app at the local emulators and the isolated `demo-intensia` project. |
| `GOOGLE_APPLICATION_CREDENTIALS` | your machine, optional | Only for `set-super-admin.mjs` if you don't use `gcloud` ADC. Keep the key file outside the repo. |
| ~~`VITE_IMGBB_API_KEY`~~ | removed | Must not be reintroduced; anything in a `VITE_*` variable is public. |
| ~~`VITE_FIREBASE_*`~~ | unused | The web config lives in `src/config/firebase.ts` and is public by design. |

## 8. Git cleanup and key rotation

**Rotate (removing a key from git does not revoke it):**
- **ImgBB API key: rotate now.** It is in git history *and* in the deployed JavaScript bundle.
- **Firebase Web API key:** not a secret. Restrict it as in §6 step 10; rotation is optional.
- **Old Supreme Admin passkey:** it is in git history. It no longer grants anything; don't reuse it anywhere.
- **Staff passwords:** they were publicly readable. Ask admins to reset passwords for important accounts (judges, `ADMIN` staff) after the migration.

**History cleanup.** This rewrites history and needs a force-push, so it has **not** been run. Do it only after everyone has pushed their work. Collaborators must re-clone afterwards.
```bash
pip install git-filter-repo
git clone --mirror https://github.com/Shijastk/intensia-arts-fest.git cleanup.git
cd cleanup.git
git filter-repo --invert-paths --path .env --path accounts.json --path db_users.json
git push --force --mirror
```
Afterwards:
- Delete any forks or caches you control.
- Ask GitHub Support to purge cached views if the repository is or was public.
- Delete or move the local copies of `accounts.json` and `db_users.json` (they are only untracked, not deleted).

## 9. Security test results (local emulators, project `demo-intensia`)

Rules tests: 9 groups and 85 assertion statements (several run once per role in loops), **all passed**. Run with `npm run test:rules`.

| # | Requirement | Result |
|---|---|---|
| 1 | Unauthenticated users cannot read `/fests`, `/users`, staff, programs, students or secrets; public results and settings stay readable. | pass |
| 2 | Password hashes cannot be read by anyone, including Super Admin; profiles cannot store passwords; clients cannot create or escalate staff. | pass |
| 3 | Staff and fest owners cannot read or write another fest. | pass |
| 4 | Judges cannot change settings, publish, rename, change codes, list staff, or read or score another panel; extra token claims are ignored. | pass |
| 5 | Green room cannot change settings, students, scores, publishing or ordering. | pass |
| 6–7 | Forged roles or `festId`, hijacking a fest, self-reactivation, self-promotion, anonymous "owners" and disabled staff are all rejected. | pass |
| 8 | Unpublished scores are hidden from team leaders and the public; public results stay readable. | pass |
| 9 | Unauthorized writes are rejected, including writes to `/publicFests` by the Super Admin. | pass |
| 10 | Owner, co-admin, judge, green room, new convenor and Super Admin workflows all succeed. | pass |

Functions end-to-end tests: 5 tests, **all passed**. Run with `npm run test:functions`.
- Generic login errors; disabled accounts rejected.
- Legacy plaintext login works once and is migrated to bcrypt; the plaintext is deleted; usernames match case-insensitively; the role is not trusted from the token.
- Lockout after 10 failures.
- Only the admin can manage staff or upload; no password is stored in profiles; duplicate usernames are rejected; the admin cannot touch another fest.
- Team leaders change only their own team, existing scores and codes are preserved, and the public copy has scores and codes removed.

Also checked:
- `vite build` succeeds.
- `tsc` shows only the pre-existing `Hero.tsx` error.
- The production bundle contains neither the ImgBB key nor the old passkey.

### Manual UI test (local emulators, 31 Oct 2026)

The real app ran against the emulators (`npm run emulators`, `npm run emulators:rules`, `npm run dev -- --mode emulator`), with every role driven through the UI.

| Role | What was exercised | Result |
|---|---|---|
| New convenor (Google) | Sign in → create fest → dashboard; add 2 events; "Seed Defaults" (random passwords shown once; the list shows `••••••`); "Send to GR". | pass |
| Team leader | Wrong password shows "Invalid username or password"; login with `TeamA` (capitalised) works; add a candidate (via function); request removal (via function). Data loads from the public copy. | pass |
| Green room | Judge panels load; the "Fix Missing Orders" button is hidden; reveal a code; push to the Stage 1 judges. | pass |
| Judge (other panel) | Stage 2 judge sees no programs. | pass |
| Judge (own panel) | Stage 1 judge opens the program, enters a score and grade, and submits ("Scores submitted successfully"). | pass |
| Super Admin | Google sign-in with the claim → user/fest list → Run Security Migration (1 legacy password hashed, plaintext removed, old password still logs in) → enter fest → publish result. | pass |
| Public (logged out) | Home, Results (shows the published score) and Schedule pages load from the public copy. | pass |

Tampering checks, made from inside real sessions:
- **Team leader:** private programs, the staff list, all fests, users, settings writes, score writes, making itself ADMIN, and `staffSecrets` were all rejected.
- **Green room:** score, publish and order writes, settings, `staffSecrets` and users were all rejected.
- **Stage 2 judge:** reading or scoring the Stage 1 program was rejected.
- **Normal convenor:** users, all fests, another fest, `staffSecrets`, `migrateSecurity`, and `manageStaff` on another fest were all rejected.
- **Forged browser data:** setting `Intensia_current_user` to an admin with `isSuperAdmin`, plus `supreme_admin_auth=true`, then reloading changed nothing; the team-leader portal stayed in place.
- **URL tampering:** opening `/fests/<other-fest>/dashboard` redirected back to the user's own fest.

Not covered:
- The real Google pop-up and the real ImgBB upload. The browser pane can't open pop-ups, and the emulator has no real ImgBB key; the upload function's permission check was tested.
- Production deployment.

## 10. Remaining risks and manual actions

1. Everything in §6 and §8: deploying, IAM, Super Admin claims, key rotation, history purge, disabling Anonymous. **None of this is done yet.**
2. **Deletions inside `teams` arrays by judges or green room.** RTDB `.validate` doesn't run on deletes, so a judge or green-room user could remove a participant entry from a program they can write. Moving judge and green-room writes into functions, as was done for team leaders, would close this gap.
3. **Lost updates on whole-array writes** by admins, judges and green room still exist (a data-integrity issue, not an access issue). Same remedy as item 2.
4. **No IP rate limiting.** Per-account lockout exists, but there is no per-IP limit; App Check is recommended.
5. **Any Google account can create a new fest.** This is the existing product design. Deactivation by the Super Admin is enforced.
6. **Fest settings and backgrounds are public**, because the public pages need them. Don't store private data in `settings`.
7. **Admin scripts write directly.** `scripts/injectFirebaseData.ts` and `scripts/migrateOrders.ts` use the client SDK and will now be denied by the rules, which is intended. Run such maintenance with the Admin SDK instead.
8. **Super Admin claim changes take up to one hour** to reach existing sessions unless the user signs out and back in. The script revokes refresh tokens to speed this up.
