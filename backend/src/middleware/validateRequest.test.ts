import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { validateJsonBody } from "./validateRequest.js";
import { ValidationError } from "../errors/AppError.js";

function createMocks(body: unknown, method = "POST") {
  const req = { method, body } as Request;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("validateJsonBody", () => {
  it("allows GET, HEAD, and DELETE without a body", () => {
    for (const method of ["GET", "HEAD", "DELETE"]) {
      const { req, res, next } = createMocks(undefined, method);
      validateJsonBody(req, res, next);
      expect(next).toHaveBeenCalledWith();
    }
  });

  it("rejects missing body on POST", () => {
    const { req, res, next } = createMocks(undefined, "POST");
    validateJsonBody(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ValidationError;
    expect(error.message).toBe("Request body is required");
    expect(error.details).toEqual([
      { field: "body", message: "Request body must be a JSON object" },
    ]);
  });

  it("rejects null body on POST", () => {
    const { req, res, next } = createMocks(null, "POST");
    validateJsonBody(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("rejects array bodies", () => {
    const { req, res, next } = createMocks([{ title: "x" }], "POST");
    validateJsonBody(req, res, next);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ValidationError;
    expect(error.message).toBe("Invalid request body");
    expect(error.details).toEqual([
      { field: "body", message: "Request body must be a JSON object" },
    ]);
  });

  it("rejects primitive bodies", () => {
    const { req, res, next } = createMocks("not-an-object", "PATCH");
    validateJsonBody(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("allows a plain JSON object body", () => {
    const { req, res, next } = createMocks({ title: "ok" }, "POST");
    validateJsonBody(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
