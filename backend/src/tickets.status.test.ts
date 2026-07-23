import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import {
  createTestTicket,
  getSeededUser,
} from "./test/ticketTestHelpers.js";

const app = createApp();

describe("PATCH /api/tickets/:id status transitions", () => {
  it.each([
    ["Open", "InProgress", "In Progress"],
    ["InProgress", "Resolved", "Resolved"],
    ["Resolved", "Closed", "Closed"],
    ["Open", "Cancelled", "Cancelled"],
    ["InProgress", "Cancelled", "Cancelled"],
  ] as const)("allows %s → %s", async (fromStatus, prismaTarget, apiTarget) => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      status: fromStatus,
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ status: apiTarget });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(apiTarget);

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.status).toBe(prismaTarget);
    expect(persisted?.status).not.toBe(fromStatus);
  });

  it.each([
    ["Open", "Closed"],
    ["Open", "Resolved"],
    ["InProgress", "Open"],
    ["Resolved", "Open"],
    ["Resolved", "In Progress"],
    ["Resolved", "Cancelled"],
  ] as const)("rejects %s → %s with 400", async (fromStatus, toStatus) => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      status: fromStatus,
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ status: toStatus });

    expect(response.status).toBe(400);

    const apiFrom =
      fromStatus === "InProgress" ? "In Progress" : fromStatus;
    const message = `Cannot transition from ${apiFrom} to ${toStatus}`;
    expect(response.body.error).toBe(message);
    expect(response.body.details).toEqual([
      { field: "status", message },
    ]);

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.status).toBe(fromStatus);
  });

  it("rejects status change on Closed tickets", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      status: "Closed",
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ status: "Open" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Status change not allowed for Closed tickets"
    );
    expect(response.body.details).toEqual([
      {
        field: "status",
        message: "Status change not allowed for Closed tickets",
      },
    ]);

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.status).toBe("Closed");
  });

  it("rejects status change on Cancelled tickets", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      status: "Cancelled",
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ status: "In Progress" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Status change not allowed for Cancelled tickets"
    );
    expect(response.body.details).toEqual([
      {
        field: "status",
        message: "Status change not allowed for Cancelled tickets",
      },
    ]);

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.status).toBe("Cancelled");
  });

  it("returns 400 for invalid status value", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({ createdBy: user.id });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({ status: "InvalidStatus" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      details: [{ field: "status", message: "Invalid status value" }],
    });
  });

  it("returns 404 when changing status on a missing ticket", async () => {
    const response = await request(app)
      .patch("/api/tickets/00000000-0000-4000-8000-000000000000")
      .send({ status: "In Progress" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found" });
  });

  it("updates status and other fields in a single PATCH", async () => {
    const user = await getSeededUser();
    const ticket = await createTestTicket({
      title: "Original title",
      description: "Original description",
      priority: "Low",
      status: "Open",
      createdBy: user.id,
    });

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .send({
        status: "In Progress",
        title: "Updated title",
        priority: "High",
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticket.id,
      status: "In Progress",
      title: "Updated title",
      priority: "High",
      description: "Original description",
    });

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.status).toBe("InProgress");
    expect(persisted?.title).toBe("Updated title");
    expect(persisted?.priority).toBe("High");
  });

  it("rejects status change with other fields on Closed tickets without persisting changes", async () => {
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
        status: "Open",
        title: "Updated closed title",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Status change not allowed for Closed tickets"
    );
    expect(response.body.details).toEqual([
      {
        field: "status",
        message: "Status change not allowed for Closed tickets",
      },
    ]);

    const persisted = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    expect(persisted?.title).toBe("Closed ticket");
    expect(persisted?.status).toBe("Closed");
  });
});
