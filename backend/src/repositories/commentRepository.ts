import { prisma } from "../lib/prisma.js";

export interface CreateCommentData {
  ticketId: string;
  message: string;
  createdBy: string;
}

const commentInclude = {
  creator: {
    select: { id: true, name: true },
  },
} as const;

export const commentRepository = {
  /**
   * Persists a new comment with updatedAt equal to createdAt on insert.
   *
   * @param data Comment fields to persist.
   * @returns Created comment with creator relation.
   */
  async create(data: CreateCommentData) {
    const now = new Date();

    return prisma.comment.create({
      data: {
        ticketId: data.ticketId,
        message: data.message,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
      },
      include: commentInclude,
    });
  },

  /**
   * Returns all comments for a ticket ordered by createdAt ascending.
   *
   * @param ticketId Parent ticket UUID.
   * @returns Comments with creator relation.
   */
  async findByTicketId(ticketId: string) {
    return prisma.comment.findMany({
      where: { ticketId },
      include: commentInclude,
      orderBy: { createdAt: "asc" },
    });
  },
};
