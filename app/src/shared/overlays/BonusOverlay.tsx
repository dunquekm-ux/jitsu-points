import ChunkyButton from '../components/ChunkyButton';
import styles from './BonusOverlay.module.css';

interface Props {
  delta: number;
  note: string;
  onDismiss: () => void;
}

export default function BonusOverlay({ delta, note, onDismiss }: Props) {
  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <span className={styles.icon}>🎉</span>
        <p className={styles.headline}>Surprise bonus!</p>
        <p className={styles.points}>+{delta} ⭐</p>
        {note && <p className={styles.note}>{note}</p>}
        <ChunkyButton variant="primary" onClick={onDismiss}>
          Woohoo!
        </ChunkyButton>
      </div>
    </div>
  );
}
