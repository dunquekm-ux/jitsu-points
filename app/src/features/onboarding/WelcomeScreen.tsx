import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../core/store/appStore';
import { markWhatsNewSeen } from '../../core/whatsNew';
import { markAllAcksSeen } from '../../core/ackFeed';
import styles from './WelcomeScreen.module.css';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { _seedDemo } = useAppStore();

  async function loadDemo() {
    const { DEMO_FAMILY } = await import('../../dev/demoData');
    await _seedDemo(DEMO_FAMILY);
    markWhatsNewSeen(); // seeded family is treated as established — don't pop "What's New"
    markAllAcksSeen(DEMO_FAMILY.pointsEvents); // don't replay existing bonuses/demerits as popups
    navigate('/', { replace: true });
  }

  return (
    <div className={styles.screen}>
      <div className={styles.hero}>
        <span className={styles.mascot}>🥷</span>
        <h1 className={styles.title}>Jitsu Points</h1>
        <p className={styles.tagline}>Missions. Points. Rewards.</p>
        <p className={styles.sub}>The fun way to get things done.</p>
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={() => navigate('/setup')}>
          <span className={styles.btnIcon}>🏠</span>
          <span className={styles.btnText}>
            <strong>Set up our family</strong>
            <small>Create a new family — takes 2 minutes</small>
          </span>
        </button>

        <button className={styles.secondaryBtn} onClick={() => navigate('/join')}>
          <span className={styles.btnIcon}>🔗</span>
          <span className={styles.btnText}>
            <strong>Join our family</strong>
            <small>Already set up? Enter your join code</small>
          </span>
        </button>
      </div>

      {import.meta.env.DEV && (
        <button className={styles.devBtn} onClick={loadDemo} data-testid="load-demo-btn">
          🛠 Load Demo Data
        </button>
      )}
    </div>
  );
}
