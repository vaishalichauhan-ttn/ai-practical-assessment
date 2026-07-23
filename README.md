# Support Ticket Management System

Full-stack application for creating, assigning, searching, and tracking support tickets. Internal users manage tickets across their lifecycle—create, list, update, assign, change status, add comments, and search/filter—with all data persisted in PostgreSQL via Prisma.

The backend is the source of truth for validation and business rules (including status transitions). Users are pre-seeded; there is no authentication or user management.

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + JavaScript + Vite |
| Database | PostgreSQL 16 + Prisma |
| API | REST + JSON (`/api`) |
| Testing | Vitest + Supertest (backend); Vitest + React Testing Library (frontend) |

API details: [`api-contract.md`](api-contract.md) (source of truth). Interactive docs: [Swagger UI](http://localhost:3001/api-docs) (`/api-docs`). Machine-readable OpenAPI: [`backend/docs/openapi.yaml`](backend/docs/openapi.yaml).

---

## Prerequisites

| Dependency | Version / notes |
|------------|-----------------|
| Node.js | 20.x (LTS) — required for local development |
| npm | 10.x (comes with Node 20) — required for local development |
| Docker | Docker Engine + Docker Compose v2 (required for Compose Postgres and full-stack Docker) |
| PostgreSQL | **16** (project default via `docker-compose.yml`; Prisma 6 supports PostgreSQL 14+) |

---

## Quick start (reviewers)

### Option A — Full stack with Docker (recommended for a quick demo)

Requires Docker only (no local Node install needed to run the apps):

```bash
docker compose up --build
```

Then open:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |
| Swagger UI | http://localhost:3001/api-docs |

On startup the backend waits for Postgres, runs `prisma migrate deploy`, seeds users, then serves the API. The frontend nginx proxies `/api` to the backend.

See [Running with Docker](#running-with-docker) for stop, rebuild, and volume notes.

### Option B — Local development (Node + Compose Postgres)

From a fresh clone, with Docker available for Postgres:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp backend/.env.example backend/.env

# 3. Start Postgres, migrate, and seed users
npm run db:setup

# 4. Run backend + frontend together
npm run dev
```

Then open the same URLs as above. Vite proxies `/api` to the backend, so the UI works without extra frontend env configuration.

---

## Environment configuration

Copy the backend example env file and adjust if needed:

```bash
cp backend/.env.example backend/.env
```

See [`backend/.env.example`](backend/.env.example) for all required variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Connection string for the app database (default: `support_tickets`) |
| `DATABASE_URL_TEST` | Connection string for the isolated test database (`support_tickets_test`) |
| `PORT` | Backend HTTP port (default: `3001`) |
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) |

**Frontend:** Optional `VITE_API_BASE_URL`. Leave unset in local development—the Vite dev server proxies `/api` to `http://localhost:3001`. In Docker, leave it empty as well so the browser uses same-origin `/api` (nginx proxies to the backend service).

**Docker vs local `DATABASE_URL`:** Local apps use `localhost` (see `.env.example`). The Compose `backend` service sets `DATABASE_URL` with hostname `postgres` automatically—do not point a local `npm run dev` backend at the `postgres` hostname.

Do not commit `backend/.env` or any real credentials.

---

## Running with Docker

### Prerequisites

- Docker Engine and Docker Compose v2 (`docker compose version`)

### Build and start all services

```bash
docker compose up --build
```

Starts `postgres`, `backend`, and `frontend`. Detached mode:

```bash
docker compose up --build -d
```

| Service | Host URL | Notes |
|---------|----------|-------|
| Frontend | http://localhost:5173 | nginx serves the Vite build; proxies `/api` → backend |
| Backend | http://localhost:3001 | Express API; migrations + seed run on container start |
| PostgreSQL | localhost:5432 | User/password/db: `postgres` / `postgres` / `support_tickets` |

### Stop services

```bash
docker compose down
```

This stops and removes containers and the default network. The Postgres data volume is **kept**.

### Rebuild after code changes

```bash
docker compose up --build
```

Or rebuild a single service:

```bash
docker compose build backend
docker compose up -d backend
```

### Database persistence

- Postgres data is stored in the named volume `postgres_data`.
- `docker compose down` preserves the volume; tickets and users remain across restarts.
- To wipe the database volume (destructive): `docker compose down -v` — then the next `up` recreates an empty DB; the backend entrypoint re-applies migrations and seed.

### Migrations in Docker

The backend container entrypoint runs:

1. `prisma migrate deploy` — apply existing migrations
2. `prisma db seed` — upsert seed users (safe to re-run)
3. `node dist/index.js` — start the API

No manual migrate/seed step is required for the Compose full-stack path.

### Local workflow remains unchanged

`npm run db:up` starts **only** the Postgres service (`docker compose up -d postgres`) so local `npm run dev` and tests keep working without starting the containerized frontend/backend.

---

## Database setup (migrations and seed)

Reviewer deliverables (schema, seed, setup notes): [`database/`](database/) — see [`database/setup-notes.md`](database/setup-notes.md). Runtime Prisma files remain under `backend/prisma/`.

### 1. Start PostgreSQL

Using Docker Compose (recommended; runs **PostgreSQL 16**):

```bash
npm run db:up
# equivalent: docker compose up -d postgres
```

Wait until the `support-tickets-db` container is healthy. Compose creates the `support_tickets` database automatically.

If you use a local PostgreSQL 16 install instead, create the database and point `DATABASE_URL` in `backend/.env` at it (same format as in `.env.example`).

### 2. Apply migrations

From the repository root (development — creates/applies migrations interactively):

```bash
npm run db:migrate
# equivalent: npm run db:migrate -w backend
# underlying: prisma migrate dev
```

On a clean or CI-style database (apply existing migrations only, no prompts):

```bash
npm run db:migrate:deploy -w backend
# underlying: prisma migrate deploy
```

Or from `backend/`:

```bash
cd backend
npx prisma migrate deploy
```

### 3. Seed users

Seed pre-defined users (safe to re-run; uses upsert by email):

```bash
npm run db:seed
# equivalent: npm run db:seed -w backend
# underlying: prisma db seed
```

Or from `backend/`:

```bash
cd backend
npx prisma db seed
```

Seeded users:

| Name | Email | Role |
|------|-------|------|
| Alice Johnson | alice.johnson@example.com | support_agent |
| Bob Smith | bob.smith@example.com | support_agent |
| Carol Williams | carol.williams@example.com | team_lead |
| David Brown | david.brown@example.com | support_agent |
| Eva Martinez | eva.martinez@example.com | admin |

### One-shot setup

Start Postgres, apply migrations, and seed users:

```bash
npm run db:setup
```

This runs `db:up` → `db:migrate` → `db:seed`.

### Verify

After migrate + seed, you should have five users queryable in the `users` table. Confirm the API is healthy:

```bash
curl http://localhost:3001/api/health
```

Stop the database container when finished:

```bash
npm run db:down
# equivalent: docker compose down
```

Stops all Compose services. Postgres data in `postgres_data` is retained unless you pass `-v`.

---

## Installation

From the repository root:

```bash
npm install
```

This is an npm workspaces monorepo (`backend/` and `frontend/`). Root `npm install` installs dependencies for both packages.

Then configure env and the database as described above (`cp backend/.env.example backend/.env` and `npm run db:setup`).

---

## Running in development

### Backend and frontend together

```bash
npm run dev
```

Starts both packages via `concurrently`:

- Backend: `tsx watch` on port **3001**
- Frontend: Vite on port **5173** (proxies `/api` → backend)

### Backend only

```bash
npm run dev -w backend
```

### Frontend only

```bash
npm run dev -w frontend
```

Requires the backend to be running (or `VITE_API_BASE_URL` pointing at a reachable API).

---

## Building the application

From the repository root:

```bash
npm run build
```

Runs TypeScript compile for the backend (`tsc` → `backend/dist/`) and Vite production build for the frontend (`frontend/dist/`).

### Run the production backend build

Ensure `backend/.env` is set and the database is migrated, then:

```bash
npm run start -w backend
```

### Preview the frontend production build

```bash
npm run preview -w frontend
```

---

## Running tests

PostgreSQL must be running (`npm run db:up`) before backend tests. Backend tests create/migrate/seed an isolated `support_tickets_test` database automatically (via `DATABASE_URL_TEST`).

### Full test suite

```bash
npm run test
```

Runs backend tests, then frontend tests.

### Backend tests only

```bash
npm run test -w backend
```

Integration tests (Vitest + Supertest) cover ticket CRUD, status transitions, comments, search/filter, and error handling. Watch mode:

```bash
npm run test:watch -w backend
```

### Frontend tests only

```bash
npm run test -w frontend
```

Component and UI tests (Vitest + React Testing Library) with mocked API modules. Watch mode:

```bash
npm run test:watch -w frontend
```

---

## Project structure

```text
.
├── backend/                 # Express + TypeScript API
│   ├── prisma/              # Runtime schema, migrations, seed
│   ├── docs/openapi.yaml    # OpenAPI 3 spec
│   ├── .env.example         # Required environment variables
│   └── src/
│       ├── controllers/     # HTTP handlers
│       ├── services/        # Business logic & validation
│       ├── repositories/    # Data access (Prisma)
│       ├── validators/      # Status transitions & input rules
│       ├── middleware/      # Errors, request context, parsing
│       ├── routes/          # /api route wiring
│       └── test/            # Test DB helpers
├── frontend/                # React + Vite UI
│   └── src/
│       ├── api/             # API client wrappers
│       ├── pages/           # Home, tickets list, ticket detail
│       ├── components/      # Shared UI (e.g. create ticket)
│       └── constants/       # Priority/status display helpers
├── database/                # Reviewer-facing DB deliverables
│   ├── schema-or-migrations/
│   ├── seed-data/
│   └── setup-notes.md
├── docker-compose.yml       # frontend + backend + PostgreSQL 16
├── .dockerignore            # Build context exclusions
├── api-contract.md          # Human-readable API contract
├── implementation-plan.md   # Phases, stack, scope decisions
└── package.json             # Workspace scripts (dev, build, test, db:*)
```

Dockerfiles: `backend/Dockerfile` (Express + Prisma migrate/seed entrypoint), `frontend/Dockerfile` (Vite build + nginx).

Architecture: **Controllers → Services → Repositories → PostgreSQL**. Frontend displays API errors but does not enforce status workflow rules.

---

## Assumptions and reviewer notes

- **No authentication.** Optional header `X-User-Id: <uuid>` sets the acting user. If omitted, the backend uses the seeded default user `alice.johnson@example.com`.
- **Users are seed-only.** There is no user CRUD, registration, or login.
- **Status transitions** (enforced by the backend only):

  ```text
  Open        → In Progress | Cancelled
  In Progress → Resolved | Cancelled
  Resolved    → Closed
  Closed / Cancelled → (terminal; no further status changes)
  ```

  Field updates (title, description, priority, assignee) are still allowed on Closed/Cancelled tickets.
- **Out of scope:** ticket/comment deletion, comment editing, pagination, assignment history, audit logs, role-based access.
- **Ports:** backend `3001`, frontend `5173`, Postgres `5432`. Change via `PORT` / Vite config / `DATABASE_URL` if needed.
- **Tests need Docker Postgres** (or equivalent) on `localhost:5432` with credentials matching `.env.example`. Backend tests use `support_tickets_test`, not the app database.
- **Further reading:** [`implementation-plan.md`](implementation-plan.md), [`tool-specific/cursor-workflow/project-context.md`](tool-specific/cursor-workflow/project-context.md), [`acceptance-criteria.md`](acceptance-criteria.md).
