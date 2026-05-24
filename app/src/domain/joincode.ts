/**
 * Join code generation and parsing.
 * Format: WORD-NN  (e.g. "TIGER-42")
 */

const WORDS = [
  'TIGER', 'PANDA', 'EAGLE', 'KOALA', 'SHARK', 'OTTER', 'RAVEN',
  'BISON', 'COBRA', 'GECKO', 'HIPPO', 'LLAMA', 'MOOSE', 'TAPIR',
  'ZEBRA', 'CRANE', 'DINGO', 'FINCH', 'HYENA', 'LEMUR',
];

/**
 * Generate a random join code, e.g. "TIGER-42".
 */
export function generateJoinCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = String(Math.floor(Math.random() * 90) + 10); // 10–99
  return `${word}-${num}`;
}

/**
 * Normalise user input for comparison (uppercase, trim).
 */
export function normaliseJoinCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Validate that a string looks like a join code.
 */
export function isValidJoinCode(code: string): boolean {
  return /^[A-Z]{4,6}-\d{2}$/.test(normaliseJoinCode(code));
}
