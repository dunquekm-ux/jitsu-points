import { useEffect } from 'react';
import ChunkyButton from '../components/ChunkyButton';
import { playLevelUp } from '../../core/audio';
import styles from './LevelUpOverlay.module.css';

interface Props {
  level: number;
  childName: string;
  onDismiss: () => void;
}

export default function LevelUpOverlay({ level, childName, onDismiss }: Props) {
  useEffect(() => { playLevelUp(); }, []);

  return (
    <div className={styles.overlay} role="dialog" aria-modal aria-label="Level up">
      <div className={styles.card}>
        <div className={styles.burst}>✨</div>
        <div className={styles.badge}>Level {level}</div>
        <h2 className={styles.title}>Level Up!</h2>
        <p className={styles.sub}>{childName} reached Level {level}! 🥷</p>
        <ChunkyButton variant="primary" size="lg" fullWidth onClick={onDismiss}>
          Let's Go! ⚡
        </ChunkyButton>
      </div>
    </div>
  );
}
