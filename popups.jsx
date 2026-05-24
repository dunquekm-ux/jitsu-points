// Popups: bonus, demerit, level up — full-screen overlays on the phone

// ─────────────────────────────────────────────────────────────
// 10. Bonus popup — EXCITING
// ─────────────────────────────────────────────────────────────
function BonusPopup({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      {/* Dimmed background (a faint home behind) */}
      <DimBg theme={theme}/>

      {/* Confetti */}
      <Confetti colors={[theme.secondary, theme.accent, theme.cool, '#fff', theme.warm]} count={20}/>

      {/* Modal */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card color={theme.card} style={{
          width: '100%', padding: '28px 22px 22px', textAlign: 'center',
          position: 'relative', overflow: 'visible',
        }}>
          {/* Floating mascot */}
          <div style={{ position: 'absolute', top: -50, left: '50%',
            transform: 'translateX(-50%)' }}>
            <Jitsu size={110} mood="cheer" color={theme.secondary} accent={theme.primary}/>
          </div>

          <div style={{ marginTop: 60, fontFamily: TOK.font.display, fontSize: 14,
            fontWeight: 800, color: theme.primary, letterSpacing: 2.5,
            textTransform: 'uppercase' }}>SURPRISE BONUS!</div>

          <div style={{ fontFamily: TOK.font.display, fontSize: 56, fontWeight: 700,
            color: theme.ink, lineHeight: 1, marginTop: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            +25
            <Sparkle size={32} color={theme.secondary}/>
          </div>

          <div style={{
            marginTop: 8, padding: '10px 14px',
            background: theme.bgAlt, borderRadius: TOK.radius.md,
            fontFamily: TOK.font.body, fontSize: 14, fontWeight: 700,
            color: theme.ink, fontStyle: 'italic',
          }}>
            &ldquo;You helped your brother pick up his toys without being asked!&rdquo;
            <div style={{ fontStyle: 'normal', fontSize: 11, fontWeight: 800,
              color: theme.inkSoft, marginTop: 4 }}>— from Mom</div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center',
            justifyContent: 'center', marginTop: 16 }}>
            <PointsPill points={25} color={theme.secondary} size="md"/>
            <span style={{ fontFamily: TOK.font.display, fontSize: 18, fontWeight: 700,
              color: theme.inkSoft }}>→</span>
            <span style={{ padding: '6px 12px', borderRadius: 999,
              background: theme.primary, color: '#fff',
              fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
            }}>275 total</span>
          </div>

          <div style={{ marginTop: 18 }}>
            <ChunkyButton fullWidth color={theme.primary} size="md">
              🎉 Awesome!
            </ChunkyButton>
          </div>
        </Card>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. Demerit popup — CALM
// ─────────────────────────────────────────────────────────────
function DemeritPopup({ theme, soundOn }) {
  return (
    <Phone theme={theme}>
      <DimBg theme={theme}/>

      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card color={theme.card} style={{
          width: '100%', padding: '28px 22px 22px', textAlign: 'center',
          position: 'relative', overflow: 'visible',
        }}>
          <div style={{ position: 'absolute', top: -50, left: '50%',
            transform: 'translateX(-50%)' }}>
            <Jitsu size={110} mood="calm" color={theme.cool} accent={theme.cool}/>
          </div>

          <div style={{ marginTop: 60, fontFamily: TOK.font.display, fontSize: 14,
            fontWeight: 800, color: theme.cool, letterSpacing: 2,
            textTransform: 'uppercase' }}>Quick check-in</div>

          <div style={{ fontFamily: TOK.font.display, fontSize: 22, fontWeight: 700,
            color: theme.ink, lineHeight: 1.15, marginTop: 10, padding: '0 8px' }}>
            Let&rsquo;s try better next time, Emma.
          </div>

          <div style={{
            marginTop: 14, padding: '12px 14px',
            background: theme.bg, borderRadius: TOK.radius.md,
            fontFamily: TOK.font.body, fontSize: 13, fontWeight: 600,
            color: theme.ink, textAlign: 'left',
          }}>
            <div style={{ fontFamily: TOK.font.body, fontSize: 10, fontWeight: 800,
              color: theme.inkSoft, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              From Dad
            </div>
            <div style={{ marginTop: 4 }}>
              &ldquo;We talked about quiet voices indoors. Tomorrow&rsquo;s a fresh start.&rdquo;
            </div>
          </div>

          <div style={{
            marginTop: 14, padding: '10px 12px',
            background: theme.bgAlt, borderRadius: TOK.radius.md,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: TOK.font.body, fontSize: 12, fontWeight: 700,
              color: theme.ink }}>Points adjusted</div>
            <div style={{ fontFamily: TOK.font.display, fontSize: 15, fontWeight: 700,
              color: theme.ink }}>
              −10 <span style={{ color: theme.inkSoft, fontSize: 12 }}>(level safe ★)</span>
            </div>
          </div>

          <div style={{ marginTop: 10, fontFamily: TOK.font.body, fontSize: 11,
            fontWeight: 700, color: theme.inkSoft, lineHeight: 1.4 }}>
            Your level and badges never go down. You&rsquo;ve got this. 💪
          </div>

          <div style={{ marginTop: 16 }}>
            <ChunkyButton fullWidth color={theme.cool} size="md">
              Okay, got it
            </ChunkyButton>
          </div>
        </Card>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. Level up moment
// ─────────────────────────────────────────────────────────────
function LevelUp({ theme, soundOn }) {
  return (
    <Phone theme={theme} bg={theme.cool}>
      <Confetti colors={[theme.secondary, '#fff', theme.primary, theme.accent]} count={26}/>

      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', textAlign: 'center', padding: '40px 28px' }}>

        <div style={{ fontFamily: TOK.font.display, fontSize: 13, fontWeight: 800,
          letterSpacing: 4, opacity: 0.9 }}>LEVEL UP</div>

        <div style={{ position: 'relative', marginTop: 16 }}>
          <div style={{ width: 180, height: 180, borderRadius: 999, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: theme.cool, fontFamily: TOK.font.display, fontWeight: 700,
            fontSize: 100, lineHeight: 1,
            boxShadow: '0 12px 0 rgba(0,0,0,0.18), inset 0 -10px 0 rgba(0,0,0,0.06)',
          }}>5</div>
          <div style={{ position: 'absolute', top: -10, right: -10 }}>
            <Sparkle size={36} color={theme.secondary}/>
          </div>
          <div style={{ position: 'absolute', bottom: -10, left: -16 }}>
            <Sparkle size={24} color="#fff"/>
          </div>
        </div>

        <div style={{ fontFamily: TOK.font.display, fontSize: 32, fontWeight: 700,
          marginTop: 22, lineHeight: 1 }}>Sky Scout</div>
        <div style={{ fontFamily: TOK.font.body, fontSize: 14, fontWeight: 700,
          marginTop: 6, opacity: 0.95 }}>
          You unlocked the <b>Lift-off!</b> badge 🚀
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <div style={{
            padding: '10px 14px', borderRadius: TOK.radius.md,
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800,
          }}>+50 BONUS</div>
          <div style={{
            padding: '10px 14px', borderRadius: TOK.radius.md,
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            fontFamily: TOK.font.body, fontSize: 12, fontWeight: 800,
          }}>NEW BADGE</div>
        </div>

        <div style={{ marginTop: 28 }}>
          <ChunkyButton color={theme.secondary} textColor={theme.ink} size="lg">
            Continue
          </ChunkyButton>
        </div>
      </div>
      <SoundBadgeFloater on={soundOn}/>
    </Phone>
  );
}

// Dimmed home background — used behind modals
function DimBg({ theme }) {
  return (
    <div style={{ position: 'absolute', inset: 0,
      background: theme.bg, filter: 'blur(4px) brightness(0.7)', opacity: 0.9 }}>
      <div style={{ position: 'absolute', inset: 'auto 24px 80px',
        height: 200, borderRadius: TOK.radius.lg, background: theme.primary, opacity: 0.5 }}/>
      <div style={{ position: 'absolute', inset: '120px 24px auto',
        height: 100, borderRadius: TOK.radius.lg, background: theme.card, opacity: 0.6 }}/>
    </div>
  );
}

window.BonusPopup = BonusPopup;
window.DemeritPopup = DemeritPopup;
window.LevelUp = LevelUp;
