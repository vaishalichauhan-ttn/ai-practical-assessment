import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { errorHandler } from "./errorHandler.js";
import { expectErrorShape } from "../test/errorShape.js";

function createMockResponse() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as Response & { statusCode: number; body: unknown };
}

describe("errorHandler", () => {
  it("maps AppError instances to the global error shape", () => {
    const res = createMockResponse();
    const err = new AppError(400, "Validation failed", [
      { field: "title", message: "title is required" },
    ]);

    errorHandler(err, {} as Request, res, (() => {}) as NextFunction);

    expect(res.statusCode).toBe(400);
    expectErrorShape(res.body);
    expect(res.body).toEqual({
      error: "Validation failed",
      details: [{ field: "title", message: "title is required" }],
    });
  });

  it("maps malformed JSON errors to 400 with field details", () => {
    const res = createMockResponse();
    const err = new SyntaxError("Unexpected token");
    Object.assign(err, { body: "{ invalid" });

    errorHandler(err, {} as Request, res, (() => {}) as NextFunction);

    expect(res.statusCode).toBe(400);
    expectErrorShape(res.body);
    expect(res.body).toEqual({
      error: "Invalid JSON payload",
      details: [{ field: "body", message: "Request body must be valid JSON" }],
    });
  });

  it("maps unexpected errors to 500 without leaking internal details", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = createMockResponse();
    const req = {
      method: "GET",
      path: "/api/tickets",
      params: {},
      query: {},
    } as Request;
    const err = new Error("Database connection pool exhausted");

    errorHandler(err, req, res, (() => {}) as NextFunction);

    expect(res.statusCode).toBe(500);
    expectErrorShape(res.body);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(res.body)).not.toContain("stack");
    expect(JSON.stringify(res.body)).not.toContain("Database connection");

    const loggedOutput = consoleError.mock.calls.flat().join(" ");
    expect(loggedOutput).toContain("GET /api/tickets");
    expect(loggedOutput).toContain("Database connection pool exhausted");
    expect(loggedOutput).toContain("at ");

    consoleError.mockRestore();
  });

  it("maps AppError 500 instances to a generic client response", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = createMockResponse();
    const req = {
      method: "GET",
      path: "/api/app-error",
      params: {},
      query: {},
    } as Request;
    const err = new AppError(500, "Prisma query failed: relation does not exist");

    errorHandler(err, req, res, (() => {}) as NextFunction);

    expect(res.statusCode).toBe(500);
    expectErrorShape(res.body);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(res.body)).not.toContain("Prisma");

    consoleError.mockRestore();
  });
});
