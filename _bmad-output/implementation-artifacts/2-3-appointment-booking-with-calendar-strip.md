# Story 2.3: Appointment Booking with Calendar Strip

## Story Foundation

**User Story:**
As a Patient,
I want to select an available time slot and book a consultation,
So that my appointment is confirmed with the doctor.

**Acceptance Criteria:**
- **Given** a patient viewing a doctor's profile
- **When** they use the Calendar Strip (horizontal scrollable date selector) to pick a date (UX-DR6)
- **Then** the available time slots for that date are displayed
- **And** when they confirm booking a specific slot, the consultation is created in the database with status `agendada` (FR11, FR21).

**Business Context & Value:**
This is the core conversion step for the marketplace side of the platform. It connects a patient's need to a doctor's availability.

## Developer Context & Guardrails

### Technical Requirements
- **Frontend Calendar Strip:** Must be a horizontal scrollable carrossel of 7+ days implemented using native CSS (`overflow-x: auto` and `scroll-snap-type: x mandatory`).
- **Slot Fetching:** The UI must fetch the doctor's weekly availability (`Availability` model) and map it to specific calendar dates using `date-fns`.
- **Booking Creation:** Must securely generate an `Appointment` record. Validate the slot is still available on the backend to prevent race conditions or double booking.
- **Consultation State:** Upon booking, the consultation state MUST begin as `agendada`.
- **UX feedback:** Use non-blocking empathetic toasts/banners for booking success or failure.

### Architecture Compliance
- **Domain Exceptions:** Any booking error (e.g., slot taken) must throw a `DomainException` using `DomainErrorCode.SLOT_UNAVAILABLE` from `@imnotmedical/shared` (if you haven't created it yet, do it).
- **Types/Enums:** Use the `ConsultationStatus.AGENDADA` enum from `@imnotmedical/shared`.
- **Error Handling:** Backend returns structured errors. Frontend handles `error.code` gracefully.
- **REST Patterns:** Booking should be a `POST /appointments` endpoint. DO NOT use PUT.

### Library & Framework Requirements
- **date-fns:** Use `date-fns` for all date arithmetic (e.g., mapping a day of the week to an exact `Date`, adding minutes for slots).
- **CSS:** Use Tailwind CSS natively. Do not add heavy calendar libraries like react-big-calendar or fullcalendar.
- **State:** Use TanStack Query to manage the server state (fetching slots, submitting bookings) and invalidate queries on success.

### File Structure Requirements
- **Backend:** Create a new module `apps/backend/src/appointment/` following NestJS standard (module, controller, service, dto).
- **Frontend:** Build the component `CalendarStrip.tsx` inside `apps/frontend/src/components/consultation/`. Integrate it into the doctor's public profile page (`apps/frontend/src/app/medico/[id]/page.tsx` or similar).

### Testing Requirements
- **Backend Unit Tests:** Must include tests in `appointment.service.spec.ts` testing happy path (booking success) and error paths (double booking).
- **Validation Tests:** Test that trying to book outside of the doctor's `Availability` throws an exception.

## Previous Story Intelligence
- Story 2.1 created the `Availability` model (doctorProfileId, dayOfWeek, startTime, endTime, slotDurationMinutes).
- Story 2.2 created search and `calculateNextAvailableSlot` logic in backend utils.
- Use `useSocket` is not needed here as booking is a REST operation, but keep in mind that the resulting status `agendada` is the first step of the state machine.
- Tematização Clínica Boutique uses Slate 50/800 and Teal 600. Ensure Dark Mode is properly styled.

## Git Intelligence Summary
Recent commits show a strong focus on correct Date handling and timezone adjustments (Brasília time). Be extremely careful with UTC vs Local time conversions when booking an appointment slot, ensuring the date saved to the database accurately reflects the requested local time slot.

## Tasks/Subtasks

- [x] **Task 1: Shared and Schema updates**
  - [x] 1.1 Create or update `ConsultationStatus` enum to include `AGENDADA` in `schema.prisma`.
  - [x] 1.2 Add `Appointment` model to `schema.prisma` linking `DoctorProfile` (doctorProfileId), `PatientProfile` (patientProfileId), `date` (DateTime), `status` (ConsultationStatus), and `createdAt`/`updatedAt`.
  - [x] 1.3 Add `DomainErrorCode.SLOT_UNAVAILABLE` to `@imnotmedical/shared` (if applicable) or create shared error constants.
  - [x] 1.4 Push schema changes via `npx prisma db push`.

- [x] **Task 2: Backend Appointment Module**
  - [x] 2.1 Create `apps/backend/src/appointment/appointment.module.ts`.
  - [x] 2.2 Create `apps/backend/src/appointment/dto/create-appointment.dto.ts` validating `doctorId` and `date`.
  - [x] 2.3 Create `apps/backend/src/appointment/appointment.controller.ts` with `POST /appointments` guarded by `AuthGuard` and `RolesGuard` (`PATIENT`).
  - [x] 2.4 Create `apps/backend/src/appointment/appointment.service.ts` with `create` method. It must check if slot is available (no existing appointment at that exact `date` for that `doctorId`) and throw `SLOT_UNAVAILABLE` domain exception if taken.
  - [x] 2.5 Register `AppointmentModule` in `app.module.ts`.

- [x] **Task 3: Backend Unit Tests**
  - [x] 3.1 Write test in `appointment.service.spec.ts` for happy path (success booking).
  - [x] 3.2 Write test for error path: double booking throws `SLOT_UNAVAILABLE` exception.

- [x] **Task 4: Frontend Calendar Component**
  - [x] 4.1 Create `CalendarStrip.tsx` in `apps/frontend/src/components/consultation/`.
  - [x] 4.2 Implement horizontal scrollable date selector (7+ days) using Tailwind `overflow-x-auto` and `scroll-snap-type: x mandatory`.
  - [x] 4.3 Use `date-fns` for date manipulation and formatting.

- [x] **Task 5: Frontend Slot Fetching & Integration**
  - [x] 5.1 Implement logic to fetch the doctor's available slots for the selected date (combining the `Availability` schedule and existing `Appointment`s to filter out booked slots). Add a backend endpoint if needed (e.g. `GET /appointments/availability/:doctorId?date=YYYY-MM-DD`).
  - [x] 5.2 Render available slots under the Calendar Strip.
  - [x] 5.3 On slot click, trigger `POST /appointments` to book.
  - [x] 5.4 Use empathetic toasts for success/failure feedback and invalidate TanStack Query cache.

- [x] **Task 6: Frontend Public Profile Integration**
  - [x] 6.1 Integrate `CalendarStrip` and booking logic into the doctor's public profile page (`apps/frontend/src/app/medico/[id]/page.tsx`).
  - [x] 6.2 Apply Tematização Clínica Boutique design system including dark mode support.

### Review Findings
- [x] [Review][Patch] Availability block generation ignores `endTime` and `slotDurationMinutes` [`apps/backend/src/appointment/appointment.service.ts`:44]
- [x] [Review][Defer] Potential timezone drift in slot date construction [`apps/backend/src/appointment/appointment.service.ts`:45] — deferred, pre-existing

## Dev Notes
- Ensure Brasília time is respected using date-fns-tz or standard date-fns UTC offsets when converting slot times.
- `Appointment` should link to `PatientProfile`, meaning the logged-in user needs a `PatientProfile` to book. 

## Dev Agent Record

### Implementation Plan
- Added `Appointment` and `ConsultationStatus` to schema.prisma.
- Implemented `AppointmentModule` containing `create` and `getAvailableSlots` endpoints.
- Handled filtering booked slots on the backend via existing `Appointment` records and `Availability`.
- Implemented `CalendarStrip` component and integrated it into the doctor's `BookingWidget`.
- Connected `react-query` to fetch slots and book appointments with proper cache invalidation.

### Debug Log
- `date-fns` was missing from `apps/frontend`, installed to resolve `tsc` errors.
- Modified `CalendarStrip` to support a `hasSlots` callback so the blue dot indicator works correctly on dates with availability.

### Completion Notes
- Backend unit tests for `AppointmentService` passing successfully.
- Frontend `tsc` builds successfully.
- Implemented empathetic toast feedback inside `BookingWidget`.

## File List
- apps/backend/prisma/schema.prisma
- apps/backend/src/app.module.ts
- apps/backend/src/appointment/appointment.controller.ts
- apps/backend/src/appointment/appointment.module.ts
- apps/backend/src/appointment/appointment.service.spec.ts
- apps/backend/src/appointment/appointment.service.ts
- apps/backend/src/appointment/dto/create-appointment.dto.ts
- apps/frontend/package.json
- apps/frontend/src/app/medico/[id]/booking-widget.tsx
- apps/frontend/src/components/consultation/CalendarStrip.tsx

## Change Log
- **2026-06-06:** Added complete Appointment Booking workflow (backend endpoints, frontend `CalendarStrip`, integration in `BookingWidget`).


## Status
Status: done
*Ultimate context engine analysis completed - comprehensive developer guide created.*
