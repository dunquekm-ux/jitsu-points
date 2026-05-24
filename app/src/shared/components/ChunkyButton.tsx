import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './ChunkyButton.module.css';

type Variant = 'primary' | 'secondary' | 'success' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

export default function ChunkyButton({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
