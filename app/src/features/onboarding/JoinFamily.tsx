import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore } from '../../core/store/appStore';
import { markWhatsNewSeen } from '../../core/whatsNew';
import { markAllAcksSeen } from '../../core/ackFeed';
import { isValidJoinCode } from '../../domain';
import styles from './JoinFamily.module.css';

type Step = 'code' | 'syncing' | 'error';

export default function JoinFamily() {
  const navigate = useNavigate();
  const { joinFamily } = useAppStore();

  const [step, setStep] = useState<Step>('code');
  const [rawCode, setRawCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const codeOk = isValidJoinCode(rawCode);

  // ── Join ──────────────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!codeOk) return;
    setErrorMsg('');
    setBusy(true);
    setStep('syncing');
    try {
      await joinFamily(rawCode);
      markWhatsNewSeen(); // joining device — skip "What's New" for features they're getting fresh
      // Existing family history just arrived on this device — don't replay it as popups.
      markAllAcksSeen(useAppStore.getState().pointsEvents);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMsg(msg);
      setStep('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={() => navigate('/welcome')}>
        ← Back
      </button>

      {/* Step dots */}
      <div className={styles.steps}>
        {(['code', 'syncing'] as Step[]).map((s, i) => {
          const idx = step === 'error' ? 0 : ['code', 'syncing'].indexOf(step);
          return (
            <div
              key={s}
              className={[
                styles.dot,
                i === idx ? styles.dotActive : i < idx ? styles.dotDone : '',
              ].join(' ')}
            />
          );
        })}
      </div>

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
              className={[
                styles.codeInput,
                codeOk ? styles.codeOk : rawCode.length > 0 ? styles.codeBad : '',
              ].join(' ')}
              placeholder="e.g. TIGER-42"
              value={rawCode}
              onChange={(e) => setRawCode(e.target.value.toUpperCase())}
              maxLength={10}
              autoCapitalize="characters"
              autoFocus
            />
            {rawCode.length > 0 && !codeOk && (
              <p className={styles.codeHint}>Format: WORD-NN (e.g. TIGER-42)</p>
            )}
          </div>

          <ChunkyButton
            variant="primary"
            size="lg"
            fullWidth
            disabled={!codeOk || busy}
            onClick={handleJoin}
          >
            Join Family →
          </ChunkyButton>
        </div>
      )}

      {/* ── Syncing ─────────────────────────────────────────────────────────── */}
      {step === 'syncing' && (
        <div className={styles.card}>
          <span className={[styles.cardIcon, styles.spin].join(' ')}>⚙️</span>
          <h1 className={styles.cardTitle}>Syncing your family…</h1>
          <p className={styles.cardBody}>Downloading your family data. This only takes a moment.</p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {step === 'error' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>😕</span>
          <h1 className={styles.cardTitle}>Something went wrong</h1>
          <p className={styles.errorMsg}>{errorMsg}</p>
          <ChunkyButton
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => {
              setStep('code');
              setErrorMsg('');
            }}
          >
            Try again
          </ChunkyButton>
        </div>
      )}
    </div>
  );
}
