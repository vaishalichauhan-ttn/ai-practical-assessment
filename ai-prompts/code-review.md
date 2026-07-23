# Code Review Prompt History

## Prompt 1 – Phase 1 Implementation Review

### Objective

Review the Phase 1 (Ticket Creation & Persistence) implementation for compliance with the project specification, architecture, code quality, validation, error handling, and potential issues.

### Prompt Summary

Used the `.cursor/commands/implemetation-review.md` command to evaluate the Phase 1 changes, including backend ticket creation APIs, frontend Tickets page with Create Ticket modal, validation handling, and integration tests.

### AI Response Summary

The AI performed a read-only review and reported that Phase 1 is in good shape overall. It identified strengths in specification compliance, layered architecture, error handling, backend integration tests, and the modal-based frontend workflow.

### Review

The review aligned with the project documentation and accurately reflected the current implementation state. The main functional gap noted — tickets not loading from the API until Phase 2 — is expected for the current milestone. 

### AI Suggestions Accepted

- Proceed with Phase 1 as complete and address ticket loading in Phase 2.
- Add integration tests for boundary validation (whitespace-only fields, max-length limits, invalid `X-User-Id`).
- Improve modal accessibility with focus management and scroll locking.

### AI Suggestions – What Changed after review suggestion accepted

- No code changes were made during this review session; findings were documented for follow-up.

### AI Suggestions – What I Rejected and Why

- No review recommendations were rejected.

---

## Prompt 2 – Phase 2 Implementation (Ticket Listing & Details) Review

### Objective

Review the Phase 2 (Ticket Listing & Details) implementation for compliance with the project specification, layered architecture, code quality, validation, error handling, and potential issues.

### Prompt Summary

Used the `.cursor/commands/implemetation-review.md` to evaluate the Phase 2 changes, including `GET /api/tickets`, `GET /api/tickets/:id`, the Tickets list page, Ticket Detail page, list-to-detail navigation, and read integration tests.

### AI Response Summary

The AI performed a read-only review and rated the implementation as **strong and ready to proceed to Phase 3**. It confirmed specification compliance, correct layered architecture, stable API response shapes, appropriate error handling, and solid backend integration test coverage. Minor gaps were noted: no UUID format validation on ticket IDs, duplicated `formatDate` in frontend pages, title-only list navigation, no frontend tests, and full list refetch after create instead of optimistic update.

### Review

The review accurately reflected the Phase 2 implementation against `tasks.md`, `api-contract.md`, and the agreed UI decisions (Tickets as primary page, modal-based create workflow, read-only detail view). No critical bugs or spec violations were found. Follow-up improvements were recommended as hardening and UX polish rather than blockers for Phase 3.

### AI Suggestions Accepted

- **Validate ticket ID format** — Add a shared UUID check so malformed IDs consistently return `404` instead of risking a `500`.
- **Extract shared frontend utilities** — Move `formatDate` to `utils/formatDate.js` to avoid drift between pages.
- **Improve list row navigation** — Make the entire table row clickable while keeping the title link accessible.
- **Add a malformed-ID integration test** — Assert `GET /api/tickets/not-a-uuid` returns `404`.
- **Optimistic list update on create** — Reintroduce prepending the new ticket to the list instead of refetching the full list after creation.

### AI Suggestions – What Changed after review suggestion accepted

- Added `backend/src/validators/uuid.ts` and applied `isValidUuid()` in `ticketService.getById()` and `requestContext` middleware.
- Added an integration test for malformed ticket IDs in `tickets.read.test.ts`.
- Created `frontend/src/utils/formatDate.js` and updated `TicketsPage` and `TicketDetailPage` to use it.
- Made ticket table rows clickable with keyboard support; kept the title link with `stopPropagation` for direct navigation.
- Restored optimistic list updates on create via `toListItem()` in `TicketsPage`.
- Added `.ticket-row` styles for cursor and focus-visible outline.

### AI Suggestions – What I Rejected and Why

- **Document `fileParallelism: false` in `vitest.config.ts`** — Rejected for now to keep config minimal; the setting remains in place but without an inline comment until a broader testing documentation update.

---

## Prompt 3 – Phase 3 Implementation (Ticket Update & Assignment) Review

### Objective

Review the Phase 3 (Ticket Update & Assignment) implementation for compliance with the project specification, layered architecture, code quality, validation, error handling, and potential issues.

### Prompt Summary

Used the `.cursor/commands/implemetation-review.md` command to evaluate the Phase 3 changes, including `PATCH /api/tickets/:id`, `GET /api/users`, the Ticket Details edit form, assignee dropdown, validation error display, and update/assignment integration and frontend tests.

### AI Response Summary

The AI performed a read-only review and rated the implementation as **meeting Phase 3 completion criteria**. It confirmed correct layered architecture, API contract alignment for update and users endpoints, assign/unassign handling, `404` behaviour, and solid test coverage. Validation was a primary focus: field rules for create and update were duplicated in `ticketService.ts` rather than shared. Other findings included coupled ticket/users loading on the detail page, missing client-side validation on the edit form, an unnecessary full detail fetch before update, duplicated `PRIORITY_OPTIONS` on the frontend, `status` silently ignored when present on `PATCH`, and test gaps for terminal-status updates and empty-field PATCH validation.

### Review

The review accurately reflected the Phase 3 implementation against `tasks.md`, `api-contract.md`, and the agreed UI decisions (updates on the Ticket Details page, assignee dropdown from users API, inline validation errors). No P0/P1 correctness bugs were found in the update/assign/unassign flows. Follow-up items were recommended as maintainability, UX consistency, and test hardening rather than blockers for Phase 4.

### AI Suggestions Accepted

- **Extract shared field validators** — Refactor `validateTitle`, `validateDescription`, and `validatePriority` in `ticketService.ts` and reuse from create and update with appropriate required/optional semantics.
- **Decouple ticket and users loading** — Load the ticket on mount for immediate read-only view; fetch users when entering edit mode with targeted assignee load errors.
- **Add client-side validation on edit form** — Validate non-empty title and description before submit, matching `CreateTicketModal`.
- **Use lightweight existence check before update** — Replace full detail fetch with `existsById()` in the repository.
- **Extract shared frontend constants** — Move `PRIORITY_OPTIONS` to `frontend/src/constants/ticket.js`.
- **Extend test coverage** — Add backend tests for empty-field PATCH and terminal-status field updates; add frontend tests for cancel, loading, client validation, and assignee load failure.
- **Add JSDoc on `ticketService.update()`** — Document the non-trivial update service method per project documentation rules.

### AI Suggestions – What Changed after review suggestion accepted

- Extracted `validateTitle`, `validateDescription`, and `validatePriority` in `ticketService.ts` and wired them into create and update validation.
- Added `ticketRepository.existsById()` and used it in `ticketService.update()` instead of `findById()`.
- Refactored `TicketDetailPage` to load only the ticket on mount; users are fetched on edit with loading and targeted error states.
- Added client-side validation for empty title and description on the edit form.
- Created `frontend/src/constants/ticket.js` and updated `CreateTicketModal` and `TicketDetailPage` to use shared `PRIORITY_OPTIONS`.
- Added JSDoc to `ticketService.update()`.
- Extended `tickets.update.test.ts` with empty title/description, `Closed`, and `Cancelled` field-update cases.
- Extended `TicketDetailPage.test.jsx` with loading, deferred user loading, cancel edit, client validation, and assignee load failure tests.

### AI Suggestions – What I Rejected and Why

- **Reject or explicitly defer `status` on PATCH in Phase 3** — Rejected because status transition enforcement is Phase 4 scope; interim rejection logic would duplicate work planned for the status transition engine.

---

## Prompt 4 – Phase 4 Implementation (Status Transition Engine) Review

### Objective

Review the Phase 4 (Status Transition Engine) implementation for compliance with the project specification, layered architecture, code quality, validation, error handling, and potential issues.

### Prompt Summary

Used the `.cursor/commands/implemetation-review.md` command to evaluate the Phase 4 changes, including `StatusTransitionValidator`, status handling on `PATCH /api/tickets/:id`, terminal-state rules, Ticket Details status dropdown UI, transition error display, and status unit/integration/frontend tests.

### AI Response Summary

The AI performed a read-only review and rated the implementation as **strong and ready for Phase 5 (Comments)**. It confirmed all five required transitions work, invalid/skipped/reversed/terminal attempts return `400` with correct messages, terminal tickets still allow non-status field updates, and test coverage is solid (62 backend, 17 frontend tests at review time). Minor gaps were noted: read-mode immediate status change on select, edit-mode status errors only in the banner, duplicated status constants on frontend, missing combined PATCH integration test, unused `getAllowedNextStatuses` after frontend filtering was removed, and carry-over field validator duplication in `ticketService.ts`.

### Review

The review accurately reflected the Phase 4 implementation against `tasks.md`, `api-contract.md`, and the agreed UI decisions (status dropdown, backend-authoritative transitions, two-column Ticket Details layout). No critical bugs or spec violations were found. Follow-up items were recommended as UX polish, test hardening, and maintainability rather than blockers for Phase 5.

### AI Suggestions Accepted

- **Edit-mode status field errors** — Map status transition failures to `fieldErrors.status` for inline feedback under the status dropdown.
- **Combined PATCH integration tests** — Add tests for updating `status` with other fields in one request, and for `Closed` tickets where `status` is sent with other fields (must reject without persisting field changes).
- **Frontend status UX helper** — Reintroduce transition hints on the status dropdown by disabling invalid options based on the current server status; backend remains authoritative.
- **Field-level status error shape** — Add `{ field: "status", message: "..." }` to transition `400` responses for consistent API error structure.
- **Extract shared field validators** — Move create/update field validation from `ticketService.ts` into a reusable `ticketValidators` module.

### AI Suggestions – What Changed after review suggestion accepted

- Created `backend/src/validators/ticketValidators.ts` and refactored `ticketService.ts` to use shared validators.
- Transition `400` responses now include `details: [{ field: "status", message: "..." }]`.
- Added integration tests in `tickets.status.test.ts` for combined PATCH and terminal ticket with `status` in body.
- Added `getNextStatuses()` and `isStatusOptionEnabled()` in `frontend/src/constants/ticket.js`; status dropdown disables invalid options for the current status.
- Updated `TicketDetailPage` to surface status errors inline in edit mode via `fieldErrors.status` and API `details`.
- Added/updated frontend tests for disabled status options, inline edit status errors, and status constants helpers.

### AI Suggestions – What I Rejected and Why

- **Read-mode confirmation or Apply button** — Rejected to keep the status workflow simple; immediate dropdown change on select is acceptable for now.
- **Edit-mode title panel styling** — Rejected to avoid scope creep; focus remained on backend validation and status UX behaviour rather than further layout polish.

---

## Prompt 5 – Phase 5 Implementation (Comments) Review

### Objective

Review the Phase 5 (Comments) implementation for compliance with the project specification, layered architecture, code quality, validation, error handling, and potential issues.

### Prompt Summary

Used the `.cursor/commands/implemetation-review.md` command to evaluate the Phase 5 changes, including `POST /api/tickets/:id/comments`, `GET /api/tickets/:id/comments`, comment list and add-comment form on Ticket Details, chronological ordering, validation, and comment integration/frontend tests.

### AI Response Summary

The AI performed a read-only review and rated the implementation as **strong and nearly ready for Phase 6**. It confirmed correct layered architecture, API contract alignment for the separate comments list endpoint, solid backend integration coverage (74 tests), and working add-comment flow with optimistic list updates. Issues noted: missing empty-state UI causing four failing frontend tests, unused `commentsError` state, duplicated `CommentDto`, `tasks.md` Task 5.3 drift from the separate endpoint design, orphaned `TicketDetail` schema in OpenAPI, coupled loading via `Promise.all`, and test gaps for message max length.

### Review

The review accurately reflected the Phase 5 implementation against `tasks.md`, `api-contract.md`, and the agreed API shape (`GET /api/tickets/:id` without comments; comments via `GET /api/tickets/:id/comments`). No critical backend bugs were found. Follow-up items were recommended as frontend UX resilience, documentation alignment, and test hardening rather than blockers for Phase 6.

### AI Suggestions Accepted

- **Independent comment load errors** — Handle comment API failures separately so the ticket still renders with an inline `commentsError` message.
- **Consolidate `CommentDto`** — Keep a single definition in `types/comment.ts` and re-export from `types/ticket.ts`.
- **Update `tasks.md` Task 5.3** — Reflect `GET /api/tickets/:id/comments` instead of embedded comments on ticket detail.
- **Message max-length hardening** — Add backend integration test for over-length messages; add frontend `maxLength` and submit validation for API parity.

### AI Suggestions – What Changed after review suggestion accepted

- Refactored `TicketDetailPage` to use `Promise.allSettled` so ticket and comments load independently; inline `commentsError` shown when the comment list fails but the ticket loads.
- Consolidated `CommentDto` in `backend/src/types/comment.ts` with a re-export from `types/ticket.ts`.
- Updated `tasks.md` Tasks 5.3, 5.4, and 5.6 for the separate comments endpoint and revised completion criteria.
- Added `frontend/src/constants/comment.js` with `MESSAGE_MAX_LENGTH`; textarea `maxLength` and submit-time length validation on the comment form.
- Added backend integration test rejecting messages over 5,000 characters.
- Updated frontend tests: removed empty-state expectations, added inline comment-load-failure test and `maxLength` attribute test.

### AI Suggestions – What I Rejected and Why

- **Restore “No comments yet.” empty state** — Rejected; empty list is represented by the comment form only, and frontend tests were updated accordingly.
- **Remove or repurpose `TicketDetail` in OpenAPI** — Rejected to avoid scope creep in documentation outside the immediate review fixes.

---

## Prompt 6 – Error Hardening Review

### Objective

Review the Error Hardening Review implementation for compliance with the project specification, layered architecture, code quality, validation, error handling, and potential issues.

### Prompt Summary

Used the `.cursor/commands/implemetation-review.md` command to evaluate the Tasks  Error Hardening changes, including the production-safe backend error handler, server-side logging, frontend API client global error handling (`NetworkError`, `getErrorMessage`, 500 normalization), page-level error display updates, and associated backend/frontend tests.

### AI Response Summary

The AI performed a read-only review and rated the implementation as **strong — both tasks meet their completion criteria and are ready to proceed**. It confirmed backend stack traces never reach clients, `AppError(500)` is sanitized, frontend network and 500 errors are handled globally via the API client, and field-level `400` validation still works. Minor gaps were noted: `HomePage` not using `getErrorMessage()`, `503` health messages over-normalized to the generic server message, server logging missing request context, redundant `CreateTicketModal` catch branches, missing `TicketDetailPage` network-error test, no non-JSON error client test, and an unused `NetworkError` import in tests.

### Review

The review accurately reflected the implementation against `tasks.md`, `api-contract.md`, and `design-notes.md`. No P0/P1 correctness bugs were found. Field-level validation on create, edit, status, assignee, and comment flows remained intact. Follow-up items were recommended as consistency and polish rather than blockers for subsequent Phase 7 tasks.

### AI Suggestions Accepted

- **Adopt `getErrorMessage()` on `HomePage`** — Keep error handling consistent app-wide.
- **Special-case `503` in the client** — Preserve health-check messages like `"Database connection unavailable"`.
- **Enrich server-side logging with request context** — Log method, path, params, and query in `logUnexpectedError()`.
- **Simplify `CreateTicketModal` catch block** — Use a single `getErrorMessage()` call for the banner while keeping field-error mapping.
- **Add a `TicketDetailPage` network-error test** — Assert offline failures show the connectivity message without crashing.
- **Add a client test for non-JSON 500 responses** — Verify fallback behavior when the response is not JSON.
- **Clean up test imports** — Remove unused imports in `TicketDetailPage.test.jsx`.

### AI Suggestions – What Changed after review suggestion accepted

- Updated `HomePage` to use `getErrorMessage()` for API health failures.
- Special-cased `503` in `normalizeApiErrorMessage()` and `getErrorMessage()` so health-check messages are preserved.
- Extended `logUnexpectedError()` with request context (method, path, params, query); `errorHandler` now passes `req`.
- Simplified `CreateTicketModal` error handling to a single banner message path.
- Added `TicketDetailPage` network-error test and client tests for `503` and non-JSON `500` responses.
- Updated backend tests to assert request context in server-side error logs.

### AI Suggestions – What I Rejected and Why

- **Add a React Error Boundary** — Rejected; Task 7.3 allows API client interceptors or an error boundary, and the client-based approach already meets the completion criteria.
- **Switch `errors.stackLeakage.test.ts` to use `createApp()`** — Rejected as low-value nit; the isolated middleware test already verifies the 500 contract adequately.

