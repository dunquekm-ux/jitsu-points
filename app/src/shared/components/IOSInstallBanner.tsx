/**
 * IOSInstallBanner — shown to iOS Safari users who haven't installed the PWA.
 *
 * Web Push on iOS requires the app to be added to the Home Screen (iOS 16.4+).
 * This banner surfaces that requirement at the right moment, once per session
 * (or until dismissed permanently).
 *
 * Conditions to show:
 *  1. Running on iOS
 *  2. In Safari (not already installed / not in standalone mode)
 *  3. Notifications API is available (user's iOS version supports web push)
 *  4. User hasn't permanently dismissed the banner
 */
import { useState } from 'react';
import styles from './IOSInstallBanner.module.css';

const DISMISS_KEY = 'jitsu_ios_banner_dismissed';

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isSafariNonInstalled(): boolean {
  // Standalone mode means the PWA is already installed — don't show
  if (window.matchMedia('(display-mode: standalone)').matches) return false;
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return false;
  // Check it's Safari (not Chrome/Firefox on iOS which use different install flows)
  return /^((?!chrome|android|fxios|crios).)*safari/i.test(navigator.userAgent);
}

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(
    () =>
      isIOS() &&
      isSafariNonInstalled() &&
      'Notification' in window &&
      !localStorage.getItem(DISMISS_KEY),
  );

  if (!visible) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">
        📲
      </span>
      <div className={styles.text}>
        <strong>Get task reminders!</strong> Tap <span className={styles.shareIcon}>⎙</span>{' '}
        <strong>Share</strong> → <strong>Add to Home Screen</strong> in Safari.
      </div>
      <button
        className={styles.dismiss}
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
      >
        ✕
      </button>
    </div>
  );
}
