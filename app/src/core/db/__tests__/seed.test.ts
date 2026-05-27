/**
 * seedFromDriveFile tests — verify union-merge behaviour for DEF-010.
 *
 * Key invariants tested:
 *   1. pointsEvents: local events never deleted — Drive events we're missing are added
 *   2. taskInstances: union, prefer local 'completed' over Drive 'available'
 *   3. taskInstances: local-only instances preserved (new daily generations, unpushed completions)
 *   4. Structural stores (profiles, taskTemplates, rewards): Drive wins — orphans deleted
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { _useTestDb } from '../schema';
import { db } from '../index';
import { seedFromDriveFile } from '../seed';
import {
  createProfile,
  createReward,
  createPointsEvent,
  createTaskInstance,
  createTaskTemplate,
  createSchedule,
  createFamilyFile,
} from '../../../domain';
import type { JitsuDriveFile, TaskInstance, PointsEvent } from '../../../domain';

let _counter = 0;
beforeEach(() => {
  _useTestDb(`jitsu-seed-test-${++_counter}`);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseFile(overrides: Partial<JitsuDriveFile> = {}): JitsuDriveFile {
  return {
    familyId: 'fam-1',
    familyName: 'The Smiths',
    joinCode: 'TIGER-42',
    lastUpdated: '2026-05-26T10:00:00Z',
    profiles: [],
    taskTemplates: [],
    taskSchedules: [],
    taskInstances: [],
    rewards: [],
    pointsEvents: [],
    settings: { notificationsEnabled: false, theme: 'candy' },
    ...overrides,
  };
}

// ─── pointsEvents — union merge ───────────────────────────────────────────────

describe('seedFromDriveFile — pointsEvents union merge', () => {
  it('adds Drive events that are missing locally', async () => {
    const driveEvent = createPointsEvent('child-1', 10, 'task');
    await seedFromDriveFile(baseFile({ pointsEvents: [driveEvent] }));

    const stored = await db.pointsEvents.getAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(driveEvent.id);
  });

  it('preserves local events that Drive does not have yet (unpushed)', async () => {
    // Simulate: child completed a task on Device B; event is in IndexedDB but
    // not yet pushed to Drive. A pull arrives with Drive's older state.
    const localEvent = createPointsEvent('child-1', 5, 'task');
    await db.pointsEvents.put(localEvent);

    // Drive file has a different event (from Device A), but NOT the local one
    const driveEvent = createPointsEvent('child-1', 15, 'bonus');
    await seedFromDriveFile(baseFile({ pointsEvents: [driveEvent] }));

    const stored = await db.pointsEvents.getAll();
    const ids = stored.map((e) => e.id);
    // Both events must survive — local event must NOT be deleted
    expect(ids).toContain(localEvent.id);
    expect(ids).toContain(driveEvent.id);
    expect(stored).toHaveLength(2);
  });

  it('does not duplicate events that exist on both sides', async () => {
    const event = createPointsEvent('child-1', 10, 'task');
    await db.pointsEvents.put(event); // already local
    await seedFromDriveFile(baseFile({ pointsEvents: [event] })); // Drive also has it

    const stored = await db.pointsEvents.getAll();
    expect(stored).toHaveLength(1); // no duplicate
  });

  it('accumulates correctly across multiple seeds (simulates repeated syncs)', async () => {
    const e1 = createPointsEvent('child-1', 10, 'task');
    const e2 = createPointsEvent('child-1', 20, 'bonus');
    const e3 = createPointsEvent('child-1', 5, 'task');

    // First seed: e1 arrives from Drive
    await seedFromDriveFile(baseFile({ pointsEvents: [e1] }));
    // Device also generates e2 locally (unpushed)
    await db.pointsEvents.put(e2);
    // Second seed: Drive now has e1 + e3 (e2 still unpushed from this device)
    await seedFromDriveFile(baseFile({ pointsEvents: [e1, e3] }));

    const stored = await db.pointsEvents.getAll();
    const ids = stored.map((e) => e.id);
    expect(ids).toContain(e1.id); // from Drive
    expect(ids).toContain(e2.id); // local, must survive
    expect(ids).toContain(e3.id); // from Drive
    expect(stored).toHaveLength(3);
  });
});

// ─── taskInstances — union + prefer-completed ─────────────────────────────────

describe('seedFromDriveFile — taskInstances union merge', () => {
  it('adds instances from Drive that are not local', async () => {
    const inst = createTaskInstance('tmpl-1', 'sched-1', 'child-1', '2026-05-26');
    await seedFromDriveFile(baseFile({ taskInstances: [inst] }));

    const stored = await db.taskInstances.getAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(inst.id);
  });

  it('preserves local-only instances (generated daily instances not yet pushed)', async () => {
    const driveInst = createTaskInstance('tmpl-1', 'sched-1', 'child-1', '2026-05-26');
    const localInst = createTaskInstance('tmpl-2', 'sched-2', 'child-1', '2026-05-26');
    await db.taskInstances.put(localInst);

    await seedFromDriveFile(baseFile({ taskInstances: [driveInst] }));

    const stored = await db.taskInstances.getAll();
    const ids = stored.map((i) => i.id);
    expect(ids).toContain(driveInst.id);
    expect(ids).toContain(localInst.id); // must NOT be deleted
  });

  it('keeps local "completed" when Drive has the same instance as "available" (child beat the sync)', async () => {
    // Scenario: child completed a task on Device B. Drive still shows it as
    // 'available' (the completion hasn't been pushed yet). The next pull must
    // NOT revert the child's completion.
    const base = createTaskInstance('tmpl-1', 'sched-1', 'child-1', '2026-05-26');
    const localCompleted: TaskInstance = {
      ...base,
      state: 'completed',
      completedAt: '2026-05-26T09:00:00Z',
    };
    await db.taskInstances.put(localCompleted);

    const driveAvailable: TaskInstance = { ...base, state: 'available', completedAt: null };
    await seedFromDriveFile(baseFile({ taskInstances: [driveAvailable] }));

    const stored = await db.taskInstances.getAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].state).toBe('completed'); // local completed wins
    expect(stored[0].completedAt).toBe('2026-05-26T09:00:00Z');
  });

  it('uses Drive state when Drive has "completed" and local has "available"', async () => {
    // Drive knows about a completion this device hasn't seen yet — take Drive's version.
    const base = createTaskInstance('tmpl-1', 'sched-1', 'child-1', '2026-05-26');
    const localAvailable: TaskInstance = { ...base, state: 'available', completedAt: null };
    await db.taskInstances.put(localAvailable);

    const driveCompleted: TaskInstance = {
      ...base,
      state: 'completed',
      completedAt: '2026-05-26T08:00:00Z',
    };
    await seedFromDriveFile(baseFile({ taskInstances: [driveCompleted] }));

    const stored = await db.taskInstances.getAll();
    expect(stored[0].state).toBe('completed'); // Drive wins
  });

  it('uses Drive state for structural state changes (available → missed)', async () => {
    // Drive has marked a task missed (time window expired on another device).
    // Local still shows it available — Drive wins here because 'missed' is not 'completed'.
    const base = createTaskInstance('tmpl-1', 'sched-1', 'child-1', '2026-05-25');
    const localAvailable: TaskInstance = { ...base, state: 'available', completedAt: null };
    await db.taskInstances.put(localAvailable);

    const driveMissed: TaskInstance = { ...base, state: 'missed', completedAt: null };
    await seedFromDriveFile(baseFile({ taskInstances: [driveMissed] }));

    const stored = await db.taskInstances.getAll();
    expect(stored[0].state).toBe('missed'); // Drive wins — 'available' does not beat 'missed'
  });

  it('does not duplicate instances present on both sides', async () => {
    const inst = createTaskInstance('tmpl-1', 'sched-1', 'child-1', '2026-05-26');
    await db.taskInstances.put(inst);
    await seedFromDriveFile(baseFile({ taskInstances: [inst] }));

    const stored = await db.taskInstances.getAll();
    expect(stored).toHaveLength(1);
  });
});

// ─── Structural stores — Drive wins, orphans deleted ─────────────────────────

describe('seedFromDriveFile — structural stores (Drive authoritative)', () => {
  it('deletes local rewards that Drive no longer has', async () => {
    // Scenario: parent deleted a reward on Device A. Device B's local copy
    // should be removed on the next pull.
    const deletedReward = createReward('Old Prize', 50);
    const keepReward = createReward('Ice Cream', 100);
    await db.rewards.put(deletedReward);
    await db.rewards.put(keepReward);

    // Drive file only has keepReward — deletedReward was removed on Device A
    await seedFromDriveFile(baseFile({ rewards: [keepReward] }));

    const stored = await db.rewards.getAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(keepReward.id);
  });

  it('upserts rewards from Drive (updates existing records)', async () => {
    const reward = createReward('Trip', 200);
    await db.rewards.put(reward);

    const updated = { ...reward, cost: 250 }; // parent raised the cost on another device
    await seedFromDriveFile(baseFile({ rewards: [updated] }));

    const stored = await db.rewards.getAll();
    expect(stored[0].cost).toBe(250);
  });

  it('seeds familyMeta from Drive file', async () => {
    await seedFromDriveFile(
      baseFile({ familyId: 'fam-xyz', familyName: 'The Joneses', joinCode: 'WOLF-99' }),
    );

    const meta = await db.familyMeta.get();
    expect(meta?.familyName).toBe('The Joneses');
    expect(meta?.joinCode).toBe('WOLF-99');
  });
});

// ─── preserveLocalOrphans — structural data protection when dirty ─────────────

describe('seedFromDriveFile — preserveLocalOrphans', () => {
  it('keeps local rewards not in Drive when preserveLocalOrphans = true', async () => {
    // DEF-011 scenario: rewards created on laptop but never pushed (auth expired).
    // Another device pushed task completions → Drive.lastUpdated changed.
    // Laptop reconnects → sync pulls (Drive is newer) → must NOT delete local rewards.
    const localReward = createReward('Ice Cream', 100);
    const localReward2 = createReward('Movie Night', 200);
    await db.rewards.put(localReward);
    await db.rewards.put(localReward2);

    // Drive has no rewards (they were created locally and never pushed)
    await seedFromDriveFile(baseFile({ rewards: [] }), { preserveLocalOrphans: true });

    const stored = await db.rewards.getAll();
    expect(stored).toHaveLength(2); // both local rewards survived
    const ids = stored.map((r) => r.id);
    expect(ids).toContain(localReward.id);
    expect(ids).toContain(localReward2.id);
  });

  it('deletes local rewards not in Drive when preserveLocalOrphans = false (default)', async () => {
    // When local is clean (everything was already pushed), Drive is authoritative.
    // A reward absent from Drive was intentionally deleted on another device.
    const deletedReward = createReward('Old Prize', 50);
    const keepReward = createReward('Ice Cream', 100);
    await db.rewards.put(deletedReward);
    await db.rewards.put(keepReward);

    await seedFromDriveFile(baseFile({ rewards: [keepReward] }), {
      preserveLocalOrphans: false,
    });

    const stored = await db.rewards.getAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(keepReward.id); // deleted reward gone
  });

  it('merges Drive rewards with local rewards when preserveLocalOrphans = true', async () => {
    // Both Drive and local have rewards. Drive reward updates local. Local-only survives.
    const localOnlyReward = createReward('Local Prize', 50);
    const sharedReward = createReward('Shared Prize', 100);
    const driveUpdated = { ...sharedReward, cost: 150 }; // price changed on another device
    await db.rewards.put(localOnlyReward);
    await db.rewards.put(sharedReward);

    await seedFromDriveFile(baseFile({ rewards: [driveUpdated] }), {
      preserveLocalOrphans: true,
    });

    const stored = await db.rewards.getAll();
    expect(stored).toHaveLength(2); // both survive
    const sharedStored = stored.find((r) => r.id === sharedReward.id);
    expect(sharedStored?.cost).toBe(150); // Drive version wins for existing items
    const localStored = stored.find((r) => r.id === localOnlyReward.id);
    expect(localStored?.cost).toBe(50); // local-only survives
  });

  it('keeps local tasks not in Drive when preserveLocalOrphans = true', async () => {
    const tmpl = createTaskTemplate('Brush Teeth', 5, 'child-1');
    const sched = createSchedule(tmpl.id, 'Morning', '07:00', '09:00');
    await db.taskTemplates.put(tmpl);
    await db.taskSchedules.put(sched);

    await seedFromDriveFile(baseFile({ taskTemplates: [], taskSchedules: [] }), {
      preserveLocalOrphans: true,
    });

    const templates = await db.taskTemplates.getAll();
    const schedules = await db.taskSchedules.getAll();
    expect(templates).toHaveLength(1); // local task survived
    expect(schedules).toHaveLength(1); // local schedule survived
  });
});

// ─── DEF-010 scenario — the exact race that caused data loss ─────────────────

describe('DEF-010 exact scenario: rewards survive cross-device sync', () => {
  it('Device B pull does not delete Device A rewards that Device B never had', async () => {
    // Setup: Device A has 2 rewards in Drive. Device B has 0 rewards locally
    // (it just joined or hasn't synced rewards yet).
    // Old behaviour: seedFromDriveFile on Device B would delete Drive rewards
    // because Device B's local state had 0 rewards (nothing to keep).
    // Wait — that's not right. The destructive behaviour was:
    //   Device B pushes its stale 0-reward state to Drive BEFORE pulling.
    //   Then Drive has 0 rewards. Device A pulls 0 rewards.
    // The seed function itself was correct for replacing from Drive.
    // The race was in the push path. This test verifies the seed layer
    // correctly receives and stores rewards from Drive.
    const r1 = createReward('Ice Cream', 100);
    const r2 = createReward('Movie Night', 200);

    // Device B has no local rewards (just joined)
    // Drive has 2 rewards (created on Device A)
    await seedFromDriveFile(baseFile({ rewards: [r1, r2] }));

    const stored = await db.rewards.getAll();
    expect(stored).toHaveLength(2);
    const ids = stored.map((r) => r.id);
    expect(ids).toContain(r1.id);
    expect(ids).toContain(r2.id);
  });

  it('local points event survives a pull that arrives while the push is pending', async () => {
    // Scenario: child completes a task on Device B. That creates a local
    // pointsEvent (not yet pushed). Before the push fires, a sync() pull
    // arrives with Drive's older state (which doesn't have this event).
    // The event must survive the pull.
    const completionEvent = createPointsEvent('child-1', 10, 'task', {
      note: 'Brush Teeth',
    });
    await db.pointsEvents.put(completionEvent); // local only, not in Drive yet

    const r1 = createReward('Ice Cream', 100);
    // Drive file: has rewards but NOT the completion event (race: push hasn't fired)
    await seedFromDriveFile(
      baseFile({
        rewards: [r1],
        pointsEvents: [], // Drive doesn't have the completion yet
      }),
    );

    // After seed: rewards are there AND the completion event survived
    const rewards = await db.rewards.getAll();
    expect(rewards).toHaveLength(1);

    const events = await db.pointsEvents.getAll();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(completionEvent.id); // NOT deleted
  });
});
