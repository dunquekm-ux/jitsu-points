import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../shared/components/Avatar';
import { useAppStore } from '../../core/store/appStore';
import styles from './ProfilePicker.module.css';

export default function ProfilePicker() {
  const navigate = useNavigate();
  const { profiles, isLoaded, hasFamilyData, load, selectChild } = useAppStore();

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  // Redirect to onboarding if no family has been set up
  useEffect(() => {
    if (isLoaded && !hasFamilyData) {
      navigate('/welcome', { replace: true });
    }
  }, [isLoaded, hasFamilyData, navigate]);

  function handleSelect(childId: string) {
    selectChild(childId);
    navigate(`/child/${childId}`);
  }

  if (!isLoaded) {
    return (
      <div className={styles.screen}>
        <div className={styles.loading}>🥷</div>
      </div>
    );
  }

  // hasFamilyData is true here (redirect above handles false)
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.mascot}>🥷</div>
        <h1 className={styles.title}>Jitsu Points</h1>
        <p className={styles.sub}>Who's on a mission today?</p>
      </div>

      {profiles.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No kids added yet.</p>
          <p className={styles.emptyHint}>Go to Parent Mode to add your first child!</p>
        </div>
      ) : (
        <div className={styles.grid} data-testid="profile-picker">
          {profiles.map(profile => (
            <button
              key={profile.id}
              className={styles.profileBtn}
              onClick={() => handleSelect(profile.id)}
              aria-label={`Select ${profile.name}`}
            >
              <Avatar avatar={profile.avatar} size="xl" />
              <span className={styles.name}>{profile.name}</span>
              <span className={styles.level}>Level {profile.level} 🥷</span>
            </button>
          ))}
        </div>
      )}

      <button className={styles.parentBtn} onClick={() => navigate('/parent')}>
        ⚙️ Parent Mode
      </button>
    </div>
  );
}
