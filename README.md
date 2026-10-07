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
docker compose up --build    # full stack; migrations run first in the one-off `migrate` service
docker compose --profile ollama up   # optional local LLM
```

| Service | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:3000/health/ready |
| AI service | http://localhost:8000/health |
| AI worker | http://localhost:8001/health |
| Postgres | `localhost:5432` |
| Firebase Auth emulator | http://localhost:9099 |

For day-to-day work, run only `docker compose up -d db` and start the API (`npm run start:dev -w @matchbox/api`) and the web app (`npm run dev -w @matchbox/web`) on the host. Stop the compose `api` and `web` services first, since they use the same ports.

## Milestones

See section 11 of the HLD. **M0 – Foundations** is complete: monorepo, compose, CI, health checks, and schema v1. M1 adds the first usable, non-AI product flow.
