# Jitsu Points — Changelog

> Format: `## YYYY.MM.DD.N — Short description`
> One entry per build. Build number is injected at compile time as `VITE_BUILD_NUMBER`.

---

## 2026.06.24.1 — Phase 8: duplicate task, sortable task list, points input fix

**Phase:** 8 — Parent UX refinements

**What's in this build:**

- **8.1 — Duplicate task**
  - New `📋 Duplicate` button on each Parent Dashboard task row → new route `/parent/task/:templateId/duplicate`.
  - `TaskFormScreen` gains a third mode (`create | edit | duplicate`): pre-fills from the source template + schedules, appends `" (copy)"` to the title, hides Delete, header reads "Duplicate Task". Saves via `createTask` so the copy gets fresh IDs; the original is untouched.
  - Past one-time dates: date is kept, an inline ⚠️ warning is shown, the date input gets `min={today}`, and save is blocked until the date is today-or-later (validation applies in all modes).

- **8.2 — Sortable parent task list**
  - Segmented **Name / Points** toggle above the dashboard task list (shown only when >1 task). Default Name A–Z; tap the active key to flip direction; Points defaults high→low. Pure view-layer state — no persisted field.

- **8.3 — Points input fix**
  - Manual points field could not be cleared (every keystroke ran `Math.max(1, Number(...))`, so backspace snapped to `1` and further typing prepended digits → e.g. `125`). Confirmed via Playwright probe.
  - Fix: input backed by transient string state (allows empty while editing), select-all-on-focus for instant overtype, clamp to 1–500 only on blur (empty falls back to the last valid value). Quick-pick chips still set the value.

**Tests:** 151 unit passing · new Playwright suite `e2e/phase8.spec.ts` (4 tests) passing · all 5 parent-flow E2E passing. Hardened shared `clearAppData` E2E helper to navigate before touching IndexedDB.

---

## 2026.05.28.2 — Icon picker cell sizing fix

**Phase:** Post-launch

**What's in this build:**

- **Icon picker bottom-sheet cells were too large on desktop/wide screens**
  - `position: fixed` sheet had no `max-width` constraint, so on a laptop the panel spanned the full viewport and the 8-column grid gave each cell ~200px with a 22px emoji inside (emoji appeared ~20% of cell).
  - Fix: added `max-width: 480px; margin: 0 auto` to `.iconSheetPanel` to match `#root`'s mobile column.
  - Also replaced `aspect-ratio: 1` with `padding: 5px 0` on icon buttons so cells hug the emoji height rather than being forced square.

**Tests:** 151 passing

---

## 2026.05.28.1 — Scroll fix (all screens), orphan instance pruning, icon picker bottom-sheet

**Phase:** Post-launch

**What's in this build:**

- **DEF-014 closed — all screens now scroll correctly**
  - Root cause: all 15 screen CSS modules had `height: 100%` on `.screen` but were missing `min-height: 0`. Flex items default to `min-height: auto`, causing them to grow to fit content rather than cap at viewport height — so `overflow-y: auto` on the inner scroll area never triggered.
  - Fix: added `min-height: 0` to `.screen` in all 15 screen CSS modules via a PowerShell batch.

- **DEF-013 closed — task counter now matches visible task cards**
  - Root cause: `deleteTask` and `updateTask` deleted `TaskTemplate` / `TaskSchedule` records but left their `TaskInstance` records orphaned in IndexedDB. Orphans had valid `childId` + `date` so the counter included them, but `taskTemplates[instance.templateId]` returned `undefined` so no card rendered.
  - Fix (4-part): `deleteTask` now deletes instances for the template; `updateTask` deletes instances with replaced schedule IDs; `load()` prunes orphaned instances on every load (one-time heal for existing families); `HomeScreen` filter now guards `taskTemplates[i.templateId] && taskSchedules[i.scheduleId]` on the counter.
  - New helpers: `db.taskInstances.deleteByTemplateId()` and `db.taskInstances.deleteByScheduleIds()`

- **DEF-015 closed — icon picker moved to bottom-sheet**
  - The 57-icon inline grid has been replaced by a single trigger button (shows selected icon + "Tap to choose icon"). Tapping opens a `position: fixed` bottom-sheet that contains the full icon grid and the custom emoji input. Selecting an icon closes the sheet automatically; backdrop tap also closes it.

**Tests:** 151 passing

---

## 2026.05.27.2 — Data migration fix + onboarding scroll + CI clean-up

**Phase:** Post-launch

**What's in this build:**

- **DEF-012 closed — blank screen after domain model migration**
  - Devices that had old IndexedDB records with `assignedChildId` (singular string) crashed silently inside `load()` when `generateInstances` tried to iterate `template.assignedChildIds` (now an array). `isLoaded` never became `true`, leaving the 🥷 loading screen permanently.
  - `load()` now coerces old records to the array format and re-persists the healed template (migration runs once, self-healing).
  - `load()` is now wrapped in `try/catch` — any future load failure sets `isLoaded: true, hasFamilyData: false` so the user lands on the welcome screen instead of hanging.

- **Onboarding scroll fixed (DEF-007 pattern)**
  - `WelcomeScreen`, `FamilySetup`, `JoinFamily`, `ProfilePicker` all used `min-height: 100%` on `.screen` — the same root cause as DEF-007. Changed to `height: 100%` so `overflow-y: auto` triggers correctly on long content.

- **CI type errors resolved**
  - `queries.test.ts`: `createTaskTemplate('Brush Teeth', 5, 'child-1')` → `(['child-1'])` (string[])
  - `demoData.ts`: all 5 `createTaskTemplate` calls updated to array form (committed from previous session)

- **Prettier formatting fix** — try/catch body in `load()` was not indented; format check was failing CI.

**Tests:** 151 passing

---

## 2026.05.27.1 — Replace Google Drive sync with Cloudflare Workers + D1

**Phase:** Post-launch

**What's in this build:**

- **Google Drive + OAuth removed entirely**
  - `core/drive/` deleted; `core/auth/gis.ts` deleted
  - No more refresh tokens, GIS script, or OAuth consent screens
  - Children and parents experience zero auth friction — ever

- **Cloudflare Worker + D1 added** (`worker/`)
  - New `worker/src/index.ts` — 4-route REST API: `POST /families`, `GET /families/join/:code`, `GET /families/:id`, `PUT /families/:id`
  - New `worker/src/db.ts` — typed D1 queries (`insertFamily`, `selectByJoinCode`, `selectById`, `updateData`)
  - New `worker/schema.sql` — one table: `families (id, join_code, secret, data, updated_at)`
  - Auth: random 32-byte secret generated at family creation; stored in `localStorage`; sent as `Bearer` token on writes
  - `worker/wrangler.toml` + `package.json` + `tsconfig.json` — ready to `wrangler deploy`

- **`core/api/` added** (replaces `core/drive/`)
  - `client.ts` — `createFamily()`, `fetchByJoinCode()`, `pullFamily()`, `pushFamily()`, `ApiError`
  - `credentials.ts` — `saveCredentials()`, `loadCredentials()`, `clearCredentials()`

- **`core/auth/` rewritten** — now stores `{ familyId, secret }` instead of Google tokens
  - `AuthStatus`: `'unknown' | 'connected' | 'disconnected' | 'error'`
  - `hydrate()` reads credentials from localStorage on app start → instant `'connected'` state if family exists
  - No token expiry: credentials are valid forever

- **`core/sync/engine.ts` rewritten** — no access token argument
  - `sync()` and `schedulePush()` take no arguments; read credentials from auth store internally
  - Replaces `pullDriveFile`/`pushDriveFile` with `pullFamily`/`pushFamily`

- **`core/store/appStore.ts` updated**
  - `initFamily()` / `joinFamily()` no longer take `accessToken` params
  - `initFamily` creates family on Worker, saves credentials, falls back to local-only if Worker unavailable
  - `joinFamily` fetches family + credentials from Worker by join code
  - `schedulePush()` called without token argument throughout

- **Onboarding simplified** — Google Sign-In step removed
  - `FamilySetup.tsx`: 3 steps → 2 steps (details → done; no auth step)
  - `JoinFamily.tsx`: 3 steps → 2 steps (code → syncing; no auth step)

- **Parent screens updated** — `HAS_AUTH` / `'authenticated'` → `HAS_WORKER` / `'connected'`
  - Affected: `TaskFormScreen`, `ManageRewardsScreen`, `ManageKidsScreen`, `BonusComposer`, `DemeritComposer`, `ParentDashboard`
  - Reconnect Drive banner removed; replaced with simple offline warning

- **Date window extended** — `buildDateWindow()` now generates past 30 days **+ future 14 days**
  - Future task instances are pre-generated on app open
  - One-time tasks and weekly tasks show up in upcoming views before the day arrives

- **`.env.example` updated** — `VITE_GOOGLE_CLIENT_ID` → `VITE_WORKER_URL`

- **Tests updated** — 151 passing; engine tests now mock `apiModule` instead of `driveModule`

**Tests:** 151 passing

---

## 2026.05.26.4 — Task recurrence: weekly (days-of-week) + one-time

**Phase:** Post-launch

**What's in this build:**

- **`Recurrence` union type added to domain** (`types.ts`)
  - `{ type: 'daily' }` — every day (existing behaviour, backward compat)
  - `{ type: 'weekly'; days: DayOfWeek[] }` — specific days, e.g. `[0,6]` = weekends, `[1,2,3,4,5]` = weekdays
  - `{ type: 'once'; date: ISODate }` — single occurrence on an exact date
  - `DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6` (0 = Sunday, matches `Date.getDay()`)

- **`generateInstances()` updated** (`tasks.ts`)
  - Calls new `matchesRecurrence(date, recurrence)` before creating each instance
  - Daily: all dates pass (unchanged); Weekly: only dates whose `.getDay()` is in `days`; Once: only the exact target date

- **`validateDriveFile()` updated** (`validate.ts`)
  - Accepts all three recurrence shapes
  - Backward compat: plain string `"daily"` (old Drive files) migrated to `{ type: 'daily' }` automatically
  - Throws descriptively on unknown type, empty `days` array, missing `date`

- **`createSchedule()` factory default** changed from `recurrence: 'daily'` to `recurrence: { type: 'daily' }`

- **`ScheduleSlot` type updated** (`appStore.ts`) — added `recurrence: Recurrence`; passed through in `createTask` / `updateTask`

- **Task form UI** (`TaskFormScreen.tsx`)
  - Each schedule slot now has a **Repeats** segmented control: Every day / Days of week / One time
  - *Days of week*: Su Mo Tu We Th Fr Sa toggle buttons; at least one must stay selected
  - *One time*: native `<input type="date">` date picker; defaults to today
  - Defaults to Mon–Fri when switching to weekly, today when switching to once
  - All-day toggle and time-window still apply for all recurrence types

**Tests:** 152 passing (+14 new recurrence tests)

---

## 2026.05.26.3 — Online-first parent writes; reverted DEF-011 backend complexity

**Phase:** Post-launch

**What's in this build:**

- **DEF-011 resolved — approach changed to online-first mutations (simpler, more robust)**

  DEF-011 described locally-created structural data (rewards, tasks) being wiped when a dirty device reconnected Drive and pulled. The previous build (2026.05.26.2) fixed this with a `preserveLocalOrphans` flag in `seedFromDriveFile`. That fix is correct but complex — it requires the sync engine to reason about whether to protect local orphans on every pull.

  A simpler and more correct solution: **all parent writes are online-only**. If Google Drive is not connected, parents cannot create, edit, or delete anything. This means there can never be unpushed structural orphans — every write is immediately synced, so Drive is always authoritative.

  **Changes:**
  - `seed.ts`: reverted `SeedOptions` / `preserveLocalOrphans` branching. Structural stores (profiles, taskTemplates, taskSchedules, rewards) are always full-replace (Drive authoritative).
  - `engine.ts`: reverted `preserveLocalOrphans` pass-through. `seedFromDriveFile(file)` called directly.
  - All 5 parent write screens now show an offline banner and disable all write actions when Drive is not connected (`HAS_AUTH && status !== 'authenticated'`):
    - `TaskFormScreen.tsx` — Save, Delete disabled
    - `ManageRewardsScreen.tsx` — Save, "+ New Reward", Edit, Delete, Toggle disabled
    - `ManageKidsScreen.tsx` — Save, "+ Add Kid", Edit, Delete disabled
    - `BonusComposer.tsx` — "Give Bonus!" disabled
    - `DemeritComposer.tsx` — "Apply Demerit" disabled
  - Banner text: "☁️ Connect Google Drive to save changes — tap ← Back and use the Reconnect button."
  - Offline banner CSS added to each screen's module (amber #fff3cd, yellow border).

**Build:** 138 unit tests passing (removed 5 preserveLocalOrphans tests — no longer applicable)

---

## 2026.05.26.2 — DEF-011: locally-created data survives pull after auth reconnect

**Phase:** Post-launch

**What's in this build:**
- **DEF-011 closed — rewards/tasks lost when reconnecting Drive after auth expiry**

  **The scenario that exposed this:** Laptop creates rewards → auth expires before push → phone completes a task and pushes (updating `Drive.lastUpdated`) → Laptop reconnects Drive → sync pulls (Drive IS newer, pull is correct) → `seedFromDriveFile` full-replaces rewards with Drive's version (0 rewards) → rewards lost.

  DEF-010 fixed the blind-push race but this is a different failure mode: a correct, legitimate pull that wipes locally-created data that was never pushed because auth was unavailable.

  **Fix — `seedFromDriveFile` now accepts `preserveLocalOrphans` option:**
  - `seed.ts`: Structural stores (profiles, taskTemplates, taskSchedules, rewards) have two behaviours:
    - `preserveLocalOrphans = false` (default): full-replace. Drive is authoritative, parent-deleted items propagate. Used when local is clean (all data was already in Drive).
    - `preserveLocalOrphans = true`: union-merge. Drive items are upserted, local-only items kept. Used when local is dirty — locally-created data that hasn't reached Drive yet is preserved and included in the subsequent push.
  - `engine.ts`: reads `meta.isDirty` before the pull and passes `preserveLocalOrphans: isDirty === true` to `seedFromDriveFile`.

**Build:** 143 unit tests passing

---

## 2026.05.26.1 — DEF-010: sync data-loss race condition fixed

**Phase:** Post-launch

**What's in this build:**
- **DEF-010 closed — sync data loss (rewards/tasks disappearing after cross-device sync)**
  The root cause was a race condition between two independent Drive write paths:
  - `sync()` — pull-then-push, triggered on app open / foreground resume
  - `schedulePush()` / `push()` — debounced blind push, triggered 2 s after any mutation

  A blind push reads stale local IndexedDB (e.g. 0 rewards on the phone) and overwrites Drive with it, *before* the in-flight `sync()` pull has returned with Drive's actual content. Then `sync()` sees `isDirty=false` (set by the push) and skips its own push — leaving Drive with the stale data. The next device to pull loses all parent-created data.

  **Fix 1 — `schedulePush` now triggers a full sync (pull-then-push), not a blind push.**
  `engine.ts`: `schedulePush` timer callback now calls `sync(token)` instead of `push(token)`.
  Every write to Drive is now preceded by a pull, regardless of how it was triggered.
  `push()` is kept for tests / emergency escape hatch only.

  **Fix 2 — `sync()` cancels any pending debounced timer at entry.**
  `engine.ts`: `_cancelPendingPush()` is called at the top of `sync()`. An externally
  triggered sync (from HomeScreen / ParentDashboard) supersedes any pending debounced timer;
  no duplicate sync fires immediately after.

  **Fix 3 — `seedFromDriveFile` union-merges event/completion data instead of full replace.**
  `seed.ts`:
  - `pointsEvents` — never delete local events. Only add Drive events we don't have locally.
    A local event not yet pushed is real data; the old code deleted it on the next pull.
  - `taskInstances` — union: keep all instances from both sides. If Drive has an instance as
    `available` but local has it as `completed`, keep `completed` (child beat the sync).
    Preserve local-only instances (newly generated daily instances, unpushed completions).

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.25.7 — Build number + sync reliability fixes

**Phase:** Post-launch

**What's in this build:**
- **Build number** — Full version string (`2026.05.25.7`) now shown centered under the "⚙️ Parent Mode" button on the profile picker. Driven by `src/version.ts` (updated each build). The old fixed corner overlay (which showed the GitHub run number `21`) is removed.
- **Auto token refresh on boot** — If the stored Google access token is expired when the app opens, the app now attempts a silent GIS token refresh in the background. Previously, expired tokens caused `triggerSync` to silently no-op and the reconnect banner to show — requiring the user to manually tap "Reconnect" every hour. Now the token refreshes invisibly; Drive sync resumes automatically. If the silent refresh fails (revoked grant, signed-out Google account), the reconnect banner still shows as before.
- **Sync engine: persist `lastSyncedAt` after pull** — After a successful Drive pull, `lastSyncedAt` is now written to IndexedDB set to `file.lastUpdated`. Previously this was only written on push. This prevents the engine from comparing stale timestamps on subsequent syncs and unnecessarily re-pulling every time.
- **Sync engine: concurrent sync guard** — Added `_syncInProgress` flag so concurrent `sync()` calls (e.g. mount + visibility change firing together) are no-ops rather than racing.

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.25.6 — Drive sync wired up + sync status in Parent Dashboard

**Phase:** Post-launch

**What's in this build:**
- **Root cause fixed: devices never pulled from Google Drive** — `load()` reads only from local IndexedDB. `triggerSync()` (the hook that actually pulls from Drive) was built but never called anywhere in the UI. So after initial setup, every device was stuck reading its local stale cache — new rewards, tasks, or profiles created on another device were never seen.
  - **Fix:** `HomeScreen` and `ParentDashboard` now call `triggerSync().then(() => load())` on mount and on every foreground resume (visibility change). This pulls the Drive file if it's newer, seeds IndexedDB, then refreshes the Zustand store so the UI updates immediately.
- **Sync status chip in Parent Dashboard header** — Small `☁️ Synced 2 min ago ↻` line below "⚙️ Parent Mode". Only shown when authenticated.
  - Tapping triggers an immediate manual sync + reload.
  - States: `🔄 Syncing…` / `☁️ Synced X ago ↻` / `⚠️ Sync error — tap to retry` / `📵 Offline — will sync when connected`
  - Not shown on child screens — sync happens silently for kids, parents are the ones who care about data freshness.

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.25.5 — All-day tasks + slot validation + CI Node 24 fix

**Phase:** Post-launch

**What's in this build:**
- **All-day task toggle** — Each schedule slot in `TaskFormScreen` now has an "All day" toggle.
  - When enabled, the slot stores `startTime: '00:00'` / `endTime: '23:59'` — the task is available all day and only misses at 23:59.
  - When disabled, the start/end time inputs reappear (defaulting to `07:00–09:00`).
  - On edit-mode load, existing `00:00/23:59` schedules are auto-detected and shown with the toggle pre-enabled.
  - The reminder time input is always visible regardless of all-day state.
- **Slot time validation** — Saving now blocks if any non-all-day slot has end time ≤ start time.
  - Inline error message shown below the slot header: `"Morning" has end time at or before start time. Fix it or turn on All day.`
  - The end time input highlights in red in real time when it violates the constraint.
- **Locked all-day message** — `TaskDetailScreen` now shows `"🔒 Not available yet — this mission opens at midnight!"` for all-day tasks instead of the misleading `"opens at 00:00"`.
- **CI: Node.js 24 opt-in** — Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` env var to the `check` job. Suppresses the Node.js 20 deprecation warnings from `actions/checkout@v4` and `actions/setup-node@v4`. Mandatory before June 2, 2026.

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.25.4 — Missed task UX: clear messaging + section divider

**Phase:** Post-launch

**What's in this build:**
- **Missed task clarity** — Users were confused seeing expired tasks with no explanation of what to do or when they'd return.
  - `HomeScreen`: Missed tasks now appear under a `💨 Missed today — back tomorrow` section divider, visually separated from active missions. Active tasks (available, locked, completed) appear above the line; missed tasks below.
  - `TaskDetailScreen`: Tapping a missed task now shows a clear two-line message — "Today's window has passed" + "A fresh mission appears tomorrow. See you then! 👋" — instead of the vague "Get the next one!" text.
- **No behaviour change** — Missed instances still exist in the DB (required for streak calculation). They generate a fresh instance on the next app open for tomorrow's date. The `homeScreen` filter (`todayISO()`) ensures yesterday's missed tasks never show on subsequent days.

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.25.3 — DEF-008 + DEF-009: task tap + reward claim fixed

**Phase:** Post-launch

**What's in this build:**
- **DEF-008** Task cards unresponsive on child home screen — two root causes fixed:
  1. `TaskCard` was a `div`; changed to `<button type="button">` — ensures reliable touch events on all iOS versions without needing `cursor: pointer` hacks
  2. Only `available` tasks were clickable (other states were dead zones) — now all states navigate to `TaskDetailScreen`; the detail screen shows the appropriate message per state and the COMPLETE button is only visible when `available`
  3. `TaskDetailScreen` had `navigate()` in the render body (same pattern as DEF-004 on HomeScreen) — moved to `useEffect`; added `load()` guard for direct-URL navigation
- **DEF-009** Reward claiming silently did nothing — `redeemReward()` guards on `state.activeChildId` which is only set by `HomeScreen`'s `selectChild()` effect; if `RewardsScreen` was reached without `activeChildId` being set, every claim bailed silently — added `selectChild(childId)` + `load()` in `RewardsScreen`'s `useEffect`
- **Preventive** — added `load()` guards to `StreakScreen` and `AchievementsScreen` (both previously had no data-loading safety net for direct-URL navigation)

**Defect summary:** DEF-001–009 ✅ Closed

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.25.2 — DEF-007: scroll/swipe fixed on all parent screens

**Phase:** Post-launch

**What's in this build:**
- **DEF-007 closed** — Scroll/swipe not working on ParentDashboard, TaskFormScreen, BonusComposer, DemeritComposer, ManageRewardsScreen, ManageKidsScreen.
  - Root cause: 6 screen CSS modules used `min-height: 100%` on `.screen`. A `min-height` container grows to fit content, so the inner `.body { flex: 1; overflow-y: auto }` container also grew — `overflow-y` never triggered. The correct pattern is `height: 100%; overflow: hidden` (caps the screen at viewport height) with `overflow-y: auto` on the scrollable body (so content that exceeds the capped height scrolls).
  - Additional: 5 of the 6 screens were also missing `overflow-y: auto` on `.body` entirely.
  - Fixed: all 6 `.screen` declarations changed to `height: 100%; overflow: hidden`; `overflow-y: auto` added to `.body` where missing.
  - Screens that were already correct (`HomeScreen`, `RewardsScreen`, `StreakScreen`, `AchievementsScreen`) unchanged.

**Defect summary:** DEF-001–007 ✅ Closed

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.25.1 — CI/deploy pipeline fixed + DEF-006 + build badge

**Phase:** Post-launch

**What's in this build:**
- **CI pipeline overhaul** — deploy step was silently skipped on every push since launch (condition checked `refs/heads/main`, branch is `master`). Fixed branch condition; first automated deploy to Cloudflare Pages.
- **Cloudflare account fix** — `CLOUDFLARE_ACCOUNT_ID` secret pointed to wrong account (`dunquekm@gmail.com`) instead of the account where `jitsu-points` lives (`junkinkevin@gmail.com`). Corrected.
- **CI split into two jobs** — `Lint, Test & Build` + `Deploy to Cloudflare Pages` now show separately; failures are isolated. Smoke test added: curls live URL post-deploy, fails CI if not HTTP 200.
- **Node.js 20 → 24** — upgraded across all CI actions; clears deprecation warnings.
- **Build badge** — increased visibility: dark semi-transparent pill background, `opacity: 0.6`, bold — readable on any screen colour.
- **DEF-006** React error #185 on child home screen (real family) — root cause: `selectTodaysTasks` selector used `.filter()` returning a new array reference on every call; Zustand's `useSyncExternalStore` saw an ever-changing snapshot → infinite re-render loop. Fixed by filtering inline in render body instead of via selector.
- **DEF-007** logged — scroll/swipe not working on some screens; under investigation.

**Defect summary:** DEF-001–006 ✅ Closed · DEF-007 🔍 Open

**Build:** 110 modules — 119 unit tests passing

---

## 2026.05.24.3 — Post-launch defect fixes + join code feature

**Phase:** Post-launch

**What's in this build:**
- **DEF-001** Copy join code button silent failure — added "✅ Copied!" 2s feedback + `execCommand` fallback for Safari
- **DEF-002** Scroll/touch gestures broken on all screens — replaced Vite scaffold `index.css` with PWA-appropriate full-screen reset (`html/body/#root` all `height: 100%`)
- **DEF-003** No Google Drive setup option in Parent Mode — "Connect Google Drive" banner now shows when auth `status === 'unknown'` (first visit), not just `'unauthenticated'` (re-connect)
- **DEF-004** React error #185 crash on child home screen — moved `navigate('/')` from render body into `useEffect` (calling router navigation during render causes infinite re-render loop)
- **DEF-005** Join code not accessible after onboarding — added `joinCode` to `AppState`, loaded from `familyMeta` in `load()`; new **Family & Join Code** section in Parent Dashboard with copy button
- **Build number** now displayed in bottom-right corner of every screen (faint monospace label, `dev` locally, GitHub run number in production)
- **CI fixes** — `npm ci` → `npm install` for cross-platform lock file, lint fixes (`const cursor`, `_key` pattern, coverage dir ignore, `set-state-in-effect` rule), Prettier applied to all source files

**DEFECTS.md** created — all 5 defects logged with root cause and fix.

**Build:** 110 modules — 119 unit tests passing

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
