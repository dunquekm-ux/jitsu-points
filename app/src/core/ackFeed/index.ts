/**
 * Acknowledgement feed — reliable "unseen bonus/demerit" detection for the child.
 *
 * Why this exists (DEF / Phase 8.11):
 * The old child popup was driven by in-memory Zustand state (`pendingBonus` /
 * `pendingDemerit`). It only fired on the same session/device, only if that child
 * was active, and only before any reload — so on a separate child tablet it never
 * appeared and after a refresh it was lost ("sometimes it shows, sometimes not").
 *
 * Fix: derive the signal from the **persisted `pointsEvents`** (which already carry
 * `type`, `delta`, `note`, `timestamp`) plus a per-child, per-device "seen" set of
 * event IDs in localStorage. The child reliably sees each new bonus/demerit exactly
 * once, surviving reloads and working across devices.
 *
 * "Seen" is intentionally device-local (localStorage, like `whatsNew`): a celebration
 * popup is a per-device moment, and the permanent record lives in the audit log.
 */
import type { PointsEvent } from '../../domain';

const STORAGE_KEY = 'jitsu-ack-seen';

/**
 * Only bonuses/demerits from the last week can pop. This bounds the one-time
 * "replay" when an existing family first updates to this build, and avoids
 * surfacing a stale celebration if a child hasn't opened the app in a while —
 * the audit log still records everything permanently.
 */
const RECENCY_MS = 7 * 24 * 60 * 60 * 1000;

/** Keep the per-child seen list bounded (bonus/demerit volume is low). */
const MAX_IDS_PER_CHILD = 300;

type SeenMap = Record<string, string[]>;

function read(): SeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

function write(map: SeenMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private mode / disabled) — popups may repeat; acceptable.
  }
}

function isAck(e: PointsEvent): boolean {
  return e.type === 'bonus' || e.type === 'demerit';
}

/**
 * Bonus/demerit events for this child that haven't been acknowledged on this
 * device yet and are still recent enough to celebrate, oldest first.
 */
export function getUnseenAcks(
  childId: string,
  events: PointsEvent[],
  nowMs: number = Date.now(),
): PointsEvent[] {
  const seen = new Set(read()[childId] ?? []);
  return events
    .filter((e) => e.childId === childId && isAck(e) && !seen.has(e.id))
    .filter((e) => nowMs - Date.parse(e.timestamp) <= RECENCY_MS)
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
}

/** Record specific event IDs as seen for a child (called as each popup is dismissed). */
export function markAckSeen(childId: string, ...eventIds: string[]): void {
  if (eventIds.length === 0) return;
  const map = read();
  const merged = [...(map[childId] ?? []), ...eventIds];
  // De-dupe while preserving order, then cap to the most recent N.
  map[childId] = [...new Set(merged)].slice(-MAX_IDS_PER_CHILD);
  write(map);
}

/**
 * Mark every existing bonus/demerit as already seen, for every child.
 * Called when a device first establishes its data (demo seed / joining an existing
 * family) so it doesn't replay celebrations for history it's only just received.
 */
export function markAllAcksSeen(events: PointsEvent[]): void {
  const map = read();
  for (const e of events) {
    if (!isAck(e)) continue;
    const merged = [...(map[e.childId] ?? []), e.id];
    map[e.childId] = [...new Set(merged)].slice(-MAX_IDS_PER_CHILD);
  }
  write(map);
}
