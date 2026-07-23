import { beforeEach } from "vitest";
import { prisma } from "../lib/prisma.js";

function assertTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl.includes("support_tickets_test")) {
    throw new Error(
      "Refusing to delete tickets: integration tests must use the support_tickets_test database."
    );
  }
}

export async function cleanupTickets() {
  assertTestDatabase();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
}

export async function getSeededUser(email = "alice.johnson@example.com") {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`Seeded user not found: ${email}. Run database seed.`);
  }
  return user;
}

export async function createTestTicket(
  overrides: {
    title?: string;
    description?: string;
    priority?: "Low" | "Medium" | "High" | "Critical";
    status?: "Open" | "InProgress" | "Resolved" | "Closed" | "Cancelled";
    assignedTo?: string | null;
    createdBy?: string;
  } = {}
) {
  const user = await getSeededUser();

  return prisma.ticket.create({
    data: {
      title: overrides.title ?? "Test ticket",
      description: overrides.description ?? "Test description",
      priority: overrides.priority ?? "Medium",
      status: overrides.status ?? "Open",
      createdBy: overrides.createdBy ?? user.id,
      assignedTo: overrides.assignedTo ?? null,
    },
  });
}

beforeEach(async () => {
  await cleanupTickets();
});
