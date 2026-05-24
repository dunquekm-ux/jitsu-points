/**
 * ID generation — wraps crypto.randomUUID() for testability.
 * Use this everywhere instead of calling crypto.randomUUID() directly.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
