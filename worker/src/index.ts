/**
 * Jitsu Points API — Cloudflare Worker
 *
 * Routes:
 *   POST /families              → create a new family; returns { familyId, joinCode, secret }
 *   GET  /families/join/:code   → fetch family by join code (for the "join our family" flow)
 *   GET  /families/:id          → pull latest family data (requires Authorization: Bearer <secret>)
 *   PUT  /families/:id          → push updated family data (requires Authorization: Bearer <secret>)
 *
 * Auth: a random secret is generated at family creation and returned once.
 * Clients store it in localStorage. All writes require it as a Bearer token.
 * Read by join code also returns the secret (that IS the join flow).
 */
import type { Env } from './types';
import { insertFamily, selectByJoinCode, selectById, updateData } from './db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(message: string, status: number): Response {
  return json({ error: message }, status);
}

/** Cryptographically random URL-safe base64 secret (~32 bytes of entropy). */
function randomSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    // ── POST /families ────────────────────────────────────────────────────────
    if (method === 'POST' && pathname === '/families') {
      let body: string;
      try {
        body = await request.text();
        const parsed = JSON.parse(body) as { joinCode?: unknown };
        if (typeof parsed.joinCode !== 'string' || !parsed.joinCode) {
          return err('Missing joinCode in request body', 400);
        }
      } catch {
        return err('Invalid JSON body', 400);
      }

      const joinCode = (JSON.parse(body) as { joinCode: string }).joinCode.toUpperCase();
      const id = crypto.randomUUID();
      const secret = randomSecret();
      const now = new Date().toISOString();

      try {
        await insertFamily(env, { id, join_code: joinCode, secret, data: body, updated_at: now });
      } catch (e) {
        // UNIQUE constraint on join_code — extremely rare (join codes are ~20-bit space)
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('UNIQUE')) return err('Join code conflict — retry', 409);
        throw e;
      }

      return json({ familyId: id, joinCode, secret }, 201);
    }

    // ── GET /families/join/:code ──────────────────────────────────────────────
    const joinMatch = pathname.match(/^\/families\/join\/([A-Z0-9-]+)$/i);
    if (method === 'GET' && joinMatch) {
      const code = joinMatch[1].toUpperCase();
      const row = await selectByJoinCode(env, code);
      if (!row) return err('Family not found', 404);

      let parsed: unknown;
      try {
        parsed = JSON.parse(row.data);
      } catch {
        return err('Corrupt family data', 500);
      }

      return json({ familyId: row.id, secret: row.secret, data: parsed });
    }

    // ── GET /families/:id or PUT /families/:id ────────────────────────────────
    const idMatch = pathname.match(/^\/families\/([0-9a-f-]{36})$/i);
    if (idMatch) {
      const id = idMatch[1].toLowerCase();
      const secret = bearerToken(request);

      const row = await selectById(env, id);
      if (!row) return err('Family not found', 404);
      if (row.secret !== secret) return err('Unauthorized', 401);

      // GET — pull latest data
      if (method === 'GET') {
        let parsed: unknown;
        try {
          parsed = JSON.parse(row.data);
        } catch {
          return err('Corrupt family data', 500);
        }
        return json({ data: parsed, updatedAt: row.updated_at });
      }

      // PUT — push new data
      if (method === 'PUT') {
        let body: string;
        try {
          body = await request.text();
          JSON.parse(body); // validate JSON
        } catch {
          return err('Invalid JSON body', 400);
        }
        await updateData(env, id, body, new Date().toISOString());
        return json({ ok: true });
      }
    }

    return err('Not found', 404);
  },
};
