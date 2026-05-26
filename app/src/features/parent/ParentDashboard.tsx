import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../shared/components/Avatar';
import { useAppStore, selectChildPoints } from '../../core/store/appStore';
import { useAuthStore } from '../../core/auth/store';
import { loadGIS, signIn, silentRefresh } from '../../core/auth/gis';
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

const HAS_AUTH = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
  } = useAppStore();
  const { status, setTokens } = useAuthStore();
  const { status: syncStatus, lastSyncedAt, triggerSync } = useSync();
  const [reconnecting, setReconnecting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

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

  async function handleReconnect() {
    setReconnecting(true);
    try {
      await loadGIS();
      // Try silent first, fall back to consent
      const tokens = await silentRefresh().catch(() => signIn());
      setTokens(tokens);
    } catch (err) {
      console.error('[Reconnect]', err);
    } finally {
      setReconnecting(false);
    }
  }

  const today = todayISO();
  const templateList = Object.values(taskTemplates);

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
        {HAS_AUTH && status === 'authenticated' && (
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
        {/* Connect / Reconnect Drive banner */}
        {HAS_AUTH && (status === 'unauthenticated' || status === 'unknown') && (
          <div className={styles.reconnectBanner}>
            <span className={styles.reconnectIcon}>☁️</span>
            <span className={styles.reconnectText}>
              {status === 'unknown'
                ? 'Connect Google Drive to sync across devices'
                : 'Drive sync paused'}
            </span>
            <button
              className={styles.reconnectBtn}
              disabled={reconnecting}
              onClick={handleReconnect}
            >
              {reconnecting ? 'Connecting…' : status === 'unknown' ? 'Connect' : 'Reconnect'}
            </button>
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
            <div className={styles.taskList}>
              {templateList.map((t) => {
                const schedCount = Object.values(taskSchedules).filter(
                  (s) => s.taskTemplateId === t.id,
                ).length;
                const assignee = profiles.find((p) => p.id === t.assignedChildId);
                return (
                  <div key={t.id} className={styles.taskRow}>
                    <span className={styles.taskIcon}>{t.icon || '📋'}</span>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{t.title}</span>
                      <span className={styles.taskMeta}>
                        ⭐ {t.points} · {schedCount} schedule{schedCount !== 1 ? 's' : ''} ·{' '}
                        {assignee?.name ?? '?'}
                      </span>
                    </div>
                    <button
                      className={styles.editBtn}
                      onClick={() => navigate(`/parent/task/${t.id}/edit`)}
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
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
        </div>
      </div>
    </div>
  );
}
