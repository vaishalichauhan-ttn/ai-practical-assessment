import {
  ALLOWED_TRANSITIONS,
  TERMINAL_STATUSES,
} from "../constants/statusTransitions.js";
import type { ApiTicketStatus } from "../constants/ticket.js";

export interface StatusTransitionResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates whether a ticket status transition is allowed by the workflow matrix.
 *
 * @param currentStatus Current ticket status in API format.
 * @param targetStatus Requested target status in API format.
 * @returns Validation result with a human-readable reason when invalid.
 */
export function validateStatusTransition(
  currentStatus: ApiTicketStatus,
  targetStatus: ApiTicketStatus
): StatusTransitionResult {
  if (TERMINAL_STATUSES.has(currentStatus)) {
    return {
      valid: false,
      reason: `Status change not allowed for ${currentStatus} tickets`,
    };
  }

  if (currentStatus === targetStatus) {
    return {
      valid: false,
      reason: `Cannot transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedTargets.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  return { valid: true };
}
