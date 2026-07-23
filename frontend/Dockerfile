# Build the Vite React app and serve it with nginx.
# Build context must be the repository root (see docker-compose.yml).

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci -w frontend

COPY frontend ./frontend

# Empty base URL keeps relative `/api` paths; nginx proxies to the backend service.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build -w frontend

# ---------------------------------------------------------------------------

FROM nginx:1.27-alpine AS runner

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
