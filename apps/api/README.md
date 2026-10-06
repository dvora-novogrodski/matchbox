# apps/api

NestJS. Owns the DB schema and migrations (D1) and orchestrates all AI calls (D2).

```
prisma.config.ts  Prisma CLI config; reads DATABASE_URL from the root .env
prisma/
  schema.prisma   All tables, including the AI-owned ones (D1)
  migrations/     Committed migrations; the first one also creates pgvector and the system statuses
src/
  generated/      Prisma client, generated on install (gitignored)
  auth/           AuthVerifier interface + Firebase implementation, global guard (F1)
  users/          User record, time zone, search prefs
  plans/          Plan definitions and limit checks (section 4.4)
  career-items/   Career profile CRUD; triggers A1 indexing (F2)
  cv/             CV schema validation, versions, HTML/PDF rendering (F3)
    templates/    Deterministic templates, selected by template id
  applications/   Pipeline, application lifecycle (F4, F5)
  statuses/       System + custom statuses and categories (F4)
  jobs/           Jobs independent of applications, manual add (F6)
  companies/      Company registry, ATS detection (F19)
  discover/       Discover review queue, scheduler tick handler (F9)
  events/         Append-only timeline, follow-up rules (F11)
  integrations/
    github/       Private repo commits for CV versions
  ai-client/      Calls to the AI service (generated client) with timeouts and budget checks
  tasks/          TaskQueue interface (Cloud Tasks / local dispatcher), job status (D4)
  health/         Health checks
  common/         Guards, filters, request id, shared utilities
  config/         Typed config and env overrides
test/             E2E tests
```

## Database

Use the Node version in the root `.nvmrc`. Start Postgres with `docker compose up -d db`. When running the CLI from the host, point `DATABASE_URL` at `localhost` instead of the compose host `db`.

| Command | Use |
| --- | --- |
| `npm run db:migrate -w @matchbox/api -- --name <snake_case_description>` | Create a migration from schema changes and apply it locally. Review the SQL before committing |
| `npm run db:deploy -w @matchbox/api` | Apply committed migrations (CI and fresh databases) |

Enum values in `schema.prisma` mirror the `as const` lists in `@matchbox/shared`; change both together.
