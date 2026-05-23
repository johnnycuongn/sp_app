# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Supplier Receipt Tracker ("Sinh Phu" / `sinhphu`) — a single-page web app for tracking supplier invoices/bills. React 18 + TypeScript on Create React App (`react-scripts`), backed by Firebase (Auth, Firestore, Storage, Hosting, and Cloud Functions). UI uses MUI (`@mui/material`), with Bootstrap, `styled-components`, `react-select`, `react-calendar`, and `recharts` for reporting charts.

## Commands

Run from the repo root unless noted:

- `npm start` — run the CRA dev server (http://localhost:3000).
- `npm run build` — production build into `build/`.
- `npm test` — Jest via `react-scripts` (interactive watch mode). Use `CI=true npm test` for a single non-watch run, or `npm test -- src/App.test.tsx` to target one file.
- `npm run deploy:production` — build, then `firebase deploy --only hosting:sinhphu` (deploys to the **production** Firebase project; see the `isDev` note below before doing this).

Cloud Functions live in `functions/` as a **separate npm package** with its own `tsconfig`, ESLint config, and `node_modules`. From inside `functions/`:

- `npm run lint` — ESLint (`eslint-config-google`, double quotes, 2-space indent). This is the only lint setup in the repo; the React app has no lint script beyond CRA's build-time checks.
- `npm run build` — `tsc` (emits to `lib/`). Both `lint` and `build` run automatically as `firebase deploy` predeploy hooks.
- `npm run serve` — build + start the Functions emulator.

Firebase emulators are configured in `firebase.json` (functions :5001, firestore :8080, storage :9199, auth :9099, plus emulator UI). **Note:** the app does not currently call `connect*Emulator` (see `src/services/firebase/config.ts`), so the running app always talks to a real Firebase project, not the emulators.

## Architecture

### Layered model → services → pages

The app is organized in three layers and data flows in one direction (pages call models; models call services):

- **`src/services/firebase/`** — the only place that initializes Firebase.
  - `config.ts` calls `initializeApp` and exports `db`, `auth`, `storage`. It also creates a second app instance named `'Admin'` (`adminAuth`) used so creating new users doesn't sign out the current admin.
  - `index.ts` exports the Firestore collection/doc reference helpers (`billsColRef`, `billRef(id)`, `supplierRef(id)`, etc.) and Storage refs (`storageOneBillRef(id)` → `/bills/:id/`). Always go through these helpers rather than calling `collection`/`doc` directly in feature code.

- **`src/model/`** — the domain/repository layer. Each entity is a **class with `static` async CRUD methods** that read/write Firestore directly: `Bill`, `Supplier` (+ `SupplierMain` for the shared categories doc), `Payment`, `Outlet`, `User`. `model.ts` holds the plain TypeScript interfaces; `index.ts` re-exports everything so feature code imports from `"../model"`. Auth lives here too (`Auth.tsx`, `User.ts`) rather than under a separate auth folder.

- **`src/pages/`** — one component per route. Pages call the model classes and own all UI/data state. Multi-file pages use a dotted naming convention (e.g. `HomePage.tsx` + `HomePage.report.tsx` + `HomePage.css`).

### Firestore ↔ TypeScript conversion convention

Every model class converts raw Firestore documents through a private `fromFirebase(id, data)` that maps to the typed interface, defaults missing fields, and converts Firestore `Timestamp`s with `.toDate()`. Before writes, `updateDoc` payloads are passed through `removeEmpty()` (`src/utils/object.ts`), which **mutates** the object to strip empty strings, nulls, and `0`s. Document `id` is deleted from payloads before saving (the id lives in the doc path, not the body).

### Model vs. ViewModel (the `Bill._initialize()` requirement)

`Bill` distinguishes `BillModelInterface` (raw foreign keys: `supplier_id`, `payment_bank_id`, `outlet_id`) from `BillViewModelInterface` (adds human-readable `supplier_name`, `payment_name`, `outlet_name`). The name-joining is done client-side against **static caches** on the `Bill` class (`Bill.suppliers`, `Bill.payments`, `Bill.outlets`).

These caches are empty until populated. **Any page that uses `Bill` view models must call `await Bill._initialize()` in its first `useEffect` before fetching/rendering**, otherwise joined names come back as "Unknown supplier/outlet/payment". Internal methods call `suppliers_payments_init()` to lazily fill caches, but `_initialize()` is the explicit page-level entry point.

### Auth and routing

`src/App.tsx` wraps the router in `AuthProvider` (`src/model/Auth.tsx`), a React context exposing `currentUser`, `isAdmin`, `login`, `logout`, `loading`, kept in sync via `auth.onAuthStateChanged`. `currentUser` (`AppUserInterface`) merges the Firebase Auth user with the Firestore `users/{uid}` doc's `role`.

`src/App.routes.tsx` gates access in two stages: unauthenticated users only ever see `LoginPage`; authenticated users hit `AdminRoute`, which requires `isAdmin` (role `type === 'admin'`). Roles are `admin` and `outlet_manager` (`RoleType` in `User.ts`), though only admin routing is wired up today. Routes: `/` (HomePage report dashboard), `/bill/new`, `/bill/:id/edit` (both `NewBillPage`), `/supplier`, `/payment`, `/outlet`.

## Important gotchas

- **`isDev` flag**: `src/services/firebase/config.ts` has a hardcoded `const isDev = true` that switches the whole app between the dev project (`sinhphu-dev`) and production (`sinhphu-78dae`). The Firebase web config (including `apiKey`) for both is committed in source — this is expected for Firebase web clients, but be deliberate: `npm run deploy:production` deploys hosting to prod regardless of this flag.
- **Security rules**: `firestore.rules` allows read/write to any authenticated user (no per-document authorization). `storage.rules` denies all (`if false`) even though bills upload images to Storage — confirm the active project's deployed rules before debugging upload failures.
- **`functions/src/index.ts` is an empty scaffold** — no Cloud Functions are implemented yet.
- **Tests are minimal**: `src/App.test.tsx` is the default CRA boilerplate test (asserts a "learn react" link that the app does not render) and does not reflect real coverage. Don't treat the existing test as a passing baseline.
- TypeScript is in `strict` mode targeting `es5`. Non-`.ts(x)` imports like images rely on the ambient module declarations in `declaration.d.ts`.
