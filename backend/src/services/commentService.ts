import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { toCommentDto } from "../mappers/ticketMapper.js";
import { commentRepository } from "../repositories/commentRepository.js";
import { ticketRepository } from "../repositories/ticketRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import type { CreateCommentInput } from "../types/comment.js";
import { validateCreateCommentInput } from "../validators/commentValidators.js";
import { isValidUuid } from "../validators/uuid.js";

export const commentService = {
  /**
   * Lists all comments for an existing ticket in chronological order.
   *
   * @param ticketId Parent ticket UUID.
   * @returns Comment DTOs ordered by createdAt ascending.
   * @throws NotFoundError When the ticket does not exist.
   */
  async listByTicketId(ticketId: string) {
    if (!isValidUuid(ticketId)) {
      throw new NotFoundError("Ticket not found");
    }

    const ticketExists = await ticketRepository.existsById(ticketId);
    if (!ticketExists) {
      throw new NotFoundError("Ticket not found");
    }

    const comments = await commentRepository.findByTicketId(ticketId);
    return comments.map(toCommentDto);
  },

  /**
   * Adds a comment to an existing ticket.
   *
   * @param ticketId Parent ticket UUID.
   * @param input Comment creation input.
   * @param createdBy Author user UUID from request context.
   * @returns Created comment DTO.
   * @throws NotFoundError When the ticket does not exist.
   * @throws ValidationError When the message is invalid.
   */
  async create(ticketId: string, input: CreateCommentInput, createdBy: string) {
    if (!isValidUuid(ticketId)) {
      throw new NotFoundError("Ticket not found");
    }

    const details = validateCreateCommentInput(input);
    if (details.length > 0) {
      throw new ValidationError("Validation failed", details);
    }

    const ticketExists = await ticketRepository.existsById(ticketId);
    if (!ticketExists) {
      throw new NotFoundError("Ticket not found");
    }

    const creator = await userRepository.findById(createdBy);
    if (!creator) {
      throw new ValidationError("Validation failed", [
        { field: "createdBy", message: "Invalid user context" },
      ]);
    }

    const comment = await commentRepository.create({
      ticketId,
      message: input.message.trim(),
      createdBy: creator.id,
    });

    return toCommentDto(comment);
  },
};
