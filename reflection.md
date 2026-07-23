# Reflection

## Project Overview

This project involved developing a full-stack Support Ticket Management System using a React frontend, Express backend, and PostgreSQL database. The project was implemented incrementally using a phased development approach supported by AI-assisted development in Cursor.

---

## What Went Well

Several aspects of the project worked particularly well:

- Breaking the implementation into small phases made development easier to manage and review.
- Maintaining API contracts, implementation plans, and acceptance criteria before coding reduced misunderstandings during development.
- Using reusable Cursor Rules and Cursor Commands ensured consistent implementation, documentation, testing, and review practices.
- Writing automated tests alongside feature implementation helped identify issues early and reduced regressions.

---

## Challenges Encountered

Some challenges arose during development, including:

- Debugging issues caused by stale backend processes.
- Preventing backend integration tests from modifying development data.
- Keeping frontend behaviour consistent with backend business rules.

Resolving these challenges reinforced the importance of validating AI suggestions, maintaining isolated development and testing environments, and verifying fixes through automated testing.

---

## How AI Helped

Cursor AI supported multiple stages of development, including:

- Requirement analysis.
- Implementation planning.
- Code generation.
- Automated test creation.
- Debugging assistance.
- Documentation generation.
- Code reviews.

AI accelerated development by assisting with implementation, testing, debugging, and documentation, while all generated code and recommendations were reviewed, validated, and approved before being incorporated into the project.

---

## Lessons Learned

This project reinforced several important software engineering practices:

- Planning before implementation reduces rework.
- Small, incremental implementation phases simplify testing and debugging.
- Integration testing provides stronger confidence than isolated unit testing alone.
- AI is most effective when supplied with clear project context and well-defined requirements.
- AI-generated code should always be reviewed and validated before acceptance.

---

## What I Would Improve

If I were to complete this project again, I would make a few process improvements rather than focusing only on additional features.

- Configure a dedicated test database from the beginning to avoid development data being affected by automated integration tests.
- Set up continuous integration to automatically run backend and frontend tests for every commit.

---

## Overall Reflection

This project demonstrated that AI can significantly improve development productivity when combined with structured planning, clear project documentation, reusable Cursor Rules and Cursor Commands, and thorough code reviews. Using AI as a development assistant rather than relying on it for autonomous decisions helped maintain code quality while ensuring the final implementation met the project requirements.