# Testing conventions

## 1. General

- Every bug fix starts with a failing test that reproduces it.
- Arrange, act, assert, separated by blank lines. One behavior per test.
- No snapshot tests.
- Tests are deterministic: no real network, fixed clocks (`jest.useFakeTimers()` or `vi.useFakeTimers()`) for anything date-based, such as follow-up rules and Discover schedules.
- Test data comes from builders, never from copied JSON blobs: `buildApplication({ status: 'applied' })`. Builders take a partial object and fill sensible defaults.
- Naming: `describe('<ClassOrComponent>')`, nested `describe('<method>')` when useful, `it('should <behavior> when <condition>')`.
- Unit tests always sit beside the source they test.

## 2. API (`apps/api`)

| Kind | Location | Tools | Scope |
| --- | --- | --- | --- |
| Unit | `src/**/<name>.spec.ts`, beside the source | Jest, `jest-mock-extended` | Services, mappers, guards, filters, utils. Repositories and ports are mocked |
| Repository | `src/**/prisma-<feature>.repository.spec.ts` | Jest, Testcontainers, `@chax-at/transactional-prisma-testing` | Queries, user scoping, constraints, Prisma error mapping |
| E2E | `test/<feature>/<feature>.e2e-spec.ts` | `TestHelper`, `withCommons`, `Mockery`, `nock`, Testcontainers | HTTP contract: status codes, validation errors, auth, response shape |

Database setup:

- Repositories are tested against a real Postgres, not mocks. Matchbox owns its schema, and mocked repositories would hide query bugs.
- Jest `globalSetup` starts one Postgres container from the `pgvector/pgvector` image (the same image as `docker-compose.yml`, since migrations create the vector extension), sets `DATABASE_URL`, and runs `prisma migrate deploy`. `globalTeardown` stops it.
- Repository tests run each test inside a transaction that is rolled back, using `PrismaTestingHelper` from `@chax-at/transactional-prisma-testing`.
- E2E tests truncate all tables in `beforeEach`, because they go through the full app and commit.
- Database tests run with `--runInBand`.

Rules:

- `test/helpers/test-helper.ts` creates the Nest app from `AppModule` with Fastify, applies `AppConfig`, and overrides `AuthVerifier` with a fake that maps test tokens to users. `withCommons(testHelper)` handles `beforeAll`, `beforeEach` (reset mocks, `nock.cleanAll()`), and `afterAll` (close the app).
- `test/helpers/mockery.ts` owns all outbound HTTP mocks (AI service, GitHub, ATS boards). Tests call `testHelper.mockery.mockTailorResponse(...)`, never `nock` directly.
- Requests go through `testHelper.app.inject()` (Fastify's built-in injection), not supertest.
- Every endpoint has at least: the happy path, a validation failure (`400`), and access to another user's resource (`404`).
- Every AI-dependent endpoint has a test for the degraded path (AI service down returns `503 AI_UNAVAILABLE`, D6).
- Evidence checks for CV tailoring (F8: changes without valid evidence become `blocked`) are covered by unit tests on the service.
- Coverage threshold: 80% lines.

```typescript
describe('ApplicationsService', () => {
    const repository = mock<ApplicationsRepository>();
    const service = new ApplicationsService(repository);

    beforeEach(() => mockReset(repository));

    describe('changeStatus', () => {
        it('should append a status event when the status changes', async () => {
            repository.findById.mockResolvedValue(buildApplication({ status: 'saved' }));

            await service.changeStatus('user-1', 'app-1', 'applied');

            expect(repository.appendEvent).toHaveBeenCalledWith(
                'user-1',
                expect.objectContaining({ type: 'status_changed', to: 'applied' }),
            );
        });
    });
});
```

## 3. Web (`apps/web`)

- Vitest + Testing Library + `@testing-library/user-event` + `jest-dom`, configured with `configure({ testIdAttribute: 'data-test' })`.
- Tests sit beside the component: `ApplicationCard/ApplicationCard.test.tsx`.
- Render through `renderWithProviders` from `src/test/`, which wraps `ThemeProvider`, a fresh `QueryClient` with retries off, and a `MemoryRouter`.
- The test setup initializes i18n with the real English resources, so assertions use the English text a user sees.
- Mock the API at the network level with MSW handlers in `src/test/msw/`, not by mocking hooks or Axios, so the real HTTP layer and interceptors are tested. Handlers use the same `@matchbox/shared` schemas as the API, so mock data stays valid.
- Query by role and label first, `data-test` second. Never query by class name.
- Test what the user sees: loading, empty, error, and AI-degraded states for every data-driven view.
- Coverage threshold: 80% lines.

## 4. Design system (`packages/ui`)

- Vitest + Testing Library, test beside the component.
- Test components that add behavior or props beyond MUI. Pure re-exports and theme style configs need no tests.
- A single theme test checks that `createMatchboxTheme()` builds both color schemes and that the palette uses token values.

## 5. Browser end-to-end

Not in scope before M4. If added, use Playwright against `docker compose` with the Firebase Auth emulator, covering the core flow in HLD section 3: add job, tailor CV, mark as applied.
