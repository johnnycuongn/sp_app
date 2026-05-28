# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Supplier Receipt Tracker ("Sinh Phu" / `sinhphu`) — a single-page web app for tracking supplier invoices/bills. React 18 + TypeScript on Create React App (`react-scripts`), backed by Firebase (Auth, Firestore, Storage, Hosting, and Cloud Functions). UI uses MUI (`@mui/material`) with `recharts` for the dashboard chart, `react-router-dom`, and a small custom theme in `src/theme.ts`.

## Commands

Run from the repo root unless noted:

- `npm install --legacy-peer-deps` — required for first install; `react-scripts@5` declares a peer of `typescript@^4` but the project pins `typescript@^5`. Without `--legacy-peer-deps` install fails with ERESOLVE.
- `npm start` — CRA dev server (http://localhost:3000).
- `npm run build` — production build into `build/`.
- `npm test` — Jest via `react-scripts` (interactive watch mode). Use `CI=true npm test` for a single non-watch run, or `npm test -- src/App.test.tsx` to target one file.
- `npm run deploy:production` — build, then `firebase deploy --only hosting:sinhphu` (production project; see the `isDev` note below).

Cloud Functions live in `functions/` as a **separate npm package** with its own `tsconfig`, ESLint config, and `node_modules`. From inside `functions/`:

- `npm run lint` — ESLint (`eslint-config-google`, double quotes, 2-space indent). This is the only lint setup in the repo; the React app has no lint script beyond CRA's build-time checks.
- `npm run build` — `tsc` (emits to `lib/`). Both `lint` and `build` run automatically as `firebase deploy` predeploy hooks.
- `npm run serve` — build + start the Functions emulator.

Firebase emulators are configured in `firebase.json` (functions :5001, firestore :8080, storage :9199, auth :9099, plus emulator UI). **Note:** the app does not call `connect*Emulator` (see `src/services/firebase/config.ts`), so the running app always talks to a real Firebase project, not the emulators.

## Architecture

### Three-layer model: services → api → pages

Data flows in one direction (pages call api functions; api functions call services):

- **`src/services/firebase/`** — Firebase init. `config.ts` calls `initializeApp` (plus a second `'Admin'` app instance for `adminAuth` so creating new users doesn't sign the admin out). `index.ts` exports collection/doc ref helpers (`billsColRef`, `billRef(id)`, `storageOneBillRef(id)` → `/bills/:id/`). Always go through these helpers — don't `collection(db, ...)` directly in feature code.

- **`src/api/`** — the domain/repository layer. **Plain async functions, one file per entity** (`bills.ts`, `suppliers.ts`, `payments.ts`, `outlets.ts`, `users.ts`), all re-exported from `src/api/index.ts`. There are no classes and no static caches. Types live in `src/api/types.ts` (`Bill`, `Supplier`, `Payment`, `Outlet`, `BillInput`, etc.). Two shared helpers in `src/api/converter.ts`:
  - `stripEmpty(obj)` — strips `null`, `undefined`, and whitespace-only strings before a Firestore write. It does **not** strip `0`, `false`, or empty arrays (the prior `removeEmpty` did, which silently dropped `total_payment: 0`).
  - `toDate(value)` — coerces a Firestore `Timestamp` (or anything with `.toDate()`) into a `Date`.

- **`src/pages/`** — one component per route. Pages call api functions and own UI/data state. Multi-file pages use a dotted naming convention (e.g. `HomePage.tsx` + `HomePage.report.tsx` + `HomePage.css`). The dashboard's report logic in `HomePage.report.tsx` is **pure functions only** (no React) — `rangeOptionsFor`, `filterBillsInRange`, `paymentBreakdown`, etc.

### Lookups context (the supplier/outlet/payment cache)

Suppliers, outlets, and payment methods are small lookup tables that nearly every page needs. `src/api/lookups.tsx` exposes a `LookupsProvider` (mounted in `App.tsx` under `AuthProvider`) and a `useLookups()` hook that returns:

- `suppliers`, `outlets`, `payments`, `earliestBillYear` — loaded once when the user signs in.
- `refresh()` — call after a successful create/update/delete in any of those entities so the joined names on the dashboard stay accurate.
- `supplierName(id)`, `outletName(id)`, `paymentName(id)` — name-resolution helpers; the dashboard table uses these instead of a "ViewModel" type.

This replaces the previous static-cache pattern (`Bill.suppliers`, `Bill.payments`, `Bill.outlets` with a manual `Bill._initialize()` call required in every page). Pages no longer call `_initialize` — they just read from `useLookups()`.

### Bill receipt uploads (the upload flow)

`createBill` and `updateBill` in `src/api/bills.ts` follow a strict ordering to avoid orphan docs and orphan files:

1. **Upload Storage files first** via `uploadFilesForBill()`, which uses `Promise.allSettled` and cleans up any successful uploads if **any** file failed.
2. **Then commit the Firestore doc.** If the doc write throws, the helper rolls back the uploaded files via `deleteObject`.
3. **Filenames are namespaced** with `${Date.now()}_${i}_${sanitizeFilename(name)}` so two receipts with the same client filename don't collide in Storage.

`updateBill` takes a `{ newFiles, removedPaths }` diff (not a "delete all" boolean), so editing a bill can add, remove, or keep individual receipts. The bill doc's `files_ref` is recomputed from `(existing - removedPaths) ++ newlyUploaded`.

### Auth and routing

`src/App.tsx` wraps the router in `<AuthProvider><LookupsProvider>...`. `AuthProvider` (`src/api/auth.tsx`) exposes `currentUser`, `isAdmin`, `login`, `logout`, `loading`, kept in sync via `auth.onAuthStateChanged`. `currentUser` (`AppUser`) merges the Firebase Auth user with the Firestore `users/{uid}` doc's `role`.

`src/App.routes.tsx` gates access in two stages: while `loading` is true it renders nothing; unauthenticated users only ever see `LoginPage`; authenticated users hit `AdminRoute`, which requires `isAdmin` (role `type === 'admin'`). Roles are `admin` and `outlet_manager` (`RoleType` in `src/api/types.ts`), though only admin routing is wired up today. Routes: `/` (dashboard), `/bill/new`, `/bill/:id/edit` (both `NewBillPage`), `/supplier`, `/payment`, `/outlet`.

### Layout and mobile chrome

This app is **mobile-first**, but renders on the desktop too. `AppLayout` (`src/components/AppLayout.tsx`) wraps every authenticated route and switches chrome based on `useMediaQuery(theme.breakpoints.down("md"))`:

- **Mobile (xs/sm)** — compact top app bar with the brand name + `MobileBottomNav` (4 tabs: Bills / Suppliers / Outlets / Payments). Detail pages (anything matching `/bill/...`) hide the bottom nav and render `DetailHeader` instead, which is a sticky `AppBar` with a back arrow.
- **Desktop (md+)** — the standard top `AppNavigationBar` only; no bottom nav.

The chrome leaves room for iOS safe-area insets (`env(safe-area-inset-top|bottom)`) so the app behaves correctly when installed as a PWA or wrapped in Capacitor. Three helpers in `MobileBottomNav.tsx` make adapting a page to the mobile layout one-liners:

- `useMobileBottomPadding()` — returns the bottom padding a scrolling page needs so its last row isn't covered by the bottom nav.
- `bottomFixedOffsetSx()` — `sx` fragment for fixed-position elements (FAB, sticky form footers) so they sit above the bottom nav.
- `MobileFab` — primary-action FAB that auto-hides on desktop. Use this for "New X" buttons on every top-level page.

For form pages (`NewBillPage`), the submit button lives in a **sticky bottom footer** (`<StickyFooter>` inside the page) so it's reachable with one thumb on a phone; the body content gets `pb: 12` to clear it. Lookup-table forms (Supplier/Payment/Outlet) use a shared `CrudDialog` (exported from `SupplierPage.tsx`) that becomes a full-screen Slide-up dialog with an app bar on mobile, and a centered modal on desktop.

## Important gotchas

- **`isDev` flag**: `src/services/firebase/config.ts` has a hardcoded `const isDev = true` that switches the whole app between the dev project (`sinhphu-dev`) and production (`sinhphu-78dae`). The Firebase web config (including `apiKey`) for both is committed in source — expected for Firebase web clients, but `npm run deploy:production` deploys hosting to prod regardless of this flag.
- **Security rules**: `firestore.rules` allows read/write to any authenticated user (no per-document authorization). `storage.rules` now allows authenticated read/write under `/bills/{billId}/**` — uploads were failing before because the rules denied everything. If you tighten one, tighten the other together.
- **`functions/src/index.ts` is an empty scaffold** — no Cloud Functions are implemented yet.
- **Tests are minimal**: `src/App.test.tsx` is the default CRA boilerplate test (asserts a "learn react" link that the app does not render) and does not reflect real coverage. Don't treat it as a passing baseline.
- TypeScript is in `strict` mode targeting `es5`. Image imports rely on the ambient module declarations in `declaration.d.ts`.
- Bootstrap is still listed in `package.json` from the prior UI but is no longer imported — the whole UI runs on MUI via `src/theme.ts`. Safe to remove from `dependencies` if you do a dep cleanup pass.
