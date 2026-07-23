# Acceptance Criteria

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Frontend | React + JavaScript + Vite (no TypeScript) |

---

## Core Features

### Ticket Creation
- [ ] User can create a new support ticket.
- [ ] Ticket requires title, description, and priority.
- [ ] New tickets are created with **Open** status.
- [ ] Ticket is persisted in the database.

### Ticket Listing
- [ ] User can view all tickets.
- [ ] Ticket list displays title, priority, status, assignee, created date, and updated date.

### Ticket Details
- [ ] User can view complete ticket information.
- [ ] Associated comments are displayed.

### Ticket Update
- [ ] User can update title.
- [ ] User can update description.
- [ ] User can update priority.
- [ ] User can assign or reassign a ticket.

### Status Management
- [ ] Valid status transitions are accepted.
- [ ] Invalid status transitions are rejected by the backend.
- [ ] Frontend displays meaningful error messages for invalid transitions.

### Comments
- [ ] User can add comments to a ticket.
- [ ] Comments are persisted and displayed chronologically.

### Search & Filter
- [ ] User can search tickets using keywords.
- [ ] User can filter tickets by status.
- [ ] Search and filters work together correctly.

---

# Validation

- [ ] Backend validates all required fields.
- [ ] Invalid priorities are rejected.
- [ ] Invalid assignee IDs are rejected.
- [ ] Invalid status transitions are rejected.
- [ ] Invalid request payloads return appropriate validation errors.

---

# Error Handling

- [ ] Missing resources return **404 Not Found**.
- [ ] Validation failures return **400 Bad Request**.
- [ ] Unexpected errors return **500 Internal Server Error**.
- [ ] UI displays meaningful error messages.

---

# Database

- [ ] PostgreSQL database schema is provided (via Prisma).
- [ ] Prisma migrations and seed data are available.
- [ ] Data persists after application restart.
- [ ] Environment configuration is documented.

---

# Testing

- [ ] Integration tests verify valid status transitions.
- [ ] Integration tests verify invalid status transitions.
- [ ] Ticket CRUD functionality is tested.
- [ ] Comment functionality is tested.
- [ ] Search and filtering are tested.

---

# Documentation

- [ ] README includes setup instructions.
- [ ] API documentation is available.
- [ ] Database setup is documented (PostgreSQL + Prisma migrate/seed commands).
- [ ] AI prompt history is maintained.
- [ ] Design and implementation decisions are documented.