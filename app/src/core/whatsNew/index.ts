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
  headline: 'Better bonuses & a new points history',
  items: [
    {
      icon: '📜',
      title: 'Points history for kids and parents',
      body: "Tap any child on your dashboard to see their full points history — every bonus, mission, reward and check-in, with the reason and amount. Kids get their own 'History' tab too, so they can see exactly how they earned their stars.",
    },
    {
      icon: '🎉',
      title: 'Bonus popups your child can count on',
      body: 'When you give a bonus, your child now reliably sees the celebration on their own device — even on a different tablet or after the app was closed. No more bonuses that quietly disappear.',
    },
    {
      icon: '✅',
      title: 'Confirmation when you give a bonus',
      body: 'Giving a bonus or a check-in now shows a quick confirmation so you always know it saved.',
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
