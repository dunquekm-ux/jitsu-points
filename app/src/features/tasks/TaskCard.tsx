import { useNavigate } from 'react-router-dom';
import PointsBadge from '../../shared/components/PointsBadge';
import type { TaskInstance, TaskTemplate, TaskState } from '../../domain';
import styles from './TaskCard.module.css';

interface Props {
  instance: TaskInstance;
  template: TaskTemplate;
  scheduleLabel: string;
}

const STATE_CONFIG: Record<TaskState, { emoji: string; label: string; color: string }> = {
  available: { emoji: '⚡', label: 'Ready!', color: 'var(--color-state-available)' },
  locked: { emoji: '🔒', label: 'Not yet', color: 'var(--color-state-locked)' },
  completed: { emoji: '✅', label: 'Done!', color: 'var(--color-state-completed)' },
  missed: { emoji: '💨', label: 'Missed', color: 'var(--color-state-missed)' },
};

export default function TaskCard({ instance, template, scheduleLabel }: Props) {
  const navigate = useNavigate();
  const config = STATE_CONFIG[instance.state];

  // DEF-008: All states navigate to TaskDetailScreen — detail screen shows the
  // appropriate message (complete button only shown when available).
  // Previously only 'available' was clickable, so locked/missed/completed cards
  // were silent dead zones that confused users.
  function handleClick() {
    navigate(`/child/${instance.childId}/task/${instance.id}`);
  }

  return (
    <button
      type="button"
      className={[styles.card, styles[instance.state]].join(' ')}
      onClick={handleClick}
      aria-label={`${template.title} — ${config.label}`}
      data-testid={instance.state === 'available' ? 'task-card-available' : undefined}
      style={{ '--state-color': config.color } as React.CSSProperties}
    >
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{template.icon || '📋'}</span>
      </div>

      <div className={styles.info}>
        <span className={styles.title}>{template.title}</span>
        <span className={styles.schedule}>{scheduleLabel}</span>
      </div>

      <div className={styles.right}>
        {instance.state !== 'completed' && instance.state !== 'missed' ? (
          <PointsBadge points={template.points} size="sm" />
        ) : null}
        <span className={styles.stateEmoji} title={config.label}>
          {config.emoji}
        </span>
      </div>
    </button>
  );
}
