# Debugging Notes

## Issue 1

### Problem

The `POST /tickets` API returned a **404 Route not found** response when attempting to create a new ticket from the frontend.

### How I Investigated

- Confirmed the backend server was running.
- Verified that the ticket endpoint was registered in the application.
- After the initial checks did not identify the issue, I used AI to investigate further.

### How AI Helped

The AI:
- Traced the request flow from the frontend to the backend.
- Compared the running server with the current codebase.
- Identified that a stale backend process was serving outdated code.
- Suggested checking for port conflicts and restarting the backend process.

### What I Validated

- Confirmed the stale backend process was the root cause.
- Restarted the backend.
- Verified that `POST /api/tickets` returned the expected response.

### Final Fix

Stopped the stale backend process and restarted the server with the latest code. The issue was caused by an outdated server instance rather than an application code defect.

## Issue 2

### Problem

Previously created tickets disappeared from `GET /api/tickets` and the Tickets list page showed fewer tickets than expected (or "No tickets yet").

### How I Investigated

- Confirmed `GET /api/tickets` returns all rows from the database with no filtering.
- Verified there is no application DELETE endpoint for tickets.
- Found integration tests call `cleanupTickets()` in a `beforeEach` hook, which runs `deleteMany()` on all tickets and comments.
- Confirmed tests used the same `DATABASE_URL` as local development (`support_tickets`).

### Root Cause

Running `npm test` wiped every ticket in the shared development database before each test case. Any tickets created manually in the UI were deleted the next time tests ran.

### Final Fix

- Point integration tests at an isolated database: `support_tickets_test`.
- Add a test DB prepare step (`npm run test:db:prepare`) that creates the database, runs migrations, and seeds users.
- Add a safety guard so test cleanup refuses to run unless the test database URL is in use.

### What To Do If Tickets Are Missing Again

1. Check whether tests were run recently against the dev database.
2. Query the dev DB directly: `SELECT COUNT(*) FROM tickets;`
3. Hit `GET http://localhost:3001/api/tickets` directly to rule out frontend issues.
4. Avoid `docker compose down -v`, which removes the Postgres volume and all persisted data.

## Issue 3

### Problem

The **Assignee** field on the Ticket Details page was not editable. Users could change status inline from the sidebar, but assignee appeared as static text and could only be changed after clicking **Edit Ticket**.

### How I Investigated

- Compared the Ticket Details sidebar controls and found status used an inline dropdown with immediate `PATCH` updates.
- Found assignee was rendered as read-only text (`<dd>{ticket.assignedTo?.name ?? "Unassigned"}</dd>`) in view mode.
- Confirmed the backend `PATCH /api/tickets/:id` and `GET /api/users` endpoints already supported assign/unassign; the issue was frontend-only.
- Verified assignee editing worked in edit mode, but not in the default read-only view users see first.

### How AI Helped

The AI:
- Identified the mismatch between inline-editable status and read-only assignee in view mode.
- Added an `AssigneeSelect` dropdown to the sidebar, matching the existing `StatusSelect` pattern.
- Loaded users when the ticket loads so the dropdown is populated without entering edit mode.
- Wired assignee changes to `PATCH /api/tickets/:id` immediately on selection (assign or unassign).
- Updated frontend tests for inline assignee editing, unassign, and API error handling.

### What I Validated

- Confirmed assignee is editable from the Ticket Details sidebar without entering edit mode.
- Verified selecting a user assigns the ticket and selecting **Unassigned** clears the assignee.
- Ran `TicketDetailPage` frontend tests — all 25 passed.

### Final Fix

Replaced the static assignee display with an inline `AssigneeSelect` dropdown on the Ticket Details page. Users can now assign or unassign tickets directly from the sidebar, consistent with how status changes work.