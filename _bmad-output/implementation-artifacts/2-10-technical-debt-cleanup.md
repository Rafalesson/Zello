# Story 2.10: Technical Debt Cleanup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to resolve the critical technical debt identified during Epic 2,
so that the platform is secure, stable, and ready for Epic 3 features.

## Acceptance Criteria

1. Concurrency & Data Integrity (TOCTOU): All scheduling and rescheduling endpoints use Prisma `$transaction` with row-level locks to prevent double-booking.
2. Timezone Drift & UTC Normalization: Backend strictly uses `UTC` for all database interactions. Frontend consumes UTC and formats it locally using `Intl.DateTimeFormat`.
3. API Robustness & Validation: Global `ValidationPipe` is enforced in NestJS. Idempotency is guaranteed in `cancel` endpoints (returns 200 OK if already cancelled).
4. Security (ID Leaking): Error handling for unauthorized access returns `404 Not Found` instead of `403 Forbidden` to prevent data leakage.
5. Frontend Error Boundaries: Robust `Error Boundaries` are implemented in Next.js to gracefully catch component errors without unmounting the whole application.

## Tasks / Subtasks

- [x] Task 1: Resolve Concurrency & Data Integrity (AC: 1)
  - [x] Implement Prisma `$transaction` in booking endpoints
  - [x] Implement Prisma `$transaction` in rescheduling endpoints
  - [x] Add row-level locks to prevent double-booking

- [x] Task 2: Standardize Timezones to UTC (AC: 2)
  - [x] Refactor backend to save and handle all dates in UTC
  - [x] Refactor frontend components to display dates using local timezone via `Intl.DateTimeFormat`

- [x] Task 3: Enhance API Robustness (AC: 3)
  - [x] Enable global `ValidationPipe` in `main.ts` with strict rules
  - [x] Update `cancel` endpoint logic to be idempotent (return 200 OK if already cancelled)
  - [x] Ensure all DTOs use class-validator correctly

- [x] Task 4: Fix Security ID Leaking (AC: 4)
  - [x] Review endpoints that check existing resources (appointments, etc.)
  - [x] Change unauthorized errors to throw 404 instead of 403 when checking IDs

- [x] Task 5: Implement Frontend Error Boundaries (AC: 5)
  - [x] Create a global Next.js Error Boundary component
  - [x] Apply Error Boundaries to critical sections (like dashboard, profiles) to catch TypeErrors gracefully

## Dev Notes

- Relevant architecture patterns and constraints:
  - Backend: NestJS, Prisma ORM, DomainExceptionFilter
  - Frontend: Next.js App Router, React Server/Client Components
  - Ensure compatibility with `@imnotmedical/shared` package types.
  - Follow the established naming patterns (e.g., PascalCase for models/classes, camelCase for variables).

- Source tree components to touch:
  - Backend: `apps/backend/src/main.ts`, `apps/backend/src/appointment/`, `apps/backend/src/common/filters/`
  - Frontend: `apps/frontend/src/app/error.tsx` (or specific boundary components), `apps/frontend/src/components/`, utils for date formatting.

- Testing standards summary:
  - Ensure backend services have happy/error path tests.
  - Test idempotency and concurrent requests.

### Project Structure Notes

- Alignment with unified project structure: The backend changes are mostly in existing modules or core configuration. The frontend changes involve adding generic error boundaries.
- Detected conflicts or variances: None.

### References

- [Source: _bmad-output/implementation-artifacts/epic-2-retro.md#2-Challenges--Technical-Debt-Identified-Action-Items]
- [Source: _bmad-output/planning-artifacts/architecture.md]

## Dev Agent Record

### Agent Model Used

Gemini 3.1 Pro (High)

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- _bmad-output/implementation-artifacts/2-10-technical-debt-cleanup.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
