# Debugging Prompt History

## Prompt 1 – Resolve POST /tickets 404 Error

### Objective

Resolve the `404 Route not found` error when calling the `POST /tickets` endpoint during ticket creation.

### Prompt Summary

Asked Cursor to investigate why the ticket creation request returned a 404 error despite the route being implemented.

### AI Response Summary

The AI performed a structured investigation of the routing issue by verifying the route configuration, comparing the running server with the current codebase, and identifying that an outdated backend process was serving stale code instead of the latest implementation.

### Review

The review confirmed that the routing implementation was correct. The root cause was an outdated backend process serving stale code rather than an issue with the route registration or API implementation. I verified that the `POST /api/tickets` endpoint responded successfully after the fix.

### AI Suggestions Accepted

- Compare the running backend with the current codebase to identify inconsistencies.
- Kill the stale backend process and restart the development server so the latest route configuration is loaded.

### AI Suggestions – What I Rejected and Why

No suggestions were rejected. I validated the AI's diagnosis by confirming that the endpoint worked correctly after the server restart.

### Validation

- Verified that the `POST /api/tickets` endpoint responded successfully after Cursor restarted the development server.

---

## Prompt 2 – Resolve Missing Tickets on GET /api/tickets

### Objective

Investigate why previously created tickets were deleted or not returned by the `GET /api/tickets` endpoint and the Tickets list page.

### Prompt Summary

Reported that all previous tickets disappeared from the UI and were no longer returned by the GET API, despite tickets having been created successfully earlier.

### AI Response Summary

The AI traced the ticket read flow from the frontend through the API to the database and confirmed that `GET /api/tickets` returns all rows with no filtering and that no application DELETE endpoint exists. It identified that integration tests were wiping the shared development database: `cleanupTickets()` runs in a `beforeEach` hook and calls `deleteMany()` on all tickets and comments, and tests were using the same `DATABASE_URL` as local development (`support_tickets`).

### Review

The review confirmed the GET API implementation was correct. The root cause was test cleanup deleting all tickets from the dev database before each test case whenever `npm test` was run. Tickets created manually in the UI were lost on the next test run. The AI implemented isolation by pointing tests at a separate `support_tickets_test` database, adding a prepare step for migrations and seeding, and adding a safety guard to refuse cleanup unless the test database URL is in use.

### AI Suggestions Accepted

- Isolate integration tests on a separate database (`support_tickets_test`) so dev data is not wiped.
- Add `loadTestEnv.ts` and `prepareTestDatabase.ts` to configure and prepare the test database before tests run.
- Add a safety guard in `ticketTestHelpers.ts` that refuses `cleanupTickets()` unless the test database is in use.
- Update `vitest.config.ts`, `backend/package.json`, and `backend/.env.example` to support the isolated test database workflow.

### AI Suggestions – What I Rejected and Why

No suggestions were rejected. The isolated test database approach directly addresses the root cause without changing production or development API behavior.

### Validation

- Confirmed all 16 backend integration tests pass against `support_tickets_test`.
- Verified dev tickets remain in `support_tickets` after running `npm test` (e.g. `GET http://localhost:3001/api/tickets` still returns previously created tickets).
- Documented the issue and fix in `debugging-notes.md` for future reference.

---

## Prompt 3 – Resolve Non-Editable Assignee on Ticket Details UI

### Objective

Make the **Assignee** field editable on the Ticket Details page so users can assign or unassign tickets without entering edit mode.

### Prompt Summary

Reported that the assignee field on the UI was not editable, while other sidebar controls such as status were interactive in the default ticket view.

### AI Response Summary

The AI compared the Ticket Details sidebar implementation and found that status used an inline dropdown with immediate `PATCH` updates, but assignee was rendered as static read-only text in view mode. It confirmed the backend already supported assignee updates via `PATCH /api/tickets/:id` and user listing via `GET /api/users`. The fix was frontend-only: add an `AssigneeSelect` dropdown, load users when the ticket loads, and persist changes immediately on selection.

### Review

The review confirmed the root cause was a UI inconsistency, not a backend or API defect. Status was editable inline; assignee required entering edit mode. The inline assignee dropdown aligns assignee behavior with status and matches the two-column sidebar layout already in place.

### AI Suggestions Accepted

- Replace the static assignee display with an inline `AssigneeSelect` dropdown in the Ticket Details sidebar.
- Load users on ticket mount so the dropdown is populated without entering edit mode.
- Persist assignee changes immediately via `PATCH /api/tickets/:id` on selection.
- Update `TicketDetailPage` frontend tests for inline assign, unassign, and API error handling.

### AI Suggestions – What I Rejected and Why

No suggestions were rejected. The inline dropdown approach matched the existing status control pattern and required no backend changes.

### Validation

- Verified assignee is editable from the Ticket Details sidebar without clicking **Edit Ticket**.
- Confirmed assign and unassign both persist via the API.
- Ran `TicketDetailPage` frontend tests — all 25 passed.
