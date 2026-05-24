import { useParams } from 'react-router-dom';
import TabBar from '../../shared/components/TabBar';
import { useAppStore } from '../../core/store/appStore';
import { calculateStreak, todayISO } from '../../domain';
import styles from './StreakScreen.module.css';

const FLAME_LEVELS = [
  { min: 0, max: 2, icon: '🌱', label: 'Just starting' },
  { min: 3, max: 6, icon: '🔥', label: 'On fire!' },
  { min: 7, max: 13, icon: '🔥🔥', label: 'Hot streak!' },
  { min: 14, max: 29, icon: '🔥🔥🔥', label: 'Unstoppable!' },
  { min: 30, max: Infinity, icon: '💎🔥', label: 'Legend!' },
];

function flameForStreak(n: number) {
  return FLAME_LEVELS.find((f) => n >= f.min && n <= f.max) ?? FLAME_LEVELS[0];
}

// Last 7 days as filled circles
function WeekRow({
  instances,
  childId,
}: {
  instances: ReturnType<typeof useAppStore.getState>['taskInstances'];
  childId: string;
}) {
  const today = todayISO();
  const [y, m, d] = today.split('-').map(Number);
  const base = new Date(y, m - 1, d);

  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - (6 - i));
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const dayInstances = instances.filter((inst) => inst.childId === childId && inst.date === iso);
    const isToday = iso === today;
    let status: 'done' | 'partial' | 'empty' | 'none' = 'none';
    if (dayInstances.length > 0) {
      const completed = dayInstances.filter((i) => i.state === 'completed').length;
      if (completed === dayInstances.length) status = 'done';
      else if (completed > 0) status = 'partial';
      else status = 'empty';
    }
    return { iso, isToday, status, label: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dt.getDay()] };
  });

  return (
    <div className={styles.weekRow}>
      {days.map((day) => (
        <div key={day.iso} className={styles.dayCol}>
          <div
            className={[
              styles.dayDot,
              styles[`dot_${day.status}`],
              day.isToday ? styles.dotToday : '',
            ].join(' ')}
          />
          <span className={styles.dayLabel}>{day.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function StreakScreen() {
  const { childId } = useParams<{ childId: string }>();
  const { taskInstances, profiles } = useAppStore();

  const profile = profiles.find((p) => p.id === childId);
  const today = todayISO();
  const streak = calculateStreak(taskInstances, childId ?? '', today);
  const flame = flameForStreak(streak);

  // Best streak — we don't persist it yet; approximate from instances
  // (would need a DB field for perfect tracking; good enough for MVP)
  const best = streak; // simplified: best = current for now

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔥 Streak</h1>
        <p className={styles.subtitle}>{profile?.name ?? ''}</p>
      </div>

      <div className={styles.body}>
        {/* Big streak number */}
        <div className={styles.heroCard}>
          <span className={styles.flameIcon}>{flame.icon}</span>
          <span className={styles.streakNum}>{streak}</span>
          <span className={styles.streakUnit}>day streak</span>
          <span className={styles.flameLabel}>{flame.label}</span>
        </div>

        {/* Weekly calendar */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>This week</p>
          <WeekRow instances={taskInstances} childId={childId ?? ''} />
          <div className={styles.legend}>
            <span className={[styles.legendDot, styles.dot_done].join(' ')} /> All done
            <span className={[styles.legendDot, styles.dot_partial].join(' ')} /> Some done
            <span className={[styles.legendDot, styles.dot_empty].join(' ')} /> Missed
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{streak}</span>
            <span className={styles.statLabel}>Current</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{best}</span>
            <span className={styles.statLabel}>Best</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>
              {taskInstances.filter((i) => i.childId === childId && i.state === 'completed').length}
            </span>
            <span className={styles.statLabel}>Total done</span>
          </div>
        </div>

        {/* Motivational message */}
        {streak === 0 && (
          <p className={styles.motivate}>Complete today's missions to start your streak! 🚀</p>
        )}
        {streak > 0 && streak < 7 && (
          <p className={styles.motivate}>
            Keep it up! {7 - streak} more days to a week-long streak 🌟
          </p>
        )}
        {streak >= 7 && (
          <p className={styles.motivate}>You're on a roll! Don't break the chain! 💪</p>
        )}
      </div>

      <TabBar childId={childId ?? ''} />
    </div>
  );
}
