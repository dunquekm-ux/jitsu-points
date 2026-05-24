import type { AvatarId } from '../../domain';
import styles from './Avatar.module.css';

const AVATAR_CONFIG: Record<AvatarId, { emoji: string; bg: string; label: string }> = {
  speed_hero: { emoji: '⚡', bg: '#FF4F8B', label: 'Speed Hero' },
  water_pup: { emoji: '🌊', bg: '#4DA8FF', label: 'Water Pup' },
  leaf_ninja: { emoji: '🍃', bg: '#3BCEAC', label: 'Leaf Ninja' },
  flame_fox: { emoji: '🔥', bg: '#FF6B35', label: 'Flame Fox' },
  star_kid: { emoji: '⭐', bg: '#FFD23F', label: 'Star Kid' },
  moon_cub: { emoji: '🌙', bg: '#9B5DE5', label: 'Moon Cub' },
};

interface Props {
  avatar: AvatarId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  onClick?: () => void;
}

export default function Avatar({ avatar, size = 'md', showLabel = false, onClick }: Props) {
  const config = AVATAR_CONFIG[avatar];
  return (
    <div
      className={[styles.wrapper, onClick ? styles.clickable : ''].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={config.label}
    >
      <div className={[styles.circle, styles[size]].join(' ')} style={{ background: config.bg }}>
        <span className={styles.emoji}>{config.emoji}</span>
      </div>
      {showLabel && <span className={styles.label}>{config.label}</span>}
    </div>
  );
}

export { AVATAR_CONFIG };
