# Jitsu Points

Gamified chores and rewards app for kids ages 5–12. Parents create tasks and rewards; kids complete missions, earn points, and redeem prizes.

**Live app:** https://jitsu-points.pages.dev

## Stack

- React 19 + TypeScript + Vite 8
- IndexedDB (`idb`) — local-first, works fully offline
- Google Drive API — family data synced to their own Google account
- Zustand — global state
- CSS Modules + custom properties — 4 themes (Candy, Berry, Ocean, Sunset)
- Cloudflare Pages — hosting (free, zero infrastructure)

## Getting started

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173 — click "Load Demo Data" to explore with sample data.

## Environment variables

```bash
cp .env.example .env.local
# Add your Google OAuth Client ID (optional — app runs local-only without it)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run test         # Unit tests (119 passing)
npm run test:e2e     # Playwright E2E tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

## Architecture

See [`CLAUDE.md`](../CLAUDE.md) for full documentation, [`DECISIONS.md`](../DECISIONS.md) for architecture decisions, and [`DOMAIN.md`](../DOMAIN.md) for the data model.
