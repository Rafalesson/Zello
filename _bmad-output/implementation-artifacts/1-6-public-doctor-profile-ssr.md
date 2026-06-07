# Story 1.6: Public Doctor Profile (SSR)

Status: done

## Story

As a Patient,
I want to view a doctor's public profile including their CRM and specialty,
So that I can verify their credentials before booking a consultation.

## Acceptance Criteria

1. Given a patient navigating to a doctor's profile URL, when the page loads, then it displays the doctor's photo, name, CRM, specialty, and bio (FR10).
2. And the page loads fast (FCP < 2s) utilizing Next.js server-side rendering (NFR2).

## Tasks / Subtasks

- [x] Backend: Add `findPublicDoctorProfile` to UserService
  - [x] Only returns APPROVED doctors with active accounts
  - [x] Selects only public-safe fields (no email, no password)
  - [x] Includes city/state from address
- [x] Backend: Add `GET /users/doctors/:id/public` endpoint (no auth required)
- [x] Frontend: Create `/medico/[id]/page.tsx` as Server Component (SSR)
  - [x] Dynamic metadata (title, description) with doctor name and CRM
  - [x] Profile card with gradient header, avatar, CRM badge, specialty badge
  - [x] Location badge from address
  - [x] Bio section with whitespace-pre-line
  - [x] Academic disclaimer inline
  - [x] Uses `fetch` with `revalidate: 60` for ISR caching
  - [x] `notFound()` for non-existent or non-approved doctors
- [x] Build: backend + frontend zero errors, route renders as `ƒ (Dynamic)`

## Dev Agent Record

### Agent Model Used
Antigravity (Claude Opus 4.6)

### Debug Log References
- Used `params: Promise<{ id: string }>` pattern (Next.js 16 async params).
- Profile only shown if `status === 'APPROVED'` AND `user.isActive === true`.
- `fetch` with `next: { revalidate: 60 }` for ISR (incremental static regeneration).

### Completion Notes List
- `UserService.findPublicDoctorProfile`: Prisma query with status + isActive filter.
- `UserController`: New public GET endpoint (no AuthGuard).
- SSR page at `/medico/[id]` with gradient card, avatar, badges, bio, disclaimer.
- Dynamic `<title>` and `<meta description>` per doctor.
- Academic disclaimer inline (consistent with FR44).

### File List
- `apps/backend/src/user/user.service.ts`
- `apps/backend/src/user/user.controller.ts`
- `apps/frontend/src/app/medico/[id]/page.tsx` [NEW]
