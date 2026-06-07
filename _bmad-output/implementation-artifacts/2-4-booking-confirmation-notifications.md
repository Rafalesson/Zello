# Story 2.4: Booking Confirmation Notifications

## Story Foundation

**User Story:**
As a System,
I want to send email notifications upon booking confirmation,
So that both patient and doctor are informed of the upcoming consultation.

**Acceptance Criteria:**
- **Given** a newly booked consultation
- **When** the booking transaction is successful
- **Then** the system sends a confirmation email to the patient and the doctor (FR14)
- **And** if the email service fails temporarily, the consultation booking is still successful and the failure is logged (NFR18).

**Business Context & Value:**
Providing immediate feedback outside the platform (via email) confirms the transaction and reduces no-shows, increasing trust for both patients and doctors.

## Developer Context & Guardrails

### Technical Requirements
- **Mail Service:** Update `apps/backend/src/mail/mail.service.ts` to include methods like `sendBookingConfirmationToPatient` and `sendBookingConfirmationToDoctor`.
- **Event/Asynchronous Trigger:** The email sending MUST NOT block the HTTP response of the `POST /appointments` endpoint. Use an un-awaited Promise with a `.catch(console.error)` (or similar background mechanism) to ensure the booking remains successful even if the email throws an error.
- **Templates:** Create clean, branded HTML templates (inline CSS using the Slate/Teal colors) for the email bodies, stating the doctor's name, patient's name, and date/time in the correct timezone (Brasília).

### Architecture Compliance
- **Error Handling:** Catch and log all Nodemailer errors. DO NOT throw exceptions back to the appointment controller. (NFR18)
- **Separation of Concerns:** The `AppointmentService` should only call `this.mailService.sendBookingConfirmation(...)`. The HTML generation and Nodemailer usage stay strictly inside `MailService`.

### Library & Framework Requirements
- **Nodemailer:** Already installed and configured in `MailService`. Continue using the Ethereal test account for development.
- **date-fns:** Use `date-fns` for formatting the consultation date in the email (e.g., `dd/MM/yyyy 'às' HH:mm`).
- **NestJS:** Inject `MailService` into `AppointmentModule`.

### File Structure Requirements
- **Backend:** Modify `apps/backend/src/mail/mail.service.ts` and `apps/backend/src/appointment/appointment.service.ts`.
- **Backend Module:** Ensure `MailModule` is exported and imported inside `AppointmentModule`.

### Testing Requirements
- **Unit Tests:** Update `appointment.service.spec.ts` to mock `MailService` and verify it is called without failing the test if the mail service rejects.

## Previous Story Intelligence
- Story 1.7 created the `MailService` using `nodemailer.createTestAccount()`. It logs the Ethereal preview URL to the console.
- Story 2.3 created the `AppointmentService` with the `create` method. It already validates availability and saves the appointment. You just need to hook the email logic at the end of the `create` method before returning.
- The `Appointment` creation might require fetching the patient and doctor details to have their emails and names. You might need to update the `prisma.appointment.create` include statement to return `doctorProfile.user` and `patientProfile.user` so you can access the emails.

## Git Intelligence Summary
- Avoid `fire-and-forget` race conditions in `MailService` initialization causing a crash. For now, since `initializeTransporter` is asynchronous in the constructor, make sure the `send` method gracefully handles if the transporter is not fully initialized or throws.
- Always use the Brasília timezone context when formatting dates to display to the user.

## Tasks/Subtasks

- [x] **Task 1: MailService Update**
  - [x] 1.1 Add `sendBookingConfirmationToPatient(patientEmail, patientName, doctorName, date)` to `MailService`.
  - [x] 1.2 Add `sendBookingConfirmationToDoctor(doctorEmail, doctorName, patientName, date)` to `MailService`.
  - [x] 1.3 Ensure the HTML templates use professional branding (Teal 600, `#0d9488`).
  - [x] 1.4 Handle errors internally inside these methods so they don't crash the caller.

- [x] **Task 2: AppointmentModule Integration**
  - [x] 2.1 Export `MailService` from `MailModule` (if not already exported).
  - [x] 2.2 Import `MailModule` into `AppointmentModule`.
  - [x] 2.3 Inject `MailService` into `AppointmentService`.

- [x] **Task 3: Triggering Emails**
  - [x] 3.1 In `AppointmentService.create()`, after a successful booking, extract the doctor and patient details. You may need to fetch the user emails by `include: { doctorProfile: { include: { user: true } }, patientProfile: { include: { user: true } } }` during creation.
  - [x] 3.2 Format the date safely for display.
  - [x] 3.3 Call the mail service methods asynchronously (e.g., `this.mailService.sendBookingConfirmationToPatient(...).catch(console.error)`).

- [x] **Task 4: Unit Testing**
  - [x] 4.1 Update `appointment.service.spec.ts` to provide a mock `MailService`.
- [x] 4.2 Verify the `create` method still succeeds even if the mock `MailService` throws an error.

### Review Findings
- [x] [Review][Patch] Regressão de Branding (ImNotMedical ao invés de Zello) [apps/backend/src/mail/mail.service.ts:47]
- [x] [Review][Patch] Condição de Corrida na Inicialização do Transporter [apps/backend/src/mail/mail.service.ts:11]
- [x] [Review][Patch] Uso de NestJS Logger em vez de console.error [apps/backend/src/mail/mail.service.ts:109]
- [x] [Review][Patch] Exceção sem Tratamento com Date Inválido no MailService [apps/backend/src/mail/mail.service.ts:87]
- [x] [Review][Defer] Restrição Única ao Reagendar Horários Cancelados [apps/backend/prisma/schema.prisma:171] — deferred, pre-existing

## Dev Agent Record
- **Debug Log:** The user names inside `AppointmentService` create method could potentially be null, which could cause a type error with the string method signature. I added a fallback to `"Paciente"` and `"Médico"`. Installed `date-fns` in `apps/backend` to format the date correctly inside `MailService`.
- **Completion Notes:** All acceptance criteria satisfied. Mock testing for `MailService` works flawlessly. Nodemailer implementation is isolated and handles its own errors so the controller response is not blocked.

## File List
- `apps/backend/package.json`
- `apps/backend/src/mail/mail.service.ts`
- `apps/backend/src/appointment/appointment.module.ts`
- `apps/backend/src/appointment/appointment.service.ts`
- `apps/backend/src/appointment/appointment.service.spec.ts`

## Change Log
- Installed `date-fns` to format dates gracefully.
- Added `sendBookingConfirmationToPatient` and `sendBookingConfirmationToDoctor` to `MailService`.
- Added `MailModule` imports in `AppointmentModule`.
- Triggered emails on `AppointmentService.create` without breaking HTTP cycle.
- Updated `AppointmentService` test suite to handle mock `MailService` injections and verify resilient creation flow.

## Status
Status: done
*Ultimate context engine analysis completed - comprehensive developer guide created.*
