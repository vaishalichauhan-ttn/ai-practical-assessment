import type { UserRefDto } from "./ticket.js";

export interface CreateCommentInput {
  message: string;
}

export interface CommentDto {
  id: string;
  message: string;
  createdBy: UserRefDto;
  createdAt: string;
  updatedAt: string;
}
