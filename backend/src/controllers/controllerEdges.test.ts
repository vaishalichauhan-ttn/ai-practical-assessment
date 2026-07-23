import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import {
  createTicket,
  getTicket,
  updateTicket,
} from "./ticketController.js";
import {
  addComment,
  listComments,
} from "./commentController.js";
import { listUsers } from "./userController.js";
import { NotFoundError } from "../errors/AppError.js";
import { ticketService } from "../services/ticketService.js";
import { commentService } from "../services/commentService.js";
import { userService } from "../services/userService.js";

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

describe("controller defensive branches", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createTicket forwards missing request context as an error", async () => {
    const next = vi.fn() as NextFunction;
    const req = {
      body: { title: "t", description: "d", priority: "Low" },
      context: undefined,
    } as unknown as Request;

    await createTicket(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Request context is missing user ID",
      })
    );
  });

  it("getTicket rejects array ticket ids", async () => {
    const next = vi.fn() as NextFunction;
    const req = { params: { id: ["a", "b"] } } as unknown as Request;

    await getTicket(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it("updateTicket rejects array ticket ids", async () => {
    const next = vi.fn() as NextFunction;
    const req = {
      params: { id: ["a", "b"] },
      body: { title: "x" },
    } as unknown as Request;

    await updateTicket(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it("listComments rejects array ticket ids", async () => {
    const next = vi.fn() as NextFunction;
    const req = { params: { id: ["a", "b"] } } as unknown as Request;

    await listComments(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it("addComment rejects array ticket ids", async () => {
    const next = vi.fn() as NextFunction;
    const req = {
      params: { id: ["a", "b"] },
      body: { message: "hi" },
      context: { userId: "user-1" },
    } as unknown as Request;

    await addComment(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it("addComment forwards missing request context as an error", async () => {
    const next = vi.fn() as NextFunction;
    const req = {
      params: { id: "00000000-0000-4000-8000-000000000001" },
      body: { message: "hi" },
      context: undefined,
    } as unknown as Request;

    await addComment(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Request context is missing user ID",
      })
    );
  });

  it("listUsers forwards service failures", async () => {
    vi.spyOn(userService, "list").mockRejectedValueOnce(new Error("users down"));
    const next = vi.fn() as NextFunction;

    await listUsers({} as Request, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: "users down" })
    );
  });

  it("createTicket still calls the service when context is present", async () => {
    const ticket = { id: "t1" };
    vi.spyOn(ticketService, "create").mockResolvedValueOnce(ticket as never);
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;
    const req = {
      body: { title: "t", description: "d", priority: "Low" },
      context: { userId: "user-1" },
    } as unknown as Request;

    await createTicket(req, res, next);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(ticket);
    expect(next).not.toHaveBeenCalled();
  });

  it("addComment still calls the service when context is present", async () => {
    const comment = { id: "c1" };
    vi.spyOn(commentService, "create").mockResolvedValueOnce(comment as never);
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;
    const req = {
      params: { id: "00000000-0000-4000-8000-000000000001" },
      body: { message: "hi" },
      context: { userId: "user-1" },
    } as unknown as Request;

    await addComment(req, res, next);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(comment);
    expect(next).not.toHaveBeenCalled();
  });
});
