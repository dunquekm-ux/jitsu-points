// Parent-side admin screens — dashboard, create task, manage rewards/kids, bonus/demerit composer.
// These render on a desktop-ish "Parent Mode" canvas. We use phone-width frames except the dashboard.

// ─────────────────────────────────────────────────────────────
// 13. Parent dashboard — single-screen overview
// ─────────────────────────────────────────────────────────────
function ParentDashboard({ theme, soundOn }) {
  return (
    <Phone width={420} height={900} theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
              color: theme.primary, letterSpacing: 2, textTransform: 'uppercase' }}>
              PARENT MODE
            </div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 24, fontWeight: 700,
              color: theme.ink, lineHeight: 1.05, marginTop: 2 }}>
              Hi, Sarah 👋
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 999, background: theme.bgAlt,
            fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800,
            color: theme.ink,
          }}>← Back to kids</div>
        </div>
      </div>

      <div style={{ padding: '14px 22px 30px', overflowY: 'auto',
        height: 'calc(100% - 90px)' }}>

        {/* Kid switcher */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { ...AVATARS[0], n: 'Emma',  lv: 4, pts: 250, on: true },
            { ...AVATARS[1], n: 'Leo',   lv: 2, pts: 80,  on: false },
            { ...AVATARS[2], n: 'Mia',   lv: 5, pts: 420, on: false },
          ].map(k => (
            <div key={k.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 8px',
              borderRadius: 999, background: k.on ? theme.primary : theme.card,
              color: k.on ? '#fff' : theme.ink,
              boxShadow: k.on ? '0 2px 0 rgba(42,45,95,0.18)' : '0 2px 0 rgba(42,45,95,0.08)',
              flexShrink: 0,
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: k.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff' }}>{k.glyph}</div>
              <span style={{ fontFamily: TOK.font.display, fontWeight: 700, fontSize: 14 }}>{k.n}</span>
              <span style={{ opacity: 0.75, fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700 }}>
                Lv {k.lv}
              </span>
            </div>
          ))}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 999, border: `2px dashed ${theme.line}`,
            color: theme.inkSoft, fontFamily: TOK.font.display, fontWeight: 700, fontSize: 13,
            flexShrink: 0,
          }}>＋ Add</div>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
          <ParentStat theme={theme} v="6" l="Tasks today" c={theme.primary}/>
          <ParentStat theme={theme} v="2/6" l="Done" c={theme.accent}/>
          <ParentStat theme={theme} v="12" l="Day streak" c={theme.warm} icon="🔥"/>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <QuickAction theme={theme} color={theme.accent}  icon="⊕" t="New task"/>
          <QuickAction theme={theme} color={theme.secondary} tc={theme.ink} icon="★" t="New reward"/>
          <QuickAction theme={theme} color={theme.primary} icon="🎉" t="Give bonus"/>
          <QuickAction theme={theme} color={theme.cool} icon="◷" t="Add demerit"/>
        </div>

        {/* Tasks list */}
        <SectionTitle theme={theme} title="Emma's tasks" right="Manage all →"/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { i: '🦷', t: 'Brush Teeth',  s: 'Morning · Evening', p: 5,  on: true },
            { i: '📖', t: 'Reading',      s: 'Anytime · daily',   p: 15, on: true },
            { i: '🛏️', t: 'Make My Bed',  s: 'Morning · daily',   p: 5,  on: true },
            { i: '🐶', t: 'Feed the Dog', s: 'Evening · daily',   p: 10, on: true },
            { i: '🧸', t: 'Tidy My Room', s: 'Evening · Mon Wed Fri', p: 20, on: false },
          ].map((t, i) => (
            <div key={i} style={{
              background: theme.card, borderRadius: TOK.radius.md,
              padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 1px 0 rgba(42,45,95,0.08)',
              opacity: t.on ? 1 : 0.5,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: theme.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>{t.i}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
                  color: theme.ink }}>{t.t}</div>
                <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
                  color: theme.inkSoft }}>{t.s}</div>
              </div>
              <div style={{
                padding: '3px 8px', borderRadius: 999, background: theme.bgAlt,
                fontFamily: TOK.font.display, fontWeight: 700, fontSize: 12,
                color: theme.ink, display: 'flex', alignItems: 'center', gap: 3,
              }}><Sparkle size={9} color={theme.warm}/>+{t.p}</div>
              {/* toggle */}
              <div style={{
                width: 36, height: 22, borderRadius: 999,
                background: t.on ? theme.accent : theme.line,
                position: 'relative', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 2,
                  [t.on ? 'right' : 'left']: 2,
                  width: 18, height: 18, borderRadius: 999, background: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}/>
              </div>
            </div>
          ))}
        </div>

        <SectionTitle theme={theme} title="Recent activity"/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { i: '✓', c: theme.accent,    t: 'Completed Brush Teeth', s: '+5 pts · 8 min ago' },
            { i: '🎉',c: theme.primary,   t: 'Bonus from Mom', s: '+25 pts · 1 hr ago' },
            { i: '✓', c: theme.accent,    t: 'Completed Make My Bed', s: '+5 pts · 2 hr ago' },
            { i: '◷', c: theme.cool,      t: 'Demerit · loud indoors', s: '−10 pts · yesterday' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 4px' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999, background: a.c,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: TOK.font.display, fontWeight: 700, fontSize: 13,
              }}>{a.i}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
                  color: theme.ink }}>{a.t}</div>
                <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
                  color: theme.inkSoft }}>{a.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

function ParentStat({ v, l, c, theme, icon }) {
  return (
    <div style={{
      background: theme.card, borderRadius: TOK.radius.md,
      padding: '10px 12px', boxShadow: '0 2px 0 rgba(42,45,95,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <div style={{ fontFamily: TOK.font.display, fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
      </div>
      <div style={{ fontFamily: TOK.font.body, fontSize: 10, fontWeight: 800,
        color: theme.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase' }}>{l}</div>
    </div>
  );
}

function QuickAction({ icon, t, theme, color, tc }) {
  return (
    <div style={{
      background: color, color: tc || '#fff',
      borderRadius: TOK.radius.md, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 3px 0 rgba(42,45,95,0.18)',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 8,
        background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16 }}>{icon}</div>
      <span style={{ fontFamily: TOK.font.display, fontSize: 14, fontWeight: 700 }}>{t}</span>
    </div>
  );
}

function SectionTitle({ theme, title, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      margin: '18px 4px 8px' }}>
      <div style={{ fontFamily: TOK.font.display, fontSize: 16, fontWeight: 700,
        color: theme.ink }}>{title}</div>
      {right && (
        <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
          color: theme.primary }}>{right}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 14. Create task — parent form
// ─────────────────────────────────────────────────────────────
function CreateTask({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
            color: theme.ink }}>← Cancel</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 17, fontWeight: 700,
            color: theme.ink }}>New mission</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 800,
            color: theme.line }}>Save</div>
        </div>
      </div>

      <div style={{ padding: '14px 22px 80px', overflowY: 'auto',
        height: 'calc(100% - 70px)' }}>

        {/* Big task preview */}
        <Card color={theme.secondary} style={{ padding: 16, display: 'flex',
          alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.08)',
          }}>🦷</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700,
              color: theme.ink }}>Brush Teeth</div>
            <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
              color: theme.ink, opacity: 0.7 }}>Mission preview</div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 999, background: '#fff',
            fontFamily: TOK.font.display, fontWeight: 700, fontSize: 14, color: theme.ink,
          }}>+5</div>
        </Card>

        <Field theme={theme} label="Mission name" value="Brush Teeth"/>
        <Field theme={theme} label="Pick an icon">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['🦷','🛏️','📖','🐶','🍎','🧸','🚿','🪥','🍽️','♻️'].map((e, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 10, fontSize: 20,
                background: i === 0 ? theme.primary : theme.bg,
                color: i === 0 ? '#fff' : theme.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{e}</div>
            ))}
          </div>
        </Field>

        <Field theme={theme} label="Points reward">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TOK.font.display, fontWeight: 700, color: theme.ink }}>−</div>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: TOK.font.display,
              fontSize: 28, fontWeight: 700, color: theme.ink }}>5</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.primary,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TOK.font.display, fontWeight: 700 }}>+</div>
          </div>
        </Field>

        <Field theme={theme} label="Schedule">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ScheduleRow theme={theme} l="Morning"  t="07:00 – 09:00"  r="06:45" on/>
            <ScheduleRow theme={theme} l="Evening"  t="19:00 – 21:00"  r="18:45" on/>
            <div style={{
              padding: '10px 12px', borderRadius: TOK.radius.md,
              border: `2px dashed ${theme.line}`, textAlign: 'center',
              fontFamily: TOK.font.display, fontSize: 13, fontWeight: 700,
              color: theme.primary,
            }}>＋ Add another time</div>
          </div>
        </Field>

        <Field theme={theme} label="Repeat">
          <div style={{ display: 'flex', gap: 5 }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{
                flex: 1, height: 34, borderRadius: 8,
                background: i < 5 ? theme.primary : theme.bg,
                color: i < 5 ? '#fff' : theme.inkSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: TOK.font.display, fontWeight: 700, fontSize: 13,
              }}>{d}</div>
            ))}
          </div>
        </Field>

        <Field theme={theme} label="Extras">
          <ToggleRow theme={theme} l="Requires photo proof"   on={false}/>
          <ToggleRow theme={theme} l="Allow early completion" on={false}/>
          <ToggleRow theme={theme} l="Send reminder push"     on={true} last/>
        </Field>

        <ChunkyButton fullWidth color={theme.primary} size="lg" style={{ marginTop: 20 }}>
          Save mission
        </ChunkyButton>
      </div>
    </Phone>
  );
}

function Field({ label, theme, value, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
        color: theme.inkSoft, letterSpacing: 0.8, textTransform: 'uppercase',
        padding: '0 4px 6px' }}>{label}</div>
      <div style={{
        background: theme.card, borderRadius: TOK.radius.md,
        padding: value !== undefined ? '14px 16px' : 10,
        boxShadow: '0 2px 0 rgba(42,45,95,0.08)',
      }}>
        {value !== undefined ? (
          <div style={{ fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700,
            color: theme.ink, display: 'flex', justifyContent: 'space-between' }}>
            <span>{value}</span>
            <span style={{ color: theme.line, fontSize: 18 }}>✎</span>
          </div>
        ) : children}
      </div>
    </div>
  );
}

function ScheduleRow({ l, t, r, on, theme }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: TOK.radius.md,
      background: theme.bgAlt, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 999, background: theme.accent,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: TOK.font.display, fontWeight: 700, fontSize: 11,
      }}>{l[0]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: TOK.font.display, fontSize: 14, fontWeight: 700,
          color: theme.ink }}>{l}</div>
        <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
          color: theme.inkSoft }}>{t} · remind {r}</div>
      </div>
      <div style={{ color: theme.inkSoft }}>›</div>
    </div>
  );
}

function ToggleRow({ l, on, theme, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '10px 6px',
      borderBottom: last ? 'none' : `1px solid ${theme.line}`,
    }}>
      <div style={{ flex: 1, fontFamily: TOK.font.body, fontSize: 14, fontWeight: 700,
        color: theme.ink }}>{l}</div>
      <div style={{
        width: 42, height: 24, borderRadius: 999,
        background: on ? theme.accent : theme.line,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          [on ? 'right' : 'left']: 2,
          width: 20, height: 20, borderRadius: 999, background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}/>
      </div>
    </div>
  );
}

window.ParentDashboard = ParentDashboard;
window.CreateTask = CreateTask;
window.SectionTitle = SectionTitle;
window.Field = Field;
window.ToggleRow = ToggleRow;
