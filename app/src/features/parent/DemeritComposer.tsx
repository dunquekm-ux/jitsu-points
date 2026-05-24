import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../shared/components/Avatar';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore } from '../../core/store/appStore';
import styles from './DemeritComposer.module.css';

const MAX_DEMERIT = 20;

export default function DemeritComposer() {
  const navigate = useNavigate();
  const { profiles, addDemerit } = useAppStore();

  const [childId, setChildId] = useState('');
  const [amount, setAmount] = useState(5);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const capped = Math.min(amount, MAX_DEMERIT);
  const selectedProfile = profiles.find(p => p.id === childId);

  async function handleSave() {
    if (!childId || amount <= 0) return;
    setSaving(true);
    await addDemerit(childId, amount, note.trim());
    navigate('/parent');
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/parent')}>← Back</button>
        <h1 className={styles.title}>💙 Give Demerit</h1>
        <p className={styles.subtitle}>Calm and corrective — max {MAX_DEMERIT} pts</p>
      </div>

      <div className={styles.body}>
        {/* Child picker */}
        <label className={styles.label}>Who is this for?</label>
        <div className={styles.kidGrid}>
          {profiles.map(p => (
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
        <label className={styles.label}>Amount (max {MAX_DEMERIT} ⭐)</label>
        <div className={styles.amountRow}>
          {[2, 5, 10, 15, 20].map(v => (
            <button
              key={v}
              className={[styles.amountChip, capped === v ? styles.chipSelected : ''].join(' ')}
              onClick={() => setAmount(v)}
            >−{v}</button>
          ))}
        </div>
        <input
          type="number"
          className={styles.input}
          value={amount}
          min={1}
          max={MAX_DEMERIT}
          onChange={e => setAmount(Math.min(MAX_DEMERIT, Math.max(1, Number(e.target.value))))}
        />
        {amount > MAX_DEMERIT && (
          <p className={styles.capNote}>Capped at −{MAX_DEMERIT} pts per the house rules.</p>
        )}

        {/* Reason */}
        <label className={styles.label}>Reason (recommended)</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. Left room messy after reminders"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={80}
        />

        {/* Preview */}
        {selectedProfile && (
          <div className={styles.preview}>
            <span className={styles.previewText}>
              {selectedProfile.name} will see <strong>−{capped} ⭐</strong>
              {note ? ` — "${note}"` : ''}
            </span>
          </div>
        )}

        <ChunkyButton
          variant="ghost"
          size="lg"
          fullWidth
          disabled={!childId || amount <= 0 || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : '💙 Apply Demerit'}
        </ChunkyButton>
      </div>
    </div>
  );
}
