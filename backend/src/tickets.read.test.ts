import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createTestTicket,
  getSeededUser,
} from "./test/ticketTestHelpers.js";

const app = createApp();

describe("GET /api/tickets", () => {
  it("returns an empty array when no tickets exist", async () => {
    const response = await request(app).get("/api/tickets");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns all tickets with summary fields", async () => {
    const user = await getSeededUser();
    const assignee = await getSeededUser("bob.smith@example.com");

    const ticket = await createTestTicket({
      title: "Cannot log in to dashboard",
      description: "User reports 401 error after password reset.",
      priority: "High",
      assignedTo: assignee.id,
      createdBy: user.id,
    });

    const response = await request(app).get("/api/tickets");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: ticket.id,
          title: "Cannot log in to dashboard",
          priority: "High",
          status: "Open",
          assignedTo: {
            id: assignee.id,
            name: assignee.name,
          },
        }),
      ])
    );
    const listedTicket = response.body.find((item) => item.id === ticket.id);
    expect(listedTicket.createdAt).toBeTruthy();
    expect(listedTicket.updatedAt).toBeTruthy();
    expect(listedTicket.description).toBeUndefined();
  });

  it("includes created tickets from POST in the list", async () => {
    const user = await getSeededUser();

    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-User-Id", user.id)
      .send({
        title: "Printer offline",
        description: "Floor 3 printer not responding.",
        priority: "Low",
      });

    const listResponse = await request(app).get("/api/tickets");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createResponse.body.id,
          title: "Printer offline",
          priority: "Low",
          status: "Open",
        }),
      ])
    );
  });
});

describe("GET /api/tickets/:id", () => {
  it("returns full ticket detail for a valid id", async () => {
    const user = await getSeededUser();
    const assignee = await getSeededUser("bob.smith@example.com");

    const ticket = await createTestTicket({
      title: "Cannot log in to dashboard",
      description: "User reports 401 error after password reset.",
      priority: "High",
      assignedTo: assignee.id,
      createdBy: user.id,
    });

    const response = await request(app).get(`/api/tickets/${ticket.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticket.id,
      title: "Cannot log in to dashboard",
      description: "User reports 401 error after password reset.",
      priority: "High",
      status: "Open",
      assignedTo: {
        id: assignee.id,
        name: assignee.name,
      },
      createdBy: {
        id: user.id,
        name: user.name,
      },
      comments: [],
    });
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.updatedAt).toBeTruthy();
  });

  it("returns detail matching data from create endpoint", async () => {
    const user = await getSeededUser();

    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-User-Id", user.id)
      .send({
        title: "Email sync issue",
        description: "Mailbox not syncing since yesterday.",
        priority: "Critical",
      });

    const detailResponse = await request(app).get(
      `/api/tickets/${createResponse.body.id}`
    );

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({
      id: createResponse.body.id,
      title: "Email sync issue",
      description: "Mailbox not syncing since yesterday.",
      priority: "Critical",
      status: "Open",
      assignedTo: null,
      createdBy: {
        id: user.id,
        name: user.name,
      },
      comments: [],
    });
  });

  it("returns 404 for a non-existent ticket id", async () => {
    const response = await request(app).get(
      "/api/tickets/00000000-0000-4000-8000-000000000000"
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });

  it("returns 404 for a malformed ticket id", async () => {
    const response = await request(app).get("/api/tickets/not-a-uuid");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});
