# Intensia Arts Fest — Agent Context & Progress Tracker

> **Last Updated:** 2026-08-09
> **Project:** React + Vite app with Firebase Realtime Database backend
> **Status:** Active Development

---

## 🟢 Current Build Status

**All clear** — `tsc --noEmit`, `npm run build`, and `npm run dev` all pass with zero errors.

---

## 🏗️ Architecture Notes

- **Backend:** Firebase Realtime Database via `src/services/programService.ts` + `src/config/firebase.ts`
- **Data Fetching:** `src/hooks/usePrograms.ts` — abstraction layer over Firebase service
- **Routing:** React Router in `App.tsx`
- **Constants:** Canonical location is `src/constants/categories.ts`
- **Types:** Canonical location is `src/types.ts`

---

## 🗺️ Current Focus / Roadmap

- Developing the Marketing and UI layers.
- Perfecting internal role interfaces (Admin, Team Leader, Green Room, Judges).
- Setting up comprehensive Mock Data injection via Firebase Admin script for robust testing of Single-College Zone-based Arts Fest.
