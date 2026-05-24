import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore } from '../../core/store/appStore';
import styles from './ManageRewardsScreen.module.css';

interface EditState {
  rewardId: string | null;  // null = new
  title: string;
  cost: string;
}

export default function ManageRewardsScreen() {
  const navigate = useNavigate();
  const { rewards, createRewardItem, updateRewardItem, toggleReward, deleteReward } = useAppStore();

  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function startNew() {
    setEditing({ rewardId: null, title: '', cost: '50' });
  }

  function startEdit(id: string) {
    const r = rewards.find(x => x.id === id);
    if (!r) return;
    setEditing({ rewardId: id, title: r.title, cost: String(r.cost) });
  }

  async function handleSave() {
    if (!editing || !editing.title.trim() || Number(editing.cost) <= 0) return;
    setSaving(true);
    if (editing.rewardId) {
      await updateRewardItem(editing.rewardId, {
        title: editing.title.trim(),
        cost: Number(editing.cost),
      });
    } else {
      await createRewardItem(editing.title.trim(), Number(editing.cost));
    }
    setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await deleteReward(id);
    setConfirmDelete(null);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/parent')}>← Back</button>
        <h1 className={styles.title}>🎁 Manage Rewards</h1>
      </div>

      <div className={styles.body}>
        {/* Add / edit form */}
        {editing !== null ? (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>{editing.rewardId ? 'Edit Reward' : 'New Reward'}</h2>
            <label className={styles.label}>Reward name</label>
            <input
              className={styles.input}
              placeholder="e.g. Ice Cream Treat"
              value={editing.title}
              onChange={e => setEditing(s => s ? { ...s, title: e.target.value } : s)}
              maxLength={40}
              autoFocus
            />
            <label className={styles.label}>Cost (⭐ points)</label>
            <input
              type="number"
              className={styles.input}
              value={editing.cost}
              min={1}
              onChange={e => setEditing(s => s ? { ...s, cost: e.target.value } : s)}
            />
            <div className={styles.formBtns}>
              <ChunkyButton variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</ChunkyButton>
              <ChunkyButton
                variant="secondary"
                size="sm"
                disabled={!editing.title.trim() || Number(editing.cost) <= 0 || saving}
                onClick={handleSave}
              >{saving ? 'Saving…' : 'Save'}</ChunkyButton>
            </div>
          </div>
        ) : (
          <ChunkyButton variant="primary" size="sm" onClick={startNew}>+ New Reward</ChunkyButton>
        )}

        {/* Reward list */}
        {rewards.length === 0 ? (
          <p className={styles.empty}>No rewards yet — add one above!</p>
        ) : (
          <div className={styles.list}>
            {rewards.map(r => (
              <div key={r.id} className={[styles.row, !r.enabled ? styles.rowDisabled : ''].join(' ')}>
                <div className={styles.rowInfo}>
                  <span className={styles.rowTitle}>{r.title}</span>
                  <span className={styles.rowCost}>⭐ {r.cost}</span>
                </div>
                <div className={styles.rowActions}>
                  {/* Toggle enabled */}
                  <button
                    className={[styles.toggle, r.enabled ? styles.toggleOn : ''].join(' ')}
                    onClick={() => toggleReward(r.id)}
                    aria-label={r.enabled ? 'Disable' : 'Enable'}
                    title={r.enabled ? 'Active — tap to disable' : 'Disabled — tap to enable'}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                  <button className={styles.editBtn} onClick={() => startEdit(r.id)}>Edit</button>
                  {confirmDelete === r.id ? (
                    <div className={styles.confirmRow}>
                      <button className={styles.confirmYes} onClick={() => handleDelete(r.id)}>Delete</button>
                      <button className={styles.confirmNo}  onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <button className={styles.deleteBtn} onClick={() => setConfirmDelete(r.id)}>🗑</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
