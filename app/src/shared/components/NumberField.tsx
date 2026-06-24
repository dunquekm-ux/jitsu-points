import { useEffect, useState } from 'react';

interface Props {
  /** Committed numeric value (source of truth, owned by the parent). */
  value: number;
  /** Called with the clamped integer when editing finishes (blur). */
  onCommit: (n: number) => void;
  min: number;
  max: number;
  /** Value to fall back to when the field is left blank/invalid on blur. Defaults to the current value. */
  fallback?: number;
  className?: string;
  ariaLabel?: string;
}

/** Parse + clamp free-typed text to an integer in [min, max]; blank/invalid → fallback. */
function clampToRange(text: string, min: number, max: number, fallback: number): number {
  const n = Number(text);
  if (text.trim() === '' || Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/**
 * A numeric input that can actually be cleared and retyped.
 *
 * Holds the raw text while editing (so backspacing to empty works), selects all
 * on focus for instant overtype, and clamps to [min, max] only on blur. External
 * value changes (e.g. quick-pick chips) flow back into the displayed text.
 */
export default function NumberField({
  value,
  onCommit,
  min,
  max,
  fallback,
  className,
  ariaLabel,
}: Props) {
  const [text, setText] = useState(String(value));

  // Reflect external value changes (quick-pick chips, prefill) into the field.
  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      className={className}
      aria-label={ariaLabel}
      value={text}
      min={min}
      max={max}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const clamped = clampToRange(text, min, max, fallback ?? value);
        setText(String(clamped));
        onCommit(clamped);
      }}
    />
  );
}
