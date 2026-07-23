import { apiRequest } from "./client.js";

export function listTickets() {
  return apiRequest("/api/tickets");
}

export function getTicket(id) {
  return apiRequest(`/api/tickets/${id}`);
}

export function createTicket(payload) {
  return apiRequest("/api/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
