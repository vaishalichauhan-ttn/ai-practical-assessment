import type { ApiTicketStatus } from "./ticket.js";

export const ALLOWED_TRANSITIONS: Record<ApiTicketStatus, ApiTicketStatus[]> = {
  Open: ["In Progress", "Cancelled"],
  "In Progress": ["Resolved", "Cancelled"],
  Resolved: ["Closed"],
  Closed: [],
  Cancelled: [],
};

export const TERMINAL_STATUSES = new Set<ApiTicketStatus>(["Closed", "Cancelled"]);

/**
 * Returns the valid next statuses for a given current status.
 *
 * @param currentStatus Current ticket status in API format.
 * @returns Allowed target statuses for the current state.
 */
export function getAllowedNextStatuses(
  currentStatus: ApiTicketStatus
): ApiTicketStatus[] {
  return [...ALLOWED_TRANSITIONS[currentStatus]];
}
