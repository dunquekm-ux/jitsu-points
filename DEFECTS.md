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

## DEF-007 — Scroll / swipe still not working on some screens

**Severity:** High  
**Screen:** All screens (suspected)  
**Status:** 🔍 Open — investigating

**Steps to reproduce:**
1. Open app on a real device
2. Navigate to any screen with content longer than the viewport
3. Content below the fold is not reachable by swipe/scroll gesture; must use some other interaction

**Root cause:**
Under investigation. DEF-002 replaced `index.css` with a PWA-appropriate reset (`html/body/#root` at `height: 100%`), which fixed the initial `overflow: hidden` on `#root`. However, individual screen components may still be missing `overflow-y: auto` or `overflow-y: scroll` on their scrollable containers, preventing natural scroll/swipe behaviour on touch devices.

**Fix:**
Pending investigation during next test session. Likely requires auditing screen-level CSS modules to ensure scrollable content areas have explicit `overflow-y: auto` and `touch-action: pan-y`.

---
