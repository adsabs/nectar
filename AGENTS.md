# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` — `pages/` (Next.js routes), `components/` (UI, PascalCase with `index.ts` barrels), `lib/` (hooks/services), `utils/` (helpers), `styles/` (CSS).
- Tests: colocated via `__tests__/` and `*.test.ts`/`*.test.tsx` files.
- Mocks: `src/mocks/` (MSW). Enable in dev with `NEXT_PUBLIC_API_MOCKING=enabled`.
- Scripts: `scripts/` (build/utilities). Production artifacts output to `dist/`.

## Build, Test, and Development Commands
- `pnpm dev`: Run Next.js in dev mode on port `8000`.
- `pnpm dev:mocks`: Dev with API mocking enabled (MSW).
- `pnpm build`: Production build via `scripts/build-prod.sh` → `dist/`.
- `pnpm build:local`: Local build via `scripts/build-local.sh` → `dist/`.
- `pnpm start`: Serve built app from `dist/standalone/server.js`.
- `pnpm start:local`: `next start` using `./dist`.
- `pnpm test` | `pnpm test:coverage` | `pnpm test:ci`: Run Vitest (CI adds coverage/retries).
- `pnpm lint`: ESLint/Next lint.
- `pnpm analyze`: Bundle analysis; runs `build-bibstem-index` + `next build`.

## Coding Style & Naming Conventions
- TypeScript; Prettier enforced (2-space indent). Config: `.prettierrc.json`, `.editorconfig`.
- Linting via `eslint.config.mjs` and `next lint`. Fix before PR.
- Components: PascalCase files, re-export through `index.ts`. Hooks: `useX.ts`.
- Files/dirs use kebab-case except React components.

## Testing Guidelines
- Tools: Vitest, @testing-library/react, MSW.
- Naming: `*.test.ts(x)` or under `__tests__/` mirroring source.
- Coverage: keep or improve CI coverage (`pnpm test:ci`).
- Use `pnpm dev:mocks` when manual testing endpoints that rely on mocks.

## Commit & Pull Request Guidelines
- Commits: imperative, concise, scoped; example: `feat(settings): add export tab`.
- Reference issues in body (e.g., `Closes #123`).
- PRs: clear description, steps to verify, screenshots/GIFs for UI changes, note breaking changes, update docs/tests.
- Pre-flight: `pnpm lint` and `pnpm test:ci` pass locally.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` (see `.env.local.sample`).
- Sentry is configured (`sentry.server.config.ts`, `sentry.edge.config.ts`); provide DSN via env.
- Node 18.18+ required (`.nvmrc`). Use `pnpm` (enforced by `preinstall`).

