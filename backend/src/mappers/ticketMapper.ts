import type { Comment, Priority, Ticket, TicketStatus, User } from "@prisma/client";
import type {
  CommentDto,
  TicketDetailDto,
  TicketDto,
  TicketSummaryDto,
  UserRefDto,
} from "../types/ticket.js";

type TicketWithRelations = Ticket & {
  creator: Pick<User, "id" | "name">;
  assignee: Pick<User, "id" | "name"> | null;
};

type CommentWithCreator = Comment & {
  creator: Pick<User, "id" | "name">;
};

type TicketWithComments = TicketWithRelations & {
  comments: CommentWithCreator[];
};

const STATUS_API_MAP: Record<TicketStatus, string> = {
  Open: "Open",
  InProgress: "In Progress",
  Resolved: "Resolved",
  Closed: "Closed",
  Cancelled: "Cancelled",
};

function toUserRef(user: Pick<User, "id" | "name">): UserRefDto {
  return {
    id: user.id,
    name: user.name,
  };
}

export function toTicketDto(ticket: TicketWithRelations): TicketDto {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority as Priority,
    status: STATUS_API_MAP[ticket.status],
    assignedTo: ticket.assignee ? toUserRef(ticket.assignee) : null,
    createdBy: toUserRef(ticket.creator),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function toTicketSummaryDto(ticket: TicketWithRelations): TicketSummaryDto {
  return {
    id: ticket.id,
    title: ticket.title,
    priority: ticket.priority as Priority,
    status: STATUS_API_MAP[ticket.status],
    assignedTo: ticket.assignee ? toUserRef(ticket.assignee) : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function toCommentDto(comment: CommentWithCreator): CommentDto {
  return {
    id: comment.id,
    message: comment.message,
    createdBy: toUserRef(comment.creator),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export function toTicketDetailDto(ticket: TicketWithComments): TicketDetailDto {
  return {
    ...toTicketDto(ticket),
    comments: ticket.comments.map(toCommentDto),
  };
}
