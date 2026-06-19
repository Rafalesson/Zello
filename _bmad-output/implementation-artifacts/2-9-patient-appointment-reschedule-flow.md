# Story 2.9: Patient Appointment Rescheduling Flow

## Story Context
**Epic:** Epic 2: Scheduling & Availability
**Story:** 2.9
**Title:** Patient Appointment Rescheduling Flow

## User Story
**As a** Patient,
**I want** to be able to reschedule an upcoming consultation directly from my dashboard,
**So that** I can change my appointment time without having to manually cancel and re-book.

## Acceptance Criteria
1. **Given** a patient viewing their upcoming appointments
   **When** they click "Remarcar" on an appointment that is at least 3 hours away
   **Then** a modal opens displaying the doctor's available dates and times
   **And** they can select a new slot.
2. **Given** the patient selects a new slot and confirms
   **When** the request is sent
   **Then** the system updates the appointment date and time (`PATCH /appointments/:id/reschedule`)
   **And** the previous time slot is restored to the doctor's availability
   **And** an email notification is sent to the doctor informing them of the change.
3. **Given** the patient tries to reschedule an appointment that is less than 3 hours away
   **When** the frontend is rendered
   **Then** the "Remarcar" button is disabled or hidden.

## Technical Context & Implementation Details

### Backend Architecture (`apps/backend/src/appointment`)
- **Controller Endpoint**: Create `@Patch(':id/reschedule')` in `appointment.controller.ts`.
- **Service Logic**: In `appointment.service.ts`, implement `rescheduleAppointment(id, patientProfileId, newDate)`:
  - Verify if the appointment belongs to the patient.
  - Enforce the 3-hour minimum advance time rule.
  - Verify if the `newDate` slot is still available for the doctor.
  - Free up the original slot (restore availability).
  - Reserve the new slot (deduct availability).
  - Update the appointment date to `newDate`.
- **Email Notifications**: Add `sendRescheduleEmailToDoctor` and `sendRescheduleEmailToPatient` in `MailService` to notify both parties of the date change. Trigger them asynchronously (fire-and-forget) to not block the response.

### Frontend Architecture (`apps/frontend/src/app/paciente/consultas`)
- **Reschedule Modal**: Create a `RescheduleAppointmentModal` component.
  - It needs to fetch the doctor's availability using `GET /appointments/availability/:doctorId?date=YYYY-MM-DD`.
  - Display a Calendar Strip for date selection and a grid for time slots (similar to the Doctor Profile booking widget).
- **Integration**: On submit, call `PATCH /appointments/:id/reschedule` with the new date.
  - Handle success (show toast, close modal, update appointment list locally or trigger re-fetch).
  - Handle errors gracefully (e.g. slot taken).

### Testing Requirements
- Unit tests for the new `rescheduleAppointment` service method testing the 3-hour rule enforcement.
- Unit tests for availability slot restoration/deduction logic.

## Status Updates
- Update `sprint-status.yaml` to `in-progress` when starting.
- Mark `done` after code review.
