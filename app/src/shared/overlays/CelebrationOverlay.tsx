import { useEffect, useRef } from 'react';
import ChunkyButton from '../components/ChunkyButton';
import { playTaskComplete } from '../../core/audio';
import styles from './CelebrationOverlay.module.css';

interface Props {
  delta: number;
  title: string;
  onDismiss: () => void;
}

// Confetti particle colours from the candy theme
const CONFETTI_COLORS = ['#FF4F8B', '#FFD23F', '#3BCEAC', '#4DA8FF', '#9B5DE5', '#FF6B35'];

function createConfetti(container: HTMLDivElement) {
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = styles.particle;
    el.style.setProperty('--x', `${Math.random() * 100}vw`);
    el.style.setProperty('--delay', `${Math.random() * 0.6}s`);
    el.style.setProperty('--duration', `${0.8 + Math.random() * 0.8}s`);
    el.style.setProperty('--rotate', `${Math.random() * 720 - 360}deg`);
    el.style.setProperty(
      '--color',
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    );
    el.style.setProperty('--size', `${6 + Math.random() * 10}px`);
    container.appendChild(el);
  }
}

export default function CelebrationOverlay({ delta, title, onDismiss }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) createConfetti(containerRef.current);
    playTaskComplete();
    // Auto-dismiss after 3.5s if user doesn't tap
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={styles.overlay}
      onClick={onDismiss}
      role="dialog"
      aria-modal
      aria-label="Task complete"
    >
      <div ref={containerRef} className={styles.confettiContainer} />
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>🎉</div>
        <h2 className={styles.title}>Mission Complete!</h2>
        <p className={styles.taskName}>{title}</p>
        <div className={styles.points}>
          <span className={styles.plus}>+</span>
          <span className={styles.delta}>{delta}</span>
          <span className={styles.star}>⭐</span>
        </div>
        <ChunkyButton variant="success" size="lg" fullWidth onClick={onDismiss}>
          Awesome! 🚀
        </ChunkyButton>
      </div>
    </div>
  );
}
