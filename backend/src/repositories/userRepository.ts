import { prisma } from "../lib/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
  },

  async findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: { name: "asc" },
    });
  },
};
