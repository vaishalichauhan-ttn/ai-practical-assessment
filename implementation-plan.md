# Implementation Plan — Support Ticket Management System

## 1. Overview

### Purpose

This document defines the implementation strategy for the **Support Ticket Management System**, a backend-heavy, full-stack application that enables internal users to manage support requests across their lifecycle. The plan is derived from [requirement-analysis.md](requirement-analysis.md) and [acceptance-criteria.md](acceptance-criteria.md), which serve as the authoritative scope for all work described here.

### Project Goals

- Deliver a working application that supports ticket creation, listing, detail view, updates, assignment, status transitions, comments, search, and filtering.
- Enforce business rules on the backend, with status transition validation as the highest-risk domain logic.
- Persist all data in PostgreSQL with Prisma migrations and seed data.
- Provide a usable frontend that surfaces validation and API errors clearly.
- Meet acceptance criteria for testing, error handling, and documentation.

### Scope Boundaries

**In scope**

| Area | Included |
|------|----------|
| Tickets | Create, list, view, update (title, description, priority, assignee), status changes |
| Comments | Add and view comments on tickets |
| Search & filter | Keyword search (title/description), filter by status, combined use |
| Users | Pre-seeded only; assignable to tickets and comments |
| Backend | Validation, business rules, REST API, layered architecture |
| Database | Schema, migrations, seed data, persistence |
| Testing | Integration tests for CRUD, comments, search/filter, status transitions |
| Documentation | README, API docs, setup, AI prompt history, design decisions |

**Out of scope**

- User management (registration, login, roles, permissions)
- Authentication and authorization
- Ticket/comment deletion
- Comment editing (application feature — not implemented in this release; database schema includes `updatedAt` on comments to support this in a future phase)
- Assignment history or audit logs
- Pagination (not required by acceptance criteria; defer unless time permits)
- Features raised in clarifications but not reflected in acceptance criteria

### Assumptions and Scope Decisions

The following decisions resolve open questions from the requirement analysis without expanding scope:

| Question | Decision | Rationale |
|----------|----------|-----------|
| Unique ticket titles? | Not required | Not specified in acceptance criteria |
| Priority editable after creation? | Yes | Ticket update explicitly includes priority |
| Comments editable? | No (app); yes (schema-ready) | Only add and view are in scope; `comments.updatedAt` is included in the schema for future edit support |
| Deletion of tickets/comments? | No | Not in acceptance criteria |
| Edit Closed/Cancelled tickets? | Allow field updates; block further status changes | Preserves data integrity while meeting update criteria |
| Assignment history? | No | Out of scope |
| Pagination? | Optional stretch goal | Not required for acceptance |
| Audit logs? | No | Future enhancement only |

### Recommended Technology Stack

The stack below supports layered architecture, fast iteration, and strong integration testing. Alternatives (e.g., Django, Spring Boot) are valid if the same architectural principles are preserved.

| Layer | Technology | Reason |
|-------|------------|--------|
| Backend | Node.js + Express (or Fastify) + TypeScript | Clear layering, strong typing for business rules, fast test setup |
| Database | PostgreSQL | Relational fit for tickets, users, comments; reliable migrations |
| ORM / migrations | Prisma | Schema versioning, migrations, and seed scripts via `schema.prisma` |
| Frontend | React + JavaScript + Vite (no TypeScript) | Component-based UI, good form/error handling patterns |
| API style | REST + JSON | Straightforward CRUD and validation error mapping |
| Testing | Jest/Vitest + Supertest (API integration tests) | Exercises real HTTP layer and business rules |
| Documentation | OpenAPI (Swagger) + README | Meets API documentation acceptance criteria |

### Critical Path Summary

The critical path runs through **database foundation → ticket domain model → status transition engine → ticket API → frontend ticket flows → comments → search/filter → integration test coverage → documentation**. Status transition validation is the highest-risk item and must be implemented and tested before the feature set is considered complete.

---

## 2. Development Approach

### Guiding Principles

1. **Feature-driven, vertical slices** — Each milestone delivers an end-to-end capability (database + API + UI + tests where applicable) rather than completing all backend work before any frontend work.
2. **Backend as source of truth** — All business rules live in the service layer; the frontend reflects API contracts but does not enforce workflow rules independently.
3. **Working software at every milestone** — After each milestone, the application starts, connects to the database, and supports the features delivered so far.
4. **Test business rules early** — Status transition tests are introduced in the same milestone as the status engine, not deferred to the end.
5. **Minimal scope** — Optional enhancements (pagination, advanced error telemetry) are only attempted after acceptance criteria are met.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  Pages: List | Detail | Create/Edit | Search/Filter     │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP (JSON)
┌─────────────────────────▼───────────────────────────────┐
│                  API Layer (Controllers)                 │
│  Request parsing, HTTP status mapping, error responses   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 Service Layer (Business Logic)           │
│  Status transitions, validation, orchestration           │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Repository Layer (Data Access)              │
│  CRUD, queries, search/filter                            │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   PostgreSQL Database                    │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Database** | Tables, constraints, indexes, migrations, seed data |
| **Repository** | Persistence queries; no business logic |
| **Service** | Validation, status transitions, assignee checks, orchestration |
| **API** | HTTP mapping, DTOs, consistent error format |
| **Frontend** | UX, forms, displaying API errors, no authoritative rule enforcement |
| **Testing** | Integration tests against running API; unit tests for pure status logic if extracted |

### Incremental Delivery Model

Each phase builds on the previous one. Dependencies are ordered so that:

- **Persistence exists before APIs** — Endpoints need tables and seed users.
- **Ticket CRUD exists before comments** — Comments require a parent ticket FK.
- **Status engine exists before status UI** — Frontend status controls depend on a stable API contract.
- **Core listing exists before search/filter** — Search extends the list query, not a separate subsystem.
- **Features exist before broad test coverage** — Tests validate delivered behavior; status tests ship with status feature.

### Definition of Done (per feature)

- Backend endpoint(s) implemented with validation and correct HTTP status codes
- Database changes migrated and seeded where needed
- Frontend screen(s) wired to API with error display
- Integration test(s) cover happy path and key failure cases
- No regressions in previously delivered milestones

---

## 3. Task Breakdown

Tasks are grouped by phase. Within each phase, activities are labeled **DB**, **BE** (backend), **FE** (frontend), and **TEST**.

---

### Phase 0 — Project Foundation

**Goal:** Runnable project skeleton with database connectivity and development tooling.

**Why first:** Every subsequent feature depends on project structure, environment configuration, and a connected database.

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 0.1 | BE | Initialize monorepo or two-folder structure (`backend/`, `frontend/`) with TypeScript backend, JavaScript React frontend, linting, and scripts | — |
| 0.2 | DB | Define initial Prisma schema: `users` (with `role`), `tickets`, `comments` (include `updatedAt` for future comment editing) | — |
| 0.3 | DB | Create Prisma migration scripts for all tables | 0.2 |
| 0.4 | DB | Add Prisma seed script for pre-seeded users (include `role` per user) | 0.3 |
| 0.5 | BE | Configure Prisma Client, env vars (`.env.example`), health check endpoint | 0.3 |
| 0.6 | BE | Implement global error handler (400, 404, 500) and validation middleware | 0.5 |
| 0.7 | FE | Scaffold React app with routing shell and API client utility | 0.1 |
| 0.8 | TEST | Smoke test: app starts, DB connects, health endpoint returns 200 | 0.5 |

**Working state after Phase 0:** Application starts; database is migrated and seeded; health check passes; frontend loads a placeholder page.

**Schema design (initial):**

```
users
  id, name, email, role, createdAt

tickets
  id, title, description, priority, status, assignedTo (nullable FK → users.id),
  createdBy (FK → users.id), createdAt, updatedAt

comments
  id, ticketId (FK → tickets.id), message, createdBy (FK → users.id),
  createdAt, updatedAt
```

**Column notes:**

- `assignedTo` and `createdBy` on tickets reference `users.id`.
- `ticketId` and `createdBy` on comments reference `tickets.id` and `users.id` respectively.
- `users.role` is seeded for future authorization work; role-based access is not enforced in this release.
- `comments.updatedAt` is included now (defaulting to `createdAt` on insert) so comment editing can be added later without a schema migration.

**Indexes:** `tickets.status`, `tickets.assignedTo`, full-text or `ILIKE` support on `title`/`description` for search.

---

### Phase 1 — Ticket Creation & Persistence

**Goal:** Users can create tickets that are stored with `Open` status.

**Why now:** Creation is the entry point of the domain. It establishes the ticket entity, validation patterns, and API conventions used by all later features.

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 1.1 | BE | Implement `TicketService.create()` with required field validation (title, description, priority) | 0.6 |
| 1.2 | BE | Enforce default status `Open` on create; set `createdBy` from request context (hardcoded or header stub) | 1.1 |
| 1.3 | BE | Validate priority enum (e.g., Low, Medium, High, Critical) | 1.1 |
| 1.4 | BE | `POST /api/tickets` endpoint | 1.1–1.3 |
| 1.5 | FE | Create Ticket form (title, description, priority) | 0.7, 1.4 |
| 1.6 | FE | Display validation errors from API response | 1.5 |
| 1.7 | TEST | Integration tests: successful create, missing fields, invalid priority | 1.4 |

**Working state after Phase 1:** User can create a ticket via UI; ticket persists in DB with `Open` status.

---

### Phase 2 — Ticket Listing & Details

**Goal:** Users can view all tickets and open a detail page.

**Why now:** Listing and detail views are prerequisites for update, assignment, comments, and search. They also validate the read path and DTO shape.

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 2.1 | BE | `GET /api/tickets` — return title, priority, status, assignedTo, createdAt, updatedAt | 1.4 |
| 2.2 | BE | `GET /api/tickets/:id` — full ticket with createdBy and assignedTo details | 1.4 |
| 2.3 | BE | Return 404 for non-existent ticket ID | 2.2 |
| 2.4 | FE | Ticket list page with required columns | 2.1 |
| 2.5 | FE | Ticket detail page (read-only for now) | 2.2 |
| 2.6 | FE | Navigate list → detail | 2.4, 2.5 |
| 2.7 | TEST | Integration tests: list returns tickets, get by id, 404 for missing id | 2.1–2.3 |

**Working state after Phase 2:** User can create tickets, see them in a list, and view full details.

---

### Phase 3 — Ticket Update & Assignment

**Goal:** Users can update ticket fields and assign/reassign tickets.

**Why now:** Field updates and assignment are independent of status workflow and must be stable before layering status transitions on top.

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 3.1 | BE | `PATCH /api/tickets/:id` for title, description, priority | 2.2 |
| 3.2 | BE | Validate `assignedTo`: user must exist in DB; reject invalid user ID with 400 | 3.1 |
| 3.3 | BE | Support assign and unassign (nullable `assignedTo`) | 3.2 |
| 3.4 | BE | Return 404 for update on non-existent ticket | 3.1 |
| 3.5 | FE | Edit form on detail page for title, description, priority | 2.5 |
| 3.6 | FE | Assignee dropdown populated from `GET /api/users` (read-only user list) | 3.2 |
| 3.7 | FE | Show API validation errors on failed update | 3.5 |
| 3.8 | TEST | Integration tests: update fields, valid assignee, invalid assignee, 404 | 3.1–3.4 |

**Working state after Phase 3:** Full ticket CRUD (except status) is functional end-to-end.

---

### Phase 4 — Status Transition Engine (Critical Path)

**Goal:** Enforce the ticket status lifecycle on the backend; expose status change via API and UI.

**Why now:** Status transitions are the highest-risk business rules. Implementing them after CRUD allows updates to be tested independently, but this phase must complete before the project is feature-complete.

**Valid transitions (authoritative):**

```text
Open        → In Progress
In Progress → Resolved
Resolved    → Closed
Open        → Cancelled
In Progress → Cancelled
```

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 4.1 | BE | Extract `StatusTransitionValidator` (pure function or dedicated module) | 3.1 |
| 4.2 | BE | Reject invalid transitions with 400 and clear message | 4.1 |
| 4.3 | BE | Block status changes on terminal states (`Closed`, `Cancelled`) | 4.1 |
| 4.4 | BE | `PATCH /api/tickets/:id/status` or status field on existing PATCH with strict validation | 4.2 |
| 4.5 | FE | Status change control showing only valid next statuses (UX helper; backend still validates) | 2.5, 4.4 |
| 4.6 | FE | Display backend error message on invalid transition attempt | 4.5 |
| 4.7 | TEST | Integration tests: all valid transitions succeed | 4.4 |
| 4.8 | TEST | Integration tests: all invalid transitions rejected (e.g., Open→Closed, Resolved→Open) | 4.4 |
| 4.9 | TEST | Unit tests for `StatusTransitionValidator` matrix | 4.1 |

**Working state after Phase 4:** Complete ticket lifecycle management with enforced backend rules.

---

### Phase 5 — Comments

**Goal:** Users can add and view comments on tickets in chronological order. Comment editing is out of scope for this release; the schema already includes `updatedAt` to support it later.

**Why now:** Comments depend on ticket existence (Phase 2+) and are best added once the detail page is stable.

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 5.1 | BE | `POST /api/tickets/:id/comments` — `message` required, `createdBy` from context; set `updatedAt` equal to `createdAt` on insert | 2.2 |
| 5.2 | BE | Reject comment on non-existent ticket (404) | 5.1 |
| 5.3 | BE | Include comments in `GET /api/tickets/:id` ordered by `createdAt ASC` | 2.2, 5.1 |
| 5.4 | FE | Comment list on detail page | 5.3 |
| 5.5 | FE | Add comment form with error handling | 5.1 |
| 5.6 | TEST | Integration tests: add comment, list chronologically, 404 for bad ticket id | 5.1–5.3 |

**Working state after Phase 5:** Ticket detail shows comments; users can add new comments.

---

### Phase 6 — Search & Filter

**Goal:** Keyword search and status filter, usable together.

**Why now:** Search/filter extends the list query built in Phase 2. Implementing last avoids rework on list API contracts.

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 6.1 | BE | Extend `GET /api/tickets` with `?search=` (title + description) | 2.1 |
| 6.2 | BE | Extend `GET /api/tickets` with `?status=` filter | 2.1 |
| 6.3 | BE | Support combined search + status; return empty array when no matches | 6.1, 6.2 |
| 6.4 | BE | Treat empty search keyword as no search filter (return all, subject to status filter) | 6.1 |
| 6.5 | FE | Search input and status filter dropdown on list page | 6.1–6.3 |
| 6.6 | FE | Preserve filters in URL query params (optional but improves usability) | 6.5 |
| 6.7 | TEST | Integration tests: search only, filter only, combined, no results | 6.1–6.4 |

**Working state after Phase 6:** All core functional requirements are delivered.

---

### Phase 7 — Hardening, Documentation & Final Validation

**Goal:** Meet all non-functional acceptance criteria and prepare for review.

**Why last:** Documentation and cross-cutting hardening reflect the final system, not interim stubs.

| ID | Type | Task | Dependencies |
|----|------|------|--------------|
| 7.1 | BE | Review all endpoints for consistent error response shape | Phase 6 |
| 7.2 | BE | Ensure no internal stack traces leak to clients (500 responses) | 7.1 |
| 7.3 | FE | Global API error handling (network failures, 500) | 7.1 |
| 7.4 | DB | Document Prisma migrate and seed commands in README | 0.3, 0.4 |
| 7.5 | BE | Generate or write OpenAPI/Swagger API documentation | Phase 6 |
| 7.6 | DOC | README: prerequisites, setup, run, test, env configuration | All |
| 7.7 | DOC | Document design decisions (layering, status rules, assumptions) | All |
| 7.8 | DOC | Maintain AI prompt history in `ai-prompts/` | Ongoing |
| 7.9 | TEST | Full regression run; fill any coverage gaps in CRUD, comments, search | Phase 6 |
| 7.10 | TEST | Manual acceptance checklist walkthrough against acceptance-criteria.md | 7.9 |

**Working state after Phase 7:** Production-ready demo aligned with all acceptance criteria.

---

### Feature Dependency Matrix

| Feature | Depends On | Blocks |
|---------|------------|--------|
| DB schema & seeds | — | Everything |
| Ticket create | DB, error handling | List, detail, update |
| Ticket list/detail | Ticket create | Update, status, comments UI |
| Ticket update/assign | List/detail, users seed | Status (optional), full CRUD tests |
| Status transitions | Ticket update, validator | Status UI, status tests |
| Comments | Ticket detail | Comment tests |
| Search & filter | Ticket list API | Search tests, final UI |
| Documentation | All features | Release |

---

## 4. Milestones

Each milestone ends with a demonstrable, working application.

| Milestone | Phases | Deliverable | Acceptance Criteria Covered |
|-----------|--------|-------------|----------------------------|
| **M0: Foundation** | 0 | Running app, DB migrated & seeded, health check | DB schema, seed data, env config |
| **M1: Create Ticket** | 1 | Create ticket via UI, persisted as Open | Ticket creation, validation (partial) |
| **M2: View Tickets** | 2 | List and detail views | Ticket listing, ticket details |
| **M3: Update & Assign** | 3 | Edit ticket fields and assignee | Ticket update, assignee validation |
| **M4: Status Workflow** | 4 | Valid/invalid status transitions enforced | Status management, validation, error messages |
| **M5: Comments** | 5 | Add and view comments chronologically | Comments |
| **M6: Search & Filter** | 6 | Keyword search + status filter combined | Search & filter |
| **M7: Release Ready** | 7 | Tests, docs, error handling complete | Testing, documentation, error handling |

### Suggested Timeline (Indicative)
Assuming one developer working incrementally:
| Milestone | Estimated Effort |
|-----------|------------------|
| M0 | 0.5 day |
| M1 | 0.5–1 day |
| M2 | 0.5 day |
| M3 | 0.5 day |
| M4 | 1 days |
| M5 | 0.5 day |
| M6 | 0.5 day |
| M7 | 1 days |
| **Total** | **~5–6 days** |

M4 (status transitions) should not be compressed; it carries the highest defect risk.

---

## 5. AI Usage Plan

AI assistance is integrated across the software lifecycle. All AI-generated output must be reviewed, tested, and aligned with acceptance criteria before merge.

### Planning

| Activity | AI Role | Human Responsibility |
|----------|---------|---------------------|
| Requirement interpretation | Summarize requirements, flag ambiguities, propose assumptions | Approve scope decisions (see Assumptions table) |
| Implementation planning | Generate task breakdowns, dependency graphs, risk lists | Validate against acceptance criteria; reject scope creep |
| API design | Draft endpoint contracts and DTO shapes | Confirm contracts match business rules |

**Prompt location:** `ai-prompts/planning.md`

### Design

| Activity | AI Role | Human Responsibility |
|----------|---------|---------------------|
| Data model | Propose schema, indexes, relationships | Verify FK constraints and seed strategy |
| Architecture | Suggest layered structure, module boundaries | Enforce separation of concerns |
| Status workflow | Model transition matrix and edge cases | Confirm matrix matches business rules exactly |
| UI wireframes | Suggest page layout and component structure | Ensure all acceptance criteria fields are shown |

**Prompt location:** `ai-prompts/design.md`

### Implementation

| Activity | AI Role | Human Responsibility |
|----------|---------|---------------------|
| Boilerplate | Scaffold project, routes, repositories | Review structure matches plan |
| Business logic | Draft `StatusTransitionValidator`, validation helpers | **Manually verify every transition rule** |
| API endpoints | Generate controller/service/repository stubs | Check HTTP codes and error shapes |
| Frontend forms | Build forms, API integration, error display | Test all user flows manually |
| Migrations/seeds | Draft Prisma schema and migration/seed files | Run `prisma migrate` and seed on clean DB |

**Prompt location:** `ai-prompts/implementation.md`

### Testing

| Activity | AI Role | Human Responsibility |
|----------|---------|---------------------|
| Test cases | Generate transition matrix tests, edge case lists | Ensure every valid/invalid transition is covered |
| Integration tests | Draft Supertest suites for API endpoints | Run tests in CI/local; fix false positives |
| Test data | Propose factory/fixture patterns | Keep fixtures minimal and readable |

**Prompt location:** `ai-prompts/testing.md`

### Debugging

| Activity | AI Role | Human Responsibility |
|----------|---------|---------------------|
| Error analysis | Interpret stack traces, suggest root causes | Confirm fix does not bypass validation |
| Failing tests | Propose fixes for broken tests | Ensure fix addresses root cause, not symptom |
| DB issues | Diagnose migration/connection errors | Verify env configuration |

### Code Review

| Activity | AI Role | Human Responsibility |
|----------|---------|---------------------|
| Pre-review | Scan diffs for missing validation, leaky abstractions | Final review before merge |
| Security check | Flag mass assignment, missing input validation | Confirm no auth scope creep |
| Business rule audit | Compare status logic to requirement matrix | **Reject incorrect AI logic** |

**Prompt location:** `ai-prompts/review.md`

### Documentation

| Activity | AI Role | Human Responsibility |
|----------|---------|---------------------|
| README | Draft setup and run instructions | Verify commands work on clean machine |
| OpenAPI | Generate spec from route definitions | Confirm accuracy |
| Decision log | Document architecture and assumption choices | Keep aligned with actual implementation |
| Prompt history | Maintain log of prompts used per phase | Store in `ai-prompts/` per acceptance criteria |

**Prompt location:** `ai-prompts/documentation.md`

### AI Guardrails

1. Never accept AI-generated status transition logic without test verification.
2. Treat AI output as untrusted until integration tests pass.
3. Do not use AI to justify out-of-scope features.
4. Log significant prompts and outcomes for auditability.

---

## 6. Risks

### Technical Risks

| Risk | Likelihood | Impact | Description |
|------|------------|--------|-------------|
| Incorrect status transition implementation | Medium | High | Invalid transitions accepted or valid ones rejected |
| Weak backend validation | Medium | High | Frontend-only checks; bad data persisted |
| Database migration failures | Medium | Medium | Schema drift between environments |
| Search performance degradation | Low | Medium | Unindexed `ILIKE` queries slow at scale |
| Inconsistent error response format | Medium | Medium | Frontend cannot reliably display errors |
| ORM/schema mismatch | Low | Medium | Runtime errors on create/update |

### Implementation Risks

| Risk | Likelihood | Impact | Description |
|------|------------|--------|-------------|
| AI-generated incorrect business logic | Medium | High | Subtle bugs in transition rules or validation |
| Scope creep | Medium | Medium | Adding auth, deletion, pagination prematurely |
| Frontend/backend contract drift | Medium | Medium | UI sends fields API does not support |
| Delayed testing | Medium | High | Status tests deferred; defects found late |
| Incomplete seed data | Low | Medium | Assignment tests fail without valid users |
| Environment setup friction | Medium | Low | Reviewers cannot run the project |

### Project Risks

| Risk | Likelihood | Impact | Description |
|------|------------|--------|-------------|
| Unresolved requirement clarifications | Low | Medium | Ambiguity causes rework (e.g., editing closed tickets) |
| Underestimating status engine complexity | Medium | Medium | Milestone M4 slips |
| Documentation neglected until end | Medium | Medium | Acceptance criteria for docs not met |

---

## 7. Mitigation Strategy

### Business Rules & Status Transitions

| Risk | Mitigation |
|------|------------|
| Incorrect transition logic | Implement `StatusTransitionValidator` as a pure, isolated module; cover every allowed and disallowed transition with unit and integration tests |
| AI-generated logic errors | Require human review of transition matrix; compare implementation line-by-line against requirements; do not merge without passing test suite |
| Weak validation | Centralize validation in service layer; reject invalid input before persistence; return structured 400 responses |

### Architecture & Quality

| Risk | Mitigation |
|------|------------|
| Layer violations | Enforce: controllers → services → repositories; no business logic in repositories or controllers |
| Contract drift | Define API DTOs early; publish an OpenAPI spec for the JavaScript frontend to follow |
| Delayed testing | Write integration tests in the same phase as the feature (especially Phase 4); run tests in CI on every change |

### Database & Environment

| Risk | Mitigation |
|------|------------|
| Migration failures | Version-controlled migrations; document reset/seed commands; test on clean database before release |
| Config issues | Provide `.env.example`; document all required variables in README |
| Missing seed data | Seed at least 3–5 users in Prisma seed script; verify assignee validation tests use seeded IDs |

### Scope & Delivery

| Risk | Mitigation |
|------|------------|
| Scope creep | Refer all feature requests to acceptance-criteria.md; park optional items in a "Future Enhancements" section |
| Ambiguous requirements | Document assumptions (see Section 1); escalate only if acceptance testing fails |
| Milestone slippage | Protect M4 time budget; descope optional stretch goals (pagination, URL filter state) first |

### AI-Specific Controls

| Risk | Mitigation |
|------|------------|
| Incorrect AI code | Mandatory code review; integration tests as gate; never skip status transition test matrix |
| Over-reliance on AI | Developer owns design decisions and verification; AI accelerates, does not approve |
| Poor prompt traceability | Log prompts per phase in `ai-prompts/`; link decisions to requirement sections |

### Error Handling & Security

| Risk | Mitigation |
|------|------------|
| Leaky error messages | Global error handler strips stack traces in production; log details server-side only |
| Missing HTTP status codes | API review checklist: 400 validation, 404 missing resource, 500 unexpected |
| Input abuse | Validate length limits on title/description; sanitize display in UI (XSS prevention) |

### Contingency Plan

If schedule pressure occurs, reduce scope in this order (without failing acceptance criteria):

1. Defer URL query param persistence for filters (keep filter functionality)
2. Defer optional pagination
3. Minimize UI polish while preserving error message display
4. **Never defer:** status transition tests, backend validation, seed data, README setup instructions

---

## Version Control Strategy

- Implement one feature per commit or logical change.
- Keep commits focused and descriptive.
- Verify functionality before moving to the next phase.

## Appendix A — API Endpoint Summary (Target)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/users` | List seeded users (for assignee dropdown) |
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets` | List tickets (search, status filter) |
| GET | `/api/tickets/:id` | Ticket detail with comments |
| PATCH | `/api/tickets/:id` | Update fields, `assignedTo`, status |
| POST | `/api/tickets/:id/comments` | Add comment |

## Appendix B — Acceptance Criteria Traceability

| Acceptance Criteria Section | Milestone |
|----------------------------|-----------|
| Ticket Creation | M1 |
| Ticket Listing | M2 |
| Ticket Details | M2 |
| Ticket Update | M3 |
| Status Management | M4 |
| Comments | M5 |
| Search & Filter | M6 |
| Validation | M1–M6 (incremental), verified M7 |
| Error Handling | M0, M7 |
| Database | M0 |
| Testing | M1–M6 (incremental), verified M7 |
| Documentation | M7 |

---

*This plan is a living document. Update it when assumptions change or new information is provided by the product owner.*
