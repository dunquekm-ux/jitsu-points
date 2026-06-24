/**
 * "What's New" release notes + version-gating.
 *
 * Shows a one-time modal in Parent Mode after the app updates to a new version.
 * - Returning users (no record, or an older record) see it once, then it's marked seen.
 * - Brand-new families call `markWhatsNewSeen()` at the end of onboarding, so they
 *   never see notes for features they're already getting fresh.
 */
import { APP_VERSION } from '../../version';

const STORAGE_KEY = 'jitsu-last-seen-version';

export interface ReleaseNoteItem {
  icon: string;
  title: string;
  body: string;
}

export interface ReleaseNotes {
  version: string;
  headline: string;
  items: ReleaseNoteItem[];
}

/** The notes shown by the modal — update this each release that has user-facing changes. */
export const LATEST_RELEASE: ReleaseNotes = {
  version: APP_VERSION,
  headline: 'Parent updates to make setup faster',
  items: [
    {
      icon: '📋',
      title: 'Duplicate a task in one tap',
      body: 'Tap Duplicate on any task to get a ready-made copy — points, schedule, icon, and kids already filled in. Tweak it, save it, and your original stays untouched.',
    },
    {
      icon: '🔤',
      title: 'Sort your task list',
      body: 'New Name / Points buttons above your tasks. Tap to sort, tap again to flip the order — find the right task in seconds.',
    },
    {
      icon: '✏️',
      title: 'A friendlier points field',
      body: 'The points box now clears cleanly and lets you type any value. Tap it and the number highlights so you can type straight over it.',
    },
  ],
};

/** Read the last version the user acknowledged (null if never). */
function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** True when there are notes the user hasn't seen yet for the current build. */
export function shouldShowWhatsNew(): boolean {
  return getLastSeenVersion() !== APP_VERSION;
}

/** Record the current build as seen, so the modal won't show again until the next release. */
export function markWhatsNewSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
  } catch {
    // localStorage unavailable (private mode / disabled) — modal may show again; acceptable.
  }
}
