import ChunkyButton from '../components/ChunkyButton';
import styles from './DemeritOverlay.module.css';

interface Props {
  delta: number; // negative number, e.g. -10
  note: string;
  onDismiss: () => void;
}

export default function DemeritOverlay({ delta, note, onDismiss }: Props) {
  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <span className={styles.icon}>💙</span>
        <p className={styles.headline}>Let's do better</p>
        <p className={styles.points}>{delta} ⭐</p>
        {note && <p className={styles.note}>{note}</p>}
        <p className={styles.encourage}>You've got this — keep going! 🌱</p>
        <ChunkyButton variant="ghost" onClick={onDismiss}>
          OK, I understand
        </ChunkyButton>
      </div>
    </div>
  );
}
