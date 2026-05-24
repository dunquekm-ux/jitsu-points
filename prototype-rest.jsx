// Remaining live screens: rewards, streak, badges, level up, popups, parent dash, side panels

// ──────────────────────────────
// Live Rewards shop
// ──────────────────────────────
function LiveRewards({ ctx }) {
  const { theme, soundOn, s, go } = ctx;
  const colorMap = {
    __primary: theme.primary, __cool: theme.cool, __warm: theme.warm,
    __accent: theme.accent, __secondary: theme.secondary, __purple: '#9B4DCA',
  };
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 26, fontWeight: 700,
            color: theme.ink }}>Rewards Vault</div>
          <SoundBadge on={soundOn} label="sfx"/>
        </div>

        <Card color={theme.card} style={{
          marginTop: 10, padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `2px solid ${theme.secondary}`,
        }}>
          <div>
            <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
              color: theme.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>You can spend</div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 30, fontWeight: 700,
              color: theme.ink, lineHeight: 1, marginTop: 3 }}>
              <PointsCounter value={s.points}/> pts
            </div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: 999, background: theme.secondary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.12)',
          }}><Sparkle size={28} color={theme.warm}/></div>
        </Card>
      </div>

      <div style={{ padding: '16px 22px 110px', overflowY: 'auto', maxHeight: 540 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {s.rewards.map(r => {
            const can = s.points >= r.cost;
            return (
              <button key={r.id}
                disabled={!can}
                onClick={() => go('redeem', { activeReward: r.id })}
                style={{
                  appearance: 'none', border: 'none', background: theme.card,
                  borderRadius: TOK.radius.lg, padding: 12,
                  boxShadow: '0 2px 0 rgba(42,45,95,0.10)',
                  opacity: can ? 1 : 0.55, position: 'relative', overflow: 'hidden',
                  cursor: can ? 'pointer' : 'not-allowed', textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'transform 100ms',
                }}
                onMouseDown={(e) => can && (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
                <div style={{
                  width: '100%', aspectRatio: '1 / 1',
                  borderRadius: TOK.radius.md, background: colorMap[r.color],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 44, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.12)',
                }}>{r.icon}</div>
                <div style={{
                  fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
                  color: theme.ink, marginTop: 8,
                }}>{r.title}</div>
                <div style={{
                  marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 999,
                  background: can ? theme.secondary : theme.line,
                  color: can ? theme.ink : theme.inkSoft,
                  fontFamily: TOK.font.display, fontSize: 13, fontWeight: 700,
                }}>
                  <Sparkle size={11} color={can ? theme.warm : theme.inkSoft}/>
                  {r.cost}
                </div>
                {!can && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    background: '#fff', borderRadius: 999,
                    padding: '3px 8px', fontFamily: TOK.font.body,
                    fontSize: 10, fontWeight: 800, color: theme.inkSoft,
                    boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
                  }}>NEED {r.cost - s.points} MORE</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <LiveTabBar ctx={ctx} active="rewards"/>
    </Phone>
  );
}

// Live Redeem confirm
function LiveRedeem({ ctx }) {
  const { theme, soundOn, s, back, redeemReward } = ctx;
  const r = s.rewards.find(x => x.id === s.activeReward);
  if (!r) { setTimeout(back, 0); return null; }
  const colorMap = {
    __primary: theme.primary, __cool: theme.cool, __warm: theme.warm,
    __accent: theme.accent, __secondary: theme.secondary, __purple: '#9B4DCA',
  };
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <button onClick={back} style={{
          appearance: 'none', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px 6px 8px', borderRadius: 999,
          background: theme.card, fontFamily: TOK.font.body, fontWeight: 700,
          fontSize: 13, color: theme.ink, boxShadow: '0 2px 0 rgba(42,45,95,0.10)',
        }}><span style={{ fontSize: 16, lineHeight: 1 }}>←</span> Rewards</button>
      </div>

      <div style={{ padding: '24px 22px' }}>
        <Card color={theme.card} style={{ padding: 20, textAlign: 'center' }}>
          <div style={{
            width: 110, height: 110, borderRadius: TOK.radius.lg, margin: '0 auto',
            background: colorMap[r.color], display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 56,
            boxShadow: 'inset 0 -8px 0 rgba(0,0,0,0.12)',
          }}>{r.icon}</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 26, fontWeight: 700,
            color: theme.ink, marginTop: 14 }}>{r.title}</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 14, fontWeight: 600,
            color: theme.inkSoft, marginTop: 4 }}>Confirm with a grown-up 🤝</div>

          <div style={{
            marginTop: 16, padding: 14, borderRadius: TOK.radius.md,
            background: theme.bgAlt, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <Line theme={theme} l="Cost"            r={`-${r.cost} pts`} rColor={theme.primary}/>
            <Line theme={theme} l="My points now"   r={String(s.points)}/>
            <div style={{ borderTop: `1px dashed ${theme.line}` }}/>
            <Line theme={theme} l="After redeeming" r={`${s.points - r.cost} pts`} bold/>
          </div>
          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: TOK.radius.md,
            background: theme.bg, fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
            color: theme.inkSoft }}>
            ✨ Lifetime XP won&rsquo;t change — your level is safe.
          </div>
        </Card>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button onClick={back} style={{
            appearance: 'none', border: 'none', cursor: 'pointer',
            flex: 1, height: 56, background: theme.bgAlt, color: theme.ink,
            borderRadius: TOK.radius.lg, fontFamily: TOK.font.display, fontWeight: 600,
            fontSize: 19, boxShadow: TOK.shadow.chunk,
          }}>Not yet</button>
          <button onClick={() => redeemReward(r.id)} style={{
            appearance: 'none', border: 'none', cursor: 'pointer',
            flex: 1.4, height: 56, background: theme.primary, color: '#fff',
            borderRadius: TOK.radius.lg, fontFamily: TOK.font.display, fontWeight: 600,
            fontSize: 19, boxShadow: TOK.shadow.chunk,
          }}>🎉 Claim it!</button>
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

// Redeemed — confirmation
function LiveRedeemed({ ctx }) {
  const { theme, soundOn, s, setS } = ctx;
  const r = s.activeReward;
  useEffect(() => {
    const t = setTimeout(() => setS(p => ({ ...p, screen: 'rewards', activeReward: null, history: [] })), 2400);
    return () => clearTimeout(t);
  }, []);
  return (
    <Phone theme={theme} bg={theme.accent}>
      <FallingConfetti theme={theme}/>
      <div style={{ position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', textAlign: 'center', padding: '40px 24px' }}>
        <Jitsu size={140} mood="cheer" color={theme.secondary} accent="#fff"/>
        <div style={{ fontFamily: TOK.font.display, fontSize: 14, fontWeight: 800,
          letterSpacing: 3, opacity: 0.9, marginTop: 18 }}>REWARD CLAIMED!</div>
        <div style={{ fontFamily: TOK.font.display, fontSize: 38, fontWeight: 700, marginTop: 8 }}>
          {r && r.icon} {r && r.title}
        </div>
        <div style={{ fontFamily: TOK.font.body, fontSize: 14, fontWeight: 700,
          marginTop: 10, opacity: 0.95 }}>
          A grown-up has been notified.
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

// Live Streak (read-only with back via tabs)
function LiveStreak({ ctx }) {
  const { theme, soundOn } = ctx;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <StreakPage theme={theme} soundOn={soundOn}/>
      <LiveTabBar ctx={ctx} active="streak"/>
    </div>
  );
}

function LiveBadges({ ctx }) {
  const { theme, soundOn } = ctx;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Achievements theme={theme} soundOn={soundOn}/>
      <LiveTabBar ctx={ctx} active="badges"/>
    </div>
  );
}

function LiveLevelUp({ ctx }) {
  const { theme, soundOn, setS } = ctx;
  return (
    <div onClick={() => setS(p => ({ ...p, screen: 'home', history: [] }))}
      style={{ cursor: 'pointer' }}>
      <LevelUp theme={theme} soundOn={soundOn}/>
    </div>
  );
}

function LiveBonusOverlay({ ctx }) {
  const { theme, soundOn, setS, s } = ctx;
  return (
    <div onClick={() => setS(p => ({ ...p, screen: 'home', points: p.points + 25, history: [] }))}
      style={{ cursor: 'pointer' }}>
      <BonusPopup theme={theme} soundOn={soundOn}/>
    </div>
  );
}

function LiveDemeritOverlay({ ctx }) {
  const { theme, soundOn, setS } = ctx;
  return (
    <div onClick={() => setS(p => ({ ...p, screen: 'home', points: Math.max(0, p.points - 10), history: [] }))}
      style={{ cursor: 'pointer' }}>
      <DemeritPopup theme={theme} soundOn={soundOn}/>
    </div>
  );
}

// ──────────────────────────────
// Parent dashboard (live, navigates into managers)
// ──────────────────────────────
function LiveParentDash({ ctx }) {
  const { theme, go, setS } = ctx;

  return (
    <Phone width={420} height={900} theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
              color: theme.primary, letterSpacing: 2, textTransform: 'uppercase' }}>PARENT MODE</div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 24, fontWeight: 700,
              color: theme.ink, lineHeight: 1.05, marginTop: 2 }}>Hi, Sarah 👋</div>
          </div>
          <button onClick={() => setS(p => ({ ...p, screen: 'profile', parentMode: false, history: [] }))}
            style={{
              appearance: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 12px', borderRadius: 999, background: theme.bgAlt,
              fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800, color: theme.ink,
            }}>← Back to kids</button>
        </div>
      </div>

      <div style={{ padding: '14px 22px 30px', overflowY: 'auto',
        height: 'calc(100% - 90px)' }}>

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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
          <ParentStat theme={theme} v="6" l="Tasks today" c={theme.primary}/>
          <ParentStat theme={theme} v="2/6" l="Done" c={theme.accent}/>
          <ParentStat theme={theme} v="12" l="Day streak" c={theme.warm} icon="🔥"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <ActBtn theme={theme} color={theme.accent}    icon="⊕"  t="New task"   onClick={() => go('parent_task')}/>
          <ActBtn theme={theme} color={theme.secondary} tc={theme.ink} icon="★" t="Rewards" onClick={() => go('parent_rewards')}/>
          <ActBtn theme={theme} color={theme.primary}   icon="🎉" t="Give bonus" onClick={() => go('parent_bonus')}/>
          <ActBtn theme={theme} color={theme.cool}      icon="◷"  t="Check-in"   onClick={() => go('parent_demerit')}/>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          margin: '18px 4px 8px' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 16, fontWeight: 700,
            color: theme.ink }}>Quick links</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LinkRow theme={theme} icon="👧" t="Manage kids · level config" onClick={() => go('parent_kids')}/>
          <LinkRow theme={theme} icon="📋" t="Edit tasks"     onClick={() => go('parent_task')}/>
          <LinkRow theme={theme} icon="🎁" t="Edit rewards"   onClick={() => go('parent_rewards')}/>
        </div>

        <SectionTitle theme={theme} title="Recent activity"/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { i: '✓', c: theme.accent, t: 'Completed Brush Teeth', s: '+5 pts · 8 min ago' },
            { i: '🎉',c: theme.primary,t: 'Bonus from Mom',        s: '+25 pts · 1 hr ago' },
            { i: '✓', c: theme.accent, t: 'Completed Make My Bed', s: '+5 pts · 2 hr ago' },
            { i: '◷', c: theme.cool,   t: 'Demerit · loud indoors',s: '−10 pts · yesterday' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999, background: a.c,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: TOK.font.display, fontWeight: 700, fontSize: 13,
              }}>{a.i}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700, color: theme.ink }}>{a.t}</div>
                <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700, color: theme.inkSoft }}>{a.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

function ActBtn({ icon, t, theme, color, tc, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 'none', cursor: 'pointer',
      background: color, color: tc || '#fff',
      borderRadius: TOK.radius.md, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 3px 0 rgba(42,45,95,0.18)', textAlign: 'left',
      fontFamily: 'inherit',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 8,
        background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>{icon}</div>
      <span style={{ fontFamily: TOK.font.display, fontSize: 14, fontWeight: 700 }}>{t}</span>
    </button>
  );
}

function LinkRow({ icon, t, theme, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 'none', cursor: 'pointer',
      background: theme.card, padding: '12px 14px',
      borderRadius: TOK.radius.md, boxShadow: '0 2px 0 rgba(42,45,95,0.08)',
      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
      fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ flex: 1, fontFamily: TOK.font.display, fontSize: 14,
        fontWeight: 700, color: theme.ink }}>{t}</span>
      <span style={{ color: theme.inkSoft }}>›</span>
    </button>
  );
}

// ──────────────────────────────
// Side panels (around the phone)
// ──────────────────────────────
const SCREEN_LABELS = {
  profile: 'Profile picker', home: 'Mission home',
  task_detail: 'Mission detail', celebration: 'Quest complete',
  selfie: 'Victory selfie', rewards: 'Rewards vault',
  redeem: 'Redeem confirm', redeemed: 'Reward claimed',
  streak: 'Streak page', badges: 'Trophy wall', levelup: 'Level up',
  bonus_popup: 'Bonus popup', demerit_popup: 'Check-in popup',
  parent_dash: 'Parent dashboard', parent_task: 'Create task',
  parent_rewards: 'Manage rewards', parent_kids: 'Manage kids',
  parent_bonus: 'Bonus composer', parent_demerit: 'Check-in composer',
};

function SideHints({ ctx }) {
  const { s, theme } = ctx;
  return (
    <div style={{ position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)',
      width: 260,
      display: 'flex', flexDirection: 'column', gap: 12, color: '#fff',
      fontFamily: TOK.font.body,
    }}>
      <div style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          textTransform: 'uppercase', opacity: 0.7 }}>You are on</div>
        <div style={{ fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700, marginTop: 4 }}>
          {SCREEN_LABELS[s.screen] || s.screen}
        </div>
      </div>

      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        fontSize: 12, lineHeight: 1.5, opacity: 0.8,
      }}>
        <div style={{ fontWeight: 800, marginBottom: 6, color: theme.secondary }}>👆 Try this:</div>
        <Hint screen={s.screen}/>
      </div>
    </div>
  );
}

function Hint({ screen }) {
  const tips = {
    profile: <>Tap <b>Emma</b> (or any kid) to enter the app.</>,
    home: <>Tap a <b>Ready!</b> mission — Reading or Feed the Dog.</>,
    task_detail: <>Tap the big <b>COMPLETE!</b> button.</>,
    celebration: <>Watch the points fly! Then tap <b>Keep going</b> or grab a <b>Victory selfie</b>.</>,
    selfie: <>Tap the shutter (or any tab below).</>,
    rewards: <>Tap a reward you can afford (highlighted).</>,
    redeem: <>Tap <b>Claim it!</b> to redeem.</>,
    redeemed: <>This auto-returns to the shop in a moment.</>,
    streak: <>Switch tabs at the bottom.</>,
    badges: <>Check out the Lv 5 upgrade card up top.</>,
    levelup: <>Tap anywhere to return home.</>,
    bonus_popup: <>Tap anywhere — the bonus gets added.</>,
    demerit_popup: <>Tap anywhere — calm, then home.</>,
    parent_dash: <>Try the quick-action grid: New task, Rewards, Give bonus, Check-in.</>,
    parent_task: <>This form mirrors the spec\u2019s task template + schedule.</>,
    parent_rewards: <>Toggles enable/disable any reward instantly.</>,
    parent_kids: <>Edit XP curve + level names down at the bottom.</>,
    parent_bonus: <>Notice the celebration toggles — bonus is meant to feel exciting.</>,
    parent_demerit: <>−20 cap & level-safe guardrails are baked in.</>,
  };
  return <>{tips[screen] || 'Explore!'}</>;
}

function SideControls({ ctx, tweak, setTweak }) {
  const { s, theme, back, reset, setS, go } = ctx;
  const isParent = s.parentMode;

  return (
    <div style={{
      position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)',
      width: 240,
      display: 'flex', flexDirection: 'column', gap: 10,
      fontFamily: TOK.font.body, color: '#fff',
    }}>
      <div style={{
        padding: '10px 12px', borderRadius: 12,
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          textTransform: 'uppercase', opacity: 0.7 }}>Viewing as</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, padding: 3,
          background: 'rgba(0,0,0,0.3)', borderRadius: 999 }}>
          {['child', 'parent'].map(role => {
            const on = (role === 'parent') === isParent;
            return (
              <button key={role}
                onClick={() => setTweak('audience', role)}
                style={{
                  flex: 1, appearance: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 999,
                  background: on ? theme.primary : 'transparent',
                  color: on ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
                  textTransform: 'capitalize',
                }}>{role}</button>
            );
          })}
        </div>
      </div>

      <CtrlBtn onClick={back} disabled={!s.history.length}>↶ Back</CtrlBtn>
      <CtrlBtn onClick={reset}>↻ Reset prototype</CtrlBtn>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}/>

      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
        textTransform: 'uppercase', opacity: 0.5, padding: '0 4px' }}>Jump to</div>

      {isParent ? (
        <>
          <CtrlBtn onClick={() => setS(p => ({ ...p, screen: 'parent_dash', history: [] }))}>Dashboard</CtrlBtn>
          <CtrlBtn onClick={() => go('parent_task')}>Create task</CtrlBtn>
          <CtrlBtn onClick={() => go('parent_rewards')}>Manage rewards</CtrlBtn>
          <CtrlBtn onClick={() => go('parent_kids')}>Manage kids</CtrlBtn>
          <CtrlBtn onClick={() => go('parent_bonus')}>Give bonus</CtrlBtn>
          <CtrlBtn onClick={() => go('parent_demerit')}>Add check-in</CtrlBtn>
        </>
      ) : (
        <>
          <CtrlBtn onClick={() => setS(p => ({ ...p, screen: 'profile', history: [] }))}>Profile picker</CtrlBtn>
          <CtrlBtn onClick={() => setS(p => ({ ...p, screen: 'home', history: [] }))}>Mission home</CtrlBtn>
          <CtrlBtn onClick={() => setS(p => ({ ...p, screen: 'rewards', history: [] }))}>Rewards</CtrlBtn>
          <CtrlBtn onClick={() => setS(p => ({ ...p, screen: 'streak', history: [] }))}>Streak</CtrlBtn>
          <CtrlBtn onClick={() => setS(p => ({ ...p, screen: 'badges', history: [] }))}>Trophies</CtrlBtn>
          <CtrlBtn onClick={() => go('bonus_popup')}>💥 Bonus popup</CtrlBtn>
          <CtrlBtn onClick={() => go('demerit_popup')}>○ Check-in popup</CtrlBtn>
          <CtrlBtn onClick={() => go('levelup')}>⬆ Level up</CtrlBtn>
        </>
      )}
    </div>
  );
}

function CtrlBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      padding: '8px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.06)',
      color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
      textAlign: 'left', opacity: disabled ? 0.4 : 1,
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'background 120ms',
    }}
    onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
      {children}
    </button>
  );
}

window.LiveRewards = LiveRewards;
window.LiveRedeem = LiveRedeem;
window.LiveRedeemed = LiveRedeemed;
window.LiveStreak = LiveStreak;
window.LiveBadges = LiveBadges;
window.LiveLevelUp = LiveLevelUp;
window.LiveBonusOverlay = LiveBonusOverlay;
window.LiveDemeritOverlay = LiveDemeritOverlay;
window.LiveParentDash = LiveParentDash;
window.SideHints = SideHints;
window.SideControls = SideControls;
window.CtrlBtn = CtrlBtn;
