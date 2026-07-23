import { describe, it, expect } from "vitest";
import { formatDate } from "./formatDate.js";

describe("formatDate", () => {
  it("formats an ISO date string as a locale string", () => {
    const value = "2026-01-15T10:30:00.000Z";
    const expected = new Date(value).toLocaleString();

    expect(formatDate(value)).toBe(expected);
  });
});
