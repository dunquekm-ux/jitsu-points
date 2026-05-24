# Jitsu Points — Project Documentation

## What This Is

Jitsu Points is a **gamified responsibility and rewards app** for children ages 5–12. Parents create tasks and rewards; kids complete missions, earn points, and redeem prizes. Runs as a PWA — no app store, no backend server, data lives in the family's own Google Drive.

---

## Current State

**Last build:** `2026.05.24.2` — All phases complete (0–7). App is production-ready. Rive mascot integration pending designer asset.

| Artifact | File | Status |
|---|---|---|
| Live interactive prototype | `index.html` | ✅ Complete — open in any browser |
| Requirements spec | `jitsu_points_requirements.md` | ✅ Complete |
| Architecture decisions | `DECISIONS.md` | ✅ 15 ADRs logged (ADR-015: security review) |
| Domain reference | `DOMAIN.md` | ✅ Types, rules, state machine |
| Changelog | `CHANGELOG.md` | ✅ Build log through 2026.05.24.2 |
| PWA app — Phase 0 | `app/` | ✅ Vite + React + TS, design tokens, CI pipeline |
| PWA app — Phase 1 | `app/src/domain/` | ✅ Full domain layer, 79 tests, 100% line/fn coverage |
| PWA app — Phase 2 | `app/src/core/` | ✅ IndexedDB, Auth, Drive, Sync — 119 tests passing |
| PWA app — Phase 3 | `app/src/features/` | ✅ Child UI — 6 screens, design system, overlays |
| PWA app — Phase 4 | `app/src/features/parent/` | ✅ Parent mode — dashboard, task/reward/kid management, bonus/demerit |
| PWA app — Phase 5 | `app/src/features/onboarding/` | ✅ Onboarding — welcome, family setup, join flow, reconnect Drive |
| PWA app — Phase 6 | `app/src/core/notifications/` | ✅ Local notifications — scheduling, permission, iOS/Android install banners |
| PWA app — Phase 7 | `app/src/core/audio/`, `ThemeSwitcher`, Playwright | ✅ Web Audio, theme switcher, install prompts, E2E tests, security ADR |

### Running the prototype

Open `index.html` directly in a browser. All JSX is inlined, React/Babel load from CDN. Internet required only for fonts and CDN scripts on first load.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| UI | **React PWA** | Prototype is already React; zero distribution cost; no $99/yr Apple fee |
| Local storage | **IndexedDB** (via `idb` wrapper) | On-device cache; app works fully offline |
| Cloud sync | **Google Drive API** (one JSON file) | Free forever on family's own quota; no server; no vendor DB |
| Auth | **Google OAuth 2.0** (refresh token, parent only) | One-time sign-in; silent refresh after that |
| State | **React Context + useReducer** (or Zustand) | Sufficient for this scale; no extra framework needed |
| Animations | **CSS animations + Rive** | CSS for confetti/effects; Rive for Jitsu mascot state machine |
| Notifications | **Web Push API** | Built into browsers; works on Android fully; iOS 16.4+ when installed to home screen |
| Audio | **Web Audio API** | Built in; zero dependencies |

**No backend server. No database subscription. No deployment pipeline. Nothing to host.**

---

## Data Architecture

### Two-layer storage

```
┌─────────────────────────────────────┐
│  IndexedDB  (on every device)       │  ← always read/write here
│  Full copy of family data           │  ← app works 100% offline
│  Queued changes when offline        │
└──────────────┬──────────────────────┘
               │  background sync
               │  (on app open + periodic + on change)
┌──────────────▼──────────────────────┐
│  Google Drive  (family's account)   │  ← one JSON file: jitsu-points.json
│  Single source of truth             │  ← ~few KB, never fills quota
│  Free on family's existing quota    │
└─────────────────────────────────────┘
```

### Sync behaviour

- **App open** → pull latest from Drive → merge into IndexedDB
- **Data change** → write to IndexedDB immediately → push to Drive (debounced 2s)
- **No internet** → write to IndexedDB, flag as dirty → sync when connection returns
- **Conflict** → last-write-wins per field using timestamps (sufficient for a family app)

### The Drive file

One file: `jitsu-points.json` in the app's Drive folder. Contains the full app state:

```json
{
  "familyId": "uuid",
  "familyName": "The Smiths",
  "joinCode": "TIGER-42",
  "lastUpdated": "2026-05-23T19:00:00Z",
  "profiles": [...],
  "taskTemplates": [...],
  "taskSchedules": [...],
  "taskInstances": [...],
  "rewards": [...],
  "pointsEvents": [...],
  "settings": {...}
}
```

---

## Auth Model

### Google OAuth — parent only

Children never see a sign-in screen. Google auth is entirely the parent's concern.

**Token behaviour:**
- Parent signs in once → Google issues an **access token** (1hr) + **refresh token** (persistent)
- Refresh token stored in `localStorage` on that device
- Every app open: silent token refresh in background (< 1 second, invisible)
- Children interact only with IndexedDB — never blocked by auth state

**When re-authentication is needed (rare):**

| Trigger | Action |
|---|---|
| App unused > 6 months | Parent sees "Reconnect Drive" prompt; one tap fixes it |
| Parent revokes access manually | Intentional — parent re-connects in settings |
| Browser/PWA data cleared | Parent re-connects; family data restored from Drive |

**Children are never affected by any of the above.** They continue using the local IndexedDB cache. The "Reconnect Drive" prompt only appears in Parent Mode.

### Multi-device join flow

1. Parent sets up on their phone (signs into Google, creates family)
2. Drive file created — join code generated (e.g. `TIGER-42`)
3. On each additional device: open the PWA → enter join code → sign into Google (parent does this once on the device)
4. Device downloads the Drive file into its IndexedDB
5. Child just taps their avatar from then on — no auth, ever

---

## Onboarding Flow

### First-time parent setup (new family)

```
1. Open PWA → "Welcome to Jitsu Points"
2. Tap "Set up our family"
3. Google Sign-In popup (10–60 seconds, once only)
   → Grant: "See, edit, create files in your Google Drive"
4. Enter family name
5. Create first child profile (name + avatar)
6. Optionally add more children
7. View join code ("TIGER-42") — share with other devices
8. → Parent dashboard
```

### Adding a device (child's tablet, second parent)

```
1. Open PWA → "Welcome to Jitsu Points"
2. Tap "Join our family"
3. Enter join code
4. Google Sign-In (parent enters credentials on this device, once)
5. App syncs family data from Drive
6. → Profile picker (child taps their avatar)
```

### Subsequent opens (everyone)

```
Children:   tap avatar → straight into app  (no auth, no wait)
Parents:    tap "Parent Mode" → straight in  (silent token refresh, invisible)
```

---

## Decided: Open Questions

| # | Question | Decision |
|---|---|---|
| Auth/PIN | Do parents need a PIN to enter Parent Mode? | **No auth for now** — profile picker tap only; add later |
| Early completion | Global setting, per-task, or both? | **Per-task toggle**, disabled by default |
| Notification permissions | Ask contextually on first task save with reminder set | See Notifications section |
| Selfie auto-delete | Who controls the 24h auto-delete toggle? | **Deferred** — decide when selfie feature is built |

---

## Constraints — Never Violate

- **Zero infrastructure cost** — no servers, no paid APIs; data lives in family's own Google Drive
- **Children never blocked by auth** — IndexedDB cache means the app always works
- **No PII transmitted** — names/data go only to the family's own Drive; no third-party analytics
- **No level/XP decrease** — current points can go down; lifetime XP and level never do
- **Child safety first** — demerits must feel calm and corrective, never shaming

---

## Data Models

### ChildProfile
```json
{
  "id": "uuid",
  "name": "Emma",
  "avatar": "speed_hero",
  "level": 4,
  "currentStreak": 12
}
```
> Points are never stored on the profile directly — always derived from `pointsEvents`.

### TaskTemplate
```json
{
  "id": "uuid",
  "title": "Brush Teeth",
  "icon": "toothbrush",
  "points": 5,
  "allowEarlyCompletion": false,
  "requiresPhoto": false,
  "assignedChildId": "child_uuid"
}
```

### TaskSchedule
One template generates multiple scheduled instances (e.g. "Brush Teeth – Morning" and "Brush Teeth – Evening").
```json
{
  "id": "uuid",
  "taskTemplateId": "uuid",
  "label": "Morning",
  "startTime": "07:00",
  "endTime": "09:00",
  "reminderTime": "06:45",
  "recurrence": "daily"
}
```

### TaskInstance
Generated daily per schedule. Stores per-day completion state.
```json
{
  "id": "uuid",
  "templateId": "uuid",
  "scheduleId": "uuid",
  "childId": "uuid",
  "date": "2026-05-23",
  "state": "available",
  "completedAt": null,
  "selfiePhotoPath": null
}
```

### PointsEvent
Every change to points — never mutate a balance directly. Current points = sum of events.
```json
{
  "id": "uuid",
  "childId": "uuid",
  "delta": 15,
  "type": "task",
  "sourceId": "taskInstanceId",
  "note": null,
  "timestamp": "2026-05-23T09:14:00Z"
}
```
`type` is one of: `task` | `reward` | `bonus` | `demerit`

### Reward
```json
{
  "id": "uuid",
  "title": "Ice Cream",
  "cost": 100,
  "enabled": true
}
```

---

## Points System Rules

| System | Purpose | Can Decrease? |
|---|---|---|
| Current Points | `pointsEvents.sum(delta)` for this child | **Yes** (redeem, demerit) |
| Lifetime XP | `pointsEvents.filter(delta > 0).sum(delta)` | **Never** |
| Level | Derived from lifetime XP thresholds | **Never** |

Demerits capped at **−20 pts**. Can only reduce current points, never XP or level.

---

## Task States

| State | Meaning |
|---|---|
| `locked` | Time window hasn't opened yet |
| `available` | Ready to complete |
| `completed` | Done for this instance |
| `missed` | Window expired without completion |

**State transitions run on app open and on foreground resume** — no background processing needed. The app recalculates every task instance's correct state from the current time on every open. This is the correct approach for a family app at this scale.

Early completion is **disabled by default** — parent can enable it **per task**.

---

## Key Workflows

### Child: Complete a task
Profile picker → tap avatar → Home → tap available mission → tap **COMPLETE** → confetti + points animation → (optional) victory selfie → back to home

### Child: Claim a reward
Rewards Vault → tap affordable reward → confirm screen → deduct current points → celebration

### Parent: Create a task
Parent Mode → New Task → name + points + schedule slots + reminder times → Save

### Parent: Add bonus
Parent Mode → Give Bonus → amount + reason → Save → child sees excitement popup (+points)

### Parent: Add demerit
Parent Mode → Check-in → amount (capped −20) + reason → Save → child sees calm correction popup

---

## Notifications

Web Push API — entirely on-device, no push server required for local notifications.

**Permission timing:** ask when parent saves a task with a reminder time set. Reason is obvious in that moment.

**iOS:** requires PWA to be installed to home screen (Add to Home Screen). Web push on iOS works from Safari 16.4+.

**Notification payload:**
```js
// Task reminder
{ title: '🦷 Jitsu Mission Ready!', body: 'Brush your teeth for +5 points!' }

// Bonus
{ title: '🎉 Surprise bonus from Mom!', body: '+25 points — check the app!' }
```

**After reboot:** re-schedule all pending notifications on app open by reading task schedules from IndexedDB.

---

## Design System (from prototype)

- **Fonts:** Fredoka (display/headings) + Nunito (body) — Google Fonts
- **Default palette (Candy):** hot pink `#FF4F8B` / sunny yellow `#FFD23F` / mint `#3BCEAC` / sky `#4DA8FF` on cream `#FFF6E8`
- **Themes:** Candy (default), Berry, Ocean, Sunset — defined in `tokens.jsx`
- **Shape language:** large border radii (10–28px), chunky 4–6px offset drop shadows
- **Mascot:** "Jitsu" — geometric ninja, 5 moods: `happy`, `wow`, `calm`, `sleep`, `cheer` → implement in Rive
- **Avatar system:** 6 options (Speed Hero, Water Pup, Leaf Ninja, Flame Fox, Star Kid, Moon Cub)

---

## Folder Structure (as built — Phases 0–5)

```
app/src/
  /core
    /db               ✅ IndexedDB schema (9 stores), queries, seed, serialize
    /drive            ✅ Drive REST client, pullDriveFile, pushDriveFile
    /auth             ✅ GIS wrapper (signIn, silentRefresh), token storage, Zustand store
    /sync             ✅ Sync engine: shouldPull, markDirty, schedulePush, useSync hook
    /store            ✅ appStore.ts — global Zustand store (all read/write actions)
    /notifications    ✅ Local notification scheduling: permission, schedule/cancel, rescheduleAllReminders
    /audio            ✅ Web Audio API: playTaskComplete, playLevelUp, playRedemption (synthesized, zero assets)
    /router           ✅ React Router — 15 routes (child + parent + onboarding)
    /theme            ✅ tokens.css — 4 themes (Candy, Berry, Ocean, Sunset)
  /domain             ✅ Pure TS — types, points, tasks, factories, validate, joincode
  /features
    /onboarding       ✅ WelcomeScreen, FamilySetup (3-step), JoinFamily, ProfilePicker
    /profiles         ✅ ManageKidsScreen (create/edit/delete + avatar picker)
    /tasks            ✅ HomeScreen, TaskDetailScreen, TaskCard, TaskFormScreen
    /rewards          ✅ RewardsScreen, ManageRewardsScreen
    /levels           ✅ StreakScreen (7-day calendar), AchievementsScreen (11 badges)
    /parent           ✅ ParentDashboard, BonusComposer, DemeritComposer
  /shared
    /components       ✅ ChunkyButton, Avatar, PointsBadge, TabBar, JitsuMascot
    /overlays         ✅ CelebrationOverlay, LevelUpOverlay, BonusOverlay, DemeritOverlay
    /mascot           ✅ JitsuMascot.tsx (emoji placeholder; Rive in Phase 7)
  /dev                ✅ demoData.ts (dev-only; dynamic import; tree-shaken in prod)
app/public/
  manifest.json       ✅ PWA manifest
  (sw.js generated by vite-plugin-pwa)
```

---

## Prototype → PWA Implementation Status

| Prototype screen | PWA file | Built |
|---|---|---|
| Welcome / onboarding gate | `features/onboarding/WelcomeScreen.tsx` | ✅ |
| Family setup (3-step) | `features/onboarding/FamilySetup.tsx` | ✅ |
| Join family flow | `features/onboarding/JoinFamily.tsx` | ✅ |
| Profile picker | `features/onboarding/ProfilePicker.tsx` | ✅ |
| Home + task list | `features/tasks/HomeScreen.tsx` | ✅ |
| Task detail + complete | `features/tasks/TaskDetailScreen.tsx` | ✅ |
| Celebration overlay | `shared/overlays/CelebrationOverlay.tsx` | ✅ |
| Level-up overlay | `shared/overlays/LevelUpOverlay.tsx` | ✅ |
| Bonus overlay (child) | `shared/overlays/BonusOverlay.tsx` | ✅ |
| Demerit overlay (child) | `shared/overlays/DemeritOverlay.tsx` | ✅ |
| Rewards vault + redeem | `features/rewards/RewardsScreen.tsx` | ✅ |
| Streak page | `features/levels/StreakScreen.tsx` | ✅ |
| Trophy wall | `features/levels/AchievementsScreen.tsx` | ✅ |
| Parent dashboard | `features/parent/ParentDashboard.tsx` | ✅ |
| Create / edit task | `features/tasks/TaskFormScreen.tsx` | ✅ |
| Manage rewards | `features/rewards/ManageRewardsScreen.tsx` | ✅ |
| Manage kids | `features/profiles/ManageKidsScreen.tsx` | ✅ |
| Bonus composer | `features/parent/BonusComposer.tsx` | ✅ |
| Demerit composer | `features/parent/DemeritComposer.tsx` | ✅ |
| Theme switcher | _(Phase 7)_ | ⬜ |
| Selfie capture | _(Phase 7)_ | ⬜ |
| Demerit composer | `features/parent/DemeritComposer.jsx` |
| **First-run setup** | `features/onboarding/FamilySetup.jsx` |
| **Join family** | `features/onboarding/JoinFamily.jsx` |
| **Google sign-in** | `features/onboarding/GoogleSignIn.jsx` |

---

## MVP Scope

**Must have:** Profiles, Tasks, Rewards, Levels, Parent controls, Google Drive sync, Offline support

**Nice to have:** Notifications, Selfies, Achievements/badges, Streaks, Unlockable cosmetics

---

## Build Plan

### Guiding Principles

1. **Build number every commit** — format `YYYY.MM.DD.N`. Visible in UI (bottom corner tooltip). Logged in `CHANGELOG.md`.
2. **Domain first** — `src/domain/` is pure TypeScript. Zero React. Zero browser APIs. Fully unit-testable.
3. **CSS custom properties only** — no raw hex or magic numbers in components. All tokens in `src/core/theme/tokens.css`.
4. **Vitest coverage gate** — domain layer targets 85% before Phase 3 ships.
5. **Playwright every 4–8 increments** — not every build; catch regressions at phase boundaries.
6. **DECISIONS.md is immutable** — append only. Once logged, an ADR is never edited.
7. **Mock data lives outside `/src`** — seed scripts in `/scripts/seed/`, never imported by production code.
8. **Cloudflare Pages** — not Netlify. Branch previews on every PR.
9. **Retro every 5 builds or 3 active dev days** — whichever comes first.

---

### Phase 0 — Foundation (current)

**Goal:** Working Vite app deployed to Cloudflare Pages. Design tokens. CI pipeline.

| # | Task | Done |
|---|---|---|
| 0.1 | `npm create vite@latest` — React + TypeScript | ✅ |
| 0.2 | ESLint + Prettier config | ✅ |
| 0.3 | Vitest + React Testing Library (39 tests passing) | ✅ |
| 0.4 | CSS custom properties from `tokens.jsx` → `tokens.css` | ✅ |
| 0.5 | Google Fonts (Fredoka + Nunito) in `index.html` | ✅ |
| 0.6 | PWA manifest + base service worker (Vite PWA plugin) | ✅ |
| 0.7 | Cloudflare Pages project + wrangler config | ✅ (config done; deploy on first push) |
| 0.8 | GitHub Actions: lint → test → deploy on push | ✅ |
| 0.9 | Build number injected at build time (`VITE_BUILD_NUMBER`) | ✅ |
| 0.10 | `CHANGELOG.md` entry `2026.05.23.2` | ✅ |

**Exit criteria:** `npm run dev` shows blank app with correct fonts and palette. `npm run build` deploys to Cloudflare Pages URL.

---

### Phase 1 — Domain Layer ✅

**Goal:** All domain types, invariants, and pure functions. No UI. High test coverage.

| # | Task | Done |
|---|---|---|
| 1.1 | Types: `ChildProfile`, `TaskTemplate`, `TaskSchedule`, `TaskInstance`, `PointsEvent`, `Reward` | ✅ |
| 1.2 | Points engine: `currentPoints(events)`, `lifetimeXp(events)`, `level(xp)` | ✅ |
| 1.3 | Task state machine: `resolveTaskState(instance, now)` | ✅ |
| 1.4 | Task instance generator: `generateInstances(template, schedule, dates, existing, now)` | ✅ |
| 1.5 | Streak calculator: `calculateStreak(instances, childId, today)` | ✅ |
| 1.6 | Demerit cap: `clampDemerit(amount)` → max −20 | ✅ |
| 1.7 | Drive file schema: `JitsuDriveFile` type + `validateDriveFile(raw)` | ✅ |
| 1.8 | Factory functions: `createProfile`, `createTaskTemplate`, `createFamilyFile`, etc. | ✅ |
| 1.9 | Vitest suite: 79 tests · 100% line/fn coverage · 95% branch | ✅ |

---

### Phase 2 — Storage Layer ✅

**Goal:** IndexedDB schema + Drive client. App works offline and syncs silently.

| # | Task | Done |
|---|---|---|
| 2.1 | IndexedDB schema via `idb` — 9 stores, compound indexes | ✅ |
| 2.2 | Typed query helpers per store (`db.profiles`, `db.taskInstances`, etc.) | ✅ |
| 2.3 | Google OAuth 2.0 via GIS — sign-in, silent refresh, token storage + Zustand store | ✅ |
| 2.4 | Google Drive REST API v3 client — find/create folder, read/write file | ✅ |
| 2.5 | Sync engine — pull if Drive newer, push debounced 2s, offline detection | ✅ |
| 2.6 | `useSync()` hook — status / lastSyncedAt / triggerSync | ✅ |
| 2.7 | Family join code | ✅ (Phase 1) |
| 2.8 | `seedFromDriveFile()` — Drive pull → IndexedDB (upsert + orphan delete) | ✅ |
| 2.9 | `serializeToFile()` — IndexedDB → JitsuDriveFile for push | ✅ |

---

### Phase 3 — Child Experience

**Goal:** Full child UX — profile picker → tasks → celebrate → rewards. Pixel-perfect against prototype.

| # | Task | Status |
|---|---|---|
| 3.1 | Design system components: `ChunkyButton`, `Card`, `TabBar`, `PointsBadge` | ✅ |
| 3.2 | Profile picker screen | ✅ |
| 3.3 | Home screen + task list (locked / available / completed / missed states) | ✅ |
| 3.4 | Task detail + complete flow | ✅ |
| 3.5 | Confetti + points animation celebration overlay | ✅ |
| 3.6 | Level-up overlay | ✅ |
| 3.7 | Rewards vault + redemption flow | ✅ |
| 3.8 | Streak screen | ✅ |
| 3.9 | Trophy wall (achievements placeholder) | ✅ |
| 3.10 | Jitsu mascot — CSS placeholder until Rive file ready | ✅ |
| 3.11 | Playwright smoke tests: complete task, redeem reward | ⬜ deferred to Phase 7 |

---

### Phase 4 — Parent Experience ✅

**Goal:** Full parent mode — task creation, rewards, bonus/demerit composers.

| # | Task | Status |
|---|---|---|
| 4.1 | Parent dashboard | ✅ |
| 4.2 | Task form: name, points, schedule slots, reminder times | ✅ |
| 4.3 | Manage rewards: create / edit / toggle | ✅ |
| 4.4 | Manage kids: create / edit profiles, avatar picker | ✅ |
| 4.5 | Bonus composer → triggers excitement popup on child's session | ✅ |
| 4.6 | Demerit composer (capped −20) → triggers calm correction popup | ✅ |
| 4.7 | Bonus / demerit overlay on child side | ✅ |

---

### Phase 5 — Onboarding ✅

**Goal:** First-run setup and multi-device join flow.

| # | Task | Status |
|---|---|---|
| 5.1 | Welcome screen — "Set up our family" vs "Join our family" | ✅ |
| 5.2 | Google Sign-In screen (FamilySetup, step 1) | ✅ |
| 5.3 | Family name + first child profile entry | ✅ |
| 5.4 | Join code display and clipboard copy | ✅ |
| 5.5 | Join flow — enter code → Google sign-in → sync | ✅ |
| 5.6 | "Reconnect Drive" prompt (parent mode, token expired) | ✅ |
| 5.7 | Playwright: full onboarding flow | ⬜ deferred to Phase 7 |

---

### Phase 6 — Notifications ✅

**Goal:** Local task reminders. Contextual permission request.

| # | Task | Status |
|---|---|---|
| 6.1 | Notification scheduling module (`core/notifications/index.ts`) — `setTimeout`-based, delegates display to SW | ✅ |
| 6.2 | Permission request tied to first task save with a reminder time (contextual, parent only) | ✅ |
| 6.3 | Re-schedule all notifications on app open and foreground resume (post-reboot recovery) | ✅ |
| 6.4 | iOS install prompt: `IOSInstallBanner` — shown to Safari users; guides "Add to Home Screen" | ✅ |

---

### Phase 7 — Polish & Launch ✅

**Goal:** Production-ready. Audio. Theme switcher. Install prompts. Tests. Security review.

| # | Task | Status |
|---|---|---|
| 7.1 | Mascot CSS enhanced — all 5 moods animated (`happy`, `cheer`, `wow`, `calm`, `sleep`) | ✅ |
| 7.2 | Web Audio API — synthesized sounds for task complete, level-up, reward redemption | ✅ |
| 7.3 | Theme switcher UI in Parent Dashboard — 4 swatches, applies + persists immediately | ✅ |
| 7.4 | PWA install prompts — `AndroidInstallBanner` (`beforeinstallprompt`) + `IOSInstallBanner` (Phase 6) | ✅ |
| 7.5 | Playwright E2E — config, 3 suites, 13 tests (smoke, child flow, parent flow) | ✅ |
| 7.6 | Lighthouse audit | ⬜ Run post-deploy against Cloudflare Pages URL |
| 7.7 | Security review | ✅ ADR-015 logged — no blockers |
| 7.8 | Retro + DECISIONS.md — ADR-013 (notifications), ADR-014 (audio), ADR-015 (security) | ✅ |
| — | **Rive mascot integration** — blocked on `.riv` designer asset; CSS placeholder in place | 🎨 Pending asset |
