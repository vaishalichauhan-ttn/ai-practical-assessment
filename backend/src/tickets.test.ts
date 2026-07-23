import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { getSeededUser } from "./test/ticketTestHelpers.js";

const app = createApp();

describe("POST /api/tickets", () => {
  it("creates a ticket with Open status and returns 201", async () => {
    const user = await getSeededUser();

    const response = await request(app)
      .post("/api/tickets")
      .set("X-User-Id", user.id)
      .send({
        title: "Cannot log in to dashboard",
        description: "User reports 401 error after password reset.",
        priority: "High",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Cannot log in to dashboard",
      description: "User reports 401 error after password reset.",
      priority: "High",
      status: "Open",
      assignedTo: null,
      createdBy: {
        id: user.id,
        name: user.name,
      },
    });
    expect(response.body.id).toBeTruthy();
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.updatedAt).toBeTruthy();

    const ticket = await prisma.ticket.findUnique({
      where: { id: response.body.id },
    });
    expect(ticket).not.toBeNull();
    expect(ticket?.status).toBe("Open");
    expect(ticket?.createdBy).toBe(user.id);
  });

  it("uses default dev user when X-User-Id is omitted", async () => {
    const defaultUser = await getSeededUser();

    const response = await request(app).post("/api/tickets").send({
      title: "Printer offline",
      description: "Floor 3 printer not responding.",
      priority: "Low",
    });

    expect(response.status).toBe(201);
    expect(response.body.createdBy.id).toBe(defaultUser.id);
  });

  it("ignores client-provided status and always sets Open", async () => {
    const response = await request(app).post("/api/tickets").send({
      title: "Status override attempt",
      description: "Client tries to set status directly.",
      priority: "Medium",
      status: "Closed",
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("Open");

    const ticket = await prisma.ticket.findUnique({
      where: { id: response.body.id },
    });
    expect(ticket?.status).toBe("Open");
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await request(app).post("/api/tickets").send({
      title: "Missing fields",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "description" }),
        expect.objectContaining({ field: "priority" }),
      ])
    );
  });

  it("returns 400 for invalid priority", async () => {
    const response = await request(app).post("/api/tickets").send({
      title: "Invalid priority ticket",
      description: "Priority value is not allowed.",
      priority: "Urgent",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "priority", message: "Invalid priority value" }],
    });
  });

  it("returns 400 for invalid assignedTo", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        title: "Invalid assignee",
        description: "Assignee does not exist.",
        priority: "High",
        assignedTo: "00000000-0000-4000-8000-000000000000",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "assignedTo", message: "Invalid assignee" }],
    });
  });

  it("creates a ticket with a valid assignedTo", async () => {
    const creator = await getSeededUser();
    const assignee = await getSeededUser("bob.smith@example.com");

    const response = await request(app)
      .post("/api/tickets")
      .set("X-User-Id", creator.id)
      .send({
        title: "Assigned on create",
        description: "Ticket starts with an assignee.",
        priority: "Medium",
        assignedTo: assignee.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.assignedTo).toEqual({
      id: assignee.id,
      name: assignee.name,
    });
  });

  it("returns 400 for title exceeding max length", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        title: "a".repeat(256),
        description: "Valid description",
        priority: "Low",
      });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual([
      {
        field: "title",
        message: "title must be at most 255 characters",
      },
    ]);
  });

  it("returns 400 for an invalid X-User-Id format", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-User-Id", "not-a-uuid")
      .send({
        title: "Needs valid user",
        description: "Header must be a UUID.",
        priority: "Low",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "X-User-Id", message: "Invalid user ID format" }],
    });
  });

  it("returns 400 when request body is a JSON array", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("Content-Type", "application/json")
      .send('[{"title":"x"}]');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Invalid request body",
      details: [{ field: "body", message: "Request body must be a JSON object" }],
    });
  });
});
