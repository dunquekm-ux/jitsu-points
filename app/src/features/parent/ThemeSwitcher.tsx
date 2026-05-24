/**
 * ThemeSwitcher — lets the parent choose one of the 4 app themes.
 * Applies the theme immediately via CSS custom properties on <html>.
 * Persists to localStorage so all devices/sessions see the chosen theme.
 */
import { useState } from 'react';
import { THEMES, type ThemeId, applyTheme, storeTheme, getStoredTheme } from '../../core/theme';
import styles from './ThemeSwitcher.module.css';

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState<ThemeId>(getStoredTheme());

  function handleSelect(theme: ThemeId) {
    setCurrent(theme);
    applyTheme(theme);
    storeTheme(theme);
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>🎨 App Theme</h2>
      <div className={styles.swatches}>
        {(Object.entries(THEMES) as [ThemeId, { label: string; primaryColor: string }][]).map(
          ([id, { label, primaryColor }]) => (
            <button
              key={id}
              className={[styles.swatch, current === id ? styles.swatchActive : ''].join(' ')}
              style={{ '--swatch-color': primaryColor } as React.CSSProperties}
              onClick={() => handleSelect(id)}
              aria-label={`${label} theme`}
              aria-pressed={current === id}
            >
              <span className={styles.swatchDot} />
              <span className={styles.swatchLabel}>{label}</span>
              {current === id && (
                <span className={styles.check} aria-hidden>
                  ✓
                </span>
              )}
            </button>
          ),
        )}
      </div>
    </section>
  );
}
