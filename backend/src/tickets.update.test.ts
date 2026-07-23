import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import {
  createTestTicket,
  getSeededUser,
} from "./test/ticketTestHelpers.js";

const app = createApp();

describe("GET /api/users", () => {
  it("returns seeded users for assignee selection", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(5);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.any(String),
      role: expect.any(String),
    });
  });
});

describe("PATCH /api/tickets/:id", () => {
  it("updates title, description, and priority", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      title: "Original title",
      description: "Original description",
      priority: "Low",
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({
        title: "Updated title",
        description: "Updated description",
        priority: "Critical",
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticket.id,
      title: "Updated title",
      description: "Updated description",
      priority: "Critical",
      status: "Open",
    });
    expect(response.body.updatedAt).not.toBe(ticket.updatedAt.toISOString());

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.title).toBe("Updated title");
    expect(persisted?.description).toBe("Updated description");
    expect(persisted?.priority).toBe("Critical");
  });

  it("updates only provided fields", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      title: "Keep title",
      description: "Keep description",
      priority: "Medium",
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ priority: "High" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title: "Keep title",
      description: "Keep description",
      priority: "High",
    });
  });

  it("assigns a valid user", async () => {
    const user = await getSeededUser();
    const assignee = await getSeededUser("bob.smith@example.com");
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ assignedTo: assignee.id });

    expect(response.status).toBe(200);
    expect(response.body.assignedTo).toEqual({
      id: assignee.id,
      name: assignee.name,
    });

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.assignedTo).toBe(assignee.id);
  });

  it("unassigns a ticket when assignedTo is null", async () => {
    const user = await getSeededUser();
    const assignee = await getSeededUser("bob.smith@example.com");
    const ticket = await createTestTicket({
      assignedTo: assignee.id,
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ assignedTo: null });

    expect(response.status).toBe(200);
    expect(response.body.assignedTo).toBeNull();

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.assignedTo).toBeNull();
  });

  it("returns 400 for invalid assignee", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({
        assignedTo: "00000000-0000-4000-8000-000000000000",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "assignedTo", message: "Invalid assignee" }],
    });
  });

  it("returns 400 for invalid priority", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ priority: "Urgent" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "priority", message: "Invalid priority value" }],
    });
  });

  it("returns 400 for empty PATCH body", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [
        { field: "body", message: "At least one field must be provided" },
      ],
    });
  });

  it("returns 400 for empty title", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ title: "   " });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "title", message: "title must be non-empty" }],
    });
  });

  it("returns 400 for empty description", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ description: "" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "description", message: "description must be non-empty" }],
    });
  });

  it("allows field updates on Closed tickets", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      title: "Closed ticket",
      description: "Terminal state ticket",
      status: "Closed",
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({
        title: "Updated closed ticket",
        priority: "High",
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticket.id,
      title: "Updated closed ticket",
      priority: "High",
      status: "Closed",
    });
  });

  it("allows field updates on Cancelled tickets", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      status: "Cancelled",
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ description: "Updated cancelled description" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticket.id,
      description: "Updated cancelled description",
      status: "Cancelled",
    });
  });

  it("returns 404 for a non-existent ticket", async () => {
    const response = await request(app)
      .patch("/api/tickets/00000000-0000-4000-8000-000000000000")
      .send({ title: "Does not exist" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });

  it("returns 404 for a malformed ticket id", async () => {
    const response = await request(app)
      .patch("/api/tickets/not-a-uuid")
      .send({ title: "Invalid id" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });

  it("reflects assignment changes in list and detail endpoints", async () => {
    const user = await getSeededUser();
    const assignee = await getSeededUser("carol.williams@example.com");
    const ticket = await createTestTicket({ createdBy: user.id });

    await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ assignedTo: assignee.id });

    const listResponse = await request(app).get("/api/tickets");
    const listed = listResponse.body.find(
      (item: { id: string }) => item.id === ticket.id
    );
    expect(listed.assignedTo).toEqual({
      id: assignee.id,
      name: assignee.name,
    });

    const detailResponse = await request(app).get(`/api/tickets/${ticket.id}`);
    expect(detailResponse.body.assignedTo).toEqual({
      id: assignee.id,
      name: assignee.name,
    });
  });
});
