# CI and deployment conventions

## 1. Docker

One `Dockerfile` per deployable (`apps/api/Dockerfile`, `services/ai/Dockerfile`), built from the repo root so workspace packages are available.

```dockerfile
FROM node:24 AS builder
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY apps/api/prisma apps/api/prisma
RUN npm ci -w @matchbox/api -w @matchbox/shared --include-workspace-root
COPY tsconfig*.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @matchbox/shared && npm run build -w @matchbox/api \
    && npm prune --omit=dev

FROM node:24-alpine
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder --chown=node:node /repo/node_modules ./node_modules
COPY --from=builder --chown=node:node /repo/packages/shared ./packages/shared
COPY --from=builder --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

Rules:

- Multi-stage build. The runtime stage is alpine with only production `node_modules` and `dist`, and `dumb-init` as PID 1 so signals reach Node and shutdown hooks run.
- The Prisma schema is copied before `npm ci`, because `postinstall` runs `prisma generate`. The generator lists the alpine binary target (`binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`) if the Prisma version still uses native engines.
- The image does not run migrations; the deploy workflow does (see section 3).
- Run as the non-root `node` user.
- No secrets in images or build args. Runtime secrets come from Secret Manager through Cloud Run.
- `.dockerignore` excludes `node_modules`, `dist`, `coverage`, `.env*`, and `.git`.
- The web app is not containerized for production. It deploys as static files.

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
