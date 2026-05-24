import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar, { AVATAR_CONFIG } from '../../shared/components/Avatar';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore } from '../../core/store/appStore';
import { useAuthStore } from '../../core/auth/store';
import { loadGIS, signIn } from '../../core/auth/gis';
import type { AvatarId } from '../../domain';
import styles from './FamilySetup.module.css';

const AVATARS = Object.keys(AVATAR_CONFIG) as AvatarId[];
const HAS_AUTH = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

type Step = 'auth' | 'details' | 'done';

export default function FamilySetup() {
  const navigate = useNavigate();
  const { initFamily } = useAppStore();
  const { setTokens } = useAuthStore();

  const [step, setStep] = useState<Step>(HAS_AUTH ? 'auth' : 'details');
  const [accessToken, setAccessToken] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState<AvatarId>('speed_hero');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── Step 1: Google sign-in ────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    setAuthError('');
    setSaving(true);
    try {
      await loadGIS();
      const tokens = await signIn();
      setTokens(tokens);
      setAccessToken(tokens.accessToken);
      setStep('details');
    } catch (err) {
      setAuthError('Sign-in failed or cancelled. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // ── Step 2: Create family ─────────────────────────────────────────────────

  async function handleCreate() {
    if (!familyName.trim() || !childName.trim()) return;
    setSaving(true);
    try {
      const code = await initFamily(familyName.trim(), childName.trim(), childAvatar, accessToken);
      setJoinCode(code);
      setStep('done');
    } catch (err) {
      console.error('[FamilySetup] initFamily failed', err);
    } finally {
      setSaving(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(joinCode).catch(() => {});
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={() => navigate('/welcome')}>
        ← Back
      </button>

      {/* Step indicator */}
      {(() => {
        const ALL: Step[] = HAS_AUTH ? ['auth', 'details', 'done'] : ['details', 'done'];
        const idx = ALL.indexOf(step);
        return (
          <div className={styles.steps}>
            {ALL.map((s, i) => (
              <div
                key={s}
                className={[
                  styles.dot,
                  i === idx ? styles.dotActive : i < idx ? styles.dotDone : '',
                ].join(' ')}
              />
            ))}
          </div>
        );
      })()}

      {/* ── Auth step ────────────────────────────────────────────────────── */}
      {step === 'auth' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>☁️</span>
          <h1 className={styles.cardTitle}>Connect Google Drive</h1>
          <p className={styles.cardBody}>
            Jitsu Points stores your family data in your own Google Drive — free, private, and works
            across all your devices.
          </p>
          <p className={styles.cardBody}>You only sign in once. Children never need to sign in.</p>
          {authError && <p className={styles.error}>{authError}</p>}
          <ChunkyButton
            variant="primary"
            size="lg"
            fullWidth
            disabled={saving}
            onClick={handleGoogleSignIn}
          >
            {saving ? 'Opening Google…' : '🔑 Sign in with Google'}
          </ChunkyButton>
          <button className={styles.skipLink} onClick={() => setStep('details')}>
            Skip for now (local only — no cloud sync)
          </button>
        </div>
      )}

      {/* ── Details step ─────────────────────────────────────────────────── */}
      {step === 'details' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>🏠</span>
          <h1 className={styles.cardTitle}>Set up your family</h1>

          <div className={styles.field}>
            <label className={styles.label}>Family name</label>
            <input
              className={styles.input}
              placeholder="e.g. The Smiths"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              maxLength={30}
              autoFocus
            />
          </div>

          <div className={styles.divider} />

          <p className={styles.sectionHead}>👶 First child</p>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              placeholder="e.g. Emma"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Avatar</label>
            <div className={styles.avatarGrid}>
              {AVATARS.map((id) => (
                <button
                  key={id}
                  className={[
                    styles.avatarBtn,
                    childAvatar === id ? styles.avatarSelected : '',
                  ].join(' ')}
                  onClick={() => setChildAvatar(id)}
                  aria-label={AVATAR_CONFIG[id].label}
                >
                  <Avatar avatar={id} size="md" />
                  <span className={styles.avatarLabel}>{AVATAR_CONFIG[id].label}</span>
                </button>
              ))}
            </div>
          </div>

          <ChunkyButton
            variant="primary"
            size="lg"
            fullWidth
            disabled={!familyName.trim() || !childName.trim() || saving}
            onClick={handleCreate}
          >
            {saving ? 'Creating…' : '🚀 Create Family!'}
          </ChunkyButton>
        </div>
      )}

      {/* ── Done step ────────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>🎉</span>
          <h1 className={styles.cardTitle}>You're all set!</h1>
          <p className={styles.cardBody}>Share this code to add Jitsu Points on other devices:</p>

          <div className={styles.joinCodeBox}>
            <span className={styles.joinCode}>{joinCode}</span>
            <button className={styles.copyBtn} onClick={copyCode}>
              📋 Copy
            </button>
          </div>

          <p className={styles.codeHint}>
            On another device: open Jitsu Points → "Join our family" → enter this code
          </p>

          {!accessToken && (
            <p className={styles.localNote}>
              💡 No cloud sync yet — your data is saved locally. Go to Parent Mode → Settings to
              connect Google Drive later.
            </p>
          )}

          <ChunkyButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/', { replace: true })}
          >
            Let's go! 🥷
          </ChunkyButton>
        </div>
      )}
    </div>
  );
}
