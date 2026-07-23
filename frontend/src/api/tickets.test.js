import { describe, it, expect, vi, beforeEach } from "vitest";
import { listTickets, getTicket, createTicket, updateTicket, addComment, listComments } from "./tickets.js";

vi.mock("./client.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./client.js";

describe("tickets API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({});
  });

  it("lists tickets without a query string when no filters are provided", async () => {
    await listTickets();
    expect(apiRequest).toHaveBeenCalledWith("/api/tickets");
  });

  it("lists tickets with search and status query params", async () => {
    await listTickets({ search: "login", status: "Open" });
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/tickets?search=login&status=Open"
    );
  });

  it("fetches a single ticket by id", async () => {
    await getTicket("ticket-1");
    expect(apiRequest).toHaveBeenCalledWith("/api/tickets/ticket-1");
  });

  it("creates a ticket with a POST body", async () => {
    const payload = {
      title: "Cannot print",
      description: "Jammed",
      priority: "High",
    };
    await createTicket(payload);
    expect(apiRequest).toHaveBeenCalledWith("/api/tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("updates a ticket with a PATCH body", async () => {
    const payload = { title: "Updated" };
    await updateTicket("ticket-1", payload);
    expect(apiRequest).toHaveBeenCalledWith("/api/tickets/ticket-1", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  });

  it("adds a comment to a ticket", async () => {
    const payload = { message: "Looking into this" };
    await addComment("ticket-1", payload);
    expect(apiRequest).toHaveBeenCalledWith("/api/tickets/ticket-1/comments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("lists comments for a ticket", async () => {
    await listComments("ticket-1");
    expect(apiRequest).toHaveBeenCalledWith("/api/tickets/ticket-1/comments");
  });
});
