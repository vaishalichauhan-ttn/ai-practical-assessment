import { describe, it, expect } from "vitest";
import { getAllowedNextStatuses } from "./statusTransitions.js";

describe("getAllowedNextStatuses", () => {
  it("returns valid next statuses for each non-terminal state", () => {
    expect(getAllowedNextStatuses("Open")).toEqual(["In Progress", "Cancelled"]);
    expect(getAllowedNextStatuses("In Progress")).toEqual([
      "Resolved",
      "Cancelled",
    ]);
    expect(getAllowedNextStatuses("Resolved")).toEqual(["Closed"]);
  });

  it("returns empty arrays for terminal states", () => {
    expect(getAllowedNextStatuses("Closed")).toEqual([]);
    expect(getAllowedNextStatuses("Cancelled")).toEqual([]);
  });
});
