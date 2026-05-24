import styles from './PointsBadge.module.css';

interface Props {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  signed?: boolean; // show + or - prefix
}

export default function PointsBadge({ points, size = 'md', signed = false }: Props) {
  const label = signed && points > 0 ? `+${points}` : String(points);
  return <span className={[styles.badge, styles[size]].join(' ')}>⭐ {label}</span>;
}
