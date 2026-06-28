/**
 * Shared points-history (audit log) list — used by both the child's "Points Story"
 * screen and the parent's per-child audit screen (Phase 8.12 / 8.13).
 *
 * Presentational only: give it a child's points events and it renders them
 * newest-first with an icon, label, reason, and signed amount per row. Every
 * bonus/demerit/task/reward already lives in `pointsEvents`, so this is purely a view.
 */
import type { PointsEvent, PointsEventType } from '../../domain';
import styles from './PointsHistoryList.module.css';

interface TypeMeta {
  icon: string;
  label: string;
}

const TYPE_META: Record<PointsEventType, TypeMeta> = {
  task: { icon: '✅', label: 'Mission' },
  bonus: { icon: '🎉', label: 'Bonus' },
  reward: { icon: '🎁', label: 'Reward' },
  demerit: { icon: '💙', label: 'Check-in' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface Props {
  events: PointsEvent[];
  /** Friendly message shown when there's nothing yet. */
  emptyMessage?: string;
}

export default function PointsHistoryList({ events, emptyMessage }: Props) {
  // Newest first; copy so we never mutate the store array.
  const ordered = [...events].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0,
  );

  if (ordered.length === 0) {
    return (
      <div className={styles.empty} data-testid="history-empty">
        <span className={styles.emptyIcon}>🗒️</span>
        <p>{emptyMessage ?? 'No points history yet.'}</p>
      </div>
    );
  }

  return (
    <ul className={styles.list} data-testid="history-list">
      {ordered.map((e) => {
        const meta = TYPE_META[e.type];
        const positive = e.delta >= 0;
        return (
          <li key={e.id} className={styles.row} data-testid="history-row">
            <span className={styles.icon}>{meta.icon}</span>
            <div className={styles.info}>
              <span className={styles.primary}>{e.note?.trim() || meta.label}</span>
              <span className={styles.secondary}>
                {meta.label} · {formatWhen(e.timestamp)}
              </span>
            </div>
            <span
              className={[styles.delta, positive ? styles.deltaUp : styles.deltaDown].join(' ')}
            >
              {positive ? `+${e.delta}` : e.delta} ⭐
            </span>
          </li>
        );
      })}
    </ul>
  );
}
