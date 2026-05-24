// Live interactive prototype — single phone frame, real navigation between screens.
// Reuses tokens/mascot/primitives. Screens are written stateful here so taps actually flow.

const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────
// App state + router
// ─────────────────────────────────────────────────────────────
function makeInitialState() {
  return {
    screen: 'profile',           // route
    history: [],                 // navigation stack
    kidId: null,
    points: 250,
    xp: 1200,
    level: 4,
    streak: 12,
    parentMode: false,
    activeTask: null,
    activeReward: null,
    lastEarned: 0,
    pendingPopup: null,          // 'bonus' | 'demerit' | 'levelup' | null
    tasks: [
      { id: 't1', title: 'Brush Teeth',     window: 'Morning', pts: 5,  state: 'done',      icon: '🦷' },
      { id: 't2', title: 'Make My Bed',     window: 'Morning', pts: 5,  state: 'done',      icon: '🛏️' },
      { id: 't3', title: 'Reading 20 min',  window: 'Anytime', pts: 15, state: 'available', icon: '📖' },
      { id: 't4', title: 'Feed the Dog',    window: 'Evening', pts: 10, state: 'available', icon: '🐶' },
      { id: 't5', title: 'Brush Teeth',     window: 'Evening', pts: 5,  state: 'locked',    icon: '🦷' },
      { id: 't6', title: 'Tidy My Room',    window: 'Evening', pts: 20, state: 'locked',    icon: '🧸' },
    ],
    rewards: [
      { id: 'r1', title: 'Ice Cream',     cost: 100, icon: '🍦', color: '__primary' },
      { id: 'r2', title: 'Movie Night',   cost: 200, icon: '🎬', color: '__cool'    },
      { id: 'r3', title: 'New Lego Set',  cost: 500, icon: '🧱', color: '__warm'    },
      { id: 'r4', title: 'Pizza Friday',  cost: 150, icon: '🍕', color: '__accent'  },
      { id: 'r5', title: 'Bowling Trip',  cost: 600, icon: '🎳', color: '__secondary'},
      { id: 'r6', title: 'Sleepover',     cost: 800, icon: '🏕️', color: '__purple'  },
    ],
  };
}

function LivePrototype() {
  const [t, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "themeId": "candy",
    "soundOn": true,
    "audience": "child"
  }/*EDITMODE-END*/);

  const theme = THEMES[t.themeId] || THEMES.candy;
  const soundOn = !!t.soundOn;

  const [s, setS] = useState(makeInitialState);

  // ─── nav helpers ───
  const go = (screen, patch = {}) => setS(p => ({
    ...p,
    history: [...p.history, p.screen],
    screen,
    ...patch,
  }));
  const back = () => setS(p => {
    if (!p.history.length) return p;
    const h = p.history.slice(0, -1);
    return { ...p, history: h, screen: p.history[p.history.length - 1] };
  });
  const reset = () => setS(makeInitialState());

  // ─── actions ───
  const completeTask = (taskId) => setS(p => {
    const task = p.tasks.find(x => x.id === taskId);
    if (!task || task.state !== 'available') return p;
    const newPoints = p.points + task.pts;
    const newXp = p.xp + task.pts;
    const newLevel = newXp >= 1500 ? 5 : p.level;
    return {
      ...p,
      tasks: p.tasks.map(x => x.id === taskId ? { ...x, state: 'done' } : x),
      points: newPoints,
      xp: newXp,
      level: newLevel,
      lastEarned: task.pts,
      pendingPopup: newLevel > p.level ? 'levelup' : null,
      screen: 'celebration',
      history: [...p.history, p.screen],
    };
  });
  const redeemReward = (rewardId) => setS(p => {
    const r = p.rewards.find(x => x.id === rewardId);
    if (!r || p.points < r.cost) return p;
    return {
      ...p,
      points: p.points - r.cost,
      screen: 'redeemed',
      history: [...p.history, p.screen],
      activeReward: r,
    };
  });

  // Audience switch (kid ↔ parent) maps to root screen
  useEffect(() => {
    if (t.audience === 'parent' && !s.parentMode) {
      setS(p => ({ ...p, parentMode: true, screen: 'parent_dash', history: [] }));
    } else if (t.audience === 'child' && s.parentMode) {
      setS(p => ({ ...p, parentMode: false, screen: 'profile', history: [] }));
    }
  }, [t.audience]);

  const ctx = { s, setS, theme, soundOn, go, back, reset, completeTask, redeemReward };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', background: '#1a1430',
      fontFamily: TOK.font.body,
      backgroundImage: `radial-gradient(circle at 20% 20%, ${theme.primary}22, transparent 50%), radial-gradient(circle at 80% 80%, ${theme.cool}22, transparent 50%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', overflow: 'auto',
    }}>
      {/* Left: nav hints */}
      <SideHints ctx={ctx} />

      {/* Center: phone */}
      <div style={{ position: 'relative' }}>
        <Screen ctx={ctx}/>
      </div>

      {/* Right: prototype controls */}
      <SideControls ctx={ctx} tweak={t} setTweak={setTweak}/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Audience"/>
        <TweakRadio
          label="View as"
          value={t.audience}
          options={['child', 'parent']}
          onChange={(v) => setTweak('audience', v)}
        />
        <TweakSection label="Look"/>
        <TweakColor
          label="Color theme"
          value={[theme.primary, theme.secondary, theme.accent]}
          options={Object.entries(THEMES).map(([id, th]) => [th.primary, th.secondary, th.accent])}
          onChange={(val) => {
            const id = Object.keys(THEMES).find(k => THEMES[k].primary === val[0]) || 'candy';
            setTweak('themeId', id);
          }}
        />
        <div style={{ padding: '4px', display: 'flex', gap: 6, flexWrap: 'wrap',
          fontSize: 10, fontWeight: 700, color: 'rgba(41,38,27,.55)' }}>
          {Object.entries(THEMES).map(([id, th]) => (
            <span key={id} style={{
              padding: '3px 7px', borderRadius: 999,
              background: id === t.themeId ? th.primary : 'rgba(0,0,0,.05)',
              color: id === t.themeId ? '#fff' : 'rgba(41,38,27,.55)',
            }}>{th.name}</span>
          ))}
        </div>
        <TweakSection label="Audio"/>
        <TweakToggle label="Sound badges" value={soundOn} onChange={(v) => setTweak('soundOn', v)}/>
        <TweakSection label="Demo"/>
        <TweakButton label="Trigger bonus popup" onClick={() => go('bonus_popup')}/>
        <TweakButton label="Trigger demerit popup" onClick={() => go('demerit_popup')}/>
        <TweakButton label="Trigger level up" onClick={() => go('levelup')}/>
        <TweakButton label="Reset everything" onClick={reset}/>
      </TweaksPanel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen router
// ─────────────────────────────────────────────────────────────
function Screen({ ctx }) {
  const map = {
    profile:        <LiveProfile ctx={ctx}/>,
    home:           <LiveHome ctx={ctx}/>,
    task_detail:    <LiveTaskDetail ctx={ctx}/>,
    celebration:    <LiveCelebration ctx={ctx}/>,
    selfie:         <SelfieCapture theme={ctx.theme} soundOn={ctx.soundOn}/>,
    rewards:        <LiveRewards ctx={ctx}/>,
    redeem:         <LiveRedeem ctx={ctx}/>,
    redeemed:       <LiveRedeemed ctx={ctx}/>,
    streak:         <LiveStreak ctx={ctx}/>,
    badges:         <LiveBadges ctx={ctx}/>,
    levelup:        <LiveLevelUp ctx={ctx}/>,
    bonus_popup:    <LiveBonusOverlay ctx={ctx}/>,
    demerit_popup:  <LiveDemeritOverlay ctx={ctx}/>,
    // parent
    parent_dash:    <LiveParentDash ctx={ctx}/>,
    parent_task:    <CreateTask theme={ctx.theme} soundOn={ctx.soundOn}/>,
    parent_rewards: <ManageRewards theme={ctx.theme} soundOn={ctx.soundOn}/>,
    parent_kids:    <ManageKids theme={ctx.theme} soundOn={ctx.soundOn}/>,
    parent_bonus:   <BonusComposer theme={ctx.theme} soundOn={ctx.soundOn}/>,
    parent_demerit: <DemeritComposer theme={ctx.theme} soundOn={ctx.soundOn}/>,
  };
  return map[ctx.s.screen] || <LiveHome ctx={ctx}/>;
}

window.LivePrototype = LivePrototype;
