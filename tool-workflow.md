# Tool Workflow

## Primary AI Tool Used

The primary AI tool used for this project was **Cursor AI**. Cursor was used throughout the software development lifecycle to assist with implementation, testing, debugging, documentation, and code reviews while maintaining developer oversight over all generated code.

---

## How Project Context Is Provided

Before each implementation task, the relevant project documentation was provided as the source of truth. Depending on the task, Cursor was instructed to use:

- `development-tasks.md`
- `implementation-plan.md`
- `api-contract.md`
- `data-model.md`
- `project-context.md`
- `acceptance-criteria.md`

Implementation prompts were scoped to a single phase or task to prevent work outside the planned implementation sequence.

Project-wide Cursor Rules were configured to automatically enforce coding standards, documentation practices, testing order, and architectural conventions across all implementations.

---

## How AI Is Used for Requirement Analysis

AI was used to:

- Interpret the assessment requirements.
- Break the project into incremental implementation phases.
- Clarify acceptance criteria.
- Identify dependencies between features.
- Verify that each completed phase satisfied the documented requirements.

The implementation plan and acceptance criteria remained the authoritative reference for all decisions.

---

## How AI Is Used for Planning and Design

AI assisted with:

- Reviewing the overall application architecture.
- Organizing the project into backend, frontend, and database layers.
- Reviewing API contracts.
- Reviewing database models.
- Suggesting improvements to user workflows during implementation reviews (such as replacing the Create Ticket page with a modal).

Architectural decisions were reviewed before being accepted.

---

## How AI Is Used for Code Generation

Cursor was used to generate implementation code one phase at a time.

A reusable implementation prompt template (cursor command) was used for every phase. Only the phase number and implementation scope changed while the overall workflow remained consistent.

Each implementation followed this process:

1. Provide the implementation prompt.
2. Supply the project documentation as context.
3. Apply the project's Cursor Rules automatically.
4. Review the generated implementation.
5. Accept, modify, or reject AI suggestions.
6. Run automated tests before moving to the next phase.

Using repeatable prompts (cursor command) helped maintain consistency throughout the project.

---

## How AI-Generated Code Is Validated

AI-generated code was validated by:

- Comparing it with the implementation plan.
- Reviewing against the API contract.
- Reviewing against the data model.
- Checking the acceptance criteria.
- Running backend and frontend automated tests.
- Performing manual verification where appropriate.

Code was not accepted without review.

---

## How AI Is Used for Testing

Testing was performed as part of each implementation phase rather than as a separate activity.

Each implementation prompt included the testing tasks defined for the current phase in `development-tasks.md`, allowing implementation and automated test development to progress together.

Project Cursor Rules enforced the testing workflow by implementing backend functionality first, followed by backend tests, frontend implementation, and frontend tests.

Backend tests use **Vitest** and **Supertest** for API integration and unit testing.

Frontend tests use **Vitest** and **React Testing Library** for component and user interaction testing.

All generated tests were reviewed and executed to verify that the implemented functionality met the project requirements and acceptance criteria.

---

## How AI Is Used for Debugging

Cursor was used to investigate implementation issues through reusable debugging prompts.

The AI assisted by:

- Reviewing application logs.
- Analysing error messages.
- Tracing request flow.
- Identifying routing or configuration issues.
- Suggesting possible fixes.

Each debugging session was documented using a reusable debugging prompt and the project's debugging documentation rule, ensuring investigations, accepted suggestions, validation, and final resolutions were recorded consistently.

---

## How AI Is Used for Code Review

After completing major implementation phases, Cursor review commands were used to compare the implementation against the project documentation.

Reviews focused on:

- Completion criteria.
- API contract compliance.
- Layered architecture.
- Validation logic.
- Code duplication.
- Test coverage.
- Documentation compliance.

Review findings were recorded, and each recommendation was either accepted, modified, or rejected with justification.


---

## Information Not Shared Unnecessarily

Only project-related information was shared with AI tools.

Sensitive information such as:

- passwords
- API keys
- database credentials
- personal information
- production secrets

was never included in prompts. Environment variables were documented using placeholder values.

---

## Reusing This Workflow in Future Projects

This workflow can be reused on future projects by:

1. Preparing implementation, API, and data model documentation.
2. Configuring reusable Cursor Rules for project-wide standards.
3. Creating reusable implementation, testing, debugging, documentation, and review prompts.
4. Implementing one phase or feature at a time.
5. Running Cursor review commands after major milestones.
6. Recording AI prompt history for implementation, testing, debugging, documentation, and reviews.
7. Validating every feature before proceeding to the next phase.

Using reusable prompts, Cursor Rules, and review commands provides a consistent and traceable development process while ensuring that final implementation decisions remain under developer control.


## Cursor Rules and Reusable Prompts

To ensure consistency throughout the project, reusable Cursor Rules and prompt templates were used instead of writing entirely new instructions for every task.

Cursor Rules enforced project-wide standards such as documentation, architecture, testing practices, and debugging documentation.

Reusable Cursor commands and prompt templates were created for implementation, debugging, documentation, and code reviews. Testing instructions were incorporated into the implementation workflow so that each feature was implemented and tested within the same phase.