import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApiError,
  NetworkError,
  ERROR_MESSAGES,
  getErrorMessage,
  apiRequest,
} from "./client.js";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws NetworkError when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiRequest("/api/tickets")).rejects.toBeInstanceOf(NetworkError);
    await expect(apiRequest("/api/tickets")).rejects.toThrow(ERROR_MESSAGES.NETWORK);
  });

  it("normalizes 500 responses to a generic server error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({
        error: "Internal server error",
        stack: "Error: secret\n    at handler",
      }),
    });

    await expect(apiRequest("/api/tickets")).rejects.toMatchObject({
      status: 500,
      message: ERROR_MESSAGES.SERVER,
      details: [],
    });
  });

  it("preserves field-level validation details for 400 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({
        error: "Validation failed",
        details: [{ field: "title", message: "title is required" }],
      }),
    });

    await expect(apiRequest("/api/tickets", { method: "POST" })).rejects.toEqual(
      expect.objectContaining({
        status: 400,
        message: "Validation failed",
        details: [{ field: "title", message: "title is required" }],
      })
    );
  });

  it("returns parsed JSON for successful responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: () => "application/json",
      },
      json: async () => [{ id: "ticket-1" }],
    });

    await expect(apiRequest("/api/tickets")).resolves.toEqual([{ id: "ticket-1" }]);
  });

  it("maps network and server errors through getErrorMessage", () => {
    expect(getErrorMessage(new NetworkError())).toBe(ERROR_MESSAGES.NETWORK);
    expect(getErrorMessage(new ApiError(500, "Internal server error"))).toBe(
      ERROR_MESSAGES.SERVER
    );
    expect(
      getErrorMessage(
        new ApiError(503, "Database connection unavailable")
      )
    ).toBe("Database connection unavailable");
    expect(getErrorMessage(new ApiError(404, "Ticket not found"))).toBe(
      "Ticket not found"
    );
    expect(getErrorMessage(new Error("boom"), "Fallback message")).toBe(
      "Fallback message"
    );
  });

  it("preserves 503 health check messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({
        status: "error",
        error: "Database connection unavailable",
      }),
    });

    await expect(apiRequest("/api/health")).rejects.toMatchObject({
      status: 503,
      message: "Database connection unavailable",
    });
  });

  it("handles non-JSON error responses with a generic server message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: () => "text/plain",
      },
      json: async () => {
        throw new Error("Unexpected token");
      },
    });

    await expect(apiRequest("/api/tickets")).rejects.toMatchObject({
      status: 500,
      message: ERROR_MESSAGES.SERVER,
      details: [],
    });
  });
});
