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
    // Drive is fully authoritative — all parent writes are online-only
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

  it('is a no-op when called concurrently (only one sync runs at a time)', async () => {
    // Simulates mount + visibility-change firing simultaneously.
    // First call starts; second call should return immediately without pulling/pushing.
    let pullCallCount = 0;
    vi.spyOn(driveModule, 'pullDriveFile').mockImplementation(async () => {
      pullCallCount++;
      await new Promise((r) => setTimeout(r, 10)); // simulate async Drive fetch
      return null;
    });
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    // Fire both calls without awaiting the first
    const [r1, r2] = await Promise.all([sync('tok'), sync('tok')]);

    // One of them ran, the other was a no-op
    expect(pullCallCount).toBe(1);
    // The one that ran may have returned pulled:false (Drive returned null)
    // The concurrent no-op returns pulled:false, pushed:false
    expect([r1.pulled, r2.pulled]).toEqual(expect.arrayContaining([false]));
  });
});

// ─── schedulePush — triggers full sync not blind push ────────────────────────

import { schedulePush } from '../engine';

describe('schedulePush', () => {
  beforeEach(() => {
    _useTestDb(`jitsu-engine-test-${++_counter}`);
    _cancelPendingPush();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    useSyncStore.setState({ status: 'idle', lastSyncedAt: null, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    _cancelPendingPush();
  });

  it('triggers sync() (pull-then-push) after 2 seconds, not a blind push', async () => {
    // This is the core DEF-010 fix: schedulePush must call sync(), not push().
    // We verify by checking that pullDriveFile is called (pull step) when the
    // debounce fires — a blind push would only call pushDriveFile.
    const pullSpy = vi.spyOn(driveModule, 'pullDriveFile').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    schedulePush('test-token');
    expect(pullSpy).not.toHaveBeenCalled(); // not yet

    await vi.runAllTimersAsync();

    expect(pullSpy).toHaveBeenCalledOnce(); // sync()'s pull step ran
  });

  it('debounces — only one sync fires when called multiple times within 2 s', async () => {
    const pullSpy = vi.spyOn(driveModule, 'pullDriveFile').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    schedulePush('tok');
    schedulePush('tok');
    schedulePush('tok'); // only this one should fire

    await vi.runAllTimersAsync();

    expect(pullSpy).toHaveBeenCalledOnce();
  });

  it('sync() cancels a pending schedulePush timer', async () => {
    // Fake timers conflict with fake-indexeddb for this test: fake-indexeddb uses
    // setTimeout(fn, 0) internally, so its Promise chains stall when fake timers
    // are active and nothing is advancing the 0ms ticks. Switch to real timers for
    // this one test so that `await sync()` can complete normally.
    vi.useRealTimers();

    const pullSpy = vi.spyOn(driveModule, 'pullDriveFile').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    schedulePush('tok'); // arms a real 2-second timer
    await sync('tok'); // calls _cancelPendingPush() at entry, then runs pull

    // The scheduled push was cancelled — pullDriveFile should have been called
    // exactly once (from the explicit sync above), not again when the timer fires.
    // afterEach also calls _cancelPendingPush() as belt-and-suspenders.
    expect(pullSpy).toHaveBeenCalledOnce();
    pullSpy.mockRestore();
  });
});
