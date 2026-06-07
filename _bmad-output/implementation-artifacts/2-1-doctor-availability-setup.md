# Story 2.1: Doctor Availability Setup

Status: done

## Story

As a Doctor,
I want to configure my available time slots for consultations,
So that patients know when they can book appointments with me.

## Acceptance Criteria

1. **Given** a doctor is logged into their dashboard, **when** they navigate to the availability settings, **then** they can define their working days and hours (FR8).
2. **Given** the doctor submits their availability schedule, **when** the save action is processed, **then** the schedule is securely saved in the database associated with the doctor's profile.
3. **Given** an unauthorized user or patient, **when** they attempt to access or modify availability, **then** the system returns a 403 Forbidden error (NFR13).

## Tasks/Subtasks

- [x] **Task 1: Prisma Schema — Add Availability Model**
  - [x] 1.1 Add `Availability` model to `schema.prisma` with fields: `id`, `doctorProfileId`, `dayOfWeek` (Int 0–6), `startTime` (String HH:mm), `endTime` (String HH:mm), `slotDurationMinutes` (Int, default 30), `isActive` (Boolean, default true), `createdAt`, `updatedAt`
  - [x] 1.2 Add relation from `DoctorProfile` to `Availability[]`
  - [x] 1.3 Run `npx prisma db push` to sync schema with database and generate client

- [x] **Task 2: Backend — Availability NestJS Module**
  - [x] 2.1 Create `availability.module.ts` importing PrismaModule and registering controller/service
  - [x] 2.2 Create `availability.service.ts` with methods: `getByDoctor(doctorProfileId)`, `upsert(doctorProfileId, slots[])`
  - [x] 2.3 Create `update-availability.dto.ts` with class-validator decorators for incoming slot data
  - [x] 2.4 Create `availability.controller.ts` with `GET /availability` (returns current doctor's slots) and `PUT /availability` (upserts slots), both protected by `@UseGuards(AuthGuard, RolesGuard)` and `@Roles('DOCTOR')`
  - [x] 2.5 Register `AvailabilityModule` in `app.module.ts`

- [x] **Task 3: Backend — Validation & Error Handling**
  - [x] 3.1 Validate that `endTime > startTime` in service layer; throw `BadRequestException` if violated
  - [x] 3.2 Validate `dayOfWeek` is 0–6 and `slotDurationMinutes` is in [15, 30, 45, 60]
  - [x] 3.3 Ensure 403 is returned for PATIENT or unauthenticated users (covered by guards)

- [x] **Task 4: Backend — Unit Tests**
  - [x] 4.1 Create `availability.service.spec.ts` with happy-path test: saving valid schedule returns persisted data
  - [x] 4.2 Add error-path test: endTime before startTime throws BadRequestException
  - [x] 4.3 Add error-path test: invalid dayOfWeek throws BadRequestException

- [x] **Task 5: Frontend — Agenda Page & Availability Form**
  - [x] 5.1 Create `apps/frontend/src/app/dashboard/agenda/page.tsx` as client component
  - [x] 5.2 Build `AvailabilityForm` component with day-of-week toggles (Seg–Dom), time pickers (startTime/endTime), and slot duration selector
  - [x] 5.3 Apply Tematização Clínica Boutique: Slate 50/800, Teal 600, full dark mode support
  - [x] 5.4 Ensure accessibility: labels for all inputs, focus rings, empathetic toast feedback on save

- [x] **Task 6: Frontend — API Integration**
  - [x] 6.1 Fetch existing availability on page load via `GET /availability`
  - [x] 6.2 Submit updated availability via `PUT /availability` with optimistic feedback (toast)
  - [x] 6.3 Handle error states (network errors, validation errors from backend)

## Dev Notes

### Architecture & Requirements Context
- **Tech Stack:** Next.js 16 (App Router), React 19, NestJS, Prisma, PostgreSQL, Tailwind CSS.
- **Frontend Path:** Create a new page `apps/frontend/src/app/dashboard/agenda/page.tsx` or handle it in `apps/frontend/src/app/dashboard/configuracoes/page.tsx`. Given the design, a dedicated tab or sub-page in the dashboard is recommended.
- **Backend Path:** Create a new module in `apps/backend/src/availability/` (or update existing `doctor` module if it makes more sense architecturally).
- **Prisma Schema:** You will likely need to update `schema.prisma` to add an `Availability` or `Schedule` model. Example fields: `doctorId`, `dayOfWeek`, `startTime`, `endTime`, `slotDuration`. Run `npx prisma db push` or `npx prisma migrate dev` after updating.

### Previous Story Intelligence
- **Branding:** The project name is **Zello**. Ensure this is used in any copy.
- **Tests:** When writing backend tests and mocking users, remember to set `isActive: true` so the authentication guard allows the request.
- **UX & Theming:** Use the established "Tematização Clínica Boutique": Slate 50 (Off-white), Slate 800 (Dark Blue), and Teal 600. Ensure full Dark Mode support using `dark:bg-slate-900`, `dark:bg-slate-800`, `dark:text-slate-200`, and `dark:border-slate-600`.
- **Accessibility:** Ensure all inputs have associated labels and focus rings (`focus:ring-2 focus:ring-teal-500`). Use non-blocking empathetic toasts for feedback (UX-DR7).

### File Structure Requirements
- **Backend:**
  - `apps/backend/src/availability/availability.module.ts`
  - `apps/backend/src/availability/availability.controller.ts`
  - `apps/backend/src/availability/availability.service.ts`
  - `apps/backend/src/availability/dto/update-availability.dto.ts`
- **Frontend:**
  - `apps/frontend/src/app/dashboard/agenda/page.tsx` (Client component or RSC with client form)
  - Components should ideally be broken down (e.g., `AvailabilityForm.tsx`).

### Testing Requirements
- Add a test in `availability.service.spec.ts` for happy path (saving schedule).
- Add a test for error path (e.g., end time before start time).

## Dev Agent Record

### Implementation Plan
- Task 1: Add Availability model to Prisma schema with composite unique constraint on (doctorProfileId, dayOfWeek, startTime), related to DoctorProfile. Used `prisma db push` instead of `migrate dev` due to pre-existing drift in migrations.
- Task 2: Created full NestJS module (module, service, controller, DTO) following existing project patterns. Service uses Prisma transactions for atomic upsert (delete-all + create-many). Controller protected by AuthGuard + RolesGuard with @Roles('DOCTOR').
- Task 3: Business validation in service layer for time ordering and day range. DTO validation via class-validator for format and allowed values.
- Task 4: 7 unit tests covering happy path, error paths (invalid time, invalid day), and edge case (empty slots).
- Task 5: Full client-side page with day toggles, per-day time pickers, slot duration selectors, toast notifications, loading state, dark mode, and accessibility.
- Task 6: Axios integration via existing `api` service. GET on mount, PUT on save, error handling with user-friendly messages.

### Debug Log
- Used `prisma db push` instead of `prisma migrate dev` because the database had schema drift from prior manual changes.
- Pre-existing test failure in `templates.service.spec.ts` (date formatting) — not related to this story.
- Pre-existing TypeScript errors in `sidebar/index.tsx` (ADMIN role type mismatch) — not related to this story.

### Completion Notes
- ✅ All 7 availability-specific unit tests pass
- ✅ All 20 relevant tests (availability + auth) pass with no regressions
- ✅ Frontend page compiles without TypeScript errors
- ✅ Sidebar already includes "Agenda" nav link to `/dashboard/agenda` for DOCTOR role
- ✅ Full dark mode support with Tematização Clínica Boutique design system
- ✅ Accessibility: all inputs have labels, focus rings, aria attributes, toast with role="alert"

## File List
- `apps/backend/prisma/schema.prisma` (modified — added Availability model + DoctorProfile relation)
- `apps/backend/src/availability/availability.module.ts` (new)
- `apps/backend/src/availability/availability.controller.ts` (new)
- `apps/backend/src/availability/availability.service.ts` (new)
- `apps/backend/src/availability/availability.service.spec.ts` (new)
- `apps/backend/src/availability/dto/update-availability.dto.ts` (new)
- `apps/backend/src/app.module.ts` (modified — registered AvailabilityModule)
- `apps/frontend/src/app/dashboard/agenda/page.tsx` (new)
- `apps/frontend/src/app/globals.css` (modified — added toast slide-in animation)

### Review Findings

- [x] [Review][Patch] Toast useEffect não reseta timer para toasts consecutivos do mesmo tipo [`agenda/page.tsx:52-57`]
- [x] [Review][Patch] Catch vazio no loadAvailability — sem feedback ao usuário (viola UX-DR7) [`agenda/page.tsx:84-86`]
- [x] [Review][Defer] Sem validação de sobreposição de slots no mesmo dia [`availability.service.ts:26-37`] — deferred, será necessário no Epic 2 Story 2-3
- [x] [Review][Defer] Cross-midnight schedules rejeitados pela comparação lexicográfica [`availability.service.ts:27`] — deferred, plantonistas fora do escopo do MVP
- [x] [Review][Defer] Sem onDelete cascade na relação Availability → DoctorProfile [`schema.prisma`] — deferred, pattern consistente com o projeto
- [x] [Review][Defer] IDs regenerados a cada save (delete+create) — deferred, aceitável enquanto nada referencia availabilityId

## Change Log
- 2026-06-04: Implemented full availability module (backend + frontend) for Story 2.1. Added Prisma Availability model, NestJS module with RBAC-protected endpoints, 7 unit tests, and frontend agenda page with day toggles, time pickers, and empathetic toast feedback.
- 2026-06-05: Code review concluída. 2 patches (toast timer + catch vazio), 4 deferred (overlap, cross-midnight, cascade, ID regeneration), 4 dismissed.
