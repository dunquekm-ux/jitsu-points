# Jitsu Points App — Complete Product Requirements & Technical Specification

## Purpose

Jitsu Points is an offline-first gamified responsibility and rewards app for children ages 5–12.

The app helps parents encourage:
- Responsibility
- Routine building
- Positive behavior
- Habit consistency

The app motivates children through:
- Points
- Levels
- Missions
- Rewards
- Animations
- Audio celebrations

---

# Product Goals

## Primary Goals

1. Track daily and recurring tasks
2. Reward positive behavior with points
3. Allow redeemable rewards
4. Encourage routines through gamification
5. Provide immediate feedback and celebration
6. Keep experience fun and emotionally safe

---

# Constraints

| Requirement | Value |
|---|---|
| Cost | Zero cost |
| Backend | None |
| Internet | Not required |
| Data Storage | Local device only |
| PII | None |
| Child Safety | High priority |
| Offline Support | Full support |

---

# User Types

## Parent Admin

Capabilities:
- Create/edit/delete tasks
- Assign tasks
- Configure schedules
- Add bonus points
- Remove points
- Configure rewards
- Configure level progression
- Configure notifications

## Child User

Capabilities:
- View tasks
- Complete tasks
- Earn points
- Redeem rewards
- View progress
- Receive celebrations
- Take selfies
- View achievements

---

# Technical Stack

| Layer | Technology |
|---|---|
| UI | Flutter |
| Storage | Hive |
| State | Riverpod |
| Animation | Lottie |
| Notifications | flutter_local_notifications |
| Audio | audioplayers |

---

# Architecture

## Pattern
Clean Architecture

## Layers
1. Presentation Layer
2. Business Logic Layer
3. Local Storage Layer

---

# Folder Structure

```plaintext
/lib
  /core
  /features
    /auth
    /tasks
    /rewards
    /levels
    /notifications
    /profiles
  /shared
  /services
```

---

# Data Models

## Child Profile

```json
{
  "id": "uuid",
  "name": "Emma",
  "avatar": "speed_hero",
  "points": 250,
  "lifetimeXp": 1200,
  "level": 4,
  "currentStreak": 12
}
```

## Task Template

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

## Task Schedule

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

## Reward

```json
{
  "id": "uuid",
  "title": "Ice Cream",
  "cost": 100,
  "enabled": true
}
```

---

# Points System

| System | Purpose | Can Decrease |
|---|---|---|
| Current Points | Spendable | Yes |
| Lifetime XP | Permanent progress | No |
| Level | Achievement | No |

## Rules
- Current points can decrease
- Lifetime XP never decreases
- Levels never decrease

---

# Task Scheduling

## Important Design

One task template can generate multiple scheduled task instances.

Example:

Task:
```plaintext
Brush Teeth
```

Instances:
```plaintext
Brush Teeth - Morning
Brush Teeth - Evening
```

---

# Task States

| State | Meaning |
|---|---|
| Locked | Not available yet |
| Available | Can complete |
| Completed | Already completed |
| Missed | Expired |

---

# Early Completion

Default:
- Disabled

Optional parent setting:
- Allow early completion

---

# Notifications

Use:
- flutter_local_notifications

Supports:
- Offline reminders
- Task alerts
- Celebration notifications

Example:
```plaintext
🦷 Jitsu Mission Ready!
Brush your teeth for +5 points!
```

---

# Child Workflow

## Login
1. Open app
2. Tap avatar
3. Enter app

## Complete Task
1. View task
2. Tap task
3. Tap COMPLETE
4. Earn points
5. Trigger celebration

## Claim Reward
1. Open rewards
2. Select reward
3. Confirm
4. Deduct current points

---

# Parent Workflow

## Create Task
1. Enter task name
2. Assign points
3. Configure schedules
4. Configure reminders
5. Save

## Add Bonus
1. Enter bonus points
2. Enter reason
3. Save
4. Child receives celebration popup

## Add Demerit
1. Enter deduction
2. Enter reason
3. Save
4. Child receives gentle correction popup

---

# UX Rules

## Bonuses
Should feel:
- Exciting
- Rewarding
- Immediate

## Demerits
Should feel:
- Calm
- Corrective
- Temporary

Avoid:
- Shame
- Angry sounds
- Harsh animations

---

# Selfie Feature

Requirements:
- Local-only storage
- No uploads
- Optional auto-delete after 24h

---

# Offline Strategy

Everything stored locally:
- Tasks
- Rewards
- Points
- Events
- Photos

No cloud required.

---

# MVP Scope

## Must Have
- Profiles
- Tasks
- Rewards
- Levels
- Notifications
- Parent controls
- Offline support

## Nice to Have
- Selfies
- Achievements
- Streaks
- Unlockables

---

# Final UX Philosophy

The app should feel like:
- A mission-based adventure
- Positive reinforcement
- Habit-building through play

Not:
- Punishment software
- A grading system
- A rigid checklist
