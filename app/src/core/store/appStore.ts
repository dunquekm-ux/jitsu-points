/**
 * Global app store — the single source of state for the child experience.
 * Loads from IndexedDB on open, writes back on every mutation.
 * Sync (Drive) happens in the background via markDirty/schedulePush.
 */
import { create } from 'zustand';
import { db } from '../db';
import { seedFromDriveFile } from '../db/seed';
import { markDirty, schedulePush } from '../sync/engine';
import { useAuthStore } from '../auth/store';
import { pushDriveFile, pullDriveFile } from '../drive';
import {
  currentPoints,
  lifetimeXp,
  levelFromXp,
  clampDemerit,
  generateInstances,
  recalculateInstanceStates,
  createPointsEvent,
  createTaskTemplate,
  createSchedule,
  createReward,
  createProfile,
  createFamilyFile,
  generateJoinCode,
  normaliseJoinCode,
  dateRange,
  todayISO,
} from '../../domain';
import type {
  AvatarId,
  ChildProfile,
  TaskTemplate,
  TaskSchedule,
  TaskInstance,
  PointsEvent,
  Reward,
  Recurrence,
} from '../../domain';

// ─── Parent form types ────────────────────────────────────────────────────────

export interface ScheduleSlot {
  label: string;
  startTime: string;
  endTime: string;
  reminderTime: string | null;
  recurrence: Recurrence;
}

export interface NewTaskData {
  title: string;
  icon: string;
  points: number;
  assignedChildId: string;
  allowEarlyCompletion: boolean;
  schedules: ScheduleSlot[];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CelebrationPayload {
  delta: number;
  title: string;
  newLevel: number | null; // non-null if the task triggered a level-up
}

interface AppState {
  // Raw data from DB
  profiles: ChildProfile[];
  taskTemplates: Record<string, TaskTemplate>;
  taskSchedules: Record<string, TaskSchedule>;
  taskInstances: TaskInstance[];
  pointsEvents: PointsEvent[];
  rewards: Reward[];
  familyName: string;
  joinCode: string;

  // UI state
  activeChildId: string | null;
  isLoaded: boolean;
  hasFamilyData: boolean;

  // Overlay state
  celebration: CelebrationPayload | null;
  levelUp: { level: number; childName: string } | null;
  redemptionTitle: string | null;
  pendingBonus: { childId: string; delta: number; note: string } | null;
  pendingDemerit: { childId: string; delta: number; note: string } | null;

  // Actions — child
  load: () => Promise<void>;
  selectChild: (id: string | null) => void;
  completeTask: (instanceId: string) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<void>;
  addBonus: (childId: string, delta: number, note: string) => Promise<void>;
  addDemerit: (childId: string, amount: number, note: string) => Promise<void>;
  dismissCelebration: () => void;
  dismissLevelUp: () => void;
  dismissRedemption: () => void;
  dismissBonus: () => void;
  dismissDemerit: () => void;

  // Actions — parent tasks
  createTask: (data: NewTaskData) => Promise<string>;
  updateTask: (templateId: string, data: NewTaskData) => Promise<void>;
  deleteTask: (templateId: string) => Promise<void>;

  // Actions — parent rewards
  createRewardItem: (title: string, cost: number) => Promise<void>;
  updateRewardItem: (rewardId: string, changes: Partial<Reward>) => Promise<void>;
  toggleReward: (rewardId: string) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;

  // Actions — parent kids
  createChild: (name: string, avatar: AvatarId) => Promise<ChildProfile>;
  updateChild: (childId: string, changes: Partial<ChildProfile>) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;

  // Actions — onboarding
  initFamily: (
    familyName: string,
    childName: string,
    childAvatar: AvatarId,
    accessToken: string,
  ) => Promise<string>;
  joinFamily: (rawCode: string, accessToken: string) => Promise<void>;

  // Dev helper
  _seedDemo: (file: Parameters<typeof seedFromDriveFile>[0]) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STREAK_WINDOW_DAYS = 30;

async function flushToDB(
  newInstances: TaskInstance[],
  newEvents: PointsEvent[],
  updatedInstances: TaskInstance[],
): Promise<void> {
  await Promise.all([
    ...newInstances.map((i) => db.taskInstances.put(i)),
    ...newEvents.map((e) => db.pointsEvents.put(e)),
    ...updatedInstances.map((i) => db.taskInstances.put(i)),
  ]);
  await markDirty();
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) schedulePush(token);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  taskTemplates: {},
  taskSchedules: {},
  taskInstances: [],
  pointsEvents: [],
  rewards: [],
  familyName: '',
  joinCode: '',
  activeChildId: null,
  isLoaded: false,
  hasFamilyData: false,
  celebration: null,
  levelUp: null,
  redemptionTitle: null,
  pendingBonus: null,
  pendingDemerit: null,

  // ─── load ─────────────────────────────────────────────────────────────────

  load: async () => {
    const now = new Date();
    const today = todayISO();
    const window = dateRange(today, STREAK_WINDOW_DAYS);

    // Load everything from DB in parallel
    const [
      profilesList,
      templatesList,
      schedulesList,
      existingInstances,
      eventsList,
      rewardsList,
      meta,
    ] = await Promise.all([
      db.profiles.getAll(),
      db.taskTemplates.getAll(),
      db.taskSchedules.getAll(),
      db.taskInstances.getAll(),
      db.pointsEvents.getAll(),
      db.rewards.getAll(),
      db.familyMeta.get(),
    ]);

    // Build lookup maps
    const templateMap: Record<string, TaskTemplate> = {};
    for (const t of templatesList) templateMap[t.id] = t;

    const scheduleMap: Record<string, TaskSchedule> = {};
    for (const s of schedulesList) scheduleMap[s.id] = s;

    // Generate missing instances for the streak window
    const newInstances: TaskInstance[] = [];
    for (const template of templatesList) {
      const schedules = schedulesList.filter((s) => s.taskTemplateId === template.id);
      for (const schedule of schedules) {
        const generated = generateInstances(template, schedule, window, existingInstances, now);
        newInstances.push(...generated);
      }
    }

    // Persist new instances
    if (newInstances.length > 0) {
      await Promise.all(newInstances.map((i) => db.taskInstances.put(i)));
    }

    const allInstances = [...existingInstances, ...newInstances];

    // Recalculate states
    const schedMapForRecalc = new Map(Object.entries(scheduleMap));
    const recalculated = recalculateInstanceStates(allInstances, schedMapForRecalc, now);

    // Persist any state changes
    const changed = recalculated.filter((r, i) => r.state !== allInstances[i]?.state);
    if (changed.length > 0) {
      await Promise.all(changed.map((i) => db.taskInstances.put(i)));
    }

    set({
      profiles: profilesList,
      taskTemplates: templateMap,
      taskSchedules: scheduleMap,
      taskInstances: recalculated,
      pointsEvents: eventsList,
      rewards: rewardsList,
      familyName: meta?.familyName ?? '',
      joinCode: meta?.joinCode ?? '',
      hasFamilyData: !!meta,
      isLoaded: true,
    });
  },

  // ─── selectChild ─────────────────────────────────────────────────────────

  selectChild: (id) => set({ activeChildId: id }),

  // ─── completeTask ─────────────────────────────────────────────────────────

  completeTask: async (instanceId) => {
    const state = get();
    const instance = state.taskInstances.find((i) => i.id === instanceId);
    if (!instance || instance.state !== 'available') return;

    const template = state.taskTemplates[instance.templateId];
    if (!template) return;

    const now = new Date();
    const completedInstance: TaskInstance = {
      ...instance,
      state: 'completed',
      completedAt: now.toISOString(),
    };

    const prevXp = lifetimeXp(state.pointsEvents, instance.childId);
    const prevLevel = levelFromXp(prevXp);

    const event = createPointsEvent(instance.childId, template.points, 'task', {
      sourceId: instanceId,
      note: template.title,
    });

    // Optimistic update
    const updatedInstances = state.taskInstances.map((i) =>
      i.id === instanceId ? completedInstance : i,
    );
    const updatedEvents = [...state.pointsEvents, event];
    const newXp = lifetimeXp(updatedEvents, instance.childId);
    const newLevel = levelFromXp(newXp);

    set({
      taskInstances: updatedInstances,
      pointsEvents: updatedEvents,
      celebration: {
        delta: template.points,
        title: template.title,
        newLevel: newLevel > prevLevel ? newLevel : null,
      },
    });

    await flushToDB([], [event], [completedInstance]);

    // Refresh profile level/streak cache
    const updatedProfile = state.profiles.find((p) => p.id === instance.childId);
    if (updatedProfile && newLevel > prevLevel) {
      const refreshed = { ...updatedProfile, level: newLevel };
      await db.profiles.put(refreshed);
      set((s) => ({ profiles: s.profiles.map((p) => (p.id === refreshed.id ? refreshed : p)) }));
    }
  },

  // ─── redeemReward ─────────────────────────────────────────────────────────

  redeemReward: async (rewardId) => {
    const state = get();
    const reward = state.rewards.find((r) => r.id === rewardId && r.enabled);
    if (!reward || !state.activeChildId) return;

    const pts = currentPoints(state.pointsEvents, state.activeChildId);
    if (pts < reward.cost) return; // not enough points

    const event = createPointsEvent(state.activeChildId, -reward.cost, 'reward', {
      sourceId: rewardId,
      note: reward.title,
    });

    set((s) => ({
      pointsEvents: [...s.pointsEvents, event],
      redemptionTitle: reward.title,
    }));

    await flushToDB([], [event], []);
  },

  // ─── addBonus ─────────────────────────────────────────────────────────────

  addBonus: async (childId, delta, note) => {
    const absDelta = Math.abs(delta);
    const event = createPointsEvent(childId, absDelta, 'bonus', { note });
    set((s) => ({
      pointsEvents: [...s.pointsEvents, event],
      pendingBonus: { childId, delta: absDelta, note },
    }));
    await flushToDB([], [event], []);
  },

  // ─── addDemerit ───────────────────────────────────────────────────────────

  addDemerit: async (childId, amount, note) => {
    const delta = clampDemerit(amount);
    const event = createPointsEvent(childId, delta, 'demerit', { note });
    set((s) => ({
      pointsEvents: [...s.pointsEvents, event],
      pendingDemerit: { childId, delta, note },
    }));
    await flushToDB([], [event], []);
  },

  // ─── Overlay dismissals ───────────────────────────────────────────────────

  dismissCelebration: () => {
    const { celebration } = get();
    if (celebration?.newLevel) {
      const { profiles, activeChildId } = get();
      const profile = profiles.find((p) => p.id === activeChildId);
      set({
        celebration: null,
        levelUp: { level: celebration.newLevel, childName: profile?.name ?? '' },
      });
    } else {
      set({ celebration: null });
    }
  },
  dismissLevelUp: () => set({ levelUp: null }),
  dismissRedemption: () => set({ redemptionTitle: null }),
  dismissBonus: () => set({ pendingBonus: null }),
  dismissDemerit: () => set({ pendingDemerit: null }),

  // ─── createTask ───────────────────────────────────────────────────────────

  createTask: async (data) => {
    const template = createTaskTemplate(data.title, data.points, data.assignedChildId, {
      icon: data.icon,
      allowEarlyCompletion: data.allowEarlyCompletion,
    });
    const schedules = data.schedules.map((s) =>
      createSchedule(template.id, s.label, s.startTime, s.endTime, {
        reminderTime: s.reminderTime,
        recurrence: s.recurrence,
      }),
    );
    await db.taskTemplates.put(template);
    await Promise.all(schedules.map((s) => db.taskSchedules.put(s)));
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({
      taskTemplates: { ...s.taskTemplates, [template.id]: template },
      taskSchedules: {
        ...s.taskSchedules,
        ...Object.fromEntries(schedules.map((s) => [s.id, s])),
      },
    }));
    return template.id;
  },

  // ─── updateTask ───────────────────────────────────────────────────────────

  updateTask: async (templateId, data) => {
    const existing = get().taskTemplates[templateId];
    if (!existing) return;
    const updated: TaskTemplate = {
      ...existing,
      title: data.title,
      icon: data.icon,
      points: data.points,
      assignedChildId: data.assignedChildId,
      allowEarlyCompletion: data.allowEarlyCompletion,
    };
    // Delete old schedules for this template
    const oldSchedules = Object.values(get().taskSchedules).filter(
      (s) => s.taskTemplateId === templateId,
    );
    await db.taskTemplates.put(updated);
    await Promise.all(oldSchedules.map((s) => db.taskSchedules.delete(s.id)));
    const newSchedules = data.schedules.map((s) =>
      createSchedule(templateId, s.label, s.startTime, s.endTime, {
        reminderTime: s.reminderTime,
        recurrence: s.recurrence,
      }),
    );
    await Promise.all(newSchedules.map((s) => db.taskSchedules.put(s)));
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    const newSchedMap = { ...get().taskSchedules };
    for (const s of oldSchedules) delete newSchedMap[s.id];
    for (const s of newSchedules) newSchedMap[s.id] = s;
    set((s) => ({
      taskTemplates: { ...s.taskTemplates, [templateId]: updated },
      taskSchedules: newSchedMap,
    }));
  },

  // ─── deleteTask ───────────────────────────────────────────────────────────

  deleteTask: async (templateId) => {
    const schedules = Object.values(get().taskSchedules).filter(
      (s) => s.taskTemplateId === templateId,
    );
    await db.taskTemplates.delete(templateId);
    await Promise.all(schedules.map((s) => db.taskSchedules.delete(s.id)));
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    const newTemplates = { ...get().taskTemplates };
    delete newTemplates[templateId];
    const newSchedules = { ...get().taskSchedules };
    for (const s of schedules) delete newSchedules[s.id];
    set({ taskTemplates: newTemplates, taskSchedules: newSchedules });
  },

  // ─── createRewardItem ─────────────────────────────────────────────────────

  createRewardItem: async (title, cost) => {
    const reward = createReward(title, cost);
    await db.rewards.put(reward);
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({ rewards: [...s.rewards, reward] }));
  },

  // ─── updateRewardItem ─────────────────────────────────────────────────────

  updateRewardItem: async (rewardId, changes) => {
    const existing = get().rewards.find((r) => r.id === rewardId);
    if (!existing) return;
    const updated = { ...existing, ...changes };
    await db.rewards.put(updated);
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({ rewards: s.rewards.map((r) => (r.id === rewardId ? updated : r)) }));
  },

  // ─── toggleReward ─────────────────────────────────────────────────────────

  toggleReward: async (rewardId) => {
    const existing = get().rewards.find((r) => r.id === rewardId);
    if (!existing) return;
    const updated = { ...existing, enabled: !existing.enabled };
    await db.rewards.put(updated);
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({ rewards: s.rewards.map((r) => (r.id === rewardId ? updated : r)) }));
  },

  // ─── deleteReward ─────────────────────────────────────────────────────────

  deleteReward: async (rewardId) => {
    await db.rewards.delete(rewardId);
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({ rewards: s.rewards.filter((r) => r.id !== rewardId) }));
  },

  // ─── createChild ─────────────────────────────────────────────────────────

  createChild: async (name, avatar) => {
    const profile = createProfile(name, avatar);
    await db.profiles.put(profile);
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({ profiles: [...s.profiles, profile] }));
    return profile;
  },

  // ─── updateChild ─────────────────────────────────────────────────────────

  updateChild: async (childId, changes) => {
    const existing = get().profiles.find((p) => p.id === childId);
    if (!existing) return;
    const updated = { ...existing, ...changes };
    await db.profiles.put(updated);
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({ profiles: s.profiles.map((p) => (p.id === childId ? updated : p)) }));
  },

  // ─── deleteChild ─────────────────────────────────────────────────────────

  deleteChild: async (childId) => {
    await db.profiles.delete(childId);
    await markDirty();
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) schedulePush(token);
    set((s) => ({ profiles: s.profiles.filter((p) => p.id !== childId) }));
  },

  // ─── initFamily ──────────────────────────────────────────────────────────

  initFamily: async (familyName, childName, childAvatar, accessToken) => {
    const joinCode = generateJoinCode();
    const profile = createProfile(childName, childAvatar);
    const driveFile = createFamilyFile(familyName, joinCode, profile);

    // Seed IndexedDB (also writes familyMeta)
    await seedFromDriveFile(driveFile);

    // Push to Drive if we have a token
    if (accessToken) {
      try {
        const fileId = await pushDriveFile(driveFile, accessToken);
        await db.syncMeta.set({
          driveFileId: fileId,
          lastSyncedAt: new Date().toISOString(),
          isDirty: false,
        });
      } catch (err) {
        console.warn('[initFamily] Drive push failed, will retry on next sync', err);
        await markDirty();
      }
    }

    await get().load();
    return joinCode;
  },

  // ─── joinFamily ───────────────────────────────────────────────────────────

  joinFamily: async (rawCode, accessToken) => {
    const result = await pullDriveFile(accessToken);
    if (!result) {
      throw new Error(
        'No Jitsu Points data found on this Google account. Make sure you sign in with the same account the family was created on.',
      );
    }
    if (normaliseJoinCode(result.file.joinCode) !== normaliseJoinCode(rawCode)) {
      throw new Error('Join code does not match. Check the code and try again.');
    }
    await seedFromDriveFile(result.file);
    await db.syncMeta.set({
      driveFileId: result.fileId,
      lastSyncedAt: new Date().toISOString(),
      isDirty: false,
    });
    await get().load();
  },

  // ─── Dev helper ───────────────────────────────────────────────────────────

  _seedDemo: async (file) => {
    await seedFromDriveFile(file);
    await get().load();
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectChildPoints(state: AppState, childId: string): number {
  return currentPoints(state.pointsEvents, childId);
}

export function selectChildXp(state: AppState, childId: string): number {
  return lifetimeXp(state.pointsEvents, childId);
}

export function selectChildLevel(state: AppState, childId: string): number {
  return levelFromXp(lifetimeXp(state.pointsEvents, childId));
}

export function selectTodaysTasks(state: AppState, childId: string): TaskInstance[] {
  const today = todayISO();
  return state.taskInstances.filter((i) => i.childId === childId && i.date === today);
}
