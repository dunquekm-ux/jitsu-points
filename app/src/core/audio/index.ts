/**
 * Jitsu audio — Web Audio API celebration sounds.
 * Zero dependencies. All tones synthesized at runtime.
 *
 * AudioContext is lazy-initialized on the first call (browser policy: an
 * AudioContext must be created inside a user-gesture handler on iOS).
 * All functions catch and swallow errors silently so no audio failure
 * can crash the app.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Resume if suspended by browser (common on mobile until the first gesture)
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/**
 * Play a single synthesized tone.
 * @param freq      Frequency in Hz
 * @param startTime AudioContext time to begin (use ctx.currentTime + offset)
 * @param duration  Duration in seconds
 * @param type      Oscillator wave type
 * @param gain      Peak gain (0–1)
 */
function playTone(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.25,
): void {
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Soft attack, exponential decay
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Cheerful ascending arpeggio — played when a task is completed.
 * C5 → E5 → G5 → C6
 */
export function playTaskComplete(): void {
  try {
    const audioCtx = getCtx();
    const t = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => playTone(freq, t + i * 0.08, 0.35, 'sine', 0.25));
  } catch {
    // Silently ignore — no audio context on this platform
  }
}

/**
 * Triumphant fanfare — played on level-up.
 * Sustained chord followed by a higher ascending run.
 */
export function playLevelUp(): void {
  try {
    const audioCtx = getCtx();
    const t = audioCtx.currentTime;
    // Sustained root chord (C5, E5, G5)
    [523.25, 659.25, 783.99].forEach(freq => playTone(freq, t, 0.5, 'triangle', 0.18));
    // Ascending victory run a beat later
    [783.99, 1046.50, 1318.51, 1567.98].forEach((freq, i) =>
      playTone(freq, t + 0.45 + i * 0.1, 0.45, 'sine', 0.22),
    );
  } catch { /* ignore */ }
}

/**
 * Bell-like descending chime — played when redeeming a reward.
 * C6 → A5 → F5 → C5
 */
export function playRedemption(): void {
  try {
    const audioCtx = getCtx();
    const t = audioCtx.currentTime;
    [1046.50, 880.0, 698.46, 523.25].forEach((freq, i) =>
      playTone(freq, t + i * 0.12, 0.5, 'sine', 0.22),
    );
  } catch { /* ignore */ }
}
