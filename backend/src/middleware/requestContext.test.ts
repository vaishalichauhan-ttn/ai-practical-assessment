import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requestContext } from "./requestContext.js";
import { ValidationError } from "../errors/AppError.js";
import { userRepository } from "../repositories/userRepository.js";
import { getSeededUser } from "../test/ticketTestHelpers.js";

describe("requestContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an invalid X-User-Id format", async () => {
    const req = {
      header: vi.fn().mockReturnValue("not-a-uuid"),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await requestContext(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = (next as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as ValidationError;
    expect(error.details).toEqual([
      { field: "X-User-Id", message: "Invalid user ID format" },
    ]);
  });

  it("rejects an unknown X-User-Id", async () => {
    const req = {
      header: vi
        .fn()
        .mockReturnValue("00000000-0000-4000-8000-000000000000"),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await requestContext(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = (next as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as ValidationError;
    expect(error.details).toEqual([
      { field: "X-User-Id", message: "Invalid user ID" },
    ]);
  });

  it("accepts a valid X-User-Id and attaches context", async () => {
    const user = await getSeededUser();
    const req = {
      header: vi.fn().mockReturnValue(user.id),
      context: undefined,
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await requestContext(req, {} as Response, next);

    expect(req.context).toEqual({ userId: user.id });
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards unexpected repository errors", async () => {
    vi.spyOn(userRepository, "findByEmail").mockRejectedValueOnce(
      new Error("db down")
    );

    const req = {
      header: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await requestContext(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(((next as ReturnType<typeof vi.fn>).mock.calls[0][0] as Error).message).toBe(
      "db down"
    );
  });

  it("throws when the default seeded user is missing", async () => {
    vi.spyOn(userRepository, "findByEmail").mockResolvedValueOnce(null);

    const req = {
      header: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await requestContext(req, {} as Response, next);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as Error;
    expect(error.message).toMatch(/Default user not found/);
  });
});
