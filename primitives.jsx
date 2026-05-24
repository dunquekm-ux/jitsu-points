// Phone frame + shared primitives (StatusBar, Button, Card, Confetti, BatteryStat, Sparkle).

function Phone({ width = 390, height = 844, children, bg, theme }) {
  return (
    <div style={{
      width, height, borderRadius: 44, overflow: 'hidden', position: 'relative',
      background: bg || (theme ? theme.bg : '#FFF6E8'),
      boxShadow: 'inset 0 0 0 6px #1a1430, 0 20px 40px rgba(42,45,95,0.18)',
      fontFamily: TOK.font.body, color: theme ? theme.ink : '#2A2D5F',
    }}>
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 32, borderRadius: 20, background: '#0a0518', zIndex: 50,
      }} />
      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 18, left: 0, right: 0, zIndex: 40,
        display: 'flex', justifyContent: 'space-between',
        padding: '0 30px', alignItems: 'center', height: 24,
        fontFamily: TOK.font.body, fontWeight: 700, fontSize: 15,
        color: theme ? theme.ink : '#2A2D5F',
      }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* signal */}
          <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx=".5" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx=".5" fill="currentColor"/><rect x="9" y="3" width="3" height="8" rx=".5" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx=".5" fill="currentColor"/></svg>
          {/* battery */}
          <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" strokeOpacity=".5"/><rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor"/><rect x="23" y="4" width="2" height="4" rx=".5" fill="currentColor" fillOpacity=".5"/></svg>
        </span>
      </div>
      {/* content */}
      <div style={{ position: 'absolute', inset: 0, paddingTop: 56, overflow: 'hidden' }}>
        {children}
      </div>
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 130, height: 5, borderRadius: 3, background: 'rgba(42,45,95,0.4)', zIndex: 60,
      }}/>
    </div>
  );
}

// Big chunky CTA button — kid-friendly tap target
function ChunkyButton({ children, color = '#FF4F8B', textColor = '#fff',
                       fullWidth = false, size = 'md', icon = null, style = {} }) {
  const sizes = {
    sm: { h: 40, fs: 15, px: 16 },
    md: { h: 56, fs: 19, px: 22 },
    lg: { h: 68, fs: 24, px: 28 },
  }[size];
  return (
    <button style={{
      height: sizes.h, padding: `0 ${sizes.px}px`,
      width: fullWidth ? '100%' : 'auto',
      background: color, color: textColor,
      border: 'none', borderRadius: TOK.radius.lg,
      fontFamily: TOK.font.display, fontWeight: 600,
      fontSize: sizes.fs, letterSpacing: 0.2,
      boxShadow: TOK.shadow.chunk, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

// Card with chunky offset shadow
function Card({ children, color = '#fff', radius = TOK.radius.lg, style = {} }) {
  return (
    <div style={{
      background: color, borderRadius: radius,
      boxShadow: TOK.shadow.chunk,
      ...style,
    }}>{children}</div>
  );
}

// Sound badge pill (toggle indicator)
function SoundBadge({ on, label }) {
  if (!on) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: 'rgba(255,255,255,0.85)', color: '#2A2D5F',
      fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
      boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M2 3.5h2L6.5 1.5v7L4 6.5H2z M7.5 2.5q2 1.5 0 5"
              fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      {label || 'sfx'}
    </span>
  );
}

// Confetti — static decorative confetti pieces (used in celebrations)
function Confetti({ colors, count = 28, seed = 0 }) {
  const palette = colors || ['#FF4F8B','#FFD23F','#3BCEAC','#4DA8FF','#FF8C42','#9B4DCA'];
  // deterministic pseudo-random
  const rand = (i) => {
    const x = Math.sin((i + 1 + seed) * 9999.7) * 10000;
    return x - Math.floor(x);
  };
  const pieces = Array.from({ length: count }, (_, i) => {
    const c = palette[Math.floor(rand(i) * palette.length)];
    const x = rand(i + 100) * 100;
    const y = rand(i + 200) * 100;
    const r = (rand(i + 300) - 0.5) * 80;
    const shape = Math.floor(rand(i + 400) * 3);
    const size = 6 + rand(i + 500) * 10;
    return { c, x, y, r, shape, size };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.shape === 1 ? p.size * 0.5 : p.size,
          background: p.c,
          borderRadius: p.shape === 2 ? '50%' : 2,
          transform: `rotate(${p.r}deg)`,
          opacity: 0.9,
        }}/>
      ))}
    </div>
  );
}

// Sparkle — 4-point star
function Sparkle({ size = 16, color = '#FFD23F' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill={color}/>
    </svg>
  );
}

// Points pill
function PointsPill({ points, color = '#FFD23F', textColor = '#2A2D5F', size = 'md' }) {
  const sz = size === 'lg' ? { h: 36, fs: 18, px: 14 } : { h: 28, fs: 14, px: 10 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: sz.h, padding: `0 ${sz.px}px`, borderRadius: 999,
      background: color, color: textColor,
      fontFamily: TOK.font.display, fontWeight: 700, fontSize: sz.fs,
      boxShadow: '0 2px 0 rgba(42,45,95,0.18)',
    }}>
      <Sparkle size={sz.fs * 0.85} color="#FF8C42" />
      +{points}
    </span>
  );
}

// Tab bar
function TabBar({ active, theme, items }) {
  const list = items || [
    { id: 'home', label: 'Missions', icon: '◎' },
    { id: 'rewards', label: 'Rewards', icon: '★' },
    { id: 'streak', label: 'Streak',  icon: '◈' },
    { id: 'me',     label: 'Me',      icon: '☻' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '10px 12px 28px', display: 'flex',
      background: theme.card,
      borderTop: `2px solid ${theme.line}`,
      borderRadius: '24px 24px 0 0',
    }}>
      {list.map(it => {
        const on = it.id === active;
        return (
          <div key={it.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2, padding: '6px 0',
          }}>
            <div style={{
              width: 44, height: 32, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? theme.primary : 'transparent',
              color: on ? '#fff' : theme.inkSoft,
              fontSize: 18, fontWeight: 800,
            }}>{it.icon}</div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              fontFamily: TOK.font.body,
              color: on ? theme.primary : theme.inkSoft,
            }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

window.Phone = Phone;
window.ChunkyButton = ChunkyButton;
window.Card = Card;
window.SoundBadge = SoundBadge;
window.Confetti = Confetti;
window.Sparkle = Sparkle;
window.PointsPill = PointsPill;
window.TabBar = TabBar;
