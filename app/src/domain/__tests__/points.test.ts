import { describe, it, expect } from 'vitest';
import {
  currentPoints,
  lifetimeXp,
  levelFromXp,
  clampDemerit,
  levelProgress,
  xpToNextLevel,
  LEVEL_THRESHOLDS,
} from '../points';
import type { PointsEvent } from '../types';

function makeEvent(overrides: Partial<PointsEvent>): PointsEvent {
  return {
    id: 'evt-1',
    childId: 'child-1',
    delta: 10,
    type: 'task',
    sourceId: null,
    note: null,
    timestamp: '2026-05-23T09:00:00Z',
    ...overrides,
  };
}

describe('currentPoints', () => {
  it('returns 0 for empty events', () => {
    expect(currentPoints([], 'child-1')).toBe(0);
  });

  it('sums all deltas for child', () => {
    const events = [makeEvent({ delta: 50 }), makeEvent({ delta: 30 }), makeEvent({ delta: -20 })];
    expect(currentPoints(events, 'child-1')).toBe(60);
  });

  it('ignores events for other children', () => {
    const events = [
      makeEvent({ childId: 'child-1', delta: 100 }),
      makeEvent({ childId: 'child-2', delta: 50 }),
    ];
    expect(currentPoints(events, 'child-1')).toBe(100);
    expect(currentPoints(events, 'child-2')).toBe(50);
  });

  it('can return a negative balance', () => {
    const events = [makeEvent({ delta: 10 }), makeEvent({ delta: -20 })];
    expect(currentPoints(events, 'child-1')).toBe(-10);
  });
});

describe('lifetimeXp', () => {
  it('only sums positive deltas', () => {
    const events = [
      makeEvent({ delta: 50 }),
      makeEvent({ delta: -20 }), // demerit — not counted
      makeEvent({ delta: -100 }), // reward redemption — not counted
      makeEvent({ delta: 30 }),
    ];
    expect(lifetimeXp(events, 'child-1')).toBe(80);
  });

  it('never decreases (ignores all negative events)', () => {
    const events = [makeEvent({ delta: -999 })];
    expect(lifetimeXp(events, 'child-1')).toBe(0);
  });
});

describe('levelFromXp', () => {
  it('returns level 1 at 0 XP', () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it('returns correct level at exact thresholds', () => {
    for (const { level, xpRequired } of LEVEL_THRESHOLDS) {
      expect(levelFromXp(xpRequired)).toBe(level);
    }
  });

  it('returns the lower level just before a threshold', () => {
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(299)).toBe(2);
    expect(levelFromXp(599)).toBe(3);
  });

  it('returns max level (10) at very high XP', () => {
    expect(levelFromXp(99_999)).toBe(10);
  });
});

describe('clampDemerit', () => {
  it('clamps to -20 when exceeding max', () => {
    expect(clampDemerit(25)).toBe(-20);
    expect(clampDemerit(100)).toBe(-20);
  });

  it('returns negative value at or below max', () => {
    expect(clampDemerit(20)).toBe(-20);
    expect(clampDemerit(10)).toBe(-10);
    expect(clampDemerit(1)).toBe(-1);
  });

  it('handles negative input (caller passed negative amount)', () => {
    expect(clampDemerit(-15)).toBe(-15);
    expect(clampDemerit(-30)).toBe(-20);
  });
});

describe('levelProgress', () => {
  it('returns 0 progress at level start', () => {
    expect(levelProgress(0)).toBe(0); // level 1 start
    expect(levelProgress(100)).toBe(0); // level 2 start
  });

  it('returns 0.5 at halfway through a level', () => {
    // Level 1: 0–99, Level 2 starts at 100
    // Halfway = 50 XP
    expect(levelProgress(50)).toBe(0.5);
  });

  it('returns 1 at max level', () => {
    expect(levelProgress(99_999)).toBe(1);
  });
});

describe('xpToNextLevel', () => {
  it('returns XP needed to reach level 2', () => {
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpToNextLevel(50)).toBe(50);
  });

  it('returns null at max level', () => {
    expect(xpToNextLevel(99_999)).toBeNull();
  });
});
