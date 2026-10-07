# check=skip=SecretsUsedInArgOrEnv
# Local docker compose only; production serves the static build from static hosting.
# Built from the repo root: docker build -f apps/web/Dockerfile .
FROM node:24 AS builder
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
RUN npm ci -w @matchbox/web -w @matchbox/shared -w @matchbox/ui --include-workspace-root
COPY packages/shared packages/shared
COPY packages/ui packages/ui
COPY apps/web apps/web
ARG VITE_API_URL=http://localhost:3000
ARG VITE_FIREBASE_API_KEY=demo-api-key
ARG VITE_FIREBASE_AUTH_DOMAIN=demo-matchbox.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=demo-matchbox
ARG VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
ENV VITE_API_URL=$VITE_API_URL \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_AUTH_EMULATOR_HOST=$VITE_FIREBASE_AUTH_EMULATOR_HOST
RUN npm run build -w @matchbox/web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
