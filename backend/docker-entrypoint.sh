#!/bin/sh
set -e

# Prefer workspace-hoisted binaries from the monorepo root install.
export PATH="/app/node_modules/.bin:/app/backend/node_modules/.bin:${PATH}"

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database (idempotent)..."
npx prisma db seed

echo "Starting backend server..."
exec node dist/index.js
