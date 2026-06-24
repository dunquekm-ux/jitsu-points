import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../../shared/components/Avatar';
import ChunkyButton from '../../shared/components/ChunkyButton';
import NumberField from '../../shared/components/NumberField';
import { useAppStore } from '../../core/store/appStore';
import { useAuthStore } from '../../core/auth';
import { useSyncStore } from '../../core/sync/store';
import styles from './BonusComposer.module.css';

const HAS_WORKER = !!import.meta.env.VITE_WORKER_URL;

export default function BonusComposer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profiles, addBonus } = useAppStore();

  const { status } = useAuthStore();
  const { status: syncStatus } = useSyncStore();
  const isOffline = HAS_WORKER && (status !== 'connected' || syncStatus === 'offline');

  const preselected = (location.state as { childId?: string } | null)?.childId ?? '';
  const [childId, setChildId] = useState(preselected);
  const [amount, setAmount] = useState(10);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!childId || amount <= 0) return;
    setSaving(true);
    await addBonus(childId, amount, note.trim());
    navigate('/parent');
  }

  const selectedProfile = profiles.find((p) => p.id === childId);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/parent')}>
          ← Back
        </button>
        <h1 className={styles.title}>🎉 Give Bonus</h1>
      </div>

      <div className={styles.body}>
        {isOffline && (
          <div className={styles.offlineBanner}>
            📵 You're offline — changes can't be saved until you reconnect.
          </div>
        )}

        {/* Child picker */}
        <label className={styles.label}>Who gets the bonus?</label>
        <div className={styles.kidGrid}>
          {profiles.map((p) => (
            <button
              key={p.id}
              className={[styles.kidBtn, p.id === childId ? styles.kidSelected : ''].join(' ')}
              onClick={() => setChildId(p.id)}
            >
              <Avatar avatar={p.avatar} size="md" />
              <span className={styles.kidName}>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Amount */}
        <label className={styles.label}>Bonus amount (⭐ points)</label>
        <div className={styles.amountRow}>
          {[5, 10, 15, 20, 25, 50].map((v) => (
            <button
              key={v}
              className={[styles.amountChip, amount === v ? styles.chipSelected : ''].join(' ')}
              onClick={() => setAmount(v)}
            >
              +{v}
            </button>
          ))}
        </div>
        <NumberField
          value={amount}
          onCommit={setAmount}
          min={1}
          max={999}
          fallback={10}
          className={styles.input}
          ariaLabel="Bonus amount"
        />

        {/* Note */}
        <label className={styles.label}>Reason (optional)</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. Great attitude today!"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
        />

        {/* Preview */}
        {selectedProfile && (
          <div className={styles.preview}>
            <span className={styles.previewText}>
              {selectedProfile.name} will see <strong>+{amount} ⭐</strong>
              {note ? ` — "${note}"` : ''}
            </span>
          </div>
        )}

        <ChunkyButton
          variant="primary"
          size="lg"
          fullWidth
          disabled={!childId || amount <= 0 || saving || isOffline}
          onClick={handleSave}
        >
          {saving ? 'Giving...' : '🎉 Give Bonus!'}
        </ChunkyButton>
      </div>
    </div>
  );
}
