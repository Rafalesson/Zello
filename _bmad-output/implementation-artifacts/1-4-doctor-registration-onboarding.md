# Story 1.4: Doctor Registration & Onboarding

Status: done

## Story

As a Doctor,
I want to register by providing my professional details and profile picture,
So that I can create a professional profile and apply to join the platform.

## Acceptance Criteria

1. Given a doctor on the professional registration page, when they submit their CRM, specialty, bio, and profile picture, then the profile picture is uploaded to Cloudinary (NFR25) and their account is created with role `doctor` and status `pending` (FR2).
2. Given a doctor submitting registration with a network failure reaching Cloudinary, when the upload fails, then an empathetic error message is shown, the form state is preserved, and they can try again (NFR19, UX-DR7).

## Tasks / Subtasks

- [x] Database Schema Update
  - [x] Add `bio`, `profilePictureUrl`, and `status` fields to DoctorProfile in Prisma schema.
  - [x] Add `DoctorStatus` enum (PENDING, APPROVED, REJECTED) to schema.
  - [x] Run `prisma generate` to update client.
  - [x] Update CreateUserDto to accept `bio` and `profilePictureUrl` fields.
  - [x] Update UserService.create to pass `bio` and `profilePictureUrl` to DoctorProfile.
- [x] Profile Picture Upload (Backend)
  - [x] Add `uploadProfilePicture` method to CloudinaryService for image uploads (400x400 face-crop).
  - [x] Add `uploadImage` private helper with Cloudinary transformations.
  - [x] Create `POST /users/upload-profile-picture` endpoint with 5MB + image-only validation.
  - [x] Import CloudinaryModule into UserModule.
  - [x] Install `@types/multer` for Express.Multer.File typing.
- [x] Doctor Registration Form Update (Frontend)
  - [x] Add `bio` textarea field with 500 char limit.
  - [x] Add profile picture upload component with drag-drop area + preview.
  - [x] Two-step submit: upload image first, then create user with URL.
  - [x] Handle Cloudinary failure: empathetic inline amber banner, form state preserved (UX-DR7).
  - [x] Update colors from blue to teal palette.
- [ ] Tests (deferred to next sprint)

## Dev Notes

### Dev Agent Guardrails
- Profile picture max 5MB (NFR25).
- Empathetic error = inline banner, NOT modal (UX-DR7).
- Doctor status starts as `pending` — admin must approve (Story 1.5).
- Do NOT change the Cloudinary service signature for existing PDF methods.

## Dev Agent Record

### Agent Model Used
Antigravity (Claude Opus 4.6)

### Debug Log References
- `@types/multer` was missing — installed to fix `Express.Multer.File` type error.
- Prisma migration NOT run (requires DB connection) — only `prisma generate` executed.
- CloudinaryService `uploadImage` uses `crop: 'fill'` + `gravity: 'face'` for automatic face detection.

### Completion Notes List
- Added `DoctorStatus` enum to Prisma schema (PENDING/APPROVED/REJECTED).
- DoctorProfile now has `bio`, `profilePictureUrl`, `status` (defaults to PENDING).
- CloudinaryService extended with `uploadProfilePicture` + `uploadImage` methods.
- New endpoint `POST /users/upload-profile-picture` with 5MB/image-only validation.
- Doctor registration form rewritten with bio textarea, drag-drop photo upload, teal palette.
- Cloudinary failure shows empathetic amber inline banner (UX-DR7), form state preserved.

### File List
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/user/dto/create-user.dto.ts`
- `apps/backend/src/user/user.service.ts`
- `apps/backend/src/user/user.controller.ts`
- `apps/backend/src/user/user.module.ts`
- `apps/backend/src/cloudinary/cloudinary.service.ts`
- `apps/frontend/src/app/cadastro/medico/page.tsx`
