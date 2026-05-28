/**
 * Jitsu Points — Canonical Domain Types
 * Pure TypeScript. Zero React. Zero browser APIs.
 * See DOMAIN.md for rules and invariants.
 */

// ─── Identifiers ────────────────────────────────────────────────────────────

export type UUID = string;
export type ISODate = string; // "YYYY-MM-DD"
export type ISOTimestamp = string; // ISO 8601 full timestamp
export type HHMMTime = string; // "HH:MM" 24-hour

// ─── Child Profile ───────────────────────────────────────────────────────────

export type AvatarId =
  | 'speed_hero'
  | 'water_pup'
  | 'leaf_ninja'
  | 'flame_fox'
  | 'star_kid'
  | 'moon_cub';

export interface ChildProfile {
  id: UUID;
  name: string;
  avatar: AvatarId;
  // level and currentStreak are DERIVED — recomputed on sync/open
  // They are stored here only as a display cache for offline reads
  level: number;
  currentStreak: number;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface TaskTemplate {
  id: UUID;
  title: string;
  icon: string;
  points: number; // Must be > 0
  allowEarlyCompletion: boolean; // Default: false
  requiresPhoto: boolean; // Default: false
  assignedChildIds: UUID[]; // one or more children; replaces singular assignedChildId
}

// 0 = Sunday … 6 = Saturday (matches Date.getDay())
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Recurrence =
  | { type: 'daily' } // every day
  | { type: 'weekly'; days: DayOfWeek[] } // specific days, e.g. [0,6] = weekends
  | { type: 'once'; date: ISODate }; // single occurrence on this exact date

export interface TaskSchedule {
  id: UUID;
  taskTemplateId: UUID;
  label: string; // e.g. "Morning", "Evening"
  startTime: HHMMTime;
  endTime: HHMMTime;
  reminderTime: HHMMTime | null;
  recurrence: Recurrence;
}

export type TaskState = 'locked' | 'available' | 'completed' | 'missed';

export interface TaskInstance {
  id: UUID;
  templateId: UUID;
  scheduleId: UUID;
  childId: UUID;
  date: ISODate;
  state: TaskState;
  completedAt: ISOTimestamp | null;
  selfiePhotoPath: string | null;
}

// ─── Points ──────────────────────────────────────────────────────────────────

export type PointsEventType = 'task' | 'reward' | 'bonus' | 'demerit';

export interface PointsEvent {
  id: UUID;
  childId: UUID;
  delta: number; // Positive = earn, Negative = spend/demerit
  type: PointsEventType;
  sourceId: UUID | null; // TaskInstance.id, Reward.id, or null
  note: string | null;
  timestamp: ISOTimestamp;
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface Reward {
  id: UUID;
  title: string;
  cost: number; // Must be > 0
  enabled: boolean;
}

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  notificationsEnabled: boolean;
  theme: string;
}

// ─── Drive File (root of jitsu-points.json) ──────────────────────────────────

export interface JitsuDriveFile {
  familyId: UUID;
  familyName: string;
  joinCode: string;
  lastUpdated: ISOTimestamp;
  profiles: ChildProfile[];
  taskTemplates: TaskTemplate[];
  taskSchedules: TaskSchedule[];
  taskInstances: TaskInstance[];
  rewards: Reward[];
  pointsEvents: PointsEvent[];
  settings: AppSettings;
}
