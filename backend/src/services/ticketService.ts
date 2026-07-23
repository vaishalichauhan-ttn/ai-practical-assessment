import type { Priority } from "@prisma/client";
import { TicketStatus } from "@prisma/client";
import {
  DESCRIPTION_MAX_LENGTH,
  PRIORITY_VALUES,
  TITLE_MAX_LENGTH,
} from "../constants/ticket.js";
import type { ErrorDetail } from "../errors/AppError.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import {
  toTicketDetailDto,
  toTicketDto,
  toTicketSummaryDto,
} from "../mappers/ticketMapper.js";
import { ticketRepository } from "../repositories/ticketRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import type { CreateTicketInput, UpdateTicketInput } from "../types/ticket.js";
import { isValidUuid } from "../validators/uuid.js";

const UPDATE_FIELDS = [
  "title",
  "description",
  "priority",
  "assignedTo",
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateTitle(
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

function validateDescription(
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

function validatePriority(
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

function validateCreateInput(input: CreateTicketInput): ErrorDetail[] {
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

function validateUpdateInput(
  body: Record<string, unknown>,
  input: UpdateTicketInput
): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  const hasUpdateField = UPDATE_FIELDS.some((field) => field in body);
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

  return details;
}

export const ticketService = {
  async create(input: CreateTicketInput, createdBy: string) {
    const details = validateCreateInput(input);

    if (details.length > 0) {
      throw new ValidationError("Validation failed", details);
    }

    const creator = await userRepository.findById(createdBy);
    if (!creator) {
      throw new ValidationError("Validation failed", [
        { field: "createdBy", message: "Invalid user context" },
      ]);
    }

    let assignedTo: string | null = null;
    if (input.assignedTo !== undefined && input.assignedTo !== null) {
      const assignee = await userRepository.findById(input.assignedTo);
      if (!assignee) {
        throw new ValidationError("Validation failed", [
          { field: "assignedTo", message: "Invalid assignee" },
        ]);
      }
      assignedTo = assignee.id;
    }

    const ticket = await ticketRepository.create({
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      status: TicketStatus.Open,
      createdBy: creator.id,
      assignedTo,
    });

    return toTicketDto(ticket);
  },

  async list() {
    const tickets = await ticketRepository.findAll();
    return tickets.map(toTicketSummaryDto);
  },

  async getById(id: string) {
    if (!isValidUuid(id)) {
      throw new NotFoundError("Ticket not found");
    }

    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    return toTicketDetailDto(ticket);
  },

  /**
   * Partially updates ticket fields. Validates each provided field independently,
   * verifies the ticket exists, and persists allowed changes.
   *
   * @param id Ticket UUID.
   * @param body Raw request body used to detect which fields were provided.
   * @param input Parsed update input values.
   * @returns Updated ticket DTO.
   * @throws NotFoundError When the ticket does not exist.
   * @throws ValidationError When validation fails for any provided field.
   */
  async update(id: string, body: Record<string, unknown>, input: UpdateTicketInput) {
    if (!isValidUuid(id)) {
      throw new NotFoundError("Ticket not found");
    }

    const details = validateUpdateInput(body, input);
    if (details.length > 0) {
      throw new ValidationError("Validation failed", details);
    }

    const exists = await ticketRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError("Ticket not found");
    }

    const updateData: {
      title?: string;
      description?: string;
      priority?: Priority;
      assignedTo?: string | null;
    } = {};

    if ("title" in body && input.title !== undefined) {
      updateData.title = input.title.trim();
    }

    if ("description" in body && input.description !== undefined) {
      updateData.description = input.description.trim();
    }

    if ("priority" in body && input.priority !== undefined) {
      updateData.priority = input.priority;
    }

    if ("assignedTo" in body) {
      if (input.assignedTo === null) {
        updateData.assignedTo = null;
      } else if (input.assignedTo !== undefined) {
        const assignee = await userRepository.findById(input.assignedTo);
        if (!assignee) {
          throw new ValidationError("Validation failed", [
            { field: "assignedTo", message: "Invalid assignee" },
          ]);
        }
        updateData.assignedTo = assignee.id;
      }
    }

    const ticket = await ticketRepository.update(id, updateData);
    return toTicketDto(ticket);
  },
};
