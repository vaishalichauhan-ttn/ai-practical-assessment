import type { Priority } from "@prisma/client";
import { TicketStatus } from "@prisma/client";
import {
  STATUS_API_TO_PRISMA,
  STATUS_PRISMA_TO_API,
  type ApiTicketStatus,
} from "../constants/ticket.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import {
  toTicketDto,
  toTicketSummaryDto,
} from "../mappers/ticketMapper.js";
import { ticketRepository } from "../repositories/ticketRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import type {
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "../types/ticket.js";
import {
  validateCreateTicketInput,
  validateListTicketsQuery,
  validateUpdateTicketInput,
} from "../validators/ticketValidators.js";
import { validateStatusTransition } from "../validators/statusTransitionValidator.js";
import { isValidUuid } from "../validators/uuid.js";

export const ticketService = {
  async create(input: CreateTicketInput, createdBy: string) {
    const details = validateCreateTicketInput(input);

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

  /**
   * Lists tickets with optional keyword search and status filter.
   *
   * @param query Optional search and status query parameters.
   * @returns Ticket summary DTOs matching all applied filters.
   * @throws ValidationError When an invalid status value is provided.
   */
  async list(query: ListTicketsQuery = {}) {
    const details = validateListTicketsQuery(query);
    if (details.length > 0) {
      throw new ValidationError("Validation failed", details);
    }

    const filters: { search?: string; status?: TicketStatus } = {};

    if (query.search !== undefined) {
      const normalizedSearch = query.search.trim();
      if (normalizedSearch.length > 0) {
        filters.search = normalizedSearch;
      }
    }

    if (query.status !== undefined && query.status.trim() !== "") {
      filters.status = STATUS_API_TO_PRISMA[query.status as ApiTicketStatus];
    }

    const tickets = await ticketRepository.findAll(filters);
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

    return toTicketDto(ticket);
  },

  /**
   * Partially updates ticket fields. Validates each provided field independently,
   * verifies the ticket exists, enforces status transition rules, and persists changes.
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

    const details = validateUpdateTicketInput(body, input);
    if (details.length > 0) {
      throw new ValidationError("Validation failed", details);
    }

    const currentStatus = await ticketRepository.findStatusById(id);
    if (!currentStatus) {
      throw new NotFoundError("Ticket not found");
    }

    const updateData: {
      title?: string;
      description?: string;
      priority?: Priority;
      assignedTo?: string | null;
      status?: TicketStatus;
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

    if ("status" in body && input.status !== undefined) {
      const currentApiStatus = STATUS_PRISMA_TO_API[currentStatus];
      const targetApiStatus = input.status as ApiTicketStatus;
      const transition = validateStatusTransition(currentApiStatus, targetApiStatus);

      if (!transition.valid) {
        const message = transition.reason ?? "Invalid status transition";
        throw new ValidationError(message, [
          { field: "status", message },
        ]);
      }

      updateData.status = STATUS_API_TO_PRISMA[targetApiStatus];
    }

    const ticket = await ticketRepository.update(id, updateData);
    return toTicketDto(ticket);
  },
};
