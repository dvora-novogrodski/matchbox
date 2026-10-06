# Built from the repo root: docker build -f apps/api/Dockerfile .
FROM node:24 AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
# postinstall runs prisma generate, which needs the schema and the Prisma config.
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/
RUN npm ci -w @matchbox/api -w @matchbox/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/api apps/api

# Runs `prisma migrate deploy` with the dev dependencies (Prisma CLI, dotenv); used by docker compose and CI.
FROM deps AS migrate
CMD ["npm", "run", "db:deploy", "-w", "@matchbox/api"]

FROM deps AS builder
# --omit=optional also drops the Prisma CLI and TypeScript, which @prisma/client lists as optional peers.
RUN npm run build -w @matchbox/api \
    && npm prune --omit=dev --omit=optional --ignore-scripts \
    && mkdir -p apps/api/node_modules

FROM node:24-alpine
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
# Keeps the repo layout so hoisted and workspace-nested node_modules both resolve.
WORKDIR /app/apps/api
COPY --from=builder --chown=node:node /repo/node_modules /app/node_modules
COPY --from=builder --chown=node:node /repo/packages/shared /app/packages/shared
COPY --from=builder --chown=node:node /repo/apps/api/node_modules ./node_modules
COPY --from=builder --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
