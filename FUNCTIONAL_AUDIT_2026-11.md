# Intensia Arts Fest — Functional Audit and Fixes (1 Nov 2026)

**Scope:** zones and scoring, results and totals, posters and certificates, scheduling (including mobile), dialog consistency.

**Test environment:** local Firebase emulators, isolated project `demo-intensia`, with controlled test data. **No production data was read or changed. Nothing is deployed or committed.**

---

## 1. Existing functionality discovered and reused

| Area | Existing implementation found | How it was used |
|---|---|---|
| Dialogs | `ProgramAccordion` inline alert/confirm/prompt modal; a near-copy in `AdminPage`; unused `NotificationModal`; `Toast` | `AppDialog` reuses the `ProgramAccordion` modal markup. Both inline copies now delegate to it, removing about 150 duplicated lines. `Toast` is untouched. |
| Ranking / points | `calculatePoints`, `getGradeFromScore` (`pointsCalculator.ts`); two separate rank loops (JudgesPage, ProgramAccordion) | One `rankProgramResults()` built on the existing `calculatePoints`, now used by the judge submit, admin Edit Results, removals and custom-score changes. |
| Totals | `consolidationCalc.ts` (live screens); `statsCalculator.ts`, `championCalculator.ts` (dead) | `consolidationCalc` was fixed in place. The dead calculators are documented, not deleted (§3). |
| Winners / zones | `getGroupResults`/`getIndividualResults`/`extractZone` copied in ResultsPage and GreenRoomPage; `program.zone` stored by the program form but never read | New `resultsUtils.ts` (one copy). It reads the stored `program.zone` first. |
| Schedule | `ScheduleManager` with dnd-kit, `scheduleCalculator.detectClashes`, `parseToValidDate` | Extended in place. Pure logic moved to `scheduleCalculator.ts` and `timeUtils.ts`. No rewrite. |
| Templates | `CertificateTemplate`, `PosterTemplate`, `StudentCardBatchTemplate`, `TemplateConfig`, `backgroundService` | Same components and the same database node (`settings/backgrounds`). Only optional fields were added; old configs are merged with defaults. |
| Data model | `fests/{festId}/programs`, `settings`, `staff` | No new collections or APIs. Only optional fields were added: `Settings.stages`, `backgrounds.active`, new `TemplateConfig` fields. |

## 2. Confirmed bugs, root causes and status

Legend: **FV** = fixed and verified (unit test and/or end-to-end), **F** = fixed (unit tests only).

### Scoring, zones and results

| # | Bug | Root cause | Layer | Status |
|---|---|---|---|---|
| S1 | Admin "Edit Results" ranked group programs per member: the 2nd team became rank 6 and got 0 rank points. | Separate rank loop over flattened participants (`ProgramAccordion.saveScores`). | Frontend logic | **FV**: E2E, Blue 95 / Red 90 gives Blue 1st (20 pts) and Red 2nd (16 pts). |
| S2 | Absent or unscored entries were ranked and given rank points. | Empty score became 0 and was still ranked. | Frontend logic | **FV**: E2E, the absent Green team and Gita get rank 0 and 0 points. |
| S3 | Individual General programs added nothing to team totals. | `teamScores +=` sat inside the `!isGeneral` branch (commit 41d8805). | Calculation | **FV**: E2E totals Red 46 / Blue 32 / Green 0 match the hand calculation. |
| S4 | Admin grade was free text, and score edits left a stale grade. | `<input type=text>`; no `getGradeFromScore`. | UI | **FV**: E2E, a grade select appears and the score auto-sets the grade. |
| S5 | Changing a custom point table didn't update existing results. | Points are stored at scoring time. | Integration | **F**: the program is re-ranked on save/remove (`SettingsPage`); unit-tested. |
| S6 | Crash on a COMPLETED program with no teams. | RTDB drops empty arrays. | Calculation | **F**: unit test. |
| S7 | Removing a participant during Edit Results kept stale ranks and lost unsaved edits. | Removal read `program.teams` and wrote without re-ranking. | Frontend logic | **F**: code plus the shared helper. |
| S8 | Public and Green Room results showed one winner per place on ties. | `find()` instead of `filter()`, plus `slice(0,3)`. | UI | **FV**: E2E, Asha and Bina both shown 1st, 2nd "-", Anil 3rd. |
| S9 | Green Room zone badge always showed the last zone. | Every team was added to every zone. | Calculation | **F**: unit test (`getTeamZones`). |
| S10 | Zone filter was useless: `program.zone` was ignored and "Kerala Zone" parsed as "A". | Zones were derived from category text by substring. | Calculation | **FV**: E2E, Zone A/B appear and Zone A shows only Group Song. |
| S11 | Re-saving a program silently cleared a renamed or removed zone. | The select had no option for the stored value; the field was missing when no zones existed. | UI | **F** |
| S12 | Tied team or candidate positions shown as 1, 2; Kala Prathibha had no tie-break. | `idx + 1` numbering. | UI / calculation | **FV**: E2E standings show 1, 1, 3. |

### Scheduling

| # | Bug | Root cause | Status |
|---|---|---|---|
| T1 | Two different time formats stored (local wall time vs UTC `Z`). Sorting, the public schedule, judges' and green-room time displays were wrong. | Offset trick in the cascade vs `toISOString` in the edit modal; string `localeCompare` sorts; regex hour parsing. | **FV**: E2E, mixed legacy data displays 09:00 / 10:00 / 11:00 in order; new writes are ISO (`05:45Z` = 11:15 IST). |
| T2 | Dragging re-based a whole stage on the dragged card's time. | Baseline taken from the new order. | **FV**: E2E drag, Oppana takes 09:00 and the others shift to 09:45 and 10:15. |
| T3 | Any drop rebuilt the stage back-to-back, destroying breaks and multi-day stages. | Full cascade on every drop. | **F**: unit tests (gaps and multi-day preserved, same-position no-op). |
| T4 | Same-stage overlaps never detected. | The `newVenue` argument was unused, there was an early return with no participants, and the edit modal had no check. | **FV**: E2E, "Stage overlap on Main Stage" shown; Cancel leaves the database unchanged. |
| T5 | Duration and end time drifted apart. | The modal and program form kept the old `endTime`. | **FV**: E2E, a 45-minute duration sets end 12:00. |
| T6 | Stages vanished; added stages were lost on reload. | Defaults shown only when empty; stages kept only in component state. | **FV**: E2E, Stage 2/3 stay visible; saved to `settings.stages`. |
| T7 | Batch saves were N separate writes with failures ignored. | `Promise.all(update…)`. | **FV**: one atomic multi-path write used by drag and edit in E2E. |
| T8 | Dropping into an empty stage kept the old time. | No baseline prompt. | **F**: unit test. |
| M1 | Edit/Unschedule invisible on touch, and tiny. | `opacity-0 group-hover`. | **FV**: at 375px they are visible, 30×30. |
| M2 | Touch scrolling grabbed cards. | `PointerSensor` beside `TouchSensor`. | **F**: `MouseSensor` + `TouchSensor` (no touch device available to test). |
| M3 | Stage columns wider than the phone screen; toolbar clipped; iOS zoom on inputs. | Fixed widths; text-xs inputs. | **FV**: at 375px, no horizontal page scroll, column inside its container, inputs 16px. *An extra overflow found during this test was fixed: the column is now `calc(100vw-6.5rem)`.* |

### Posters and certificates

| # | Bug | Root cause | Status |
|---|---|---|---|
| P1 | Export ignored the customised background (used the oldest upload). | `Object.keys(...)[0]` in three places. | **FV**: active background saved and used; "Used for exports" badge. |
| P2 | "Replace" deleted the saved customisation. | Saved under a new id, then deleted the old config. | **F** |
| P3 | Certificates had no layout controls; text position and colours hard-coded. | Template ignored `TemplateConfig`. | **FV**: right-align, top spacing, font and size saved, reopened and exported identically. |
| P4 | No font, size, weight, spacing, line-height or sentence controls; venue and dates hard-coded. | Not implemented. | **FV**: 7 fonts, all controls, sentence with 10 placeholders; dates edited and exported. |
| P5 | Editor, preview and download mismatch. | Separate code paths, silent background fallback, fonts not awaited, `setTimeout` timing. | **FV**: editor preview node and exported page compared at the same scale; layout, wrapping and font match. |
| P6 | PDF page was about 373×528 mm, not A4. | jsPDF px units without the px_scaling hotfix. | **FV**: MediaBox 595.28×841.89 pt (A4); 1588×2246 image. |
| P7 | Program "Print Certificates" / "Download Poster" did nothing; bulk function never called; public poster downloaded only the bare background. | Handlers wired to nothing. | **FV**: program PDF with 4 A4 pages; poster JPEG 2160×2700. |
| P8 | Certificate category showed the fest name; cancelled and pending events listed. | Wrong field mapping. | **FV**: category "Senior (Stage) / General (Stage)"; events correct. |
| P9 | Long names overflowed; tied poster winners dropped; props mutated. | Fixed `text-5xl`; `slice(0,3)`; `sort()` on props. | **FV** (ties: E2E poster shows two 1st places); long-name auto-fit unit-tested. |
| P10 | Old saved configs not merged with defaults; uploads not validated. | `initialConfig \|\| defaults`; `accept="image/*"`. | **F**: unit tests (PNG/JPEG/WebP, ≤7 MB, aspect warning). |

### Dialogs and consistency

| # | Bug | Status |
|---|---|---|
| D1 | 44 native `alert`/`confirm`/`prompt` popups. | **FV**: 0 remain; styled warning, danger, success and prompt dialogs tested, including Cancel. |
| D2 | Three separate modal implementations. | **FV**: consolidated onto `AppDialog`. |
| D3 | "Delete Program" did nothing (lost confirm modal in 39e28ff). | **FV** (earlier commit a572ac9). |

## 3. Duplicate or unnecessary implementations

- **Removed duplicates:**
  - the rank/points loop (2 copies → 1)
  - winner pickers and zone extraction (2 → 1)
  - modal markup (3 → 1)
  - time parsing, formatting and sorting (5 approaches → `timeUtils`)
  - background picking and data-URL helpers (4 → `exportService`)
  - certificate capture and PDF code (3 → `OffscreenRenderer`)
  - fest-name cleanup (2 → 1)
- **Dead code, left in place for your decision** (nothing imports it):
  - `src/utils/statsCalculator.ts` (used only by the unused `LiveLeaderboard.tsx`)
  - `src/utils/championCalculator.ts`
  - `src/components/LiveLeaderboard.tsx`
  - `src/components/NotificationModal.tsx`
  - the `TeamLeaderPage` "results" tab state, which nothing renders
- **Still duplicated:** `ParticipantList` keeps its own participant aggregation; the certificate code uses the shared helper.

## 4. Files changed in this audit

**New files**
- `src/components/ui/AppDialog.tsx`
- Utils: `src/utils/resultsUtils.ts`, `src/utils/timeUtils.ts`
- `src/services/exportService.ts`
- Generators: `src/components/generators/OffscreenRenderer.tsx`, `TemplateBackground.tsx`
- `vitest.config.ts`
- Tests: `src/utils/__tests__/scoring.test.ts`, `timeUtils.test.ts`, `scheduleCalculator.test.ts`, `src/services/__tests__/exportService.test.ts`

**Modified files**
- Utils: `pointsCalculator.ts`, `consolidationCalc.ts`, `scheduleCalculator.ts`
- Services: `programService.ts` (adds `batchUpdatePrograms`), `backgroundService.ts`, `staffService.ts`
- Pages: `JudgesPage`, `GreenRoomPage`, `ResultsPage`, `PublicPage`, `SchedulePage`, `SettingsPage`, `AdminPage`, `PublishingPage`, `SuperAdminPage`
- Components: `ProgramAccordion`, `ProgramList`, `ProgramFormModal`, `ScheduleManager`, `GreenRoomProgramCard`, `ParticipantRegistrationForm`, `ParticipantList`, `ConsolidationView`
- Generators: `CertificateTemplate`, `PosterTemplate`, `StudentCardBatchTemplate`
- Other: `layouts/DashboardLayout.tsx`, `src/types.ts`, `App.tsx`, `index.html` (fonts, `crossorigin`), `package.json` (vitest, `test:unit`)

**Backend and database:** no Cloud Function or rules changes in this audit.
- New optional fields: `settings.stages`, `settings.backgrounds.active`, extra `TemplateConfig` fields (`configVersion`, fonts, sizes, spacing, `bodyTemplate`, `festVenue`, `festDates`).
- Schedule times are now always written as ISO UTC. Old formats are still read.
- Everything is backward compatible.

## 5. Tests executed

**Automated:** `npx vitest run`, 86/86 passing.

| Suite | Tests |
|---|---|
| scoring | 16 |
| timeUtils | 18 (run under Asia/Kolkata, New York and UTC) |
| scheduleCalculator | 23 |
| exportService | 29 |

**Other checks:**
- `tsc` shows no new errors; the pre-existing `Hero.tsx` and kandiyiltraders errors remain.
- `vite build` succeeds.
- The earlier security suites (`npm run test:security`) cover the rules and functions; neither changed in this audit.

**Manual end-to-end** (emulators, real UI, test data):
1. Judge scores a group program with an absentee, then an individual program with a tie and an absentee. The stored ranks and points match the expected values.
2. Admin publishes both. Admin standings show Red 46 / Blue 32 / Green 0 with tie positions. The public results show both tied winners. The Zone A filter shows only its program.
3. Admin Edit Results re-ranks the group per team, with the grade as a select.
4. Schedule: mixed legacy times display in order. A stage clash is detected and Cancel is safe. A valid time and duration edit is stored as ISO. A mouse drag keeps the baseline. On a 375px phone, "+" appends a program consecutively. The public schedule order is correct on mobile.
5. Certificate: edit fonts, alignment, spacing and dates, save, reopen (all restored), export a single A4 PDF, and compare it with the editor preview (match). Export a program-level 4-page A4 PDF. Export the winner poster at 2160×2700 with tied winners.
6. Dialogs: warning, confirm/cancel, success and prompt all appear in the app's style; no native popups fire.

## 6. Status summary

**Working and verified:**
- Delete features (8 types)
- Judge scoring
- Absentees and ties
- Group ranking (judge and admin)
- Team totals including General programs
- Tie display
- Zone filter
- Schedule display, sort, clash detection, edit, drag and consecutive add
- Mobile schedule layout at 375px
- Certificate customisation, save/reopen, A4 export, program bulk export
- Poster export with ties
- App-styled dialogs

**Fixed, verified by unit tests only:**
- Custom-score recalculation
- Empty-team crash
- Green Room zone badge
- Removal re-ranking
- Gap and multi-day preservation
- Empty-stage drop
- Replace keeping the config
- Upload validation
- Old-config merging
- Long-name auto-fit

**Partially working / limitations:**
- Touch drag-and-drop was not tested on a real touch device; the sensor change was verified in code only.
- Background images on **ImgBB** were not tested. Exports fetch the image, so if ImgBB doesn't allow cross-origin reads the export now fails with a clear message instead of silently dropping the background. Test one upload on staging.
- Fonts in exports: verified for Montserrat with a same-origin background. Embedding for every font (Poppins comes from `@import`) was not checked one by one.
- The certificate editor preview is tiny on narrow windows (46×64px at a 532px pane width). It is usable on desktop but cramped on phones.
- There is no fest-wide "all participants" certificate button; the program-level and single-participant exports work.
- Student cards have no export path (preview only), as before.
- Per-element free positioning, resizing, layers, borders and reusable cross-fest templates are **not implemented**. The current model positions one text block, with font and colour controls.
- A+ and A award equal grade points (5/5 individual, 10/10 group). That is the existing rule; confirm it's intended.
- Group programs where one team enters several sub-teams count only the team's best sub-team. That is the existing rule.

**Not tested:**
- Production deployment
- The real Google sign-in pop-up
- Real ImgBB uploads
- Very large PDF exports for memory and size (about 190 KB per page at 2× resolution)
- Physical mobile devices

## 7. Feature added after the audit: cascading start-time changes

**Behaviour:** Edit Time → change the start (or duration) → **Preview Changes** opens the whole stage. Programs before the edited one are unchanged; the edited program takes its new start (its end comes from its duration); every later program on that stage is moved in the existing order, keeping its own duration.
- **Keep breaks** (the default): each break stays the same length, so the timetable shifts as a whole.
- **Remove breaks**: later programs run back-to-back.

Other stages and cancelled programs never move. Clashes (stage overlaps and participants on other stages) are listed in the preview, and the save button becomes a red "Save anyway". **Cancel** writes nothing; **Save** writes every affected program in one atomic multi-path update, stored in ISO format. On phones the preview is a bottom sheet and scrolls the edited program into view.

**Reused, not duplicated:**
- `resolveTimeEdit` (new start, end and duration)
- `getProgramInterval`, `getDurationMinutes`, `sortByStart`, `sameVenue`
- `detectBatchClashes`
- `saveBatch` → `programService.batchUpdatePrograms`
- `formatTime` / `formatDate`

New code is limited to `cascadeFromEdit()` and `getStagePrograms()` in `scheduleCalculator.ts`, plus the preview modal in `ScheduleManager.tsx`. Drag-and-drop and its cascade are unchanged.

**Files:**
- `src/utils/scheduleCalculator.ts`
- `src/components/ScheduleManager.tsx`
- `src/utils/__tests__/cascadeFromEdit.test.ts` (new, 15 tests, which pass under IST, UTC and New York time)

**Also fixed:** a crash found during this testing. The judge page went blank whenever an assigned program had no participants, because the database drops empty arrays. All 26 unguarded `teams`/`participants` accesses in JudgesPage, GreenRoomPage, TeamLeaderPage, GreenRoomProgramCard, AdminPage and ProgramAccordion are now guarded.

**End-to-end tests** (emulators; 20 programs on Main Stage with a 45-minute lunch break and past-midnight times; plus Stage 2):

| # | Scenario | Result |
|---|---|---|
| 1 | Middle program (P12 +30 min): preview shows P1–P11 unchanged and P12–P20 moved; Cancel | DB unchanged ✔ |
| 2 | Same change, confirmed | Exactly P12–P20 changed, durations kept, past midnight correct, Stage 2 untouched, public copy updated ✔ |
| 3 | Second program moved earlier (P2 09:45→09:30), lunch break kept | 45-minute break kept ✔; "Remove breaks" preview closes it ✔ |
| 4 | That earlier time overlapped P1 | Preview listed "Stage overlap: Program 02 ↔ Program 01", button turned to "Save anyway" ✔ |
| 5 | P2 moved later back to 09:45 | Whole stage restored exactly to the prior state ✔ |
| 6 | First program to 08:30 | All 20 moved, both breaks kept ✔ |
| 7 | Last program to 02:00 | Only P20 changed ✔ |
| 8 | P13 pushed into Asha's Stage 2 slot | "Asha (#101): Program 13 ↔ Stage2 Solo" shown; cancelled ✔ |
| 9 | Reload | New times persisted ✔ |
| 10 | Public schedule | New times in chronological order, next-day date shown ✔ |
| 11 | Judge view | Program 05 at its cascaded 11:30 AM ✔ (after the crash fix) |
| 12 | 375px phone: edit, preview (bottom sheet, all buttons on screen, no horizontal scroll), tap Save | 12 programs updated correctly ✔ |

## 8. Remaining issues for further investigation

1. Run a staging smoke test with real ImgBB backgrounds for CORS and font embedding (P5/P6).
2. Decide what to do with the dead calculators and components (§3).
3. Consider moving judge and green-room team writes into a transactional Cloud Function, like team-leader registration. This closes the whole-array lost-update risk noted in `SECURITY.md`.
4. A larger editor preview, or a "preview with a real participant" option, for small screens.
