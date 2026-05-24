# Jitsu Points — Changelog

> Format: `## YYYY.MM.DD.N — Short description`
> One entry per build. Build number is injected at compile time as `VITE_BUILD_NUMBER`.

---

## 2026.05.24.2 — Phase 7 complete: polish & launch (audio, theme switcher, install prompts, Playwright)

**Phase:** 7

**What's in this build:**
- **7.2 Web Audio** — `src/core/audio/index.ts`: `playTaskComplete()` (ascending arpeggio), `playLevelUp()` (fanfare chord + run), `playRedemption()` (descending bell chime). All synthesized at runtime via Web Audio API — zero audio file assets. Lazy `AudioContext` init (user-gesture safe). Wired into `CelebrationOverlay`, `LevelUpOverlay`, `RewardsScreen`.
- **7.3 Theme Switcher** — `ThemeSwitcher` component with 4 colour swatches (Candy, Berry, Ocean, Sunset). Added as a Settings section at the bottom of `ParentDashboard`. Applies immediately via `applyTheme()` + persists via `storeTheme()` to localStorage.
- **7.4 Android Install Prompt** — `AndroidInstallBanner`: captures `beforeinstallprompt`, suppresses Chrome's mini-infobar, shows branded banner with "Install" CTA that calls `event.prompt()`. Permanently dismissible. Companion to the Phase 6 `IOSInstallBanner`. Both rendered globally in `App.tsx`.
- **7.1 Enhanced mascot animations** — All 5 `JitsuMascot` moods now have distinct CSS keyframe animations: `happy` (gentle 3s bob with slight rotation), `cheer` (excited jump/bounce), `wow` (big pulse + rotation), `calm` (slow 4s sway), `sleep` (drooping nod). No API change — drop-in replacement for the Rive component when the `.riv` file is ready.
- **7.5 Playwright E2E** — `@playwright/test` installed; `playwright.config.ts` targets Pixel 7 / Chromium with auto-starting dev server; 3 test suites: `smoke.spec.ts` (4 tests: fresh install, navigation to setup/join, page title), `child-flow.spec.ts` (4 tests: demo data load, profile picker, task completion, rewards vault), `parent-flow.spec.ts` (5 tests: parent mode, dashboard tiles, new task form, theme switcher). `data-testid` attributes added to `WelcomeScreen`, `ProfilePicker`, `TaskCard`. Vitest `exclude` updated so unit tests and E2E tests don't conflict.
- **7.7 Security review** — ADR-015 logged: tokens in localStorage (acceptable, Google GIS docs), `drive.file` scope (correct), no PII to third parties, React XSS protection, join code is not a security token. Post-launch note: add CSP header via Cloudflare Pages `_headers`.
- **7.8 ADRs** — ADR-013 (foreground-only notification model), ADR-014 (synthesized audio), ADR-015 (security review). DECISIONS.md now at 15 ADRs.
- **Rive mascot** — Not integrated (no `.riv` file from designer). `JitsuMascot` component interface unchanged; swap is a one-file change when the asset is ready. See `src/shared/mascot/JitsuMascot.tsx`.

**Build:** 109 modules — 119 unit tests passing — 13 Playwright tests written

---

## 2026.05.24.1 — Phase 6 complete: local notifications + iOS install prompt

**Phase:** 6

**What's in this build:**
- `src/core/notifications/index.ts` — local notification scheduling module:
  - `canUseNotifications()` / `getPermissionStatus()` — browser capability checks
  - `requestNotificationPermission()` — async; returns `boolean`; safe to call at any time
  - `scheduleReminder(key, title, body, fireAt)` — schedules a `setTimeout`; same key cancels the previous timer
  - `cancelReminder(key)` / `cancelAllReminders()` — cancel pending timers
  - `rescheduleAllReminders(schedules, templates, instances, today)` — cancel + re-register all today's pending reminders (skips completed/missed instances, skips past times); delegates display to `registration.showNotification()` (falls back to `new Notification()` on localhost/no-SW)
- `TaskFormScreen` — after saving a task that has at least one `reminderTime` set, requests notification permission contextually (`getPermissionStatus() === 'default'`); browser shows its own permission modal at this moment so the reason is obvious
- `App.tsx` — added `useEffect` subscribed to `[isLoaded, taskSchedules, taskTemplates, taskInstances]` that calls `rescheduleAllReminders()` on every app open, foreground resume, and task mutation; added `<IOSInstallBanner />` as a global root-level component
- `IOSInstallBanner` — fixed-position bottom banner shown only on iOS Safari non-installed PWA; prompts user to "Add to Home Screen" to enable task reminders; permanently dismissible (localStorage); slide-up animation; respects `env(safe-area-inset-bottom)` for the iPhone home indicator

**Notification model:**
- Foreground-only (consistent with ADR-005): timers registered via `setTimeout` in the main thread; fire as long as the browser/PWA has been opened at least once that day
- No push server required — entirely local, zero cost
- Clicking a notification opens/focuses the app via the existing service worker

**Build:** 102 modules — 119 tests passing

---

## 2026.05.23.7 — Phase 5 complete: onboarding (welcome, family setup, join flow, reconnect Drive)

**Phase:** 5

**What's in this build:**
- `appStore.ts` — `hasFamilyData: boolean` (set in `load()` from presence of `familyMeta`); `initFamily(familyName, childName, avatar, accessToken)` → creates family + seeds DB + pushes to Drive → returns join code; `joinFamily(rawCode, accessToken)` → pulls Drive, verifies join code, seeds DB
- `WelcomeScreen` — shown automatically when no family is set up; two large action buttons ("Set up" / "Join"); floating mascot animation; DEV-only "Load Demo Data" button
- `FamilySetup` — 3-step flow with animated dot progress indicator:
  - Step 1 (if `VITE_GOOGLE_CLIENT_ID` set): Google sign-in via GIS popup; "Skip (local only)" link
  - Step 2: Family name + first child name + 6-avatar picker
  - Step 3: Join code displayed with clipboard copy button + multi-device instructions
- `JoinFamily` — 3-step flow: enter join code (live format validation) → Google sign-in → syncing spinner; error step with retry; normalises code before comparison
- `ProfilePicker` — redirects to `/welcome` when `isLoaded && !hasFamilyData`; removed EmptyState (now handled by WelcomeScreen)
- `ParentDashboard` — "Drive sync paused" reconnect banner when auth status is `unauthenticated`; tries `silentRefresh()` first, falls back to `signIn()`
- Both onboarding flows gracefully handle missing `VITE_GOOGLE_CLIENT_ID` (local-only mode works without cloud)

**Build:** 102 modules → 374 kB JS / 70 kB CSS (gzipped: 115 kB / 9.6 kB)

---

## 2026.05.23.6 — Phase 4 complete: parent experience (dashboard, task/reward/kid management, bonus/demerit)

**Phase:** 4

**What's in this build:**
- `appStore.ts` — parent write actions: `createTask`, `updateTask`, `deleteTask`, `createRewardItem`, `updateRewardItem`, `toggleReward`, `deleteReward`, `createChild`, `updateChild`, `deleteChild`; pending overlay state (`pendingBonus`, `pendingDemerit`) set on `addBonus`/`addDemerit`; `dismissBonus`, `dismissDemerit`; `NewTaskData` / `ScheduleSlot` types exported
- `router/index.tsx` — 6 new parent routes: `/parent`, `/parent/task/new`, `/parent/task/:id/edit`, `/parent/rewards`, `/parent/kids`, `/parent/bonus`, `/parent/demerit`
- `ParentDashboard` — children overview cards (pts/streak/today progress), action grid (5 tiles), full task list with inline edit links
- `TaskFormScreen` — create/edit mode; emoji icon grid + freetext; points chips; assign to child; early completion toggle; dynamic schedule slots (up to 3); delete with confirmation
- `ManageRewardsScreen` — inline create/edit form; enable/disable toggle; delete with confirmation
- `ManageKidsScreen` — inline create/edit form; 6-avatar picker grid; delete with confirmation
- `BonusComposer` — child picker, preset + freetext amount, reason note, live preview; preselect child from dashboard quick-tap
- `DemeritComposer` — same, capped at −20, calm tone; cap note if user enters > 20
- `BonusOverlay` — gradient card (primary→secondary), woohoo dismiss; shown on child's HomeScreen when `pendingBonus.childId` matches
- `DemeritOverlay` — calm white card with blue top border, encouraging message; shown on child's HomeScreen

**Build:** 95 modules → 357 kB JS / 58 kB CSS (gzipped: 110 kB / 8.2 kB)

---

## 2026.05.23.5 — Phase 3 complete: child-facing UI (screens + overlays + design system)

**Phase:** 3

**What's in this build:**
- `src/core/store/appStore.ts` — Zustand global store: `load()`, `completeTask()`, `redeemReward()`, `addBonus()`, `addDemerit()`; overlay state for celebration/levelUp/redemption; selectors for points, XP, level, today's tasks
- `src/core/router/index.tsx` — React Router with 6 routes (ProfilePicker, HomeScreen, TaskDetail, Rewards, Streak, Achievements)
- `src/App.tsx` — root component; theme + auth hydration on mount; `visibilitychange` triggers state recalc
- **Design system components:** `ChunkyButton` (4 variants, 3 sizes), `Avatar` (6 avatars, 4 sizes), `PointsBadge`, `TabBar` (4 tabs), `JitsuMascot` (5 moods, emoji placeholder)
- **Overlays:** `CelebrationOverlay` (60-particle CSS confetti, auto-dismiss 3.5s), `LevelUpOverlay` (gradient + level badge, tap to dismiss)
- **Feature screens:**
  - `ProfilePicker` — avatar grid, dev seed button (DEV-only dynamic import)
  - `HomeScreen` — XP bar, daily progress, task list, overlays wired
  - `TaskDetailScreen` — mascot + task card + COMPLETE button
  - `RewardsScreen` — balance header, reward list, confirm dialog, success overlay
  - `StreakScreen` — hero streak number, 7-day calendar row, stats, motivational copy
  - `AchievementsScreen` — level card with XP bar, 11 achievements (task count + streak + level milestones)
- `src/dev/demoData.ts` — demo family (2 profiles, 5 tasks, 7 schedules, rewards, historical events)
- All components use CSS Modules + design tokens only; zero inline styles in app code

**Build:** 79 modules → 328 kB JS / 31 kB CSS (gzipped: 103 kB / 5.7 kB)

---

## 2026.05.23.4 — Phase 2 complete: storage layer (IndexedDB + Auth + Drive + Sync)

**Phase:** 2

**What's in this build:**
- `src/core/db/` — IndexedDB schema (9 object stores, compound indexes), typed query helpers per store, `seedFromDriveFile()` (upsert + orphan delete), `serializeToFile()` (DB → JitsuDriveFile)
- `src/core/auth/` — Google Identity Services wrapper (sign-in, silent refresh, revoke), localStorage token storage with expiry buffer, Zustand auth store
- `src/core/drive/` — Google Drive REST API v3 client (find/create folder, read/write/update file), `pullDriveFile()` + `pushDriveFile()` high-level ops
- `src/core/sync/` — sync engine (pull if Drive newer, push if dirty, debounced 2s push, offline detection), Zustand sync store, `useSync()` React hook
- `fake-indexeddb/auto` in test setup — all DB tests run in-process with full IndexedDB semantics
- Per-test named DB isolation (each test gets `jitsu-*-test-N` to avoid state bleed)
- `.env.example` + `src/env.d.ts` for `VITE_GOOGLE_CLIENT_ID`

**Tests:** 119 passing across 9 test files

---

## 2026.05.23.3 — Phase 1 complete: domain layer depth + full coverage

**Phase:** 1

**What's in this build:**
- `src/domain/id.ts` — `generateId()` wrapping `crypto.randomUUID()`
- `src/domain/factories.ts` — factory functions for all domain objects (`createProfile`, `createTaskTemplate`, `createSchedule`, `createTaskInstance`, `createPointsEvent`, `createReward`, `createFamilyFile`, `defaultSettings`)
- `src/domain/tasks.ts` — added `generateInstances()` (idempotent, resolves initial state via `resolveTaskState`)
- `src/domain/validate.ts` — `validateDriveFile()` and `tryValidateDriveFile()` with `DriveFileValidationError`
- `src/domain/index.ts` — all domain exports unified

**Tests:** 79 passing across 6 test files
**Coverage:** 98.8% statements · 95% branches · **100% functions · 100% lines**

---

## 2026.05.23.2 — Phase 0 complete: Vite scaffold + domain layer

**Phase:** 0

**What's in this build:**
- Vite 8 + React 19 + TypeScript app in `/app`
- Vitest + React Testing Library — 39 passing tests
- CSS custom properties design tokens (`tokens.css`) — Candy, Berry, Ocean, Sunset themes
- Google Fonts (Fredoka + Nunito) in `index.html`
- PWA manifest + service worker via `vite-plugin-pwa`
- `__BUILD_NUMBER__` injected at build time via `VITE_BUILD_NUMBER` env var
- Domain layer (`src/domain/`): types, points engine, task state machine, join code, streak calculation
- GitHub Actions CI: typecheck → lint → format → test → build → Cloudflare Pages deploy
- Wrangler config for Cloudflare Pages
- Prettier config

**Packages added:** `idb`, `zustand`, `react-router-dom`, `vite-plugin-pwa`, `workbox-window`, `vitest`, `@testing-library/*`, `prettier`

---

## 2026.05.23.1 — Project scaffold + documentation

**Phase:** 0

**What's in this build:**
- `index.html` — complete interactive prototype (React + Babel CDN, all JSX inlined)
- All 12 prototype JSX source files extracted from design bundle
- `jitsu_points_requirements.md` — original requirements spec
- `CLAUDE.md` — full project documentation, stack decisions, data models, build plan
- `DECISIONS.md` — 11 architecture decision records
- `DOMAIN.md` — canonical types, invariants, points rules, task state machine
- `CHANGELOG.md` — this file

**Not yet started:** `/src` PWA app

---
