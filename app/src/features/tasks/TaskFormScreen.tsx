import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore, type ScheduleSlot } from '../../core/store/appStore';
import { useAuthStore } from '../../core/auth';
import { useSyncStore } from '../../core/sync/store';
import { getPermissionStatus, requestNotificationPermission } from '../../core/notifications';
import { todayISO } from '../../domain';
import type { Recurrence, DayOfWeek } from '../../domain';
import styles from './TaskFormScreen.module.css';

const HAS_WORKER = !!import.meta.env.VITE_WORKER_URL;

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const ICON_PRESETS = [
  // Morning / hygiene
  '🦷',
  '🚿',
  '🛁',
  '🪥',
  '🧴',
  '👕',
  '👟',
  '🧦',
  // School / learning
  '📚',
  '📖',
  '✏️',
  '🎒',
  '🖊️',
  '📐',
  '🔬',
  '🧮',
  // Chores / home
  '🧹',
  '🧺',
  '🍽️',
  '🧽',
  '🗑️',
  '🛏️',
  '🪣',
  '🪴',
  // Exercise / play
  '🏃',
  '🚲',
  '⚽',
  '🏊',
  '🤸',
  '🎾',
  '🏋️',
  '🧘',
  // Pets
  '🐶',
  '🐱',
  '🐾',
  '🐠',
  // Food / health
  '🍎',
  '🥦',
  '🥕',
  '🍳',
  '💊',
  '🥛',
  // Creative
  '🎵',
  '🎨',
  '📝',
  '🎭',
  '🎸',
  // Bedtime / rest
  '😴',
  '🌙',
  '⏰',
  '📵',
  // Nature / outside
  '🌱',
  '🌳',
  '🌻',
  '☀️',
  // Achievement
  '⭐',
  '🏆',
  '💪',
  '🌟',
  '🤝',
];

// Local form type — adds UI-only fields that get stripped before saving
interface FormSlot {
  label: string;
  startTime: string;
  endTime: string;
  reminderTime: string | null;
  allDay: boolean; // maps to 00:00–23:59 on save; UI only
  recurrence: Recurrence;
}

function defaultSlot(): FormSlot {
  return {
    label: 'Morning',
    startTime: '07:00',
    endTime: '09:00',
    reminderTime: null,
    allDay: false,
    recurrence: { type: 'daily' },
  };
}

// Strip allDay before passing to the store
function toScheduleSlot({ allDay: _allDay, ...rest }: FormSlot): ScheduleSlot {
  return rest;
}

// Detect all-day when loading existing schedules
function isAllDay(startTime: string, endTime: string) {
  return startTime === '00:00' && endTime === '23:59';
}

const POINTS_MIN = 1;
const POINTS_MAX = 500;
const POINTS_DEFAULT = 10;

// Parse + clamp the free-typed points value, falling back when blank/invalid.
function clampPoints(text: string, fallback: number): number {
  const n = Number(text);
  if (text.trim() === '' || Number.isNaN(n)) return fallback;
  return Math.min(POINTS_MAX, Math.max(POINTS_MIN, Math.floor(n)));
}

// A one-time slot whose date is already in the past — invalid (would generate a missed instance).
function isPastOnceSlot(slot: FormSlot, today: string): boolean {
  return slot.recurrence.type === 'once' && slot.recurrence.date < today;
}

export default function TaskFormScreen() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { templateId } = useParams<{ templateId?: string }>();
  const isDuplicate = !!templateId && pathname.endsWith('/duplicate');
  const isEdit = !!templateId && !isDuplicate;
  const today = todayISO();

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

  const { status } = useAuthStore();
  const { status: syncStatus } = useSyncStore();
  const isOffline = HAS_WORKER && (status !== 'connected' || syncStatus === 'offline');

  // Form state
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📋');
  const [iconInputVal, setIconInputVal] = useState(''); // separate from preset selection
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [points, setPoints] = useState(POINTS_DEFAULT);
  const [pointsText, setPointsText] = useState(String(POINTS_DEFAULT)); // free-typed; committed on blur
  const [assignedChildIds, setAssignedChildIds] = useState<string[]>([]);
  const [allowEarlyCompletion, setAllowEarlyCompletion] = useState(false);
  const [slots, setSlots] = useState<FormSlot[]>([defaultSlot()]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  // Pre-fill for edit and duplicate modes
  useEffect(() => {
    if ((isEdit || isDuplicate) && templateId && isLoaded) {
      const t = taskTemplates[templateId];
      if (!t) {
        navigate('/parent');
        return;
      }
      // Duplicate marks the copy distinct; edit keeps the original title.
      setTitle(isDuplicate ? `${t.title} (copy)` : t.title);
      // If saved icon is a preset, select it in the grid (clear the text box).
      // If it's a custom emoji, put it in the text box instead.
      if (ICON_PRESETS.includes(t.icon)) {
        setIcon(t.icon);
        setIconInputVal('');
      } else {
        setIcon(t.icon || '📋');
        setIconInputVal(t.icon || '');
      }
      setPoints(t.points);
      setPointsText(String(t.points));
      setAssignedChildIds(t.assignedChildIds ?? []);
      setAllowEarlyCompletion(t.allowEarlyCompletion);
      const schedList = Object.values(taskSchedules).filter((s) => s.taskTemplateId === templateId);
      if (schedList.length > 0) {
        setSlots(
          schedList.map((s) => ({
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
            reminderTime: s.reminderTime,
            allDay: isAllDay(s.startTime, s.endTime),
            recurrence: s.recurrence,
          })),
        );
      }
    } else if (!isEdit && !isDuplicate && profiles.length > 0 && assignedChildIds.length === 0) {
      // Pre-select all children for new tasks when there's only one child;
      // leave unchecked otherwise so the parent makes an explicit choice.
      if (profiles.length === 1) setAssignedChildIds([profiles[0].id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, isDuplicate, templateId, isLoaded]);

  function updateSlot(index: number, patch: Partial<FormSlot>) {
    setSlotError(null);
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function toggleAllDay(index: number) {
    setSlotError(null);
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (s.allDay) {
          // Turning off — restore sensible defaults
          return { ...s, allDay: false, startTime: '07:00', endTime: '09:00' };
        } else {
          // Turning on — spans the full day
          return { ...s, allDay: true, startTime: '00:00', endTime: '23:59' };
        }
      }),
    );
  }

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      {
        label: 'Evening',
        startTime: '18:00',
        endTime: '20:00',
        reminderTime: null,
        allDay: false,
        recurrence: { type: 'daily' },
      },
    ]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function setRecurrence(index: number, r: Recurrence) {
    updateSlot(index, { recurrence: r });
  }

  function toggleWeekDay(index: number, dow: DayOfWeek) {
    const slot = slots[index];
    const current = slot.recurrence.type === 'weekly' ? slot.recurrence.days : [];
    const next = current.includes(dow) ? current.filter((d) => d !== dow) : [...current, dow];
    // require at least one day selected
    if (next.length === 0) return;
    updateSlot(index, { recurrence: { type: 'weekly', days: next as DayOfWeek[] } });
  }

  async function handleSave() {
    if (!title.trim() || assignedChildIds.length === 0 || slots.length === 0) return;

    // Validate: for non-all-day slots, end time must be strictly after start time
    const invalid = slots.find((s) => !s.allDay && s.startTime >= s.endTime);
    if (invalid) {
      setSlotError(
        `"${invalid.label || 'A slot'}" has end time at or before start time. Fix it or turn on All day.`,
      );
      return;
    }

    // Validate: a one-time slot can't be scheduled in the past (it would generate a missed instance)
    const pastSlot = slots.find((s) => isPastOnceSlot(s, today));
    if (pastSlot) {
      setSlotError(
        `"${pastSlot.label || 'A slot'}" is set to a date in the past. Pick today or a future date.`,
      );
      return;
    }

    const finalPoints = clampPoints(pointsText, points);
    setSaving(true);
    const data = {
      title: title.trim(),
      icon,
      points: finalPoints,
      assignedChildIds,
      allowEarlyCompletion,
      schedules: slots.map(toScheduleSlot),
    };
    if (isEdit && templateId) {
      await updateTask(templateId, data);
    } else {
      await createTask(data);
    }
    // Request notification permission contextually when any slot has a reminder time.
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

  const hasPastOnceDate = slots.some((s) => isPastOnceSlot(s, today));
  const canSave =
    title.trim().length > 0 &&
    assignedChildIds.length > 0 &&
    slots.length > 0 &&
    !hasPastOnceDate &&
    !saving &&
    !isOffline;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/parent')}>
          ← Back
        </button>
        <h1 className={styles.title}>
          {isDuplicate ? '📋 Duplicate Task' : isEdit ? '✏️ Edit Task' : '➕ New Task'}
        </h1>
      </div>

      <div className={styles.body}>
        {isOffline && (
          <div className={styles.offlineBanner}>
            📵 You're offline — changes can't be saved until you reconnect.
          </div>
        )}

        {/* Icon picker — trigger only; grid opens in bottom-sheet (DEF-015) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Icon</label>
          <button
            type="button"
            className={styles.iconTrigger}
            onClick={() => setIconPickerOpen(true)}
          >
            <span className={styles.iconTriggerEmoji}>{icon}</span>
            <span className={styles.iconTriggerText}>Tap to choose icon</span>
            <span className={styles.iconTriggerArrow}>›</span>
          </button>
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
                type="button"
                className={[styles.chip, points === v ? styles.chipSelected : ''].join(' ')}
                onClick={() => {
                  setPoints(v);
                  setPointsText(String(v));
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            className={styles.input}
            value={pointsText}
            min={POINTS_MIN}
            max={POINTS_MAX}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setPointsText(e.target.value)}
            onBlur={() => {
              const clamped = clampPoints(pointsText, points || POINTS_DEFAULT);
              setPoints(clamped);
              setPointsText(String(clamped));
            }}
          />
        </div>

        {/* Assign to children */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Assign to</label>
          <p className={styles.fieldHint}>Select one or more children</p>
          <div className={styles.childCheckList}>
            {profiles.map((p) => {
              const checked = assignedChildIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={[styles.childCheckItem, checked ? styles.childCheckItemOn : ''].join(
                    ' ',
                  )}
                >
                  <input
                    type="checkbox"
                    className={styles.childCheckbox}
                    checked={checked}
                    onChange={(e) => {
                      setAssignedChildIds((prev) =>
                        e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                      );
                    }}
                  />
                  <span className={styles.childCheckName}>{p.name}</span>
                </label>
              );
            })}
          </div>
          {assignedChildIds.length === 0 && (
            <p className={styles.fieldError}>Select at least one child</p>
          )}
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
            type="button"
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
              <button type="button" className={styles.addSlotBtn} onClick={addSlot}>
                + Add slot
              </button>
            )}
          </div>

          {slotError && <p className={styles.slotError}>⚠️ {slotError}</p>}

          {slots.map((slot, i) => (
            <div key={i} className={styles.slotCard}>
              {/* Label + remove */}
              <div className={styles.slotRow}>
                <input
                  className={styles.inputSm}
                  placeholder="Label (e.g. Morning)"
                  value={slot.label}
                  onChange={(e) => updateSlot(i, { label: e.target.value })}
                  maxLength={20}
                />
                {slots.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeSlotBtn}
                    onClick={() => removeSlot(i)}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Recurrence picker */}
              <div className={styles.recurrenceRow}>
                <span className={styles.recurrenceLabel}>Repeats</span>
                <div className={styles.recurrenceTabs}>
                  {(
                    [
                      { type: 'daily', label: 'Every day' },
                      { type: 'weekly', label: 'Days of week' },
                      { type: 'once', label: 'One time' },
                    ] as const
                  ).map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      className={[
                        styles.recurrenceTab,
                        slot.recurrence.type === type ? styles.recurrenceTabActive : '',
                      ].join(' ')}
                      onClick={() => {
                        if (type === 'daily') setRecurrence(i, { type: 'daily' });
                        else if (type === 'weekly')
                          setRecurrence(i, {
                            type: 'weekly',
                            days:
                              slot.recurrence.type === 'weekly'
                                ? slot.recurrence.days
                                : [1, 2, 3, 4, 5], // default Mon–Fri
                          });
                        else
                          setRecurrence(i, {
                            type: 'once',
                            date:
                              slot.recurrence.type === 'once' ? slot.recurrence.date : todayISO(),
                          });
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day-of-week picker — shown when weekly */}
              {slot.recurrence.type === 'weekly' && (
                <div className={styles.dayGrid}>
                  {DAY_LABELS.map((dayLabel, dow) => (
                    <button
                      key={dow}
                      type="button"
                      className={[
                        styles.dayBtn,
                        slot.recurrence.type === 'weekly' &&
                        slot.recurrence.days.includes(dow as DayOfWeek)
                          ? styles.daySelected
                          : '',
                      ].join(' ')}
                      onClick={() => toggleWeekDay(i, dow as DayOfWeek)}
                    >
                      {dayLabel}
                    </button>
                  ))}
                </div>
              )}

              {/* Date picker — shown when once */}
              {slot.recurrence.type === 'once' && (
                <div className={styles.timeField}>
                  <span className={styles.timeLabel}>On date</span>
                  <input
                    type="date"
                    min={today}
                    className={[
                      styles.inputSm,
                      isPastOnceSlot(slot, today) ? styles.inputError : '',
                    ].join(' ')}
                    value={slot.recurrence.date}
                    onChange={(e) =>
                      setRecurrence(i, { type: 'once', date: e.target.value || todayISO() })
                    }
                  />
                  {isPastOnceSlot(slot, today) && (
                    <span className={styles.dateWarning}>
                      ⚠️ This date is in the past — pick today or later.
                    </span>
                  )}
                </div>
              )}

              {/* All day toggle — hidden for once tasks (implied all-day or use time below) */}
              <div className={styles.allDayRow}>
                <span className={styles.allDayLabel}>All day</span>
                <button
                  type="button"
                  className={[styles.toggle, slot.allDay ? styles.toggleOn : ''].join(' ')}
                  onClick={() => toggleAllDay(i)}
                  role="switch"
                  aria-checked={slot.allDay}
                >
                  <span className={styles.toggleThumb} />
                </button>
                <span className={styles.allDayHint}>
                  {slot.allDay ? 'Available any time' : 'Set a time window'}
                </span>
              </div>

              {/* Time window — hidden when all day */}
              {!slot.allDay && (
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
                      className={[
                        styles.inputSm,
                        slot.endTime && slot.startTime && slot.endTime <= slot.startTime
                          ? styles.inputError
                          : '',
                      ].join(' ')}
                      value={slot.endTime}
                      onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Reminder */}
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
          <ChunkyButton
            variant="ghost"
            size="sm"
            fullWidth
            disabled={isOffline}
            onClick={() => setConfirmDelete(true)}
          >
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

      {/* Icon picker bottom-sheet */}
      {iconPickerOpen && (
        <div className={styles.iconSheet}>
          {/* Backdrop */}
          <div className={styles.iconSheetBackdrop} onClick={() => setIconPickerOpen(false)} />
          {/* Panel */}
          <div className={styles.iconSheetPanel}>
            <div className={styles.iconSheetHeader}>
              <span className={styles.iconSheetTitle}>Choose an icon</span>
              <button
                type="button"
                className={styles.iconSheetClose}
                onClick={() => setIconPickerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.iconGrid}>
              {ICON_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={[
                    styles.iconBtn,
                    icon === e && !iconInputVal ? styles.iconSelected : '',
                  ].join(' ')}
                  onClick={() => {
                    setIcon(e);
                    setIconInputVal('');
                    setIconPickerOpen(false);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              className={styles.input}
              placeholder="Or type a custom emoji (e.g. 🎯)"
              value={iconInputVal}
              onChange={(e) => {
                const val = e.target.value;
                setIconInputVal(val);
                setIcon(val.trim() || ICON_PRESETS[0]);
              }}
              onBlur={() => {
                if (iconInputVal.trim()) setIconPickerOpen(false);
              }}
              maxLength={4}
            />
          </div>
        </div>
      )}
    </div>
  );
}
