import { useParams, useNavigate } from 'react-router-dom';
import ChunkyButton from '../../shared/components/ChunkyButton';
import PointsBadge from '../../shared/components/PointsBadge';
import JitsuMascot from '../../shared/mascot/JitsuMascot';
import { useAppStore } from '../../core/store/appStore';
import styles from './TaskDetailScreen.module.css';

export default function TaskDetailScreen() {
  const { childId, instanceId } = useParams<{ childId: string; instanceId: string }>();
  const navigate = useNavigate();

  const { taskInstances, taskTemplates, taskSchedules, completeTask } = useAppStore();
  const instance = taskInstances.find(i => i.id === instanceId);
  const template = instance ? taskTemplates[instance.templateId] : null;
  const schedule = instance ? taskSchedules[instance.scheduleId] : null;

  if (!instance || !template || !schedule) {
    navigate(`/child/${childId}`);
    return null;
  }

  const isAvailable = instance.state === 'available';

  async function handleComplete() {
    if (!instanceId || !isAvailable) return;
    await completeTask(instanceId);
    navigate(`/child/${childId}`);
  }

  const mascotMood = instance.state === 'completed' ? 'cheer'
                   : instance.state === 'available'  ? 'happy'
                   : 'calm';

  return (
    <div className={styles.screen}>
      <button className={styles.back} onClick={() => navigate(`/child/${childId}`)}>
        ← Back
      </button>

      <div className={styles.content}>
        <JitsuMascot mood={mascotMood} size="lg" />

        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <span className={styles.icon}>{template.icon || '📋'}</span>
          </div>
          <h1 className={styles.title}>{template.title}</h1>
          <p className={styles.schedule}>{schedule.label} mission</p>
          <div className={styles.reward}>
            <span className={styles.rewardLabel}>Complete to earn</span>
            <PointsBadge points={template.points} size="lg" />
          </div>
        </div>

        {instance.state === 'completed' && (
          <p className={styles.doneText}>✅ Mission complete! Great work!</p>
        )}
        {instance.state === 'missed' && (
          <p className={styles.missedText}>💨 This mission has expired. Get the next one!</p>
        )}
        {instance.state === 'locked' && (
          <p className={styles.lockedText}>🔒 Not available yet — check back at {schedule.startTime}!</p>
        )}

        {isAvailable && (
          <ChunkyButton
            variant="success"
            size="lg"
            fullWidth
            onClick={handleComplete}
            className={styles.completeBtn}
          >
            ✅ Complete Mission!
          </ChunkyButton>
        )}
      </div>
    </div>
  );
}
