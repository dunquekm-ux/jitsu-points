/**
 * Local notification scheduling — Phase 6.
 *
 * Notifications are scheduled with setTimeout in the main thread.
 * When the timer fires, showNotification() delegates to the service worker
 * (works when the PWA is backgrounded but still alive).
 * Falls back to the Notification constructor in dev/no-SW contexts.
 *
 * rescheduleAllReminders() should be called:
 *   • on every app open (App.tsx useEffect)
 *   • on visibilitychange (foreground resume)
 *   • after task mutations (automatically via store subscription in App.tsx)
 *
 * Reminders only fire if the app has been opened at least once that day —
 * consistent with the foreground-only model in ADR-005.
 */

import type { TaskSchedule, TaskTemplate, TaskInstance } from '../../domain';

// ── Internal state ─────────────────────────────────────────────────────────────

/** scheduleId+date → active window.setTimeout handle */
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ── Permission ─────────────────────────────────────────────────────────────────

/** True when the Notifications API is available in this environment. */
export function canUseNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermissionStatus(): NotificationPermission {
  if (!canUseNotifications()) return 'denied';
  return Notification.permission;
}

/**
 * Prompt the user for notification permission.
 * Returns true if permission is (or becomes) granted.
 * Call this contextually — e.g. when the parent saves a task with a reminder.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!canUseNotifications()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ── Display ────────────────────────────────────────────────────────────────────

async function showNotification(title: string, body: string): Promise<void> {
  if (Notification.permission !== 'granted') return;
  try {
    // Preferred: delegate to SW — shows even when the tab is in the background
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `jitsu-${title}`, // dedup: only one reminder per task title at a time
    });
  } catch {
    // Fallback: Notification constructor — works on localhost / no-SW builds
    try {
      new Notification(title, { body, icon: '/pwa-192x192.png' });
    } catch {
      // Silently ignore — API unavailable or permission revoked mid-session
    }
  }
}

// ── Schedule / Cancel ──────────────────────────────────────────────────────────

/**
 * Schedule a single notification.
 * Scheduling the same key again cancels and replaces the previous timer.
 *
 * @param key     Unique identifier (use `${scheduleId}-${date}`)
 * @param title   Notification title
 * @param body    Notification body text
 * @param fireAt  When to show the notification
 */
export function scheduleReminder(
  key: string,
  title: string,
  body: string,
  fireAt: Date,
): void {
  cancelReminder(key);

  const msUntilFire = fireAt.getTime() - Date.now();
  if (msUntilFire <= 0) return; // already past — don't schedule

  const handle = setTimeout(() => {
    pendingTimers.delete(key);
    void showNotification(title, body);
  }, msUntilFire);

  pendingTimers.set(key, handle);
}

export function cancelReminder(key: string): void {
  const handle = pendingTimers.get(key);
  if (handle !== undefined) {
    clearTimeout(handle);
    pendingTimers.delete(key);
  }
}

export function cancelAllReminders(): void {
  for (const handle of pendingTimers.values()) {
    clearTimeout(handle);
  }
  pendingTimers.clear();
}

// ── Reschedule all for today ───────────────────────────────────────────────────

/**
 * Cancel all pending timers and re-register every reminder for today that:
 *  • has a reminderTime set on its schedule
 *  • has a TaskInstance that is NOT yet completed or missed
 *  • fires in the future
 *
 * Safe to call frequently — cheap (just clears and re-sets timeouts).
 *
 * @param schedules   All task schedules from the store
 * @param templates   All task templates map (id → template) from the store
 * @param instances   All task instances from the store
 * @param todayStr    Today's date as "YYYY-MM-DD"
 */
export function rescheduleAllReminders(
  schedules: TaskSchedule[],
  templates: Record<string, TaskTemplate>,
  instances: TaskInstance[],
  todayStr: string,
): void {
  if (getPermissionStatus() !== 'granted') return;

  cancelAllReminders();

  const now = new Date();
  const todayInstances = instances.filter(i => i.date === todayStr);

  for (const schedule of schedules) {
    if (!schedule.reminderTime) continue;

    const template = templates[schedule.taskTemplateId];
    if (!template) continue;

    // Find this schedule's instance for today
    const instance = todayInstances.find(
      i => i.scheduleId === schedule.id && i.templateId === schedule.taskTemplateId,
    );

    // Skip if the task is already done or past
    if (instance?.state === 'completed' || instance?.state === 'missed') continue;

    // Build the exact fire time from today's date + reminderTime
    const [h, m] = schedule.reminderTime.split(':').map(Number);
    const fireAt = new Date(todayStr + 'T00:00:00');
    fireAt.setHours(h, m, 0, 0);

    if (fireAt <= now) continue; // already past — don't schedule

    scheduleReminder(
      `${schedule.id}-${todayStr}`,
      '🥷 Jitsu Mission Ready!',
      `${template.title} — +${template.points} points!`,
      fireAt,
    );
  }
}
