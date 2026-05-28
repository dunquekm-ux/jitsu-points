import { describe, it, expect } from 'vitest';
import {
  createProfile,
  createTaskTemplate,
  createSchedule,
  createTaskInstance,
  createPointsEvent,
  createReward,
  defaultSettings,
  createFamilyFile,
} from '../factories';

describe('createProfile', () => {
  it('creates a profile with correct defaults', () => {
    const p = createProfile('Emma', 'speed_hero');
    expect(p.name).toBe('Emma');
    expect(p.avatar).toBe('speed_hero');
    expect(p.level).toBe(1);
    expect(p.currentStreak).toBe(0);
    expect(typeof p.id).toBe('string');
  });

  it('accepts overrides', () => {
    const p = createProfile('Max', 'flame_fox', { level: 5, currentStreak: 10 });
    expect(p.level).toBe(5);
    expect(p.currentStreak).toBe(10);
  });

  it('generates unique IDs on successive calls', () => {
    const a = createProfile('A', 'star_kid');
    const b = createProfile('B', 'moon_cub');
    expect(a.id).not.toBe(b.id);
  });
});

describe('createTaskTemplate', () => {
  it('creates a template with correct defaults', () => {
    const t = createTaskTemplate('Brush Teeth', 5, ['child-1']);
    expect(t.title).toBe('Brush Teeth');
    expect(t.points).toBe(5);
    expect(t.assignedChildIds).toEqual(['child-1']);
    expect(t.allowEarlyCompletion).toBe(false);
    expect(t.requiresPhoto).toBe(false);
  });
});

describe('createSchedule', () => {
  it('creates a schedule with correct defaults', () => {
    const s = createSchedule('tmpl-1', 'Morning', '07:00', '09:00');
    expect(s.label).toBe('Morning');
    expect(s.startTime).toBe('07:00');
    expect(s.endTime).toBe('09:00');
    expect(s.reminderTime).toBeNull();
    expect(s.recurrence).toEqual({ type: 'daily' });
  });
});

describe('createTaskInstance', () => {
  it('creates an instance with locked state and null dates', () => {
    const i = createTaskInstance('tmpl-1', 'sched-1', 'child-1', '2026-05-23');
    expect(i.state).toBe('locked');
    expect(i.completedAt).toBeNull();
    expect(i.selfiePhotoPath).toBeNull();
    expect(i.date).toBe('2026-05-23');
  });
});

describe('createPointsEvent', () => {
  it('creates a task event', () => {
    const e = createPointsEvent('child-1', 10, 'task');
    expect(e.delta).toBe(10);
    expect(e.type).toBe('task');
    expect(e.childId).toBe('child-1');
    expect(e.note).toBeNull();
    expect(e.sourceId).toBeNull();
    expect(typeof e.timestamp).toBe('string');
  });
});

describe('createReward', () => {
  it('creates an enabled reward by default', () => {
    const r = createReward('Ice Cream', 100);
    expect(r.title).toBe('Ice Cream');
    expect(r.cost).toBe(100);
    expect(r.enabled).toBe(true);
  });
});

describe('defaultSettings', () => {
  it('returns expected defaults', () => {
    const s = defaultSettings();
    expect(s.notificationsEnabled).toBe(false);
    expect(s.theme).toBe('candy');
  });
});

describe('createFamilyFile', () => {
  it('creates a valid drive file structure', () => {
    const profile = createProfile('Emma', 'speed_hero');
    const file = createFamilyFile('The Smiths', 'TIGER-42', profile);

    expect(file.familyName).toBe('The Smiths');
    expect(file.joinCode).toBe('TIGER-42');
    expect(file.profiles).toHaveLength(1);
    expect(file.profiles[0]).toBe(profile);
    expect(file.taskTemplates).toHaveLength(0);
    expect(file.pointsEvents).toHaveLength(0);
    expect(typeof file.familyId).toBe('string');
    expect(typeof file.lastUpdated).toBe('string');
  });
});
