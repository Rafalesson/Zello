# Story 1.5: Admin Account Governance

Status: done

## Story

As an Administrator,
I want to view and manage user accounts and doctor applications,
So that I can ensure only qualified professionals join the platform and maintain safety.

## Acceptance Criteria

1. Given an admin in the governance dashboard, when they view the list of pending doctors, then they can see the CRM, details, and approve or reject the application (FR6).
2. Given an admin managing an existing user, when they click to deactivate the account, then the account is marked inactive and the user can no longer log in (FR7, NFR13).

## Tasks / Subtasks

- [x] Schema: Add `isActive` field to User model
- [x] Backend: Admin endpoints
  - [x] GET /admin/doctors/pending — list pending doctors
  - [x] PATCH /admin/doctors/:id/approve — approve doctor
  - [x] PATCH /admin/doctors/:id/reject — reject doctor
  - [x] PATCH /admin/users/:id/deactivate — deactivate user
  - [x] PATCH /admin/users/:id/activate — reactivate user
  - [x] GET /admin/users — list all users with profiles
  - [x] All endpoints protected by AuthGuard + RolesGuard (ADMIN only)
- [x] Backend: Block login for inactive users
- [x] Frontend: Admin governance page at /dashboard/governanca
  - [x] Pending doctors tab with approve/reject actions
  - [x] All users tab with deactivate/reactivate toggle
  - [x] Tab-based navigation, teal palette, success/error feedback
- [x] Build verification: backend + frontend zero errors

## Dev Agent Record

### Agent Model Used
Antigravity (Claude Opus 4.6)

### Debug Log References
- Created new `AdminModule` (service + controller + module) from scratch.
- User model extended with `isActive` Boolean (defaults to true).
- Auth service updated to check `isActive` before granting JWT.
- Admin RBAC uses existing `AuthGuard` + `RolesGuard` + `@Roles('ADMIN')` decorator.

### Completion Notes List
- `AdminService`: 6 methods (getPendingDoctors, approveDoctor, rejectDoctor, deactivateUser, activateUser, getAllUsers).
- `AdminController`: 6 endpoints, all ADMIN-only via RBAC.
- `AuthService.signIn`: Now blocks inactive users with empathetic message.
- Frontend: Governance page with tab UI (Pending Doctors / All Users), real-time updates.
- Admin cannot deactivate other admins (button hidden for ADMIN role).

### File List
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/admin/admin.service.ts` [NEW]
- `apps/backend/src/admin/admin.controller.ts` [NEW]
- `apps/backend/src/admin/admin.module.ts` [NEW]
- `apps/backend/src/app.module.ts`
- `apps/backend/src/auth/auth.service.ts`
- `apps/frontend/src/app/dashboard/governanca/page.tsx` [NEW]
