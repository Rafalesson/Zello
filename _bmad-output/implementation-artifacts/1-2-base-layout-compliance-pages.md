# Story 1.2: Base Layout & Compliance Pages

Status: done

## Story

As a Patient,
I want to be able to view the platform's academic disclaimer and privacy policy,
So that I understand the legal and academic nature of the service before using it.

## Acceptance Criteria

1. Given the user is navigating any page on the platform, when they scroll to the footer, then an academic disclaimer is prominently displayed (FR44) and there is a link to the Privacy Policy page.
2. Given a user navigates to the privacy policy link, when the page loads, then the full static privacy policy is displayed with proper semantic HTML and styling (FR45).
3. Given the footer component, when it renders, then all branding references are updated from "Zello" to "ImNotMedical".
4. Given the root layout, when it renders, then the HTML metadata (title, description) reflects the ImNotMedical brand.
5. Given a user navigates using keyboard, when they press Tab, then a skip navigation link appears (NFR24).
6. Given the shared package from Story 1.1, when a developer imports `DomainErrorCode`, then a smoke test validates the import works correctly (carry-over from Party Mode review).

## Tasks / Subtasks

- [x] Branding Cleanup (AC: 3, 4)
  - [x] Update root layout metadata from "Zello" to "ImNotMedical".
  - [x] Update Footer component: replace "Zello" branding with "ImNotMedical".
  - [x] Update Footer email/social links to ImNotMedical equivalents.
- [x] Academic Disclaimer in Footer (AC: 1)
  - [x] Add prominent academic disclaimer banner in the footer: "Simulação acadêmica — nenhum dado médico real é processado".
  - [x] Add link to the Privacy Policy page (`/privacidade`).
- [x] Privacy Policy Page (AC: 2)
  - [x] Create `/app/privacidade/page.tsx` with full static privacy policy content.
  - [x] Use proper semantic HTML (`<main>`, `<article>`, `<section>`, `<h1>`, `<h2>`).
  - [x] Apply SSR rendering (Server Component, no `'use client'`).
- [x] Accessibility: Skip Navigation (AC: 5)
  - [x] Add skip navigation link in root layout targeting `#main-content`.
  - [x] Add `id="main-content"` to the main content area.
- [x] Smoke Tests (AC: 6)
  - [x] Create `packages/shared/src/__tests__/domain-error-code.spec.ts` validating enum values.
  - [x] 3/3 tests passing.

## Dev Notes

### Dev Agent Guardrails

**Technical Requirements:**
- Privacy Policy page must be a Server Component (RSC) — no `'use client'`.
- Footer disclaimer must be visible on ALL pages (it's in the root layout).
- Semantic HTML required: `<main>`, `<nav>`, `<section>`, `<article>` (NFR22).
- WCAG AA contrast 4.5:1 for all text (NFR20).
- Skip navigation link must be keyboard-accessible (NFR24).

**Architecture Compliance:**
- Route groups `(public)` and `(authenticated)` should be initialized.
- Privacy policy lives at `app/(public)/privacidade/page.tsx`.
- Footer disclaimer text per PRD: "Simulação acadêmica — nenhum dado médico real é processado".
- Privacy policy link from footer per architecture: `/privacidade`.

**UX Compliance:**
- UX-DR7: Empathetic, non-blocking error patterns.
- NFR20: Contrast ratio ≥ 4.5:1.
- NFR24: Skip navigation on all pages.

### References

- PRD Section: Domain-Specific Requirements → Compliance & Regulatório
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (line 537, 722)
- Epics: Story 1.2 ACs (lines 214-229)

## Dev Agent Record

### Agent Model Used
Antigravity (Claude Opus 4.6)

### Debug Log References
- Privacy policy page created at `/app/privacidade/page.tsx` (not inside route group `(public)` yet — route groups will be restructured when more pages exist).
- Footer fully rewritten with ImNotMedical branding, academic disclaimer banner, and teal color scheme.
- Skip navigation link added with `sr-only` + `focus:not-sr-only` pattern.
- Smoke tests for `DomainErrorCode` enum: 3/3 passing (ts-jest).

### Completion Notes List
- Rebranded entire footer from "Zello" to "ImNotMedical" with teal/amber color scheme.
- Academic disclaimer banner (FR44) rendered on every page via footer.
- Privacy policy (FR45) as static SSR page with semantic HTML.
- Skip navigation (NFR24) targeting `#main-content`.
- Shared package smoke tests added (carry-over from Story 1.1 party mode review).

### File List
