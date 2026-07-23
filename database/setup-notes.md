# Database Setup Notes

PostgreSQL **16** + Prisma. Runtime source of truth: [`backend/prisma/`](../backend/prisma/). This `database/` folder mirrors schema, migrations, and seed for review.

## Prerequisites

| Dependency | Version / notes |
|------------|-----------------|
| Node.js | 20.x (LTS) |
| npm | 10.x |
| Docker | Recommended for Postgres via Compose |
| PostgreSQL | **16** (`docker-compose.yml`; Prisma 6 supports 14+) |

## Environment

```bash
cp backend/.env.example backend/.env
```

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | App DB (`support_tickets`) |
| `DATABASE_URL_TEST` | Isolated test DB (`support_tickets_test`) |

See [`backend/.env.example`](../backend/.env.example). Do not commit `backend/.env`.

## One-shot setup

```bash
npm install
cp backend/.env.example backend/.env
npm run db:setup
```

Runs `db:up` → `db:migrate` → `db:seed`.

## Step-by-step

### 1. Start PostgreSQL

```bash
npm run db:up
# docker compose up -d
```

Compose starts **PostgreSQL 16** and creates `support_tickets`. Wait until `support-tickets-db` is healthy.

Local Postgres 16: create the DB and point `DATABASE_URL` at it.

### 2. Apply migrations

Development:

```bash
npm run db:migrate
# prisma migrate dev
```

Clean / CI (apply existing migrations only):

```bash
npm run db:migrate:deploy -w backend
# prisma migrate deploy
```

Migration files: [`schema-or-migrations/migrations/`](./schema-or-migrations/migrations/) (mirror of `backend/prisma/migrations/`).

### 3. Seed users

```bash
npm run db:seed
# prisma db seed
```

Safe to re-run (upsert by email). Seed script: [`seed-data/seed.ts`](./seed-data/seed.ts).

| Name | Email | Role |
|------|-------|------|
| Alice Johnson | alice.johnson@example.com | support_agent |
| Bob Smith | bob.smith@example.com | support_agent |
| Carol Williams | carol.williams@example.com | team_lead |
| David Brown | david.brown@example.com | support_agent |
| Eva Martinez | eva.martinez@example.com | admin |

Default acting user when `X-User-Id` is omitted: `alice.johnson@example.com`.

## Verify

```bash
curl http://localhost:3001/api/health
```

Expect five rows in `users` after migrate + seed.

## Stop database

```bash
npm run db:down
# docker compose down
```

## Schema overview

| Table | Purpose |
|-------|---------|
| `users` | Pre-seeded assignees / comment authors (no user CRUD) |
| `tickets` | Support tickets (priority, status, assignee, creator) |
| `comments` | Ticket comments (chronological by `created_at`) |

Enums: `Priority` (Low, Medium, High, Critical); `TicketStatus` (Open, In Progress, Resolved, Closed, Cancelled).

Full Prisma schema: [`schema-or-migrations/schema.prisma`](./schema-or-migrations/schema.prisma).
