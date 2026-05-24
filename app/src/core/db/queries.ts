/**
 * Typed query helpers for the Jitsu IndexedDB.
 * All functions open the DB via the singleton, then perform a single operation.
 * Callers never interact with IDBPDatabase directly.
 */
import { openJitsuDb } from './schema';
import type { FamilyMeta, SyncMeta, SettingsRecord } from './schema';
import type {
  ChildProfile,
  TaskTemplate,
  TaskSchedule,
  TaskInstance,
  PointsEvent,
  Reward,
} from '../../domain';

// ─── Profiles ────────────────────────────────────────────────────────────────

export const profiles = {
  getAll: async (): Promise<ChildProfile[]> => (await openJitsuDb()).getAll('profiles'),
  get: async (id: string): Promise<ChildProfile | undefined> =>
    (await openJitsuDb()).get('profiles', id),
  put: async (p: ChildProfile): Promise<void> => {
    await (await openJitsuDb()).put('profiles', p);
  },
  delete: async (id: string): Promise<void> => {
    await (await openJitsuDb()).delete('profiles', id);
  },
};

// ─── Task Templates ───────────────────────────────────────────────────────────

export const taskTemplates = {
  getAll: async (): Promise<TaskTemplate[]> => (await openJitsuDb()).getAll('taskTemplates'),
  get: async (id: string): Promise<TaskTemplate | undefined> =>
    (await openJitsuDb()).get('taskTemplates', id),
  put: async (t: TaskTemplate): Promise<void> => {
    await (await openJitsuDb()).put('taskTemplates', t);
  },
  delete: async (id: string): Promise<void> => {
    await (await openJitsuDb()).delete('taskTemplates', id);
  },
};

// ─── Task Schedules ───────────────────────────────────────────────────────────

export const taskSchedules = {
  getAll: async (): Promise<TaskSchedule[]> => (await openJitsuDb()).getAll('taskSchedules'),
  get: async (id: string): Promise<TaskSchedule | undefined> =>
    (await openJitsuDb()).get('taskSchedules', id),
  byTemplate: async (templateId: string): Promise<TaskSchedule[]> =>
    (await openJitsuDb()).getAllFromIndex('taskSchedules', 'by-templateId', templateId),
  put: async (s: TaskSchedule): Promise<void> => {
    await (await openJitsuDb()).put('taskSchedules', s);
  },
  delete: async (id: string): Promise<void> => {
    await (await openJitsuDb()).delete('taskSchedules', id);
  },
};

// ─── Task Instances ───────────────────────────────────────────────────────────

export const taskInstances = {
  getAll: async (): Promise<TaskInstance[]> => (await openJitsuDb()).getAll('taskInstances'),
  get: async (id: string): Promise<TaskInstance | undefined> =>
    (await openJitsuDb()).get('taskInstances', id),
  byChild: async (childId: string): Promise<TaskInstance[]> =>
    (await openJitsuDb()).getAllFromIndex('taskInstances', 'by-childId', childId),
  byDate: async (date: string): Promise<TaskInstance[]> =>
    (await openJitsuDb()).getAllFromIndex('taskInstances', 'by-date', date),
  byChildAndDate: async (childId: string, date: string): Promise<TaskInstance[]> =>
    (await openJitsuDb()).getAllFromIndex('taskInstances', 'by-childId-date', [childId, date]),
  put: async (i: TaskInstance): Promise<void> => {
    await (await openJitsuDb()).put('taskInstances', i);
  },
  delete: async (id: string): Promise<void> => {
    await (await openJitsuDb()).delete('taskInstances', id);
  },
};

// ─── Points Events ────────────────────────────────────────────────────────────

export const pointsEvents = {
  getAll: async (): Promise<PointsEvent[]> => (await openJitsuDb()).getAll('pointsEvents'),
  byChild: async (childId: string): Promise<PointsEvent[]> =>
    (await openJitsuDb()).getAllFromIndex('pointsEvents', 'by-childId', childId),
  put: async (e: PointsEvent): Promise<void> => {
    await (await openJitsuDb()).put('pointsEvents', e);
  },
  delete: async (id: string): Promise<void> => {
    await (await openJitsuDb()).delete('pointsEvents', id);
  },
};

// ─── Rewards ─────────────────────────────────────────────────────────────────

export const rewards = {
  getAll: async (): Promise<Reward[]> => (await openJitsuDb()).getAll('rewards'),
  get: async (id: string): Promise<Reward | undefined> => (await openJitsuDb()).get('rewards', id),
  put: async (r: Reward): Promise<void> => {
    await (await openJitsuDb()).put('rewards', r);
  },
  delete: async (id: string): Promise<void> => {
    await (await openJitsuDb()).delete('rewards', id);
  },
};

// ─── Family Meta ─────────────────────────────────────────────────────────────

export const familyMeta = {
  get: async (): Promise<FamilyMeta | undefined> => (await openJitsuDb()).get('familyMeta', 'main'),
  set: async (meta: Omit<FamilyMeta, 'key'>): Promise<void> => {
    await (await openJitsuDb()).put('familyMeta', { key: 'main', ...meta });
  },
};

// ─── Sync Meta ────────────────────────────────────────────────────────────────

export const syncMeta = {
  get: async (): Promise<SyncMeta | undefined> => (await openJitsuDb()).get('syncMeta', 'main'),
  set: async (meta: Omit<SyncMeta, 'key'>): Promise<void> => {
    await (await openJitsuDb()).put('syncMeta', { key: 'main', ...meta });
  },
  setDirty: async (dirty: boolean): Promise<void> => {
    const current = await syncMeta.get();
    await (
      await openJitsuDb()
    ).put('syncMeta', {
      key: 'main',
      driveFileId: current?.driveFileId ?? null,
      lastSyncedAt: current?.lastSyncedAt ?? null,
      isDirty: dirty,
    });
  },
  setDriveFileId: async (fileId: string): Promise<void> => {
    const current = await syncMeta.get();
    await (
      await openJitsuDb()
    ).put('syncMeta', {
      key: 'main',
      driveFileId: fileId,
      lastSyncedAt: current?.lastSyncedAt ?? null,
      isDirty: current?.isDirty ?? true,
    });
  },
  markSynced: async (): Promise<void> => {
    const current = await syncMeta.get();
    await (
      await openJitsuDb()
    ).put('syncMeta', {
      key: 'main',
      driveFileId: current?.driveFileId ?? null,
      lastSyncedAt: new Date().toISOString(),
      isDirty: false,
    });
  },
};

// ─── Settings ────────────────────────────────────────────────────────────────

export const settings = {
  get: async (): Promise<SettingsRecord | undefined> =>
    (await openJitsuDb()).get('settings', 'main'),
  set: async (s: Omit<SettingsRecord, 'key'>): Promise<void> => {
    await (await openJitsuDb()).put('settings', { key: 'main', ...s });
  },
};
