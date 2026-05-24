export type ThemeId = 'candy' | 'berry' | 'ocean' | 'sunset';

export const THEMES: Record<ThemeId, { label: string; primaryColor: string }> = {
  candy: { label: 'Candy', primaryColor: '#FF4F8B' },
  berry: { label: 'Berry', primaryColor: '#9B5DE5' },
  ocean: { label: 'Ocean', primaryColor: '#0077B6' },
  sunset: { label: 'Sunset', primaryColor: '#FF6B35' },
};

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute('data-theme', theme);
  // Update the browser theme-color meta tag for Chrome/Android
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEMES[theme].primaryColor;
}

export function getStoredTheme(): ThemeId {
  const stored = localStorage.getItem('jitsu-theme');
  return (stored as ThemeId) ?? 'candy';
}

export function storeTheme(theme: ThemeId): void {
  localStorage.setItem('jitsu-theme', theme);
}
