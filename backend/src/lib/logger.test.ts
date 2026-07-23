import { describe, it, expect, vi, afterEach } from "vitest";
import type { Request } from "express";
import { logUnexpectedError } from "./logger.js";

describe("logUnexpectedError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs Error instances with stack and request path", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    const req = {
      method: "POST",
      path: "/api/tickets",
      params: { id: "abc" },
      query: { search: "login" },
    } as unknown as Request;

    logUnexpectedError(err, req);

    const output = consoleError.mock.calls.flat().join(" ");
    expect(output).toContain("POST /api/tickets");
    expect(output).toContain('params={"id":"abc"}');
    expect(output).toContain('query={"search":"login"}');
    expect(output).toContain("boom");
    expect(output).toContain("at ");
  });

  it("logs unknown request context when req is omitted", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    logUnexpectedError(new Error("no request"));

    const output = consoleError.mock.calls.flat().join(" ");
    expect(output).toContain("unknown request");
    expect(output).toContain("no request");
  });

  it("logs non-Error values without a stack", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const req = {
      method: "GET",
      path: "/api/health",
      params: {},
      query: {},
    } as unknown as Request;

    logUnexpectedError("string failure", req);

    expect(consoleError).toHaveBeenCalledWith(
      "Unhandled error [GET /api/health]:",
      "string failure"
    );
  });

  it("logs Error without stack when stack is missing", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("no stack");
    delete err.stack;

    logUnexpectedError(err);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0].join(" ")).toContain("no stack");
  });

  it("tolerates missing params and query on the request", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const req = {
      method: "GET",
      path: "/api/tickets",
      params: undefined,
      query: undefined,
    } as unknown as Request;

    logUnexpectedError(new Error("missing bags"), req);

    const output = consoleError.mock.calls.flat().join(" ");
    expect(output).toContain("GET /api/tickets");
    expect(output).not.toContain("params=");
    expect(output).not.toContain("query=");
  });
});
