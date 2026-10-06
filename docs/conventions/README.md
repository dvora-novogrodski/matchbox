# Matchbox conventions

These documents define how Matchbox TypeScript code is written. The Python AI service has its own conventions and is out of scope here.

| Document | Covers |
| --- | --- |
| [backend-nestjs.md](./backend-nestjs.md) | `apps/api`: module layout, layering, DTOs, config, errors, logging, persistence, HTTP style |
| [frontend-react.md](./frontend-react.md) | `apps/web`: folder layout, components, data fetching, forms, routing, i18n, env |
| [design-system.md](./design-system.md) | `packages/ui`: tokens, theme, ThemeProvider, component rules, how components get added |
| [typescript-and-tooling.md](./typescript-and-tooling.md) | Shared TypeScript style, naming, Prettier, ESLint, tsconfig, git hooks |
| [testing.md](./testing.md) | Unit and e2e tests for API, web, and UI |
| [ci-and-deployment.md](./ci-and-deployment.md) | Dockerfiles, GitHub Actions, Cloud Run, environments |

Git workflow (branches, commits, squash merges) is defined in the [git-workflow skill](../../.cursor/skills/git-workflow/SKILL.md).

When a rule and existing code disagree, the rule wins and the code gets fixed in the next change that touches it. Each document ends with the changes the current scaffold still needs.
