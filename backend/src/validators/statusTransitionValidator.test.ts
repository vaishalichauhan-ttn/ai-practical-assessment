import { describe, it, expect } from "vitest";
import { validateStatusTransition } from "./statusTransitionValidator.js";

describe("validateStatusTransition", () => {
  it.each([
    ["Open", "In Progress"],
    ["In Progress", "Resolved"],
    ["Resolved", "Closed"],
    ["Open", "Cancelled"],
    ["In Progress", "Cancelled"],
  ] as const)("allows %s → %s", (from, to) => {
    const result = validateStatusTransition(from, to);
    expect(result).toEqual({ valid: true });
  });

  it.each([
    ["Open", "Closed"],
    ["Open", "Resolved"],
    ["In Progress", "Open"],
    ["Resolved", "Open"],
    ["Resolved", "In Progress"],
    ["Resolved", "Cancelled"],
  ] as const)("rejects %s → %s", (from, to) => {
    const result = validateStatusTransition(from, to);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe(`Cannot transition from ${from} to ${to}`);
  });

  it("rejects any status change from Closed", () => {
    const result = validateStatusTransition("Closed", "Open");
    expect(result).toEqual({
      valid: false,
      reason: "Status change not allowed for Closed tickets",
    });
  });

  it("rejects any status change from Cancelled", () => {
    const result = validateStatusTransition("Cancelled", "In Progress");
    expect(result).toEqual({
      valid: false,
      reason: "Status change not allowed for Cancelled tickets",
    });
  });

  it("rejects transitioning to the same status", () => {
    const result = validateStatusTransition("Open", "Open");
    expect(result).toEqual({
      valid: false,
      reason: "Cannot transition from Open to Open",
    });
  });
});
