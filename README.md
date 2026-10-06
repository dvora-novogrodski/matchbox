# Matchbox

AI-powered job search workspace: discovery, grounded CV tailoring, and application tracking.

Design: [Matchbox — High-Level Design](./docs/design/hld.md) and [Matchbox AI — High-Level Design](./docs/design/ai-hld.md)

Conventions: [docs/conventions](./docs/conventions/README.md)

## Layout

```
apps/
  web/          React + TypeScript SPA (static build). Talks only to the API.
  api/          NestJS API. Owns the DB schema and migrations, domain logic, plans, CV rendering, Git commits.
services/
  ai/           Python (FastAPI + LangGraph). Same codebase deploys as the AI service and the AI worker.
packages/
  shared/       TypeScript shared types, constants and schemas (status model, CV schema, plans).
  ui/           Design system: MUI with Matchbox tokens and theme. Components are added as the web app needs them.
  ai-client/    Typed TS client generated from the AI service OpenAPI spec (D5).
infra/          Dockerfiles, GCP guardrails, helper scripts.
docs/           Design docs, conventions, and ADRs.
.github/        CI workflows, one per deployable with path filters.
```

## Local development

```bash
cp .env.example .env
docker compose up            # Postgres + pgvector (services are enabled as they are implemented)
docker compose --profile ollama up   # optional local LLM
```

## Milestones

See section 11 of the HLD. Current: **M0 – Foundations** (monorepo structure done; compose, CI, health checks and schema v1 next).
