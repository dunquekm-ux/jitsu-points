import { describe, it, expect } from 'vitest';
import { validateDriveFile, tryValidateDriveFile, DriveFileValidationError } from '../validate';
import type { JitsuDriveFile } from '../types';

function makeValidFile(overrides: Partial<JitsuDriveFile> = {}): unknown {
  return {
    familyId: 'fam-1',
    familyName: 'The Smiths',
    joinCode: 'TIGER-42',
    lastUpdated: '2026-05-23T09:00:00Z',
    profiles: [
      {
        id: 'child-1',
        name: 'Emma',
        avatar: 'speed_hero',
        level: 4,
        currentStreak: 12,
      },
    ],
    taskTemplates: [
      {
        id: 'tmpl-1',
        title: 'Brush Teeth',
        icon: 'toothbrush',
        points: 5,
        allowEarlyCompletion: false,
        requiresPhoto: false,
        assignedChildId: 'child-1',
      },
    ],
    taskSchedules: [
      {
        id: 'sched-1',
        taskTemplateId: 'tmpl-1',
        label: 'Morning',
        startTime: '07:00',
        endTime: '09:00',
        reminderTime: null,
        recurrence: 'daily',
      },
    ],
    taskInstances: [
      {
        id: 'inst-1',
        templateId: 'tmpl-1',
        scheduleId: 'sched-1',
        childId: 'child-1',
        date: '2026-05-23',
        state: 'completed',
        completedAt: '2026-05-23T07:30:00Z',
        selfiePhotoPath: null,
      },
    ],
    rewards: [
      {
        id: 'reward-1',
        title: 'Ice Cream',
        cost: 100,
        enabled: true,
      },
    ],
    pointsEvents: [
      {
        id: 'evt-1',
        childId: 'child-1',
        delta: 5,
        type: 'task',
        sourceId: 'inst-1',
        note: null,
        timestamp: '2026-05-23T07:30:00Z',
      },
    ],
    settings: {
      notificationsEnabled: false,
      theme: 'candy',
    },
    ...overrides,
  };
}

describe('validateDriveFile', () => {
  it('returns a valid typed object for a correct file', () => {
    const result = validateDriveFile(makeValidFile());
    expect(result.familyId).toBe('fam-1');
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].name).toBe('Emma');
    expect(result.pointsEvents[0].delta).toBe(5);
  });

  it('throws DriveFileValidationError for null input', () => {
    expect(() => validateDriveFile(null)).toThrow(DriveFileValidationError);
  });

  it('throws for invalid root type (array)', () => {
    expect(() => validateDriveFile([])).toThrow(DriveFileValidationError);
  });

  it('throws when familyId is missing', () => {
    const raw = makeValidFile() as Record<string, unknown>;
    delete raw.familyId;
    expect(() => validateDriveFile(raw)).toThrow(/familyId must be a string/);
  });

  it('throws for invalid avatar', () => {
    const raw = makeValidFile() as Record<string, unknown>;
    (raw.profiles as Record<string, unknown>[])[0].avatar = 'unknown_avatar';
    expect(() => validateDriveFile(raw)).toThrow(/AvatarId/);
  });

  it('throws for invalid task state', () => {
    const raw = makeValidFile() as Record<string, unknown>;
    (raw.taskInstances as Record<string, unknown>[])[0].state = 'invalid';
    expect(() => validateDriveFile(raw)).toThrow(/TaskState/);
  });

  it('throws for invalid event type', () => {
    const raw = makeValidFile() as Record<string, unknown>;
    (raw.pointsEvents as Record<string, unknown>[])[0].type = 'unknown';
    expect(() => validateDriveFile(raw)).toThrow(/PointsEventType/);
  });

  it('throws when schedule recurrence is not daily', () => {
    const raw = makeValidFile() as Record<string, unknown>;
    (raw.taskSchedules as Record<string, unknown>[])[0].recurrence = 'weekly';
    expect(() => validateDriveFile(raw)).toThrow(/daily/);
  });

  it('throws when profiles is not an array', () => {
    const raw = makeValidFile() as Record<string, unknown>;
    raw.profiles = 'not-an-array';
    expect(() => validateDriveFile(raw)).toThrow(/profiles must be an array/);
  });

  it('uses defaults for missing optional fields (level, currentStreak, settings)', () => {
    const raw = makeValidFile() as Record<string, unknown>;
    const profile = { ...(raw.profiles as Record<string, unknown>[])[0] };
    delete profile.level;
    delete profile.currentStreak;
    (raw.profiles as unknown[]) = [profile];
    delete (raw as Record<string, unknown>).settings;

    const result = validateDriveFile(raw);
    expect(result.profiles[0].level).toBe(1);
    expect(result.profiles[0].currentStreak).toBe(0);
    expect(result.settings.notificationsEnabled).toBe(false);
    expect(result.settings.theme).toBe('candy');
  });

  it('handles null completedAt and selfiePhotoPath on TaskInstance', () => {
    const result = validateDriveFile(makeValidFile());
    const inst = result.taskInstances[0];
    expect(inst.completedAt).toBe('2026-05-23T07:30:00Z');
    expect(inst.selfiePhotoPath).toBeNull();
  });

  it('handles null reminderTime on TaskSchedule', () => {
    const result = validateDriveFile(makeValidFile());
    expect(result.taskSchedules[0].reminderTime).toBeNull();
  });

  it('handles null sourceId and note on PointsEvent', () => {
    const result = validateDriveFile(makeValidFile());
    expect(result.pointsEvents[0].note).toBeNull();
  });
});

describe('tryValidateDriveFile', () => {
  it('returns parsed file on success', () => {
    const result = tryValidateDriveFile(makeValidFile());
    expect(result).not.toBeNull();
    expect(result!.familyId).toBe('fam-1');
  });

  it('returns null on validation failure', () => {
    const result = tryValidateDriveFile(null);
    expect(result).toBeNull();
  });
});
