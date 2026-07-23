import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    role: "support_agent",
  },
  {
    name: "Bob Smith",
    email: "bob.smith@example.com",
    role: "support_agent",
  },
  {
    name: "Carol Williams",
    email: "carol.williams@example.com",
    role: "team_lead",
  },
  {
    name: "David Brown",
    email: "david.brown@example.com",
    role: "support_agent",
  },
  {
    name: "Eva Martinez",
    email: "eva.martinez@example.com",
    role: "admin",
  },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
      },
      create: user,
    });
  }

  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
