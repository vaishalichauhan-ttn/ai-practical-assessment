import { MESSAGE_MAX_LENGTH } from "../constants/comment.js";
import type { ErrorDetail } from "../errors/AppError.js";
import type { CreateCommentInput } from "../types/comment.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates a comment message value.
 *
 * @param value Message value to validate.
 * @returns Field error detail or null when valid.
 */
export function validateMessage(value: unknown): ErrorDetail | null {
  if (!isNonEmptyString(value)) {
    return { field: "message", message: "message is required" };
  }

  if (value.trim().length > MESSAGE_MAX_LENGTH) {
    return {
      field: "message",
      message: `message must be at most ${MESSAGE_MAX_LENGTH} characters`,
    };
  }

  return null;
}

/**
 * Validates input for creating a comment.
 *
 * @param input Parsed comment creation input.
 * @returns Validation error details; empty when valid.
 */
export function validateCreateCommentInput(
  input: CreateCommentInput
): ErrorDetail[] {
  const details: ErrorDetail[] = [];
  const messageError = validateMessage(input.message);

  if (messageError) {
    details.push(messageError);
  }

  return details;
}
