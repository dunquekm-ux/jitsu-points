# Jitsu Points — Architecture Decision Records

> **Immutable log.** Append only. Never edit a past entry.
> Format: `## ADR-NNN — Title` / Context / Decision / Consequences

---

## ADR-001 — PWA over Flutter

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Original spec called for Flutter. Flutter is the correct mobile-first framework technically, but distributing an iOS app requires the Apple Developer Program at $99/year, violating the zero-cost constraint.

**Decision:**  
Build as a React Progressive Web App (PWA). Distribute via URL. Install via "Add to Home Screen." No App Store, no developer program fee, no $99/year.

**Consequences:**
- iOS users must use Safari and install to home screen for full PWA features (push notifications require iOS 16.4+)
- No native APIs; Web APIs are sufficient for this app's needs
- Zero distribution cost forever

---

## ADR-002 — Google Drive API over any database service

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Considered Firebase Firestore (free tier has Cloud Functions limitations, forces Blaze plan), Supabase (free projects pause after 7 days inactivity — dealbreaker for a family app used sporadically), and local-only storage (works only on a single device).

**Decision:**  
Use Google Drive API. Store one JSON file (`jitsu-points.json`) in the family's own Google account. Free forever on their existing 15 GB quota. Family data is family-owned. No vendor database, no free-tier cliff, no server to maintain.

**Consequences:**
- Multi-device sync is possible (parent phone + child tablet)
- Entire year of family data < 1 MB vs 15 GB quota — never fills
- Requires Google account (parent only); children never interact with Drive
- Conflict resolution via last-write-wins timestamps (sufficient at family scale)

---

## ADR-003 — PointsEvent ledger over mutable integer balance

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Original spec stored `"points": 250` as a mutable integer on the child profile. This cannot support the activity feed (per-event history) shown in the prototype, and makes it impossible to enforce the lifetime-XP-never-decreases invariant at the data level.

**Decision:**  
Points are never stored as a mutable field. Every point change is a `PointsEvent` with `delta`, `type`, `sourceId`, `note`, `timestamp`. Derived values:
- `currentPoints = sum(events[childId].delta)`
- `lifetimeXp = sum(events[childId].delta > 0)`
- Level is derived from lifetimeXp thresholds

**Consequences:**
- Activity feed is trivially derived from the event list
- Both invariants (current points can decrease; XP/level never decrease) are enforced by the computation, not by guard code
- Slightly more data than a single integer; acceptable given data scale

---

## ADR-004 — TaskInstance model (one per day per schedule)

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Need to support: per-day completion state, streak calculation, missed-task detection, and selfie photos attached to specific completions. A single `TaskTemplate` with a `completed: bool` field cannot represent any of this.

**Decision:**  
One `TaskInstance` per child per schedule per calendar day. Generated on app open for today (and a rolling window for streaks). Stores: `templateId`, `scheduleId`, `childId`, `date`, `state`, `completedAt`, `selfiePhotoPath`.

**Consequences:**
- Streak calculation: count consecutive days where all instances for child are completed
- Missed instances: any instance with `state = available` and `endTime` in the past flips to `missed` on app open
- Data grows over time; prune instances older than 90 days in background

---

## ADR-005 — Foreground-only task state recalculation

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Tasks move `locked → available → missed` based on time windows. Background processing in PWAs is unreliable (browsers suspend service workers). Considered scheduled background sync.

**Decision:**  
Recalculate all task instance states from `Date.now()` on every app open and every foreground resume (`visibilitychange` event). No background processing for MVP.

**Consequences:**
- State is always correct when the app is open — which is when it matters for a chores app
- No background battery drain
- If the app is closed all day, states are stale in IndexedDB until next open; this is acceptable for MVP

---

## ADR-006 — Rive over Lottie for mascot animation

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Both Rive and Lottie render animations from designer-authored files. Lottie plays a single animation file from start to finish (one-shot). The Jitsu mascot has 5 interactive moods (`happy`, `wow`, `calm`, `sleep`, `cheer`) that must switch dynamically based on app events.

**Decision:**  
Use Rive. Rive supports state machines: the designer authors one file with all 5 mood states and the transitions between them. The app triggers mood changes via Rive's state machine API.

**Consequences:**
- Requires Rive designer to author the `.riv` file with state machine
- Rive runtime library added to bundle (~50 KB gzip)
- Lottie is simpler for one-shot animations (confetti etc.) — use CSS animations for those instead

---

## ADR-007 — IndexedDB (via `idb`) as the local storage layer

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Considered `localStorage` (synchronous, 5 MB limit, strings only), `sessionStorage` (cleared on close), raw IndexedDB API (verbose), and the `idb` wrapper.

**Decision:**  
Use `idb` (Jake Archibald's typed wrapper for IndexedDB). Provides a clean async API. IndexedDB supports structured data, 50+ MB storage, and multiple object stores. `idb` adds ~3 KB gzip overhead.

**Consequences:**
- All reads/writes are async (fits React patterns well)
- Works in service worker context for offline queue
- No SQL queries; filter/sort in application code (fine at family data scale)

---

## ADR-008 — Cloudflare Pages for hosting

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Considered Netlify (prior bad experience: platform instability, build minute limits). Considered GitHub Pages (no branch previews, no serverless functions for future use). Considered Vercel (generous but may add complexity).

**Decision:**  
Cloudflare Pages. Free tier: unlimited requests, 500 builds/month, branch preview deployments. No prior bad experience. Wrangler CLI for local testing.

**Consequences:**
- Branch previews on every PR (useful for design review)
- Future: Cloudflare Workers available if a lightweight server function is ever needed (within zero-cost constraint)
- Deploy target: `npm run build` → `wrangler pages deploy dist/`

---

## ADR-009 — No auth/PIN for parent mode (MVP)

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Original open question: do parents need a PIN to enter Parent Mode? In-app PIN adds friction and an extra auth code path to maintain.

**Decision:**  
No PIN for MVP. Parent Mode is entered by tapping a button on the profile picker. Review after real-world usage — add PIN/biometric if families report children entering parent mode accidentally.

**Consequences:**
- Simpler code path
- Motivated children can access parent mode; acceptable risk for MVP
- Revisit before Phase 7 ships if user testing surfaces this as a problem

---

## ADR-010 — Early completion is per-task, disabled by default

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
Option A: global toggle. Option B: per-task. Option C: both.

**Decision:**  
Per-task toggle on `TaskTemplate.allowEarlyCompletion`, defaulting to `false`. Parent explicitly enables it for tasks where early completion makes sense (e.g., "Pack school bag" could be done the night before).

**Consequences:**
- Slightly more config surface than a global toggle
- More intentional — parent thinks about each task
- No "global" setting object needed for this feature

---

## ADR-011 — Selfie auto-delete decision deferred

**Date:** 2026-05-23  
**Status:** Deferred — revisit when selfie feature is built

**Context:**  
Spec says "optional auto-delete after 24h." Open question: who controls the toggle? Options: global app setting, per-child setting, or off by default with parent enabling per-child.

**Decision:**  
Deferred. Decide when the selfie feature implementation begins.

---

## ADR-012 — Local-only mode (no Google Drive) is fully supported

**Date:** 2026-05-23  
**Status:** Accepted

**Context:**  
During Phase 5 onboarding, the FamilySetup and JoinFamily flows require `VITE_GOOGLE_CLIENT_ID` to trigger the GIS popup. Local dev builds and self-hosted instances may not have a client ID configured. Blocking the entire app on Drive auth would break local testing and offline-only households.

**Decision:**  
The app runs in **local-only mode** when `VITE_GOOGLE_CLIENT_ID` is absent or when the parent explicitly skips Google sign-in during FamilySetup. In this mode:
- All data is stored in IndexedDB only.
- Drive push/pull is silently skipped — `syncPush` no-ops when there's no access token.
- The Parent Dashboard shows no "Reconnect Drive" banner (HAS_AUTH guard).
- The "Skip (local only)" link in FamilySetup is surfaced only when `VITE_GOOGLE_CLIENT_ID` is set (so users with auth configured can't accidentally skip it).

**Consequences:**
- Local dev (`npm run dev`) works fully without any environment variables.
- Families who don't want cloud sync can use the app indefinitely without a Google account.
- Multi-device sync is unavailable in local-only mode — acceptable; families must opt into Drive.
- Join code cannot be used to add devices in local-only mode (no Drive to pull from).

---

## ADR-013 — Foreground-only notification model (no push server)

**Date:** 2026-05-24  
**Status:** Accepted

**Context:**  
Phase 6 needed task reminder notifications. Options considered:
- **Web Push with a server** — requires a backend, violates the zero-infrastructure constraint
- **Periodic Background Sync** — unreliable; browsers suspend service workers aggressively; not available on iOS at all
- **`setTimeout` in service worker** — SW is terminated by the browser when idle; unreliable for hours-long delays
- **`setTimeout` in the main thread + `registration.showNotification()`** — reliable while the app/PWA is open; notifications fire even when the tab is backgrounded but alive

**Decision:**  
Use `setTimeout` in the main thread. `rescheduleAllReminders()` re-registers all of today's pending reminders on every app open and foreground resume. `registration.showNotification()` delegates display to the service worker, so notifications fire even when the tab is backgrounded. If the app was never opened that day (e.g. device rebooted and PWA not yet launched), no notifications fire until next open.

**Consequences:**  
- No backend required — zero cost, zero infrastructure
- Notifications work reliably when the PWA has been opened at least once that day (the dominant family use case — parents open the app daily)
- No notifications if the app was never opened after a reboot — acceptable for a family chores app (ADR-005 pattern)
- iOS requires the PWA to be installed to the Home Screen (iOS 16.4+) — surfaced via `IOSInstallBanner`

---

## ADR-014 — Web Audio API synthesized sounds (no audio files)

**Date:** 2026-05-24  
**Status:** Accepted

**Context:**  
Phase 7 added celebration sounds. Options: ship audio files (MP3/OGG) or synthesize with the Web Audio API.

**Decision:**  
Synthesize all sounds at runtime using the Web Audio API. Three synthesized tones:
- Task complete: ascending C5→E5→G5→C6 arpeggio (sine, 80ms spacing)
- Level-up: sustained chord + faster arpeggio (triangle + sine)
- Redemption: descending bell-like chime (sine)

`AudioContext` is lazy-initialized on first call (browsers require user-gesture context creation). All sound functions silently catch errors.

**Consequences:**  
- Zero audio file assets — build size unchanged
- Web Audio is supported in all modern browsers and iOS Safari PWA
- Limited expressiveness vs. a designed sound file — acceptable for MVP
- If a sound designer produces audio files later, swap the `core/audio/index.ts` module without touching call sites

---

## ADR-015 — Security posture review (Phase 7)

**Date:** 2026-05-24  
**Status:** Accepted

**Context:**  
Pre-launch security review of the app's data handling and auth model.

**Findings and decisions:**

| Area | Finding | Decision |
|---|---|---|
| Auth tokens | Google access token + refresh token stored in `localStorage` | Acceptable — same-origin only; no third-party scripts; consistent with Google's own GIS documentation |
| Drive scope | `https://www.googleapis.com/auth/drive.file` — only files created by this app | Correct scope; app cannot read the user's other Drive files |
| PII transmission | Child names and task data go only to the family's own Google Drive | No third-party analytics; no CDN logging of app data; GDPR-compliant by design |
| XSS | All user data rendered via React (auto-escaped) | No `dangerouslySetInnerHTML` used anywhere in the codebase |
| Join code | 6-character animal+number code; not a security token, just a device onboarding hint | Documented in DOMAIN.md — join code is not an ongoing secret |
| Build secrets | `VITE_GOOGLE_CLIENT_ID` is the only secret; it's a public OAuth client ID (not a server secret) | Correct — Google OAuth client IDs are intentionally public |
| CSP | Not yet configured | Post-launch: add `Content-Security-Policy` header via Cloudflare Pages `_headers` file |

**Consequences:**  
- No immediate security actions required before launch
- CSP header noted as a post-launch improvement (low urgency for a family app with no server-side logic)

---
