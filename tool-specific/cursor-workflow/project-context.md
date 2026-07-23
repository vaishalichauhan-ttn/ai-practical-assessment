# Project Context — Support Ticket Management System

> **Source of truth:** [requirement-analysis.md](../../requirement-analysis.md), [acceptance-criteria.md](../../acceptance-criteria.md), [implementation-plan.md](../../implementation-plan.md)

## Project Overview

A backend-heavy, full-stack application for internal users to manage support requests across their lifecycle. Users create, view, update, assign, search, and track tickets; add comments; and change status according to a strict workflow. All data persists in PostgreSQL. Users are pre-seeded—no user management is required.

**Highest-risk domain logic:** ticket status transition validation. The backend is the authoritative enforcer of all business rules.

## Objectives

- Deliver end-to-end ticket management: create, list, detail, update, assign, status changes, comments, search, and filter.
- Enforce business rules on the backend; reject invalid input and status transitions with meaningful errors.
- Provide a usable React frontend that surfaces API validation and error messages clearly.
- Ship integration tests covering CRUD, comments, search/filter, and the full status transition matrix.
- Meet acceptance criteria for database setup, error handling, and documentation.

## Functional Scope

| Area | Capabilities |
|------|--------------|
| **Tickets** | Create (title, description, priority → default `Open`); list (title, priority, status, assignee, dates); detail view; update title, description, priority, assignee; status changes per workflow |
| **Comments** | Add and view comments on tickets, displayed chronologically |
| **Search & filter** | Keyword search on title/description; filter by status; combined use |
| **Users** | Pre-seeded only; assignable to tickets and comments; read-only list for assignee dropdown |
| **Validation** | Required fields, priority enum, valid assignee IDs, status transitions |
| **Error handling** | 400 validation, 404 missing resources, 500 unexpected; no stack traces to clients |

**Target API surface:** `GET /api/health`, `GET /api/users`, `POST/GET/PATCH /api/tickets`, `GET /api/tickets/:id`, `POST /api/tickets/:id/comments`.

## Out-of-Scope Features

Do not implement unless explicitly added to acceptance criteria:

- Authentication, authorization, user registration/login, role-based access
- User management (CRUD)
- Ticket or comment deletion
- Comment editing (schema includes `updatedAt` for future use only)
- Assignment history or audit logs
- Pagination (optional stretch goal)
- Unique ticket titles, audit logs, and other clarification items not in acceptance criteria

**Scope decisions:** Priority is editable after creation. Closed/Cancelled tickets allow field updates but block further status changes. Empty search keyword returns all tickets (subject to status filter).

## Technology Stack

| Layer | Choice |
|-------|--------|
| Backend | Node.js + Express (or Fastify) + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Frontend | React + JavaScript + Vite (no TypeScript) |
| API | REST + JSON |
| Testing | Vitest + Supertest (backend integration tests); Vitest + React Testing Library (frontend component/UI tests) |
| API docs | OpenAPI (Swagger) |

Alternatives (e.g., Django, Spring Boot) are acceptable if layered architecture and business-rule enforcement are preserved.

## Architecture Overview

```
Frontend (React) → API (Controllers) → Service (Business Logic) → Repository (Data Access) → PostgreSQL
```

| Layer | Responsibility |
|-------|----------------|
| **Controllers** | HTTP mapping, DTOs, status codes, consistent error format |
| **Service** | Validation, status transitions, assignee checks, orchestration |
| **Repository** | CRUD and queries only—no business logic |
| **Frontend** | UX, forms, error display; may hint at valid next statuses but never enforces rules |

**Schema (core entities):** `users` (id, name, email, role), `tickets` (id, title, description, priority, status, assignedTo, createdBy, timestamps), `comments` (id, ticketId, message, createdBy, timestamps).

Delivery follows vertical slices (DB + API + UI + tests per milestone). Critical path: foundation → ticket CRUD → status engine → comments → search/filter → hardening/docs.

## Business Rules

1. Every ticket requires title, description, priority, creator, and status.
2. New tickets start with status **Open**.
3. **Valid status transitions only:**

   ```text
   Open        → In Progress
   In Progress → Resolved
   Resolved    → Closed
   Open        → Cancelled
   In Progress → Cancelled
   ```

4. Any other transition is rejected (400). Terminal states (`Closed`, `Cancelled`) block further status changes.
5. Comments must belong to an existing ticket.
6. Tickets may only be assigned to valid seeded users.
7. Backend validation is the source of truth—frontend must not independently enforce workflow rules.

**Assumptions:** Ticket IDs and timestamps are system-generated. Search covers title and description. Single user role for core implementation. `createdBy` may use a stub/header until auth exists.

## Coding Principles

- **Backend as source of truth** — Centralize validation and business rules in the service layer.
- **Layered separation** — Controllers → services → repositories; no business logic in repositories or controllers.
- **Minimal scope** — Implement acceptance criteria first; defer stretch goals (pagination, URL filter state).
- **Feature-driven slices** — Each milestone yields working software (DB + API + UI + tests).
- **Extract high-risk logic** — `StatusTransitionValidator` as a pure, testable module.
- **Consistent errors** — Structured 400/404/500 responses; log details server-side only.
- **Review AI output** — Especially status transition logic; never merge without test verification.
- **One focused change per commit** — Verify functionality before advancing phases.

## Testing Expectations

- **Backend integration tests (required):** Valid and invalid status transitions; ticket CRUD; comment add/list; search and filter (alone and combined).
- **Frontend tests (required):** Vitest + React Testing Library for components, routing, and UI states; mock API modules.
- **Unit tests (recommended):** `StatusTransitionValidator` transition matrix; shared frontend utilities.
- **Per-feature DoD:** Endpoint with validation + migrated DB + wired UI + backend and frontend tests where applicable + no regressions.
- **Test with real HTTP layer** — Supertest against running API, not mocked business rules for integration coverage.
- **Test frontend UI with React Testing Library** — Vitest + jsdom for component rendering, routing, and error display; mock API client modules.
- **Never defer:** Status transition tests, backend validation, seed data.

## Documentation Expectations

- **README:** Prerequisites, setup, run, test, and environment configuration (`.env.example`).
- **API documentation:** OpenAPI/Swagger spec aligned with implemented endpoints.
- **Database:** PostgreSQL with Prisma — migration and seed commands documented.
- **Design decisions:** Layering, status rules, scope assumptions (see implementation plan).
- **AI prompt history:** Maintained in `ai-prompts/` per acceptance criteria.
- **Living docs:** Update plan and context when assumptions or scope change.

---

*For task breakdown, milestones, and phase details, see [implementation-plan.md](../../implementation-plan.md). For checklists, see [acceptance-criteria.md](../../acceptance-criteria.md).*
