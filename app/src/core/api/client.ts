/**
 * Jitsu API client — thin fetch wrapper around the Cloudflare Worker.
 *
 * VITE_WORKER_URL must be set in .env.local for sync to work.
 * In local-only dev mode (no env var) the helpers are still importable but
 * will throw ApiError immediately if called.
 */
import { tryValidateDriveFile } from '../../domain';
import type { JitsuDriveFile } from '../../domain';

const WORKER_URL: string = (import.meta.env.VITE_WORKER_URL as string | undefined) ?? '';

export class ApiError extends Error {
  readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest(path: string, init: RequestInit): Promise<Response> {
  if (!WORKER_URL) throw new ApiError('VITE_WORKER_URL is not configured');
  const res = await fetch(`${WORKER_URL}${path}`, init);
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ?? '';
    } catch {
      /* ignore */
    }
    throw new ApiError(`API error ${res.status}: ${detail}`, res.status);
  }
  return res;
}

// ─── Public operations ────────────────────────────────────────────────────────

/**
 * Create a new family on the Worker.
 * Called once during "Set up our family" onboarding.
 * Returns the familyId and secret the client must store.
 */
export async function createFamily(
  file: JitsuDriveFile,
): Promise<{ familyId: string; joinCode: string; secret: string }> {
  const res = await apiRequest('/families', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(file),
  });
  return res.json() as Promise<{ familyId: string; joinCode: string; secret: string }>;
}

/**
 * Fetch family data by join code.
 * Called during "Join our family" onboarding.
 * Returns the family data AND the secret (this is how joining works — code = access).
 */
export async function fetchByJoinCode(
  joinCode: string,
): Promise<{ familyId: string; secret: string; file: JitsuDriveFile } | null> {
  let res: Response;
  try {
    res = await apiRequest(`/families/join/${encodeURIComponent(joinCode.toUpperCase())}`, {
      method: 'GET',
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
  const body = (await res.json()) as { familyId: string; secret: string; data: unknown };
  const file = tryValidateDriveFile(body.data);
  if (!file) return null;
  return { familyId: body.familyId, secret: body.secret, file };
}

/**
 * Pull the latest family data from the Worker.
 * Returns null if the family doesn't exist (shouldn't happen after setup).
 */
export async function pullFamily(
  familyId: string,
  secret: string,
): Promise<{ file: JitsuDriveFile; updatedAt: string } | null> {
  let res: Response;
  try {
    res = await apiRequest(`/families/${familyId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
  const body = (await res.json()) as { data: unknown; updatedAt: string };
  const file = tryValidateDriveFile(body.data);
  if (!file) return null;
  return { file, updatedAt: body.updatedAt };
}

/**
 * Push updated family data to the Worker.
 * Called after every write to IndexedDB (debounced).
 */
export async function pushFamily(
  familyId: string,
  secret: string,
  file: JitsuDriveFile,
): Promise<void> {
  await apiRequest(`/families/${familyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(file),
  });
}
