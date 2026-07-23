import { apiRequest } from "./client.js";

/**
 * Fetches tickets from the API with optional search and status filters.
 *
 * @param filters Optional search keyword and status filter.
 * @returns Promise resolving to the list of ticket summaries.
 */
export function listTickets(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();
  const path = query ? `/api/tickets?${query}` : "/api/tickets";

  return apiRequest(path);
}

/**
 * Fetches a single ticket by ID.
 *
 * @param id Ticket UUID.
 * @returns Promise resolving to the ticket detail.
 */
export function getTicket(id) {
  return apiRequest(`/api/tickets/${id}`);
}

/**
 * Creates a new support ticket.
 *
 * @param payload Ticket fields (title, description, priority, optional assignedTo).
 * @returns Promise resolving to the created ticket.
 * @throws {import("./client.js").ApiError} When the API returns a validation or server error.
 */
export function createTicket(payload) {
  return apiRequest("/api/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Partially updates an existing ticket.
 *
 * @param id Ticket UUID.
 * @param payload Fields to update (title, description, priority, assignedTo, status).
 * @returns Promise resolving to the updated ticket.
 * @throws {import("./client.js").ApiError} When the API returns a validation or server error.
 */
export function updateTicket(id, payload) {
  return apiRequest(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Adds a comment to an existing ticket.
 *
 * @param ticketId Ticket UUID.
 * @param payload Comment fields (message).
 * @returns Promise resolving to the created comment.
 * @throws {import("./client.js").ApiError} When the API returns a validation or server error.
 */
export function addComment(ticketId, payload) {
  return apiRequest(`/api/tickets/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches all comments for a ticket.
 *
 * @param ticketId Ticket UUID.
 * @returns Promise resolving to the list of comments.
 * @throws {import("./client.js").ApiError} When the API returns a validation or server error.
 */
export function listComments(ticketId) {
  return apiRequest(`/api/tickets/${ticketId}/comments`);
}
