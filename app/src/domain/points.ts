/**
 * Points engine — pure functions.
 * No side effects, no imports from outside domain/.
 */
import type { PointsEvent } from './types';

// ─── Level Thresholds ────────────────────────────────────────────────────────

export const LEVEL_THRESHOLDS: ReadonlyArray<{ level: number; xpRequired: number }> = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 300 },
  { level: 4, xpRequired: 600 },
  { level: 5, xpRequired: 1_000 },
  { level: 6, xpRequired: 1_500 },
  { level: 7, xpRequired: 2_200 },
  { level: 8, xpRequired: 3_000 },
  { level: 9, xpRequired: 4_000 },
  { level: 10, xpRequired: 5_500 },
];

const MAX_DEMERIT = 20;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Current spendable points for a child. Can be negative.
 */
export function currentPoints(events: PointsEvent[], childId: string): number {
  return events
    .filter(e => e.childId === childId)
    .reduce((sum, e) => sum + e.delta, 0);
}

/**
 * Lifetime XP for a child. Never decreases — only positive deltas count.
 */
export function lifetimeXp(events: PointsEvent[], childId: string): number {
  return events
    .filter(e => e.childId === childId && e.delta > 0)
    .reduce((sum, e) => sum + e.delta, 0);
}

/**
 * Level derived from lifetime XP. Never decreases.
 */
export function levelFromXp(xp: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) {
      level = threshold.level;
    } else {
      break;
    }
  }
  return level;
}

/**
 * XP required for the next level, or null if already max level.
 */
export function xpToNextLevel(xp: number): number | null {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp < threshold.xpRequired) {
      return threshold.xpRequired - xp;
    }
  }
  return null; // Max level
}

/**
 * Clamp a demerit amount to the max allowed. Always returns a negative number.
 * e.g. applyDemerit(25) → -20, applyDemerit(10) → -10
 */
export function clampDemerit(requestedAmount: number): number {
  return -Math.min(Math.abs(requestedAmount), MAX_DEMERIT);
}

/**
 * Progress toward the next level, as a value between 0 and 1.
 */
export function levelProgress(xp: number): number {
  const currentLevel = levelFromXp(xp);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);

  if (!nextThreshold || !currentThreshold) return 1; // Max level

  const xpIntoLevel = xp - currentThreshold.xpRequired;
  const xpForLevel = nextThreshold.xpRequired - currentThreshold.xpRequired;
  return Math.min(xpIntoLevel / xpForLevel, 1);
}
