/**
 * Google Drive REST API v3 client.
 * Thin wrapper — no business logic here, just HTTP calls.
 * All functions take an explicit accessToken; the caller is responsible for
 * refreshing it before calling.
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER = 'Jitsu Points';
const FILE_NAME = 'jitsu-points.json';
const MIME_JSON = 'application/json';

export class DriveError extends Error {
  readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DriveError';
    this.status = status;
  }
}

async function driveRequest(url: string, options: RequestInit, accessToken: string): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new DriveError(`Drive API error ${res.status}: ${detail}`, res.status);
  }
  return res;
}

// ─── Folder management ────────────────────────────────────────────────────────

/**
 * Find the app's Drive folder ID. Returns null if not found.
 */
export async function findFolder(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${APP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await driveRequest(`${DRIVE_API}/files?q=${q}&fields=files(id)`, {}, accessToken);
  const data = await res.json() as { files: { id: string }[] };
  return data.files[0]?.id ?? null;
}

/**
 * Create the app's Drive folder. Returns the new folder ID.
 */
export async function createFolder(accessToken: string): Promise<string> {
  const res = await driveRequest(
    `${DRIVE_API}/files`,
    {
      method: 'POST',
      headers: { 'Content-Type': MIME_JSON },
      body: JSON.stringify({ name: APP_FOLDER, mimeType: 'application/vnd.google-apps.folder' }),
    },
    accessToken,
  );
  const data = await res.json() as { id: string };
  return data.id;
}

/**
 * Find or create the app folder. Returns the folder ID.
 */
export async function ensureFolder(accessToken: string): Promise<string> {
  return (await findFolder(accessToken)) ?? (await createFolder(accessToken));
}

// ─── File management ─────────────────────────────────────────────────────────

/**
 * Find the jitsu-points.json file ID. Returns null if not created yet.
 */
export async function findFile(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${FILE_NAME}' and mimeType='${MIME_JSON}' and trashed=false`);
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime+desc`,
    {},
    accessToken,
  );
  const data = await res.json() as { files: { id: string; modifiedTime: string }[] };
  return data.files[0]?.id ?? null;
}

/**
 * Read the JSON content of the Drive file.
 */
export async function readFile(fileId: string, accessToken: string): Promise<string> {
  const res = await driveRequest(`${DRIVE_API}/files/${fileId}?alt=media`, {}, accessToken);
  return res.text();
}

/**
 * Create jitsu-points.json in the app folder with initial content.
 * Returns the new file ID.
 */
export async function createFile(content: string, folderId: string, accessToken: string): Promise<string> {
  const metadata = JSON.stringify({ name: FILE_NAME, mimeType: MIME_JSON, parents: [folderId] });
  const body = new FormData();
  body.append('metadata', new Blob([metadata], { type: MIME_JSON }));
  body.append('file', new Blob([content], { type: MIME_JSON }));

  const res = await driveRequest(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id`,
    { method: 'POST', body },
    accessToken,
  );
  const data = await res.json() as { id: string };
  return data.id;
}

/**
 * Overwrite the content of an existing Drive file.
 */
export async function updateFile(fileId: string, content: string, accessToken: string): Promise<void> {
  await driveRequest(
    `${UPLOAD_API}/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': MIME_JSON },
      body: content,
    },
    accessToken,
  );
}
