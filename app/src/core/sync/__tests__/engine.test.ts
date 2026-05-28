/**
 * Sync engine tests — focus on the pure decision logic (shouldPull)
 * and the engine's behaviour with mocked DB/API dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldPull } from '../engine';

// ─── shouldPull ───────────────────────────────────────────────────────────────

describe('shouldPull', () => {
  it('returns true when there is no local lastSyncedAt (first sync)', () => {
    expect(shouldPull('2026-05-23T10:00:00Z', null)).toBe(true);
  });

  it('returns true when Worker data is newer than last sync', () => {
    expect(shouldPull('2026-05-23T10:00:00Z', '2026-05-23T09:00:00Z')).toBe(true);
  });

  it('returns false when Worker data is older than last sync', () => {
    expect(shouldPull('2026-05-23T08:00:00Z', '2026-05-23T09:00:00Z')).toBe(false);
  });

  it('returns false when Worker timestamp equals last sync (no change)', () => {
    const ts = '2026-05-23T09:00:00Z';
    expect(shouldPull(ts, ts)).toBe(false);
  });

  it('handles timestamps across day boundaries', () => {
    expect(shouldPull('2026-05-24T00:01:00Z', '2026-05-23T23:59:00Z')).toBe(true);
    expect(shouldPull('2026-05-22T23:59:00Z', '2026-05-23T00:01:00Z')).toBe(false);
  });
});

// ─── markDirty + schedulePush ─────────────────────────────────────────────────

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
    await markDirty();
    const meta = await db.syncMeta.get();
    expect(meta?.isDirty).toBe(true);
  });
});

// ─── sync() integration (mocked API + DB) ────────────────────────────────────

import { sync } from '../engine';
import { useSyncStore } from '../store';
import * as apiModule from '../../api';
import * as seedModule from '../../db/seed';
import * as serializeModule from '../../db/serialize';
import { useAuthStore } from '../../auth/store';
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
    // Set up fake credentials so sync() doesn't exit early
    useAuthStore.setState({
      status: 'connected',
      familyId: 'fam-1',
      secret: 'test-secret',
      error: null,
    });
  });

  it('sets status to idle after a successful sync with nothing to do', async () => {
    const workerFile = makeDriveFile('2026-05-22T00:00:00Z');
    vi.spyOn(apiModule, 'pullFamily').mockResolvedValue({
      file: workerFile,
      updatedAt: '2026-05-22T00:00:00Z',
    });
    vi.spyOn(seedModule, 'seedFromDriveFile').mockResolvedValue(undefined);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    await db.syncMeta.set({
      driveFileId: null,
      lastSyncedAt: '2026-05-23T00:00:00Z', // local is newer — no pull
      isDirty: false,
    });

    const result = await sync();
    expect(result.pulled).toBe(false);
    expect(useSyncStore.getState().status).toBe('idle');
  });

  it('pulls when Worker data is newer', async () => {
    const workerFile = makeDriveFile('2026-05-24T00:00:00Z');
    vi.spyOn(apiModule, 'pullFamily').mockResolvedValue({
      file: workerFile,
      updatedAt: '2026-05-24T00:00:00Z',
    });
    const seedSpy = vi.spyOn(seedModule, 'seedFromDriveFile').mockResolvedValue(undefined);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    await db.syncMeta.set({
      driveFileId: null,
      lastSyncedAt: '2026-05-23T00:00:00Z', // older than Worker
      isDirty: false,
    });

    const result = await sync();
    expect(result.pulled).toBe(true);
    expect(seedSpy).toHaveBeenCalledWith(workerFile);
  });

  it('pushes when local is dirty', async () => {
    const workerFile = makeDriveFile('2026-05-22T00:00:00Z');
    vi.spyOn(apiModule, 'pullFamily').mockResolvedValue({
      file: workerFile,
      updatedAt: '2026-05-22T00:00:00Z',
    });
    vi.spyOn(seedModule, 'seedFromDriveFile').mockResolvedValue(undefined);

    const localFile = makeDriveFile('2026-05-23T12:00:00Z');
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(localFile);
    const pushSpy = vi.spyOn(apiModule, 'pushFamily').mockResolvedValue(undefined);

    await db.syncMeta.set({
      driveFileId: null,
      lastSyncedAt: '2026-05-23T00:00:00Z',
      isDirty: true, // dirty!
    });

    const result = await sync();
    expect(result.pushed).toBe(true);
    expect(pushSpy).toHaveBeenCalledWith('fam-1', 'test-secret', localFile);
  });

  it('sets status to offline on network error', async () => {
    vi.spyOn(apiModule, 'pullFamily').mockRejectedValue(
      Object.assign(new TypeError('Failed to fetch'), {}),
    );

    const result = await sync();
    expect(result.pulled).toBe(false);
    expect(useSyncStore.getState().status).toBe('offline');
  });

  it('sets status to error on API error', async () => {
    vi.spyOn(apiModule, 'pullFamily').mockRejectedValue(
      new apiModule.ApiError('Unauthorized', 401),
    );

    await sync();
    expect(useSyncStore.getState().status).toBe('error');
    expect(useSyncStore.getState().error).toContain('Unauthorized');
  });

  it('does nothing when Worker returns no data and local has nothing to push', async () => {
    vi.spyOn(apiModule, 'pullFamily').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    const result = await sync();
    expect(result.pulled).toBe(false);
    expect(result.pushed).toBe(false);
  });

  it('exits early (no-op) when no credentials are set', async () => {
    useAuthStore.setState({ status: 'disconnected', familyId: null, secret: null, error: null });
    const pullSpy = vi.spyOn(apiModule, 'pullFamily');

    const result = await sync();
    expect(result.pulled).toBe(false);
    expect(pullSpy).not.toHaveBeenCalled();
  });

  it('is a no-op when called concurrently (only one sync runs at a time)', async () => {
    let pullCallCount = 0;
    vi.spyOn(apiModule, 'pullFamily').mockImplementation(async () => {
      pullCallCount++;
      await new Promise((r) => setTimeout(r, 10));
      return null;
    });
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    const [r1, r2] = await Promise.all([sync(), sync()]);

    expect(pullCallCount).toBe(1);
    expect([r1.pulled, r2.pulled]).toEqual(expect.arrayContaining([false]));
  });
});

// ─── schedulePush ────────────────────────────────────────────────────────────

import { schedulePush } from '../engine';

describe('schedulePush', () => {
  beforeEach(() => {
    _useTestDb(`jitsu-engine-test-${++_counter}`);
    _cancelPendingPush();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    useSyncStore.setState({ status: 'idle', lastSyncedAt: null, error: null });
    useAuthStore.setState({
      status: 'connected',
      familyId: 'fam-1',
      secret: 'test-secret',
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    _cancelPendingPush();
  });

  it('triggers sync() (pull-then-push) after 2 seconds', async () => {
    const pullSpy = vi.spyOn(apiModule, 'pullFamily').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    schedulePush();
    expect(pullSpy).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(pullSpy).toHaveBeenCalledOnce();
  });

  it('debounces — only one sync fires when called multiple times within 2 s', async () => {
    const pullSpy = vi.spyOn(apiModule, 'pullFamily').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    schedulePush();
    schedulePush();
    schedulePush();

    await vi.runAllTimersAsync();

    expect(pullSpy).toHaveBeenCalledOnce();
  });

  it('sync() cancels a pending schedulePush timer', async () => {
    vi.useRealTimers();

    const pullSpy = vi.spyOn(apiModule, 'pullFamily').mockResolvedValue(null);
    vi.spyOn(serializeModule, 'serializeToFile').mockResolvedValue(null);

    schedulePush();
    await sync();

    expect(pullSpy).toHaveBeenCalledOnce();
    pullSpy.mockRestore();
  });
});
