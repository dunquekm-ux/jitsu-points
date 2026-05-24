/**
 * seed — write a full JitsuDriveFile into IndexedDB.
 * Called after a Drive pull when the Drive file is newer than local data.
 *
 * Strategy: upsert all entities + delete anything present locally but absent
 * from the Drive file (handles parent deleting a task on another device).
 * Each store is synced in its own transaction for type safety.
 */
import { openJitsuDb } from './schema';
import type { JitsuDriveFile } from '../../domain';

export async function seedFromDriveFile(file: JitsuDriveFile): Promise<void> {
  const db = await openJitsuDb();

  // Helper: sync one store (upsert all incoming, delete orphans)
  async function syncProfiles(): Promise<void> {
    const tx = db.transaction('profiles', 'readwrite');
    const incomingIds = new Set(file.profiles.map(p => p.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.profiles.map(p => tx.store.put(p)),
      ...existingKeys.filter(k => !incomingIds.has(k)).map(k => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncTaskTemplates(): Promise<void> {
    const tx = db.transaction('taskTemplates', 'readwrite');
    const incomingIds = new Set(file.taskTemplates.map(t => t.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.taskTemplates.map(t => tx.store.put(t)),
      ...existingKeys.filter(k => !incomingIds.has(k)).map(k => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncTaskSchedules(): Promise<void> {
    const tx = db.transaction('taskSchedules', 'readwrite');
    const incomingIds = new Set(file.taskSchedules.map(s => s.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.taskSchedules.map(s => tx.store.put(s)),
      ...existingKeys.filter(k => !incomingIds.has(k)).map(k => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncTaskInstances(): Promise<void> {
    const tx = db.transaction('taskInstances', 'readwrite');
    const incomingIds = new Set(file.taskInstances.map(i => i.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.taskInstances.map(i => tx.store.put(i)),
      ...existingKeys.filter(k => !incomingIds.has(k)).map(k => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncPointsEvents(): Promise<void> {
    const tx = db.transaction('pointsEvents', 'readwrite');
    const incomingIds = new Set(file.pointsEvents.map(e => e.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.pointsEvents.map(e => tx.store.put(e)),
      ...existingKeys.filter(k => !incomingIds.has(k)).map(k => tx.store.delete(k)),
      tx.done,
    ]);
  }

  async function syncRewards(): Promise<void> {
    const tx = db.transaction('rewards', 'readwrite');
    const incomingIds = new Set(file.rewards.map(r => r.id));
    const existingKeys = await tx.store.getAllKeys();
    await Promise.all([
      ...file.rewards.map(r => tx.store.put(r)),
      ...existingKeys.filter(k => !incomingIds.has(k)).map(k => tx.store.delete(k)),
      tx.done,
    ]);
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
