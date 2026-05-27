import { describe, it, expect } from 'vitest';
import { resolveTaskState, calculateStreak, dateRange } from '../tasks';
import type { TaskInstance, TaskSchedule } from '../types';

function makeInstance(overrides: Partial<TaskInstance>): TaskInstance {
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

function makeSchedule(overrides: Partial<TaskSchedule>): TaskSchedule {
  return {
    id: 'sched-1',
    taskTemplateId: 'tmpl-1',
    label: 'Morning',
    startTime: '07:00',
    endTime: '09:00',
    reminderTime: null,
    recurrence: { type: 'daily' },
    ...overrides,
  };
}

describe('resolveTaskState', () => {
  const schedule = makeSchedule({ startTime: '07:00', endTime: '09:00' });
  const instance = makeInstance({ date: '2026-05-23' });

  it('returns locked before startTime', () => {
    const now = new Date(2026, 4, 23, 6, 59); // 06:59
    expect(resolveTaskState(instance, schedule, now)).toBe('locked');
  });

  it('returns available within time window', () => {
    const now = new Date(2026, 4, 23, 8, 0); // 08:00
    expect(resolveTaskState(instance, schedule, now)).toBe('available');
  });

  it('returns missed after endTime', () => {
    const now = new Date(2026, 4, 23, 9, 1); // 09:01
    expect(resolveTaskState(instance, schedule, now)).toBe('missed');
  });

  it('completed is terminal regardless of time', () => {
    const completedInst = makeInstance({ state: 'completed', completedAt: '2026-05-23T07:30:00Z' });
    const afterEnd = new Date(2026, 4, 23, 10, 0);
    expect(resolveTaskState(completedInst, schedule, afterEnd)).toBe('completed');
  });

  it('returns available exactly at startTime', () => {
    const now = new Date(2026, 4, 23, 7, 0); // exactly 07:00
    expect(resolveTaskState(instance, schedule, now)).toBe('available');
  });

  it('returns available exactly at endTime boundary', () => {
    // At endTime exactly — still within window
    const now = new Date(2026, 4, 23, 9, 0); // exactly 09:00
    expect(resolveTaskState(instance, schedule, now)).toBe('available');
  });
});

describe('dateRange', () => {
  it('returns today only when days=1', () => {
    expect(dateRange('2026-05-23', 1)).toEqual(['2026-05-23']);
  });

  it('returns 3 days including today', () => {
    expect(dateRange('2026-05-23', 3)).toEqual(['2026-05-21', '2026-05-22', '2026-05-23']);
  });

  it('handles month rollover', () => {
    expect(dateRange('2026-06-01', 2)).toEqual(['2026-05-31', '2026-06-01']);
  });
});

describe('calculateStreak', () => {
  it('returns 0 when no instances exist', () => {
    expect(calculateStreak([], 'child-1', '2026-05-23')).toBe(0);
  });

  it('returns 1 for a single completed day today', () => {
    const instances = [makeInstance({ date: '2026-05-23', state: 'completed' })];
    expect(calculateStreak(instances, 'child-1', '2026-05-23')).toBe(1);
  });

  it('returns 0 when today is not completed', () => {
    const instances = [makeInstance({ date: '2026-05-23', state: 'available' })];
    expect(calculateStreak(instances, 'child-1', '2026-05-23')).toBe(0);
  });

  it('counts consecutive completed days', () => {
    const instances = [
      makeInstance({ date: '2026-05-21', state: 'completed' }),
      makeInstance({ date: '2026-05-22', state: 'completed' }),
      makeInstance({ date: '2026-05-23', state: 'completed' }),
    ];
    expect(calculateStreak(instances, 'child-1', '2026-05-23')).toBe(3);
  });

  it('breaks on a missed day', () => {
    const instances = [
      makeInstance({ date: '2026-05-20', state: 'completed' }),
      makeInstance({ date: '2026-05-21', state: 'missed' }), // streak breaks here
      makeInstance({ date: '2026-05-22', state: 'completed' }),
      makeInstance({ date: '2026-05-23', state: 'completed' }),
    ];
    expect(calculateStreak(instances, 'child-1', '2026-05-23')).toBe(2);
  });

  it('ignores instances for other children', () => {
    const instances = [
      makeInstance({ childId: 'child-2', date: '2026-05-23', state: 'completed' }),
    ];
    expect(calculateStreak(instances, 'child-1', '2026-05-23')).toBe(0);
  });
});
