# Functional Specification — Support Ticket Management System

> **Purpose:** This document is the functional specification that implementation must follow. It synthesizes [requirement-analysis.md](../../requirement-analysis.md), [acceptance-criteria.md](../../acceptance-criteria.md), and [implementation-plan.md](../../implementation-plan.md).
>
> **Companion docs:** [project-context.md](./project-context.md) (Cursor workflow context), [implementation-plan.md](../../implementation-plan.md) (phases and tasks).

---

## 1. System Overview

### 1.1 Description

The Support Ticket Management System is a backend-heavy, full-stack application for internal users to manage support requests across their lifecycle. Users create, view, update, assign, search, and track tickets; add comments; and change ticket status according to a strict workflow. All data persists in PostgreSQL and survives application restarts.

### 1.2 Goals

| Goal | Description |
|------|-------------|
| Ticket lifecycle management | Full CRUD for tickets plus enforced status workflow |
| Backend authority | All business rules enforced server-side; frontend reflects API contracts only |
| Data persistence | Relational schema with migrations, seed data, and documented setup |
| Usable UI | React frontend with clear validation and error messaging |
| Test coverage | Integration tests for CRUD, comments, search/filter, and status transitions |

### 1.3 Architecture

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

**Layer rules:**

- Controllers map HTTP ↔ DTOs; no business logic.
- Services own validation, status transitions, and orchestration.
- Repositories perform persistence only.
- Frontend may hint at valid next statuses for UX but must not enforce workflow rules.

### 1.4 Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express (or Fastify) + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Frontend | React + JavaScript + Vite (no TypeScript) |
| API | REST + JSON |
| Testing | Vitest + Supertest (backend); Vitest + React Testing Library (frontend) |
| API docs | OpenAPI (Swagger) |

### 1.5 Scope Boundaries

**In scope**

- Ticket create, list, detail, update (title, description, priority, assignee), status changes
- Comment add and view (chronological)
- Keyword search (title + description) and status filter (combined)
- Pre-seeded users (read-only list for assignment)
- Backend validation, layered architecture, integration tests, documentation

**Out of scope**

| Feature | Notes |
|---------|-------|
| Authentication / authorization | Not required; `createdBy` may use stub/header |
| User management | Users are pre-seeded only |
| Ticket or comment deletion | Not in acceptance criteria |
| Comment editing | App feature out of scope; schema includes `updatedAt` for future use |
| Assignment history / audit logs | Future enhancement |
| Pagination | Optional stretch goal |
| Unique ticket titles | Not required |

**Resolved scope decisions**

| Question | Decision |
|----------|----------|
| Priority editable after creation? | Yes |
| Edit Closed/Cancelled tickets? | Allow field updates; block further status changes |
| Empty search keyword? | Treat as no search filter; return all (subject to status filter) |

### 1.6 Assumptions

- Users are pre-seeded before the application starts (minimum 3–5 users recommended).
- Ticket IDs and timestamps are system-generated.
- Search is performed on ticket title and description.
- Application is intended for internal users with a single user role for core implementation.
- `users.role` is seeded for future authorization work but not enforced in this release.

---

## 2. Core Entities

### 2.1 Entity Relationship

```
users ──┬──< tickets (createdBy)
        ├──< tickets (assignedTo, nullable)
        └──< comments (createdBy)

tickets ──< comments (ticketId)
```

### 2.2 User

Pre-seeded internal user. Not managed via API beyond read-only listing.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID or integer | PK, system-generated | |
| `name` | string | Required | Display name |
| `email` | string | Required | |
| `role` | string | Required | Seeded for future auth; not enforced |
| `createdAt` | timestamp | System-generated | |

### 2.3 Ticket

Primary domain entity representing a support request.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID or integer | PK, system-generated | |
| `title` | string | Required | Not required to be unique |
| `description` | string | Required | |
| `priority` | enum | Required | `Low`, `Medium`, `High`, `Critical` |
| `status` | enum | Required | See §4.2; default `Open` on create |
| `assignedTo` | FK → users.id | Nullable | Valid user or null (unassigned) |
| `createdBy` | FK → users.id | Required | From request context stub |
| `createdAt` | timestamp | System-generated | |
| `updatedAt` | timestamp | System-generated | Updated on any ticket change |

**Status enum values:** `Open`, `In Progress`, `Resolved`, `Closed`, `Cancelled`

**Priority enum values:** `Low`, `Medium`, `High`, `Critical`

**Indexes:** `tickets.status`, `tickets.assignedTo`, search support on `title`/`description` (e.g., `ILIKE` or full-text).

### 2.4 Comment

User-authored note attached to a ticket.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID or integer | PK, system-generated | |
| `ticketId` | FK → tickets.id | Required | Parent must exist |
| `message` | string | Required | |
| `createdBy` | FK → users.id | Required | From request context stub |
| `createdAt` | timestamp | System-generated | Used for chronological ordering |
| `updatedAt` | timestamp | System-generated | Set equal to `createdAt` on insert; reserved for future edit support |

Comments are returned ordered by `createdAt ASC` (oldest first).

---

## 3. Functional Requirements

### 3.1 User Capabilities

| ID | Requirement |
|----|-------------|
| FR-U-01 | Users are pre-seeded in the database before use. |
| FR-U-02 | The system exposes a read-only user list for assignee selection. |
| FR-U-03 | Users can be assigned to tickets and associated with comments. |
| FR-U-04 | User management (create, update, delete) is not required. |

### 3.2 Ticket Management

| ID | Requirement |
|----|-------------|
| FR-T-01 | User can create a new support ticket with title, description, and priority. |
| FR-T-02 | New tickets are created with status `Open`. |
| FR-T-03 | User can view all tickets in a list. |
| FR-T-04 | Ticket list displays title, priority, status, assignee, created date, and updated date. |
| FR-T-05 | User can view complete ticket details including associated comments. |
| FR-T-06 | User can update ticket title. |
| FR-T-07 | User can update ticket description. |
| FR-T-08 | User can update ticket priority. |
| FR-T-09 | User can assign or reassign a ticket to a valid user, or unassign (set to null). |
| FR-T-10 | User can change ticket status according to the defined workflow (§4.2). |
| FR-T-11 | All ticket data persists in the database across restarts. |

### 3.3 Comment Management

| ID | Requirement |
|----|-------------|
| FR-C-01 | User can add a comment to an existing ticket. |
| FR-C-02 | Comments are persisted in the database. |
| FR-C-03 | Comments are displayed chronologically on the ticket detail view. |
| FR-C-04 | Comment editing and deletion are not required in this release. |

### 3.4 Search and Filter

| ID | Requirement |
|----|-------------|
| FR-S-01 | User can search tickets by keyword (matches title and/or description). |
| FR-S-02 | User can filter tickets by status. |
| FR-S-03 | Search and status filter can be applied together. |
| FR-S-04 | Combined filters return an empty list when no tickets match (not an error). |
| FR-S-05 | Empty search keyword is treated as no search constraint. |

### 3.5 Error Handling

| ID | Requirement |
|----|-------------|
| FR-E-01 | Missing resources return HTTP 404 with a meaningful message. |
| FR-E-02 | Validation failures return HTTP 400 with field-level or summary errors. |
| FR-E-03 | Unexpected server errors return HTTP 500 without exposing stack traces. |
| FR-E-04 | Frontend displays API validation and error messages to the user. |
| FR-E-05 | Frontend handles network and API failures gracefully. |

### 3.6 Database and Operations

| ID | Requirement |
|----|-------------|
| FR-D-01 | Database schema is versioned via Prisma migrations. |
| FR-D-02 | Seed data includes pre-seeded users. |
| FR-D-03 | Environment configuration is documented (`.env.example`). |
| FR-D-04 | Health check endpoint confirms application and connectivity readiness. |

### 3.7 Testing

| ID | Requirement |
|----|-------------|
| FR-TEST-01 | Integration tests verify all valid status transitions. |
| FR-TEST-02 | Integration tests verify invalid status transitions are rejected. |
| FR-TEST-03 | Integration tests cover ticket CRUD. |
| FR-TEST-04 | Integration tests cover comment add and list. |
| FR-TEST-05 | Integration tests cover search, filter, and combined use. |

---

## 4. Business Rules

### 4.1 Ticket Composition

| Rule | Description |
|------|-------------|
| BR-01 | Every ticket must have title, description, priority, creator (`createdBy`), and status. |
| BR-02 | Every newly created ticket starts with status `Open`. |
| BR-03 | Ticket titles are not required to be unique. |
| BR-04 | Priority may be changed after ticket creation. |

### 4.2 Status Workflow

Valid transitions (authoritative):

```text
Open        → In Progress
In Progress → Resolved
Resolved    → Closed
Open        → Cancelled
In Progress → Cancelled
```

| Rule | Description |
|------|-------------|
| BR-05 | Only the transitions listed above are permitted. |
| BR-06 | Any transition not in the matrix must be rejected with HTTP 400. |
| BR-07 | `Closed` and `Cancelled` are terminal states; no further status changes are allowed. |
| BR-08 | Field updates (title, description, priority, assignee) are permitted on Closed/Cancelled tickets; only status changes are blocked. |

**Invalid transition examples (must be rejected):**

- `Open` → `Closed`, `Open` → `Resolved`
- `In Progress` → `Open`
- `Resolved` → `Open`, `Resolved` → `In Progress`, `Resolved` → `Cancelled`
- `Closed` → any status
- `Cancelled` → any status

**Implementation note:** Extract `StatusTransitionValidator` as a pure, testable module. Cover the full transition matrix with unit and integration tests.

### 4.3 Assignment

| Rule | Description |
|------|-------------|
| BR-09 | Tickets may only be assigned to users that exist in the database. |
| BR-10 | Assigning to a non-existent user ID must be rejected with HTTP 400. |
| BR-11 | `assignedTo` may be set to null to unassign a ticket. |

### 4.4 Comments

| Rule | Description |
|------|-------------|
| BR-12 | Every comment must belong to an existing ticket. |
| BR-13 | Adding a comment to a non-existent ticket returns HTTP 404. |
| BR-14 | Comments are immutable in this release (no edit or delete). |

### 4.5 Authority

| Rule | Description |
|------|-------------|
| BR-15 | Backend validation is the source of truth for all business rules. |
| BR-16 | Frontend must not independently enforce status workflow; it may only suggest valid next statuses for UX. |

---

## 5. API Expectations

### 5.1 Conventions

| Convention | Value |
|------------|-------|
| Base path | `/api` |
| Content-Type | `application/json` |
| Success responses | JSON body with resource or collection |
| Error responses | Consistent JSON shape (see §5.3) |
| Timestamps | ISO 8601 in API responses |
| IDs | Opaque to clients; system-generated |

### 5.2 Endpoints

#### `GET /api/health`

Health check for application and database connectivity.

| | |
|---|---|
| **Success** | `200 OK` — `{ "status": "ok" }` (or equivalent) |
| **Failure** | `503 Service Unavailable` if DB unreachable |

---

#### `GET /api/users`

List pre-seeded users for assignee dropdown.

| | |
|---|---|
| **Success** | `200 OK` — array of `{ id, name, email, role }` |
| **Use** | Populate assignee selector; no write operations |

---

#### `POST /api/tickets`

Create a new ticket.

**Request body:**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "priority": "Low | Medium | High | Critical (required)"
}
```

| | |
|---|---|
| **Success** | `201 Created` — full ticket object with `status: "Open"`, `createdBy`, timestamps |
| **Validation error** | `400 Bad Request` — missing/invalid fields |
| **Server error** | `500 Internal Server Error` |

**Server-side behavior:**

- Set `status` to `Open` (ignore any client-provided status).
- Set `createdBy` from request context stub (header or hardcoded default).
- Set `assignedTo` to null unless explicitly provided and valid (optional for create).

---

#### `GET /api/tickets`

List tickets with optional search and filter.

**Query parameters:**

| Parameter | Type | Behavior |
|-----------|------|----------|
| `search` | string | Case-insensitive match on `title` OR `description`; omit or empty = no search filter |
| `status` | enum | Filter by exact status value |

**Success:** `200 OK` — array of ticket summary objects:

```json
{
  "id": "...",
  "title": "...",
  "priority": "...",
  "status": "...",
  "assignedTo": { "id": "...", "name": "..." } | null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

Combined `search` + `status` applies both filters (AND). No matches returns `[]`.

---

#### `GET /api/tickets/:id`

Retrieve full ticket detail including comments.

| | |
|---|---|
| **Success** | `200 OK` — ticket with `createdBy`, `assignedTo`, all fields, and `comments[]` ordered by `createdAt ASC` |
| **Not found** | `404 Not Found` |

**Comment object shape:**

```json
{
  "id": "...",
  "message": "...",
  "createdBy": { "id": "...", "name": "..." },
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `PATCH /api/tickets/:id`

Update ticket fields and/or status.

**Request body (all fields optional; at least one required):**

```json
{
  "title": "string",
  "description": "string",
  "priority": "Low | Medium | High | Critical",
  "assignedTo": "user-id | null",
  "status": "Open | In Progress | Resolved | Closed | Cancelled"
}
```

| | |
|---|---|
| **Success** | `200 OK` — updated ticket object |
| **Validation error** | `400 Bad Request` — invalid priority, invalid assignee, invalid status transition |
| **Not found** | `404 Not Found` |

**Server-side behavior:**

- Validate each provided field independently.
- Status changes go through `StatusTransitionValidator`.
- Reject status changes from terminal states (`Closed`, `Cancelled`).
- Update `updatedAt` on successful change.

**Alternative:** A dedicated `PATCH /api/tickets/:id/status` endpoint is acceptable if it preserves the same validation rules.

---

#### `POST /api/tickets/:id/comments`

Add a comment to a ticket.

**Request body:**

```json
{
  "message": "string (required)"
}
```

| | |
|---|---|
| **Success** | `201 Created` — comment object |
| **Validation error** | `400 Bad Request` — missing/empty message |
| **Not found** | `404 Not Found` — ticket does not exist |

**Server-side behavior:**

- Set `createdBy` from request context stub.
- Set `updatedAt` equal to `createdAt` on insert.

---

### 5.3 Error Response Format

All error responses use a consistent JSON structure:

```json
{
  "error": "Human-readable summary",
  "details": [
    { "field": "priority", "message": "Invalid priority value" }
  ]
}
```

| HTTP Status | When |
|-------------|------|
| `400 Bad Request` | Validation failures, invalid status transitions, invalid assignee |
| `404 Not Found` | Ticket or resource ID does not exist |
| `500 Internal Server Error` | Unexpected errors; no stack traces in response body |

Log full error details server-side only.

---

## 6. Validation Rules

### 6.1 Ticket Creation

| Field | Rule | Error |
|-------|------|-------|
| `title` | Required, non-empty after trim | `400` — title is required |
| `description` | Required, non-empty after trim | `400` — description is required |
| `priority` | Required; must be one of `Low`, `Medium`, `High`, `Critical` | `400` — invalid priority |
| `status` | Ignored on create; server sets `Open` | — |

**Recommended length limits (defensive):**

| Field | Suggested max |
|-------|---------------|
| `title` | 255 characters |
| `description` | 10,000 characters |

### 6.2 Ticket Update

| Field | Rule | Error |
|-------|------|-------|
| `title` | If provided: non-empty after trim | `400` |
| `description` | If provided: non-empty after trim | `400` |
| `priority` | If provided: valid enum value | `400` — invalid priority |
| `assignedTo` | If provided: valid user ID or `null` | `400` — invalid assignee |
| `status` | If provided: valid transition per §4.2 | `400` — invalid status transition |
| Ticket existence | Ticket ID must exist | `404` |

### 6.3 Status Transitions

| Check | Rule | Error |
|-------|------|-------|
| Current status | Must allow transition to requested status | `400` — e.g., "Cannot transition from Open to Closed" |
| Terminal state | `Closed`/`Cancelled` cannot change status | `400` — status change not allowed |
| Same status | No-op or reject (implementation choice; document in API docs) | — |

### 6.4 Comments

| Field | Rule | Error |
|-------|------|-------|
| `message` | Required, non-empty after trim | `400` — message is required |
| `ticketId` (path) | Ticket must exist | `404` |

**Recommended max length:** 5,000 characters for `message`.

### 6.5 Search and Filter

| Input | Rule | Behavior |
|-------|------|----------|
| `search` | Optional string | Empty or omitted = no text filter |
| `status` | Optional; if provided must be valid enum | `400` if invalid status value |

### 6.6 Edge Cases

| Scenario | Expected behavior |
|----------|-------------------|
| Create ticket without mandatory fields | `400` with field errors |
| Update non-existent ticket | `404` |
| Add comment to non-existent ticket | `404` |
| Assign to invalid user ID | `400` |
| Invalid status transition | `400` with clear message |
| Search with no matches | `200` with empty array |
| Filter by status with no tickets | `200` with empty array |
| Very long title/description | `400` if exceeds limits |
| Concurrent updates to same ticket | Last write wins (no optimistic locking required) |

---

## 7. Acceptance Criteria Mapping

This section maps [acceptance-criteria.md](../../acceptance-criteria.md) checklist items to functional requirements, API endpoints, and implementation milestones.

### 7.1 Core Features

| Acceptance Criterion | Spec Reference | API / Feature | Milestone |
|---------------------|----------------|---------------|-----------|
| User can create a new support ticket | FR-T-01 | `POST /api/tickets` | M1 |
| Ticket requires title, description, and priority | §6.1 | `POST /api/tickets` validation | M1 |
| New tickets are created with Open status | BR-02, FR-T-02 | `POST /api/tickets` | M1 |
| Ticket is persisted in the database | FR-T-11, FR-D-01 | DB + migrations | M0, M1 |
| User can view all tickets | FR-T-03 | `GET /api/tickets` | M2 |
| List displays title, priority, status, assignee, created date, updated date | FR-T-04 | `GET /api/tickets` response shape | M2 |
| User can view complete ticket information | FR-T-05 | `GET /api/tickets/:id` | M2 |
| Associated comments are displayed | FR-T-05, FR-C-03 | `GET /api/tickets/:id` | M2, M5 |
| User can update title | FR-T-06 | `PATCH /api/tickets/:id` | M3 |
| User can update description | FR-T-07 | `PATCH /api/tickets/:id` | M3 |
| User can update priority | FR-T-08, BR-04 | `PATCH /api/tickets/:id` | M3 |
| User can assign or reassign a ticket | FR-T-09, BR-09 | `PATCH /api/tickets/:id` | M3 |
| Valid status transitions are accepted | BR-05, FR-T-10 | `PATCH /api/tickets/:id` | M4 |
| Invalid status transitions are rejected by the backend | BR-06, FR-TEST-02 | `StatusTransitionValidator` | M4 |
| Frontend displays meaningful error messages for invalid transitions | FR-E-04 | Status UI + error display | M4 |
| User can add comments to a ticket | FR-C-01 | `POST /api/tickets/:id/comments` | M5 |
| Comments are persisted and displayed chronologically | FR-C-02, FR-C-03 | Comments API + detail view | M5 |
| User can search tickets using keywords | FR-S-01 | `GET /api/tickets?search=` | M6 |
| User can filter tickets by status | FR-S-02 | `GET /api/tickets?status=` | M6 |
| Search and filters work together correctly | FR-S-03 | Combined query params | M6 |

### 7.2 Validation

| Acceptance Criterion | Spec Reference | Milestone |
|---------------------|----------------|-----------|
| Backend validates all required fields | §6.1, §6.4 | M1–M6 |
| Invalid priorities are rejected | §6.1, §6.2 | M1, M3 |
| Invalid assignee IDs are rejected | BR-10, §6.2 | M3 |
| Invalid status transitions are rejected | BR-06, §6.3 | M4 |
| Invalid request payloads return appropriate validation errors | §5.3, §6 | M1–M6 |

### 7.3 Error Handling

| Acceptance Criterion | Spec Reference | Milestone |
|---------------------|----------------|-----------|
| Missing resources return 404 Not Found | FR-E-01, §5.3 | M0, M2+ |
| Validation failures return 400 Bad Request | FR-E-02, §5.3 | M1+ |
| Unexpected errors return 500 Internal Server Error | FR-E-03, §5.3 | M0, M7 |
| UI displays meaningful error messages | FR-E-04, FR-E-05 | M1+, M7 |

### 7.4 Database

| Acceptance Criterion | Spec Reference | Milestone |
|---------------------|----------------|-----------|
| Database schema is provided | §2, FR-D-01 | M0 |
| Seed data is available | FR-U-01, FR-D-02 | M0 |
| Data persists after application restart | FR-T-11 | M0+ |
| Environment configuration is documented | FR-D-03 | M0, M7 |

### 7.5 Testing

| Acceptance Criterion | Spec Reference | Milestone |
|---------------------|----------------|-----------|
| Integration tests verify valid status transitions | FR-TEST-01 | M4 |
| Integration tests verify invalid status transitions | FR-TEST-02 | M4 |
| Ticket CRUD functionality is tested | FR-TEST-03 | M1–M3 |
| Comment functionality is tested | FR-TEST-04 | M5 |
| Search and filtering are tested | FR-TEST-05 | M6 |

### 7.6 Documentation

| Acceptance Criterion | Deliverable | Milestone |
|---------------------|-------------|-----------|
| README includes setup instructions | README | M7 |
| API documentation is available | OpenAPI/Swagger | M7 |
| Database setup is documented | README + Prisma migrate/seed docs | M0, M7 |
| AI prompt history is maintained | `ai-prompts/` | Ongoing |
| Design and implementation decisions are documented | README / design docs | M7 |

### 7.7 Milestone Summary

| Milestone | Phases | Primary deliverable |
|-----------|--------|---------------------|
| M0: Foundation | 0 | Running app, DB migrated and seeded, health check |
| M1: Create Ticket | 1 | Create ticket via UI, persisted as Open |
| M2: View Tickets | 2 | List and detail views |
| M3: Update & Assign | 3 | Edit fields and assignee |
| M4: Status Workflow | 4 | Valid/invalid transitions enforced |
| M5: Comments | 5 | Add and view comments chronologically |
| M6: Search & Filter | 6 | Keyword search + status filter combined |
| M7: Release Ready | 7 | Tests, docs, error handling complete |

---

## 8. Frontend Expectations

Implementation must provide UI for all functional requirements. Minimum screens:

| Screen | Capabilities |
|--------|--------------|
| Ticket list | Table/cards with required columns; search input; status filter dropdown |
| Ticket detail | Full ticket info; edit form for title, description, priority, assignee; status control; comment list and add form |
| Create ticket | Form with title, description, priority; validation error display |

**UX requirements:**

- Display API validation errors inline or via toast/banner.
- Status control shows only valid next statuses as a UX hint (backend still validates).
- Navigate list → detail → back to list.
- Optional: preserve search/filter in URL query params.

---

## 9. Definition of Done

A feature is complete when:

1. Backend endpoint(s) implemented with validation and correct HTTP status codes.
2. Database changes migrated and seeded where needed.
3. Frontend screen(s) wired to API with error display.
4. Integration test(s) cover happy path and key failure cases.
5. No regressions in previously delivered milestones.

**Never defer:** status transition tests, backend validation, seed data, README setup instructions.

---

*This specification is derived from the authoritative source documents. If conflicts arise, resolve in favor of [acceptance-criteria.md](../../acceptance-criteria.md) for scope and [requirement-analysis.md](../../requirement-analysis.md) for business rules, documenting any deviation in implementation notes.*
