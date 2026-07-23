# Testing Prompt History

## Prompt 1 – Create Cursor Testing Rules

### Objective

Create project Cursor rules for testing (alongside frontend, backend, and database rules) based on the specification and task documents.

### Prompt Summary

Asked Cursor to create `.cursor/rules/` files including `testing-rules` derived from the project spec and tasks, covering how automated tests should be written and run in this repository.

### AI Response Summary

Cursor created `.cursor/rules/testing.mdc` (with matching frontend, backend, and database rules). The testing rule defines Vitest + Supertest for backend API integration tests, React Testing Library for frontend UI tests, unit coverage for the status transition validator, a separate test database, and expectations to cover success and failure paths without mocking business logic in integration tests.

### Review

The testing rule aligns with the project’s integration-first approach and the existing backend/frontend test tooling. It remains the source of guidance for later phase test work.

### AI Suggestions Accepted

- Add a dedicated testing rule covering frameworks, unit vs integration expectations, frontend RTL practices, and test environment isolation.
- Require status-transition coverage and regression runs before completing a feature.

### AI Suggestions – What I Changed

- No changes required

### AI Suggestions – What I Rejected and Why

No suggestions were rejected.

---

## Prompt 2 – Frontend Test Setup

### Objective

Confirm whether frontend automated testing was documented and set up, then add a minimal FE test foundation and update project docs to mention it the same way backend tests are documented.

### Prompt Summary

Asked whether FE test setup or tests were mentioned in any document and whether setup was done. Follow-up: configure a minimal FE test setup (Vitest + React Testing Library) and update all relevant docs to state that frontend automated tests use React Testing Library.

### AI Response Summary

Cursor configured Vitest + React Testing Library in the frontend, added setup (`frontend/src/test/setup.js`), sample tests (`formatDate.test.js`, `App.test.jsx`), npm test scripts (frontend and root), and updated design, plan, acceptance criteria, and related workflow docs so FE testing is documented consistently with backend testing. Verified backend and frontend suites both pass.

### Review

Phase 2 review had flagged missing frontend tests as a gap. This session established the testing infrastructure first; feature-specific component tests were deferred to later phases.

### AI Suggestions Accepted

- Set up Vitest + React Testing Library for the frontend.
- Add sample utility and app-shell tests with mocked API calls.
- Wire root `npm test` to run both backend and frontend suites.
- Update project documentation to mention the FE automated testing setup.

### AI Suggestions – What I Changed

- Accepted the minimal setup and documentation updates as delivered.

### AI Suggestions – What I Rejected and Why

- Did not add feature-specific frontend tests in this session; infrastructure first, then incremental coverage per phase.

---

## Prompt 3 – Isolate Backend Integration Tests (Test Database)

### Objective

Stop integration tests from wiping development ticket data by isolating the backend test suite on a dedicated database.

### Prompt Summary

Investigated missing tickets on `GET /api/tickets` after successful creates. Root cause analysis showed test cleanup (`cleanupTickets()` / `deleteMany`) running against the shared development database whenever `npm test` ran.

### AI Response Summary

Cursor pointed backend integration tests at `support_tickets_test`, added `loadTestEnv.ts` and `prepareTestDatabase.ts`, added a safety guard so cleanup refuses to run unless the test database URL is in use, and updated Vitest config / package scripts / `.env.example` for the isolated workflow.

### Review

Confirmed the GET API was correct. Isolating the test database fixed data loss without changing production or development API behavior. All backend integration tests passed against `support_tickets_test`, and dev tickets remained intact after test runs.

### AI Suggestions Accepted

- Use a separate `support_tickets_test` database for integration tests.
- Add prepare/migrate/seed steps for the test database.
- Guard `cleanupTickets()` so it cannot run against the development database.
- Update Vitest and npm scripts to support the isolated test workflow.

### AI Suggestions – What I Changed

- No changes required

### AI Suggestions – What I Rejected and Why

No suggestions were rejected.

### Validation

- Backend integration tests pass against `support_tickets_test`.
- Dev data in `support_tickets` remains after `npm test`.

---

## Prompt 4 – Add Malformed-ID Integration Test (Phase 2 Follow-up)

### Objective

Harden ticket ID handling and add an integration test for malformed ticket IDs after the Phase 2 implementation review.

### Prompt Summary

Accepted the review recommendation to validate ticket ID format and add a malformed-ID integration test asserting `GET /api/tickets/not-a-uuid` returns `404`. Rejected documenting `fileParallelism: false` in `vitest.config.ts` for now.

### AI Response Summary

Cursor added shared UUID validation, applied it in ticket read/update paths, and added an integration assertion in `tickets.read.test.ts` for malformed IDs. Vitest file parallelism remained disabled without an inline config comment.

### Review

The new test covers the malformed-ID failure path and aligns API behavior with the accepted 404 convention for invalid IDs.

### AI Suggestions Accepted

- Add a malformed-ID integration test for `GET /api/tickets/not-a-uuid`.
- Add shared UUID validation so malformed IDs do not risk a 500.

### AI Suggestions – What I Changed

- No changes required

### AI Suggestions – What I Rejected and Why

- **Document `fileParallelism: false` in `vitest.config.ts`** — Rejected for now to keep config minimal; the setting remains in place without an inline comment.

---

## Prompt 5 – Update Tests After Phase 5 Review

### Objective

Apply Phase 5 review decisions that affect automated tests: frontend comment empty-state expectations, comment-load error coverage, and backend max-length message coverage.

### Prompt Summary

From the Phase 5 review recommendations: reject restoring the “No comments yet.” empty state and update FE tests accordingly; accept independent comment-load error handling; accept optional hardening with an integration test for over-length messages and frontend max-length validation.

### AI Response Summary

Cursor updated frontend tests to drop empty-state expectations, added coverage for inline comment-load failure and `maxLength` on the comment form, and added a backend integration test rejecting messages over 5,000 characters. Application behavior for comments was adjusted only as needed for the accepted UX/error-handling items.

### Review

Tests were brought in line with the final Phase 5 UX (no dedicated empty-state copy) and with API parity for message length. Backend and frontend suites remained green after the updates.

### AI Suggestions Accepted

- Update frontend tests for the chosen empty-list UX and inline comment-load errors.
- Add backend integration test for over-length comment messages.
- Add frontend `maxLength` / submit validation for API parity.

### AI Suggestions – What I Changed

- No changes required

### AI Suggestions – What I Rejected and Why

- **Restore “No comments yet.” empty state** — Rejected; empty list is represented by the comment form only, and FE tests were updated to match.

---

## Prompt 6 – Verify Mandatory Status Transition Integration Tests

### Objective

Confirm whether the mandatory test tier for status-machine rules is fulfilled: integration tests proving valid transitions succeed and invalid transitions are rejected.

### Prompt Summary

Asked Cursor whether the mandatory integration-test tier for state-machine rules (valid succeed / invalid rejected) was fulfilled.

### AI Response Summary

Cursor confirmed the requirement is met by `backend/src/tickets.status.test.ts` (Supertest + real app + DB), with all cases passing. Coverage includes all five valid transitions, invalid skips/reversals/not-in-matrix cases (400 + unchanged DB status), and terminal Closed/Cancelled rejection (including combined field+status PATCH). Unit tests for the pure validator exist separately; the mandatory tier is covered by the integration suite.

### Review

Agreed that the mandatory integration-test tier for status transitions is fulfilled. No additional test work was required for this check.

### AI Suggestions Accepted

- Treat `tickets.status.test.ts` as the fulfillment evidence for the mandatory integration tier.

### AI Suggestions – What I Changed

- No changes required

### AI Suggestions – What I Rejected and Why

No suggestions were rejected.
