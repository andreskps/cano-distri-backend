# Etapa de build
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias de compilación si son necesarias
RUN apk add --no-cache python3 make g++ libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# Etapa runtime
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Crear usuario no-root
RUN addgroup -S app && adduser -S app -G app

# Instalar postgresql-client para pg_isready
RUN apk add --no-cache postgresql-client

# Copiar archivos desde build
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json

# Copiar script de wait-for-db
COPY --chown=app:app wait-for-db.sh ./
RUN chmod +x wait-for-db.sh

USER app

EXPOSE 3001

CMD ["sh", "wait-for-db.sh"]
