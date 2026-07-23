import type { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../errors/AppError.js";
import { commentService } from "../services/commentService.js";
import type { CreateCommentInput } from "../types/comment.js";

/**
 * Lists all comments for an existing ticket.
 */
export async function listComments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      throw new NotFoundError("Ticket not found");
    }

    const comments = await commentService.listByTicketId(id);
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
}

/**
 * Adds a comment to an existing ticket.
 */
export async function addComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      throw new NotFoundError("Ticket not found");
    }

    const body = req.body as Record<string, unknown>;
    const input: CreateCommentInput = {
      message: body.message as string,
    };

    const userId = req.context?.userId;
    if (!userId) {
      throw new Error("Request context is missing user ID");
    }

    const comment = await commentService.create(id, input, userId);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
}
