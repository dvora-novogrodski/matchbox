# apps/api

NestJS. Owns the DB schema and migrations (D1) and orchestrates all AI calls (D2).

```
src/
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
  database/
    entities/     Entities
    migrations/   Migrations (schema v1 is the first)
test/             E2E tests
```
