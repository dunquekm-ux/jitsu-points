import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import TabBar from '../../shared/components/TabBar';
import Avatar from '../../shared/components/Avatar';
import CelebrationOverlay from '../../shared/overlays/CelebrationOverlay';
import LevelUpOverlay from '../../shared/overlays/LevelUpOverlay';
import BonusOverlay from '../../shared/overlays/BonusOverlay';
import DemeritOverlay from '../../shared/overlays/DemeritOverlay';
import { useAppStore, selectChildPoints, selectChildLevel } from '../../core/store/appStore';
import { getUnseenAcks, markAckSeen } from '../../core/ackFeed';
import { useSync } from '../../core/sync';
import { lifetimeXp, LEVEL_THRESHOLDS, todayISO } from '../../domain';
import type { TaskInstance, TaskTemplate } from '../../domain';
import styles from './HomeScreen.module.css';

type SortKey = 'name' | 'points';
type SortDir = 'asc' | 'desc';

// Sort a single state group (Available / Locked / etc.) — grouping by state is
// preserved by the caller; this only orders within a group.
function sortInstances(
  list: TaskInstance[],
  key: SortKey,
  dir: SortDir,
  templates: Record<string, TaskTemplate>,
): TaskInstance[] {
  return [...list].sort((a, b) => {
    const ta = templates[a.templateId];
    const tb = templates[b.templateId];
    const cmp =
      key === 'name'
        ? ta.title.localeCompare(tb.title, undefined, { sensitivity: 'base' })
        : ta.points - tb.points;
    return dir === 'asc' ? cmp : -cmp;
  });
}

export default function HomeScreen() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const {
    profiles,
    taskTemplates,
    taskSchedules,
    taskInstances: allTaskInstances,
    pointsEvents,
    isLoaded,
    load,
    selectChild,
    celebration,
    levelUp,
    dismissCelebration,
    dismissLevelUp,
  } = useAppStore();
  const { triggerSync } = useSync();

  // Bonus/demerit popups are derived from the persisted points history + a
  // per-device "seen" set, so each new one shows exactly once — reliably across
  // reloads and devices (Phase 8.11). One bump of `ackTick` re-evaluates after a
  // dismiss without needing the store data to change.
  const [ackTick, setAckTick] = useState(0);
  const unseenAcks = useMemo(
    () => (childId ? getUnseenAcks(childId, pointsEvents) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childId, pointsEvents, ackTick],
  );
  const currentAck = unseenAcks[0] ?? null;

  function dismissAck() {
    if (currentAck && childId) markAckSeen(childId, currentAck.id);
    setAckTick((t) => t + 1);
  }

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Tap an active key to flip direction; tap an inactive key to switch (points → high first).
  function changeSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'points' ? 'desc' : 'asc');
    }
  }
  const dirArrow = sortDir === 'asc' ? '↑' : '↓';

  // DEF-006: Filter inline — never use a selector that returns a new array reference.
  // selectTodaysTasks returned a new array on every call, causing useSyncExternalStore
  // to see an ever-changing snapshot → infinite re-render loop → React error #185.
  // DEF-013: Also filter out orphaned instances (template/schedule deleted) so the
  // counter matches the visible card count.
  const taskInstances = allTaskInstances.filter(
    (i) =>
      i.childId === (childId ?? '') &&
      i.date === todayISO() &&
      taskTemplates[i.templateId] &&
      taskSchedules[i.scheduleId],
  );

  // These selectors return numbers (primitive) — safe to use as selectors
  const pts = useAppStore((s) => selectChildPoints(s, childId ?? ''));
  const level = useAppStore((s) => selectChildLevel(s, childId ?? ''));
  const xp = lifetimeXp(pointsEvents, childId ?? '');
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.xpRequired > xp);
  const xpToNext = nextThreshold ? nextThreshold.xpRequired - xp : 0;

  useEffect(() => {
    if (!isLoaded) load();
    if (childId) selectChild(childId);
    // Pull latest from Drive then reload store so Drive changes appear immediately
    void triggerSync().then(() => load());
  }, [isLoaded, load, childId, selectChild, triggerSync]);

  // Recalculate on foreground resume
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        void triggerSync().then(() => load());
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [load, triggerSync]);

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

  // Split tasks by state, then sort within each group (grouping order is preserved)
  const sortGroup = (list: TaskInstance[]) => sortInstances(list, sortKey, sortDir, taskTemplates);
  const available = sortGroup(taskInstances.filter((i) => i.state === 'available'));
  const completed = sortGroup(taskInstances.filter((i) => i.state === 'completed'));
  const locked = sortGroup(taskInstances.filter((i) => i.state === 'locked'));
  const missed = sortGroup(taskInstances.filter((i) => i.state === 'missed'));

  const totalToday = taskInstances.length;
  const doneToday = completed.length;
  const progressPct = totalToday > 0 ? (doneToday / totalToday) * 100 : 0;

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
        {totalToday > 1 && (
          <div className={styles.sortRow}>
            <span className={styles.sortLabel}>Sort</span>
            <div className={styles.sortToggle}>
              <button
                type="button"
                className={[styles.sortBtn, sortKey === 'name' ? styles.sortBtnActive : ''].join(
                  ' ',
                )}
                onClick={() => changeSort('name')}
              >
                Name {sortKey === 'name' ? dirArrow : ''}
              </button>
              <button
                type="button"
                className={[styles.sortBtn, sortKey === 'points' ? styles.sortBtnActive : ''].join(
                  ' ',
                )}
                onClick={() => changeSort('points')}
              >
                Points {sortKey === 'points' ? dirArrow : ''}
              </button>
            </div>
          </div>
        )}
        {totalToday === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>😴</span>
            <p>No missions today!</p>
          </div>
        ) : (
          <>
            {/* Active tasks — available, locked, completed */}
            {[...available, ...locked, ...completed].map((instance) => {
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
            })}

            {/* Missed tasks — shown at the bottom under a divider */}
            {missed.length > 0 && (
              <>
                <p className={styles.missedDivider}>💨 Missed today — back tomorrow</p>
                {missed.map((instance) => {
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
                })}
              </>
            )}
          </>
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
      {currentAck && currentAck.type === 'bonus' && (
        <BonusOverlay
          delta={currentAck.delta}
          note={currentAck.note ?? ''}
          onDismiss={dismissAck}
        />
      )}
      {currentAck && currentAck.type === 'demerit' && (
        <DemeritOverlay
          delta={currentAck.delta}
          note={currentAck.note ?? ''}
          onDismiss={dismissAck}
        />
      )}
    </div>
  );
}
