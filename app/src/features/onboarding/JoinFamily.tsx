import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore } from '../../core/store/appStore';
import { useAuthStore } from '../../core/auth/store';
import { loadGIS, signIn } from '../../core/auth/gis';
import { isValidJoinCode, normaliseJoinCode } from '../../domain';
import styles from './JoinFamily.module.css';

const HAS_AUTH = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

type Step = 'code' | 'auth' | 'syncing' | 'error';

export default function JoinFamily() {
  const navigate = useNavigate();
  const { joinFamily } = useAppStore();
  const { setTokens } = useAuthStore();

  const [step, setStep] = useState<Step>('code');
  const [rawCode, setRawCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const normalised = normaliseJoinCode(rawCode);
  const codeOk = isValidJoinCode(rawCode);

  // ── Step 1 → 2: code confirmed ────────────────────────────────────────────

  function handleCodeContinue() {
    if (!codeOk) return;
    if (!HAS_AUTH) {
      // No auth configured — can't pull from Drive; show message
      setErrorMsg('Google Drive sync is not configured on this build. Ask your family admin to share the exported file directly.');
      setStep('error');
      return;
    }
    setStep('auth');
  }

  // ── Step 2 → 3: Google sign-in then sync ──────────────────────────────────

  async function handleSignIn() {
    setErrorMsg('');
    setBusy(true);
    try {
      await loadGIS();
      const tokens = await signIn();
      setTokens(tokens);
      setStep('syncing');
      await joinFamily(rawCode, tokens.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMsg(msg);
      setStep('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={() => navigate('/welcome')}>← Back</button>

      {/* Step dots */}
      {(() => {
        const ALL: Step[] = HAS_AUTH ? ['code', 'auth', 'syncing'] : ['code', 'syncing'];
        const displayStep: Step = step === 'error' ? 'code' : step;
        const idx = ALL.indexOf(displayStep);
        return (
          <div className={styles.steps}>
            {ALL.map((s, i) => (
              <div key={s} className={[
                styles.dot,
                i === idx ? styles.dotActive : i < idx ? styles.dotDone : '',
              ].join(' ')} />
            ))}
          </div>
        );
      })()}

      {/* ── Code entry ─────────────────────────────────────────────────────── */}
      {step === 'code' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>🔗</span>
          <h1 className={styles.cardTitle}>Join your family</h1>
          <p className={styles.cardBody}>
            Ask the person who set up Jitsu Points for the family join code.
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Join code</label>
            <input
              className={[styles.codeInput, codeOk ? styles.codeOk : rawCode.length > 0 ? styles.codeBad : ''].join(' ')}
              placeholder="e.g. TIGER-42"
              value={rawCode}
              onChange={e => setRawCode(e.target.value.toUpperCase())}
              maxLength={10}
              autoCapitalize="characters"
              autoFocus
            />
            {rawCode.length > 0 && !codeOk && (
              <p className={styles.codeHint}>Format: WORD-NN (e.g. TIGER-42)</p>
            )}
          </div>

          <ChunkyButton variant="primary" size="lg" fullWidth disabled={!codeOk} onClick={handleCodeContinue}>
            Continue →
          </ChunkyButton>
        </div>
      )}

      {/* ── Google sign-in ─────────────────────────────────────────────────── */}
      {step === 'auth' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>🔑</span>
          <h1 className={styles.cardTitle}>Sign in with Google</h1>
          <p className={styles.cardBody}>
            Sign in with the <strong>same Google account</strong> that was used to set up this family. This lets us find your family data on Google Drive.
          </p>

          <div className={styles.codePreview}>
            <span className={styles.codePreviewLabel}>Joining family</span>
            <span className={styles.codePreviewCode}>{normalised}</span>
          </div>

          <ChunkyButton variant="primary" size="lg" fullWidth disabled={busy} onClick={handleSignIn}>
            {busy ? 'Opening Google…' : '🔑 Sign in with Google'}
          </ChunkyButton>
          <button className={styles.backLink} onClick={() => setStep('code')}>← Change code</button>
        </div>
      )}

      {/* ── Syncing ─────────────────────────────────────────────────────────── */}
      {step === 'syncing' && (
        <div className={styles.card}>
          <span className={[styles.cardIcon, styles.spin].join(' ')}>⚙️</span>
          <h1 className={styles.cardTitle}>Syncing your family…</h1>
          <p className={styles.cardBody}>Downloading your family data from Google Drive. This only takes a moment.</p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {step === 'error' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>😕</span>
          <h1 className={styles.cardTitle}>Something went wrong</h1>
          <p className={styles.errorMsg}>{errorMsg}</p>
          <ChunkyButton variant="ghost" size="md" fullWidth onClick={() => { setStep('code'); setErrorMsg(''); }}>
            Try again
          </ChunkyButton>
        </div>
      )}
    </div>
  );
}
