/**
 * Jitsu mascot — CSS/emoji placeholder until Rive state machine is ready (Phase 7).
 * The mood prop maps to an expression; swap this entire component for the Rive version.
 */
import styles from './JitsuMascot.module.css';

export type MascotMood = 'happy' | 'wow' | 'calm' | 'sleep' | 'cheer';

const MOOD_EMOJI: Record<MascotMood, string> = {
  happy: '🥷',
  wow: '😮',
  calm: '😌',
  sleep: '😴',
  cheer: '🎉',
};

interface Props {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
}

export default function JitsuMascot({ mood = 'happy', size = 'md' }: Props) {
  return (
    <div className={[styles.mascot, styles[size], styles[mood]].join(' ')} aria-hidden="true">
      <span className={styles.face}>{MOOD_EMOJI[mood]}</span>
    </div>
  );
}
