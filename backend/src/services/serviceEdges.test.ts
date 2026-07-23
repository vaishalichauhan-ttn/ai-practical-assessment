import { describe, it, expect, vi, beforeEach } from "vitest";
import { ticketService } from "./ticketService.js";
import { commentService } from "./commentService.js";
import { userRepository } from "../repositories/userRepository.js";
import { ticketRepository } from "../repositories/ticketRepository.js";
import { ValidationError } from "../errors/AppError.js";
import * as statusTransitionValidator from "../validators/statusTransitionValidator.js";

describe("service creator validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("ticketService.create rejects an unknown createdBy user", async () => {
    vi.spyOn(userRepository, "findById").mockResolvedValueOnce(null);

    await expect(
      ticketService.create(
        {
          title: "Title",
          description: "Description",
          priority: "Low",
        },
        "00000000-0000-4000-8000-000000000000"
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("ticketService.create accepts a valid assignedTo on create", async () => {
    const creator = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Alice",
      email: "alice@example.com",
      role: "Agent",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const assignee = {
      ...creator,
      id: "00000000-0000-4000-8000-000000000002",
      name: "Bob",
      email: "bob@example.com",
    };

    vi.spyOn(userRepository, "findById")
      .mockResolvedValueOnce(creator as never)
      .mockResolvedValueOnce(assignee as never);

    vi.spyOn(ticketRepository, "create").mockResolvedValueOnce({
      id: "ticket-1",
      title: "Assigned create",
      description: "Has assignee",
      priority: "High",
      status: "Open",
      createdBy: creator.id,
      assignedTo: assignee.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: { id: creator.id, name: creator.name },
      assignee: { id: assignee.id, name: assignee.name },
    } as never);

    const result = await ticketService.create(
      {
        title: "Assigned create",
        description: "Has assignee",
        priority: "High",
        assignedTo: assignee.id,
      },
      creator.id
    );

    expect(result.assignedTo).toEqual({
      id: assignee.id,
      name: assignee.name,
    });
    expect(ticketRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ assignedTo: assignee.id })
    );
  });

  it("ticketService.update uses a fallback message when transition reason is missing", async () => {
    const ticketId = "00000000-0000-4000-8000-000000000099";

    vi.spyOn(ticketRepository, "findStatusById").mockResolvedValueOnce("Open");
    vi.spyOn(
      statusTransitionValidator,
      "validateStatusTransition"
    ).mockReturnValueOnce({ valid: false });

    await expect(
      ticketService.update(ticketId, { status: "Closed" }, { status: "Closed" })
    ).rejects.toMatchObject({
      message: "Invalid status transition",
      details: [{ field: "status", message: "Invalid status transition" }],
    });
  });

  it("commentService.create rejects an unknown createdBy user", async () => {
    const ticketId = "00000000-0000-4000-8000-000000000010";

    vi.spyOn(ticketRepository, "existsById").mockResolvedValueOnce(true);
    vi.spyOn(userRepository, "findById").mockResolvedValueOnce(null);

    await expect(
      commentService.create(
        ticketId,
        { message: "Hello" },
        "00000000-0000-4000-8000-000000000000"
      )
    ).rejects.toMatchObject({
      details: [{ field: "createdBy", message: "Invalid user context" }],
    });
  });
});
