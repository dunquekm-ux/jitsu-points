/**
 * AndroidInstallBanner — shown to Android Chrome users when the PWA is installable.
 *
 * Chrome on Android fires a `beforeinstallprompt` event when the install criteria
 * are met. We capture it, hide Chrome's default mini-infobar, and show our own
 * branded banner with a friendly install CTA.
 *
 * Conditions to show:
 *  1. Browser fired `beforeinstallprompt` (Chrome / Edge on Android)
 *  2. User hasn't permanently dismissed the banner (localStorage key)
 *  3. Not already installed in standalone mode
 */
import { useState, useEffect, useRef } from 'react';
import styles from './AndroidInstallBanner.module.css';

const DISMISS_KEY = 'jitsu_android_banner_dismissed';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AndroidInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed — never show
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Previously dismissed — never show
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault(); // Suppress Chrome's mini-infobar
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    setInstalling(true);
    try {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt.current = null;
        setVisible(false);
      }
    } catch {
      // Ignore — user may have dismissed the native prompt
    } finally {
      setInstalling(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">⚡</span>
      <div className={styles.text}>
        <strong>Add Jitsu to your home screen</strong> for the best experience and task reminders.
      </div>
      <button
        className={styles.installBtn}
        onClick={handleInstall}
        disabled={installing}
      >
        {installing ? '…' : 'Install'}
      </button>
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
