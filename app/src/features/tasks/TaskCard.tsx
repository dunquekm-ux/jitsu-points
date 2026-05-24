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
  const isClickable = instance.state === 'available';

  function handleClick() {
    if (!isClickable) return;
    navigate(`/child/${instance.childId}/task/${instance.id}`);
  }

  return (
    <div
      className={[styles.card, styles[instance.state], isClickable ? styles.clickable : ''].join(
        ' ',
      )}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`${template.title} — ${config.label}`}
      data-testid={isClickable ? 'task-card-available' : undefined}
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
    </div>
  );
}
