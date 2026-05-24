/**
 * Demo family data for development.
 * Dynamically imported only in DEV mode (see ProfilePicker's empty state).
 * Never imported in production builds.
 */
import {
  createProfile,
  createTaskTemplate,
  createSchedule,
  createTaskInstance,
  createPointsEvent,
  createReward,
  dateToISO,
  todayISO,
} from '../domain';
import type { JitsuDriveFile, TaskInstance } from '../domain';

// ─── Profiles ────────────────────────────────────────────────────────────────

const emma = createProfile('Emma', 'speed_hero', { level: 4, currentStreak: 3 });
const liam = createProfile('Liam', 'flame_fox', { level: 2, currentStreak: 1 });

// ─── Task templates ──────────────────────────────────────────────────────────

const brushTeethTemplate = createTaskTemplate('Brush Teeth', 5, emma.id, { icon: '🦷' });
const makesBedTemplate = createTaskTemplate('Make Bed', 10, emma.id, { icon: '🛏️' });
const homeworkTemplate = createTaskTemplate('Do Homework', 20, emma.id, { icon: '📚' });
const feedPetTemplate = createTaskTemplate('Feed the Dog', 15, liam.id, { icon: '🐶' });
const tidyRoomTemplate = createTaskTemplate('Tidy Up Room', 10, liam.id, { icon: '🧹' });

// ─── Schedules ───────────────────────────────────────────────────────────────

const brushTeethMorning = createSchedule(brushTeethTemplate.id, 'Morning', '07:00', '09:00');
const brushTeethEvening = createSchedule(brushTeethTemplate.id, 'Evening', '19:00', '21:00');
const makesBedSchedule = createSchedule(makesBedTemplate.id, 'Morning', '07:30', '09:30');
const homeworkSchedule = createSchedule(homeworkTemplate.id, 'Afternoon', '15:00', '18:00');
const feedPetMorning = createSchedule(feedPetTemplate.id, 'Morning', '07:00', '09:00');
const feedPetEvening = createSchedule(feedPetTemplate.id, 'Evening', '17:00', '19:00');
const tidyRoomSchedule = createSchedule(tidyRoomTemplate.id, 'Evening', '18:00', '20:00');

// ─── Instances (today + a few past days for streak) ──────────────────────────

const today = todayISO();

function daysAgo(n: number): string {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - n);
  return dateToISO(dt);
}

// Build completed instances for the last 3 days to seed a streak
const pastDays = [3, 2, 1];
const pastInstances: TaskInstance[] = pastDays.flatMap((daysBack) => {
  const date = daysAgo(daysBack);
  return [
    createTaskInstance(brushTeethTemplate.id, brushTeethMorning.id, emma.id, date, {
      state: 'completed',
      completedAt: new Date().toISOString(),
    }),
    createTaskInstance(brushTeethTemplate.id, brushTeethEvening.id, emma.id, date, {
      state: 'completed',
      completedAt: new Date().toISOString(),
    }),
    createTaskInstance(makesBedTemplate.id, makesBedSchedule.id, emma.id, date, {
      state: 'completed',
      completedAt: new Date().toISOString(),
    }),
    createTaskInstance(feedPetTemplate.id, feedPetMorning.id, liam.id, date, {
      state: 'completed',
      completedAt: new Date().toISOString(),
    }),
    createTaskInstance(feedPetTemplate.id, feedPetEvening.id, liam.id, date, {
      state: 'completed',
      completedAt: new Date().toISOString(),
    }),
  ];
});

// Today's instances — leave as 'available' so they show up in the home screen
const todayInstances: TaskInstance[] = [
  createTaskInstance(brushTeethTemplate.id, brushTeethMorning.id, emma.id, today, {
    state: 'available',
  }),
  createTaskInstance(brushTeethTemplate.id, brushTeethEvening.id, emma.id, today, {
    state: 'locked',
  }),
  createTaskInstance(makesBedTemplate.id, makesBedSchedule.id, emma.id, today, {
    state: 'available',
  }),
  createTaskInstance(homeworkTemplate.id, homeworkSchedule.id, emma.id, today, { state: 'locked' }),
  createTaskInstance(feedPetTemplate.id, feedPetMorning.id, liam.id, today, { state: 'available' }),
  createTaskInstance(feedPetTemplate.id, feedPetEvening.id, liam.id, today, { state: 'locked' }),
  createTaskInstance(tidyRoomTemplate.id, tidyRoomSchedule.id, liam.id, today, { state: 'locked' }),
];

// ─── Points events (historical points that produce a plausible XP/level) ─────

// Emma has ~450 XP → level 3; add bonus to bring near level 4 boundary (600 XP)
const emmaEvents = [
  ...pastDays.flatMap(() => [
    createPointsEvent(emma.id, 5, 'task', { note: 'Brush Teeth (morning)' }),
    createPointsEvent(emma.id, 5, 'task', { note: 'Brush Teeth (evening)' }),
    createPointsEvent(emma.id, 10, 'task', { note: 'Make Bed' }),
  ]),
  // Extra past history
  ...Array.from({ length: 15 }, () => createPointsEvent(emma.id, 10, 'task', { note: 'Homework' })),
  ...Array.from({ length: 10 }, () =>
    createPointsEvent(emma.id, 5, 'task', { note: 'Brush Teeth' }),
  ),
  createPointsEvent(emma.id, 25, 'bonus', { note: 'Great week!' }),
];

// Liam has ~150 XP → level 2
const liamEvents = [
  ...pastDays.flatMap(() => [
    createPointsEvent(liam.id, 15, 'task', { note: 'Feed the Dog (morning)' }),
    createPointsEvent(liam.id, 15, 'task', { note: 'Feed the Dog (evening)' }),
  ]),
  ...Array.from({ length: 5 }, () => createPointsEvent(liam.id, 10, 'task', { note: 'Tidy Room' })),
];

// ─── Rewards ─────────────────────────────────────────────────────────────────

const rewards = [
  createReward('Extra Screen Time', 50),
  createReward('Choose Dinner', 80),
  createReward('Ice Cream Treat', 100),
  createReward('Stay Up 30 Min Late', 120),
  createReward('Pick a Movie', 60),
];

// ─── Assembled drive file ─────────────────────────────────────────────────────

export const DEMO_FAMILY: JitsuDriveFile = {
  familyId: 'demo-family-id',
  familyName: 'The Demo Family',
  joinCode: 'DEMO-42',
  lastUpdated: new Date().toISOString(),
  profiles: [emma, liam],
  taskTemplates: [
    brushTeethTemplate,
    makesBedTemplate,
    homeworkTemplate,
    feedPetTemplate,
    tidyRoomTemplate,
  ],
  taskSchedules: [
    brushTeethMorning,
    brushTeethEvening,
    makesBedSchedule,
    homeworkSchedule,
    feedPetMorning,
    feedPetEvening,
    tidyRoomSchedule,
  ],
  taskInstances: [...pastInstances, ...todayInstances],
  rewards,
  pointsEvents: [...emmaEvents, ...liamEvents],
  settings: { notificationsEnabled: false, theme: 'candy' },
};
