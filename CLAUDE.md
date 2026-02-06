# CLAUDE.md — servant-io/create-next-app

## Repo Overview

Servant Next.js template. Private repo in the `servant-io` GitHub org. Scaffolds standardized Next.js apps with quality gates, testing, and CI/CD.

**Remote:** `git@github.com:servant-io/create-next-app.git`
**Branch:** `pst-agents` (main branch: `main`)
**Owners:** `@pstaylor-patrick`, `@MatthewRamsey`

## Tech Stack

- **Framework:** Next.js 16.0.10 (App Router)
- **React:** 19.2.1
- **Language:** TypeScript 5 (strict mode, noUncheckedIndexedAccess)
- **Styling:** Tailwind CSS 4 via PostCSS
- **Package Manager:** pnpm (v9.12.3 in CI)
- **Node:** 20
- **Fonts:** Geist (via `next/font`)

## Project Structure

```
app/
├── api/v1/items/route.ts      # GET endpoint, API key auth (timing-safe)
├── components/
│   └── CelebrationConfetti.tsx # Client component, respects prefers-reduced-motion
├── layout.tsx                  # Root layout, Geist fonts, metadata
├── page.tsx                    # Home page
├── globals.css                 # Tailwind v4 imports, light/dark theme vars
├── *.test.tsx                  # Vitest unit tests (colocated)
└── *.e2e.ts                    # Playwright E2E tests (colocated)
scripts/
├── test-api.ts                 # API integration test (tsx)
└── test-load.ts                # Load/security testing
.github/
├── workflows/ci.yaml           # 7 parallel CI jobs on push
└── pull_request_template.md    # PR template (TL;DR, Details, How to Test, GIF)
```

## Commands

| Command              | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `pnpm dev`           | Dev server                                                         |
| `pnpm build`         | Production build                                                   |
| `pnpm lint`          | ESLint (`--max-warnings 0`)                                        |
| `pnpm typecheck`     | `tsc --noEmit`                                                     |
| `pnpm format:check`  | Prettier check                                                     |
| `pnpm format`        | Prettier write                                                     |
| `pnpm test`          | Vitest unit/component tests                                        |
| `pnpm test:coverage` | Vitest with 70% threshold (lines, functions, branches, statements) |
| `pnpm test:e2e`      | Playwright (Chrome, `127.0.0.1:3000`)                              |
| `pnpm test:api`      | API integration test (`tsx scripts/test-api.ts`)                   |
| `pnpm test:load`     | Load test with security payloads                                   |
| `postinstall`        | Auto-runs `servant link-agents` on `pnpm install`                  |

## Quality Gates (CI)

All 7 jobs run in parallel on every push (`.github/workflows/ci.yaml`):

1. `format-check` — Prettier
2. `lint` — ESLint zero-warnings
3. `typecheck` — TypeScript strict
4. `build` — Next.js production build
5. `test` — Vitest
6. `test-coverage` — 70% minimum coverage
7. `test-e2e` — Playwright

**CI env:** `API_KEY=test-api-key`

## Code Conventions

- **ESLint:** `require-await: error`, `@next/next/no-img-element: error`, max-warnings=0
- **TypeScript:** Strict mode, `noUncheckedIndexedAccess`, path alias `@/*` → root
- **Formatting:** Prettier (VS Code format-on-save configured)
- **Tests:** Colocated with source (`*.test.tsx`, `*.e2e.ts`). Coverage provider: v8
- **Coverage thresholds:** 70% lines, functions, branches, statements
- **Components:** Use `"use client"` directive only when needed. Respect accessibility (e.g., `prefers-reduced-motion`)
- **API routes:** Use timing-safe comparison for auth. Return proper HTTP status codes

## Servant Agents

Org-shared Claude Code agents distributed via `@servant-io/agents` + `@servant-io/cli` (devDeps, GitHub Packages).

- **postinstall** runs `servant link-agents` — symlinks agent `.md` files from the package into `.claude/agents/servant/`
- Idempotent: skips already-linked agents, safe to re-run
- `.claude/agents/servant/` is gitignored (derived from `node_modules`)
- Auth: `.npmrc` routes `@servant-io` scope to `npm.pkg.github.com` via `$GITHUB_TOKEN`
- See `.context/guides/servant-agents.md` for full details

## Dependencies (current)

**Production:** next, react, react-dom, react-confetti
**Dev:** playwright, tailwindcss, typescript, vitest, coverage-v8, eslint, prettier, tsx, @servant-io/agents, @servant-io/cli

## Environment

- `.env.example` — template with `API_KEY`, `API_BASE_URL`
- `.env.local` — runtime config (gitignored)
- Never commit secrets or `.env` files

---

## Current Task (.context/task.md)
