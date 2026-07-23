# Build and run the Express + Prisma API.
# Build context must be the repository root (see docker-compose.yml).

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci -w backend

COPY backend ./backend

WORKDIR /app/backend

RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:20-alpine AS runner

WORKDIR /app

ENV PORT=3001

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install with devDependencies so prisma CLI + tsx are available for migrate/seed.
# NODE_ENV=production is set after install so npm does not omit them.
RUN npm ci -w backend

ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/docs ./backend/docs
COPY backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh

RUN chmod +x ./backend/docker-entrypoint.sh \
  && npx prisma generate --schema=./backend/prisma/schema.prisma

WORKDIR /app/backend

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
