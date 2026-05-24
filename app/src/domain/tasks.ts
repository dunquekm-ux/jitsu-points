/**
 * Task state machine and instance generation — pure functions.
 * No side effects, no imports from outside domain/.
 */
import type { TaskInstance, TaskTemplate, TaskSchedule, TaskState, ISODate } from './types';
import { generateId } from './id';

// ─── State Machine ───────────────────────────────────────────────────────────

/**
 * Resolve the correct task state for an instance given the current time.
 * Completed state is terminal — once completed it stays completed.
 * Early completion (before startTime) is allowed only if the template sets
 * allowEarlyCompletion=true — callers should check that before calling complete().
 */
export function resolveTaskState(
  instance: TaskInstance,
  schedule: TaskSchedule,
  now: Date,
): TaskState {
  if (instance.state === 'completed') return 'completed';

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);

  // Parse the instance date as local midnight
  const [year, month, day] = instance.date.split('-').map(Number);
  const start = new Date(year, month - 1, day, startH, startM, 0, 0);
  const end = new Date(year, month - 1, day, endH, endM, 0, 0);

  if (now < start) return 'locked';
  if (now > end) return 'missed';
  return 'available';
}

/**
 * Recalculate states for a list of instances.
 * Run on app open and on visibilitychange (foreground resume).
 */
export function recalculateInstanceStates(
  instances: TaskInstance[],
  schedules: Map<string, TaskSchedule>,
  now: Date,
): TaskInstance[] {
  return instances.map(inst => {
    const schedule = schedules.get(inst.scheduleId);
    if (!schedule) return inst;
    const state = resolveTaskState(inst, schedule, now);
    return state === inst.state ? inst : { ...inst, state };
  });
}

// ─── Instance Generation ─────────────────────────────────────────────────────

/**
 * Generate the ISO date string for today in local time.
 */
export function todayISO(): ISODate {
  const d = new Date();
  return dateToISO(d);
}

export function dateToISO(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generate an array of ISO date strings for the past N days (inclusive of today).
 * Used to seed instances for streak calculation.
 */
export function dateRange(today: ISODate, days: number): ISODate[] {
  const [y, m, d] = today.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const result: ISODate[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - i);
    result.push(dateToISO(dt));
  }
  return result;
}

// ─── Instance Generator ──────────────────────────────────────────────────────

/**
 * Generate TaskInstance records for a template+schedule pair across a set of dates.
 *
 * - Only generates instances for dates that don't already have one (idempotent).
 * - Initial state is resolved via `resolveTaskState` using the provided `now`.
 * - Call this on app open for today + the rolling streak window (e.g. 30 days back).
 *
 * @param template   The TaskTemplate to generate instances for.
 * @param schedule   The TaskSchedule that defines the time window.
 * @param dates      Array of ISO date strings to generate instances for.
 * @param existing   Existing instances to skip (prevents duplicates).
 * @param now        Current time used to set the initial state.
 */
export function generateInstances(
  template: TaskTemplate,
  schedule: TaskSchedule,
  dates: ISODate[],
  existing: TaskInstance[],
  now: Date,
): TaskInstance[] {
  // Build a set of dates that already have an instance for this schedule
  const existingKeys = new Set(
    existing
      .filter(i => i.scheduleId === schedule.id && i.templateId === template.id)
      .map(i => i.date),
  );

  const newInstances: TaskInstance[] = [];

  for (const date of dates) {
    if (existingKeys.has(date)) continue;

    const inst: TaskInstance = {
      id: generateId(),
      templateId: template.id,
      scheduleId: schedule.id,
      childId: template.assignedChildId,
      date,
      state: 'locked', // will be resolved below
      completedAt: null,
      selfiePhotoPath: null,
    };

    inst.state = resolveTaskState(inst, schedule, now);
    newInstances.push(inst);
  }

  return newInstances;
}

// ─── Streak ──────────────────────────────────────────────────────────────────

/**
 * Calculate the current consecutive-days streak for a child.
 *
 * Rules:
 * - A day counts if ALL TaskInstances for that child on that date are 'completed'.
 * - A day with NO instances scheduled does NOT break the streak.
 * - Streak is the count of consecutive days ending today or yesterday.
 * - Returns 0 if no streak.
 */
export function calculateStreak(
  instances: TaskInstance[],
  childId: string,
  today: ISODate,
): number {
  // Group by date, child-filtered
  const childInstances = instances.filter(i => i.childId === childId);
  const byDate = new Map<ISODate, TaskInstance[]>();
  for (const inst of childInstances) {
    const arr = byDate.get(inst.date) ?? [];
    arr.push(inst);
    byDate.set(inst.date, arr);
  }

  // Walk backwards from today
  const [y, m, d] = today.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const dateStr = dateToISO(cursor);
    const dayInstances = byDate.get(dateStr);

    if (!dayInstances || dayInstances.length === 0) {
      // No tasks scheduled this day — skip (doesn't break streak)
      // But only skip if we haven't started counting yet or it's today/yesterday
      if (streak === 0 && i < 2) {
        // Haven't started yet; allow today/yesterday gap
      } else if (streak > 0) {
        // Mid-streak gap with no tasks — allowed
      } else {
        // Nothing found on lookback day, stop
        break;
      }
    } else {
      const allCompleted = dayInstances.every(inst => inst.state === 'completed');
      if (allCompleted) {
        streak++;
      } else {
        break;
      }
    }

    // Move to previous day
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
