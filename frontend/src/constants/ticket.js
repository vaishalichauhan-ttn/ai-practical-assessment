/** Email of the seeded user used when creating tickets (matches backend default). */
export const DEFAULT_USER_EMAIL = "alice.johnson@example.com";

export const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

export const TICKET_STATUSES = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Cancelled",
];

const ALLOWED_TRANSITIONS = {
  Open: ["In Progress", "Cancelled"],
  "In Progress": ["Resolved", "Cancelled"],
  Resolved: ["Closed"],
  Closed: [],
  Cancelled: [],
};

/**
 * Returns valid next statuses for the current ticket status.
 *
 * @param {string} currentStatus Current ticket status.
 * @returns {string[]} Allowed target statuses.
 */
export function getNextStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Whether a status option should be selectable for the current ticket status.
 * The current status and allowed next statuses are enabled; all others are disabled.
 *
 * @param {string} currentStatus Current ticket status from the server.
 * @param {string} optionStatus Status option being rendered.
 * @returns {boolean} True when the option should be enabled.
 */
export function isStatusOptionEnabled(currentStatus, optionStatus) {
  if (optionStatus === currentStatus) {
    return true;
  }

  return getNextStatuses(currentStatus).includes(optionStatus);
}
