/**
 * D1 data access layer — thin wrappers around SQL statements.
 * No business logic here; just typed queries.
 */
import type { Env } from './types';

export interface FamilyRow {
  id: string;
  join_code: string;
  secret: string;
  data: string; // JSON-serialised JitsuDriveFile
  updated_at: string; // ISO 8601
}

export async function insertFamily(env: Env, row: FamilyRow): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO families (id, join_code, secret, data, updated_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(row.id, row.join_code, row.secret, row.data, row.updated_at)
    .run();
}

export async function selectByJoinCode(env: Env, joinCode: string): Promise<FamilyRow | null> {
  const result = await env.DB.prepare('SELECT * FROM families WHERE join_code = ?')
    .bind(joinCode.toUpperCase())
    .first<FamilyRow>();
  return result ?? null;
}

export async function selectById(env: Env, id: string): Promise<FamilyRow | null> {
  const result = await env.DB.prepare('SELECT * FROM families WHERE id = ?')
    .bind(id)
    .first<FamilyRow>();
  return result ?? null;
}

export async function updateData(
  env: Env,
  id: string,
  data: string,
  updatedAt: string,
): Promise<void> {
  await env.DB.prepare('UPDATE families SET data = ?, updated_at = ? WHERE id = ?')
    .bind(data, updatedAt, id)
    .run();
}
