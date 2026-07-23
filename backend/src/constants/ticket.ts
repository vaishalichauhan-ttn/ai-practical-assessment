import { Priority, TicketStatus } from "@prisma/client";

export const PRIORITY_VALUES = Object.values(Priority);

export const TITLE_MAX_LENGTH = 255;
export const DESCRIPTION_MAX_LENGTH = 10000;

export const DEFAULT_USER_EMAIL = "alice.johnson@example.com";

export const API_TICKET_STATUSES = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Cancelled",
] as const;

export type ApiTicketStatus = (typeof API_TICKET_STATUSES)[number];

export const STATUS_API_TO_PRISMA: Record<ApiTicketStatus, TicketStatus> = {
  Open: TicketStatus.Open,
  "In Progress": TicketStatus.InProgress,
  Resolved: TicketStatus.Resolved,
  Closed: TicketStatus.Closed,
  Cancelled: TicketStatus.Cancelled,
};

export const STATUS_PRISMA_TO_API: Record<TicketStatus, ApiTicketStatus> = {
  [TicketStatus.Open]: "Open",
  [TicketStatus.InProgress]: "In Progress",
  [TicketStatus.Resolved]: "Resolved",
  [TicketStatus.Closed]: "Closed",
  [TicketStatus.Cancelled]: "Cancelled",
};
