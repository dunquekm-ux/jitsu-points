# Jitsu Points — Defect Log

> **Format:** `## DEF-NNN — Title` / Steps to reproduce / Root cause / Fix / Status
> Discovered during: first real-device test on `jitsu-points.pages.dev` (build `2026.05.24.2`)

---

## DEF-001 — Copy join code button gives no feedback / silently fails

**Severity:** Medium  
**Screen:** FamilySetup — Step 3 (join code display)  
**Status:** ✅ Closed — Fixed in build 2026.05.24.3

**Steps to reproduce:**
1. Complete family setup through to Step 3
2. Tap the "📋 Copy" button
3. No visual confirmation; unclear if clipboard was written

**Root cause:**
`navigator.clipboard.writeText()` is called with `.catch(() => {})` — errors are silently swallowed and there is no success state. User has no feedback either way.

**Fix:**
Added `copied` boolean state. Button label switches to "✅ Copied!" for 2 seconds on success. On failure, falls back to `document.execCommand('copy')` via a hidden textarea (Safari fallback).

---

## DEF-002 — Scroll / touch gestures don't work on any screen

**Severity:** High  
**Screen:** All screens  
**Status:** ✅ Closed — Fixed in build 2026.05.24.3

**Steps to reproduce:**
1. Open app on mobile
2. Try to scroll any screen with content longer than the viewport

**Root cause:**
`app/src/index.css` is the default Vite scaffold CSS — it sets `#root { width: 1126px; min-height: 100svh; }` which is completely wrong for a full-screen mobile PWA. Because `#root` has no explicit height (only `min-height`), child screens using `height: 100%` resolve to `0` and overflow is clipped.

**Fix:**
Replaced `index.css` entirely with PWA-appropriate reset: `html, body, #root` all set to `height: 100%`, `overflow: hidden` (each screen manages its own scroll). Removed desktop-layout styles.

---

## DEF-003 — Parent mode has no way to connect Google Drive on first use

**Severity:** Medium  
**Screen:** ParentDashboard  
**Status:** ✅ Closed — Fixed in build 2026.05.24.3

**Steps to reproduce:**
1. Complete family setup without Google sign-in (local-only mode)
2. Enter Parent Mode
3. No option to connect Google Drive appears

**Root cause:**
The "Reconnect Drive" banner only renders when `status === 'unauthenticated'`. On a fresh install with no prior auth, auth `status` is `'idle'` — the banner condition is never true. No separate "Connect Drive" CTA exists for first-time setup.

**Fix:**
Extended the banner condition to also show when `status === 'idle'`. Changed banner copy to "Connect Google Drive" for idle state and "Drive sync paused — Reconnect" for unauthenticated state.

---

## DEF-004 — App crashes with React error #185 on child home screen

**Severity:** Critical  
**Screen:** HomeScreen (`/child/:childId`)  
**Status:** ✅ Closed — Fixed in build 2026.05.24.3

**Steps to reproduce:**
1. Load demo data
2. Tap a child avatar
3. App crashes: "Unexpected Application Error! Minified React error #185"

**Root cause:**
`HomeScreen.tsx` line 72 calls `navigate('/')` directly during render when `profile` is not found:
```tsx
if (!profile) {
  navigate('/');  // ← illegal: calling navigate during render
  return null;
}
```
Calling `navigate()` during render triggers a router state update, which causes a re-render, which calls `navigate()` again — infinite loop. React error #185 = "Maximum update depth exceeded."

**Fix:**
Moved the guard into a `useEffect`. Component returns the loading spinner while navigation is pending.

---

## DEF-005 — No way to retrieve join code after initial setup

**Severity:** Medium  
**Screen:** ParentDashboard  
**Status:** ✅ Closed — Fixed in build 2026.05.24.3

**Steps to reproduce:**
1. Complete family setup — join code shown once on Step 3
2. Navigate away or close the app
3. Need to add a second device later — no way to see the join code in the UI

**Root cause:**
`joinCode` was stored in `familyMeta` (IndexedDB) but never exposed in the Zustand `AppState` or displayed after onboarding. The only way to retrieve it was via browser DevTools → IndexedDB.

**Fix:**
- Added `joinCode: string` to `AppState` in `appStore.ts`, loaded alongside `familyName` in `load()`
- Added **Family & Join Code** section to `ParentDashboard` — shows family name, join code in a styled dashed box, and a copy button with "✅ Copied!" feedback
- Section only renders when `joinCode` is non-empty (hidden in demo / local-only mode)

---

## DEF-006 — React error #185 on child home screen (persists after DEF-004 fix)

**Severity:** Critical  
**Screen:** HomeScreen (`/child/:childId`)  
**Status:** ✅ Closed — Fixed in build 2026.05.25.15

**Steps to reproduce:**
1. Set up a real family (any method)
2. Tap a child avatar on the Profile Picker
3. App crashes: "Unexpected Application Error! Minified React error #185"

**Root cause:**
`HomeScreen.tsx` subscribed to the store using a selector that returns a new array reference on every call:
```tsx
const taskInstances = useAppStore((s) => selectTodaysTasks(s, childId ?? ''));
// selectTodaysTasks uses .filter() — always returns a new array reference
```
Zustand's `useSyncExternalStore` compares selector snapshots with `Object.is`. Since a new array is never `===` an old array, React saw the snapshot as constantly changing and kept scheduling re-renders → infinite loop → error #185.

DEF-004 fixed a separate but identical-looking crash (navigate during render). This is a different root cause that produced the same error code.

**Fix:**
Removed the selector-based subscription for `taskInstances`. Instead:
- Added `taskInstances` (as `allTaskInstances`) to the regular full-store destructure
- Filtered inline in the component body: `allTaskInstances.filter(i => i.childId === childId && i.date === todayISO())`
- Kept `selectChildPoints` and `selectChildLevel` as selectors — they return numbers (primitives), which are safe for `Object.is` comparison

---

## DEF-009 — Reward claiming silently does nothing

**Severity:** High  
**Screen:** RewardsScreen (`/child/:childId/rewards`)  
**Status:** ✅ Closed — Fixed in build 2026.05.25.3

**Steps to reproduce:**
1. Navigate to a child's Rewards Vault via the TabBar
2. Tap "Claim" on an affordable reward
3. Confirm dialog appears; tap "Yes, claim!"
4. Nothing happens — points are not deducted, no success animation

**Root cause:**
`redeemReward()` in `appStore.ts` guards with `if (!reward || !state.activeChildId) return`. `activeChildId` is set by `selectChild(childId)`, which is only called from `HomeScreen`'s `useEffect`. If the user navigates to `/rewards` via the TabBar (coming from HomeScreen, which DOES call `selectChild`), `activeChildId` is set and works. However if the user opens the app fresh to the rewards URL, or if the store state was reset, `activeChildId` is `null` and every claim silently bails out. Additionally, RewardsScreen never called `load()`, so fresh-navigation could also result in empty reward/points data.

**Fix:**
Added `useEffect` to `RewardsScreen` that calls both `load()` (if not yet loaded) and `selectChild(childId)` — mirroring the pattern already used in `HomeScreen`. This ensures `activeChildId` is always set before any redemption attempt.

---

## DEF-008 — Tasks cannot be selected / tapped on child home screen

**Severity:** High  
**Screen:** HomeScreen (`/child/:childId`), TaskDetailScreen  
**Status:** ✅ Closed — Fixed in build 2026.05.25.3

**Steps to reproduce:**
1. Navigate to a child's home screen
2. Tap any task card
3. Nothing happens (or the task detail screen flashes and immediately navigates back)

**Root cause — two compounding bugs:**

**Bug A — Only `available` tasks were tappable.**
`TaskCard` set `isClickable = instance.state === 'available'` and suppressed the `onClick` for all other states. Tasks in `locked`, `missed`, or `completed` state visually appeared as dead zones — tapping them did nothing. Users expected to be able to tap any task to see its details.

**Bug B — `navigate()` called during render in `TaskDetailScreen` (DEF-004 pattern).**
```tsx
if (!instance || !template || !schedule) {
  navigate(`/child/${childId}`);  // ← illegal: navigate during render
  return null;
}
```
This is the same bug fixed in `HomeScreen` as DEF-004. If triggered (e.g. data not yet loaded when the component mounts), it causes immediate navigation back, making it appear as though tapping a task does nothing.

**Bug C — `TaskCard` used a `div` with `onClick`.**
On some iOS versions, non-native-interactive elements (`div`) require `cursor: pointer` to receive click events inside scroll containers. While `.clickable { cursor: pointer }` was present, a native `<button>` is more reliable across all browsers and iOS versions.

**Fix:**
- `TaskCard.tsx` — Changed `div` to `<button type="button">`. Removed `isClickable` guard — all task states now navigate to TaskDetailScreen. Removed `.clickable` CSS class (replaced with direct `.card` styles).
- `TaskDetailScreen.tsx` — Moved `navigate()` to `useEffect` (same fix as DEF-004). Added `load()` guard in case the screen is opened without going through HomeScreen first. Loading state shown while data resolves.
- `StreakScreen.tsx`, `AchievementsScreen.tsx` — Added `load()` guard (preventive — same pattern).

---

## DEF-007 — Scroll / swipe still not working on some screens

**Severity:** High  
**Screen:** ParentDashboard, TaskFormScreen, BonusComposer, DemeritComposer, ManageRewardsScreen, ManageKidsScreen  
**Status:** ✅ Closed — Fixed in build 2026.05.25.2

**Steps to reproduce:**
1. Open app on a real device
2. Navigate to any parent screen with content longer than the viewport
3. Content below the fold is not reachable by swipe/scroll gesture

**Root cause:**
Six screen CSS modules used `min-height: 100%` on `.screen` instead of `height: 100%; overflow: hidden`. With `min-height`, the `.screen` flex container grows to fit its content rather than being capped at the viewport height. As a result, the inner `.body { flex: 1; overflow-y: auto }` container also grew to fit its content — its height was never less than its content height, so `overflow-y: auto` never triggered. The effective scroll target was the browser viewport, but with `html, body { height: 100% }` there was no working scroll mechanism.

Additionally, TaskFormScreen, BonusComposer, DemeritComposer, ManageRewardsScreen, and ManageKidsScreen were missing `overflow-y: auto` on `.body` entirely — a second compounding bug.

`HomeScreen`, `RewardsScreen`, `StreakScreen`, and `AchievementsScreen` used the correct `height: 100%; overflow: hidden` pattern throughout and scrolled correctly; this is why DEF-007 appeared on some screens but not others.

**Fix:**
All six broken screens updated in their CSS modules:
- `.screen`: `min-height: 100%` → `height: 100%; overflow: hidden`
- `.body`: added `overflow-y: auto` (where missing)

Affected files:
- `app/src/features/parent/ParentDashboard.module.css`
- `app/src/features/tasks/TaskFormScreen.module.css`
- `app/src/features/parent/BonusComposer.module.css`
- `app/src/features/parent/DemeritComposer.module.css`
- `app/src/features/rewards/ManageRewardsScreen.module.css`
- `app/src/features/profiles/ManageKidsScreen.module.css`

---
