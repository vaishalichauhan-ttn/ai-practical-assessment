import { apiRequest } from "./client.js";

/**
 * Fetches all seeded users for assignee selection.
 *
 * @returns Promise resolving to the list of users.
 */
export function listUsers() {
  return apiRequest("/api/users");
}
