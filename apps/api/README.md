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
  profile/        Grouped career profile (`GET /profile`, bullets, skills); triggers A1 indexing (F2)
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
  common/
    config/       Zod schema for env vars; the app fails to start on invalid config
    prisma/       Global PrismaModule and PrismaService
    health/       GET /health/live (no checks) and GET /health/ready (database ping)
test/
  setup/          Jest global setup: one pgvector Postgres container, migrated with prisma migrate deploy
  *.e2e-spec.ts   E2E tests through Fastify inject
```

## Database

Use the Node version in the root `.nvmrc`. Start Postgres with `docker compose up -d db`, and copy the root `.env.example` to `.env`; its `DATABASE_URL` points at `localhost` for the API and the Prisma CLI on the host.

`jest.config.js` defines two projects: `unit` (`src/**/*.spec.ts`, run by `npm test`) and `e2e` (`test/**/*.e2e-spec.ts`, run by `npm run test:e2e`, needs Docker running). Running Jest on a single file, as editor test buttons do, picks the right project. Tests compile to CommonJS so that the Prisma 7 client's dynamic `import()` works in Jest.

| Command | Use |
| --- | --- |
| `npm run db:migrate -w @matchbox/api -- --name <snake_case_description>` | Create a migration from schema changes and apply it locally. Review the SQL before committing |
| `npm run db:deploy -w @matchbox/api` | Apply committed migrations (CI and fresh databases) |

Enum values in `schema.prisma` mirror the `as const` lists in `@matchbox/shared`; change both together.
