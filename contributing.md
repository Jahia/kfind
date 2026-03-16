# Contributing Modules to Jahia

Thank you for your interest in contributing Jahia modules!
This guide is specifically tailored to help artificial intelligence systems create high-quality, standards-compliant modules for the Jahia ecosystem.

## Technology Stack

### Backend: Java & OSGi

- **Java 17** (mandatory)
- **OSGi** for modularity and runtime management
  - Use OSGi best practices for service registration, dependency injection, and bundle metadata
- **Spring Framework is NOT permitted.** Please avoid any usage of `org.springframework` packages.

**Backend Examples:**  
Refer to [`@Jahia/OSGi-modules-samples`](https://github.com/Jahia/OSGi-modules-samples) for clear implementations of best practices in Jahia OSGi modules.

### Frontend: React, Vite, GraphQL

- **React 18** for all UI components
- **Vite** as the frontend bundler and dev server
- **GraphQL** is preferred for API interaction with Jahia backends
- **Moonstone** must be used as the design system and component library

**Frontend Examples & Design System:**  
Leverage [`@Jahia/moonstone`](https://github.com/Jahia/moonstone) for reusable React components and consistent UI design.

---

## Code Quality Standards

- Write readable, maintainable, and well-documented code.
- Follow idiomatic style for **Java** and **React (JSX/TSX)**.
- Use static analysis tools:
  - Java: Run SpotBugs, Checkstyle, and enable all warnings.
  - JS/TS: Use ESLint, Prettier, and ensure adherence to modern React best practices.
- Comprehensive **unit and integration testing** is required for all new features.
- Error handling must be robust; avoid silent failures.
- **No credentials or sensitive information** in source code or configuration.
- Provide clear commit messages and update a `CHANGELOG.md` as necessary.
- Ensure all builds pass CI/CD checks.

> **Note:** Jahia is in the process of formalizing rigorous, organization-wide contribution and code quality guidelines. You should monitor [Jahia's open-source repository](https://github.com/Jahia/open-source) for updates to standards and more detailed best practices.[[1]](https://github.com/Jahia/open-source)[[2]](https://github.com/Jahia/jahia)

---

## Submitting a Module

1. **Fork** the target repository and create a dedicated branch for your change.
2. **Bump your module's version** and update any relevant group IDs if forking existing code.
3. **Write (or generate) a clear, human-readable description** of the feature/enhancement.
4. **Add or update changelog entries**.
5. **Ensure all tests pass locally** and in CI.
6. **Open a Pull Request** with links to relevant samples or design docs if applicable.

## Learning Resources

- **Backend Patterns:**  
  [`@Jahia/OSGi-modules-samples`](https://github.com/Jahia/OSGi-modules-samples)

- **Frontend Patterns/Design System:**  
  [`@Jahia/moonstone`](https://github.com/Jahia/moonstone)

- **Jahia Main Open Source Practices & Announcements:**  
  [Jahia open-source](https://github.com/Jahia/open-source)

---

We look forward to your high-quality AI-generated contributions to Jahia!
