/**
 * Drive file validation — parse and validate the raw JSON from Google Drive.
 * Returns a typed JitsuDriveFile or throws a descriptive error.
 * Pure TypeScript, no external schema library needed at this data scale.
 */
import type {
  JitsuDriveFile,
  ChildProfile,
  TaskTemplate,
  TaskSchedule,
  TaskInstance,
  PointsEvent,
  Reward,
  AppSettings,
  AvatarId,
  TaskState,
  PointsEventType,
} from './types';

export class DriveFileValidationError extends Error {
  constructor(message: string) {
    super(`JitsuDriveFile validation failed: ${message}`);
    this.name = 'DriveFileValidationError';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isString(v: unknown, field: string): string {
  if (typeof v !== 'string') throw new DriveFileValidationError(`${field} must be a string`);
  return v;
}

function isNumber(v: unknown, field: string): number {
  if (typeof v !== 'number') throw new DriveFileValidationError(`${field} must be a number`);
  return v;
}

function isBoolean(v: unknown, field: string): boolean {
  if (typeof v !== 'boolean') throw new DriveFileValidationError(`${field} must be a boolean`);
  return v;
}

function isArray(v: unknown, field: string): unknown[] {
  if (!Array.isArray(v)) throw new DriveFileValidationError(`${field} must be an array`);
  return v;
}

function isObject(v: unknown, field: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new DriveFileValidationError(`${field} must be an object`);
  }
  return v as Record<string, unknown>;
}

function isStringOrNull(v: unknown, field: string): string | null {
  if (v === null) return null;
  return isString(v, field);
}

const VALID_AVATARS: AvatarId[] = [
  'speed_hero',
  'water_pup',
  'leaf_ninja',
  'flame_fox',
  'star_kid',
  'moon_cub',
];
const VALID_TASK_STATES: TaskState[] = ['locked', 'available', 'completed', 'missed'];
const VALID_EVENT_TYPES: PointsEventType[] = ['task', 'reward', 'bonus', 'demerit'];

// ─── Per-type validators ──────────────────────────────────────────────────────

function validateProfile(raw: unknown, idx: number): ChildProfile {
  const o = isObject(raw, `profiles[${idx}]`);
  const id = isString(o.id, `profiles[${idx}].id`);
  const name = isString(o.name, `profiles[${idx}].name`);
  const avatar = isString(o.avatar, `profiles[${idx}].avatar`);
  if (!VALID_AVATARS.includes(avatar as AvatarId)) {
    throw new DriveFileValidationError(`profiles[${idx}].avatar is not a valid AvatarId`);
  }
  return {
    id,
    name,
    avatar: avatar as AvatarId,
    level: typeof o.level === 'number' ? o.level : 1,
    currentStreak: typeof o.currentStreak === 'number' ? o.currentStreak : 0,
  };
}

function validateTaskTemplate(raw: unknown, idx: number): TaskTemplate {
  const o = isObject(raw, `taskTemplates[${idx}]`);
  return {
    id: isString(o.id, `taskTemplates[${idx}].id`),
    title: isString(o.title, `taskTemplates[${idx}].title`),
    icon: isString(o.icon, `taskTemplates[${idx}].icon`),
    points: isNumber(o.points, `taskTemplates[${idx}].points`),
    allowEarlyCompletion: isBoolean(
      o.allowEarlyCompletion,
      `taskTemplates[${idx}].allowEarlyCompletion`,
    ),
    requiresPhoto: isBoolean(o.requiresPhoto, `taskTemplates[${idx}].requiresPhoto`),
    assignedChildId: isString(o.assignedChildId, `taskTemplates[${idx}].assignedChildId`),
  };
}

function validateTaskSchedule(raw: unknown, idx: number): TaskSchedule {
  const o = isObject(raw, `taskSchedules[${idx}]`);
  const recurrence = isString(o.recurrence, `taskSchedules[${idx}].recurrence`);
  if (recurrence !== 'daily') {
    throw new DriveFileValidationError(`taskSchedules[${idx}].recurrence must be "daily"`);
  }
  return {
    id: isString(o.id, `taskSchedules[${idx}].id`),
    taskTemplateId: isString(o.taskTemplateId, `taskSchedules[${idx}].taskTemplateId`),
    label: isString(o.label, `taskSchedules[${idx}].label`),
    startTime: isString(o.startTime, `taskSchedules[${idx}].startTime`),
    endTime: isString(o.endTime, `taskSchedules[${idx}].endTime`),
    reminderTime: isStringOrNull(o.reminderTime ?? null, `taskSchedules[${idx}].reminderTime`),
    recurrence: 'daily',
  };
}

function validateTaskInstance(raw: unknown, idx: number): TaskInstance {
  const o = isObject(raw, `taskInstances[${idx}]`);
  const state = isString(o.state, `taskInstances[${idx}].state`);
  if (!VALID_TASK_STATES.includes(state as TaskState)) {
    throw new DriveFileValidationError(`taskInstances[${idx}].state is not a valid TaskState`);
  }
  return {
    id: isString(o.id, `taskInstances[${idx}].id`),
    templateId: isString(o.templateId, `taskInstances[${idx}].templateId`),
    scheduleId: isString(o.scheduleId, `taskInstances[${idx}].scheduleId`),
    childId: isString(o.childId, `taskInstances[${idx}].childId`),
    date: isString(o.date, `taskInstances[${idx}].date`),
    state: state as TaskState,
    completedAt: isStringOrNull(o.completedAt ?? null, `taskInstances[${idx}].completedAt`),
    selfiePhotoPath: isStringOrNull(
      o.selfiePhotoPath ?? null,
      `taskInstances[${idx}].selfiePhotoPath`,
    ),
  };
}

function validatePointsEvent(raw: unknown, idx: number): PointsEvent {
  const o = isObject(raw, `pointsEvents[${idx}]`);
  const type = isString(o.type, `pointsEvents[${idx}].type`);
  if (!VALID_EVENT_TYPES.includes(type as PointsEventType)) {
    throw new DriveFileValidationError(`pointsEvents[${idx}].type is not a valid PointsEventType`);
  }
  return {
    id: isString(o.id, `pointsEvents[${idx}].id`),
    childId: isString(o.childId, `pointsEvents[${idx}].childId`),
    delta: isNumber(o.delta, `pointsEvents[${idx}].delta`),
    type: type as PointsEventType,
    sourceId: isStringOrNull(o.sourceId ?? null, `pointsEvents[${idx}].sourceId`),
    note: isStringOrNull(o.note ?? null, `pointsEvents[${idx}].note`),
    timestamp: isString(o.timestamp, `pointsEvents[${idx}].timestamp`),
  };
}

function validateReward(raw: unknown, idx: number): Reward {
  const o = isObject(raw, `rewards[${idx}]`);
  return {
    id: isString(o.id, `rewards[${idx}].id`),
    title: isString(o.title, `rewards[${idx}].title`),
    cost: isNumber(o.cost, `rewards[${idx}].cost`),
    enabled: isBoolean(o.enabled, `rewards[${idx}].enabled`),
  };
}

function validateSettings(raw: unknown): AppSettings {
  const o = isObject(raw, 'settings');
  return {
    notificationsEnabled:
      typeof o.notificationsEnabled === 'boolean' ? o.notificationsEnabled : false,
    theme: typeof o.theme === 'string' ? o.theme : 'candy',
  };
}

// ─── Root validator ───────────────────────────────────────────────────────────

/**
 * Parse and validate raw JSON from Google Drive.
 * Throws DriveFileValidationError with a descriptive message on failure.
 */
export function validateDriveFile(raw: unknown): JitsuDriveFile {
  const o = isObject(raw, 'root');

  return {
    familyId: isString(o.familyId, 'familyId'),
    familyName: isString(o.familyName, 'familyName'),
    joinCode: isString(o.joinCode, 'joinCode'),
    lastUpdated: isString(o.lastUpdated, 'lastUpdated'),
    profiles: isArray(o.profiles, 'profiles').map(validateProfile),
    taskTemplates: isArray(o.taskTemplates, 'taskTemplates').map(validateTaskTemplate),
    taskSchedules: isArray(o.taskSchedules, 'taskSchedules').map(validateTaskSchedule),
    taskInstances: isArray(o.taskInstances, 'taskInstances').map(validateTaskInstance),
    rewards: isArray(o.rewards, 'rewards').map(validateReward),
    pointsEvents: isArray(o.pointsEvents, 'pointsEvents').map(validatePointsEvent),
    settings: validateSettings(o.settings ?? {}),
  };
}

/**
 * Safe version — returns null instead of throwing.
 * Logs the error to the console for debugging.
 */
export function tryValidateDriveFile(raw: unknown): JitsuDriveFile | null {
  try {
    return validateDriveFile(raw);
  } catch (err) {
    console.error(err);
    return null;
  }
}
