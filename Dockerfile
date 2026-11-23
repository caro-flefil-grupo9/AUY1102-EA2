# Etapa 1: Construcción y ejecución de pruebas unitarias dentro del contenedor
FROM node:20.20.0-alpine AS test

RUN apk upgrade --no-cache

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

CMD ["npm", "run", "test:unit"]

# Etapa 2: Imagen final liviana y segura para despliegue en Docker Hub
FROM node:20.20.0-alpine AS production

RUN apk upgrade --no-cache

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --chown=node:node src ./src
COPY --chown=node:node tsconfig.json ./

USER node

CMD ["node", "-e", "console.log('AUY1102 CI/CD Application Container Ready')"]
