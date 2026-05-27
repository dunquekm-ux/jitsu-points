/**
 * seed — write a JitsuDriveFile into IndexedDB after a Drive pull.
 *
 * Strategy per store type:
 *
 *   Structural data (profiles, taskTemplates, taskSchedules, rewards):
 *     Full replace — upsert all Drive entities, delete local orphans.
 *     Drive is the authoritative source of truth for structural data.
 *     Parent-deleted items on another device propagate to this device.
 *     NOTE: This is safe because all writes are online-only — local data
 *     is never created while offline, so there are no unpushed orphans.
 *
 *   Append-only event data (pointsEvents):
 *     Always union — add Drive events we don't have locally; never delete local events.
 *     A local event absent from Drive is an unpushed write — deleting it loses data.
 *
 *   Completion state (taskInstances):
 *     Always union + prefer-completed — keep all instances from both sides;
 *     if Drive has an instance as 'available' but local has it 'completed',
 *     keep the local 'completed' (child completed it but it hasn't synced yet).
 */
import { openJitsuDb } from './schema';
import type { JitsuDriveFile, TaskInstance } from '../../domain';

export async function seedFromDriveFile(file: JitsuDriveFile): Promise<void> {
  const db = await openJitsuDb();

  // ─── Structural stores (Drive authoritative — full replace) ──────────────────

  async function syncProfiles(): Promise<void> {
    const tx = db.transaction('profiles', 'readwrite');
    const incomingIds = new Set(file.profiles.map((p) => p.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.profiles.map((p) => tx.store.put(p)),
      ...existingKeys.filter((k) => !incomingIds.has(k)).map((k) => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncTaskTemplates(): Promise<void> {
    const tx = db.transaction('taskTemplates', 'readwrite');
    const incomingIds = new Set(file.taskTemplates.map((t) => t.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.taskTemplates.map((t) => tx.store.put(t)),
      ...existingKeys.filter((k) => !incomingIds.has(k)).map((k) => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncTaskSchedules(): Promise<void> {
    const tx = db.transaction('taskSchedules', 'readwrite');
    const incomingIds = new Set(file.taskSchedules.map((s) => s.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.taskSchedules.map((s) => tx.store.put(s)),
      ...existingKeys.filter((k) => !incomingIds.has(k)).map((k) => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncRewards(): Promise<void> {
    const tx = db.transaction('rewards', 'readwrite');
    const incomingIds = new Set(file.rewards.map((r) => r.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.rewards.map((r) => tx.store.put(r)),
      ...existingKeys.filter((k) => !incomingIds.has(k)).map((k) => tx.store.delete(k)),
      tx.done,
    ]);
  }

  // ─── Event / completion stores (always union) ─────────────────────────────

  async function syncTaskInstances(): Promise<void> {
    const tx = db.transaction('taskInstances', 'readwrite');
    // Read existing BEFORE issuing any writes (keeps transaction alive via idb)
    const existing = await tx.store.getAll();

    const localMap = new Map(existing.map((i) => [i.id, i]));
    const driveIds = new Set(file.taskInstances.map((i) => i.id));

    // Start from Drive's list; for any instance Drive has as non-completed but
    // local has as completed, keep the local version (child beat the sync).
    const merged: TaskInstance[] = file.taskInstances.map((di) => {
      const local = localMap.get(di.id);
      if (local?.state === 'completed' && di.state !== 'completed') return local;
      return di;
    });

    // Preserve local instances not in Drive yet (newly generated daily instances
    // and completions from an unpushed session on this device).
    for (const local of existing) {
      if (!driveIds.has(local.id)) merged.push(local);
    }

    const existingKeys = existing.map((i) => i.id);
    await Promise.all([
      ...existingKeys.map((k) => tx.store.delete(k)),
      ...merged.map((i) => tx.store.put(i)),
      tx.done,
    ]);
  }

  async function syncPointsEvents(): Promise<void> {
    const tx = db.transaction('pointsEvents', 'readwrite');
    // Read existing first — we never delete local events, only add missing Drive ones.
    const existing = await tx.store.getAll();

    // pointsEvents are append-only. A local event absent from Drive is an
    // unpushed write — deleting it loses points forever. Union: add Drive events
    // we don't have locally; leave all existing local events untouched.
    const localIds = new Set(existing.map((e) => e.id));
    const toAdd = file.pointsEvents.filter((e) => !localIds.has(e.id));

    await Promise.all([...toAdd.map((e) => tx.store.put(e)), tx.done]);
  }

  // Run all store syncs in parallel
  await Promise.all([
    syncProfiles(),
    syncTaskTemplates(),
    syncTaskSchedules(),
    syncTaskInstances(),
    syncPointsEvents(),
    syncRewards(),
  ]);

  // Update single-record stores
  await db.put('familyMeta', {
    key: 'main',
    familyId: file.familyId,
    familyName: file.familyName,
    joinCode: file.joinCode,
  });
  await db.put('settings', { key: 'main', ...file.settings });
}
