# Design Prompt History

## Prompt 1 – Create Design Notes

### Objective

Create an implementation-focused design document covering architecture, frontend, backend, database, validation, error handling, and testing for the Support Ticket Management System.

### Prompt Summary

Asked Cursor to create `design-notes.md` using all project documents and Cursor workflow files as the source of truth. Required sections: Architecture Overview, Frontend Design, Backend Design, Database Design, Validation Strategy, Error Handling Strategy, and Testing Strategy. The document had to use the selected stack (React, Node.js, Express, Prisma, PostgreSQL), explain design reasoning, stay implementation-focused without source code, and stay consistent with the implementation plan and specification.

### AI Response Summary

Cursor created `design-notes.md` with layered architecture (React → Controllers → Services → Repositories → PostgreSQL), stack rationale, frontend/backend/database design, backend-first validation, error handling strategy, and an integration-first testing approach. Status transitions were identified as the critical path after CRUD.

### Review

The initial design notes aligned with the planning documents. Follow-up refinements were requested to strengthen architectural guidance and clarify key interaction flows.

### Follow-up Prompt

Asked Cursor to add:
- Mermaid sequence diagrams for Ticket Creation, Ticket Status Update, and Add Comment
- A Design Principles section (Separation of Concerns, SRP, Backend as Source of Truth, Layered Architecture, Reusable Components, Maintainability)
- A Security Considerations subsection (SQL injection, XSS, input validation, environment variables, secure API error responses), kept within project scope

### AI Suggestions Accepted

- Accepted the layered architecture and backend-as-source-of-truth approach.
- Accepted the Design Principles and Security Considerations sections.
- Accepted Mermaid sequence diagrams for the three core flows.

### AI Suggestions – What I Changed

- Requested additional principles, sequence diagrams, and security detail after the first draft.

### AI Suggestions – What I Rejected and Why

- No major design suggestions were rejected; out-of-scope items (auth, HTTPS hardening, rate limiting) were correctly excluded.


---

## Prompt 2 – Refine Design Notes Structure

### Objective

Regenerate a comprehensive `design-notes.md` with a clearer section structure and explicit alignment to planning documents, while deferring full schema detail to `data-model.md` and detailed testing to `test-strategy.md`.

### Prompt Summary

Asked Cursor to regenerate `design-notes.md` from `requirements-analysis.md`, `acceptance-criteria.md`, `implementation-plan.md`, `spec.md`, and `project-context.md`. Required a professional structure covering Architecture, Frontend, Backend, Database (overview only), Validation, Error Handling, and Testing (summary only). Explicitly excluded out-of-scope features and focused on design decisions rather than implementation code.

### AI Response Summary

Cursor rewrote `design-notes.md` to match the requested structure: layered architecture diagram and responsibilities, frontend component/routing/state design, Controller–Service–Repository backend design, database overview without full schema, multi-layer validation strategy, centralized error handling, and a testing summary that references `test-strategy.md`.

### Review

The refined document better separated design concerns from detailed schema and test plans. Scope boundaries and status workflow remained consistent with the specification and implementation plan.

### AI Suggestions Accepted

- Accepted the clearer section structure and cross-references to `data-model.md` / `test-strategy.md`.
- Accepted exclusion of out-of-scope features (auth, pagination, audit logs, dashboards, etc.).

### AI Suggestions – What I Changed

- Clarified that the complete schema belongs in `data-model.md` rather than inside design notes.

### AI Suggestions – What I Rejected and Why

- No major suggestions were rejected.


---

## Prompt 3 – Generate API Contract

### Objective

Define a complete API contract documenting every endpoint with request/response schemas, validation rules, status codes, and example payloads.

### Prompt Summary

Asked Cursor to generate a complete API contract from `spec.md`, `design-notes.md`, and `acceptance-criteria.md`, covering every endpoint with schemas, validation, status codes, and examples. Follow-up prompts requested creation of `api-contract.md` and a consistent endpoint format:

```text
## Endpoint: <Name>
Method:
Path:
Purpose:
### Request
### Response
### Validation Rules
### Error Responses
```

### AI Response Summary

Cursor first produced a machine-readable OpenAPI spec covering health, users, tickets CRUD/list/detail/update, and comments, plus shared schemas, enums, validation rules, and status transition guidance. It then created `api-contract.md` and reformatted all endpoints to the requested markdown structure while preserving global conventions, shared schemas, and the status transition matrix.

### Review

The API contract became the source of truth for endpoint behaviour during implementation. Endpoint formatting was standardized for readability. Supporting sections (conventions, schemas, transitions, validation matrix, out of scope) were retained.

### AI Suggestions Accepted

- Accepted documentation of all planned endpoints and shared schemas.
- Accepted status transition rules and error response conventions.
- Accepted the uniform per-endpoint markdown format.

### AI Suggestions – What I Changed

- Requested a markdown `api-contract.md` companion (not only OpenAPI).
- Requested a specific endpoint section format for consistency.

### AI Suggestions – What I Rejected and Why

- Did not treat OpenAPI alone as sufficient documentation for the assessment; a human-readable markdown contract was required.


---

## Prompt 4 – Generate Data Model

### Objective

Create a comprehensive `data-model.md` documenting entities, relationships, enumerations, constraints, indexing, integrity rules, Prisma mapping, and migration/seed strategy.

### Prompt Summary

Asked Cursor to generate `data-model.md` using planning docs, `design-notes.md`, `api-contract.md`, and Cursor workflow files as the source of truth. Required Overview, Mermaid ER diagram, entity definitions for User/Ticket/Comment, relationships, enumerations, constraints, indexing, integrity rules, Prisma mapping (without full schema dump), migration/seed strategy, and future enhancements.

### AI Response Summary

Cursor created `data-model.md` covering the three-table PostgreSQL design (`users`, `tickets`, `comments`), ER diagram with cardinality, attribute tables, enums (`TicketStatus`, `Priority`), indexes, referential integrity/cascade policies, Prisma mapping notes, and migration/seed approach. Future enhancements (attachments, audit logs, soft deletes, etc.) were listed separately from current scope.

### Review

The data model aligned with `design-notes.md` and `api-contract.md` shared schemas. Column naming and relationships matched the agreed implementation plan decisions.

### AI Suggestions Accepted

- Accepted the three-entity model (User, Ticket, Comment).
- Accepted UUID primary keys, nullable `assignedTo`, and reserved `comments.updatedAt` for future editing.
- Accepted the recommended indexes and integrity rules.

### AI Suggestions – What I Changed

- Kept the full Prisma schema out of this document so it remains separately maintained in the codebase.

### AI Suggestions – What I Rejected and Why

- Rejected expanding into additional entities or a richer schema beyond User/Ticket/Comment for the current scope; future enhancements stay documented as out-of-scope ideas only.
