import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar, { AVATAR_CONFIG } from '../../shared/components/Avatar';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore } from '../../core/store/appStore';
import { useAuthStore } from '../../core/auth';
import type { AvatarId } from '../../domain';
import styles from './ManageKidsScreen.module.css';

const HAS_WORKER = !!import.meta.env.VITE_WORKER_URL;

interface EditState {
  childId: string | null; // null = new
  name: string;
  avatar: AvatarId;
}

const AVATARS = Object.keys(AVATAR_CONFIG) as AvatarId[];

export default function ManageKidsScreen() {
  const navigate = useNavigate();
  const { profiles, createChild, updateChild, deleteChild } = useAppStore();

  const { status } = useAuthStore();
  const isOffline = HAS_WORKER && status !== 'connected';

  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function startNew() {
    setEditing({ childId: null, name: '', avatar: 'speed_hero' });
  }

  function startEdit(id: string) {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setEditing({ childId: id, name: p.name, avatar: p.avatar });
  }

  async function handleSave() {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    if (editing.childId) {
      await updateChild(editing.childId, { name: editing.name.trim(), avatar: editing.avatar });
    } else {
      await createChild(editing.name.trim(), editing.avatar);
    }
    setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await deleteChild(id);
    setConfirmDelete(null);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/parent')}>
          ← Back
        </button>
        <h1 className={styles.title}>👶 Manage Kids</h1>
      </div>

      <div className={styles.body}>
        {isOffline && (
          <div className={styles.offlineBanner}>
            ☁️ Connect Google Drive to save changes — tap ← Back and use the Reconnect button.
          </div>
        )}

        {/* Add / edit form */}
        {editing !== null ? (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>{editing.childId ? 'Edit Kid' : 'New Kid'}</h2>

            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              placeholder="e.g. Emma"
              value={editing.name}
              onChange={(e) => setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
              maxLength={20}
              autoFocus
            />

            <label className={styles.label}>Avatar</label>
            <div className={styles.avatarGrid}>
              {AVATARS.map((id) => (
                <button
                  key={id}
                  className={[
                    styles.avatarBtn,
                    editing.avatar === id ? styles.avatarSelected : '',
                  ].join(' ')}
                  onClick={() => setEditing((s) => (s ? { ...s, avatar: id } : s))}
                  aria-label={AVATAR_CONFIG[id].label}
                >
                  <Avatar avatar={id} size="md" />
                  <span className={styles.avatarLabel}>{AVATAR_CONFIG[id].label}</span>
                </button>
              ))}
            </div>

            <div className={styles.formBtns}>
              <ChunkyButton variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </ChunkyButton>
              <ChunkyButton
                variant="primary"
                size="sm"
                disabled={!editing.name.trim() || saving || isOffline}
                onClick={handleSave}
              >
                {saving ? 'Saving…' : 'Save'}
              </ChunkyButton>
            </div>
          </div>
        ) : (
          <ChunkyButton variant="primary" size="sm" disabled={isOffline} onClick={startNew}>
            + Add Kid
          </ChunkyButton>
        )}

        {/* Kids list */}
        {profiles.length === 0 ? (
          <p className={styles.empty}>No kids yet — add one above!</p>
        ) : (
          <div className={styles.list}>
            {profiles.map((p) => (
              <div key={p.id} className={styles.row}>
                <Avatar avatar={p.avatar} size="md" />
                <div className={styles.rowInfo}>
                  <span className={styles.rowName}>{p.name}</span>
                  <span className={styles.rowLevel}>
                    Level {p.level} · {AVATAR_CONFIG[p.avatar].label}
                  </span>
                </div>
                <div className={styles.rowActions}>
                  <button
                    className={styles.editBtn}
                    disabled={isOffline}
                    onClick={() => startEdit(p.id)}
                  >
                    Edit
                  </button>
                  {confirmDelete === p.id ? (
                    <div className={styles.confirmRow}>
                      <button className={styles.confirmYes} onClick={() => handleDelete(p.id)}>
                        Delete
                      </button>
                      <button className={styles.confirmNo} onClick={() => setConfirmDelete(null)}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.deleteBtn}
                      disabled={isOffline}
                      onClick={() => setConfirmDelete(p.id)}
                    >
                      🗑
                    </button>
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
