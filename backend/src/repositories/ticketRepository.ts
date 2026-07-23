import type { Priority, TicketStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export interface CreateTicketData {
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  createdBy: string;
  assignedTo: string | null;
}

const ticketInclude = {
  creator: {
    select: { id: true, name: true },
  },
  assignee: {
    select: { id: true, name: true },
  },
} as const;

const ticketDetailInclude = {
  ...ticketInclude,
  comments: {
    include: {
      creator: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export const ticketRepository = {
  async create(data: CreateTicketData) {
    return prisma.ticket.create({
      data,
      include: ticketInclude,
    });
  },

  async findAll() {
    return prisma.ticket.findMany({
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: ticketDetailInclude,
    });
  },
};
