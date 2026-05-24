// Live child screens — stateful variants of the canvas screens for the prototype.

// ──────────────────────────────
// Profile picker
// ──────────────────────────────
function LiveProfile({ ctx }) {
  const { theme, soundOn, go, setS } = ctx;
  const [pick, setPick] = useState(0);
  const kids = [
    { ...AVATARS[0], n: 'Emma', lv: 4, pts: 250 },
    { ...AVATARS[1], n: 'Leo',  lv: 2, pts: 80  },
    { ...AVATARS[2], n: 'Mia',  lv: 5, pts: 420 },
    { ...AVATARS[3], n: 'Noah', lv: 1, pts: 15  },
  ];

  return (
    <Phone theme={theme}>
      <div style={{ padding: '36px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: TOK.font.display, fontSize: 14, fontWeight: 600,
              color: theme.primary, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Jitsu Points
            </div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 30, fontWeight: 700,
              color: theme.ink, lineHeight: 1.05, marginTop: 4, whiteSpace: 'nowrap' }}>
              Who&rsquo;s here<br/>today?
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Jitsu size={84} mood="cheer" color={theme.secondary} accent={theme.primary}/>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 32 }}>
          {kids.map((k, i) => (
            <button key={k.id} onClick={() => { setPick(i); setTimeout(() => go('home', { kidId: k.id, points: k.pts, level: k.lv }), 180); }}
              style={{
                appearance: 'none', border: 'none', background: theme.card,
                padding: 16, textAlign: 'center', borderRadius: TOK.radius.lg,
                boxShadow: TOK.shadow.chunk, cursor: 'pointer',
                outline: i === pick ? `3px solid ${theme.primary}` : '3px solid transparent',
                transition: 'transform 120ms', transform: i === pick ? 'scale(1.03)' : 'scale(1)',
                fontFamily: 'inherit',
              }}>
              <div style={{
                width: 80, height: 80, borderRadius: 999, margin: '0 auto',
                background: k.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 38, color: '#fff',
                boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.12)',
              }}>{k.glyph}</div>
              <div style={{ fontFamily: TOK.font.display, fontWeight: 700,
                fontSize: 18, color: theme.ink, marginTop: 10 }}>{k.n}</div>
              <div style={{ fontFamily: TOK.font.body, fontWeight: 700,
                fontSize: 12, color: theme.inkSoft, marginTop: 2 }}>
                Lv {k.lv} · {k.pts} pts
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
          <ChunkyButton fullWidth color={theme.primary} size="md"
            icon={<span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>}>
            Add a kid
          </ChunkyButton>
        </div>

        <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center' }}>
          <button
            onClick={() => setS(p => ({ ...p, parentMode: true, screen: 'parent_dash', history: [] }))}
            style={{
              appearance: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 14px', background: theme.bgAlt, borderRadius: 999,
              fontFamily: TOK.font.body, fontWeight: 700, fontSize: 13, color: theme.inkSoft,
              whiteSpace: 'nowrap',
            }}>
            👨‍👩 Parent Mode
          </button>
        </div>
        <SoundBadgeFloater on={soundOn}/>
      </div>
    </Phone>
  );
}

// ──────────────────────────────
// Home
// ──────────────────────────────
function LiveHome({ ctx }) {
  const { theme, soundOn, s, go, setS } = ctx;
  const tasks = s.tasks;
  const doneCount = tasks.filter(x => x.state === 'done').length;
  const progressPct = Math.min(100, (s.xp % 1500) / 15);

  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setS(p => ({ ...p, screen: 'profile', history: [] }))}
            style={{ appearance: 'none', border: 'none', background: 'transparent',
              padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 999, background: AVATARS[0].bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.12)',
            }}>{AVATARS[0].glyph}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
                color: theme.inkSoft, lineHeight: 1 }}>HI THERE</div>
              <div style={{ fontFamily: TOK.font.display, fontSize: 20, fontWeight: 700,
                color: theme.ink, marginTop: 2, lineHeight: 1 }}>Emma!</div>
            </div>
          </button>
          <SoundBadge on={soundOn} label="sfx"/>
        </div>

        <Card color={theme.primary} style={{
          marginTop: 14, padding: '14px 16px', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
                opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>My points</div>
              <div style={{ fontFamily: TOK.font.display, fontSize: 40, fontWeight: 700,
                lineHeight: 1, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PointsCounter value={s.points}/>
                <Sparkle size={20} color={theme.secondary}/>
              </div>
            </div>
            <Jitsu size={70} mood="happy" color={theme.secondary} accent="#fff"/>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
              <span>Lv {s.level} — Mission Cadet</span><span>{s.xp} / 1,500 XP</span>
            </div>
            <div style={{ height: 10, marginTop: 5, background: 'rgba(255,255,255,0.25)',
              borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: theme.secondary,
                borderRadius: 999, transition: 'width 600ms cubic-bezier(.2,.7,.3,1)' }}/>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '16px 22px 110px', overflowY: 'auto', maxHeight: 470 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          margin: '8px 4px 10px' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 20, fontWeight: 700,
            color: theme.ink }}>Today&rsquo;s Missions</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800,
            color: theme.accent }}>{doneCount} / {tasks.length} done</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(t => (
            <button key={t.id}
              disabled={t.state === 'locked'}
              onClick={() => t.state !== 'locked' && go('task_detail', { activeTask: t.id })}
              style={{
                appearance: 'none', border: 'none', background: 'transparent', padding: 0, width: '100%',
                cursor: t.state === 'locked' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}>
              <TaskRow task={t} theme={theme}/>
            </button>
          ))}
        </div>
      </div>

      <LiveTabBar ctx={ctx} active="home"/>
    </Phone>
  );
}

// ──────────────────────────────
// Task detail
// ──────────────────────────────
function LiveTaskDetail({ ctx }) {
  const { theme, soundOn, s, back, completeTask } = ctx;
  const task = s.tasks.find(x => x.id === s.activeTask) || s.tasks.find(x => x.state === 'available');
  if (!task) { setTimeout(back, 0); return null; }

  return (
    <Phone theme={theme}>
      <div style={{ padding: '6px 22px' }}>
        <button onClick={back} style={{
          appearance: 'none', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px 6px 8px', borderRadius: 999,
          background: theme.card, fontFamily: TOK.font.body, fontWeight: 700,
          fontSize: 13, color: theme.ink, boxShadow: '0 2px 0 rgba(42,45,95,0.10)',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span> Missions
        </button>
      </div>

      <div style={{ padding: '14px 22px' }}>
        <Card color={theme.secondary} style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
            color: theme.ink, opacity: 0.7, letterSpacing: 1.5,
            textTransform: 'uppercase' }}>Mission Ready</div>
          <div style={{ fontSize: 64, marginTop: 6 }}>{task.icon}</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 28, fontWeight: 700,
            color: theme.ink, marginTop: 4 }}>{task.title}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', marginTop: 10, borderRadius: 999,
            background: '#fff', fontFamily: TOK.font.display, fontWeight: 700,
            fontSize: 16, color: theme.ink }}>
            <Sparkle size={14} color={theme.warm}/>+{task.pts} points
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <Meta theme={theme} label="Window"     value={task.window}/>
          <Meta theme={theme} label="Streak"     value={`🔥 ${s.streak} days`}/>
          <Meta theme={theme} label="Photo proof" value="Not required"/>
          <Meta theme={theme} label="Lifetime"    value={`+${task.pts} XP`}/>
        </div>

        <div style={{ marginTop: 22 }}>
          <button onClick={() => completeTask(task.id)} style={{
            appearance: 'none', border: 'none', cursor: 'pointer',
            width: '100%', height: 68, padding: '0 28px',
            background: theme.accent, color: '#fff',
            borderRadius: TOK.radius.lg, fontFamily: TOK.font.display,
            fontWeight: 700, fontSize: 24, letterSpacing: 0.2,
            boxShadow: TOK.shadow.chunk,
          }}>
            ✓ &nbsp; COMPLETE!
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
            color: theme.inkSoft }}>
            Tap when you&rsquo;ve finished 🎉
          </span>
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

// ──────────────────────────────
// Celebration — with confetti animation + points fly to total
// ──────────────────────────────
function LiveCelebration({ ctx }) {
  const { theme, soundOn, s, setS, go } = ctx;
  const [phase, setPhase] = useState(0); // 0 = burst, 1 = points-fly, 2 = ready

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // If a level-up is pending, navigate there after celebration
  useEffect(() => {
    if (phase === 2 && s.pendingPopup === 'levelup') {
      const t = setTimeout(() => {
        setS(p => ({ ...p, pendingPopup: null }));
        go('levelup');
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [phase, s.pendingPopup]);

  return (
    <Phone theme={theme} bg={theme.primary}>
      {/* animated confetti */}
      <FallingConfetti theme={theme}/>

      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ position: 'relative',
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.6)',
          transition: 'transform 600ms cubic-bezier(.34,1.56,.64,1)' }}>
          <Jitsu size={170} mood="cheer" color={theme.secondary} accent="#fff" ring/>
        </div>

        <div style={{
          fontFamily: TOK.font.display, fontSize: 16, fontWeight: 800,
          letterSpacing: 3, marginTop: 24, opacity: phase >= 1 ? 0.9 : 0,
          transition: 'opacity 300ms 200ms' }}>QUEST COMPLETE</div>

        <div style={{
          fontFamily: TOK.font.display, fontSize: 44, fontWeight: 700,
          lineHeight: 1, marginTop: 6,
          transform: `translateY(${phase >= 1 ? 0 : 16}px)`,
          opacity: phase >= 1 ? 1 : 0,
          transition: 'all 500ms 200ms cubic-bezier(.2,.7,.3,1)',
        }}>+{s.lastEarned} points!</div>

        <div style={{ fontFamily: TOK.font.body, fontSize: 16, fontWeight: 700,
          marginTop: 10, opacity: phase >= 2 ? 0.95 : 0, transition: 'opacity 300ms 400ms' }}>
          Awesome work, Emma!<br/>You&rsquo;re on a {s.streak}-day streak 🔥
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 6, alignItems: 'center',
          opacity: phase >= 2 ? 1 : 0, transition: 'opacity 300ms 500ms' }}>
          <PointsPill points={s.lastEarned} color={theme.secondary} size="lg"/>
          <span style={{ fontFamily: TOK.font.display, fontSize: 22, fontWeight: 700, opacity: 0.7 }}>→</span>
          <span style={{
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
            fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700,
          }}>
            <PointsCounter value={s.points}/> total
          </span>
        </div>

        <div style={{ marginTop: 32, opacity: phase >= 2 ? 1 : 0, transition: 'opacity 300ms 600ms' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => go('selfie')} style={{
              appearance: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 18px', background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)', color: '#fff',
              borderRadius: TOK.radius.lg, fontFamily: TOK.font.display,
              fontWeight: 700, fontSize: 15,
            }}>📷 Victory selfie</button>
            <button onClick={() => ctx.setS(p => ({ ...p, screen: 'home', history: [], activeTask: null, pendingPopup: null }))}
              style={{
                appearance: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 22px', background: '#fff', color: theme.primary,
                borderRadius: TOK.radius.lg, fontFamily: TOK.font.display,
                fontWeight: 700, fontSize: 17, boxShadow: TOK.shadow.chunk,
              }}>Keep going!</button>
          </div>
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

// Animated count-up
function PointsCounter({ value }) {
  const [shown, setShown] = useState(value);
  const startRef = useRef(value);
  const valueRef = useRef(value);
  useEffect(() => {
    if (value === valueRef.current) return;
    const start = valueRef.current;
    const delta = value - start;
    const dur = 900;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + delta * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else valueRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

// Animated falling confetti pieces
function FallingConfetti({ theme }) {
  const palette = [theme.secondary, theme.accent, theme.cool, '#fff', theme.warm];
  const pieces = Array.from({ length: 36 }, (_, i) => {
    const r = (n) => { const x = Math.sin((i + 1 + n) * 9999.7) * 10000; return x - Math.floor(x); };
    return {
      c: palette[Math.floor(r(0) * palette.length)],
      x: r(1) * 100,
      dur: 1.6 + r(2) * 1.4,
      delay: r(3) * 0.5,
      rot: (r(4) - 0.5) * 720,
      size: 6 + r(5) * 10,
      shape: Math.floor(r(6) * 3),
    };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes ji-fall { from { transform: translateY(-40px) rotate(0deg); }
                             to   { transform: translateY(900px) rotate(720deg); } }
      `}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: -30,
          width: p.size, height: p.shape === 1 ? p.size * 0.5 : p.size,
          background: p.c,
          borderRadius: p.shape === 2 ? '50%' : 2,
          animation: `ji-fall ${p.dur}s ${p.delay}s linear infinite`,
        }}/>
      ))}
    </div>
  );
}

// ──────────────────────────────
// Live Tab Bar — navigates between sections
// ──────────────────────────────
function LiveTabBar({ ctx, active }) {
  const { theme, setS } = ctx;
  const tabs = [
    { id: 'home',    label: 'Missions', icon: '◎' },
    { id: 'rewards', label: 'Rewards',  icon: '★' },
    { id: 'streak',  label: 'Streak',   icon: '◈' },
    { id: 'badges',  label: 'Trophies', icon: '☻' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '10px 12px 28px', display: 'flex',
      background: theme.card,
      borderTop: `2px solid ${theme.line}`,
      borderRadius: '24px 24px 0 0',
    }}>
      {tabs.map(tab => {
        const on = tab.id === active;
        return (
          <button key={tab.id}
            onClick={() => setS(p => ({ ...p, screen: tab.id, activeTask: null, activeReward: null, history: [] }))}
            style={{
              appearance: 'none', border: 'none', background: 'transparent',
              cursor: 'pointer', flex: 1, padding: '6px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
            <div style={{
              width: 44, height: 32, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? theme.primary : 'transparent',
              color: on ? '#fff' : theme.inkSoft,
              fontSize: 18, fontWeight: 800,
            }}>{tab.icon}</div>
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: TOK.font.body,
              color: on ? theme.primary : theme.inkSoft,
            }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

window.LiveProfile = LiveProfile;
window.LiveHome = LiveHome;
window.LiveTaskDetail = LiveTaskDetail;
window.LiveCelebration = LiveCelebration;
window.PointsCounter = PointsCounter;
window.FallingConfetti = FallingConfetti;
window.LiveTabBar = LiveTabBar;
