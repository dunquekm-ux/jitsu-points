// More parent screens — Manage rewards, Manage kids, Bonus composer, Demerit composer

// ─────────────────────────────────────────────────────────────
// 15. Manage rewards
// ─────────────────────────────────────────────────────────────
function ManageRewards({ theme, soundOn }) {
  const rewards = [
    { i: '🍦', t: 'Ice Cream',     c: 100, on: true,  child: 'All kids' },
    { i: '🎬', t: 'Movie Night',   c: 200, on: true,  child: 'All kids' },
    { i: '🧱', t: 'New Lego Set',  c: 500, on: true,  child: 'Emma'    },
    { i: '🍕', t: 'Pizza Friday',  c: 150, on: true,  child: 'All kids' },
    { i: '🎳', t: 'Bowling Trip',  c: 600, on: false, child: 'All kids' },
    { i: '🏕️', t: 'Sleepover',     c: 800, on: true,  child: 'Mia'     },
  ];

  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
            color: theme.ink }}>← Back</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 17, fontWeight: 700,
            color: theme.ink }}>Rewards</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 800,
            color: theme.primary }}>＋ New</div>
        </div>

        <Card color={theme.bgAlt} style={{
          marginTop: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 28 }}>🎁</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOK.font.display, fontSize: 14, fontWeight: 700,
              color: theme.ink }}>6 rewards · 5 active</div>
            <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
              color: theme.inkSoft }}>Kids saw 3 of these today</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 22px 80px', overflowY: 'auto',
        height: 'calc(100% - 156px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rewards.map((r, i) => (
            <div key={i} style={{
              background: theme.card, borderRadius: TOK.radius.md, padding: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 2px 0 rgba(42,45,95,0.08)', opacity: r.on ? 1 : 0.55,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, background: theme.bgAlt,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>{r.i}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
                  color: theme.ink }}>{r.t}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                  <span style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
                    color: theme.inkSoft }}>{r.child}</span>
                  <span style={{ width: 3, height: 3, background: theme.line, borderRadius: 999 }}/>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontFamily: TOK.font.display, fontWeight: 700, fontSize: 12,
                    color: theme.warm,
                  }}><Sparkle size={10} color={theme.warm}/>{r.c}</span>
                </div>
              </div>
              <div style={{
                width: 36, height: 22, borderRadius: 999,
                background: r.on ? theme.accent : theme.line, position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 2, [r.on ? 'right' : 'left']: 2,
                  width: 18, height: 18, borderRadius: 999, background: '#fff' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

// ─────────────────────────────────────────────────────────────
// 16. Manage kids (profiles & level progression)
// ─────────────────────────────────────────────────────────────
function ManageKids({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
            color: theme.ink }}>← Back</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 17, fontWeight: 700,
            color: theme.ink }}>Kids</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 800,
            color: theme.primary }}>＋ Add</div>
        </div>
      </div>

      <div style={{ padding: '14px 22px 80px', overflowY: 'auto',
        height: 'calc(100% - 70px)' }}>

        {[
          { ...AVATARS[0], n: 'Emma',  age: 9, lv: 4, xp: 1200, pts: 250 },
          { ...AVATARS[1], n: 'Leo',   age: 6, lv: 2, xp: 280,  pts: 80  },
          { ...AVATARS[2], n: 'Mia',   age: 11, lv: 5, xp: 2100, pts: 420 },
        ].map(k => (
          <Card key={k.id} color={theme.card} style={{
            padding: 14, marginBottom: 10,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 999, background: k.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 26,
                boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.12)',
              }}>{k.glyph}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700,
                  color: theme.ink }}>{k.n} <span style={{ color: theme.inkSoft, fontSize: 13 }}>· age {k.age}</span></div>
                <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
                  color: theme.inkSoft, marginTop: 2 }}>
                  Lv {k.lv} · {k.xp} XP · {k.pts} pts
                </div>
              </div>
              <div style={{ color: theme.inkSoft, fontSize: 22 }}>✎</div>
            </div>

            {/* XP bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontFamily: TOK.font.body, fontSize: 10, fontWeight: 800, color: theme.inkSoft,
                letterSpacing: 0.5, textTransform: 'uppercase' }}>
                <span>To next level</span><span>{1500 - (k.xp % 1500)} XP</span>
              </div>
              <div style={{ height: 8, marginTop: 4, background: theme.bg, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${(k.xp % 1500) / 15}%`, height: '100%',
                  background: theme.accent, borderRadius: 999 }}/>
              </div>
            </div>
          </Card>
        ))}

        {/* Level progression config */}
        <SectionTitle theme={theme} title="Level progression"/>
        <Card color={theme.card} style={{ padding: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { lv: 1, x: 0,    n: 'Sprout' },
              { lv: 2, x: 100,  n: 'Apprentice' },
              { lv: 3, x: 400,  n: 'Mission Rookie' },
              { lv: 4, x: 900,  n: 'Mission Cadet' },
              { lv: 5, x: 1500, n: 'Sky Scout' },
            ].map(l => (
              <div key={l.lv} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 999, background: theme.cool,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: TOK.font.display, fontWeight: 700, fontSize: 13,
                }}>{l.lv}</div>
                <div style={{ flex: 1, fontFamily: TOK.font.display, fontSize: 14,
                  fontWeight: 700, color: theme.ink }}>{l.n}</div>
                <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800,
                  color: theme.inkSoft }}>{l.x} XP</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Phone>
  );
}

// ─────────────────────────────────────────────────────────────
// 17. Give bonus composer
// ─────────────────────────────────────────────────────────────
function BonusComposer({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
            color: theme.ink }}>← Cancel</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 17, fontWeight: 700,
            color: theme.ink }}>Give bonus</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 800,
            color: theme.primary }}>Send 🚀</div>
        </div>
      </div>

      <div style={{ padding: '14px 22px 80px', overflowY: 'auto',
        height: 'calc(100% - 70px)' }}>

        {/* Big amount picker */}
        <Card color={theme.primary} style={{
          padding: '24px 16px 16px', textAlign: 'center', color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
            letterSpacing: 1.6, opacity: 0.9, textTransform: 'uppercase' }}>BONUS AMOUNT</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 64, fontWeight: 700,
            lineHeight: 1, marginTop: 4, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 12 }}>
            +25 <Sparkle size={28} color={theme.secondary}/>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            {[5, 10, 25, 50, 100].map(n => (
              <div key={n} style={{
                padding: '6px 12px', borderRadius: 999,
                background: n === 25 ? theme.secondary : 'rgba(255,255,255,0.2)',
                color: n === 25 ? theme.ink : '#fff',
                fontFamily: TOK.font.display, fontWeight: 700, fontSize: 14,
              }}>+{n}</div>
            ))}
          </div>
        </Card>

        <Field theme={theme} label="To which kid?">
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { ...AVATARS[0], n: 'Emma', on: true  },
              { ...AVATARS[1], n: 'Leo',  on: false },
              { ...AVATARS[2], n: 'Mia',  on: false },
            ].map(k => (
              <div key={k.id} style={{
                flex: 1, padding: 10, borderRadius: 12, textAlign: 'center',
                background: k.on ? theme.primary : theme.bg,
                color: k.on ? '#fff' : theme.ink,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 999, background: k.bg,
                  margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#fff',
                }}>{k.glyph}</div>
                <div style={{ fontFamily: TOK.font.display, fontSize: 12, fontWeight: 700,
                  marginTop: 4 }}>{k.n}</div>
              </div>
            ))}
          </div>
        </Field>

        <Field theme={theme} label="Reason (kid will see this)">
          <div style={{
            padding: '10px 4px', fontFamily: TOK.font.body, fontSize: 14,
            fontWeight: 600, color: theme.ink, fontStyle: 'italic',
          }}>
            You helped your brother pick up his toys without being asked!
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {['🤝 Helped', '🧹 Cleaned up', '💛 Kind', '🌟 Extra effort'].map((c, i) => (
              <div key={i} style={{
                padding: '5px 10px', borderRadius: 999, background: theme.bgAlt,
                fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700, color: theme.ink,
              }}>{c}</div>
            ))}
          </div>
        </Field>

        <Field theme={theme} label="Pop-up style">
          <ToggleRow theme={theme} l="Confetti burst"        on={true}/>
          <ToggleRow theme={theme} l="Mascot says yay"       on={true}/>
          <ToggleRow theme={theme} l="Celebration sound"     on={soundOn} last/>
        </Field>

        <div style={{
          marginTop: 14, padding: 12, borderRadius: TOK.radius.md,
          background: theme.bgAlt, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Jitsu size={50} mood="cheer" color={theme.secondary} accent={theme.primary}/>
          <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
            color: theme.ink, flex: 1 }}>
            Emma will see this pop up the next time she opens the app.
          </div>
        </div>
      </div>
    </Phone>
  );
}

// ─────────────────────────────────────────────────────────────
// 18. Demerit composer — calm, with safety guard rails
// ─────────────────────────────────────────────────────────────
function DemeritComposer({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
            color: theme.ink }}>← Cancel</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 17, fontWeight: 700,
            color: theme.ink }}>Add check-in</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 800,
            color: theme.cool }}>Send</div>
        </div>
      </div>

      <div style={{ padding: '14px 22px 80px', overflowY: 'auto',
        height: 'calc(100% - 70px)' }}>

        <Card color={theme.cool} style={{
          padding: '20px 16px 16px', color: '#fff', textAlign: 'center',
        }}>
          <Jitsu size={70} mood="calm" color={theme.secondary} accent="#fff"/>
          <div style={{ fontFamily: TOK.font.display, fontSize: 16, fontWeight: 700,
            marginTop: 6 }}>This will feel calm, not punishing</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
            marginTop: 4, opacity: 0.95 }}>
            Levels and badges are never taken away.
          </div>
        </Card>

        <Field theme={theme} label="Point adjustment">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TOK.font.display, fontWeight: 700, color: theme.ink }}>−</div>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: TOK.font.display,
              fontSize: 28, fontWeight: 700, color: theme.cool }}>−10</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.cool,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TOK.font.display, fontWeight: 700 }}>+</div>
          </div>
          <div style={{
            margin: '8px 4px 0', padding: 8, borderRadius: 8,
            background: theme.bg, fontFamily: TOK.font.body, fontSize: 11,
            fontWeight: 700, color: theme.inkSoft, textAlign: 'center',
          }}>
            Max −20 per check-in · auto-capped to keep balance ≥ 0
          </div>
        </Field>

        <Field theme={theme} label="To which kid?">
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { ...AVATARS[0], n: 'Emma', on: true  },
              { ...AVATARS[1], n: 'Leo',  on: false },
              { ...AVATARS[2], n: 'Mia',  on: false },
            ].map(k => (
              <div key={k.id} style={{
                flex: 1, padding: 10, borderRadius: 12, textAlign: 'center',
                background: k.on ? theme.cool : theme.bg,
                color: k.on ? '#fff' : theme.ink,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 999, background: k.bg,
                  margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#fff',
                }}>{k.glyph}</div>
                <div style={{ fontFamily: TOK.font.display, fontSize: 12, fontWeight: 700,
                  marginTop: 4 }}>{k.n}</div>
              </div>
            ))}
          </div>
        </Field>

        <Field theme={theme} label="Note (kept calm & specific)">
          <div style={{
            padding: '10px 4px', fontFamily: TOK.font.body, fontSize: 14,
            fontWeight: 600, color: theme.ink, fontStyle: 'italic',
          }}>
            We talked about quiet voices indoors. Tomorrow&rsquo;s a fresh start.
          </div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
            color: theme.inkSoft, padding: '4px 4px 0' }}>
            ✏️ Tip: describe the behavior, not the kid. End with a positive next step.
          </div>
        </Field>
      </div>
    </Phone>
  );
}

window.ManageRewards = ManageRewards;
window.ManageKids = ManageKids;
window.BonusComposer = BonusComposer;
window.DemeritComposer = DemeritComposer;
