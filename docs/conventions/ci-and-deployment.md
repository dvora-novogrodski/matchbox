# CI and deployment conventions

## 1. Docker

One `Dockerfile` per deployable (`apps/api/Dockerfile`, `services/ai/Dockerfile`), built from the repo root so workspace packages are available.

The API image (`apps/api/Dockerfile`) has four stages:

| Stage | Contents |
| --- | --- |
| `deps` | `npm ci` for `@matchbox/api` and `@matchbox/shared` with the Prisma schema and `prisma.config.ts` copied first, then the sources |
| `migrate` | `deps` plus `CMD npm run db:deploy`; the target for `docker compose` and the CI migration step |
| `builder` | `nest build`, then `npm prune --omit=dev --omit=optional --ignore-scripts` |
| runtime | `node:24-alpine`, `dumb-init`, the pruned `node_modules`, and `dist`, in the repo layout under `/app` |

Rules:

- Multi-stage build. The runtime stage is alpine with only production `node_modules` and `dist`, and `dumb-init` as PID 1 so signals reach Node and shutdown hooks run.
- The Prisma schema and `prisma.config.ts` are copied before `npm ci`, because `postinstall` runs `prisma generate`. Prisma 7 has no native engine, so no binary targets are needed.
- `npm prune` needs `--omit=optional` because `@prisma/client` lists the Prisma CLI and TypeScript as optional peers, which `--omit=dev` alone keeps. It needs `--ignore-scripts` so `postinstall` does not run again without the dev dependencies.
- The runtime stage keeps the repo layout (`/app/node_modules`, `/app/apps/api/node_modules`, `/app/apps/api/dist`) so packages that npm nests under the workspace still resolve.
- The image does not run migrations; the deploy workflow does (see section 3), with the `migrate` stage.
- Run as the non-root `node` user.
- No secrets in images or build args. Runtime secrets come from Secret Manager through Cloud Run.
- `.dockerignore` excludes `node_modules`, `dist`, `coverage`, `.env*`, and `.git`.
- The web app is not containerized for production. It deploys as static files. `apps/web/Dockerfile` (static build served by nginx) exists only for local `docker compose`.
- `services/ai/Dockerfile` builds one image for the AI service and the AI worker; the command selects `app.api.main` or `app.worker.main`.

## 2. GitHub Actions

One workflow per deployable with path filters (HLD D7), as already planned in `.github/workflows/README.md`:

| Workflow | Triggers on | Jobs |
| --- | --- | --- |
| `api.yml` | `apps/api/**`, `packages/shared/**`, `packages/ai-client/**` | install, `lint:ci`, `typecheck`, `test`, `test:e2e`, build image; on `master`: migrate, deploy |
| `web.yml` | `apps/web/**`, `packages/ui/**`, `packages/shared/**` | install, `lint:ci`, `typecheck`, `test`, build; on `master`: deploy to static hosting |
| `ai.yml` | `services/ai/**` | Defined by the Python conventions |
| `contract.yml` | `services/ai/**`, `packages/ai-client/**` | Regenerate the AI client and fail if it differs from the committed one (D5) |

Rules:

- Pull requests run every check job. Deploy jobs run only on pushes to `master`.
- Use `actions/setup-node` with the version from `.nvmrc` and `cache: npm`.
- Authenticate to GCP with Workload Identity Federation (`google-github-actions/auth`). No service account JSON keys in GitHub secrets.
- Workflow files use the `.yml` extension and kebab-case job ids.
- Use public actions only. Pin third-party actions to a major version tag at minimum; Renovate keeps them current.
- No release, manual, or preview-environment workflows: there is no release versioning and no preview environment.

## 3. Deployment

- API, AI service, and AI worker run on Cloud Run with `min-instances=0` and `max-instances=1` (HLD section 10): it scales to zero and fits the free tier. Every deploy command sets these explicitly so they cannot drift.
- `prisma migrate deploy` runs as a workflow step before the new API revision is deployed. If the migration fails, the deploy stops. Migrations never run in the container entrypoint; with scale-to-zero that would repeat on every cold start.
- Cloud Run probes use `/health/ready` for startup and `/health/live` for liveness.
- The web app deploys to static hosting with `VITE_*` values injected at build time.
- Environments: `local` (`docker compose up`) and `production`. There is no staging environment; pull request checks and local compose fill that role for a single-user tool.

## 4. Dependencies

- Renovate with grouped weekly updates and automerge for patch updates that pass CI.
