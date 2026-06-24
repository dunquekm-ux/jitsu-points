import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../shared/components/Avatar';
import { useAppStore, selectChildPoints } from '../../core/store/appStore';
import { useAuthStore } from '../../core/auth/store';
import { useSync } from '../../core/sync';
import { calculateStreak, todayISO } from '../../domain';
import ThemeSwitcher from './ThemeSwitcher';
import styles from './ParentDashboard.module.css';

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 30) return 'just now';
  if (secs < 90) return '1 min ago';
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  return `${Math.floor(secs / 3600)} hr ago`;
}

interface ActionTile {
  icon: string;
  label: string;
  to: string;
  color: string;
}

const ACTIONS: ActionTile[] = [
  { icon: '➕', label: 'New Task', to: '/parent/task/new', color: 'var(--color-primary)' },
  { icon: '🎁', label: 'Rewards', to: '/parent/rewards', color: 'var(--color-secondary)' },
  { icon: '👶', label: 'Manage Kids', to: '/parent/kids', color: 'var(--color-info)' },
  { icon: '🎉', label: 'Give Bonus', to: '/parent/bonus', color: 'var(--color-accent)' },
  { icon: '😔', label: 'Give Demerit', to: '/parent/demerit', color: 'var(--color-state-missed)' },
];

const HAS_WORKER = !!import.meta.env.VITE_WORKER_URL;

export default function ParentDashboard() {
  const navigate = useNavigate();
  const {
    profiles,
    taskTemplates,
    taskSchedules,
    taskInstances,
    pointsEvents,
    isLoaded,
    load,
    familyName,
    joinCode,
    resetFamily,
  } = useAppStore();
  const { status } = useAuthStore();
  const { status: syncStatus, lastSyncedAt, triggerSync } = useSync();
  const [codeCopied, setCodeCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'points'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!isLoaded) load();
    void triggerSync().then(() => load());
  }, [isLoaded, load, triggerSync]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        void triggerSync().then(() => load());
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [load, triggerSync]);

  async function handleReset() {
    if (
      window.confirm(
        'This will remove all local data from this device.\n\nYou can rejoin using your family code from another device.\n\nContinue?',
      )
    ) {
      setResetting(true);
      await resetFamily(); // navigates away; resetting stays true until page reloads
    }
  }

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(joinCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = joinCode;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const today = todayISO();
  const templateList = Object.values(taskTemplates);
  const sortedTemplates = [...templateList].sort((a, b) => {
    const cmp =
      sortKey === 'name'
        ? a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
        : a.points - b.points;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Tap an active key to flip direction; tap an inactive key to switch and reset direction.
  function changeSort(key: 'name' | 'points') {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'points' ? 'desc' : 'asc'); // points defaults high→low
    }
  }
  const dirArrow = sortDir === 'asc' ? '↑' : '↓';

  if (!isLoaded) {
    return (
      <div className={styles.screen}>
        <div className={styles.loading}>🥷</div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className={styles.title}>⚙️ Parent Mode</h1>
        {HAS_WORKER && status === 'connected' && (
          <button
            className={[
              styles.syncChip,
              syncStatus === 'error' ? styles.syncChipError : '',
              syncStatus === 'offline' ? styles.syncChipOffline : '',
            ]
              .join(' ')
              .trim()}
            onClick={() => {
              void triggerSync().then(() => load());
            }}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' && '🔄 Syncing…'}
            {syncStatus === 'error' && '⚠️ Sync error — tap to retry'}
            {syncStatus === 'offline' && '📵 Offline — will sync when connected'}
            {(syncStatus === 'idle' || syncStatus === 'unsynced') &&
              (lastSyncedAt ? `☁️ Synced ${timeAgo(lastSyncedAt)} ↻` : '☁️ Tap to sync ↻')}
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* Offline warning */}
        {HAS_WORKER && syncStatus === 'offline' && (
          <div className={styles.reconnectBanner}>
            <span className={styles.reconnectIcon}>📵</span>
            <span className={styles.reconnectText}>
              Offline — changes saved locally and will sync when you reconnect
            </span>
          </div>
        )}
        {/* Action grid */}
        <div className={styles.actionGrid}>
          {ACTIONS.map((a) => (
            <button
              key={a.to}
              className={styles.actionTile}
              style={{ '--tile-color': a.color } as React.CSSProperties}
              onClick={() => navigate(a.to)}
            >
              <span className={styles.actionIcon}>{a.icon}</span>
              <span className={styles.actionLabel}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Children overview */}
        {profiles.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your kids</h2>
            <div className={styles.kidsList}>
              {profiles.map((profile) => {
                const pts = selectChildPoints(
                  { pointsEvents } as Parameters<typeof selectChildPoints>[0],
                  profile.id,
                );
                const streak = calculateStreak(taskInstances, profile.id, today);
                const todayTasks = taskInstances.filter(
                  (i) => i.childId === profile.id && i.date === today,
                );
                const doneTasks = todayTasks.filter((i) => i.state === 'completed').length;
                return (
                  <div key={profile.id} className={styles.kidCard}>
                    <Avatar avatar={profile.avatar} size="md" />
                    <div className={styles.kidInfo}>
                      <span className={styles.kidName}>{profile.name}</span>
                      <span className={styles.kidStats}>
                        ⭐ {pts} pts · 🔥 {streak} streak · {doneTasks}/{todayTasks.length} today
                      </span>
                    </div>
                    <button
                      className={styles.bonusQuickBtn}
                      onClick={() => navigate('/parent/bonus', { state: { childId: profile.id } })}
                      title="Quick bonus"
                    >
                      🎉
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tasks list */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tasks ({templateList.length})</h2>
            <button className={styles.addBtn} onClick={() => navigate('/parent/task/new')}>
              + New
            </button>
          </div>
          {templateList.length === 0 ? (
            <p className={styles.empty}>No tasks yet — add one above!</p>
          ) : (
            <>
              {templateList.length > 1 && (
                <div className={styles.sortRow}>
                  <span className={styles.sortLabel}>Sort by</span>
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
                      className={[
                        styles.sortBtn,
                        sortKey === 'points' ? styles.sortBtnActive : '',
                      ].join(' ')}
                      onClick={() => changeSort('points')}
                    >
                      Points {sortKey === 'points' ? dirArrow : ''}
                    </button>
                  </div>
                </div>
              )}
              <div className={styles.taskList}>
                {sortedTemplates.map((t) => {
                const schedCount = Object.values(taskSchedules).filter(
                  (s) => s.taskTemplateId === t.id,
                ).length;
                const assigneeNames =
                  t.assignedChildIds
                    .map((id) => profiles.find((p) => p.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || '?';
                return (
                  <div key={t.id} className={styles.taskRow} data-testid="parent-task-row">
                    <span className={styles.taskIcon}>{t.icon || '📋'}</span>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle} data-testid="parent-task-title">
                        {t.title}
                      </span>
                      <span className={styles.taskMeta}>
                        ⭐ {t.points} · {schedCount} schedule{schedCount !== 1 ? 's' : ''} ·{' '}
                        {assigneeNames}
                      </span>
                    </div>
                    <div className={styles.taskRowActions}>
                      <button
                        className={styles.dupBtn}
                        onClick={() => navigate(`/parent/task/${t.id}/duplicate`)}
                        title="Duplicate this task"
                      >
                        📋 Duplicate
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={() => navigate(`/parent/task/${t.id}/edit`)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>
            </>
          )}
        </section>

        {/* Family & Join Code */}
        {joinCode && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Family</h2>
            <div className={styles.familyCard}>
              <div className={styles.familyInfo}>
                <span className={styles.familyName}>{familyName}</span>
                <span className={styles.familyHint}>
                  Share this code to add Jitsu on another device
                </span>
              </div>
              <div className={styles.joinCodeRow}>
                <span className={styles.joinCodeDisplay}>{joinCode}</span>
                <button className={styles.copyCodeBtn} onClick={copyJoinCode}>
                  {codeCopied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Settings */}
        <div className={styles.settingsSection}>
          <ThemeSwitcher />
          <button
            className={styles.resetBtn}
            onClick={() => void handleReset()}
            disabled={resetting}
          >
            {resetting ? '⏳ Resetting…' : '🔄 Reset / Switch family'}
          </button>
        </div>
      </div>
    </div>
  );
}
