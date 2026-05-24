/**
 * Tests for recalculateInstanceStates, generateInstances, todayISO, dateToISO.
 * Fills coverage gaps from Phase 0 + validates the instance generator.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { recalculateInstanceStates, generateInstances, todayISO, dateToISO } from '../tasks';
import type { TaskInstance, TaskSchedule, TaskTemplate } from '../types';

function makeInstance(overrides: Partial<TaskInstance> = {}): TaskInstance {
  return {
    id: 'inst-1',
    templateId: 'tmpl-1',
    scheduleId: 'sched-1',
    childId: 'child-1',
    date: '2026-05-23',
    state: 'available',
    completedAt: null,
    selfiePhotoPath: null,
    ...overrides,
  };
}

function makeSchedule(overrides: Partial<TaskSchedule> = {}): TaskSchedule {
  return {
    id: 'sched-1',
    taskTemplateId: 'tmpl-1',
    label: 'Morning',
    startTime: '07:00',
    endTime: '09:00',
    reminderTime: null,
    recurrence: 'daily',
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<TaskTemplate> = {}): TaskTemplate {
  return {
    id: 'tmpl-1',
    title: 'Brush Teeth',
    icon: 'toothbrush',
    points: 5,
    allowEarlyCompletion: false,
    requiresPhoto: false,
    assignedChildId: 'child-1',
    ...overrides,
  };
}

// ─── todayISO ────────────────────────────────────────────────────────────────

describe('todayISO', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns today in YYYY-MM-DD format', () => {
    vi.setSystemTime(new Date(2026, 4, 23)); // May 23 2026
    const result = todayISO();
    expect(result).toBe('2026-05-23');
  });
});

// ─── dateToISO ────────────────────────────────────────────────────────────────

describe('dateToISO', () => {
  it('formats a Date as YYYY-MM-DD with zero padding', () => {
    expect(dateToISO(new Date(2026, 0, 1))).toBe('2026-01-01'); // Jan  1
    expect(dateToISO(new Date(2026, 11, 31))).toBe('2026-12-31'); // Dec 31
    expect(dateToISO(new Date(2026, 4, 9))).toBe('2026-05-09'); // May  9
  });
});

// ─── recalculateInstanceStates ───────────────────────────────────────────────

describe('recalculateInstanceStates', () => {
  it('updates state when it has changed', () => {
    const inst = makeInstance({ date: '2026-05-23', state: 'locked' });
    const schedule = makeSchedule({ startTime: '07:00', endTime: '09:00' });
    const schedules = new Map([['sched-1', schedule]]);
    const now = new Date(2026, 4, 23, 8, 0); // 08:00 — within window

    const result = recalculateInstanceStates([inst], schedules, now);
    expect(result[0].state).toBe('available');
  });

  it('returns the same object reference when state is unchanged', () => {
    const inst = makeInstance({ date: '2026-05-23', state: 'available' });
    const schedule = makeSchedule({ startTime: '07:00', endTime: '09:00' });
    const schedules = new Map([['sched-1', schedule]]);
    const now = new Date(2026, 4, 23, 8, 0); // 08:00 — same state

    const result = recalculateInstanceStates([inst], schedules, now);
    expect(result[0]).toBe(inst); // same reference — no unnecessary copy
  });

  it('returns instance unchanged when schedule not found', () => {
    const inst = makeInstance({ scheduleId: 'unknown' });
    const schedules = new Map<string, TaskSchedule>();
    const now = new Date();

    const result = recalculateInstanceStates([inst], schedules, now);
    expect(result[0]).toBe(inst);
  });

  it('handles empty instance array', () => {
    const result = recalculateInstanceStates([], new Map(), new Date());
    expect(result).toEqual([]);
  });
});

// ─── generateInstances ───────────────────────────────────────────────────────

describe('generateInstances', () => {
  const template = makeTemplate();
  const schedule = makeSchedule();
  const now = new Date(2026, 4, 23, 8, 0); // 08:00 — within window

  it('generates instances for each date in the range', () => {
    const result = generateInstances(
      template,
      schedule,
      ['2026-05-21', '2026-05-22', '2026-05-23'],
      [],
      now,
    );
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.date)).toEqual(['2026-05-21', '2026-05-22', '2026-05-23']);
  });

  it('sets correct initial state via resolveTaskState', () => {
    const result = generateInstances(template, schedule, ['2026-05-23'], [], now);
    expect(result[0].state).toBe('available'); // 08:00 is within 07:00–09:00
  });

  it('marks past dates as missed', () => {
    const result = generateInstances(template, schedule, ['2026-05-20'], [], now);
    // 2026-05-20 09:00 < now (2026-05-23 08:00) → missed
    expect(result[0].state).toBe('missed');
  });

  it('skips dates that already have an instance for this schedule', () => {
    const existing = [makeInstance({ date: '2026-05-22', scheduleId: 'sched-1' })];
    const result = generateInstances(
      template,
      schedule,
      ['2026-05-22', '2026-05-23'],
      existing,
      now,
    );
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-05-23');
  });

  it('does not skip dates from a different schedule', () => {
    const existing = [makeInstance({ date: '2026-05-22', scheduleId: 'sched-evening' })];
    const result = generateInstances(template, schedule, ['2026-05-22'], existing, now);
    expect(result).toHaveLength(1);
  });

  it('assigns correct childId from template', () => {
    const result = generateInstances(template, schedule, ['2026-05-23'], [], now);
    expect(result[0].childId).toBe('child-1');
  });

  it('returns empty array when all dates already exist', () => {
    const existing = [makeInstance({ date: '2026-05-23', scheduleId: 'sched-1' })];
    const result = generateInstances(template, schedule, ['2026-05-23'], existing, now);
    expect(result).toHaveLength(0);
  });

  it('generates unique IDs for each instance', () => {
    const result = generateInstances(
      template,
      schedule,
      ['2026-05-21', '2026-05-22', '2026-05-23'],
      [],
      now,
    );
    const ids = result.map((r) => r.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('completedAt and selfiePhotoPath default to null', () => {
    const result = generateInstances(template, schedule, ['2026-05-23'], [], now);
    expect(result[0].completedAt).toBeNull();
    expect(result[0].selfiePhotoPath).toBeNull();
  });
});
