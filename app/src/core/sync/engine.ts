/**
 * Sync engine — coordinates pulling from and pushing to Google Drive.
 *
 * Strategy:
 *   Pull:  Drive lastUpdated > local lastSyncedAt → replace local with Drive data
 *   Push:  local isDirty → serialize local DB → write to Drive
 *
 * The engine never touches auth directly; callers pass the access token.
 */
import { seedFromDriveFile } from '../db/seed';
import { serializeToFile } from '../db/serialize';
import { db } from '../db';
import { pullDriveFile, pushDriveFile, DriveError } from '../drive';
import { useSyncStore } from './store';

export interface SyncResult {
  pulled: boolean;
  pushed: boolean;
}

/**
 * Decide whether the Drive file is newer than our local cache.
 * Returns true if we should replace local with Drive data.
 */
export function shouldPull(driveLastUpdated: string, localLastSyncedAt: string | null): boolean {
  if (!localLastSyncedAt) return true; // First sync on this device
  return new Date(driveLastUpdated) > new Date(localLastSyncedAt);
}

// Guard against concurrent sync runs (e.g. mount + visibility change firing together)
let _syncInProgress = false;

/**
 * Run a full sync cycle:
 *   1. Cancel any pending debounced push (this sync covers it)
 *   2. Pull from Drive if Drive is newer
 *   3. Push to Drive if local has changes
 *
 * Safe to call on every app open — exits early if nothing to do.
 * Concurrent calls are no-ops (only one sync runs at a time).
 */
export async function sync(accessToken: string): Promise<SyncResult> {
  // Always cancel any pending debounced push — this sync will handle the push.
  // Must happen before the _syncInProgress guard so that a push scheduled during
  // a concurrent sync is also cancelled (it would be redundant once this sync lands).
  _cancelPendingPush();

  if (_syncInProgress) return { pulled: false, pushed: false };
  _syncInProgress = true;

  const syncState = useSyncStore.getState();
  syncState.setStatus('syncing');

  const result: SyncResult = { pulled: false, pushed: false };

  try {
    const meta = await db.syncMeta.get();
    const pulled = await pullDriveFile(accessToken);

    if (pulled) {
      const { file, fileId } = pulled;

      // Store the Drive file ID if we didn't have it yet
      if (!meta?.driveFileId) {
        await db.syncMeta.setDriveFileId(fileId);
      }

      // Replace local if Drive is newer
      if (shouldPull(file.lastUpdated, meta?.lastSyncedAt ?? null)) {
        // All parent writes are online-only, so there are never local structural
        // orphans to protect. Drive is fully authoritative for structural data.
        await seedFromDriveFile(file);
        // Persist lastSyncedAt using Drive's own timestamp so that subsequent
        // syncs correctly compare against Drive's lastUpdated and don't re-pull
        // unnecessarily when nothing has changed.
        const afterSeedMeta = await db.syncMeta.get();
        await db.syncMeta.set({
          driveFileId: afterSeedMeta?.driveFileId ?? fileId,
          lastSyncedAt: file.lastUpdated,
          isDirty: afterSeedMeta?.isDirty ?? true,
        });
        result.pulled = true;
      }
    }

    // Push if local is dirty OR we just set up (no Drive file yet)
    const freshMeta = await db.syncMeta.get();
    const needsPush = freshMeta?.isDirty !== false || !freshMeta?.driveFileId;

    if (needsPush) {
      const localFile = await serializeToFile();
      if (localFile) {
        const fileId = await pushDriveFile(localFile, accessToken, freshMeta?.driveFileId ?? null);
        await db.syncMeta.set({
          driveFileId: fileId,
          lastSyncedAt: new Date().toISOString(),
          isDirty: false,
        });
        result.pushed = true;
      }
    }

    syncState.setLastSynced(new Date().toISOString());
  } catch (err) {
    const isNetworkError =
      (err instanceof TypeError && err.message.includes('fetch')) ||
      (err instanceof DriveError && err.status === undefined);

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
let _pendingAccessToken: string | null = null;

/**
 * Schedule a full sync (pull-then-push) 2 seconds after the last call.
 * Replaces any pending timer — only the latest wins.
 * Using a full sync instead of a blind push prevents data loss: we always
 * incorporate the latest Drive state before overwriting it.
 */
export function schedulePush(accessToken: string): void {
  _pendingAccessToken = accessToken;
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(async () => {
    _pushTimer = null;
    if (_pendingAccessToken) {
      await sync(_pendingAccessToken);
    }
  }, 2_000);
}

/**
 * Immediate push — kept for tests and as an escape hatch.
 * Normal flow: use schedulePush (which now triggers a full sync).
 */
export async function push(accessToken: string): Promise<void> {
  const syncState = useSyncStore.getState();
  syncState.setStatus('syncing');
  try {
    const meta = await db.syncMeta.get();
    const localFile = await serializeToFile();
    if (!localFile) return;

    const fileId = await pushDriveFile(localFile, accessToken, meta?.driveFileId ?? null);
    await db.syncMeta.set({
      driveFileId: fileId,
      lastSyncedAt: new Date().toISOString(),
      isDirty: false,
    });
    syncState.setLastSynced(new Date().toISOString());
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Push failed';
    syncState.setError(msg);
  }
}

/** Cancel any pending debounced push — used in tests. */
export function _cancelPendingPush(): void {
  if (_pushTimer) {
    clearTimeout(_pushTimer);
    _pushTimer = null;
  }
  _pendingAccessToken = null;
}
