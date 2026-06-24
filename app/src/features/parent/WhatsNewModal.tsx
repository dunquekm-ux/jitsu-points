import ChunkyButton from '../../shared/components/ChunkyButton';
import { LATEST_RELEASE } from '../../core/whatsNew';
import styles from './WhatsNewModal.module.css';

interface Props {
  onDismiss: () => void;
}

export default function WhatsNewModal({ onDismiss }: Props) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal aria-label="What's new">
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.sparkle}>✨</span>
          <h2 className={styles.title}>What's New</h2>
          <span className={styles.version}>{LATEST_RELEASE.version}</span>
        </div>
        <p className={styles.headline}>{LATEST_RELEASE.headline}</p>

        <ul className={styles.list}>
          {LATEST_RELEASE.items.map((item) => (
            <li key={item.title} className={styles.item}>
              <span className={styles.itemIcon}>{item.icon}</span>
              <div className={styles.itemText}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemBody}>{item.body}</span>
              </div>
            </li>
          ))}
        </ul>

        <ChunkyButton variant="primary" size="lg" fullWidth onClick={onDismiss}>
          Got it! 🥷
        </ChunkyButton>
      </div>
    </div>
  );
}
