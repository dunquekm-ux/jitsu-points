-- Jitsu Points — D1 schema
-- Run: wrangler d1 execute jitsu-points --file=schema.sql
-- Remote: wrangler d1 execute jitsu-points --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS families (
  id         TEXT PRIMARY KEY,           -- UUID
  join_code  TEXT UNIQUE NOT NULL,       -- e.g. TIGER-42 (uppercase)
  secret     TEXT NOT NULL,              -- random token; authorises writes
  data       TEXT NOT NULL,              -- full JitsuDriveFile as JSON
  updated_at TEXT NOT NULL               -- ISO 8601 timestamp of last push
);

CREATE INDEX IF NOT EXISTS idx_families_join_code ON families(join_code);
