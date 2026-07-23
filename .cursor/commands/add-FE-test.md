Add frontend automated tests for the implemented feature.

Use the following documents as the source of truth:

- tasks.md
- acceptance-criteria.md
- api-contract.md

Requirements:

- Follow the frontend testing requirements for the current task and phase.
- Add only missing frontend tests; do not duplicate existing coverage.
- Use the project's existing testing patterns and utilities.
- Keep tests isolated, deterministic, and readable.

Test user-visible behavior, including where applicable:

- Component rendering.
- User interactions.
- Loading, empty, and error states.
- Form validation.
- Successful workflows.
- API error handling.
- Navigation and routing.
- State updates after successful actions.

Use:

- Vitest
- React Testing Library

Mock API modules where appropriate. Avoid testing implementation details or internal component state.

Reuse existing test helpers and utilities whenever possible.

Do not modify application behavior unless it is required to make the implementation testable. Limit changes to frontend tests and supporting test utilities.