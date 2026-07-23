# Review Fixes

This document records changes made after AI-assisted code reviews. Detailed investigations and troubleshooting steps are documented separately in `debugging-notes.md`.

---

## Review Fix 1 – Ticket Creation Endpoint

### Review Finding

The frontend was unable to create tickets because the ticket creation request returned a **404 Route not found** response.

### Change Made

- Restarted the backend to ensure the latest application code was running.
- Verified the correct ticket routes were registered and accessible.

### Validation

- Confirmed `POST /api/tickets` returned the expected response.
- Verified ticket creation worked successfully from the frontend.

### Related Documentation

See **`debugging-notes.md` – Issue 1** for the investigation details.

---

## Review Fix 2 – Test Database Isolation

### Review Finding

Running automated backend tests removed manually created tickets because the test suite used the same database as the development environment.

### Change Made

- Configured integration tests to use a dedicated test database.
- Added a test database preparation step to create the database, run migrations, and seed required data.
- Added a safety check to prevent cleanup operations from running against the development database.

### Validation

- Verified automated tests no longer modified development data.
- Confirmed tickets created during development remained available after running the test suite.

### Related Documentation

See **`debugging-notes.md` – Issue 2** for the investigation details.

---

## Review Fix 3 – Inline Assignee Editing

### Review Finding

The Ticket Details page allowed inline status updates, but the assignee could only be changed through **Edit Ticket**, resulting in an inconsistent user experience.

### Change Made

- Replaced the read-only assignee display with an inline `AssigneeSelect` component.
- Enabled immediate assignment and unassignment using `PATCH /api/tickets/:id`.
- Updated frontend tests to cover inline assignment, unassignment, and error handling.

### Validation

- Confirmed users can assign and unassign tickets directly from the Ticket Details sidebar.
- Verified all `TicketDetailPage` frontend tests passed.

### Related Documentation

See **`debugging-notes.md` – Issue 3** for the investigation details.