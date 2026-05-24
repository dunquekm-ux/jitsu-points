# Jitsu Points — Domain Reference

> Canonical types, invariants, and business rules. This file is the source of truth for the domain layer (`src/domain/`). All rules here must be enforced by pure TypeScript functions — zero React, zero browser APIs.

---

## Core Types

### ChildProfile

```typescript
interface ChildProfile {
  id: string;           // UUID
  name: string;
  avatar: AvatarId;
  level: number;        // Derived from lifetimeXp — never store directly
  currentStreak: number; // Derived from TaskInstances — never store directly
}

type AvatarId =
  | 'speed_hero'
  | 'water_pup'
  | 'leaf_ninja'
  | 'flame_fox'
  | 'star_kid'
  | 'moon_cub';
```

> **Invariant:** `level` and `currentStreak` on the profile are display caches only. Recompute them from `PointsEvent[]` and `TaskInstance[]` respectively on every sync and app open.

---

### TaskTemplate

```typescript
interface TaskTemplate {
  id: string;
  title: string;
  icon: string;          // Icon key from icon set
  points: number;        // Must be > 0
  allowEarlyCompletion: boolean; // Default: false
  requiresPhoto: boolean;        // Default: false
  assignedChildId: string;       // FK → ChildProfile.id
}
```

---

### TaskSchedule

```typescript
interface TaskSchedule {
  id: string;
  taskTemplateId: string;  // FK → TaskTemplate.id
  label: string;           // e.g. "Morning", "Evening"
  startTime: string;       // "HH:MM" 24h
  endTime: string;         // "HH:MM" 24h
  reminderTime: string | null; // "HH:MM" 24h, null = no reminder
  recurrence: 'daily';     // Only daily for MVP
}
```

---

### TaskInstance

```typescript
interface TaskInstance {
  id: string;
  templateId: string;     // FK → TaskTemplate.id
  scheduleId: string;     // FK → TaskSchedule.id
  childId: string;        // FK → ChildProfile.id
  date: string;           // "YYYY-MM-DD"
  state: TaskState;
  completedAt: string | null; // ISO timestamp
  selfiePhotoPath: string | null;
}

type TaskState = 'locked' | 'available' | 'completed' | 'missed';
```

---

### PointsEvent

```typescript
interface PointsEvent {
  id: string;
  childId: string;        // FK → ChildProfile.id
  delta: number;          // Positive = earn; Negative = spend/demerit
  type: PointsEventType;
  sourceId: string | null; // TaskInstance.id, Reward.id, or null for bonus/demerit
  note: string | null;
  timestamp: string;      // ISO timestamp
}

type PointsEventType = 'task' | 'reward' | 'bonus' | 'demerit';
```

---

### Reward

```typescript
interface Reward {
  id: string;
  title: string;
  cost: number;  // Must be > 0
  enabled: boolean;
}
```

---

### JitsuDriveFile (root of the Drive JSON)

```typescript
interface JitsuDriveFile {
  familyId: string;
  familyName: string;
  joinCode: string;        // e.g. "TIGER-42"
  lastUpdated: string;     // ISO timestamp — conflict resolution
  profiles: ChildProfile[];
  taskTemplates: TaskTemplate[];
  taskSchedules: TaskSchedule[];
  taskInstances: TaskInstance[];
  rewards: Reward[];
  pointsEvents: PointsEvent[];
  settings: AppSettings;
}

interface AppSettings {
  theme: string;                // Active theme key: 'candy' | 'berry' | 'ocean' | 'sunset'
  notificationsEnabled: boolean;
}
```

---

## Points Rules

| Derived value | Formula | Can decrease? |
|---|---|---|
| Current points | `sum(events.filter(e => e.childId === id).map(e => e.delta))` | **Yes** |
| Lifetime XP | `sum(events.filter(e => e.childId === id && e.delta > 0).map(e => e.delta))` | **Never** |
| Level | `levelFromXp(lifetimeXp)` (see threshold table) | **Never** |

### Level Thresholds (default)

| Level | Lifetime XP required |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 3 | 300 |
| 4 | 600 |
| 5 | 1,000 |
| 6 | 1,500 |
| 7 | 2,200 |
| 8 | 3,000 |
| 9 | 4,000 |
| 10 | 5,500 |

> Thresholds are configurable in `AppSettings` in a future phase; hardcoded for MVP.

### Demerit Cap

Demerits are capped at **−20 points** per event. Domain function:

```typescript
function applyDemerit(requestedAmount: number): number {
  return -Math.min(Math.abs(requestedAmount), 20);
}
```

---

## Task State Machine

```
         now < startTime
  ┌──────────────────────────────┐
  │         LOCKED               │
  └─────────────┬────────────────┘
                │ now >= startTime
                ▼
  ┌─────────────────────────────┐
  │         AVAILABLE            │
  └──────┬──────────────────────┘
         │ completedAt set         │ now > endTime (not completed)
         ▼                         ▼
  ┌────────────┐          ┌──────────────┐
  │ COMPLETED  │          │    MISSED    │
  └────────────┘          └──────────────┘
```

**Transitions run on app open and on `visibilitychange` (foreground resume).** No background processing for MVP.

```typescript
function resolveTaskState(
  instance: TaskInstance,
  schedule: TaskSchedule,
  now: Date
): TaskState {
  if (instance.state === 'completed') return 'completed';
  
  const [sh, sm] = schedule.startTime.split(':').map(Number);
  const [eh, em] = schedule.endTime.split(':').map(Number);
  const instanceDate = new Date(instance.date);
  
  const start = new Date(instanceDate);
  start.setHours(sh, sm, 0, 0);
  
  const end = new Date(instanceDate);
  end.setHours(eh, em, 0, 0);
  
  if (now < start) return 'locked';
  if (now > end) return 'missed';
  return 'available';
}
```

---

## Streak Rules

- A day counts toward the streak if **all** `TaskInstance` records for that child on that date are `completed`.
- Streak is the count of consecutive calendar days (ending today or yesterday) satisfying the above.
- A day with no instances scheduled does **not** break the streak.
- Streak resets to 0 if yesterday had at least one instance and it was not completed.

---

## Join Code Format

- 6 characters: `WORD-NN` (animal word + 2-digit number)
- Examples: `TIGER-42`, `PANDA-07`, `EAGLE-19`
- Generated once per family; stored on `JitsuDriveFile.joinCode`
- Used only during device onboarding — not an ongoing security token

---

## Data Retention

- `TaskInstance` records older than 90 days may be pruned in the background
- `PointsEvent` records are never pruned (they are the source of truth)
- Pruning is advisory and runs only when the app is idle and synced

---
