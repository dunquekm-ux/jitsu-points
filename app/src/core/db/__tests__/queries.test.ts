/**
 * DB query tests — use fake-indexeddb to run against a real IndexedDB implementation in Node.
 * fake-indexeddb/auto is installed globally in test-setup.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { _useTestDb } from '../schema';
import { db } from '../index';
import {
  createProfile,
  createTaskTemplate,
  createSchedule,
  createTaskInstance,
  createPointsEvent,
  createReward,
} from '../../../domain';

// Each test gets its own named DB — no shared state.
let _counter = 0;
beforeEach(() => {
  _useTestDb(`jitsu-queries-test-${++_counter}`);
});

describe('profiles CRUD', () => {
  it('puts and retrieves a profile', async () => {
    const p = createProfile('Emma', 'speed_hero');
    await db.profiles.put(p);
    const retrieved = await db.profiles.get(p.id);
    expect(retrieved).toEqual(p);
  });

  it('getAll returns all stored profiles', async () => {
    const p1 = createProfile('Emma', 'speed_hero');
    const p2 = createProfile('Max', 'flame_fox');
    await db.profiles.put(p1);
    await db.profiles.put(p2);
    const all = await db.profiles.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((p) => p.name).sort()).toEqual(['Emma', 'Max']);
  });

  it('delete removes a profile', async () => {
    const p = createProfile('Emma', 'speed_hero');
    await db.profiles.put(p);
    await db.profiles.delete(p.id);
    expect(await db.profiles.get(p.id)).toBeUndefined();
  });
});

describe('taskSchedules — by-templateId index', () => {
  it('retrieves schedules by template ID', async () => {
    const t = createTaskTemplate('Brush Teeth', 5, 'child-1');
    const s1 = createSchedule(t.id, 'Morning', '07:00', '09:00');
    const s2 = createSchedule(t.id, 'Evening', '19:00', '21:00');
    const unrelated = createSchedule('other-template', 'Morning', '07:00', '09:00');

    await db.taskTemplates.put(t);
    await db.taskSchedules.put(s1);
    await db.taskSchedules.put(s2);
    await db.taskSchedules.put(unrelated);

    const results = await db.taskSchedules.byTemplate(t.id);
    expect(results).toHaveLength(2);
    expect(results.map((s) => s.label).sort()).toEqual(['Evening', 'Morning']);
  });
});

describe('taskInstances — compound index', () => {
  it('retrieves instances by childId + date', async () => {
    const child1 = 'child-1';
    const child2 = 'child-2';

    const i1 = createTaskInstance('t1', 's1', child1, '2026-05-23');
    const i2 = createTaskInstance('t1', 's2', child1, '2026-05-23');
    const i3 = createTaskInstance('t1', 's1', child2, '2026-05-23');
    const i4 = createTaskInstance('t1', 's1', child1, '2026-05-22');

    await Promise.all([i1, i2, i3, i4].map((i) => db.taskInstances.put(i)));

    const results = await db.taskInstances.byChildAndDate(child1, '2026-05-23');
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.childId === child1 && r.date === '2026-05-23')).toBe(true);
  });

  it('byChild returns all instances for a child', async () => {
    const i1 = createTaskInstance('t1', 's1', 'child-1', '2026-05-21');
    const i2 = createTaskInstance('t1', 's1', 'child-1', '2026-05-22');
    const i3 = createTaskInstance('t1', 's1', 'child-2', '2026-05-22');
    await Promise.all([i1, i2, i3].map((i) => db.taskInstances.put(i)));

    const results = await db.taskInstances.byChild('child-1');
    expect(results).toHaveLength(2);
  });
});

describe('pointsEvents — by-childId index', () => {
  it('retrieves events for a specific child', async () => {
    const e1 = createPointsEvent('child-1', 10, 'task');
    const e2 = createPointsEvent('child-1', 5, 'bonus');
    const e3 = createPointsEvent('child-2', 20, 'task');
    await Promise.all([e1, e2, e3].map((e) => db.pointsEvents.put(e)));

    const results = await db.pointsEvents.byChild('child-1');
    expect(results).toHaveLength(2);
    expect(results.every((e) => e.childId === 'child-1')).toBe(true);
  });
});

describe('rewards CRUD', () => {
  it('puts and retrieves a reward', async () => {
    const r = createReward('Ice Cream', 100);
    await db.rewards.put(r);
    const retrieved = await db.rewards.get(r.id);
    expect(retrieved).toEqual(r);
  });

  it('getAll returns all rewards', async () => {
    await db.rewards.put(createReward('Ice Cream', 100));
    await db.rewards.put(createReward('Movie Night', 200));
    expect(await db.rewards.getAll()).toHaveLength(2);
  });
});

describe('familyMeta', () => {
  it('stores and retrieves family metadata', async () => {
    await db.familyMeta.set({ familyId: 'fam-1', familyName: 'The Smiths', joinCode: 'TIGER-42' });
    const meta = await db.familyMeta.get();
    expect(meta?.familyId).toBe('fam-1');
    expect(meta?.familyName).toBe('The Smiths');
    expect(meta?.joinCode).toBe('TIGER-42');
  });

  it('returns undefined when not set', async () => {
    expect(await db.familyMeta.get()).toBeUndefined();
  });
});

describe('syncMeta', () => {
  it('setDirty marks as dirty', async () => {
    await db.syncMeta.set({ driveFileId: 'file-1', lastSyncedAt: null, isDirty: false });
    await db.syncMeta.setDirty(true);
    const meta = await db.syncMeta.get();
    expect(meta?.isDirty).toBe(true);
  });

  it('markSynced clears dirty and sets lastSyncedAt', async () => {
    await db.syncMeta.set({ driveFileId: 'file-1', lastSyncedAt: null, isDirty: true });
    await db.syncMeta.markSynced();
    const meta = await db.syncMeta.get();
    expect(meta?.isDirty).toBe(false);
    expect(meta?.lastSyncedAt).not.toBeNull();
  });

  it('setDriveFileId preserves other fields', async () => {
    await db.syncMeta.set({
      driveFileId: null,
      lastSyncedAt: '2026-05-23T00:00:00Z',
      isDirty: true,
    });
    await db.syncMeta.setDriveFileId('drive-file-abc');
    const meta = await db.syncMeta.get();
    expect(meta?.driveFileId).toBe('drive-file-abc');
    expect(meta?.lastSyncedAt).toBe('2026-05-23T00:00:00Z');
    expect(meta?.isDirty).toBe(true);
  });
});

describe('settings', () => {
  it('stores and retrieves settings', async () => {
    await db.settings.set({ notificationsEnabled: true, theme: 'berry' });
    const s = await db.settings.get();
    expect(s?.notificationsEnabled).toBe(true);
    expect(s?.theme).toBe('berry');
  });
});
