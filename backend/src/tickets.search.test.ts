import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createTestTicket,
  getSeededUser,
} from "./test/ticketTestHelpers.js";

const app = createApp();

describe("GET /api/tickets search and filter", () => {
  it("filters tickets by search keyword in title (case-insensitive)", async () => {
    const user = await getSeededUser();

    await createTestTicket({
      title: "Cannot log in to dashboard",
      description: "User reports 401 error.",
      createdBy: user.id,
    });
    await createTestTicket({
      title: "Printer offline",
      description: "Floor 3 printer not responding.",
      createdBy: user.id,
    });

    const response = await request(app).get("/api/tickets?search=LOG");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Cannot log in to dashboard");
  });

  it("filters tickets by search keyword in description", async () => {
    const user = await getSeededUser();

    await createTestTicket({
      title: "Email sync issue",
      description: "Mailbox not syncing since yesterday.",
      createdBy: user.id,
    });
    await createTestTicket({
      title: "VPN disconnected",
      description: "Remote access fails after update.",
      createdBy: user.id,
    });

    const response = await request(app).get("/api/tickets?search=mailbox");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Email sync issue");
  });

  it("returns empty array when search has no matches", async () => {
    const user = await getSeededUser();

    await createTestTicket({
      title: "Printer offline",
      description: "Floor 3 printer not responding.",
      createdBy: user.id,
    });

    const response = await request(app).get("/api/tickets?search=nonexistent");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("filters tickets by status", async () => {
    const user = await getSeededUser();

    const openTicket = await createTestTicket({
      title: "Open ticket",
      createdBy: user.id,
      status: "Open",
    });
    await createTestTicket({
      title: "In progress ticket",
      createdBy: user.id,
      status: "InProgress",
    });

    const response = await request(app).get("/api/tickets?status=Open");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(openTicket.id);
    expect(response.body[0].status).toBe("Open");
  });

  it("returns 400 for an invalid status filter", async () => {
    const response = await request(app).get("/api/tickets?status=Invalid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Validation failed",
      details: [{ field: "status", message: "Invalid status value" }],
    });
  });

  it("combines search and status filters with AND semantics", async () => {
    const user = await getSeededUser();

    const matchingTicket = await createTestTicket({
      title: "Cannot log in to dashboard",
      description: "User reports 401 error.",
      createdBy: user.id,
      status: "Open",
    });
    await createTestTicket({
      title: "Cannot log in on mobile",
      description: "Mobile app login fails.",
      createdBy: user.id,
      status: "InProgress",
    });
    await createTestTicket({
      title: "Printer offline",
      description: "Floor 3 printer not responding.",
      createdBy: user.id,
      status: "Open",
    });

    const response = await request(app).get(
      "/api/tickets?search=log&status=Open"
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(matchingTicket.id);
  });

  it("returns empty array when combined filters have no matches", async () => {
    const user = await getSeededUser();

    await createTestTicket({
      title: "Cannot log in to dashboard",
      createdBy: user.id,
      status: "InProgress",
    });

    const response = await request(app).get(
      "/api/tickets?search=log&status=Open"
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns all tickets when search is empty", async () => {
    const user = await getSeededUser();

    await createTestTicket({
      title: "Ticket A",
      createdBy: user.id,
    });
    await createTestTicket({
      title: "Ticket B",
      createdBy: user.id,
    });

    const response = await request(app).get("/api/tickets?search=");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("treats whitespace-only search as no search filter", async () => {
    const user = await getSeededUser();

    await createTestTicket({
      title: "Ticket A",
      createdBy: user.id,
    });
    await createTestTicket({
      title: "Ticket B",
      createdBy: user.id,
    });

    const response = await request(app).get("/api/tickets?search=%20%20");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("returns all tickets when no filters are provided", async () => {
    const user = await getSeededUser();

    await createTestTicket({
      title: "Ticket A",
      createdBy: user.id,
    });
    await createTestTicket({
      title: "Ticket B",
      createdBy: user.id,
      status: "InProgress",
    });

    const response = await request(app).get("/api/tickets");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});
