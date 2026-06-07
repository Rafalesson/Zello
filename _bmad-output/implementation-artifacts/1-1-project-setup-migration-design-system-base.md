# Story 1.1: Project Setup, Migration & Design System Base

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to migrate the project to Next.js 16, setup the monorepo workspace, and configure the base Design Tokens,
so that the foundational architecture and visual consistency (UX-DR4) are established for all future features.

## Acceptance Criteria

1. Given the existing NestJS/Next.js 14 brownfield repository, when the migration process is executed, then the project runs on Next.js 16 and React 19 without critical build errors.
2. And a new `@imnotmedical/shared` package is created with TypeScript composite enabled.
3. And the `DomainErrorCode` enum is available in the shared package.
4. And Tailwind is configured with the Slate 50, Slate 800, and Teal 600 design tokens supporting Dark Mode native switching.
5. And the auth middleware (`jose` + JWT) is validated after the update to ensure it continues working.
6. And the root `package.json` name is updated from `zello-monorepo` to `imnotmedical`.
7. And Next.js compilation config includes `transpilePackages: ['@imnotmedical/shared']`.

## Tasks / Subtasks

- [x] Project Migration (AC: 1, 5, 6)
  - [x] Rename root package.json to `imnotmedical`.
  - [x] Upgrade Next.js to v16 and React to v19 in the frontend app.
  - [x] Validate and fix any breaking changes in the auth middleware using `jose`.
  - [x] Verify that existing frontend and backend build successfully.
- [x] Shared Package Setup (AC: 2, 3, 7)
  - [x] Create `packages/shared` directory.
  - [x] Initialize `packages/shared/package.json` with name `@imnotmedical/shared`.
  - [x] Configure `packages/shared/tsconfig.json` with `composite: true`.
  - [x] Create `DomainErrorCode` enum inside the shared package.
  - [x] Add `transpilePackages: ['@imnotmedical/shared']` to frontend `next.config.js`.
  - [x] Add path references in backend/frontend tsconfigs to the shared package.
- [x] Design System Tokens (AC: 4)
  - [x] Update Tailwind config to include Slate 50, Slate 800, and Teal 600.
  - [x] Configure dark mode support (native).
  - [x] Ensure WCAG AA contrast (4.5:1) for base text colors (NFR20).

## Dev Notes

### Dev Agent Guardrails

**Technical Requirements:**
- Next.js 16 with React 19 (App Router).
- Do NOT upgrade Prisma; it must stay at v6.
- Strict TypeScript in frontend and backend (NFR29).
- Zero ESLint warnings/errors (NFR30).

**Architecture Compliance:**
- The `@imnotmedical/shared` package should only contain pure types, enums, events. No React components or Prisma generated types.
- Ensure route groups `(public)` and `(authenticated)` are initialized or prepared for in the frontend directory structure.
- `.env` files must strictly exist inside `apps/backend/` and `apps/frontend/`. No `.env` in the root.

**Library/Framework Requirements:**
- Next.js: v16
- React: v19
- Tailwind CSS: v4
- Validation: The existing jose setup needs to be explicitly tested after the React/Next upgrade.

**File Structure Requirements:**
- `packages/shared/src/index.ts`
- `packages/shared/src/errors/domain-error-code.ts`
- `apps/frontend/next.config.js`
- `package.json` (Root)

### Project Structure Notes

- Alignment with unified project structure:
  - `packages/shared` must be correctly linked in the npm workspaces.

### References

- Architecture Decisions: `_bmad-output/planning-artifacts/architecture.md`

## Dev Agent Record

### Agent Model Used
Antigravity (bmad-dev-story)

### Debug Log References
- Solved React 19 `JSX.Element` typing issue in `AutocompleteSearch.tsx` by upgrading it to `React.ReactNode`.
- Resolved Next.js middleware deprecation by renaming `middleware.ts` to `proxy.ts`.
- Configured npm workspaces in root package.json to find local `packages/*`.

### Completion Notes List
- Migrated React to v19 and Next to v16.2 (latest).
- Configured tailwind inside `app/globals.css` with Slate + Teal palette natively supporting dark mode.
- Created `@imnotmedical/shared` package with TS composite.
- Executed successful build verification for both backend and frontend.

### File List
- `package.json`
- `apps/frontend/package.json`
- `apps/frontend/next.config.js`
- `apps/frontend/tsconfig.json`
- `apps/frontend/src/app/globals.css`
- `apps/frontend/src/components/AutocompleteSearch.tsx`
- `apps/frontend/src/proxy.ts` (renamed from `middleware.ts`)
- `apps/backend/package.json`
- `apps/backend/tsconfig.json`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/errors/domain-error-code.ts`
- `packages/shared/src/index.ts`
