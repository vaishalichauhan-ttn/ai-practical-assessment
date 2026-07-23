# Requirement Analysis

## Selected Project Option

**Project:** Support Ticket Management System (Backend-heavy)

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

# My Understanding (in my own words)

The Support Ticket Management System is a small full-stack application designed to help internal users manage support requests throughout their lifecycle. The application should allow users to create, view, update, assign, search, and track support tickets while maintaining all data in a persistent PostgreSQL database.

Users are pre-seeded into the system, so user management functionality is not required. The main functionality revolves around managing tickets, including creating and updating ticket details, assigning them to users, adding comments, and searching or filtering tickets.

A key requirement is to make sure that the ticket status lifecycle. Ticket status changes must follow predefined transition rules, and any invalid status transitions must be rejected by the backend. This ensures that the business workflow is consistently enforced regardless of how the frontend interacts with the API.

---

# Functional Requirements

## User

- Users shall be pre-seeded into the database.
- User management functionality is not required.
- Users can be assigned to tickets and associated with comments.

## Ticket Management

The system shall allow users to:

- Create a new support ticket.
- View all tickets.
- View ticket details.
- Update:
  - Title
  - Description
  - Priority
  - Assigned user
- Change ticket status according to the defined workflow.
- Persist ticket information in the database.

## Comment Management

The system shall allow users to:

- Add comments to a ticket.
- View comments associated with a ticket.

## Search & Filter

The application shall support:

- Keyword search on tickets.
- Filter tickets by status.

## Validation

The backend shall:

- Validate required fields.
- Reject invalid requests.
- Reject invalid status transitions.
- Return meaningful validation messages.

## Error Handling

The application shall:

- Display meaningful error messages.
- Handle API failures gracefully.
- Return appropriate HTTP status codes.

## Database

The application shall:

- Use **PostgreSQL** as the database.
- Use **Prisma** for schema definition, migrations, and data access.
- Persist data in the database.
- Retain data after application restart.
- Include schema/migration scripts.
- Include seed data.

## Testing

The project shall include integration tests verifying:

- Valid status transitions.
- Invalid status transitions.
- Backend business rule enforcement.

---

# Non-Functional Requirements

## Performance

- CRUD operations should respond efficiently.
- Search and filtering should perform well for expected data volumes.

## Maintainability

- Follow a layered architecture.
- Separate presentation, business, and data access concerns.
- Use consistent coding standards.

## Reliability

- Maintain data consistency.
- Prevent invalid business operations.
- Ensure persistence across application restarts.

## Usability

- Provide clear user interactions.
- Display validation and error messages in a user-friendly manner.

## Security

- Validate all incoming requests on the backend.
- Prevent invalid data from being persisted.
- Avoid exposing internal implementation details in error responses.

## Testability

- Business rules should be independently testable.
- Core functionality should be covered by automated integration tests.

---

# Business Rules

1. Every ticket must contain:
   - Title
   - Description
   - Priority
   - Creator
   - Status

2. Every newly created ticket starts with the **Open** status.

3. Valid ticket status transitions are:

```text
Open → In Progress
In Progress → Resolved
Resolved → Closed
Open → Cancelled
In Progress → Cancelled
```

4. Any status transition outside the defined workflow must be rejected.

5. Every comment must belong to an existing ticket.

6. Tickets can only be assigned to valid users.

7. Backend validation is the source of truth for all business rules.

---

# Assumptions

- Users are pre-seeded before the application starts.
- Authentication and authorization are outside the mandatory project scope.
- Ticket IDs and timestamps are system generated.
- Search is performed on ticket title and description.
- The application is intended for internal users.
- Only one user role is required for the core implementation.

---

# Clarifications (Questions for Product Owner)

1. Should ticket titles be unique?
2. Can ticket priority be changed after creation?
3. Should comments be editable?
4. Should tickets or comments support deletion?
5. Can Closed or Cancelled tickets still be edited?
6. Should assignment history be maintained?
7. Is pagination expected for ticket listing?
8. Are audit logs required for future enhancements?

---

# Edge Cases

- Creating a ticket without mandatory fields.
- Updating a ticket that does not exist.
- Adding a comment to a non-existent ticket.
- Assigning a ticket to an invalid user.
- Attempting an invalid status transition.
- Searching with no matching results.
- Filtering by a status with no tickets.
- Invalid priority values.
- Empty search keyword.
- Duplicate API requests.
- Database connection failures.
- Concurrent updates to the same ticket.
- Very long title or description values.

---

# Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect implementation of status transitions | High | Implement business rules in the service layer and verify with integration tests |
| AI-generated code introduces incorrect business logic | High | Review, validate, and test all AI-generated code before acceptance |
| Weak backend validation | High | Use centralized validation and consistent error handling |
| Insufficient automated testing | Medium | Cover business rules with backend integration tests; cover UI behavior with React Testing Library frontend tests |
| Poor project documentation | Medium | Maintain documentation throughout development |
| Database configuration issues | Medium | Provide Prisma migrations, seed data, and PostgreSQL setup instructions |
| Scope creep | Medium | Prioritize mandatory requirements before optional enhancements |