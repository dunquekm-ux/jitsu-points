/**
 * useSync — React hook exposing sync status + manual trigger.
 * Components use this to show sync indicators and trigger syncs on app open.
 */
import { useCallback } from 'react';
import { useSyncStore } from './store';
import { sync } from './engine';
import { useAuthStore, selectAccessToken } from '../auth';

export interface UseSyncReturn {
  status: ReturnType<typeof useSyncStore.getState>['status'];
  lastSyncedAt: string | null;
  error: string | null;
  /** Trigger an immediate sync. No-op if not authenticated. */
  triggerSync: () => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const error = useSyncStore((s) => s.error);
  const accessToken = useAuthStore(selectAccessToken);

  const triggerSync = useCallback(async () => {
    if (!accessToken) return;
    await sync(accessToken);
  }, [accessToken]);

  return { status, lastSyncedAt, error, triggerSync };
}
