/**
 * Auth types — family credential shape.
 * Replaces the previous Google OAuth / GIS types.
 */
export interface FamilyCredentials {
  familyId: string;
  secret: string; // returned once at family creation; stored in localStorage
}

export const CREDS_STORAGE_KEY = 'jitsu-creds';
