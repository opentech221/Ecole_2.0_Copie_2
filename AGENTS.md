# AGENTS.md

## Project overview
Ecole 2.0 is a React + TypeScript web application for primary-school management, built with Vite and backed by Supabase.

## Tech stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase
- Vitest (unit/integration tests)
- Playwright (end-to-end tests)

## Repository structure
- `src/app/` – app entry flows and route-level composition
- `src/components/` – shared UI components
- `src/modules/` – feature modules
- `src/services/` – API and service-layer integrations
- `src/hooks/` – reusable React hooks
- `supabase/` – database migrations and Supabase config
- `tests/` – end-to-end and integration-oriented test assets
- `guidelines/` – project-specific operational and UI guidance

## Setup and common commands
Use `pnpm` for local development and CI parity.

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run test
pnpm run test:e2e
```

## Agent working rules
1. Prefer minimal, surgical changes that stay within the requested scope.
2. Reuse existing patterns and components before introducing new abstractions.
3. Keep role- and school-data isolation assumptions intact when touching Supabase or access logic.
4. For database changes, use migrations in `supabase/migrations` and keep local reset/preflight workflows passing.
5. Validate changes with the smallest relevant existing checks before finalizing.
6. Never commit secrets; use environment variables for sensitive configuration.

## Quality gate expectations
Before finishing non-trivial changes, run:
- `pnpm run build`
- `pnpm run test`

For backend/schema-impacting work, also run:
- `pnpm run db:preflight`
- `pnpm run db:integrity:local`

## Documentation expectations
Update `README.md` and/or files under `guidelines/` when behavior, setup, or operational workflows change.
