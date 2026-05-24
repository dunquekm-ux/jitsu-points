/**
 * IndexedDB schema — the local cache for all family data.
 * Every device has a full copy; the app reads/writes here exclusively.
 * Google Drive is synced in the background.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  ChildProfile,
  TaskTemplate,
  TaskSchedule,
  TaskInstance,
  PointsEvent,
  Reward,
  AppSettings,
} from '../../domain';

export const DB_NAME = 'jitsu-points';
export const DB_VERSION = 1;

// ─── Per-store meta objects ───────────────────────────────────────────────────

/** Stored under key 'main' in the familyMeta store. */
export interface FamilyMeta {
  key: 'main';
  familyId: string;
  familyName: string;
  joinCode: string;
}

/** Stored under key 'main' in the syncMeta store. */
export interface SyncMeta {
  key: 'main';
  driveFileId: string | null; // Drive file ID once created/found
  lastSyncedAt: string | null; // ISO timestamp of last successful pull
  isDirty: boolean; // true = local has unpushed changes
}

/** Stored under key 'main' in the settings store. */
export interface SettingsRecord extends AppSettings {
  key: 'main';
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface JitsuDB extends DBSchema {
  profiles: {
    key: string;
    value: ChildProfile;
  };
  taskTemplates: {
    key: string;
    value: TaskTemplate;
  };
  taskSchedules: {
    key: string;
    value: TaskSchedule;
    indexes: { 'by-templateId': string };
  };
  taskInstances: {
    key: string;
    value: TaskInstance;
    indexes: {
      'by-childId': string;
      'by-date': string;
      'by-childId-date': [string, string];
    };
  };
  pointsEvents: {
    key: string;
    value: PointsEvent;
    indexes: {
      'by-childId': string;
      'by-timestamp': string;
    };
  };
  rewards: {
    key: string;
    value: Reward;
  };
  familyMeta: {
    key: string;
    value: FamilyMeta;
  };
  syncMeta: {
    key: string;
    value: SyncMeta;
  };
  settings: {
    key: string;
    value: SettingsRecord;
  };
}

// ─── Open / migrate ───────────────────────────────────────────────────────────

function migrateDb(db: IDBPDatabase<JitsuDB>) {
  // v1 — initial schema
  db.createObjectStore('profiles', { keyPath: 'id' });
  db.createObjectStore('taskTemplates', { keyPath: 'id' });

  const schedStore = db.createObjectStore('taskSchedules', { keyPath: 'id' });
  schedStore.createIndex('by-templateId', 'taskTemplateId');

  const instStore = db.createObjectStore('taskInstances', { keyPath: 'id' });
  instStore.createIndex('by-childId', 'childId');
  instStore.createIndex('by-date', 'date');
  instStore.createIndex('by-childId-date', ['childId', 'date']);

  const evtStore = db.createObjectStore('pointsEvents', { keyPath: 'id' });
  evtStore.createIndex('by-childId', 'childId');
  evtStore.createIndex('by-timestamp', 'timestamp');

  db.createObjectStore('rewards', { keyPath: 'id' });
  db.createObjectStore('familyMeta', { keyPath: 'key' });
  db.createObjectStore('syncMeta', { keyPath: 'key' });
  db.createObjectStore('settings', { keyPath: 'key' });
}

let _dbPromise: Promise<IDBPDatabase<JitsuDB>> | null = null;
let _activeDbName: string = DB_NAME;

/**
 * Open (or return the cached) IndexedDB connection.
 * Call this once per session; subsequent calls return the same promise.
 */
export function openJitsuDb(): Promise<IDBPDatabase<JitsuDB>> {
  if (!_dbPromise) {
    _dbPromise = openDB<JitsuDB>(_activeDbName, DB_VERSION, {
      upgrade: migrateDb,
    });
  }
  return _dbPromise;
}

/**
 * Use a named test database — gives each test full isolation.
 * Resets the connection promise so the next openJitsuDb() opens a fresh DB.
 * Test-only. Call in beforeEach with a unique name (e.g. `jitsu-test-${counter}`).
 */
export function _useTestDb(name: string): void {
  _activeDbName = name;
  _dbPromise = null;
}

/** Reset to the production DB name — used in test teardown. */
export function _resetDbPromise(): void {
  _activeDbName = DB_NAME;
  _dbPromise = null;
}
