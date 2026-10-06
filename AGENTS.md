# AGENTS.md — Matchbox

Read this before doing any work in this repo.

Matchbox is a personal job-search workspace. The product and architecture are defined in [Matchbox — High-Level Design](./docs/design/hld.md), and the AI layer in [Matchbox AI — High-Level Design](./docs/design/ai-hld.md); the repo layout is in [README.md](./README.md).

## Conventions

Read the convention document for the area you are changing before editing it:

| Area | Document |
| --- | --- |
| `apps/api` (NestJS) | [docs/conventions/backend-nestjs.md](./docs/conventions/backend-nestjs.md) |
| `apps/web` (React) | [docs/conventions/frontend-react.md](./docs/conventions/frontend-react.md) |
| `packages/ui` (design system) | [docs/conventions/design-system.md](./docs/conventions/design-system.md) |
| Any TypeScript | [docs/conventions/typescript-and-tooling.md](./docs/conventions/typescript-and-tooling.md) |
| Tests | [docs/conventions/testing.md](./docs/conventions/testing.md) |
| Dockerfiles, workflows, deploys | [docs/conventions/ci-and-deployment.md](./docs/conventions/ci-and-deployment.md) |

`services/ai` (Python) has its own conventions.

## Git

Follow the [git-workflow skill](./.cursor/skills/git-workflow/SKILL.md): one branch per feature, Conventional Commits, exactly one commit per feature on `master` (never squash different features together). Commit only when asked.

## Safety

- Never commit `.env` files, tokens, or service account keys.
- Never log CV text, career item text, or email bodies.
- Deploy settings `min-instances=0` and `max-instances=1` are cost guardrails; do not change them without being asked.
