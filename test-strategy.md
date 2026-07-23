# Test Strategy

## Test Scope

The Support Ticket Management System was tested at multiple levels to verify backend business logic, frontend user behaviour, and API functionality.

Testing was performed alongside implementation rather than as a separate phase. Each implementation phase included the automated tests required for the features delivered in that phase.

### Backend

- Ticket creation
- Ticket retrieval
- Ticket updates
- Ticket assignment
- Status transition rules
- Comments
- Search and filtering
- Validation
- Error handling

### Frontend

- Application routing
- Ticket list and detail pages
- Form validation
- Loading, success, and error states
- Inline assignment
- Shared utilities

Testing tools:

- **Backend:** Vitest + Supertest
- **Frontend:** Vitest + React Testing Library

---

## Unit Tests

Unit tests focus on isolated business logic and shared utilities.

Covered areas include:

- Status transition validator
- Status transition constants
- Shared frontend utilities (e.g. date formatting)
- Shared ticket constants

These tests verify logic independently without requiring HTTP requests or database access.

---

## Component Tests

Frontend component tests verify user-visible behaviour using React Testing Library.

Covered components include:

- Application routing
- Home page health status
- Tickets page
- Create ticket modal
- Ticket Details page
- Comment form
- Assignment controls
- Loading, empty, and error states

API modules are mocked to keep tests deterministic while backend business rules are validated separately through integration tests.

---

## API / Integration Tests

Backend integration tests use Supertest against the running Express application and test database.

Covered functionality includes:

- Create ticket
- Retrieve ticket list
- Retrieve ticket details
- Update ticket fields
- Assign and unassign tickets
- Status transitions
- Add comments
- Search tickets
- Filter tickets
- Combined search and filtering

Integration tests verify:

- Successful requests
- Validation failures
- Business rule enforcement
- Error responses
- Database persistence

A dedicated test database (`support_tickets_test`) is used to isolate automated tests from development data.

---

## Edge Case Tests

The automated test suite includes edge cases such as:

- Missing required fields
- Invalid priorities
- Invalid ticket IDs
- Missing tickets (404)
- Invalid user assignment
- Invalid status transitions
- Terminal status transitions
- Empty search results
- Invalid filters
- Comment messages exceeding the maximum length
- API error handling
- Combined field and status updates on terminal tickets

These tests verify that the API returns the correct HTTP status codes and preserves data integrity.

---

## Tests Not Covered (and Why)

The following areas were intentionally excluded from automated testing because they were outside the scope of the assessment:

- Authentication and authorization (not implemented)
- Pagination (not required)
- Comment editing and deletion (not required)
- Performance and load testing (outside assessment scope)
- Security and penetration testing (outside assessment scope)

These areas would normally be included in a production application but were omitted to focus on the required assessment functionality.