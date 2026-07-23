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
import type { CreateTicketInput } from "../types/ticket.js";
import { isValidUuid } from "../validators/uuid.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCreateInput(input: CreateTicketInput): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  if (!isNonEmptyString(input.title)) {
    details.push({ field: "title", message: "title is required" });
  } else if (input.title.trim().length > TITLE_MAX_LENGTH) {
    details.push({
      field: "title",
      message: `title must be at most ${TITLE_MAX_LENGTH} characters`,
    });
  }

  if (!isNonEmptyString(input.description)) {
    details.push({ field: "description", message: "description is required" });
  } else if (input.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    details.push({
      field: "description",
      message: `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    });
  }

  if (input.priority === undefined || input.priority === null) {
    details.push({ field: "priority", message: "priority is required" });
  } else if (!PRIORITY_VALUES.includes(input.priority as Priority)) {
    details.push({ field: "priority", message: "Invalid priority value" });
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
};
