/**
 * Public Drive API — high-level operations used by the sync engine.
 * Handles "find or create" logic so the sync engine doesn't need to.
 */
import {
  ensureFolder,
  findFile,
  readFile,
  createFile,
  updateFile,
  DriveError,
} from './client';
import { validateDriveFile, tryValidateDriveFile } from '../../domain';
import type { JitsuDriveFile } from '../../domain';

export { DriveError };

/**
 * Pull the Drive file. Returns the validated JitsuDriveFile, or null if:
 *   - The file doesn't exist yet (new family setup on a second device)
 *   - The content is invalid
 *
 * Also returns the Drive file ID (useful for subsequent writes).
 */
export async function pullDriveFile(
  accessToken: string,
): Promise<{ file: JitsuDriveFile; fileId: string } | null> {
  const fileId = await findFile(accessToken);
  if (!fileId) return null;

  const content = await readFile(fileId, accessToken);
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    console.error('[Drive] jitsu-points.json is not valid JSON — ignoring');
    return null;
  }

  const file = tryValidateDriveFile(raw);
  if (!file) return null;

  return { file, fileId };
}

/**
 * Push the local state to Drive.
 * If the file doesn't exist yet, creates both the folder and the file.
 * Returns the Drive file ID.
 */
export async function pushDriveFile(
  driveFile: JitsuDriveFile,
  accessToken: string,
  knownFileId?: string | null,
): Promise<string> {
  const content = JSON.stringify(driveFile, null, 2);

  // If we already know the file ID, try updating it
  if (knownFileId) {
    await updateFile(knownFileId, content, accessToken);
    return knownFileId;
  }

  // Find existing file
  const existingId = await findFile(accessToken);
  if (existingId) {
    await updateFile(existingId, content, accessToken);
    return existingId;
  }

  // No file yet — create folder + file
  const folderId = await ensureFolder(accessToken);
  return createFile(content, folderId, accessToken);
}

// Re-export validateDriveFile for callers who need it alongside drive operations
export { validateDriveFile };
