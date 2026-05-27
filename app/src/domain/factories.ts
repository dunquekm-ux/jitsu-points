/**
 * Domain object factories — create valid new entities with correct defaults.
 * Every factory takes required fields + optional overrides.
 */
import { generateId } from './id';
import type {
  ChildProfile,
  AvatarId,
  TaskTemplate,
  TaskSchedule,
  TaskInstance,
  PointsEvent,
  PointsEventType,
  Reward,
  AppSettings,
  JitsuDriveFile,
} from './types';

// ─── ChildProfile ─────────────────────────────────────────────────────────────

export function createProfile(
  name: string,
  avatar: AvatarId,
  overrides?: Partial<ChildProfile>,
): ChildProfile {
  return {
    id: generateId(),
    name,
    avatar,
    level: 1,
    currentStreak: 0,
    ...overrides,
  };
}

// ─── TaskTemplate ─────────────────────────────────────────────────────────────

export function createTaskTemplate(
  title: string,
  points: number,
  assignedChildId: string,
  overrides?: Partial<TaskTemplate>,
): TaskTemplate {
  return {
    id: generateId(),
    title,
    icon: 'star',
    points,
    allowEarlyCompletion: false,
    requiresPhoto: false,
    assignedChildId,
    ...overrides,
  };
}

// ─── TaskSchedule ─────────────────────────────────────────────────────────────

export function createSchedule(
  taskTemplateId: string,
  label: string,
  startTime: string,
  endTime: string,
  overrides?: Partial<TaskSchedule>,
): TaskSchedule {
  return {
    id: generateId(),
    taskTemplateId,
    label,
    startTime,
    endTime,
    reminderTime: null,
    recurrence: { type: 'daily' },
    ...overrides,
  };
}

// ─── TaskInstance ─────────────────────────────────────────────────────────────

export function createTaskInstance(
  templateId: string,
  scheduleId: string,
  childId: string,
  date: string,
  overrides?: Partial<TaskInstance>,
): TaskInstance {
  return {
    id: generateId(),
    templateId,
    scheduleId,
    childId,
    date,
    state: 'locked',
    completedAt: null,
    selfiePhotoPath: null,
    ...overrides,
  };
}

// ─── PointsEvent ─────────────────────────────────────────────────────────────

export function createPointsEvent(
  childId: string,
  delta: number,
  type: PointsEventType,
  overrides?: Partial<PointsEvent>,
): PointsEvent {
  return {
    id: generateId(),
    childId,
    delta,
    type,
    sourceId: null,
    note: null,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Reward ───────────────────────────────────────────────────────────────────

export function createReward(title: string, cost: number, overrides?: Partial<Reward>): Reward {
  return {
    id: generateId(),
    title,
    cost,
    enabled: true,
    ...overrides,
  };
}

// ─── Default AppSettings ─────────────────────────────────────────────────────

export function defaultSettings(): AppSettings {
  return {
    notificationsEnabled: false,
    theme: 'candy',
  };
}

// ─── New Family Drive File ────────────────────────────────────────────────────

export function createFamilyFile(
  familyName: string,
  joinCode: string,
  firstProfile: ChildProfile,
): JitsuDriveFile {
  return {
    familyId: generateId(),
    familyName,
    joinCode,
    lastUpdated: new Date().toISOString(),
    profiles: [firstProfile],
    taskTemplates: [],
    taskSchedules: [],
    taskInstances: [],
    rewards: [],
    pointsEvents: [],
    settings: defaultSettings(),
  };
}
