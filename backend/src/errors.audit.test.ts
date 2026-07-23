import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createTestTicket,
  getSeededUser,
} from "./test/ticketTestHelpers.js";
import { expectErrorShape } from "./test/errorShape.js";

const app = createApp();

describe("Task 7.1 — error response shape audit", () => {
  describe("404 Not Found", () => {
    it("returns a consistent shape for unknown routes", async () => {
      const response = await request(app).get("/api/unknown-route");

      expect(response.status).toBe(404);
      expectErrorShape(response.body);
      expect(response.body).toEqual({ error: "Route not found" });
    });

    it("returns a consistent shape for missing tickets", async () => {
      const response = await request(app).get(
        "/api/tickets/00000000-0000-4000-8000-000000000000"
      );

      expect(response.status).toBe(404);
      expectErrorShape(response.body);
      expect(response.body).toEqual({ error: "Ticket not found" });
    });

    it("returns a consistent shape for malformed ticket ids", async () => {
      const response = await request(app).get("/api/tickets/not-a-uuid");

      expect(response.status).toBe(404);
      expectErrorShape(response.body);
      expect(response.body).toEqual({ error: "Ticket not found" });
    });
  });

  describe("400 Bad Request — validation", () => {
    it("returns field details for ticket creation validation failures", async () => {
      const response = await request(app).post("/api/tickets").send({
        title: "Missing fields",
      });

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "description" }),
          expect.objectContaining({ field: "priority" }),
        ])
      );
    });

    it("returns field details for ticket update validation failures", async () => {
      const user = await getSeededUser();
      const ticket = await createTestTicket({ createdBy: user.id });

      const response = await request(app)
        .patch(`/api/tickets/${ticket.id}`)
        .send({});

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body).toEqual({
        error: "Validation failed",
        details: [
          { field: "body", message: "At least one field must be provided" },
        ],
      });
    });

    it("returns field details for status transition failures", async () => {
      const user = await getSeededUser();
      const ticket = await createTestTicket({
        status: "Open",
        createdBy: user.id,
      });

      const response = await request(app)
        .patch(`/api/tickets/${ticket.id}`)
        .send({ status: "Closed" });

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body.error).toBe("Cannot transition from Open to Closed");
      expect(response.body.details).toEqual([
        {
          field: "status",
          message: "Cannot transition from Open to Closed",
        },
      ]);
    });

    it("returns field details for comment validation failures", async () => {
      const user = await getSeededUser();
      const ticket = await createTestTicket({ createdBy: user.id });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .send({ message: "   " });

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body).toEqual({
        error: "Validation failed",
        details: [{ field: "message", message: "message is required" }],
      });
    });

    it("returns field details for invalid list query parameters", async () => {
      const response = await request(app).get("/api/tickets?status=Invalid");

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body).toEqual({
        error: "Validation failed",
        details: [{ field: "status", message: "Invalid status value" }],
      });
    });

    it("returns field details for invalid X-User-Id header", async () => {
      const response = await request(app)
        .post("/api/tickets")
        .set("X-User-Id", "not-a-uuid")
        .send({
          title: "Invalid user header",
          description: "Header value is not a UUID.",
          priority: "Low",
        });

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body).toEqual({
        error: "Validation failed",
        details: [{ field: "X-User-Id", message: "Invalid user ID format" }],
      });
    });
  });

  describe("400 Bad Request — malformed JSON", () => {
    it("returns a consistent shape for POST /api/tickets", async () => {
      const response = await request(app)
        .post("/api/tickets")
        .set("Content-Type", "application/json")
        .send("{ invalid json");

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body.error).toBe("Invalid JSON payload");
      expect(response.body.details).toEqual([
        { field: "body", message: "Request body must be valid JSON" },
      ]);
    });

    it("returns a consistent shape for PATCH /api/tickets/:id", async () => {
      const response = await request(app)
        .patch("/api/tickets/00000000-0000-4000-8000-000000000000")
        .set("Content-Type", "application/json")
        .send("{ invalid json");

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body.error).toBe("Invalid JSON payload");
      expect(response.body.details).toEqual([
        { field: "body", message: "Request body must be valid JSON" },
      ]);
    });

    it("returns a consistent shape for POST /api/tickets/:id/comments", async () => {
      const response = await request(app)
        .post("/api/tickets/00000000-0000-4000-8000-000000000000/comments")
        .set("Content-Type", "application/json")
        .send("{ invalid json");

      expect(response.status).toBe(400);
      expectErrorShape(response.body);
      expect(response.body.error).toBe("Invalid JSON payload");
      expect(response.body.details).toEqual([
        { field: "body", message: "Request body must be valid JSON" },
      ]);
    });
  });
});
