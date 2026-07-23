# Cursor Rules

## Technology Stack
- Use React + JavaScript for the frontend (no TypeScript).
- Use Node.js + Express + TypeScript for the backend.
- Use PostgreSQL as the database.
- Use Prisma as the ORM and migration tool.

## Architecture
- Follow Controller → Service → Repository architecture.
- Keep controllers thin.
- Business logic belongs in services.
- Repositories should only access the database.

## Business Rules
- Enforce ticket status transitions in the backend.
- Never bypass validation.
- Follow the status transition matrix defined in spec.md.

## Testing
- Write backend integration tests for business rules.
- Write frontend component/UI tests with Vitest + React Testing Library.
- Verify valid and invalid status transitions.

## References
General language/framework conventions are defined in:
- JavaScript Rules (frontend)
- TypeScript Rules (backend)
- Node.js Rules
- React Rules (if applicable)