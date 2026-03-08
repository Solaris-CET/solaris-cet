# Contributing to Solaris CET

Thank you for your interest in contributing to **Solaris CET**! 🎉

We welcome all types of contributions: bug reports, feature suggestions, code improvements, and documentation fixes.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [Development Workflow](#development-workflow)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Message Convention](#commit-message-convention)

---

## Code of Conduct

By participating in this project, you agree to be respectful and constructive in all interactions. Harassment of any kind will not be tolerated.

---

## How to Report a Bug

1. Search [existing issues](https://github.com/aamclaudiu-hash/solaris-cet/issues) to avoid duplicates.
2. If none exists, open a [new issue](https://github.com/aamclaudiu-hash/solaris-cet/issues/new) and include:
   - A clear, descriptive title.
   - Steps to reproduce the problem.
   - Expected vs. actual behavior.
   - Screenshots or console errors (if applicable).
   - Your browser and OS version.

---

## How to Request a Feature

Open a [new issue](https://github.com/aamclaudiu-hash/solaris-cet/issues/new) and describe:

- The problem you are trying to solve.
- Your proposed solution or enhancement.
- Any alternatives you have considered.

---

## Development Workflow

### 1. Fork and clone

```bash
# Fork via the GitHub UI, then:
git clone https://github.com/<your-username>/solaris-cet.git
cd solaris-cet/app
npm install
```

### 2. Create a feature branch

```bash
git checkout -b feat/your-feature-name
```

Use one of these prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`.

### 3. Make your changes

- Source code lives in `app/src/`.
- Run `npm run dev` for a live-reloading development server.
- Run `npm run build` to verify your changes compile without errors.
- Run `npm run lint` to check code style.

### 4. Commit your changes

Follow the [commit message convention](#commit-message-convention) below.

### 5. Push and open a Pull Request

```bash
git push origin feat/your-feature-name
```

Then open a Pull Request against the `main` branch of the upstream repository.

---

## Pull Request Guidelines

- Keep PRs focused and small — one logical change per PR.
- Fill in all sections of the PR template.
- Make sure `npm run build` and `npm run lint` pass locally before opening the PR.
- Reference any related issues (e.g., `Closes #42`).
- A maintainer will review your PR and may request changes before merging.

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <short description>

[optional body]

[optional footer]
```

**Types:**

| Type       | Description                                  |
|------------|----------------------------------------------|
| `feat`     | A new feature                                |
| `fix`      | A bug fix                                    |
| `docs`     | Documentation-only changes                   |
| `style`    | Formatting, missing semicolons, etc.         |
| `refactor` | Code refactor (no feature / bug fix)         |
| `chore`    | Build process, tooling, dependency updates   |
| `perf`     | Performance improvements                     |

**Examples:**

```
feat(hero): add parallax animation to coin element
fix(calculator): correct ROI formula for compound interest
docs: update One-Click Deploy instructions in README
chore: upgrade vite to v7
```

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same [MIT License](./LICENSE) that covers this project.
