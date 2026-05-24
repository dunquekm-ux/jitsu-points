// Rewards shop, Redeem confirm, Streak page, Achievements, Selfie capture

// ─────────────────────────────────────────────────────────────
// 5. Rewards Shop
// ─────────────────────────────────────────────────────────────
function RewardsShop({ theme, soundOn }) {
  const rewards = [
    { id: 'r1', title: 'Ice Cream', cost: 100, icon: '🍦', color: theme.primary, can: true },
    { id: 'r2', title: 'Movie Night', cost: 200, icon: '🎬', color: theme.cool, can: true },
    { id: 'r3', title: 'New Lego Set', cost: 500, icon: '🧱', color: theme.warm, can: false },
    { id: 'r4', title: 'Pizza Friday', cost: 150, icon: '🍕', color: theme.accent, can: true },
    { id: 'r5', title: 'Bowling Trip', cost: 600, icon: '🎳', color: theme.secondary, can: false, costColor: theme.ink },
    { id: 'r6', title: 'Sleepover', cost: 800, icon: '🏕️', color: '#9B4DCA', can: false },
  ];

  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 26, fontWeight: 700,
            color: theme.ink }}>Rewards Vault</div>
          <SoundBadge on={soundOn} label="sfx"/>
        </div>

        {/* Balance card */}
        <Card color={theme.card} style={{
          marginTop: 10, padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `2px solid ${theme.secondary}`,
        }}>
          <div>
            <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
              color: theme.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>You can spend</div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 30, fontWeight: 700,
              color: theme.ink, lineHeight: 1, marginTop: 3 }}>250 pts</div>
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
          {rewards.map(r => (
            <RewardCard key={r.id} reward={r} theme={theme}/>
          ))}
        </div>
      </div>

      <TabBar active="rewards" theme={theme}/>
    </Phone>
  );
}

function RewardCard({ reward, theme }) {
  return (
    <div style={{
      background: theme.card, borderRadius: TOK.radius.lg,
      padding: 12, boxShadow: '0 2px 0 rgba(42,45,95,0.10)',
      opacity: reward.can ? 1 : 0.55, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', aspectRatio: '1 / 1',
        borderRadius: TOK.radius.md, background: reward.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.12)',
      }}>{reward.icon}</div>
      <div style={{
        fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
        color: theme.ink, marginTop: 8,
      }}>{reward.title}</div>
      <div style={{
        marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 999,
        background: reward.can ? theme.secondary : theme.line,
        color: reward.can ? theme.ink : theme.inkSoft,
        fontFamily: TOK.font.display, fontSize: 13, fontWeight: 700,
      }}>
        <Sparkle size={11} color={reward.can ? theme.warm : theme.inkSoft}/>
        {reward.cost}
      </div>
      {!reward.can && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: '#fff', borderRadius: 999,
          padding: '3px 8px', fontFamily: TOK.font.body,
          fontSize: 10, fontWeight: 800, color: theme.inkSoft,
          boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
        }}>NEED {reward.cost - 250} MORE</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. Redeem confirmation
// ─────────────────────────────────────────────────────────────
function RedeemConfirm({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px 6px 8px', borderRadius: 999,
          background: theme.card, fontFamily: TOK.font.body, fontWeight: 700,
          fontSize: 13, color: theme.ink, boxShadow: '0 2px 0 rgba(42,45,95,0.10)',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span> Rewards
        </div>
      </div>

      <div style={{ padding: '24px 22px' }}>
        <Card color={theme.card} style={{ padding: 20, textAlign: 'center' }}>
          <div style={{
            width: 110, height: 110, borderRadius: TOK.radius.lg, margin: '0 auto',
            background: theme.cool, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 56,
            boxShadow: 'inset 0 -8px 0 rgba(0,0,0,0.12)',
          }}>🎬</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 26, fontWeight: 700,
            color: theme.ink, marginTop: 14 }}>Movie Night</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 14, fontWeight: 600,
            color: theme.inkSoft, marginTop: 4 }}>
            Friday night — popcorn included 🍿
          </div>

          <div style={{
            marginTop: 16, padding: 14, borderRadius: TOK.radius.md,
            background: theme.bgAlt, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <Line theme={theme} l="Cost"             r="-200 pts" rColor={theme.primary}/>
            <Line theme={theme} l="My points now"    r="250"/>
            <div style={{ borderTop: `1px dashed ${theme.line}` }}/>
            <Line theme={theme} l="After redeeming"  r="50 pts" rColor={theme.ink} bold/>
          </div>

          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: TOK.radius.md,
            background: theme.bg, fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
            color: theme.inkSoft }}>
            ✨ Lifetime XP won&rsquo;t change — your level is safe.
          </div>
        </Card>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <ChunkyButton color={theme.bgAlt} textColor={theme.ink} size="md" style={{ flex: 1 }}>
            Not yet
          </ChunkyButton>
          <ChunkyButton color={theme.primary} size="md" style={{ flex: 1.4 }}>
            🎉 Claim it!
          </ChunkyButton>
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

function Line({ l, r, theme, rColor, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
        color: theme.inkSoft }}>{l}</span>
      <span style={{ fontFamily: TOK.font.display, fontSize: bold ? 18 : 15,
        fontWeight: 700, color: rColor || theme.ink }}>{r}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. Streak page
// ─────────────────────────────────────────────────────────────
function StreakPage({ theme, soundOn }) {
  const days = ['M','T','W','T','F','S','S'];
  const done = [true, true, true, true, true, true, false]; // today is Sunday-not-done
  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 26, fontWeight: 700,
            color: theme.ink }}>My Streak</div>
          <SoundBadge on={soundOn} label="sfx"/>
        </div>
      </div>

      <div style={{ padding: '14px 22px 110px', overflowY: 'auto', maxHeight: 600 }}>
        <Card color={theme.warm} style={{
          padding: '24px 18px', textAlign: 'center', color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 76, lineHeight: 1 }}>🔥</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 56, fontWeight: 700,
            lineHeight: 1, marginTop: 6 }}>12</div>
          <div style={{ fontFamily: TOK.font.display, fontSize: 16, fontWeight: 700,
            marginTop: 4, letterSpacing: 1 }}>DAY STREAK!</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 13, fontWeight: 700,
            marginTop: 10, opacity: 0.95, padding: '8px 12px',
            background: 'rgba(255,255,255,0.2)', borderRadius: 999,
            display: 'inline-block', backdropFilter: 'blur(8px)' }}>
            ⏰ 2 missions left to keep it going
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          marginTop: 16, padding: 12, background: theme.card,
          borderRadius: TOK.radius.lg, boxShadow: '0 2px 0 rgba(42,45,95,0.10)' }}>
          {days.map((d, i) => {
            const isDone = done[i];
            const isToday = i === 6;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 999,
                  background: isDone ? theme.accent : (isToday ? theme.bgAlt : theme.bg),
                  border: isToday ? `2px dashed ${theme.warm}` : 'none',
                  color: isDone ? '#fff' : theme.inkSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: TOK.font.display, fontWeight: 700, fontSize: 13,
                }}>
                  {isDone ? '✓' : (isToday ? '◆' : '·')}
                </div>
                <span style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
                  color: isToday ? theme.warm : theme.inkSoft }}>{d}</span>
              </div>
            );
          })}
        </div>

        {/* Personal bests */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <StatTile theme={theme} v="14" l="Longest ever" c={theme.warm}/>
          <StatTile theme={theme} v="62" l="Total streak days" c={theme.cool}/>
        </div>

        <div style={{ marginTop: 18, padding: 14, borderRadius: TOK.radius.lg,
          background: theme.bgAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Jitsu size={56} mood="cheer" color={theme.secondary} accent={theme.primary}/>
            <div>
              <div style={{ fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
                color: theme.ink }}>You&rsquo;re unstoppable!</div>
              <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
                color: theme.inkSoft }}>Finish today&rsquo;s missions to hit Day 13.</div>
            </div>
          </div>
        </div>
      </div>

      <TabBar active="streak" theme={theme}/>
    </Phone>
  );
}

function StatTile({ v, l, c, theme }) {
  return (
    <div style={{ background: theme.card, padding: '12px 14px',
      borderRadius: TOK.radius.lg, boxShadow: '0 2px 0 rgba(42,45,95,0.10)' }}>
      <div style={{ fontFamily: TOK.font.display, fontSize: 26, fontWeight: 700,
        color: c }}>{v}</div>
      <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 800,
        color: theme.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. Achievements grid (with level-up moment)
// ─────────────────────────────────────────────────────────────
function Achievements({ theme, soundOn }) {
  const badges = [
    { icon: '🌅', name: 'Early Bird',    earned: true,  d: '5 morning missions' },
    { icon: '📚', name: 'Bookworm',      earned: true,  d: 'Read 10 days' },
    { icon: '🦷', name: 'Toothpaste Boss', earned: true, d: '30 brushings' },
    { icon: '🏆', name: 'Quest Champ',   earned: true,  d: '50 missions' },
    { icon: '🔥', name: 'On Fire',       earned: true,  d: '10-day streak' },
    { icon: '⭐', name: 'Star Saver',    earned: false, d: '500 pts saved' },
    { icon: '🌙', name: 'Night Owl',     earned: false, d: '7 evening missions' },
    { icon: '🚀', name: 'Lift-off!',     earned: false, d: 'Reach Lv 10' },
    { icon: '💎', name: 'Diamond Kid',   earned: false, d: '100 missions' },
  ];

  return (
    <Phone theme={theme}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 26, fontWeight: 700,
            color: theme.ink }}>Trophy Wall</div>
          <SoundBadge on={soundOn} label="sfx"/>
        </div>

        {/* Level up highlight */}
        <Card color={theme.cool} style={{
          marginTop: 12, padding: 14, color: '#fff', display: 'flex',
          alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 999, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, color: theme.cool, flexShrink: 0,
            boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.12)' }}>4</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOK.font.body, fontSize: 10, fontWeight: 800,
              letterSpacing: 1.5, opacity: 0.9, textTransform: 'uppercase' }}>LEVEL UP NEXT</div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              Mission Cadet → Sky Scout
            </div>
            <div style={{ height: 8, marginTop: 8, background: 'rgba(255,255,255,0.25)',
              borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '80%', height: '100%', background: theme.secondary, borderRadius: 999 }}/>
            </div>
            <div style={{ fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
              opacity: 0.95, marginTop: 4 }}>300 XP to next level</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '16px 22px 110px', overflowY: 'auto', maxHeight: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          margin: '4px 4px 10px' }}>
          <div style={{ fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700,
            color: theme.ink }}>Badges</div>
          <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800,
            color: theme.accent }}>5 / 9</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {badges.map((b, i) => (
            <div key={i} style={{
              background: theme.card, borderRadius: TOK.radius.md, padding: 8,
              textAlign: 'center',
              boxShadow: '0 2px 0 rgba(42,45,95,0.08)',
              opacity: b.earned ? 1 : 0.45,
            }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: TOK.radius.sm,
                background: b.earned ? theme.bgAlt : theme.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, filter: b.earned ? 'none' : 'grayscale(0.8)',
              }}>{b.icon}</div>
              <div style={{ fontFamily: TOK.font.display, fontSize: 11, fontWeight: 700,
                color: theme.ink, marginTop: 4, lineHeight: 1.15 }}>{b.name}</div>
            </div>
          ))}
        </div>
      </div>

      <TabBar active="me" theme={theme}/>
    </Phone>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. Selfie capture
// ─────────────────────────────────────────────────────────────
function SelfieCapture({ theme, soundOn }) {
  return (
    <Phone theme={theme} bg="#0a0518">
      {/* Camera viewfinder */}
      <div style={{ position: 'absolute', inset: 56, top: 56, bottom: 110,
        margin: '20px 22px', borderRadius: TOK.radius.xl, overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.cool}, ${theme.primary})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Placeholder camera silhouette */}
        <div style={{ width: 160, height: 160, borderRadius: 999,
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(20px)' }}>
          <span style={{ fontSize: 70 }}>📸</span>
        </div>

        {/* Frame corners */}
        {[['top:14;left:14','tl'],['top:14;right:14','tr'],['bottom:14;left:14','bl'],['bottom:14;right:14','br']].map(([pos, k]) => {
          const obj = Object.fromEntries(pos.split(';').map(s => s.split(':').map(x => x.trim())));
          return <div key={k} style={{ position:'absolute', ...obj, width:24, height:24,
            borderColor:'#fff', borderStyle:'solid', borderWidth: 0,
            borderTopWidth: k.startsWith('t') ? 3 : 0,
            borderBottomWidth: k.startsWith('b') ? 3 : 0,
            borderLeftWidth: k.endsWith('l') ? 3 : 0,
            borderRightWidth: k.endsWith('r') ? 3 : 0,
            borderTopLeftRadius: k === 'tl' ? 8 : 0,
            borderTopRightRadius: k === 'tr' ? 8 : 0,
            borderBottomLeftRadius: k === 'bl' ? 8 : 0,
            borderBottomRightRadius: k === 'br' ? 8 : 0,
          }}/>;
        })}

        {/* Caption chip top */}
        <div style={{ position: 'absolute', top: 14, left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
          color: '#fff', fontFamily: TOK.font.display, fontWeight: 700, fontSize: 12,
          letterSpacing: 0.6,
        }}>VICTORY SELFIE 📷</div>

        {/* Bottom info */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14,
          padding: '8px 12px', borderRadius: TOK.radius.md,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
          color: '#fff', fontFamily: TOK.font.body, fontSize: 11, fontWeight: 700,
        }}>
          🔒 Stored on your device · auto-delete in 24h
        </div>
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <div style={{ width: 50, height: 50, borderRadius: 999,
          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#fff' }}>↺</div>
        <div style={{
          width: 78, height: 78, borderRadius: 999, background: '#fff',
          boxShadow: '0 0 0 4px rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: theme.primary }}/>
        </div>
        <div style={{ width: 50, height: 50, borderRadius: 999,
          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#fff' }}>✕</div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

window.RewardsShop = RewardsShop;
window.RedeemConfirm = RedeemConfirm;
window.StreakPage = StreakPage;
window.Achievements = Achievements;
window.SelfieCapture = SelfieCapture;
