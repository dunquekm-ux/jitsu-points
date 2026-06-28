/**
 * Parent per-child audit screen (Phase 8.13) — the full points ledger for one
 * child: every mission, bonus, reward, and check-in, with reasons and amounts.
 * Gives parents transparency and a place to act (give a bonus / check-in) from.
 */
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../../shared/components/Avatar';
import PointsHistoryList from '../history/PointsHistoryList';
import { useAppStore, selectChildPoints, selectChildLevel } from '../../core/store/appStore';
import styles from './ChildAuditScreen.module.css';

export default function ChildAuditScreen() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const { profiles, pointsEvents, isLoaded, load } = useAppStore();
  const pts = useAppStore((s) => selectChildPoints(s, childId ?? ''));
  const level = useAppStore((s) => selectChildLevel(s, childId ?? ''));

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  const profile = profiles.find((p) => p.id === childId);

  useEffect(() => {
    if (isLoaded && childId && !profile) navigate('/parent');
  }, [isLoaded, childId, profile, navigate]);

  if (!isLoaded || !childId || !profile) {
    return (
      <div className={styles.screen}>
        <div className={styles.loading}>🥷</div>
      </div>
    );
  }

  const myEvents = pointsEvents.filter((e) => e.childId === childId);
  const bonusCount = myEvents.filter((e) => e.type === 'bonus').length;
  const demeritCount = myEvents.filter((e) => e.type === 'demerit').length;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/parent')}>
          ← Back
        </button>
        <h1 className={styles.title}>📜 {profile.name}'s History</h1>
      </div>

      <div className={styles.body}>
        {/* Summary card */}
        <div className={styles.summary}>
          <Avatar avatar={profile.avatar} size="md" />
          <div className={styles.summaryInfo}>
            <span className={styles.summaryName}>{profile.name}</span>
            <span className={styles.summaryStats}>
              ⭐ {pts} pts · Level {level} · 🎉 {bonusCount} bonus · 💙 {demeritCount} check-in
              {demeritCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Quick actions for this child */}
        <div className={styles.actions}>
          <button
            className={[styles.actionBtn, styles.bonusBtn].join(' ')}
            onClick={() => navigate('/parent/bonus', { state: { childId } })}
          >
            🎉 Give Bonus
          </button>
          <button
            className={[styles.actionBtn, styles.demeritBtn].join(' ')}
            onClick={() => navigate('/parent/demerit', { state: { childId } })}
          >
            💙 Check-in
          </button>
        </div>

        <h2 className={styles.sectionTitle}>Full history</h2>
        <PointsHistoryList
          events={myEvents}
          emptyMessage="No points activity yet for this child."
        />
      </div>
    </div>
  );
}
