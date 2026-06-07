# Story 2.2: Doctor Search & Discovery

Status: done

## Story

As a Patient,
I want to search for doctors by specialty,
So that I can find a suitable professional for my needs.

## Acceptance Criteria

1. **Given** a patient on the search page, **when** they filter by a specific medical specialty, **then** a list of available doctors matching that specialty is displayed (FR9).
2. **And** the list includes their photo, name, CRM, and next available date.

## Tasks / Subtasks

- [x] **Task 1: Backend — Create Search Endpoint**
  - [x] 1.1 Add `searchDoctors` method to `UserService` in `user.service.ts` that filters approved and active doctors by specialty, city, state, or name/bio.
  - [x] 1.2 Add helper `calculateNextAvailableSlot` and `formatNextAvailableSlot` to `date.utils.ts` to compute the next available date based on the doctor's weekly Availability.
  - [x] 1.3 Add `GET /users/doctors` to `UserController` that handles query parameters (`q`, `specialty`, `city`, `state`) and returns mapped doctors with next available slot details.
- [x] **Task 2: Backend — Unit Tests**
  - [x] 2.1 Update `user.controller.spec.ts` and `user.service.spec.ts` with comprehensive unit tests for the search logic and endpoints.
  - [x] 2.2 Create `date.utils.spec.ts` to fully test calculation and formatting of the next available slot.
- [x] **Task 3: Frontend — Dynamic Search & Discovery Integration**
  - [x] 3.1 Refactor `/medicos/page.tsx` to include specialty selection quick chips, structured city/state dropdown selections, and a "Clear all" action.
  - [x] 3.2 Fetch list of doctors from the backend `GET /users/doctors` using `api` service inside `useEffect` hook.
  - [x] 3.3 Implement dynamic sorting (Recommended, Highest Rating, Lowest Price) in the search page.
  - [x] 3.4 Support skeleton loading states, empathetic error fallback banners, and empty search results container.
  - [x] 3.5 Configure Next.js images domain for Cloudinary (`res.cloudinary.com`) in `next.config.js` to ensure uploaded avatars render correctly.
  - [x] 3.6 Implement sidebar filters for modal type (Telehealth / In-Person), quick availability (Today, Tomorrow), and max price filter.

## Dev Notes

- **Branding:** Zello.
- **Tech Stack:** Next.js, NestJS, Prisma, PostgreSQL.
- **Date calculations:** Weekly availabilities (0-6) are used to compute the next upcoming calendar date dynamically.

### References

- PRD: [prd.md](file:///home/rafa/Documentos/Projetos/Zello/_bmad-output/planning-artifacts/prd.md)
- Epic Spec: [epics.md](file:///home/rafa/Documentos/Projetos/Zello/_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- Mock ratings and prices are dynamically mapped on the frontend utilizing stable formulas bound to doctor IDs, maintaining visual design fidelity while adhering to the current database schema constraints.

### Completion Notes List

- All backend tests for `UserService`, `UserController`, and `Date Utils` pass successfully.
- Frontend search page connects dynamically to the database, supporting search query, city/state filtering, sorting, and displays the next availability date computed from database records.

### File List

- `apps/backend/src/utils/date.utils.ts`
- `apps/backend/src/utils/date.utils.spec.ts`
- `apps/backend/src/user/user.service.ts`
- `apps/backend/src/user/user.service.spec.ts`
- `apps/backend/src/user/user.controller.ts`
- `apps/backend/src/user/user.controller.spec.ts`
- `apps/frontend/next.config.js`
- `apps/frontend/src/app/medicos/page.tsx`
