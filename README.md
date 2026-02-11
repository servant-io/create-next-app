# Servant Next.js Template

This repository serves as a template or example repository for Servant engineering to use when scaffolding new Next.js applications or enhancing the reliability, maintainability, and scalability of existing Next.js applications.

## About This Template

This is essentially a clean commit of the output from `npx create-next-app@latest` with our standard suite of dev tooling and quality gates layered on top in a single commit. It provides:

- **Standardized Development Environment**: Pre-configured with our preferred tooling
- **Quality Gates**: Built-in linting, formatting, and testing setup
- **Best Practices**: Following Servant engineering standards
- **Maintainability**: Clean, well-documented code structure

## Project Overview

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## servant-pxt Packages

This app uses all 4 packages from the `servant-pxt` monorepo, published to GitHub Packages under the `@servant-io` scope:

| Package               | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| `@servant-io/agents`  | Agent definitions (JSON + markdown templates)                                   |
| `@servant-io/cli`     | CLI binary (`servant`) + library (`linkAgents`, `linkSkills`, `initEngagement`) |
| `@servant-io/skills`  | Skill definitions (JSON + markdown)                                             |
| `@servant-io/actions` | GitHub Action (composite action YAML)                                           |

### Setup

1. **GitHub Token**: You need a `GITHUB_TOKEN` with `read:packages` scope to install from GitHub Packages.

   ```bash
   # Option A: export in your shell
   export GITHUB_TOKEN=ghp_your_token_here

   # Option B: add to .env.local (gitignored)
   echo "GITHUB_TOKEN=ghp_your_token_here" >> .env.local
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Verify** the demo page works:
   ```bash
   pnpm dev
   # Navigate to http://localhost:3000/servant-pxt
   ```

### Verification Checklist

- `pnpm install` succeeds without `file:`/`link:` references
- `pnpm dev` runs, navigate to `/servant-pxt` to see all packages in use
- `pnpm build` passes
- `pnpm lint` passes
- Lockfile entries point to `npm.pkg.github.com`:
  ```bash
  grep "npm.pkg.github.com" pnpm-lock.yaml
  ```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
