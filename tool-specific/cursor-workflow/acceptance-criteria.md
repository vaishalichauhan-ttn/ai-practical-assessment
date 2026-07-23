# Acceptance Criteria — AI Implementation Checklist

> **Source of truth:** [acceptance-criteria.md](../../acceptance-criteria.md)
>
> **Companion docs:** [project-context.md](./project-context.md), [spec.md](./spec.md), [tasks.md](./tasks.md)

This document summarizes the authoritative acceptance criteria into a concise checklist for AI-assisted development in Cursor. Every item below maps directly to the root acceptance criteria—no scope has been added or removed.

**How to use:** Work through milestones M0 → M7 in order. Mark an item complete only when the behavior is implemented, tested, and verified. After each milestone, run existing tests before continuing.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Frontend | React + JavaScript + Vite (no TypeScript) |
| Testing (backend) | Vitest + Supertest (API integration tests) |
| Testing (frontend) | Vitest + React Testing Library (component/UI tests) |

---

## M0 — Foundation

### Database & Environment

- [ ] PostgreSQL database schema is provided via Prisma (users, tickets, comments).
- [ ] Prisma migrations and seed data are available (pre-seeded users for assignment).
- [ ] Data persists after application restart.
- [ ] Environment configuration is documented (`.env.example`, setup steps).

---

## M1 — Ticket Creation

### Create Ticket (API + UI)

- [ ] User can create a new support ticket.
- [ ] Ticket requires title, description, and priority.
- [ ] New tickets are created with **Open** status.
- [ ] Ticket is persisted in the database.

### Validation (create)

- [ ] Backend validates all required fields on create.
- [ ] Invalid priorities are rejected.
- [ ] Invalid request payloads return appropriate validation errors.

### Error Handling (create)

- [ ] Validation failures return **400 Bad Request**.
- [ ] UI displays meaningful error messages.

---

## M2 — Ticket Listing & Detail

### List & Detail (API + UI)

- [ ] User can view all tickets.
- [ ] Ticket list displays title, priority, status, assignee, created date, and updated date.
- [ ] User can view complete ticket information.
- [ ] Associated comments are displayed on the detail view.

### Error Handling (read)

- [ ] Missing resources return **404 Not Found**.
- [ ] UI displays meaningful error messages.

---

## M3 — Ticket Update & Assignment

### Update Fields (API + UI)

- [ ] User can update title.
- [ ] User can update description.
- [ ] User can update priority.
- [ ] User can assign or reassign a ticket.

### Validation (update)

- [ ] Backend validates all required fields on update.
- [ ] Invalid priorities are rejected.
- [ ] Invalid assignee IDs are rejected.
- [ ] Invalid request payloads return appropriate validation errors.

---

## M4 — Status Workflow

### Status Transitions (API + UI)

- [ ] Valid status transitions are accepted.
- [ ] Invalid status transitions are rejected by the backend.
- [ ] Frontend displays meaningful error messages for invalid transitions.

### Validation (status)

- [ ] Invalid status transitions are rejected.

### Testing (status)

- [ ] Integration tests verify valid status transitions.
- [ ] Integration tests verify invalid status transitions.

---

## M5 — Comments

### Add & View Comments (API + UI)

- [ ] User can add comments to a ticket.
- [ ] Comments are persisted and displayed chronologically.

### Testing (comments)

- [ ] Comment functionality is tested.

---

## M6 — Search & Filter

### Search & Filter (API + UI)

- [ ] User can search tickets using keywords.
- [ ] User can filter tickets by status.
- [ ] Search and filters work together correctly.

### Testing (search & filter)

- [ ] Search and filtering are tested.

---

## M7 — Release Ready

### Cross-Cutting Validation

- [ ] Backend validates all required fields across all endpoints.
- [ ] Invalid priorities are rejected.
- [ ] Invalid assignee IDs are rejected.
- [ ] Invalid status transitions are rejected.
- [ ] Invalid request payloads return appropriate validation errors.

### Cross-Cutting Error Handling

- [ ] Missing resources return **404 Not Found**.
- [ ] Validation failures return **400 Bad Request**.
- [ ] Unexpected errors return **500 Internal Server Error**.
- [ ] UI displays meaningful error messages.

### Testing (CRUD)

- [ ] Ticket CRUD functionality is tested (backend integration tests).
- [ ] Frontend test suite runs via `npm run test -w frontend`.
- [ ] Component and utility tests use Vitest + React Testing Library.

### Documentation

- [ ] README includes setup instructions.
- [ ] API documentation is available.
- [ ] Database setup is documented (PostgreSQL + Prisma migrate/seed commands).
- [ ] AI prompt history is maintained.
- [ ] Design and implementation decisions are documented.

---

## AI Verification Prompts

Use these prompts at milestone boundaries to confirm nothing was missed:

| Milestone | Verification focus |
|-----------|-------------------|
| M0 | Schema migrated, seed data loads, app restarts with data intact, env vars documented |
| M1 | Create ticket via UI → persisted as Open; missing/invalid fields return 400 |
| M2 | List shows all required columns; detail shows full ticket + comments section |
| M3 | Edit title, description, priority, assignee; invalid assignee returns 400 |
| M4 | Allowed transitions succeed; disallowed transitions return 400 with clear UI message |
| M5 | Add comment → appears chronologically; comment on missing ticket returns 404 |
| M6 | Keyword search, status filter, and combined search+filter all return correct results |
| M7 | All backend integration and frontend tests pass; README, API docs, and setup instructions are complete |

---

## Definition of Done (per feature)

A feature is done when all of the following are true:

1. Backend endpoint(s) enforce validation and return correct HTTP status codes.
2. Database changes are migrated and seeded where needed.
3. Frontend is wired to the API and surfaces errors clearly.
4. Backend integration test(s) cover the happy path and key failure cases.
5. Frontend automated test(s) cover user-visible behavior where applicable.
6. No regressions in previously completed milestones.

**Never defer:** status transition tests, backend validation, seed data, README setup instructions.

---

*If this checklist conflicts with [acceptance-criteria.md](../../acceptance-criteria.md), the root document governs scope.*
