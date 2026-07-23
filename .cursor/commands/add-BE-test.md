Add backend automated tests for the implemented feature.

Use the following documents as the source of truth:

- tasks.md
- acceptance-criteria.md
- api-contract.md

Requirements:

- Follow the backend testing requirements for the current task and phase.
- Add only missing backend tests; do not duplicate existing coverage.
- Use the project's existing testing patterns and utilities.
- Keep tests isolated, deterministic, and readable.

Test the following where applicable:

- Successful request (happy path).
- Request validation.
- Business rule enforcement.
- Error handling (400, 404, 500 where applicable).
- Database persistence and state changes.
- API response body and HTTP status codes.

Use:

- Vitest
- Supertest

Test real HTTP endpoints through the API unless the task specifically requires unit tests.

Reuse existing fixtures, helpers, and test utilities whenever possible.

Do not modify application behavior unless it is required to make the implementation testable. Limit changes to backend tests and supporting test utilities.