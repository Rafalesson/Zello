# Retrospective: Epic 2 - Scheduling & Availability

**Date:** 2026-06-19
**Status:** Completed

## 1. Epic Review & Delivery
- **Completed:** 9/9 stories (100% completion)
- **Key Successes:** 
  - Patient Journey Redesign (Vitrine Aberta) delivered a premium SaaS experience.
  - Contextual Login perfectly preserves user intent.
  - Dashboard transformed into a true Command Center.

## 2. Challenges & Technical Debt Identified (Action Items)
During the review phase of stories 2.6 and 2.9, significant structural and security challenges were identified. The team agreed to resolve these 100% before starting Epic 3.

### 2.1 Concurrency & Data Integrity (TOCTOU)
- **Issue:** Separation of availability check and booking execution allows double-booking if multiple requests hit the server simultaneously. Unique constraints on cancelled slots were also problematic.
- **Action Item:** Implement Prisma Transactions (`$transaction`) with row-level locks for all scheduling and rescheduling endpoints to ensure atomic operations.

### 2.2 Timezone Drift & UTC Normalization
- **Issue:** Hardcoded server timezones and lack of UTC standardization caused UI Hydration warnings and potential shift errors for patients in different timezones.
- **Action Item:** Refactor the backend to strictly use `UTC` for all database interactions. The Frontend must consume UTC and format it locally using `Intl.DateTimeFormat`.

### 2.3 API Robustness & Validation
- **Issue:** Missing DTOs and `ParseIntPipe` allowed `NaN` values to crash the Prisma engine (500 Error). Idempotency was missing in `PATCH` requests.
- **Action Item:** Enforce global `ValidationPipe` in NestJS. Guarantee idempotency in `cancel` endpoints (return 200 OK if already cancelled).

### 2.4 Security (ID Leaking)
- **Issue:** Returning `403 Forbidden` for existing IDs belonging to other users, versus `404 Not Found` for non-existent IDs, allows attackers to enumerate the database.
- **Action Item:** Unify error handling for unauthorized access to return `404 Not Found` to prevent data leakage.

### 2.5 Frontend Error Boundaries
- **Issue:** Missing user profiles in certain states caused `TypeErrors` that crashed the entire React tree.
- **Action Item:** Implement robust `Error Boundaries` in Next.js to gracefully catch component errors without unmounting the whole application.

## 3. Next Steps
- Create and execute a Technical Debt Cleanup story (e.g., `Story 2.10` or `Story 3.0`) focused strictly on resolving the 5 action items above.
- Proceed to Epic 3 (Pre-Consultation & Waiting Room) only after the cleanup story is fully approved and merged.
