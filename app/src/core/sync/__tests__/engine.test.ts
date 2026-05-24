/**
 * Sync engine tests — focus on the pure decision logic (shouldPull)
 * and the engine's behaviour with mocked DB/Drive dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldPull } from '../engine';

// ─── shouldPull ───────────────────────────────────────────────────────────────

describe('shouldPull', () => {
  it('returns true when there is no local lastSyncedAt (first sync)', () => {
    expect(shouldPull('2026-05-23T10:00:00Z', null)).toBe(true);
  });

  it('returns true when Drive is newer than last sync', () => {
    expect(shouldPull('2026-05-23T10:00:00Z', '2026-05-23T09:00:00Z')).toBe(true);
  });

  it('returns false when Drive is older than last sync', () => {
    expect(shouldPull('2026-05-23T08:00:00Z', '2026-05-23T09:00:00Z')).toBe(false);
  });

  it('returns false when Drive timestamp equals last sync (no change)', () => {
    const ts = '2026-05-23T09:00:00Z';
    expect(shouldPull(ts, ts)).toBe(false);
  });

  it('handles timestamps across day boundaries', () => {
    expect(shouldPull('2026-05-24T00:01:00Z', '2026-05-23T23:59:00Z')).toBe(true);
    expect(shouldPull('2026-05-22T23:59:00Z', '2026-05-23T00:01:00Z')).toBe(false);
  });
});

// ─── markDirty + schedulePush ─────────────────────────────────────────────────
// These interact with IndexedDB and timers — test with fakes.

import { _useTestDb } from '../../db/schema';
import { db } from '../../db';
import { markDirty, _cancelPendingPush } from '../engine';

let _counter = 0;

describe('markDirty', () => {
  beforeEach(() => {
    _useTestDb(`jitsu-engine-test-${++_counter}`);
    _cancelPendingPush();
  });

  it('sets isDirty to true in syncMeta', async () => {
    await db.syncMeta.set({ driveFileId: null, lastSyncedAt: null, isDirty: false });
    await markDirty();
    const meta = await db.syncMeta.get();
    expect(meta?.isDirty).toBe(true);
  });

  it('initialises syncMeta if it does not exist', async () => {
    // syncMeta store is empty — setDirty should create it
    await markDirty();
    const meta = await db.syncMeta.get();
    expect(meta?.isDirty).toBe(true);
  });
});

// ─── sync() integration (mocked Drive + DB) ───────────────────────────────────

import { sync } from '../engine';
import { useSyncStore } from '../store';
import * as driveModule from '../../drive';
import * as seedModule from '../../db/seed';
import * as serializeModule from '../../db/serialize';
import type { JitsuDriveFile } from '../../../domain';

function makeDriveFile(lastUpdated: string): JitsuDriveFile {
  return {
    familyId: 'fam-1',
    familyName: 'The Smiths',
    joinCode: 'TIGER-42',
    lastUpdated,
    profiles: [],
    taskTemplates: [],
    taskSchedules: [],
    taskInstances: [],
    rewards: [],
    pointsEvents: [],
    settings: { notificationsEnabled: false, theme: 'candy' },
  };
}

describe('sync()', () => {
  beforeEach(() => {
    _useTestDb(`jitsu-engine-test-${++_counter}`);
    _cancelPendingPush();
    vi.restoreAllMocks();
    useSyncStore.setState({ status: 'idle', lastSyncedAt: null, error: null });
  });

  it('sets status to idle after a successful sync with nothing to do', async () => {
    // Drive has older file — no pull; local is clean — no push
    const driveFile = makeDriveFile('2026-05-22T00:00:00Z');
    vi.spyOn(driveModule, 'pullDriveFile').mockResolvedValue({ file: driveFile, fileId: 'f-1' });
    vi.spyOn(seedModule, 'seedFromDriveFile').mockResolvedValue(undefined);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    // Mark as synced so shouldPull returns false
    await db.syncMeta.set({
      driveFileId: 'f-1',
      lastSyncedAt: '2026-05-23T00:00:00Z',
      isDirty: false,
    });

    const result = await sync('test-token');
    expect(result.pulled).toBe(false);
    expect(useSyncStore.getState().status).toBe('idle');
  });

  it('pulls when Drive file is newer', async () => {
    const driveFile = makeDriveFile('2026-05-24T00:00:00Z'); // newer than local
    vi.spyOn(driveModule, 'pullDriveFile').mockResolvedValue({ file: driveFile, fileId: 'f-1' });
    const seedSpy = vi.spyOn(seedModule, 'seedFromDriveFile').mockResolvedValue(undefined);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    await db.syncMeta.set({
      driveFileId: 'f-1',
      lastSyncedAt: '2026-05-23T00:00:00Z', // older than Drive
      isDirty: false,
    });

    const result = await sync('test-token');
    expect(result.pulled).toBe(true);
    expect(seedSpy).toHaveBeenCalledWith(driveFile);
  });

  it('pushes when local is dirty', async () => {
    const driveFile = makeDriveFile('2026-05-22T00:00:00Z');
    vi.spyOn(driveModule, 'pullDriveFile').mockResolvedValue({ file: driveFile, fileId: 'f-1' });
    vi.spyOn(seedModule, 'seedFromDriveFile').mockResolvedValue(undefined);

    const localFile = makeDriveFile('2026-05-23T12:00:00Z');
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(localFile);
    const pushSpy = vi.spyOn(driveModule, 'pushDriveFile').mockResolvedValue('f-1');

    await db.syncMeta.set({
      driveFileId: 'f-1',
      lastSyncedAt: '2026-05-23T00:00:00Z',
      isDirty: true, // dirty!
    });

    const result = await sync('test-token');
    expect(result.pushed).toBe(true);
    expect(pushSpy).toHaveBeenCalledWith(localFile, 'test-token', 'f-1');
  });

  it('sets status to offline on network error', async () => {
    // Simulate a network error (TypeError from fetch, no HTTP status)
    vi.spyOn(driveModule, 'pullDriveFile').mockRejectedValue(
      Object.assign(new TypeError('Failed to fetch'), {}),
    );

    const result = await sync('test-token');
    expect(result.pulled).toBe(false);
    expect(useSyncStore.getState().status).toBe('offline');
  });

  it('sets status to error on Drive API error', async () => {
    vi.spyOn(driveModule, 'pullDriveFile').mockRejectedValue(
      new driveModule.DriveError('Unauthorized', 401),
    );

    await sync('test-token');
    expect(useSyncStore.getState().status).toBe('error');
    expect(useSyncStore.getState().error).toContain('Unauthorized');
  });

  it('does nothing when Drive returns no file and local has no data', async () => {
    vi.spyOn(driveModule, 'pullDriveFile').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    const result = await sync('test-token');
    expect(result.pulled).toBe(false);
    expect(result.pushed).toBe(false);
  });
});
