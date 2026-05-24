import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore, type ScheduleSlot } from '../../core/store/appStore';
import { getPermissionStatus, requestNotificationPermission } from '../../core/notifications';
import styles from './TaskFormScreen.module.css';

const ICON_PRESETS = ['📚', '🦷', '🛏️', '🐶', '🧹', '🍽️', '🏃', '🎵', '📖', '🌱', '🚿', '👟'];

function defaultSlot(): ScheduleSlot {
  return { label: 'Morning', startTime: '07:00', endTime: '09:00', reminderTime: null };
}

export default function TaskFormScreen() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId?: string }>();
  const isEdit = !!templateId;

  const {
    profiles,
    taskTemplates,
    taskSchedules,
    createTask,
    updateTask,
    deleteTask,
    isLoaded,
    load,
  } = useAppStore();

  // Form state
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📋');
  const [points, setPoints] = useState(10);
  const [assignedChildId, setAssignedChildId] = useState('');
  const [allowEarlyCompletion, setAllowEarlyCompletion] = useState(false);
  const [slots, setSlots] = useState<ScheduleSlot[]>([defaultSlot()]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  // Pre-fill for edit mode
  useEffect(() => {
    if (isEdit && templateId && isLoaded) {
      const t = taskTemplates[templateId];
      if (!t) {
        navigate('/parent');
        return;
      }
      setTitle(t.title);
      setIcon(t.icon || '📋');
      setPoints(t.points);
      setAssignedChildId(t.assignedChildId);
      setAllowEarlyCompletion(t.allowEarlyCompletion);
      const schedList = Object.values(taskSchedules).filter((s) => s.taskTemplateId === templateId);
      if (schedList.length > 0) {
        setSlots(
          schedList.map((s) => ({
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
            reminderTime: s.reminderTime,
          })),
        );
      }
    } else if (!isEdit && profiles.length > 0 && !assignedChildId) {
      setAssignedChildId(profiles[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, templateId, isLoaded]);

  function updateSlot(index: number, patch: Partial<ScheduleSlot>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      { label: 'Evening', startTime: '18:00', endTime: '20:00', reminderTime: null },
    ]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!title.trim() || !assignedChildId || slots.length === 0) return;
    setSaving(true);
    const data = {
      title: title.trim(),
      icon,
      points,
      assignedChildId,
      allowEarlyCompletion,
      schedules: slots,
    };
    if (isEdit && templateId) {
      await updateTask(templateId, data);
    } else {
      await createTask(data);
    }
    // Request notification permission contextually when any slot has a reminder time.
    // The browser shows its own modal — user sees it just after saving a task with reminders,
    // which makes the reason obvious. We don't block navigation on the result.
    const hasReminders = slots.some((s) => s.reminderTime !== null);
    if (hasReminders && getPermissionStatus() === 'default') {
      await requestNotificationPermission();
    }
    navigate('/parent');
  }

  async function handleDelete() {
    if (!templateId) return;
    await deleteTask(templateId);
    navigate('/parent');
  }

  const canSave = title.trim().length > 0 && assignedChildId && slots.length > 0 && !saving;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/parent')}>
          ← Back
        </button>
        <h1 className={styles.title}>{isEdit ? '✏️ Edit Task' : '➕ New Task'}</h1>
      </div>

      <div className={styles.body}>
        {/* Icon picker */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Icon</label>
          <div className={styles.iconGrid}>
            {ICON_PRESETS.map((e) => (
              <button
                key={e}
                className={[styles.iconBtn, icon === e ? styles.iconSelected : ''].join(' ')}
                onClick={() => setIcon(e)}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            className={styles.input}
            placeholder="Or type any emoji…"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={4}
          />
        </div>

        {/* Title */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Task name</label>
          <input
            className={styles.input}
            placeholder="e.g. Brush Teeth"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={40}
          />
        </div>

        {/* Points */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Points to earn ⭐</label>
          <div className={styles.pointsRow}>
            {[5, 10, 15, 20, 25].map((v) => (
              <button
                key={v}
                className={[styles.chip, points === v ? styles.chipSelected : ''].join(' ')}
                onClick={() => setPoints(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <input
            type="number"
            className={styles.input}
            value={points}
            min={1}
            max={500}
            onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
          />
        </div>

        {/* Assign to child */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Assign to</label>
          <select
            className={styles.select}
            value={assignedChildId}
            onChange={(e) => setAssignedChildId(e.target.value)}
          >
            <option value="">— choose a child —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Allow early completion */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Allow early completion</span>
            <span className={styles.toggleHint}>
              Child can complete before the time window opens
            </span>
          </div>
          <button
            className={[styles.toggle, allowEarlyCompletion ? styles.toggleOn : ''].join(' ')}
            onClick={() => setAllowEarlyCompletion((v) => !v)}
            role="switch"
            aria-checked={allowEarlyCompletion}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        {/* Schedule slots */}
        <div className={styles.fieldGroup}>
          <div className={styles.slotHeader}>
            <label className={styles.label}>Schedule slots</label>
            {slots.length < 3 && (
              <button className={styles.addSlotBtn} onClick={addSlot}>
                + Add slot
              </button>
            )}
          </div>
          {slots.map((slot, i) => (
            <div key={i} className={styles.slotCard}>
              <div className={styles.slotRow}>
                <input
                  className={styles.inputSm}
                  placeholder="Label (e.g. Morning)"
                  value={slot.label}
                  onChange={(e) => updateSlot(i, { label: e.target.value })}
                  maxLength={20}
                />
                {slots.length > 1 && (
                  <button className={styles.removeSlotBtn} onClick={() => removeSlot(i)}>
                    ✕
                  </button>
                )}
              </div>
              <div className={styles.slotRow}>
                <div className={styles.timeField}>
                  <span className={styles.timeLabel}>Start</span>
                  <input
                    type="time"
                    className={styles.inputSm}
                    value={slot.startTime}
                    onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                  />
                </div>
                <div className={styles.timeField}>
                  <span className={styles.timeLabel}>End</span>
                  <input
                    type="time"
                    className={styles.inputSm}
                    value={slot.endTime}
                    onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.timeField}>
                <span className={styles.timeLabel}>Reminder (optional)</span>
                <input
                  type="time"
                  className={styles.inputSm}
                  value={slot.reminderTime ?? ''}
                  onChange={(e) => updateSlot(i, { reminderTime: e.target.value || null })}
                />
              </div>
            </div>
          ))}
        </div>

        <ChunkyButton
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSave}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : isEdit ? '✅ Save Changes' : '✅ Create Task'}
        </ChunkyButton>

        {isEdit && !confirmDelete && (
          <ChunkyButton variant="ghost" size="sm" fullWidth onClick={() => setConfirmDelete(true)}>
            🗑 Delete this task
          </ChunkyButton>
        )}
        {isEdit && confirmDelete && (
          <div className={styles.deleteConfirm}>
            <p className={styles.deleteWarning}>Delete task and all its schedules?</p>
            <div className={styles.deleteBtns}>
              <ChunkyButton variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </ChunkyButton>
              <ChunkyButton variant="ghost" size="sm" onClick={handleDelete}>
                Yes, delete
              </ChunkyButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
