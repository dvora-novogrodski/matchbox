FROM node:24-alpine

RUN npm install --global firebase-tools@15.32.1 \
    && npm cache clean --force

WORKDIR /firebase
COPY --chown=node:node infra/docker/firebase-auth/firebase.json ./firebase.json

USER node
EXPOSE 9099

CMD ["firebase", "emulators:start", "--only", "auth", "--project", "demo-matchbox"]
