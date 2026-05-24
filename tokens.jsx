// Design tokens — Jitsu Points, candy-pop kid-friendly system

const THEMES = {
  candy: {
    name: 'Candy',
    primary:   '#FF4F8B',   // hot pink — primary CTA, mascot accents
    secondary: '#FFD23F',   // sunny yellow — points, sparkles
    accent:    '#3BCEAC',   // mint — success, mission ready
    cool:      '#4DA8FF',   // sky blue — info, levels
    warm:      '#FF8C42',   // coral — streaks, fire
    bg:        '#FFF6E8',   // cream — main background
    bgAlt:     '#FFE9D2',   // soft peach — section bg
    card:      '#FFFFFF',
    ink:       '#2A2D5F',   // deep navy — text
    inkSoft:   '#6B6E96',
    line:      '#F0E3CF',
  },
  berry: {
    name: 'Berry',
    primary:   '#9B4DCA',
    secondary: '#FFC857',
    accent:    '#2EC4B6',
    cool:      '#7C9EFF',
    warm:      '#FF6F91',
    bg:        '#FFF1F7',
    bgAlt:     '#F4E1FA',
    card:      '#FFFFFF',
    ink:       '#2D1B4E',
    inkSoft:   '#6D5A8C',
    line:      '#EFD6F1',
  },
  ocean: {
    name: 'Ocean',
    primary:   '#1F86C9',
    secondary: '#FFD23F',
    accent:    '#3BCEAC',
    cool:      '#4DA8FF',
    warm:      '#FF7F50',
    bg:        '#EAF6FF',
    bgAlt:     '#D5ECFA',
    card:      '#FFFFFF',
    ink:       '#0F2C4D',
    inkSoft:   '#476B8C',
    line:      '#CCE3F2',
  },
  sunset: {
    name: 'Sunset',
    primary:   '#F25C54',
    secondary: '#FFD23F',
    accent:    '#83D483',
    cool:      '#A077E0',
    warm:      '#FF9B54',
    bg:        '#FFF1E6',
    bgAlt:     '#FCE0D0',
    card:      '#FFFFFF',
    ink:       '#3A1D2D',
    inkSoft:   '#7A5560',
    line:      '#F3DAC6',
  },
};

// Shared shape language
const TOK = {
  radius: { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 },
  shadow: {
    soft:  '0 2px 0 rgba(42,45,95,0.08), 0 8px 24px rgba(42,45,95,0.08)',
    chunk: '0 4px 0 rgba(42,45,95,0.18)',         // chunky offset (kid-game)
    chunkL:'0 6px 0 rgba(42,45,95,0.22)',
    lift:  '0 8px 24px rgba(42,45,95,0.15)',
  },
  font: {
    display: '"Fredoka", "Baloo 2", system-ui, sans-serif',
    body:    '"Nunito", system-ui, sans-serif',
    mono:    'ui-monospace, "SF Mono", monospace',
  },
};

// Avatar swatches (kids pick from these)
const AVATARS = [
  { id: 'speed',   name: 'Speed Hero',  bg: '#FF4F8B', glyph: '⚡' },
  { id: 'water',   name: 'Water Pup',   bg: '#4DA8FF', glyph: '💧' },
  { id: 'leaf',    name: 'Leaf Ninja',  bg: '#3BCEAC', glyph: '🌿' },
  { id: 'flame',   name: 'Flame Fox',   bg: '#FF8C42', glyph: '🔥' },
  { id: 'star',    name: 'Star Kid',    bg: '#FFD23F', glyph: '★' },
  { id: 'moon',    name: 'Moon Cub',    bg: '#9B4DCA', glyph: '☾' },
];

window.THEMES = THEMES;
window.TOK = TOK;
window.AVATARS = AVATARS;
