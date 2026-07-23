# API Contract

> **Version:** 1.0.0  
> **Base path:** `/api`  
> **Format:** JSON (`Content-Type: application/json`)  
> **OpenAPI spec:** [backend/docs/openapi.yaml](./backend/docs/openapi.yaml) · **Swagger UI:** `/api-docs`

Derived from `tool-specific/cursor-workflow/spec.md`, `design-notes.md`, and `acceptance-criteria.md`.

---

## Table of Contents

1. [Global Conventions](#global-conventions)
2. [Shared Schemas](#shared-schemas)
3. [Status Transition Rules](#status-transition-rules)
4. [Endpoints](#endpoints)
5. [Validation Matrix](#validation-matrix)
6. [Out of Scope](#out-of-scope)

---

## Global Conventions

| Convention | Value |
|------------|-------|
| Base URL | `/api` |
| Content-Type | `application/json` (request and response) |
| Authentication | **Not in scope** — `createdBy` comes from a request-context stub |
| Request context header | `X-User-Id: <uuid>` (optional; falls back to a dev default user if omitted) |
| ID format | UUID v4 string, e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` |
| Timestamps | ISO 8601 UTC, e.g. `"2026-07-23T09:15:00.000Z"` |
| Pagination | **Out of scope** (stretch goal) |
| Concurrent updates | Last write wins (no optimistic locking) |

### Enums

**Priority:** `Low | Medium | High | Critical`

**TicketStatus:** `Open | In Progress | Resolved | Closed | Cancelled`

### HTTP Status Codes

| Status | Usage |
|--------|-------|
| `200` | Successful read or update |
| `201` | Successful create (ticket, comment) |
| `400` | Validation failure, invalid enum, invalid assignee, invalid status transition, malformed JSON, empty PATCH body |
| `404` | Ticket not found, unknown route |
| `500` | Unexpected server error (no stack trace in body) |
| `503` | Health check — database unreachable |

### Error Response Format

All error responses use this shape:

```json
{
  "error": "Human-readable summary",
  "details": [
    { "field": "priority", "message": "Invalid priority value" }
  ]
}
```

`details` is optional but recommended for field-level validation errors.

---

## Shared Schemas

### `UserSummary`

Returned by `GET /api/users`.

```json
{
  "id": "string (uuid)",
  "name": "string",
  "email": "string",
  "role": "string"
}
```

### `UserRef`

Minimal user reference in ticket and comment responses.

```json
{
  "id": "string (uuid)",
  "name": "string"
}
```

### `TicketSummary`

Returned by `GET /api/tickets`.

```json
{
  "id": "string (uuid)",
  "title": "string",
  "priority": "Low | Medium | High | Critical",
  "status": "Open | In Progress | Resolved | Closed | Cancelled",
  "assignedTo": "UserRef | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### `Ticket`

Returned by create, update, and `GET /api/tickets/:id`. Does **not** include comments — use `GET /api/tickets/:id/comments` for comment data.

```json
{
  "id": "string (uuid)",
  "title": "string",
  "description": "string",
  "priority": "Low | Medium | High | Critical",
  "status": "Open | In Progress | Resolved | Closed | Cancelled",
  "assignedTo": "UserRef | null",
  "createdBy": "UserRef",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### `Comment`

Returned by `GET /api/tickets/:id/comments` (array) and `POST /api/tickets/:id/comments` (single object).

```json
{
  "id": "string (uuid)",
  "message": "string",
  "createdBy": "UserRef",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

---

## Status Transition Rules

Enforced on `PATCH /api/tickets/:id` when `status` is provided.

| From | Allowed transitions |
|------|---------------------|
| `Open` | `In Progress`, `Cancelled` |
| `In Progress` | `Resolved`, `Cancelled` |
| `Resolved` | `Closed` |
| `Closed` | *(none — terminal)* |
| `Cancelled` | *(none — terminal)* |

**Terminal state rule:** `Closed` and `Cancelled` tickets may still be updated for `title`, `description`, `priority`, and `assignedTo`, but any `status` change returns `400`.

### Must succeed (5 transitions)

| From | To |
|------|----|
| `Open` | `In Progress` |
| `In Progress` | `Resolved` |
| `Resolved` | `Closed` |
| `Open` | `Cancelled` |
| `In Progress` | `Cancelled` |

### Must fail (representative)

| From | To | Reason |
|------|----|--------|
| `Open` | `Closed` | Skips workflow |
| `Open` | `Resolved` | Skips workflow |
| `In Progress` | `Open` | Backward |
| `Resolved` | `Open` | Backward |
| `Resolved` | `In Progress` | Backward |
| `Resolved` | `Cancelled` | Not in matrix |
| `Closed` | any | Terminal |
| `Cancelled` | any | Terminal |

---

## Endpoints

## Endpoint: Health Check

Method: `GET`  
Path: `/api/health`  
Purpose: Health check for application and database connectivity.

### Request

```json
{}
```

No headers, query parameters, or request body required.

### Response

**200 OK**

```json
{
  "status": "ok"
}
```

**503 Service Unavailable**

```json
{
  "status": "error",
  "error": "Database connection unavailable"
}
```

### Validation Rules

- None.

### Error Responses

| Status | Body |
|--------|------|
| `503` | `{ "status": "error", "error": "Database connection unavailable" }` |

---

## Endpoint: List Users

Method: `GET`  
Path: `/api/users`  
Purpose: Read-only list of pre-seeded users for assignee selection.

### Request

```json
{}
```

No headers, query parameters, or request body required.

### Response

**200 OK**

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "agent"
  },
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "Bob Smith",
    "email": "bob@example.com",
    "role": "admin"
  }
]
```

### Validation Rules

- None.

### Error Responses

| Status | Body |
|--------|------|
| `500` | `{ "error": "Internal server error" }` |

---

## Endpoint: Create Ticket

Method: `POST`  
Path: `/api/tickets`  
Purpose: Create a new support ticket.

### Request

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `X-User-Id` | No | UUID of creating user; defaults to dev stub if omitted |

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "priority": "Low | Medium | High | Critical (required)",
  "assignedTo": "string (uuid) | null (optional)"
}
```

### Response

**201 Created**

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "title": "Cannot log in to dashboard",
  "description": "User reports 401 error after password reset.",
  "priority": "High",
  "status": "Open",
  "assignedTo": null,
  "createdBy": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alice Johnson"
  },
  "createdAt": "2026-07-23T09:00:00.000Z",
  "updatedAt": "2026-07-23T09:00:00.000Z"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `title` | Required; non-empty after trim; max **255** characters |
| `description` | Required; non-empty after trim; max **10,000** characters |
| `priority` | Required; must be valid enum |
| `status` | **Ignored** — server always sets `"Open"` |
| `assignedTo` | Optional; if provided must reference an existing user UUID, or `null` |

**Server-side behavior**

- Set `status` = `"Open"`
- Set `createdBy` from `X-User-Id` stub
- Set `assignedTo` = `null` unless a valid `assignedTo` is provided

### Error Responses

| Status | Body |
|--------|------|
| `400` | `{ "error": "Validation failed", "details": [{ "field": "title", "message": "title is required" }] }` |
| `400` | `{ "error": "Validation failed", "details": [{ "field": "priority", "message": "Invalid priority value" }] }` |
| `400` | `{ "error": "Validation failed", "details": [{ "field": "assignedTo", "message": "Invalid assignee" }] }` |
| `400` | `{ "error": "Invalid JSON payload" }` |
| `500` | `{ "error": "Internal server error" }` |

---

## Endpoint: List Tickets

Method: `GET`  
Path: `/api/tickets`  
Purpose: List tickets with optional keyword search and status filter.

### Request

**Query parameters**

| Parameter | Type | Required | Validation | Behavior |
|-----------|------|----------|------------|----------|
| `search` | string | No | Empty/omitted = no text filter | Case-insensitive match on `title` **OR** `description` |
| `status` | enum | No | If provided, must be valid `TicketStatus` | Exact status match |

```json
{}
```

No request body. `search` and `status` are combined with **AND**. No matches returns `[]` (not an error).

### Response

**200 OK**

```json
[
  {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "title": "Cannot log in to dashboard",
    "priority": "High",
    "status": "Open",
    "assignedTo": null,
    "createdAt": "2026-07-23T09:00:00.000Z",
    "updatedAt": "2026-07-23T09:00:00.000Z"
  },
  {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "title": "Printer offline",
    "priority": "Low",
    "status": "In Progress",
    "assignedTo": {
      "id": "22222222-2222-2222-2222-222222222222",
      "name": "Bob Smith"
    },
    "createdAt": "2026-07-22T14:30:00.000Z",
    "updatedAt": "2026-07-23T08:45:00.000Z"
  }
]
```

No matches:

```json
[]
```

### Validation Rules

| Parameter | Rule |
|-----------|------|
| `search` | Optional; empty/omitted applies no text filter |
| `status` | Optional; if provided must be a valid `TicketStatus` enum |

### Error Responses

| Status | Body |
|--------|------|
| `400` | `{ "error": "Validation failed", "details": [{ "field": "status", "message": "Invalid status value" }] }` |
| `500` | `{ "error": "Internal server error" }` |

---

## Endpoint: Get Ticket Detail

Method: `GET`  
Path: `/api/tickets/:id`  
Purpose: Retrieve full ticket detail. Comments are **not** included in this response; fetch them separately via `GET /api/tickets/:id/comments`.

### Request

**Path parameters**

| Parameter | Type | Validation |
|-----------|------|------------|
| `id` | UUID string | Ticket must exist |

```json
{}
```

No request body.

### Response

**200 OK**

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "title": "Cannot log in to dashboard",
  "description": "User reports 401 error after password reset.",
  "priority": "High",
  "status": "In Progress",
  "assignedTo": {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "Bob Smith"
  },
  "createdBy": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alice Johnson"
  },
  "createdAt": "2026-07-23T09:00:00.000Z",
  "updatedAt": "2026-07-23T10:15:00.000Z"
}
```

### Validation Rules

| Parameter | Rule |
|-----------|------|
| `id` | Required; must be a valid UUID referencing an existing ticket |

### Error Responses

| Status | Body |
|--------|------|
| `404` | `{ "error": "Ticket not found" }` |
| `500` | `{ "error": "Internal server error" }` |

---

## Endpoint: Update Ticket

Method: `PATCH`  
Path: `/api/tickets/:id`  
Purpose: Partial update of ticket fields and/or status.

> **Alternative:** A dedicated `PATCH /api/tickets/:id/status` endpoint is acceptable if it uses the same validation rules for `status` only.

### Request

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |

**Path parameters**

| Parameter | Type | Validation |
|-----------|------|------------|
| `id` | UUID string | Ticket must exist |

```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "priority": "Low | Medium | High | Critical (optional)",
  "assignedTo": "string (uuid) | null (optional)",
  "status": "Open | In Progress | Resolved | Closed | Cancelled (optional)"
}
```

All fields optional; **at least one field required**.

### Response

**200 OK**

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "title": "Cannot log in to dashboard",
  "description": "User reports 401 error after password reset.",
  "priority": "High",
  "status": "In Progress",
  "assignedTo": null,
  "createdBy": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alice Johnson"
  },
  "createdAt": "2026-07-23T09:00:00.000Z",
  "updatedAt": "2026-07-23T10:15:00.000Z"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `title` | If provided: non-empty after trim; max 255 characters |
| `description` | If provided: non-empty after trim; max 10,000 characters |
| `priority` | If provided: valid enum |
| `assignedTo` | If provided: valid user UUID or `null` (unassign) |
| `status` | If provided: must be a valid transition from current status |
| *(body)* | Empty `{}` or no recognized fields → `400` |

**Server-side behavior**

- Validate each provided field independently
- Route `status` through `StatusTransitionValidator`
- Reject status changes from `Closed` / `Cancelled`
- Update `updatedAt` on any successful change
- Field updates on terminal tickets are allowed when `status` is not included

### Error Responses

| Status | Body |
|--------|------|
| `400` | `{ "error": "Cannot transition from Open to Closed" }` |
| `400` | `{ "error": "Status change not allowed for Closed tickets" }` |
| `400` | `{ "error": "Validation failed", "details": [{ "field": "assignedTo", "message": "Invalid assignee" }] }` |
| `400` | `{ "error": "Validation failed", "details": [{ "field": "body", "message": "At least one field must be provided" }] }` |
| `400` | `{ "error": "Invalid JSON payload" }` |
| `404` | `{ "error": "Ticket not found" }` |
| `500` | `{ "error": "Internal server error" }` |

---

## Endpoint: List Comments

Method: `GET`  
Path: `/api/tickets/:id/comments`  
Purpose: List all comments for an existing ticket.

### Request

**Path parameters**

| Parameter | Type | Validation |
|-----------|------|------------|
| `id` | UUID string | Ticket must exist |

```json
{}
```

No request body.

### Response

**200 OK**

```json
[
  {
    "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "message": "Reset link was expired. Sent a new one.",
    "createdBy": {
      "id": "22222222-2222-2222-2222-222222222222",
      "name": "Bob Smith"
    },
    "createdAt": "2026-07-23T09:30:00.000Z",
    "updatedAt": "2026-07-23T09:30:00.000Z"
  },
  {
    "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "message": "User confirmed login works now.",
    "createdBy": {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "Alice Johnson"
    },
    "createdAt": "2026-07-23T10:00:00.000Z",
    "updatedAt": "2026-07-23T10:00:00.000Z"
  }
]
```

Comments are ordered `createdAt ASC`. Returns `[]` when the ticket has no comments.

### Validation Rules

| Parameter | Rule |
|-----------|------|
| `id` | Required; must be a valid UUID referencing an existing ticket |

### Error Responses

| Status | Body |
|--------|------|
| `404` | `{ "error": "Ticket not found" }` |
| `500` | `{ "error": "Internal server error" }` |

---

## Endpoint: Add Comment

Method: `POST`  
Path: `/api/tickets/:id/comments`  
Purpose: Add a comment to an existing ticket.

### Request

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `X-User-Id` | No | UUID of comment author; defaults to dev stub |

**Path parameters**

| Parameter | Type | Validation |
|-----------|------|------------|
| `id` | UUID string | Ticket must exist |

```json
{
  "message": "string (required)"
}
```

### Response

**201 Created**

```json
{
  "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "message": "Escalated to tier-2 support.",
  "createdBy": {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "Bob Smith"
  },
  "createdAt": "2026-07-23T11:00:00.000Z",
  "updatedAt": "2026-07-23T11:00:00.000Z"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `message` | Required; non-empty after trim; max **5,000** characters |

**Server-side behavior**

- Set `createdBy` from `X-User-Id` stub
- Set `updatedAt` = `createdAt` on insert
- Comments are immutable (no edit/delete endpoints)

### Error Responses

| Status | Body |
|--------|------|
| `400` | `{ "error": "Validation failed", "details": [{ "field": "message", "message": "message is required" }] }` |
| `400` | `{ "error": "Invalid JSON payload" }` |
| `404` | `{ "error": "Ticket not found" }` |
| `500` | `{ "error": "Internal server error" }` |

---

## Validation Matrix

| Scenario | Expected result |
|----------|-----------------|
| Create without mandatory fields | `400` with field errors |
| Create with invalid priority | `400` |
| Create with invalid `assignedTo` | `400` |
| Client sends `status` on create | Ignored; server sets `Open` |
| Update non-existent ticket | `404` |
| PATCH with empty body | `400` |
| Assign to non-existent user | `400` |
| Unassign (`assignedTo: null`) | `200` |
| Valid status transition | `200` |
| Invalid status transition | `400` with clear message |
| Status change on `Closed`/`Cancelled` | `400` |
| Field update on `Closed`/`Cancelled` (no `status`) | `200` |
| List comments for existing ticket | `200` + `Comment[]` ordered `createdAt ASC` |
| List comments for ticket with no comments | `200` + `[]` |
| List comments for missing ticket | `404` |
| Add comment to missing ticket | `404` |
| Empty/whitespace `message` | `400` |
| Search with no matches | `200` + `[]` |
| Filter by status with no tickets | `200` + `[]` |
| Invalid `status` query param | `400` |
| Malformed JSON body | `400` — `"Invalid JSON payload"` |
| Unknown route | `404` — `{ "error": "Route not found" }` |
| Unexpected server error | `500` — `{ "error": "Internal server error" }` |

---

## Out of Scope

The following are **not** part of this API contract:

- Authentication / authorization
- User CRUD
- Ticket or comment deletion
- Comment editing
- Pagination
- Assignment history / audit logs
- Unique ticket titles

---

## Endpoint Summary

| Method | Path | Purpose | Success |
|--------|------|---------|---------|
| `GET` | `/api/health` | Health + DB check | `200` / `503` |
| `GET` | `/api/users` | List seeded users | `200` |
| `POST` | `/api/tickets` | Create ticket | `201` |
| `GET` | `/api/tickets` | List + search/filter | `200` |
| `GET` | `/api/tickets/:id` | Ticket detail | `200` |
| `PATCH` | `/api/tickets/:id` | Update fields/status | `200` |
| `GET` | `/api/tickets/:id/comments` | List comments | `200` |
| `POST` | `/api/tickets/:id/comments` | Add comment | `201` |
