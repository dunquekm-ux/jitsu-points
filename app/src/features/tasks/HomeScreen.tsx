import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import TabBar from '../../shared/components/TabBar';
import Avatar from '../../shared/components/Avatar';
import CelebrationOverlay from '../../shared/overlays/CelebrationOverlay';
import LevelUpOverlay from '../../shared/overlays/LevelUpOverlay';
import BonusOverlay from '../../shared/overlays/BonusOverlay';
import DemeritOverlay from '../../shared/overlays/DemeritOverlay';
import {
  useAppStore,
  selectChildPoints,
  selectChildLevel,
  selectTodaysTasks,
} from '../../core/store/appStore';
import { lifetimeXp, LEVEL_THRESHOLDS } from '../../domain';
import styles from './HomeScreen.module.css';

export default function HomeScreen() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const {
    profiles,
    taskTemplates,
    taskSchedules,
    pointsEvents,
    isLoaded,
    load,
    selectChild,
    celebration,
    levelUp,
    dismissCelebration,
    dismissLevelUp,
    pendingBonus,
    pendingDemerit,
    dismissBonus,
    dismissDemerit,
  } = useAppStore();

  const taskInstances = useAppStore((s) => selectTodaysTasks(s, childId ?? ''));
  const pts = useAppStore((s) => selectChildPoints(s, childId ?? ''));
  const level = useAppStore((s) => selectChildLevel(s, childId ?? ''));
  const xp = lifetimeXp(pointsEvents, childId ?? '');
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.xpRequired > xp);
  const xpToNext = nextThreshold ? nextThreshold.xpRequired - xp : 0;

  useEffect(() => {
    if (!isLoaded) load();
    if (childId) selectChild(childId);
  }, [isLoaded, load, childId, selectChild]);

  // Recalculate on foreground resume
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') load();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [load]);

  const profile = profiles.find((p) => p.id === childId);

  // Navigate during render is illegal — do it in an effect instead (DEF-004)
  useEffect(() => {
    if (isLoaded && childId && !profile) navigate('/');
  }, [isLoaded, childId, profile, navigate]);

  if (!isLoaded || !childId || !profile) {
    return (
      <div className={styles.screen}>
        <div className={styles.spinner}>🥷</div>
      </div>
    );
  }

  // Split tasks by state
  const available = taskInstances.filter((i) => i.state === 'available');
  const completed = taskInstances.filter((i) => i.state === 'completed');
  const locked = taskInstances.filter((i) => i.state === 'locked');
  const missed = taskInstances.filter((i) => i.state === 'missed');

  const totalToday = taskInstances.length;
  const doneToday = completed.length;
  const progressPct = totalToday > 0 ? (doneToday / totalToday) * 100 : 0;

  const ordered = [...available, ...locked, ...completed, ...missed];

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.avatarBtn} onClick={() => navigate('/')}>
            <Avatar avatar={profile.avatar} size="sm" />
          </button>
          <div className={styles.greeting}>
            <span className={styles.hi}>Hi, {profile.name}! 👋</span>
            <span className={styles.levelBadge}>Level {level} 🥷</span>
          </div>
          <div className={styles.pts}>
            <span className={styles.ptsNum}>{pts}</span>
            <span className={styles.ptsStar}>⭐</span>
          </div>
        </div>

        {/* XP progress bar */}
        <div className={styles.xpBar}>
          <div
            className={styles.xpFill}
            style={{ width: `${Math.min((xp / (nextThreshold?.xpRequired ?? xp)) * 100, 100)}%` }}
          />
        </div>
        {nextThreshold && (
          <span className={styles.xpLabel}>
            {xpToNext} XP to Level {level + 1}
          </span>
        )}
      </div>

      {/* Daily progress */}
      <div className={styles.progress}>
        <span className={styles.progressText}>
          {doneToday === totalToday && totalToday > 0
            ? '🎉 All missions complete!'
            : `${doneToday} / ${totalToday} missions done`}
        </span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Task list */}
      <div className={styles.tasks}>
        {totalToday === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>😴</span>
            <p>No missions today!</p>
          </div>
        ) : (
          ordered.map((instance) => {
            const template = taskTemplates[instance.templateId];
            const schedule = taskSchedules[instance.scheduleId];
            if (!template || !schedule) return null;
            return (
              <TaskCard
                key={instance.id}
                instance={instance}
                template={template}
                scheduleLabel={schedule.label}
              />
            );
          })
        )}
      </div>

      <TabBar childId={childId} />

      {/* Overlays */}
      {celebration && (
        <CelebrationOverlay
          delta={celebration.delta}
          title={celebration.title}
          onDismiss={dismissCelebration}
        />
      )}
      {levelUp && (
        <LevelUpOverlay
          level={levelUp.level}
          childName={levelUp.childName}
          onDismiss={dismissLevelUp}
        />
      )}
      {pendingBonus && pendingBonus.childId === childId && (
        <BonusOverlay
          delta={pendingBonus.delta}
          note={pendingBonus.note}
          onDismiss={dismissBonus}
        />
      )}
      {pendingDemerit && pendingDemerit.childId === childId && (
        <DemeritOverlay
          delta={pendingDemerit.delta}
          note={pendingDemerit.note}
          onDismiss={dismissDemerit}
        />
      )}
    </div>
  );
}
