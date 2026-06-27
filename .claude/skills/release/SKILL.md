---
name: release
description: Bump the Jitsu Points build number and ship a deploy. Use whenever the user asks to bump the version, ship/cut a build, deploy, or push app changes to Cloudflare Pages. Codifies the YYYY.MM.DD.N build-number rule and the post-deploy version smoke check.
---

# Releasing Jitsu Points

The `app/` PWA auto-deploys to Cloudflare Pages on every push to `master` (see `.github/workflows/ci.yml`). Follow this when cutting a build.

## 1. Decide whether to bump the build number

- **App-facing change** (anything under `app/src` that affects the running app) → **bump** `APP_VERSION`.
- **CI-only or docs-only change** (`.github/`, `CLAUDE.md`, `CHANGELOG.md`, `.claude/`) → **do not bump**; commit with a `ci:`/`docs:` prefix. Pushing still triggers a deploy of the same build (idempotent).

## 2. Compute the build number — format `YYYY.MM.DD.N`

**Always check today's real date first** (`date +%Y-%m-%d`). The date part is **today's date**, and `N` is a **per-day counter**:

- If today's date differs from the last build's date → roll to today's date with **`N = 1`**.
- If there is already a build dated today → increment `N` (`.2`, `.3`, …).

Do **not** carry the previous build's date forward and just bump `N`. (Past mistake: a build shipped on 06-27 was wrongly tagged `2026.06.24.6` instead of `2026.06.27.1`.)

## 3. Update the version in all three places

- `app/src/version.ts` → `export const APP_VERSION = '<new>'`
- `CHANGELOG.md` → new top entry `## <new> — <short title>` with a "What's in this build" list and a "Tests:" line
- `CLAUDE.md` → the **Last build** line, and the relevant Phase/plan row status

## 4. Run the gates locally (CI runs these too — green them first)

```
npm --prefix app run typecheck
npm --prefix app run lint
npm --prefix app run format:check    # if it fails: npm --prefix app run format
npm --prefix app test                # vitest (unit)
npm --prefix app exec -- playwright test --config=app/playwright.config.ts   # local E2E
```

## 5. Commit + push (this deploys)

- Branch is `master`; this project commits directly to it.
- Commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- `git push origin master` → CI runs quality gates, then the deploy job publishes to Cloudflare Pages.

## 6. Verify the deploy

Watch the run and confirm both jobs pass:

```
RID=$(gh run list --branch master --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RID --exit-status
```

The deploy job's **"Smoke-test live URL (status + version)"** step checks the live site returns 200 **and** that `<meta name="app-version">` on the live page equals the build just deployed (with CDN-propagation retries). For a manual check, run the production smoke suite:

```
npm --prefix app exec -- playwright test --config=app/playwright.prod.config.ts
```

## Version plumbing (how the smoke checks work)

- `app/src/version.ts` `APP_VERSION` is the single source of truth.
- A Vite plugin (`appVersionMeta` in `app/vite.config.ts`) stamps `<meta name="app-version" content="<APP_VERSION>">` into `index.html` at build time.
- Smoke tests read that meta tag: `e2e/smoke.spec.ts` (local) and `e2e/prod-smoke.spec.ts` (live) assert it matches `APP_VERSION`; the CI deploy step greps it from `dist/index.html` vs the live curl.
- It's also human-visible: the ProfilePicker stamp and the Parent Mode settings line.

See `[[build-number-convention]]` in memory for the one-line rule.

## Enforcement hook

A committed `pre-commit` hook (`.githooks/pre-commit`) blocks a commit that changes `app/src/version.ts` to a build number whose date isn't **today**. It only fires when `version.ts` is staged, so docs/CI-only commits are unaffected. Bypass deliberately with `git commit --no-verify`.

Hooks aren't auto-enabled on clone — activate once per clone:

```
git config core.hooksPath .githooks
```
