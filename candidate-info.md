# Candidate Information

| Field | Value |
|-------|-------|
| **Name** | Vaishali Chauhan |
| **Role** | Associate Technical Lead |
| **Primary Technology Stack** | Node.js + Express + TypeScript (backend); React + JavaScript + Vite (frontend); PostgreSQL 16 + Prisma |
| **Primary AI Tool Used** | Cursor AI |
| **Project Option Selected** | Support Ticket Management System (Backend-heavy) |
| **Assessment Start Date** | 2026-07-20 |
| **Submission Date** | 2026-07-23 |

---

## Project Summary

Full-stack **Support Ticket Management System** for internal users to create, list, view, update, assign, search/filter, and track support tickets, with comments and a backend-enforced status lifecycle.

- **Backend** is the source of truth for validation and business rules (including status transitions).
- **Users** are pre-seeded; there is no authentication or user management.
- **Data** is persisted in PostgreSQL via Prisma (migrations + seed).
- **Frontend** provides a usable UI that surfaces API/validation errors; status workflow rules are not enforced client-side.

Core capabilities delivered: ticket CRUD (create/list/detail/update/assign), status transitions, comments, keyword search + status filter, layered API architecture, automated backend/frontend tests, and reviewer documentation (README, API contract, OpenAPI/Swagger).

---

## Tools Used

| Category | Tools |
|----------|--------|
| AI | Cursor AI (implementation, testing, debugging, documentation, code review); project Cursor Rules and reusable commands/prompts |
| Backend | Node.js 20, Express, TypeScript, Prisma |
| Frontend | React, JavaScript, Vite |
| Database | PostgreSQL 16, Docker Compose |
| Testing | Vitest + Supertest (backend); Vitest + React Testing Library (frontend) |
| API docs | OpenAPI / Swagger UI |
| Version control / tooling | Git, npm workspaces |

Prompt history and workflow notes: [`ai-prompts/`](ai-prompts/), [`tool-workflow.md`](tool-workflow.md).

---

## Setup Summary

**Prerequisites:** Node.js 20.x, npm 10.x, Docker (recommended for Postgres).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp backend/.env.example backend/.env

# 3. Start Postgres, migrate, and seed users
npm run db:setup

# 4. Run backend + frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |
| Swagger UI | http://localhost:3001/api-docs |

**Tests** (Postgres must be running): `npm run test`

Full setup, env vars, and DB notes: [`README.md`](README.md), [`database/setup-notes.md`](database/setup-notes.md).
