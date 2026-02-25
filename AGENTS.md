# AGENTS.md

## Cursor Cloud specific instructions

This is a React 19 / Vite 6 / TypeScript 5.8 frontend SPA (Pokédex web app). No backend, no database, no Docker — all data comes from the public PokeAPI GraphQL endpoint.

### Prerequisites

- Node.js 20.x (specified in `.nvmrc`), npm 10.x
- Use `nvm use 20` if the default Node version differs

### Key commands

All standard scripts are in `package.json`. Quick reference:

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 3000, host 0.0.0.0) |
| Lint | `npm run lint` |
| Format check | `npm run format` |
| Type check | `npm run typecheck` |
| Unit tests | `npm test` (Vitest) |
| Build | `npm run build` |
| Full check | `npm run check` (typecheck + boundaries + test + build) |
| E2E tests | `npx playwright install --with-deps && npx playwright test` |

### Non-obvious notes

- The `.env` file is needed for local dev; copy from `.env.example`. No secrets are required — the PokeAPI GraphQL endpoint is public.
- The Vite dev server listens on `0.0.0.0:3000` (not the Vite default 5173), configured in `vite.config.ts`.
- ESLint uses flat config (eslint 9.x); the lint script targets `.ts,.tsx` extensions only.
- Playwright browsers must be installed separately (`npx playwright install --with-deps`) before running E2E tests. This is intentionally not in the update script to avoid bloat.
- The `check:boundaries` script (`tsx scripts/check-import-boundaries.ts`) enforces architectural import rules; it runs as part of `npm run check`.
