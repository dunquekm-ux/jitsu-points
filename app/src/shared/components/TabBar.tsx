import { useNavigate, useLocation } from 'react-router-dom';
import styles from './TabBar.module.css';

interface Tab {
  id: string;
  label: string;
  emoji: string;
  path: string;
}

interface Props {
  childId: string;
}

export default function TabBar({ childId }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs: Tab[] = [
    { id: 'home', label: 'Home', emoji: '🏠', path: `/child/${childId}` },
    { id: 'rewards', label: 'Rewards', emoji: '🎁', path: `/child/${childId}/rewards` },
    { id: 'streak', label: 'Streak', emoji: '🔥', path: `/child/${childId}/streak` },
    { id: 'trophies', label: 'Trophies', emoji: '🏆', path: `/child/${childId}/achievements` },
    { id: 'history', label: 'History', emoji: '📜', path: `/child/${childId}/history` },
  ];

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <button
            key={tab.id}
            className={[styles.tab, isActive ? styles.active : ''].join(' ')}
            onClick={() => navigate(tab.path)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.emoji}>{tab.emoji}</span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
