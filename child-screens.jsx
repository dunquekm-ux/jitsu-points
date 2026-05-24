// Child-side screens: Profile picker, Home (phone), Task Detail, Rewards Shop,
// Streak, Achievements, Selfie.

// ─────────────────────────────────────────────────────────────
// 1. Profile / avatar picker (entry point)
// ─────────────────────────────────────────────────────────────
function ProfilePicker({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      <div style={{ padding: '36px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 14, fontWeight: 600,
              color: theme.primary, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Jitsu Points
            </div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 32, fontWeight: 700,
              color: theme.ink, lineHeight: 1.05, marginTop: 4 }}>
              Who&rsquo;s here<br/>today?
            </div>
          </div>
          <Jitsu size={90} mood="cheer" color={theme.secondary} accent={theme.primary}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 32 }}>
          {AVATARS.slice(0, 4).map((a, i) => (
            <Card key={a.id} color={theme.card} style={{ padding: 16, textAlign: 'center',
              border: i === 0 ? `3px solid ${theme.primary}` : `3px solid transparent` }}>
              <div style={{
                width: 80, height: 80, borderRadius: 999, margin: '0 auto',
                background: a.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 38, color: '#fff',
                boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.12)',
              }}>{a.glyph}</div>
              <div style={{ fontFamily: TOK.font.display, fontWeight: 700,
                fontSize: 18, color: theme.ink, marginTop: 10 }}>
                {['Emma','Leo','Mia','Noah'][i]}
              </div>
              <div style={{ fontFamily: TOK.font.body, fontWeight: 700,
                fontSize: 12, color: theme.inkSoft, marginTop: 2 }}>
                Lv {[4,2,5,1][i]} · {[250,80,420,15][i]} pts
              </div>
            </Card>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
          <ChunkyButton fullWidth color={theme.primary} size="md"
            icon={<span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>}>
            Add a kid
          </ChunkyButton>
        </div>

        <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center',
          fontFamily: TOK.font.body, fontWeight: 700, fontSize: 13, color: theme.inkSoft }}>
          <span style={{ padding: '8px 14px', background: theme.bgAlt, borderRadius: 999 }}>
            👨‍👩 Parent Mode
          </span>
        </div>
        <SoundBadgeFloater on={soundOn} />
      </div>
    </Phone>
  );
}

// Tiny floating sound-on indicator, top-right under status bar
function SoundBadgeFloater({ on }) {
  if (!on) return null;
  return (
    <div style={{ position: 'absolute', top: 70, right: 18 }}>
      <SoundBadge on={on} label="sfx on"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Home — Today's missions
// ─────────────────────────────────────────────────────────────
function ChildHome({ theme, soundOn }) {
  const tasks = [
    { id: 't1', title: 'Brush Teeth',     window: 'Morning', pts: 5,  state: 'done',      icon: '🦷' },
    { id: 't2', title: 'Make My Bed',     window: 'Morning', pts: 5,  state: 'done',      icon: '🛏️' },
    { id: 't3', title: 'Reading 20 min',  window: 'Anytime', pts: 15, state: 'available', icon: '📖' },
    { id: 't4', title: 'Feed the Dog',    window: 'Evening', pts: 10, state: 'available', icon: '🐶' },
    { id: 't5', title: 'Brush Teeth',     window: 'Evening', pts: 5,  state: 'locked',    icon: '🦷' },
    { id: 't6', title: 'Tidy My Room',    window: 'Evening', pts: 20, state: 'locked',    icon: '🧸' },
  ];

  return (
    <Phone theme={theme}>
      {/* Hero header */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 999, background: AVATARS[0].bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.12)',
            }}>{AVATARS[0].glyph}</div>
            <div>
              <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
                color: theme.inkSoft, lineHeight: 1 }}>HI THERE</div>
              <div style={{ fontFamily: TOK.font.display, fontSize: 20, fontWeight: 700,
                color: theme.ink, marginTop: 2, lineHeight: 1 }}>Emma!</div>
            </div>
          </div>
          <SoundBadge on={soundOn} label="sfx" />
        </div>

        {/* Points + level card */}
        <Card color={theme.primary} style={{
          marginTop: 14, padding: '14px 16px', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
                opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>My points</div>
              <div style={{ fontFamily: TOK.font.display, fontSize: 40, fontWeight: 700,
                lineHeight: 1, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                250<Sparkle size={20} color={theme.secondary}/>
              </div>
            </div>
            <Jitsu size={70} mood="happy" color={theme.secondary} accent="#fff" />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
              <span>Lv 4 — Mission Cadet</span><span>1,200 / 1,500 XP</span>
            </div>
            <div style={{ height: 10, marginTop: 5, background: 'rgba(255,255,255,0.25)',
              borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '80%', height: '100%', background: theme.secondary,
                borderRadius: 999 }}/>
            </div>
          </div>
        </Card>
      </div>

      {/* Mission list */}
      <div style={{ padding: '16px 22px 110px', overflowY: 'auto', maxHeight: 470 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          margin: '8px 4px 10px' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 20, fontWeight: 700,
            color: theme.ink }}>Today&rsquo;s Missions</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800,
            color: theme.accent }}>2 / 6 done</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(t => <TaskRow key={t.id} task={t} theme={theme}/>)}
        </div>
      </div>

      <TabBar active="home" theme={theme}/>
    </Phone>
  );
}

function TaskRow({ task, theme }) {
  const stateMeta = {
    done: { tag: 'COMPLETE',     bg: theme.accent, fg: '#fff', dim: true },
    available: { tag: 'READY!',  bg: theme.secondary, fg: theme.ink },
    locked: { tag: '🔒 Locked',   bg: theme.line, fg: theme.inkSoft, dim: true },
    missed: { tag: 'Missed',     bg: '#E3D9D2', fg: theme.inkSoft, dim: true },
  }[task.state];
  return (
    <div style={{
      background: theme.card, borderRadius: TOK.radius.lg,
      padding: 12, display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 2px 0 rgba(42,45,95,0.10)',
      opacity: stateMeta.dim ? 0.7 : 1,
      border: task.state === 'available' ? `2px solid ${theme.secondary}` : `2px solid transparent`,
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 14,
        background: task.state === 'available' ? theme.bgAlt : theme.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, flexShrink: 0,
        textDecoration: task.state === 'done' ? 'line-through' : 'none',
      }}>{task.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: TOK.font.display, fontSize: 16, fontWeight: 700,
          color: theme.ink, textDecoration: task.state === 'done' ? 'line-through' : 'none' }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
          <span style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
            color: theme.inkSoft }}>{task.window}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontFamily: TOK.font.display, fontSize: 12, fontWeight: 700,
            color: theme.warm,
          }}>
            <Sparkle size={10} color={theme.warm}/>+{task.pts}
          </span>
        </div>
      </div>
      <div style={{
        padding: '6px 10px', borderRadius: 999,
        background: stateMeta.bg, color: stateMeta.fg,
        fontFamily: TOK.font.display, fontSize: 11, fontWeight: 700,
        flexShrink: 0, letterSpacing: 0.3,
      }}>{stateMeta.tag}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Task detail — about to complete
// ─────────────────────────────────────────────────────────────
function TaskDetail({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      {/* Back chip */}
      <div style={{ padding: '6px 22px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px 6px 8px', borderRadius: 999,
          background: theme.card, fontFamily: TOK.font.body, fontWeight: 700,
          fontSize: 13, color: theme.ink, boxShadow: '0 2px 0 rgba(42,45,95,0.10)',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span> Missions
        </div>
      </div>

      <div style={{ padding: '14px 22px' }}>
        <Card color={theme.secondary} style={{ padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
            color: theme.ink, opacity: 0.7, letterSpacing: 1.5,
            textTransform: 'uppercase' }}>Mission Ready</div>
          <div style={{ fontSize: 64, marginTop: 6 }}>📖</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 28, fontWeight: 700,
            color: theme.ink, marginTop: 4 }}>Reading 20&nbsp;min</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', marginTop: 10, borderRadius: 999,
            background: '#fff', fontFamily: TOK.font.display, fontWeight: 700,
            fontSize: 16, color: theme.ink }}>
            <Sparkle size={14} color={theme.warm}/>+15 points
          </div>
        </Card>

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <Meta theme={theme} label="Window"     value="Anytime today"/>
          <Meta theme={theme} label="Streak"     value="🔥 12 days"/>
          <Meta theme={theme} label="Photo proof" value="Not required"/>
          <Meta theme={theme} label="Lifetime"    value="+15 XP"/>
        </div>

        <div style={{ marginTop: 22 }}>
          <ChunkyButton fullWidth color={theme.accent} size="lg">
            ✓ &nbsp; COMPLETE!
          </ChunkyButton>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
            color: theme.inkSoft }}>
            Tap when you&rsquo;ve finished reading 🎉
          </span>
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

function Meta({ theme, label, value }) {
  return (
    <div style={{
      background: theme.card, borderRadius: TOK.radius.md, padding: '10px 12px',
      boxShadow: '0 2px 0 rgba(42,45,95,0.08)',
    }}>
      <div style={{ fontFamily: TOK.font.body, fontSize: 10, fontWeight: 800,
        color: theme.inkSoft, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
        color: theme.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Celebration — confetti + points fly
// ─────────────────────────────────────────────────────────────
function Celebration({ theme, soundOn }) {
  return (
    <Phone theme={theme} bg={theme.primary}>
      {/* Confetti behind */}
      <Confetti colors={[theme.secondary, theme.accent, theme.cool, '#fff', theme.warm]}/>

      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingTop: 40, color: '#fff', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ position: 'relative' }}>
          <Jitsu size={170} mood="cheer" color={theme.secondary} accent="#fff" ring/>
          {/* Sparkles around */}
          <div style={{ position: 'absolute', top: -6, left: -10 }}><Sparkle size={28} color={theme.secondary}/></div>
          <div style={{ position: 'absolute', top: 30, right: -16 }}><Sparkle size={20} color="#fff"/></div>
          <div style={{ position: 'absolute', bottom: 10, left: -20 }}><Sparkle size={22} color={theme.secondary}/></div>
        </div>

        <div style={{ fontFamily: TOK.font.display, fontSize: 16, fontWeight: 800,
          letterSpacing: 3, marginTop: 24, opacity: 0.9 }}>QUEST COMPLETE</div>
        <div style={{ fontFamily: TOK.font.display, fontSize: 44, fontWeight: 700,
          lineHeight: 1, marginTop: 6 }}>+15 points!</div>
        <div style={{ fontFamily: TOK.font.body, fontSize: 16, fontWeight: 700,
          marginTop: 10, opacity: 0.95 }}>
          Awesome reading, Emma!<br/>You&rsquo;re on a 12-day streak 🔥
        </div>

        {/* Points trail */}
        <div style={{ marginTop: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
          <PointsPill points={15} color={theme.secondary} size="lg"/>
          <span style={{ fontFamily: TOK.font.display, fontSize: 22, fontWeight: 700, opacity: 0.7 }}>→</span>
          <span style={{
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(6px)',
            fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700,
          }}>265 total</span>
        </div>

        <div style={{ marginTop: 32 }}>
          <ChunkyButton color="#fff" textColor={theme.primary} size="md">
            Keep going!
          </ChunkyButton>
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

window.ProfilePicker = ProfilePicker;
window.ChildHome = ChildHome;
window.TaskDetail = TaskDetail;
window.Celebration = Celebration;
window.SoundBadgeFloater = SoundBadgeFloater;
