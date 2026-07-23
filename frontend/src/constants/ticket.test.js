import { describe, it, expect } from "vitest";
import {
  DEFAULT_USER_EMAIL,
  getNextStatuses,
  isStatusOptionEnabled,
} from "./ticket.js";

describe("DEFAULT_USER_EMAIL", () => {
  it("matches the backend seeded default user email", () => {
    expect(DEFAULT_USER_EMAIL).toBe("alice.johnson@example.com");
  });
});

describe("getNextStatuses", () => {
  it("returns allowed next statuses for each workflow state", () => {
    expect(getNextStatuses("Open")).toEqual(["In Progress", "Cancelled"]);
    expect(getNextStatuses("In Progress")).toEqual(["Resolved", "Cancelled"]);
    expect(getNextStatuses("Resolved")).toEqual(["Closed"]);
  });

  it("returns an empty array for terminal states", () => {
    expect(getNextStatuses("Closed")).toEqual([]);
    expect(getNextStatuses("Cancelled")).toEqual([]);
  });

  it("returns an empty array for unknown statuses", () => {
    expect(getNextStatuses("Unknown")).toEqual([]);
  });
});

describe("isStatusOptionEnabled", () => {
  it("enables the current status and valid next statuses only", () => {
    expect(isStatusOptionEnabled("Open", "Open")).toBe(true);
    expect(isStatusOptionEnabled("Open", "In Progress")).toBe(true);
    expect(isStatusOptionEnabled("Open", "Cancelled")).toBe(true);
    expect(isStatusOptionEnabled("Open", "Closed")).toBe(false);
    expect(isStatusOptionEnabled("Open", "Resolved")).toBe(false);
  });

  it("only enables the current status for terminal states", () => {
    expect(isStatusOptionEnabled("Closed", "Closed")).toBe(true);
    expect(isStatusOptionEnabled("Closed", "Open")).toBe(false);
    expect(isStatusOptionEnabled("Cancelled", "In Progress")).toBe(false);
  });
});
