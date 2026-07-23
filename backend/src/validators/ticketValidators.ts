import type { Priority } from "@prisma/client";
import {
  API_TICKET_STATUSES,
  DESCRIPTION_MAX_LENGTH,
  PRIORITY_VALUES,
  TITLE_MAX_LENGTH,
  type ApiTicketStatus,
} from "../constants/ticket.js";
import type { ErrorDetail } from "../errors/AppError.js";
import type { CreateTicketInput, UpdateTicketInput } from "../types/ticket.js";

export const TICKET_UPDATE_FIELDS = [
  "title",
  "description",
  "priority",
  "assignedTo",
  "status",
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates a ticket title value.
 *
 * @param value Title value to validate.
 * @param emptyMessage Message when the title is missing or blank.
 * @returns Field error detail or null when valid.
 */
export function validateTitle(
  value: unknown,
  emptyMessage: string
): ErrorDetail | null {
  if (!isNonEmptyString(value)) {
    return { field: "title", message: emptyMessage };
  }

  if (value.trim().length > TITLE_MAX_LENGTH) {
    return {
      field: "title",
      message: `title must be at most ${TITLE_MAX_LENGTH} characters`,
    };
  }

  return null;
}

/**
 * Validates a ticket description value.
 *
 * @param value Description value to validate.
 * @param emptyMessage Message when the description is missing or blank.
 * @returns Field error detail or null when valid.
 */
export function validateDescription(
  value: unknown,
  emptyMessage: string
): ErrorDetail | null {
  if (!isNonEmptyString(value)) {
    return { field: "description", message: emptyMessage };
  }

  if (value.trim().length > DESCRIPTION_MAX_LENGTH) {
    return {
      field: "description",
      message: `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    };
  }

  return null;
}

/**
 * Validates a ticket priority value.
 *
 * @param value Priority value to validate.
 * @param options Whether the field is required.
 * @returns Field error detail or null when valid.
 */
export function validatePriority(
  value: unknown,
  options: { required: boolean }
): ErrorDetail | null {
  if (value === undefined || value === null) {
    return {
      field: "priority",
      message: options.required ? "priority is required" : "Invalid priority value",
    };
  }

  if (!PRIORITY_VALUES.includes(value as Priority)) {
    return { field: "priority", message: "Invalid priority value" };
  }

  return null;
}

/**
 * Validates a ticket status enum value.
 *
 * @param value Status value to validate.
 * @returns Field error detail or null when valid.
 */
export function validateStatus(value: unknown): ErrorDetail | null {
  if (
    typeof value !== "string" ||
    !API_TICKET_STATUSES.includes(value as ApiTicketStatus)
  ) {
    return { field: "status", message: "Invalid status value" };
  }

  return null;
}

/**
 * Validates ticket creation input fields.
 *
 * @param input Parsed create ticket input.
 * @returns Collected field validation errors.
 */
export function validateCreateTicketInput(
  input: CreateTicketInput
): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  const titleError = validateTitle(input.title, "title is required");
  if (titleError) {
    details.push(titleError);
  }

  const descriptionError = validateDescription(
    input.description,
    "description is required"
  );
  if (descriptionError) {
    details.push(descriptionError);
  }

  const priorityError = validatePriority(input.priority, { required: true });
  if (priorityError) {
    details.push(priorityError);
  }

  return details;
}

/**
 * Validates ticket update input fields based on which fields were provided.
 *
 * @param body Raw request body used to detect provided fields.
 * @param input Parsed update ticket input.
 * @returns Collected field validation errors.
 */
export function validateUpdateTicketInput(
  body: Record<string, unknown>,
  input: UpdateTicketInput
): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  const hasUpdateField = TICKET_UPDATE_FIELDS.some((field) => field in body);
  if (!hasUpdateField) {
    details.push({
      field: "body",
      message: "At least one field must be provided",
    });
    return details;
  }

  if ("title" in body) {
    const titleError = validateTitle(input.title, "title must be non-empty");
    if (titleError) {
      details.push(titleError);
    }
  }

  if ("description" in body) {
    const descriptionError = validateDescription(
      input.description,
      "description must be non-empty"
    );
    if (descriptionError) {
      details.push(descriptionError);
    }
  }

  if ("priority" in body) {
    const priorityError = validatePriority(input.priority, { required: false });
    if (priorityError) {
      details.push(priorityError);
    }
  }

  if ("status" in body) {
    const statusError = validateStatus(input.status);
    if (statusError) {
      details.push(statusError);
    }
  }

  return details;
}
