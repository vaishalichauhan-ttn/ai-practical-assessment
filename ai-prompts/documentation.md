# Documentation Prompt History

## Prompt 1 – JSDoc for Frontend API Functions

### Objective

Ensure frontend API functions follow the project's documentation rules defined in `.cursor/rules/documentation.mdc`.

### Prompt Summary

Asked Cursor to apply the documentation rule after noticing it was not followed during the initial implementation.

### AI Response Summary

The AI explained that `alwaysApply: true` guides code generation but does not automatically modify previously generated code. It then added JSDoc comments to all exported functions in `frontend/src/api/tickets.js` using the project's standard format.

### Review

The follow-up confirmed that all exported API wrapper functions should be documented. JSDoc comments were added to `listTickets`, `getTicket`, and `createTicket`, bringing the file into compliance with the project documentation rules.

### AI Suggestions Accepted

- Add JSDoc comments to all exported functions in `frontend/src/api/tickets.js` according to the project documentation standard.

### AI Suggestions – What I Changed

- NA

### AI Suggestions – What I Rejected and Why

No suggestions were rejected.


## Prompt 2 – Update README (Setup, Run, and Test)

### Objective

Complete Task 7.6 (README: Setup, Run, and Test) by creating comprehensive project documentation for developers and reviewers.

### Prompt Summary

Asked Cursor to update `README.md` using the project documentation as the source of truth. The scope was limited to documenting project setup, environment configuration, database initialization, application startup, testing, and project structure.

### AI Response Summary

Cursor updated the README with step-by-step setup instructions, environment configuration, database migration and seed commands, development and build commands, testing instructions, and a project overview suitable for new developers and reviewers.

### Review

The README satisfied the Task 7.6 completion criteria. A new developer can clone the repository, configure the environment, initialize the database, run the application, and execute the test suite using only the documented instructions.

### AI Suggestions Accepted

- Document project prerequisites and environment configuration.
- Add setup, run, build, and testing instructions.
- Include database migration and seed commands.
- Document the project structure and reviewer setup workflow.

### AI Suggestions – What I Rejected and Why

- No major AI suggestions were rejected.


## Prompt 3 – Swagger (OpenAPI) API Documentation

### Objective

Complete Task 7.5 by adding Swagger/OpenAPI documentation for all implemented backend endpoints, aligned with `api-contract.md`, without changing endpoint behaviour.

### Prompt Summary

Asked Cursor to configure Swagger/OpenAPI, define reusable schemas, document all API endpoints, serve Swagger UI from the app (e.g. `/api-docs`), and verify docs match the implemented API and contract. Clarified that `api-contract.md` is the source of truth.

### AI Response Summary

Cursor reused and aligned `backend/docs/openapi.yaml` with the API contract, mounted Swagger UI at `/api-docs` (and `/api-docs.json`), fixed the local server URL to port `3001`, removed the unused `TicketDetail` schema, added smoke tests for docs availability and endpoint coverage, and updated README/contract pointers to the interactive docs.

### Review

All contract endpoints are documented; request/response schemas match `api-contract.md` and the implementation. Swagger UI loads at `/api-docs`. No authentication scheme was added (out of scope). Application behaviour was unchanged beyond documentation configuration.

### AI Suggestions Accepted

- Serve Swagger UI from `/api-docs` using the existing OpenAPI YAML.
- Keep `api-contract.md` as the source of truth; treat `openapi.yaml` as the machine-readable mirror.
- Add smoke tests for Swagger UI and OpenAPI path coverage.
- Correct OpenAPI server port to `3001` and drop unused `TicketDetail`.

### AI Suggestions – What I Changed

- Clarified that documentation must follow `api-contract.md` rather than treating OpenAPI alone as authoritative.

### AI Suggestions – What I Rejected and Why

- No major AI suggestions were rejected.
