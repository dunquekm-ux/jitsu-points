import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TabBar from '../../shared/components/TabBar';
import { useAppStore } from '../../core/store/appStore';
import {
  calculateStreak,
  todayISO,
  levelProgress,
  LEVEL_THRESHOLDS,
  lifetimeXp,
  levelFromXp,
} from '../../domain';
import styles from './AchievementsScreen.module.css';

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

function buildAchievements(completedCount: number, streak: number, level: number): Achievement[] {
  return [
    {
      id: 'first_task',
      icon: '🌟',
      title: 'First Mission',
      description: 'Complete your very first task',
      unlocked: completedCount >= 1,
    },
    {
      id: 'five_tasks',
      icon: '🎯',
      title: 'Getting Started',
      description: 'Complete 5 tasks',
      unlocked: completedCount >= 5,
    },
    {
      id: 'twenty_tasks',
      icon: '💪',
      title: 'Task Champion',
      description: 'Complete 20 tasks',
      unlocked: completedCount >= 20,
    },
    {
      id: 'fifty_tasks',
      icon: '🏆',
      title: 'Mission Master',
      description: 'Complete 50 tasks',
      unlocked: completedCount >= 50,
    },
    {
      id: 'streak_3',
      icon: '🔥',
      title: 'On Fire',
      description: '3-day streak',
      unlocked: streak >= 3,
    },
    {
      id: 'streak_7',
      icon: '🔥🔥',
      title: 'Week Warrior',
      description: '7-day streak',
      unlocked: streak >= 7,
    },
    {
      id: 'streak_14',
      icon: '💎',
      title: 'Two Weeks Strong',
      description: '14-day streak',
      unlocked: streak >= 14,
    },
    {
      id: 'streak_30',
      icon: '👑',
      title: 'Streak Legend',
      description: '30-day streak',
      unlocked: streak >= 30,
    },
    {
      id: 'level_2',
      icon: '⬆️',
      title: 'Level Up!',
      description: 'Reach Level 2',
      unlocked: level >= 2,
    },
    {
      id: 'level_5',
      icon: '🚀',
      title: 'Ninja in Training',
      description: 'Reach Level 5',
      unlocked: level >= 5,
    },
    {
      id: 'level_10',
      icon: '🥷',
      title: 'Jitsu Master',
      description: 'Reach Level 10',
      unlocked: level >= 10,
    },
  ];
}

export default function AchievementsScreen() {
  const { childId } = useParams<{ childId: string }>();
  const { taskInstances, pointsEvents, profiles, isLoaded, load } = useAppStore();

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  const profile = profiles.find((p) => p.id === childId);
  const xp = lifetimeXp(pointsEvents, childId ?? '');
  const level = levelFromXp(xp);
  const progress = levelProgress(xp);
  const today = todayISO();
  const streak = calculateStreak(taskInstances, childId ?? '', today);
  const completedCount = taskInstances.filter(
    (i) => i.childId === childId && i.state === 'completed',
  ).length;

  const achievements = buildAchievements(completedCount, streak, level);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const maxLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level;
  const isMaxLevel = level >= maxLevel;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏆 Trophies</h1>
        <p className={styles.subtitle}>{profile?.name ?? ''}</p>
      </div>

      <div className={styles.body}>
        {/* Level card */}
        <div className={styles.levelCard}>
          <div className={styles.levelBadge}>
            <span className={styles.levelNum}>{level}</span>
          </div>
          <div className={styles.levelInfo}>
            <p className={styles.levelTitle}>Level {level} Ninja</p>
            <p className={styles.xpText}>{xp.toLocaleString()} XP total</p>
            {!isMaxLevel && (
              <div className={styles.xpBarWrap}>
                <div className={styles.xpBar}>
                  <div
                    className={styles.xpFill}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className={styles.xpLabel}>
                  {Math.round(progress * 100)}% to Level {level + 1}
                </p>
              </div>
            )}
            {isMaxLevel && <p className={styles.maxLevel}>🌟 Max level reached!</p>}
          </div>
        </div>

        {/* Achievement summary */}
        <div className={styles.summary}>
          <span className={styles.summaryText}>
            {unlockedCount} / {achievements.length} trophies earned
          </span>
          <div className={styles.summaryBar}>
            <div
              className={styles.summaryFill}
              style={{ width: `${Math.round((unlockedCount / achievements.length) * 100)}%` }}
            />
          </div>
        </div>

        {/* Achievement grid */}
        <div className={styles.grid}>
          {achievements.map((a) => (
            <div
              key={a.id}
              className={[styles.tile, a.unlocked ? styles.tileUnlocked : styles.tileLocked].join(
                ' ',
              )}
            >
              <span className={styles.tileIcon}>{a.unlocked ? a.icon : '🔒'}</span>
              <span className={styles.tileTitle}>{a.title}</span>
              <span className={styles.tileDesc}>{a.description}</span>
            </div>
          ))}
        </div>
      </div>

      <TabBar childId={childId ?? ''} />
    </div>
  );
}
