import type { Request, Response, NextFunction } from "express";
import type { Priority } from "@prisma/client";
import { NotFoundError } from "../errors/AppError.js";
import { ticketService } from "../services/ticketService.js";
import type { CreateTicketInput, UpdateTicketInput } from "../types/ticket.js";

export async function createTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const input: CreateTicketInput = {
      title: body.title as string,
      description: body.description as string,
      priority: body.priority as Priority,
      assignedTo: body.assignedTo as string | null | undefined,
    };

    const userId = req.context?.userId;
    if (!userId) {
      throw new Error("Request context is missing user ID");
    }

    const ticket = await ticketService.create(input, userId);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function listTickets(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tickets = await ticketService.list();
    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
}

export async function getTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      throw new NotFoundError("Ticket not found");
    }

    const ticket = await ticketService.getById(id);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

/**
 * Partially updates ticket fields (title, description, priority, assignedTo, status).
 */
export async function updateTicket(
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
    const input: UpdateTicketInput = {
      title: body.title as string | undefined,
      description: body.description as string | undefined,
      priority: body.priority as Priority | undefined,
      assignedTo: body.assignedTo as string | null | undefined,
      status: body.status as string | undefined,
    };

    const ticket = await ticketService.update(id, body, input);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}
