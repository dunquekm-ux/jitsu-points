/**
 * serialize — read all IndexedDB data into a JitsuDriveFile.
 * Called just before pushing to Google Drive.
 */
import { openJitsuDb } from './schema';
import type { JitsuDriveFile, AppSettings } from '../../domain';

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  theme: 'candy',
};

/**
 * Read the full current state from IndexedDB and return it as a JitsuDriveFile.
 * Returns null if the family has not been set up yet (no familyMeta).
 */
export async function serializeToFile(): Promise<JitsuDriveFile | null> {
  const db = await openJitsuDb();

  const [
    meta,
    settingsRecord,
    profilesList,
    templatesList,
    schedulesList,
    instancesList,
    eventsList,
    rewardsList,
  ] = await Promise.all([
    db.get('familyMeta', 'main'),
    db.get('settings', 'main'),
    db.getAll('profiles'),
    db.getAll('taskTemplates'),
    db.getAll('taskSchedules'),
    db.getAll('taskInstances'),
    db.getAll('pointsEvents'),
    db.getAll('rewards'),
  ]);

  if (!meta) return null;

  // Strip the 'key' field from the settings record before returning
  const { key: _key, ...settingsFields } = settingsRecord ?? { key: 'main', ...DEFAULT_SETTINGS };
  const appSettings: AppSettings = settingsFields as AppSettings;

  return {
    familyId: meta.familyId,
    familyName: meta.familyName,
    joinCode: meta.joinCode,
    lastUpdated: new Date().toISOString(),
    profiles: profilesList,
    taskTemplates: templatesList,
    taskSchedules: schedulesList,
    taskInstances: instancesList,
    pointsEvents: eventsList,
    rewards: rewardsList,
    settings: appSettings,
  };
}
