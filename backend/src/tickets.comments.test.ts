import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import {
  createTestTicket,
  getSeededUser,
} from "./test/ticketTestHelpers.js";

const app = createApp();

describe("POST /api/tickets/:id/comments", () => {
  it("creates a comment and returns 201 with author and timestamps", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set("X-User-Id", user.id)
      .send({ message: "Escalated to tier-2 support." });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      message: "Escalated to tier-2 support.",
      createdBy: {
        id: user.id,
        name: user.name,
      },
    });
    expect(response.body.id).toBeTruthy();
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.updatedAt).toBe(response.body.createdAt);
  });

  it("rejects empty message with 400", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set("X-User-Id", user.id)
      .send({ message: "   " });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Validation failed",
      details: [{ field: "message", message: "message is required" }],
    });
  });

  it("rejects message over max length with 400", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set("X-User-Id", user.id)
      .send({ message: "a".repeat(5001) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Validation failed",
      details: [
        {
          field: "message",
          message: "message must be at most 5000 characters",
        },
      ],
    });
  });

  it("returns 404 when the ticket does not exist", async () => {
    const user = await getSeededUser();

    const response = await request(app)
      .post("/api/tickets/00000000-0000-4000-8000-000000000000/comments")
      .set("X-User-Id", user.id)
      .send({ message: "This should not be saved." });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });

    const commentCount = await prisma.comment.count();
    expect(commentCount).toBe(0);
  });

  it("returns 404 for a malformed ticket id", async () => {
    const user = await getSeededUser();

    const response = await request(app)
      .post("/api/tickets/not-a-uuid/comments")
      .set("X-User-Id", user.id)
      .send({ message: "This should not be saved." });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});

describe("GET /api/tickets/:id/comments", () => {
  it("returns comments in chronological order", async () => {
    const alice = await getSeededUser();
    const bob = await getSeededUser("bob.smith@example.com");
    const ticket = await createTestTicket({ createdBy: alice.id });

    const older = new Date("2026-07-23T09:00:00.000Z");
    const newer = new Date("2026-07-23T10:00:00.000Z");

    await prisma.comment.create({
      data: {
        ticketId: ticket.id,
        message: "First comment",
        createdBy: alice.id,
        createdAt: older,
        updatedAt: older,
      },
    });

    await prisma.comment.create({
      data: {
        ticketId: ticket.id,
        message: "Second comment",
        createdBy: bob.id,
        createdAt: newer,
        updatedAt: newer,
      },
    });

    const response = await request(app).get(`/api/tickets/${ticket.id}/comments`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      message: "First comment",
      createdBy: { id: alice.id, name: alice.name },
    });
    expect(response.body[1]).toMatchObject({
      message: "Second comment",
      createdBy: { id: bob.id, name: bob.name },
    });
    expect(new Date(response.body[0].createdAt).getTime()).toBeLessThan(
      new Date(response.body[1].createdAt).getTime()
    );
  });

  it("returns an empty array when the ticket has no comments", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app).get(`/api/tickets/${ticket.id}/comments`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("includes a newly added comment on subsequent list fetch", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const createResponse = await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set("X-User-Id", user.id)
      .send({ message: "Follow-up note." });

    const listResponse = await request(app).get(
      `/api/tickets/${ticket.id}/comments`
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual([
      expect.objectContaining({
        id: createResponse.body.id,
        message: "Follow-up note.",
        createdBy: { id: user.id, name: user.name },
      }),
    ]);
  });

  it("returns 404 when the ticket does not exist", async () => {
    const response = await request(app).get(
      "/api/tickets/00000000-0000-4000-8000-000000000000/comments"
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });

  it("returns 404 for a malformed ticket id", async () => {
    const response = await request(app).get("/api/tickets/not-a-uuid/comments");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });
});

describe("GET /api/tickets/:id", () => {
  it("does not include comments in the ticket detail response", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set("X-User-Id", user.id)
      .send({ message: "Should not appear on ticket detail." });

    const response = await request(app).get(`/api/tickets/${ticket.id}`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toBeUndefined();
  });
});
