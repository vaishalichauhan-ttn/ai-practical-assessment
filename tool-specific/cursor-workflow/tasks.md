# Development Tasks — Support Ticket Management System

> **Source of truth:** [implementation-plan.md](../../implementation-plan.md)
>
> **Companion docs:** [project-context.md](./project-context.md), [spec.md](./spec.md), [acceptance-criteria.md](../../acceptance-criteria.md)

This document breaks the implementation into sequential, incremental tasks. Complete tasks in order within each phase; do not start a phase until its dependencies are satisfied. Each phase ends with working software that can be demonstrated.

---

## How to Use This Document

1. Work through phases **0 → 7** in order.
2. Within a phase, respect task dependencies (some tasks can run in parallel when they share no blockers).
3. Mark a task complete only when **all completion criteria** are met.
4. Run existing tests before starting the next phase to avoid regressions.

### Milestone Mapping

| Milestone | Phase | Outcome |
|-----------|-------|---------|
| M0: Foundation | 0 | Running app, DB migrated & seeded, health check |
| M1: Create Ticket | 1 | Create ticket via UI, persisted as `Open` |
| M2: View Tickets | 2 | List and detail views |
| M3: Update & Assign | 3 | Edit ticket fields and assignee |
| M4: Status Workflow | 4 | Valid/invalid status transitions enforced |
| M5: Comments | 5 | Add and view comments chronologically |
| M6: Search & Filter | 6 | Keyword search + status filter combined |
| M7: Release Ready | 7 | Tests, docs, error handling complete |

---

## Phase 0 — Project Foundation

**Phase goal:** Runnable project skeleton with database connectivity and development tooling.

**Working state after phase:** Application starts; database is migrated and seeded; health check passes; frontend loads a placeholder page.

---

### Task 0.1 — Initialize Project Structure

| Field | Detail |
|-------|--------|
| **Task ID** | 0.1 |
| **Type** | BE / FE |
| **Objective** | Set up a two-folder structure (`backend/`, `frontend/`) with TypeScript backend, JavaScript React frontend, linting, and npm scripts for development and build. |
| **Dependencies** | None |
| **Deliverables** | `backend/` and `frontend/` directories; TypeScript config for backend; JavaScript/React setup for frontend (`.jsx` files, no TypeScript); lint/format setup; root or per-package `package.json` scripts (`dev`, `build`, `test`). |
| **Completion criteria** | Backend compiles without errors; frontend builds and runs without TypeScript; `npm run dev` (or equivalent) starts backend and frontend; folder structure supports layered architecture (controllers, services, repositories). |

---

### Task 0.2 — Define Initial Database Schema

| Field | Detail |
|-------|--------|
| **Task ID** | 0.2 |
| **Type** | DB |
| **Objective** | Design the relational schema for `users`, `tickets`, and `comments` with correct foreign keys, enums, and indexes. |
| **Dependencies** | None |
| **Deliverables** | Prisma schema (`schema.prisma`) covering: `users` (id, name, email, role, createdAt); `tickets` (id, title, description, priority, status, assignedTo, createdBy, createdAt, updatedAt); `comments` (id, ticketId, message, createdBy, createdAt, updatedAt). Indexes on `tickets.status`, `tickets.assignedTo`, and search-friendly fields on title/description. |
| **Completion criteria** | All three tables defined with FK constraints (`assignedTo` → users, `createdBy` → users, `ticketId` → tickets); `comments.updatedAt` included for future edit support; priority and status enums documented. |

---

### Task 0.3 — Create Migration Scripts

| Field | Detail |
|-------|--------|
| **Task ID** | 0.3 |
| **Type** | DB |
| **Objective** | Version-control Prisma migrations that create all tables and indexes from the schema design. |
| **Dependencies** | 0.2 |
| **Deliverables** | Prisma migration file(s) runnable against a clean PostgreSQL database; `prisma migrate` command documented. |
| **Completion criteria** | `npx prisma migrate dev` (or equivalent) runs successfully on empty DB; all tables, constraints, and indexes exist; migration is idempotent on fresh installs. |

---

### Task 0.4 — Add User Seed Script

| Field | Detail |
|-------|--------|
| **Task ID** | 0.4 |
| **Type** | DB |
| **Objective** | Seed pre-seeded users with name, email, and role for assignment and comment authorship. |
| **Dependencies** | 0.3 |
| **Deliverables** | Prisma seed script (`prisma/seed.js` or equivalent) with at least 3–5 users; `npx prisma db seed` command documented. |
| **Completion criteria** | Seed runs after migrations without errors; users are queryable in DB; each user has a `role` value; re-running seed is safe (upsert or truncate+seed pattern). |

---

### Task 0.5 — Configure Database Connection & Health Check

| Field | Detail |
|-------|--------|
| **Task ID** | 0.5 |
| **Type** | BE |
| **Objective** | Connect the backend to PostgreSQL via Prisma Client and environment variables; expose a health endpoint. |
| **Dependencies** | 0.3 |
| **Deliverables** | `.env.example` with `DATABASE_URL` and required vars; Prisma Client connection module; `GET /api/health` returning 200 when DB is reachable. |
| **Completion criteria** | Backend starts with valid `.env`; health endpoint returns 200 with DB connected; returns appropriate error when DB is unavailable; no secrets committed to repo. |

---

### Task 0.6 — Implement Global Error Handler & Validation Middleware

| Field | Detail |
|-------|--------|
| **Task ID** | 0.6 |
| **Type** | BE |
| **Objective** | Establish consistent HTTP error handling (400, 404, 500) and request validation middleware for all routes. |
| **Dependencies** | 0.5 |
| **Deliverables** | Global error handler middleware; validation middleware (e.g., for request body parsing); structured JSON error response shape. |
| **Completion criteria** | Malformed requests return 400; unknown routes return 404; unhandled exceptions return 500 without stack traces in response body; error shape is consistent and documented for frontend consumption. |

---

### Task 0.7 — Scaffold React Frontend

| Field | Detail |
|-------|--------|
| **Task ID** | 0.7 |
| **Type** | FE |
| **Objective** | Create the React + Vite + JavaScript frontend with routing shell and a reusable API client utility. |
| **Dependencies** | 0.1 |
| **Deliverables** | Vite React app (`.jsx` components, no TypeScript); router with placeholder routes; API client module (base URL, JSON headers, error parsing); placeholder home page. |
| **Completion criteria** | Frontend builds and loads in browser; router navigates between placeholder pages; API client can call `GET /api/health` successfully. |

---

### Task 0.8 — Foundation Smoke Test

| Field | Detail |
|-------|--------|
| **Task ID** | 0.8 |
| **Type** | TEST |
| **Objective** | Verify the foundation stack works end-to-end before feature development. |
| **Dependencies** | 0.5 |
| **Deliverables** | Smoke/integration test(s) for app startup and health endpoint. |
| **Completion criteria** | Test suite runs; health endpoint test passes against test DB; CI or local `npm test` succeeds for foundation checks. |

---

## Phase 1 — Ticket Creation & Persistence

**Phase goal:** Users can create tickets that are stored with `Open` status.

**Working state after phase:** User can create a ticket via UI; ticket persists in DB with `Open` status.

**Phase dependencies:** Phase 0 complete (especially 0.6, 0.7).

---

### Task 1.1 — Implement TicketService.create()

| Field | Detail |
|-------|--------|
| **Task ID** | 1.1 |
| **Type** | BE |
| **Objective** | Add service-layer ticket creation with required field validation for title, description, and priority. |
| **Dependencies** | 0.6 |
| **Deliverables** | `TicketService.create()` method; `TicketRepository` create method; input validation in service layer. |
| **Completion criteria** | Service rejects missing title, description, or priority; valid input persists a ticket record; repository contains no business logic. |

---

### Task 1.2 — Enforce Default Status and Creator on Create

| Field | Detail |
|-------|--------|
| **Task ID** | 1.2 |
| **Type** | BE |
| **Objective** | Ensure new tickets always start with status `Open` and `createdBy` is set from request context (hardcoded user or header stub). |
| **Dependencies** | 1.1 |
| **Deliverables** | Default status logic in `TicketService.create()`; `createdBy` assignment from stub context. |
| **Completion criteria** | Every created ticket has `status = Open` regardless of client input; `createdBy` references a valid seeded user; client cannot override default status on create. |

---

### Task 1.3 — Validate Priority Enum

| Field | Detail |
|-------|--------|
| **Task ID** | 1.3 |
| **Type** | BE |
| **Objective** | Restrict priority to allowed values (Low, Medium, High, Critical). |
| **Dependencies** | 1.1 |
| **Deliverables** | Priority enum validation in service layer; clear validation error messages. |
| **Completion criteria** | Invalid priority values rejected before persistence; error message identifies the invalid field; all four enum values accepted. |

---

### Task 1.4 — POST /api/tickets Endpoint

| Field | Detail |
|-------|--------|
| **Task ID** | 1.4 |
| **Type** | BE |
| **Objective** | Expose ticket creation via REST API with correct HTTP status codes and response DTO. |
| **Dependencies** | 1.1, 1.2, 1.3 |
| **Deliverables** | `POST /api/tickets` controller route; request/response DTOs; 201 on success, 400 on validation failure. |
| **Completion criteria** | Endpoint creates ticket and returns created resource; validation errors return 400 with structured body; response includes id, status, priority, timestamps. |

---

### Task 1.5 — Create Ticket Form (Frontend)

| Field | Detail |
|-------|--------|
| **Task ID** | 1.5 |
| **Type** | FE |
| **Objective** | Build a form UI for creating tickets with title, description, and priority fields. |
| **Dependencies** | 0.7, 1.4 |
| **Deliverables** | Create Ticket page/component; form wired to `POST /api/tickets`; navigation to form from app shell. |
| **Completion criteria** | User can submit a valid ticket; success redirects or shows confirmation; all three fields are present and required in UI. |

---

### Task 1.6 — Display API Validation Errors on Create

| Field | Detail |
|-------|--------|
| **Task ID** | 1.6 |
| **Type** | FE |
| **Objective** | Surface backend validation errors from the create ticket API in the UI. |
| **Dependencies** | 1.5 |
| **Deliverables** | Error display component or inline field errors; parsing of API 400 response shape. |
| **Completion criteria** | Missing fields show user-visible error messages; invalid priority shows API error message; form remains editable after failure. |

---

### Task 1.7 — Ticket Creation Integration Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 1.7 |
| **Type** | TEST |
| **Objective** | Verify ticket creation happy path and validation failures via HTTP integration tests. |
| **Dependencies** | 1.4 |
| **Deliverables** | Integration tests: successful create; missing required fields; invalid priority. |
| **Completion criteria** | All create tests pass; created ticket in DB has `Open` status; 400 returned for invalid input; tests use real HTTP layer (Supertest). |

---

## Phase 2 — Ticket Listing & Details

**Phase goal:** Users can view all tickets and open a detail page.

**Working state after phase:** User can create tickets, see them in a list, and view full details.

**Phase dependencies:** Phase 1 complete.

---

### Task 2.1 — GET /api/tickets (List)

| Field | Detail |
|-------|--------|
| **Task ID** | 2.1 |
| **Type** | BE |
| **Objective** | Return a list of all tickets with summary fields for the list view. |
| **Dependencies** | 1.4 |
| **Deliverables** | `GET /api/tickets` endpoint; list DTO with title, priority, status, assignedTo, createdAt, updatedAt. |
| **Completion criteria** | Endpoint returns array of tickets; empty array when no tickets exist; assignedTo includes user id (and name if joined); response shape stable for frontend. |

---

### Task 2.2 — GET /api/tickets/:id (Detail)

| Field | Detail |
|-------|--------|
| **Task ID** | 2.2 |
| **Type** | BE |
| **Objective** | Return full ticket details including creator and assignee information. |
| **Dependencies** | 1.4 |
| **Deliverables** | `GET /api/tickets/:id` endpoint; detail DTO with all ticket fields and nested user objects for createdBy/assignedTo. |
| **Completion criteria** | Valid id returns complete ticket; includes title, description, priority, status, assignee, creator, timestamps. |

---

### Task 2.3 — 404 for Non-Existent Ticket

| Field | Detail |
|-------|--------|
| **Task ID** | 2.3 |
| **Type** | BE |
| **Objective** | Return 404 when requesting a ticket that does not exist. |
| **Dependencies** | 2.2 |
| **Deliverables** | 404 handling in ticket detail controller/service. |
| **Completion criteria** | `GET /api/tickets/:id` with invalid/non-existent id returns 404 with consistent error body; no 500 for missing records. |

---

### Task 2.4 — Ticket List Page (Frontend)

| Field | Detail |
|-------|--------|
| **Task ID** | 2.4 |
| **Type** | FE |
| **Objective** | Display all tickets in a list with required columns. |
| **Dependencies** | 2.1 |
| **Deliverables** | Ticket list page showing title, priority, status, assignee, created/updated dates. |
| **Completion criteria** | List loads from API; columns match acceptance criteria; empty state shown when no tickets; loading and error states handled. |

---

### Task 2.5 — Ticket Detail Page (Read-Only)

| Field | Detail |
|-------|--------|
| **Task ID** | 2.5 |
| **Type** | FE |
| **Objective** | Show full ticket details on a dedicated detail page. |
| **Dependencies** | 2.2 |
| **Deliverables** | Ticket detail page/component displaying all ticket fields. |
| **Completion criteria** | Detail page shows title, description, priority, status, assignee, creator, timestamps; 404 from API shown as user-friendly message. |

---

### Task 2.6 — List → Detail Navigation

| Field | Detail |
|-------|--------|
| **Task ID** | 2.6 |
| **Type** | FE |
| **Objective** | Enable navigation from ticket list rows to the detail page. |
| **Dependencies** | 2.4, 2.5 |
| **Deliverables** | Clickable list items or links; route `/tickets/:id` (or equivalent). |
| **Completion criteria** | Clicking a ticket in the list opens its detail page; browser back returns to list; direct URL to ticket id works. |

---

### Task 2.7 — List & Detail Integration Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 2.7 |
| **Type** | TEST |
| **Objective** | Verify ticket read endpoints via integration tests. |
| **Dependencies** | 2.1, 2.2, 2.3 |
| **Deliverables** | Tests: list returns tickets; get by id returns full detail; 404 for missing id. |
| **Completion criteria** | All read tests pass; list includes created tickets; detail matches created data; 404 test uses non-existent UUID/id. |

---

## Phase 3 — Ticket Update & Assignment

**Phase goal:** Users can update ticket fields and assign/reassign tickets.

**Working state after phase:** Full ticket CRUD (except status changes) is functional end-to-end.

**Phase dependencies:** Phase 2 complete.

---

### Task 3.1 — PATCH /api/tickets/:id (Field Updates)

| Field | Detail |
|-------|--------|
| **Task ID** | 3.1 |
| **Type** | BE |
| **Objective** | Allow partial updates to title, description, and priority on existing tickets. |
| **Dependencies** | 2.2 |
| **Deliverables** | `PATCH /api/tickets/:id` endpoint; service method for field updates; validation reused from create. |
| **Completion criteria** | Valid PATCH updates only provided fields; invalid priority rejected with 400; `updatedAt` refreshed on change. |

---

### Task 3.2 — Validate Assignee on Update

| Field | Detail |
|-------|--------|
| **Task ID** | 3.2 |
| **Type** | BE |
| **Objective** | Validate that `assignedTo` references an existing seeded user; reject invalid user IDs. |
| **Dependencies** | 3.1 |
| **Deliverables** | Assignee validation in service layer; `GET /api/users` read-only endpoint for user list. |
| **Completion criteria** | Valid user id assignment succeeds; non-existent user id returns 400 with clear message; `GET /api/users` returns seeded users. |

---

### Task 3.3 — Support Assign and Unassign

| Field | Detail |
|-------|--------|
| **Task ID** | 3.3 |
| **Type** | BE |
| **Objective** | Allow setting `assignedTo` to a valid user or clearing it (null) to unassign. |
| **Dependencies** | 3.2 |
| **Deliverables** | Nullable `assignedTo` handling in PATCH logic. |
| **Completion criteria** | Assigning a user persists assignment; unassign sets `assignedTo` to null; detail/list reflect assignment changes. |

---

### Task 3.4 — 404 for Update on Non-Existent Ticket

| Field | Detail |
|-------|--------|
| **Task ID** | 3.4 |
| **Type** | BE |
| **Objective** | Return 404 when PATCH targets a ticket that does not exist. |
| **Dependencies** | 3.1 |
| **Deliverables** | 404 handling in update flow. |
| **Completion criteria** | PATCH to non-existent id returns 404; no partial writes occur; error body matches global format. |

---

### Task 3.5 — Edit Form on Detail Page

| Field | Detail |
|-------|--------|
| **Task ID** | 3.5 |
| **Type** | FE |
| **Objective** | Add editable fields for title, description, and priority on the ticket detail page. |
| **Dependencies** | 2.5 |
| **Deliverables** | Edit form (inline or modal) on detail page; save wired to `PATCH /api/tickets/:id`. |
| **Completion criteria** | User can edit and save title, description, priority; UI reflects saved values; works on tickets in any status. |

---

### Task 3.6 — Assignee Dropdown

| Field | Detail |
|-------|--------|
| **Task ID** | 3.6 |
| **Type** | FE |
| **Objective** | Populate an assignee selector from the users API and persist selection via PATCH. |
| **Dependencies** | 3.2 |
| **Deliverables** | Assignee dropdown on detail/edit UI; populated from `GET /api/users`; includes unassign option. |
| **Completion criteria** | Dropdown lists seeded users; selecting user assigns ticket; unassign clears assignee; current assignee shown on load. |

---

### Task 3.7 — Display Update Validation Errors

| Field | Detail |
|-------|--------|
| **Task ID** | 3.7 |
| **Type** | FE |
| **Objective** | Show API validation errors when ticket update fails. |
| **Dependencies** | 3.5 |
| **Deliverables** | Error handling on edit form for 400 responses. |
| **Completion criteria** | Invalid assignee shows API error; invalid priority shows error; user can correct and retry. |

---

### Task 3.8 — Update & Assignment Integration Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 3.8 |
| **Type** | TEST |
| **Objective** | Verify ticket update and assignment behavior via integration tests. |
| **Dependencies** | 3.1, 3.2, 3.3, 3.4 |
| **Deliverables** | Tests: update fields; valid assignee; invalid assignee; 404 on missing ticket. |
| **Completion criteria** | All update tests pass; field changes persisted in DB; invalid assignee returns 400; 404 for non-existent ticket. |

---

## Phase 4 — Status Transition Engine (Critical Path)

**Phase goal:** Enforce the ticket status lifecycle on the backend; expose status change via API and UI.

**Working state after phase:** Complete ticket lifecycle management with enforced backend rules.

**Phase dependencies:** Phase 3 complete.

**Authoritative transition matrix:**

```text
Open        → In Progress
In Progress → Resolved
Resolved    → Closed
Open        → Cancelled
In Progress → Cancelled
```

---

### Task 4.1 — Extract StatusTransitionValidator

| Field | Detail |
|-------|--------|
| **Task ID** | 4.1 |
| **Type** | BE |
| **Objective** | Implement a pure, isolated module that validates status transitions against the authoritative matrix. |
| **Dependencies** | 3.1 |
| **Deliverables** | `StatusTransitionValidator` module (pure function or class); no DB or HTTP dependencies. |
| **Completion criteria** | Module accepts current status and target status; returns valid/invalid result with reason; covers all five allowed transitions; terminal states (`Closed`, `Cancelled`) reject any change. |

---

### Task 4.2 — Reject Invalid Transitions with 400

| Field | Detail |
|-------|--------|
| **Task ID** | 4.2 |
| **Type** | BE |
| **Objective** | Integrate the validator into the service layer and return 400 with a clear message on invalid transitions. |
| **Dependencies** | 4.1 |
| **Deliverables** | Status change logic in `TicketService`; structured 400 error for disallowed transitions. |
| **Completion criteria** | Invalid transitions never persist; error message states current and requested status; valid transitions proceed to persistence. |

---

### Task 4.3 — Block Status Changes on Terminal States

| Field | Detail |
|-------|--------|
| **Task ID** | 4.3 |
| **Type** | BE |
| **Objective** | Ensure tickets in `Closed` or `Cancelled` status cannot change status further (field updates still allowed). |
| **Dependencies** | 4.1 |
| **Deliverables** | Terminal-state guard in validator and/or service. |
| **Completion criteria** | PATCH status on `Closed` ticket returns 400; same for `Cancelled`; non-status field updates on terminal tickets still succeed. |

---

### Task 4.4 — Status Change API Endpoint

| Field | Detail |
|-------|--------|
| **Task ID** | 4.4 |
| **Type** | BE |
| **Objective** | Expose status changes via `PATCH /api/tickets/:id/status` or a validated `status` field on existing PATCH. |
| **Dependencies** | 4.2 |
| **Deliverables** | Status change endpoint; controller maps to service; 200 on success, 400 on invalid transition, 404 on missing ticket. |
| **Completion criteria** | All five valid transitions work via API; invalid transitions return 400; response includes updated ticket with new status. |

---

### Task 4.5 — Status Change Control (Frontend)

| Field | Detail |
|-------|--------|
| **Task ID** | 4.5 |
| **Type** | FE |
| **Objective** | Add UI control for changing status, showing only valid next statuses as a UX helper (backend remains authoritative). |
| **Dependencies** | 2.5, 4.4 |
| **Deliverables** | Status selector or action buttons on detail page; client-side filter of allowed next statuses. |
| **Completion criteria** | Only valid next statuses shown for current state; terminal tickets show no status change options; successful change updates displayed status. |

---

### Task 4.6 — Display Status Transition Errors

| Field | Detail |
|-------|--------|
| **Task ID** | 4.6 |
| **Type** | FE |
| **Objective** | Show backend error messages when a status transition attempt fails. |
| **Dependencies** | 4.5 |
| **Deliverables** | Error display for failed status changes. |
| **Completion criteria** | Invalid transition attempt shows API error message; ticket status in UI unchanged after failure; user can retry or choose another action. |

---

### Task 4.7 — Valid Transition Integration Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 4.7 |
| **Type** | TEST |
| **Objective** | Verify all allowed status transitions succeed via HTTP integration tests. |
| **Dependencies** | 4.4 |
| **Deliverables** | Integration tests for: Open→In Progress; In Progress→Resolved; Resolved→Closed; Open→Cancelled; In Progress→Cancelled. |
| **Completion criteria** | All five valid transition tests pass; DB reflects new status after each transition. |

---

### Task 4.8 — Invalid Transition Integration Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 4.8 |
| **Type** | TEST |
| **Objective** | Verify disallowed transitions are rejected with 400. |
| **Dependencies** | 4.4 |
| **Deliverables** | Integration tests for representative invalid transitions (e.g., Open→Closed, Resolved→Open, Closed→In Progress). |
| **Completion criteria** | Invalid transitions return 400; status unchanged in DB; tests cover skips, reversals, and terminal-state attempts. |

---

### Task 4.9 — StatusTransitionValidator Unit Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 4.9 |
| **Type** | TEST |
| **Objective** | Unit test the full transition matrix in isolation without HTTP or database. |
| **Dependencies** | 4.1 |
| **Deliverables** | Unit test suite for `StatusTransitionValidator` covering all allowed and key disallowed transitions. |
| **Completion criteria** | Unit tests pass; every allowed transition returns valid; representative disallowed transitions return invalid; terminal states tested. |

---

## Phase 5 — Comments

**Phase goal:** Users can add and view comments on tickets in chronological order.

**Working state after phase:** Ticket detail shows comments; users can add new comments.

**Phase dependencies:** Phase 2 complete (detail page); Phase 4 recommended for stable detail UI but not strictly blocking backend work.

---

### Task 5.1 — POST /api/tickets/:id/comments

| Field | Detail |
|-------|--------|
| **Task ID** | 5.1 |
| **Type** | BE |
| **Objective** | Add comments to existing tickets with required message and authorship from context. |
| **Dependencies** | 2.2 |
| **Deliverables** | `POST /api/tickets/:id/comments` endpoint; `CommentService` and repository; `updatedAt` set equal to `createdAt` on insert. |
| **Completion criteria** | Valid comment persisted with ticketId, message, createdBy; empty message rejected with 400; 201 returned with created comment. |

---

### Task 5.2 — 404 for Comment on Non-Existent Ticket

| Field | Detail |
|-------|--------|
| **Task ID** | 5.2 |
| **Type** | BE |
| **Objective** | Reject comment creation when the parent ticket does not exist. |
| **Dependencies** | 5.1 |
| **Deliverables** | 404 handling in comment creation flow. |
| **Completion criteria** | POST comment to non-existent ticket id returns 404; no orphan comment records created. |

---

### Task 5.3 — Include Comments in Ticket Detail

| Field | Detail |
|-------|--------|
| **Task ID** | 5.3 |
| **Type** | BE |
| **Objective** | Return comments as part of `GET /api/tickets/:id`, ordered by `createdAt ASC`. |
| **Dependencies** | 2.2, 5.1 |
| **Deliverables** | Comments array on ticket detail response; chronological ordering. |
| **Completion criteria** | Detail response includes comments; oldest comment first; each comment has message, author, timestamps. |

---

### Task 5.4 — Comment List on Detail Page

| Field | Detail |
|-------|--------|
| **Task ID** | 5.4 |
| **Type** | FE |
| **Objective** | Display comments chronologically on the ticket detail page. |
| **Dependencies** | 5.3 |
| **Deliverables** | Comment list component on detail page. |
| **Completion criteria** | Comments render in chronological order; author and timestamp visible; empty state when no comments. |

---

### Task 5.5 — Add Comment Form

| Field | Detail |
|-------|--------|
| **Task ID** | 5.5 |
| **Type** | FE |
| **Objective** | Allow users to submit new comments with error handling. |
| **Dependencies** | 5.1 |
| **Deliverables** | Comment form on detail page; wired to POST endpoint. |
| **Completion criteria** | Successful submit adds comment to list without full page reload (or refreshes list); empty submit shows error; API errors displayed. |

---

### Task 5.6 — Comment Integration Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 5.6 |
| **Type** | TEST |
| **Objective** | Verify comment add and list behavior via integration tests. |
| **Dependencies** | 5.1, 5.2, 5.3 |
| **Deliverables** | Tests: add comment; list chronologically on detail; 404 for bad ticket id. |
| **Completion criteria** | All comment tests pass; order verified with multiple comments; 404 test passes. |

---

## Phase 6 — Search & Filter

**Phase goal:** Keyword search and status filter, usable together.

**Working state after phase:** All core functional requirements are delivered.

**Phase dependencies:** Phase 2 complete (list API).

---

### Task 6.1 — Search Query Parameter

| Field | Detail |
|-------|--------|
| **Task ID** | 6.1 |
| **Type** | BE |
| **Objective** | Extend `GET /api/tickets` with `?search=` to match title and description (case-insensitive). |
| **Dependencies** | 2.1 |
| **Deliverables** | Search logic in repository/service; `search` query param on list endpoint. |
| **Completion criteria** | Search matches tickets by title or description; case-insensitive; no match returns empty array. |

---

### Task 6.2 — Status Filter Query Parameter

| Field | Detail |
|-------|--------|
| **Task ID** | 6.2 |
| **Type** | BE |
| **Objective** | Extend `GET /api/tickets` with `?status=` to filter by ticket status. |
| **Dependencies** | 2.1 |
| **Deliverables** | Status filter in repository/service; `status` query param on list endpoint. |
| **Completion criteria** | Filter returns only tickets with matching status; invalid status value returns 400 or is ignored per API contract. |

---

### Task 6.3 — Combined Search and Status Filter

| Field | Detail |
|-------|--------|
| **Task ID** | 6.3 |
| **Type** | BE |
| **Objective** | Support using search and status filter together; return empty array when no matches. |
| **Dependencies** | 6.1, 6.2 |
| **Deliverables** | Combined query logic applying both filters (AND semantics). |
| **Completion criteria** | `?search=foo&status=Open` returns tickets matching both; no matches returns `[]`; neither param returns full list. |

---

### Task 6.4 — Empty Search Keyword Handling

| Field | Detail |
|-------|--------|
| **Task ID** | 6.4 |
| **Type** | BE |
| **Objective** | Treat empty or whitespace-only search as no search filter (return all, subject to status filter). |
| **Dependencies** | 6.1 |
| **Deliverables** | Empty search normalization in service/repository. |
| **Completion criteria** | `?search=` returns all tickets (or all matching status filter); whitespace-only search treated as empty. |

---

### Task 6.5 — Search and Filter UI

| Field | Detail |
|-------|--------|
| **Task ID** | 6.5 |
| **Type** | FE |
| **Objective** | Add search input and status filter dropdown to the ticket list page. |
| **Dependencies** | 6.1, 6.2, 6.3 |
| **Deliverables** | Search box and status filter on list page; wired to list API with query params. |
| **Completion criteria** | Typing search term filters list; status dropdown filters list; both can be used together; clear/reset behavior works. |

---

### Task 6.6 — Preserve Filters in URL (Optional)

| Field | Detail |
|-------|--------|
| **Task ID** | 6.6 |
| **Type** | FE |
| **Objective** | Sync search and status filter state to URL query params for shareable/bookmarkable list views. |
| **Dependencies** | 6.5 |
| **Deliverables** | URL query param sync for `search` and `status`. |
| **Completion criteria** | Filter changes update URL; page load with query params applies filters; browser back/forward restores filter state. *Stretch goal—defer if schedule is tight.* |

---

### Task 6.7 — Search & Filter Integration Tests

| Field | Detail |
|-------|--------|
| **Task ID** | 6.7 |
| **Type** | TEST |
| **Objective** | Verify search, filter, and combined behavior via integration tests. |
| **Dependencies** | 6.1, 6.2, 6.3, 6.4 |
| **Deliverables** | Tests: search only; filter only; combined; no results; empty search keyword. |
| **Completion criteria** | All search/filter tests pass; combined filter semantics verified; empty search returns full set. |

---

## Phase 7 — Hardening, Documentation & Final Validation

**Phase goal:** Meet all non-functional acceptance criteria and prepare for review.

**Working state after phase:** Production-ready demo aligned with all acceptance criteria.

**Phase dependencies:** Phase 6 complete.

---

### Task 7.1 — Consistent Error Response Shape

| Field | Detail |
|-------|--------|
| **Task ID** | 7.1 |
| **Type** | BE |
| **Objective** | Audit all endpoints and ensure a uniform error response format across 400, 404, and 500. |
| **Dependencies** | Phase 6 |
| **Deliverables** | Error response audit; fixes for any inconsistent endpoints. |
| **Completion criteria** | All endpoints return the same error JSON structure; field-level validation errors are consistently shaped. |

---

### Task 7.2 — Prevent Stack Trace Leakage

| Field | Detail |
|-------|--------|
| **Task ID** | 7.2 |
| **Type** | BE |
| **Objective** | Ensure 500 responses never expose internal stack traces to API clients. |
| **Dependencies** | 7.1 |
| **Deliverables** | Production-safe error handler; server-side logging for unexpected errors. |
| **Completion criteria** | Simulated 500 returns generic message to client; full error logged server-side only; no stack trace in response body. |

---

### Task 7.3 — Global Frontend API Error Handling

| Field | Detail |
|-------|--------|
| **Task ID** | 7.3 |
| **Type** | FE |
| **Objective** | Handle network failures and 500 errors globally in the frontend. |
| **Dependencies** | 7.1 |
| **Deliverables** | API client interceptors or global error boundary; user-friendly messages for network/500 errors. |
| **Completion criteria** | Network offline shows clear message; 500 shows generic error without crashing app; existing field-level errors still work. |

---

### Task 7.4 — Document Migration and Seed Commands

| Field | Detail |
|-------|--------|
| **Task ID** | 7.4 |
| **Type** | DB / DOC |
| **Objective** | Document how to run migrations and seed data in the README. |
| **Dependencies** | 0.3, 0.4 |
| **Deliverables** | README section for DB setup, `prisma migrate`, and seed commands. |
| **Completion criteria** | Commands verified on clean PostgreSQL database; prerequisites (PostgreSQL version) stated; `.env.example` referenced. |

---

### Task 7.5 — OpenAPI / Swagger API Documentation

| Field | Detail |
|-------|--------|
| **Task ID** | 7.5 |
| **Type** | BE / DOC |
| **Objective** | Generate or author OpenAPI documentation for all implemented endpoints. |
| **Dependencies** | Phase 6 |
| **Deliverables** | OpenAPI spec file or Swagger UI endpoint covering all API routes. |
| **Completion criteria** | Every endpoint from Appendix A documented; request/response schemas match implementation; docs accessible locally. |

---

### Task 7.6 — README: Setup, Run, and Test

| Field | Detail |
|-------|--------|
| **Task ID** | 7.6 |
| **Type** | DOC |
| **Objective** | Write complete README with prerequisites, setup, run, test, and environment configuration. |
| **Dependencies** | All feature phases |
| **Deliverables** | README with step-by-step instructions for new developers/reviewers. |
| **Completion criteria** | Fresh clone + documented steps yields running app; test command documented and works; env vars explained. |

---

### Task 7.7 — Document Design Decisions

| Field | Detail |
|-------|--------|
| **Task ID** | 7.7 |
| **Type** | DOC |
| **Objective** | Record architecture, status rules, and scope assumptions for future maintainers. |
| **Dependencies** | All feature phases |
| **Deliverables** | Design decisions section in README or separate doc; references to layering, status matrix, out-of-scope items. |
| **Completion criteria** | Layering explained; status transition rules documented; scope decisions from implementation plan captured. |

---

### Task 7.8 — Maintain AI Prompt History

| Field | Detail |
|-------|--------|
| **Task ID** | 7.8 |
| **Type** | DOC |
| **Objective** | Log significant AI prompts and outcomes per phase in `ai-prompts/`. |
| **Dependencies** | Ongoing (all phases) |
| **Deliverables** | Updated files in `ai-prompts/` (planning, design, implementation, testing, documentation). |
| **Completion criteria** | Each major phase has prompt history entries; prompts linked to decisions or generated artifacts. |

---

### Task 7.9 — Full Regression Test Run

| Field | Detail |
|-------|--------|
| **Task ID** | 7.9 |
| **Type** | TEST |
| **Objective** | Run the complete test suite and fill any coverage gaps in CRUD, comments, search, and status transitions. |
| **Dependencies** | Phase 6 |
| **Deliverables** | Passing full test suite; any new tests for uncovered edge cases. |
| **Completion criteria** | All integration and unit tests pass; no skipped critical tests; coverage includes every acceptance criteria test scenario. |

---

### Task 7.10 — Manual Acceptance Checklist Walkthrough

| Field | Detail |
|-------|--------|
| **Task ID** | 7.10 |
| **Type** | TEST |
| **Objective** | Manually verify every item in `acceptance-criteria.md` against the running application. |
| **Dependencies** | 7.9 |
| **Deliverables** | Completed acceptance checklist (pass/fail notes). |
| **Completion criteria** | Every acceptance criterion verified; failures fixed or documented as known issues with justification. |

---

## Feature Dependency Summary

```text
Phase 0 (Foundation)
  └── Phase 1 (Create)
        └── Phase 2 (List/Detail)
              ├── Phase 3 (Update/Assign)
              │     └── Phase 4 (Status Engine) ← critical path
              ├── Phase 5 (Comments)
              └── Phase 6 (Search/Filter)
                    └── Phase 7 (Hardening & Docs)
```

| Feature | Depends On | Blocks |
|---------|------------|--------|
| DB schema & seeds | — | Everything |
| Ticket create | DB, error handling | List, detail, update |
| Ticket list/detail | Ticket create | Update, status, comments UI |
| Ticket update/assign | List/detail, users seed | Status UI, full CRUD tests |
| Status transitions | Ticket update, validator | Status UI, status tests |
| Comments | Ticket detail | Comment tests |
| Search & filter | Ticket list API | Search tests, final UI |
| Documentation | All features | Release |

---

## Definition of Done (Per Feature)

A feature is complete when:

- [ ] Backend endpoint(s) implemented with validation and correct HTTP status codes
- [ ] Database changes migrated and seeded where needed
- [ ] Frontend screen(s) wired to API with error display
- [ ] Integration test(s) cover happy path and key failure cases
- [ ] No regressions in previously delivered phases

---

## Contingency: Scope Reduction Order

If schedule pressure occurs, reduce scope in this order (without failing acceptance criteria):

1. Defer Task 6.6 (URL query param persistence for filters)
2. Defer optional pagination (not in plan tasks)
3. Minimize UI polish while preserving error message display
4. **Never defer:** status transition tests (4.7–4.9), backend validation, seed data, README setup instructions

---

*Derived from [implementation-plan.md](../../implementation-plan.md). Update this file when the plan changes.*
