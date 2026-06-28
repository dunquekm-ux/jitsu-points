/**
 * Child "Points Story" — a kid-friendly audit log of everything that changed
 * their points: missions, bonuses, rewards, and check-ins (Phase 8.12).
 */
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TabBar from '../../shared/components/TabBar';
import Avatar from '../../shared/components/Avatar';
import PointsHistoryList from './PointsHistoryList';
import { useAppStore, selectChildPoints } from '../../core/store/appStore';
import styles from './ChildHistoryScreen.module.css';

export default function ChildHistoryScreen() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const { profiles, pointsEvents, isLoaded, load, selectChild } = useAppStore();
  const pts = useAppStore((s) => selectChildPoints(s, childId ?? ''));

  useEffect(() => {
    if (!isLoaded) load();
    if (childId) selectChild(childId);
  }, [isLoaded, load, childId, selectChild]);

  const profile = profiles.find((p) => p.id === childId);

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

  const myEvents = pointsEvents.filter((e) => e.childId === childId);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.avatarBtn} onClick={() => navigate(`/child/${childId}`)}>
          <Avatar avatar={profile.avatar} size="sm" />
        </button>
        <div className={styles.heading}>
          <span className={styles.title}>My Points Story 📜</span>
          <span className={styles.sub}>Everything you've earned and spent</span>
        </div>
        <div className={styles.pts}>
          <span className={styles.ptsNum}>{pts}</span>
          <span className={styles.ptsStar}>⭐</span>
        </div>
      </div>

      <div className={styles.body}>
        <PointsHistoryList
          events={myEvents}
          emptyMessage="No points yet — complete a mission to start your story!"
        />
      </div>

      <TabBar childId={childId} />
    </div>
  );
}
