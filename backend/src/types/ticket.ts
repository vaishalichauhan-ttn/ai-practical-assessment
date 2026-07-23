import type { Priority } from "@prisma/client";

export interface CreateTicketInput {
  title: string;
  description: string;
  priority: Priority;
  assignedTo?: string | null;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: Priority;
  assignedTo?: string | null;
  status?: string;
}

export interface UserRefDto {
  id: string;
  name: string;
}

export interface TicketSummaryDto {
  id: string;
  title: string;
  priority: Priority;
  status: string;
  assignedTo: UserRefDto | null;
  createdAt: string;
  updatedAt: string;
}

export type { CommentDto } from "./comment.js";

export interface TicketDto {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: string;
  assignedTo: UserRefDto | null;
  createdBy: UserRefDto;
  createdAt: string;
  updatedAt: string;
}
