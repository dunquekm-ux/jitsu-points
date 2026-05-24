import { useEffect } from 'react';
import { applyTheme, getStoredTheme } from './core/theme';
import { useAuthStore } from './core/auth/store';
import { useAppStore } from './core/store/appStore';
import { rescheduleAllReminders } from './core/notifications';
import AppRouter from './core/router';
import IOSInstallBanner from './shared/components/IOSInstallBanner';
import AndroidInstallBanner from './shared/components/AndroidInstallBanner';
import { todayISO } from './domain';
import './core/theme/tokens.css';

const BUILD = import.meta.env.VITE_BUILD_NUMBER ?? 'dev';

export default function App() {
  const { isLoaded, taskSchedules, taskTemplates, taskInstances } = useAppStore();

  // ── Boot: theme, auth, data ───────────────────────────────────────────────
  useEffect(() => {
    // Apply saved theme before first paint
    applyTheme(getStoredTheme());

    // Hydrate auth tokens from localStorage (silent, no UI)
    useAuthStore.getState().hydrate();

    // Load all app data from IndexedDB
    useAppStore.getState().load();

    // Recalculate task states (and reschedule reminders via the effect below)
    // whenever the tab regains focus after being backgrounded
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        useAppStore.getState().load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── Notifications: re-register today's reminders after any data change ───
  // Runs on first load and whenever tasks/schedules change (e.g. after createTask).
  // rescheduleAllReminders() is cheap — it just clears and re-sets timeouts.
  useEffect(() => {
    if (!isLoaded) return;
    rescheduleAllReminders(Object.values(taskSchedules), taskTemplates, taskInstances, todayISO());
  }, [isLoaded, taskSchedules, taskTemplates, taskInstances]);

  return (
    <>
      <AppRouter />
      {/* iOS Safari: guides "Add to Home Screen" for push notifications */}
      <IOSInstallBanner />
      {/* Android Chrome: branded install prompt using beforeinstallprompt */}
      <AndroidInstallBanner />
      {/* Build number — fixed bottom-right, low opacity, tap to copy */}
      <span
        title={`Build ${BUILD}`}
        style={{
          position: 'fixed',
          bottom: '6px',
          right: '8px',
          fontSize: '10px',
          opacity: 0.3,
          pointerEvents: 'none',
          fontFamily: 'monospace',
          zIndex: 9999,
          userSelect: 'none',
        }}
      >
        {BUILD}
      </span>
    </>
  );
}
