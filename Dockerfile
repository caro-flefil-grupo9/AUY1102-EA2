# Etapa 1: Construcción y ejecución de pruebas unitarias dentro del contenedor
FROM node:20.20.0-alpine AS test

RUN apk upgrade --no-cache

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

CMD ["npm", "run", "test:unit"]

# Etapa 2: Imagen final liviana y endurecida para despliegue en Docker Hub
FROM node:22-alpine AS production

RUN apk upgrade --no-cache

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
              /usr/local/lib/node_modules/corepack /usr/local/bin/corepack /opt/yarn*

COPY --from=test --chown=node:node /usr/src/app/dist ./dist
COPY --from=test --chown=node:node /usr/src/app/node_modules/tslib ./node_modules/tslib
COPY --chown=node:node src ./src
COPY --chown=node:node tsconfig.json ./

USER node

CMD ["node", "-e", "const lib = require('./dist/index.js'); console.log('AUY1102 CI/CD Application Container Ready - Exported symbols:', Object.keys(lib).join(', '))"]
