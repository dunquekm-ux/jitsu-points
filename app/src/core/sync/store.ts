/**
 * Sync status Zustand store.
 * React components subscribe here to show sync indicators.
 */
import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'unsynced';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null; // ISO timestamp
  error: string | null;

  // Actions
  setStatus: (status: SyncStatus) => void;
  setLastSynced: (ts: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  setStatus: (status) => set({ status }),
  setLastSynced: (ts) => set({ lastSyncedAt: ts, status: 'idle', error: null }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => set({ status: 'idle', error: null }),
}));
