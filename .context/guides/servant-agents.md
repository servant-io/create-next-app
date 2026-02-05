# servant-agents

Org-shared Claude Code agent definitions distributed as an npm package.

## Package

- **Name:** `@servant-io/servant-agents` (devDep)
- **Registry:** GitHub Packages (`npm.pkg.github.com`)
- **Auth:** `.npmrc` at project root routes `@servant-io` scope via `$GITHUB_TOKEN` (needs `read:packages`)
- **Source repo:** `servant-io/servant-agents` (monorepo, `packages/servant-agents`)

## How it works

The package ships markdown agent definitions in `src/agents/` and a CLI binary `servant-agents-link`.

**`pnpm install` triggers `postinstall` which runs `servant-agents-link`:**

1. Reads `src/agents.json` manifest from the package
2. Creates `.claude/agents/servant/` in the consuming project
3. Symlinks each `<agent-name>.md` from the package into that directory
4. Idempotent — skips existing correct links, warns on conflicts

## Bundled agents (v0.1.0)

| Agent                         | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `github-pr-reviewer`          | Code review of GitHub PRs                 |
| `loom-transcript-synthesizer` | Loom video to chapter markers & summaries |
| `package-release`             | Release management for servant-agents     |
| `prd-writer`                  | Create/update PRDs in `.context/`         |
| `sow-distiller`               | Sanitized Statement of Work docs          |
| `stacked-pr-rebase`           | Rebase stacked PRs after squash-merge     |

## Key files

- `package.json` — `"postinstall": "servant-agents-link"`
- `.npmrc` — registry + auth config
- `.gitignore` — `.claude/agents/servant/` excluded (derived from `node_modules`)
- `.claude/agents/servant/*.md` — symlinks (do not edit directly, managed by link script)

## Manual re-link

```sh
pnpm exec servant-agents-link
```

## CI

Requires `GITHUB_TOKEN` with `read:packages` to install the private package. GitHub Actions provides this automatically via `secrets.GITHUB_TOKEN` when configured.
