import { describe, it, expect } from "vitest";
import {
  validateCreateTicketInput,
  validateUpdateTicketInput,
  validateTitle,
  validateDescription,
} from "./ticketValidators.js";
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from "../constants/ticket.js";

describe("ticketValidators length limits", () => {
  it("rejects titles that exceed the max length", () => {
    expect(validateTitle("a".repeat(TITLE_MAX_LENGTH + 1), "title is required")).toEqual({
      field: "title",
      message: `title must be at most ${TITLE_MAX_LENGTH} characters`,
    });
  });

  it("rejects descriptions that exceed the max length", () => {
    expect(
      validateDescription(
        "a".repeat(DESCRIPTION_MAX_LENGTH + 1),
        "description is required"
      )
    ).toEqual({
      field: "description",
      message: `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    });
  });

  it("includes title length errors in create validation", () => {
    const details = validateCreateTicketInput({
      title: "a".repeat(TITLE_MAX_LENGTH + 1),
      description: "Valid description",
      priority: "Low",
    });

    expect(details).toEqual([
      {
        field: "title",
        message: `title must be at most ${TITLE_MAX_LENGTH} characters`,
      },
    ]);
  });

  it("includes description length errors in update validation", () => {
    const details = validateUpdateTicketInput(
      { description: "x" },
      {
        description: "a".repeat(DESCRIPTION_MAX_LENGTH + 1),
      }
    );

    expect(details).toEqual([
      {
        field: "description",
        message: `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
      },
    ]);
  });

  it("rejects null priority on update as invalid", () => {
    const details = validateUpdateTicketInput(
      { priority: null },
      { priority: undefined }
    );

    expect(details).toEqual([
      { field: "priority", message: "Invalid priority value" },
    ]);
  });
});
