/**
 * Sync engine — coordinates pulling from and pushing to the Cloudflare Worker.
 *
 * Strategy:
 *   Pull:  Worker updatedAt > local lastSyncedAt → replace local with Worker data
 *   Push:  local isDirty → serialize local DB → PUT to Worker
 *
 * Credentials are read directly from the auth store; callers don't pass tokens.
 */
import { seedFromDriveFile } from '../db/seed';
import { serializeToFile } from '../db/serialize';
import { db } from '../db';
import { pullFamily, pushFamily, ApiError } from '../api';
import { useAuthStore } from '../auth/store';
import { useSyncStore } from './store';

export interface SyncResult {
  pulled: boolean;
  pushed: boolean;
}

/**
 * Decide whether the Worker data is newer than our local cache.
 * Returns true if we should replace local with Worker data.
 */
export function shouldPull(workerUpdatedAt: string, localLastSyncedAt: string | null): boolean {
  if (!localLastSyncedAt) return true; // First sync on this device
  return new Date(workerUpdatedAt) > new Date(localLastSyncedAt);
}

// Guard against concurrent sync runs (e.g. mount + visibility change firing together)
let _syncInProgress = false;

/**
 * Run a full sync cycle:
 *   1. Cancel any pending debounced push (this sync covers it)
 *   2. Pull from Worker if Worker data is newer
 *   3. Push to Worker if local has changes
 *
 * Safe to call on every app open — exits early if nothing to do.
 * Concurrent calls are no-ops (only one sync runs at a time).
 * No credentials needed as argument — reads from auth store.
 */
export async function sync(): Promise<SyncResult> {
  _cancelPendingPush();

  if (_syncInProgress) return { pulled: false, pushed: false };
  _syncInProgress = true;

  const syncState = useSyncStore.getState();
  syncState.setStatus('syncing');

  const result: SyncResult = { pulled: false, pushed: false };

  // Read credentials from store
  const authState = useAuthStore.getState();
  const creds =
    authState.status === 'connected' && authState.familyId && authState.secret
      ? { familyId: authState.familyId, secret: authState.secret }
      : null;

  if (!creds) {
    // No credentials — nothing to sync (local-only mode or pre-setup)
    syncState.setStatus('idle');
    _syncInProgress = false;
    return result;
  }

  try {
    const meta = await db.syncMeta.get();

    // ── Pull ───────────────────────────────────────────────────────────────
    const pulled = await pullFamily(creds.familyId, creds.secret);
    if (pulled) {
      if (shouldPull(pulled.updatedAt, meta?.lastSyncedAt ?? null)) {
        await seedFromDriveFile(pulled.file);
        await db.syncMeta.set({
          driveFileId: null, // not used in the Worker model; kept for schema compat
          lastSyncedAt: pulled.updatedAt,
          isDirty: (await db.syncMeta.get())?.isDirty ?? true,
        });
        result.pulled = true;
      }
    }

    // ── Push ───────────────────────────────────────────────────────────────
    const freshMeta = await db.syncMeta.get();
    const needsPush = freshMeta?.isDirty !== false;

    if (needsPush) {
      const localFile = await serializeToFile();
      if (localFile) {
        await pushFamily(creds.familyId, creds.secret, localFile);
        await db.syncMeta.set({
          driveFileId: null,
          lastSyncedAt: new Date().toISOString(),
          isDirty: false,
        });
        result.pushed = true;
      }
    }

    syncState.setLastSynced(new Date().toISOString());
  } catch (err) {
    const isNetworkError =
      (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) ||
      (err instanceof ApiError && err.status === undefined);

    if (isNetworkError) {
      syncState.setStatus('offline');
    } else {
      const msg = err instanceof Error ? err.message : 'Unknown sync error';
      syncState.setError(msg);
      console.error('[Sync] error:', err);
    }
    return result;
  } finally {
    _syncInProgress = false;
  }

  return result;
}

/**
 * Mark local data as dirty (has unpushed changes).
 * Call this after every write to IndexedDB.
 */
export async function markDirty(): Promise<void> {
  await db.syncMeta.setDirty(true);
}

// ─── Debounced push ───────────────────────────────────────────────────────────

let _pushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a full sync (pull-then-push) 2 seconds after the last call.
 * Replaces any pending timer — only the latest wins.
 * No token argument needed — credentials read from store inside sync().
 */
export function schedulePush(): void {
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(async () => {
    _pushTimer = null;
    await sync();
  }, 2_000);
}

/** Cancel any pending debounced push — used in tests. */
export function _cancelPendingPush(): void {
  if (_pushTimer) {
    clearTimeout(_pushTimer);
    _pushTimer = null;
  }
}
