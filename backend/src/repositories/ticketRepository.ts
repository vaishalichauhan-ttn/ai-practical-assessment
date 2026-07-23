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

export interface UpdateTicketData {
  title?: string;
  description?: string;
  priority?: Priority;
  assignedTo?: string | null;
  status?: TicketStatus;
}

const ticketInclude = {
  creator: {
    select: { id: true, name: true },
  },
  assignee: {
    select: { id: true, name: true },
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
      include: ticketInclude,
    });
  },

  async existsById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });
    return ticket !== null;
  },

  async findStatusById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { status: true },
    });
    return ticket?.status ?? null;
  },

  async update(id: string, data: UpdateTicketData) {
    return prisma.ticket.update({
      where: { id },
      data,
      include: ticketInclude,
    });
  },
};
