import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar, { AVATAR_CONFIG } from '../../shared/components/Avatar';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore } from '../../core/store/appStore';
import { markWhatsNewSeen } from '../../core/whatsNew';
import type { AvatarId } from '../../domain';
import styles from './FamilySetup.module.css';

const AVATARS = Object.keys(AVATAR_CONFIG) as AvatarId[];

type Step = 'details' | 'error' | 'done';

export default function FamilySetup() {
  const navigate = useNavigate();
  const { initFamily } = useAppStore();

  const [step, setStep] = useState<Step>('details');
  const [familyName, setFamilyName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState<AvatarId>('speed_hero');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Create family ─────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!familyName.trim() || !childName.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const code = await initFamily(familyName.trim(), childName.trim(), childAvatar);
      setJoinCode(code);
      setStep('done');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not connect to server. Check your internet and try again.';
      setErrorMsg(msg);
      setStep('error');
    } finally {
      setSaving(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(joinCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = joinCode;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={() => navigate('/welcome')}>
        ← Back
      </button>

      {/* Step indicator — only show for the happy path steps */}
      <div className={styles.steps}>
        {(['details', 'done'] as const).map((s, i) => {
          const activeIdx =
            step === 'error'
              ? 0
              : (['details', 'done'] as const).indexOf(step as 'details' | 'done');
          return (
            <div
              key={s}
              className={[
                styles.dot,
                i === activeIdx ? styles.dotActive : i < activeIdx ? styles.dotDone : '',
              ].join(' ')}
            />
          );
        })}
      </div>

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

      {/* ── Error step ───────────────────────────────────────────────────── */}
      {step === 'error' && (
        <div className={styles.card}>
          <span className={styles.cardIcon}>😕</span>
          <h1 className={styles.cardTitle}>Couldn't create family</h1>
          <p className={styles.error}>{errorMsg}</p>
          <ChunkyButton
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => {
              setStep('details');
              setErrorMsg('');
            }}
          >
            ← Try again
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
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>

          <p className={styles.codeHint}>
            On another device: open Jitsu Points → "Join our family" → enter this code
          </p>

          <ChunkyButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              markWhatsNewSeen(); // new family — skip "What's New" for features they're getting fresh
              navigate('/', { replace: true });
            }}
          >
            Let's go! 🥷
          </ChunkyButton>
        </div>
      )}
    </div>
  );
}
