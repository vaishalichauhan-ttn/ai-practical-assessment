import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "./loadTestEnv.js";
import { PrismaClient } from "@prisma/client";

const TEST_DB_NAME = "support_tickets_test";
const ADMIN_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/postgres";
const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

/**
 * Creates the isolated test database when it does not already exist.
 */
async function ensureTestDatabase(): Promise<void> {
  const admin = new PrismaClient({
    datasources: { db: { url: ADMIN_DATABASE_URL } },
  });

  try {
    const result = await admin.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM pg_database WHERE datname = ${TEST_DB_NAME}
      ) AS exists
    `;

    if (!result[0]?.exists) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}"`);
    }
  } finally {
    await admin.$disconnect();
  }
}

async function main(): Promise<void> {
  await ensureTestDatabase();

  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  execSync("npx prisma migrate deploy", {
    cwd: backendRoot,
    env,
    stdio: "inherit",
  });

  execSync("npx prisma db seed", {
    cwd: backendRoot,
    env,
    stdio: "inherit",
  });
}

main().catch((error: unknown) => {
  console.error("Failed to prepare test database:", error);
  process.exit(1);
});
